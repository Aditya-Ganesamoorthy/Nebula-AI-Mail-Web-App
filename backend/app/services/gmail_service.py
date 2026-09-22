import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, List, Optional
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.core.config import settings
from app.core.logging import logger
from app.services.session_service import session_service
from app.services.oauth_service import oauth_service
from app.services.gmail_parser import parse_gmail_message
from app.schemas.mail import SendEmailRequest, ReplyEmailRequest

class GmailService:
    def _get_credentials_for_session(self, session_id: str) -> Credentials:
        """
        Build Google Credentials object from session tokens.
        Automatically handles token refresh if necessary.
        """
        session = session_service.get_session(session_id)
        if not session:
            # Fall back to active account
            session = session_service.get_active_account()
            if not session:
                raise ValueError("GMAIL_AUTH_REQUIRED: No active Gmail session found. Please connect your account.")

        access_token = session.get("access_token")
        refresh_token = session.get("refresh_token")

        creds = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
        )
        return creds

    def _get_service(self, session_id: Optional[str] = None):
        """Build Gmail API service instance."""
        creds = self._get_credentials_for_session(session_id or "")
        return build("gmail", "v1", credentials=creds, cache_discovery=False)

    async def get_profile(self, session_id: Optional[str] = None) -> Dict[str, Any]:
        """Fetch user Gmail mailbox profile (email, messagesTotal, historyId)."""
        service = self._get_service(session_id)
        profile = service.users().getProfile(userId="me").execute()
        return {
            "email_address": profile.get("emailAddress"),
            "messages_total": profile.get("messagesTotal"),
            "threads_total": profile.get("threadsTotal"),
            "history_id": profile.get("historyId"),
        }

    async def list_messages(
        self,
        session_id: Optional[str] = None,
        label_ids: Optional[List[str]] = None,
        query: Optional[str] = None,
        page_token: Optional[str] = None,
        max_results: int = 25
    ) -> Dict[str, Any]:
        """
        List messages with pagination and query filtering.
        Fetches metadata for each returned message ID.
        """
        service = self._get_service(session_id)
        params = {
            "userId": "me",
            "maxResults": min(max_results, 50),
        }
        if label_ids:
            params["labelIds"] = label_ids
        if query:
            params["q"] = query
        if page_token:
            params["pageToken"] = page_token

        response = service.users().messages().list(**params).execute()
        raw_messages = response.get("messages", [])
        next_page_token = response.get("nextPageToken")
        result_size_estimate = response.get("resultSizeEstimate", 0)

        # Batch fetch message summaries
        parsed_messages = []
        for item in raw_messages:
            try:
                # Use format='full' or 'metadata' with headers
                msg = service.users().messages().get(
                    userId="me",
                    id=item["id"],
                    format="full"
                ).execute()
                parsed = parse_gmail_message(msg)
                parsed_messages.append(parsed)
            except Exception as e:
                logger.warning(f"Failed to fetch message {item.get('id')}: {str(e)}")

        return {
            "messages": parsed_messages,
            "next_page_token": next_page_token,
            "result_size_estimate": result_size_estimate
        }

    async def list_inbox(
        self,
        session_id: Optional[str] = None,
        query: Optional[str] = None,
        page_token: Optional[str] = None,
        max_results: int = 25
    ) -> Dict[str, Any]:
        """Fetch messages from the INBOX folder."""
        return await self.list_messages(
            session_id=session_id,
            label_ids=["INBOX"],
            query=query,
            page_token=page_token,
            max_results=max_results
        )

    async def list_sent(
        self,
        session_id: Optional[str] = None,
        query: Optional[str] = None,
        page_token: Optional[str] = None,
        max_results: int = 25
    ) -> Dict[str, Any]:
        """Fetch messages from the SENT folder."""
        return await self.list_messages(
            session_id=session_id,
            label_ids=["SENT"],
            query=query,
            page_token=page_token,
            max_results=max_results
        )

    async def get_message_detail(self, message_id: str, session_id: Optional[str] = None) -> Dict[str, Any]:
        """Fetch full parsed email details for an individual message."""
        service = self._get_service(session_id)
        msg = service.users().messages().get(userId="me", id=message_id, format="full").execute()
        return parse_gmail_message(msg)

    async def get_thread(self, thread_id: str, session_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetch chronological message list for a Gmail thread."""
        service = self._get_service(session_id)
        thread = service.users().threads().get(userId="me", id=thread_id, format="full").execute()
        messages = thread.get("messages", [])
        return [parse_gmail_message(m) for m in messages]

    async def send_message(self, send_req: SendEmailRequest, session_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Construct RFC 5322 MIME message and dispatch via Gmail API messages.send.
        """
        service = self._get_service(session_id)

        # Build MIME message
        message = MIMEMultipart("alternative")
        message["to"] = send_req.to
        message["subject"] = send_req.subject or "(No Subject)"

        if send_req.cc:
            message["cc"] = send_req.cc
        if send_req.bcc:
            message["bcc"] = send_req.bcc
        if send_req.in_reply_to:
            message["In-Reply-To"] = send_req.in_reply_to
        if send_req.references:
            message["References"] = send_req.references

        # Attach plain text
        part_plain = MIMEText(send_req.body, "plain", "utf-8")
        message.attach(part_plain)

        # Base64url encode the raw MIME bytes
        raw_bytes = message.as_bytes()
        encoded_message = base64.urlsafe_b64encode(raw_bytes).decode("ascii")

        body_payload = {"raw": encoded_message}
        if send_req.thread_id:
            body_payload["threadId"] = send_req.thread_id

        sent_message = service.users().messages().send(userId="me", body=body_payload).execute()
        logger.info(f"Email sent successfully. Message ID: {sent_message.get('id')}")
        return {
            "id": sent_message.get("id"),
            "thread_id": sent_message.get("threadId"),
            "label_ids": sent_message.get("labelIds", []),
        }

    async def create_reply(self, reply_req: ReplyEmailRequest, session_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Formulate and send a reply message preserving sender and thread continuity.
        """
        original = await self.get_message_detail(reply_req.message_id, session_id)
        recipient = original["from"]["email"] or original["from"]["raw"]
        
        # Subject prefix
        orig_subject = original.get("subject", "")
        reply_subject = orig_subject if orig_subject.lower().startswith("re:") else f"Re: {orig_subject}"

        message_id_hdr = original.get("headers", {}).get("message_id", "")
        existing_refs = original.get("headers", {}).get("references", "")
        new_refs = f"{existing_refs} {message_id_hdr}".strip() if existing_refs else message_id_hdr

        send_req = SendEmailRequest(
            to=recipient,
            subject=reply_subject,
            body=reply_req.body,
            thread_id=original.get("thread_id"),
            in_reply_to=message_id_hdr,
            references=new_refs
        )
        return await self.send_message(send_req, session_id)

    async def mark_as_read(
        self,
        message_ids: List[str],
        unread: bool = False,
        session_id: Optional[str] = None
    ) -> bool:
        """Mark messages as read or unread via modify endpoint."""
        service = self._get_service(session_id)
        body = {
            "ids": message_ids,
            "removeLabelIds": ["UNREAD"] if not unread else [],
            "addLabelIds": ["UNREAD"] if unread else []
        }
        service.users().messages().batchModify(userId="me", body=body).execute()
        return True

    async def setup_watch(self, topic_name: str, session_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Register Cloud Pub/Sub topic with Gmail users.watch for real-time notifications.
        """
        service = self._get_service(session_id)
        body = {
            "topicName": topic_name,
            "labelIds": ["INBOX"]
        }
        result = service.users().watch(userId="me", body=body).execute()
        logger.info(f"Gmail watch registered: historyId={result.get('historyId')}, expiration={result.get('expiration')}")
        return result

    async def stop_watch(self, session_id: Optional[str] = None) -> bool:
        """Stop Gmail push notifications."""
        service = self._get_service(session_id)
        service.users().stop(userId="me").execute()
        return True

    async def list_history(
        self,
        start_history_id: str,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Query history records since start_history_id to resolve delta changes.
        """
        service = self._get_service(session_id)
        result = service.users().history().list(
            userId="me",
            startHistoryId=start_history_id,
            historyTypes=["messageAdded", "labelAdded", "labelRemoved"]
        ).execute()
        return result

gmail_service = GmailService()

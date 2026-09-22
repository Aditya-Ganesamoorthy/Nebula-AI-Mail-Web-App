import base64
import json
import logging
import time
from typing import Dict, Any, Optional, List
from googleapiclient.errors import HttpError

from app.core.config import settings
from app.models.sync_state import get_sync_state, upsert_sync_state
from app.services.websocket_manager import ws_manager

logger = logging.getLogger("nebula.sync")

class SyncService:
    @staticmethod
    def decode_pubsub_message(payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Decode a Google Cloud Pub/Sub push notification payload.
        Pub/Sub wraps data in base64: payload['message']['data'].
        Returns dict like: {"emailAddress": "user@gmail.com", "historyId": "12345"}
        """
        try:
            message = payload.get("message", {})
            data_b64 = message.get("data")
            if not data_b64:
                logger.warning("Pub/Sub message received without data field.")
                return None
            
            decoded_bytes = base64.b64decode(data_b64)
            data_str = decoded_bytes.decode("utf-8")
            data_json = json.loads(data_str)
            return data_json
        except Exception as e:
            logger.error(f"Failed to decode Pub/Sub payload: {e}")
            return None

    @staticmethod
    async def process_notification(data: Dict[str, Any], gmail_service=None) -> Dict[str, Any]:
        """
        Process a decoded Pub/Sub notification:
        1. Parse emailAddress and new historyId
        2. Query Gmail history delta if service available
        3. Save new historyId in SQLite sync_state
        4. Broadcast real-time update to WebSocket clients
        """
        email_address = data.get("emailAddress")
        new_history_id = str(data.get("historyId", ""))

        if not email_address or not new_history_id:
            logger.warning(f"Incomplete notification data: {data}")
            return {"status": "ignored", "reason": "missing_email_or_history_id"}

        state = get_sync_state(email_address)
        last_history_id = state.get("history_id") if state else None

        delta_info = {
            "emailAddress": email_address,
            "newHistoryId": new_history_id,
            "previousHistoryId": last_history_id,
            "messagesAdded": [],
            "messagesDeleted": [],
            "fullSyncRequired": False
        }

        # If a live Gmail service client is supplied, fetch granular history deltas
        if gmail_service and last_history_id:
            try:
                history_resp = gmail_service.users().history().list(
                    userId="me",
                    startHistoryId=last_history_id,
                    historyTypes=["messageAdded", "messageDeleted", "labelAdded", "labelRemoved"]
                ).execute()

                histories = history_resp.get("history", [])
                for h in histories:
                    for added in h.get("messagesAdded", []):
                        msg = added.get("message", {})
                        if msg.get("id"):
                            delta_info["messagesAdded"].append(msg["id"])
                    for deleted in h.get("messagesDeleted", []):
                        msg = deleted.get("message", {})
                        if msg.get("id"):
                            delta_info["messagesDeleted"].append(msg["id"])

            except HttpError as e:
                # 404 or historyId out of date: full sync fallback
                logger.warning(f"History list failed ({e.status_code}), requiring full sync.")
                delta_info["fullSyncRequired"] = True
            except Exception as e:
                logger.error(f"Error querying Gmail history: {e}")
                delta_info["fullSyncRequired"] = True

        # Persist updated historyId in SQLite
        upsert_sync_state(email_address, history_id=new_history_id)

        # Broadcast real-time event to connected clients for this user
        ws_event = {
            "type": "INBOX_UPDATED",
            "timestamp": int(time.time()),
            "data": delta_info
        }
        await ws_manager.broadcast_to_user(email_address, ws_event)
        logger.info(f"Broadcasted INBOX_UPDATED to {email_address} with new historyId {new_history_id}")

        return {"status": "processed", "delta": delta_info}

    @staticmethod
    def register_watch(gmail_service, user_email: str, topic_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Register a Gmail push notification watch with Google Cloud Pub/Sub.
        Google will push notifications to topic_name whenever messages change.
        """
        target_topic = topic_name or settings.PUBSUB_TOPIC
        if not target_topic:
            raise ValueError("Pub/Sub topic name is not configured in settings.PUBSUB_TOPIC")

        watch_request = {
            "topicName": target_topic,
            "labelIds": ["INBOX"]
        }

        try:
            watch_resp = gmail_service.users().watch(userId="me", body=watch_request).execute()
            # Returns {'historyId': '12345', 'expiration': '1712345678000'}
            expiration = int(watch_resp.get("expiration", 0))
            history_id = str(watch_resp.get("historyId", ""))

            upsert_sync_state(user_email, history_id=history_id, watch_expiration=expiration)
            logger.info(f"Registered Gmail watch for {user_email}, expires at {expiration}")
            return {
                "success": True,
                "historyId": history_id,
                "expiration": expiration
            }
        except HttpError as e:
            logger.error(f"Failed to register Gmail watch: {e}")
            raise

    @staticmethod
    def stop_watch(gmail_service, user_email: str) -> bool:
        """Stop Gmail push notifications for a user."""
        try:
            gmail_service.users().stop(userId="me").execute()
            upsert_sync_state(user_email, watch_expiration=0)
            logger.info(f"Stopped Gmail watch for {user_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to stop Gmail watch: {e}")
            return False

sync_service = SyncService()

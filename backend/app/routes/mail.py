from fastapi import APIRouter, Request, Query, HTTPException, status
from typing import Optional, List, Dict, Any

from app.core.logging import logger
from app.services.gmail_service import gmail_service
from app.services.session_service import session_service
from app.schemas.mail import (
    SendEmailRequest,
    ReplyEmailRequest,
    MarkReadRequest,
    EmailSummary,
    EmailDetail
)

router = APIRouter(prefix="/api/mail", tags=["Mail"])

def _get_session_id(request: Request, session_id: Optional[str] = None) -> Optional[str]:
    """Helper to extract session_id from query, header, or cookie."""
    if session_id:
        return session_id
    auth_hdr = request.headers.get("Authorization")
    if auth_hdr and auth_hdr.startswith("Bearer "):
        return auth_hdr.split(" ")[1]
    return request.cookies.get("nebula_mail_session")

@router.get("/inbox")
async def get_inbox(
    request: Request,
    q: Optional[str] = Query(None, description="Optional search query"),
    page_token: Optional[str] = Query(None, description="Pagination token"),
    max_results: int = Query(25, ge=1, le=50),
    session_id: Optional[str] = Query(None)
):
    """Fetch messages from the Inbox."""
    sid = _get_session_id(request, session_id)
    try:
        data = await gmail_service.list_inbox(
            session_id=sid,
            query=q,
            page_token=page_token,
            max_results=max_results
        )
        return {
            "success": True,
            "data": data,
            "error": None
        }
    except ValueError as ve:
        logger.warning(f"Auth error fetching inbox: {str(ve)}")
        return {
            "success": False,
            "data": None,
            "error": {"code": "GMAIL_AUTH_REQUIRED", "message": str(ve)}
        }
    except Exception as e:
        logger.error(f"Error fetching inbox: {str(e)}", exc_info=True)
        return {
            "success": False,
            "data": None,
            "error": {"code": "GMAIL_API_ERROR", "message": "Unable to retrieve inbox messages."}
        }

@router.get("/sent")
async def get_sent(
    request: Request,
    q: Optional[str] = Query(None, description="Optional search query"),
    page_token: Optional[str] = Query(None, description="Pagination token"),
    max_results: int = Query(25, ge=1, le=50),
    session_id: Optional[str] = Query(None)
):
    """Fetch messages from the Sent mailbox."""
    sid = _get_session_id(request, session_id)
    try:
        data = await gmail_service.list_sent(
            session_id=sid,
            query=q,
            page_token=page_token,
            max_results=max_results
        )
        return {
            "success": True,
            "data": data,
            "error": None
        }
    except ValueError as ve:
        logger.warning(f"Auth error fetching sent mail: {str(ve)}")
        return {
            "success": False,
            "data": None,
            "error": {"code": "GMAIL_AUTH_REQUIRED", "message": str(ve)}
        }
    except Exception as e:
        logger.error(f"Error fetching sent mail: {str(e)}", exc_info=True)
        return {
            "success": False,
            "data": None,
            "error": {"code": "GMAIL_API_ERROR", "message": "Unable to retrieve sent messages."}
        }

@router.get("/{message_id}")
async def get_message(
    message_id: str,
    request: Request,
    session_id: Optional[str] = Query(None)
):
    """Fetch complete details for a single email message."""
    sid = _get_session_id(request, session_id)
    try:
        data = await gmail_service.get_message_detail(message_id, session_id=sid)
        return {
            "success": True,
            "data": data,
            "error": None
        }
    except ValueError as ve:
        return {
            "success": False,
            "data": None,
            "error": {"code": "GMAIL_AUTH_REQUIRED", "message": str(ve)}
        }
    except Exception as e:
        logger.error(f"Error fetching email {message_id}: {str(e)}", exc_info=True)
        return {
            "success": False,
            "data": None,
            "error": {"code": "MESSAGE_NOT_FOUND", "message": "Could not find the requested email."}
        }

@router.get("/threads/{thread_id}")
async def get_thread(
    thread_id: str,
    request: Request,
    session_id: Optional[str] = Query(None)
):
    """Fetch all chronological messages in a thread."""
    sid = _get_session_id(request, session_id)
    try:
        messages = await gmail_service.get_thread(thread_id, session_id=sid)
        return {
            "success": True,
            "data": {"messages": messages},
            "error": None
        }
    except Exception as e:
        logger.error(f"Error fetching thread {thread_id}: {str(e)}", exc_info=True)
        return {
            "success": False,
            "data": None,
            "error": {"code": "THREAD_ERROR", "message": "Could not retrieve message thread."}
        }

@router.post("/send")
async def send_email(
    send_req: SendEmailRequest,
    request: Request,
    session_id: Optional[str] = Query(None)
):
    """Send an email using Gmail API."""
    sid = _get_session_id(request, session_id)
    try:
        result = await gmail_service.send_message(send_req, session_id=sid)
        return {
            "success": True,
            "data": result,
            "error": None
        }
    except ValueError as ve:
        return {
            "success": False,
            "data": None,
            "error": {"code": "VALIDATION_OR_AUTH_ERROR", "message": str(ve)}
        }
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}", exc_info=True)
        return {
            "success": False,
            "data": None,
            "error": {"code": "SEND_FAILED", "message": "Failed to send email. Your draft is preserved."}
        }

@router.post("/reply")
async def reply_email(
    reply_req: ReplyEmailRequest,
    request: Request,
    session_id: Optional[str] = Query(None)
):
    """Reply to an existing email preserving thread headers."""
    sid = _get_session_id(request, session_id)
    try:
        result = await gmail_service.create_reply(reply_req, session_id=sid)
        return {
            "success": True,
            "data": result,
            "error": None
        }
    except Exception as e:
        logger.error(f"Error replying to email {reply_req.message_id}: {str(e)}", exc_info=True)
        return {
            "success": False,
            "data": None,
            "error": {"code": "REPLY_FAILED", "message": "Failed to send reply."}
        }

@router.post("/mark-read")
async def mark_read(
    mark_req: MarkReadRequest,
    request: Request,
    session_id: Optional[str] = Query(None)
):
    """Mark messages as read or unread."""
    sid = _get_session_id(request, session_id)
    try:
        await gmail_service.mark_as_read(
            mark_req.message_ids,
            unread=mark_req.unread,
            session_id=sid
        )
        return {
            "success": True,
            "data": {"message": "Status updated successfully"},
            "error": None
        }
    except Exception as e:
        logger.error(f"Error updating read status: {str(e)}", exc_info=True)
        return {
            "success": False,
            "data": None,
            "error": {"code": "UPDATE_FAILED", "message": "Failed to update read status."}
        }

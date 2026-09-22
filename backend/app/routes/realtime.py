import json
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Request, Response, WebSocket, WebSocketDisconnect, Query, HTTPException, status
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.services.sync_service import sync_service
from app.services.websocket_manager import ws_manager
from app.services.session_service import session_service
from app.services.gmail_service import gmail_service
from app.models.sync_state import get_sync_state

logger = logging.getLogger("nebula.routes.realtime")
router = APIRouter(tags=["Real-Time Sync"])

def _get_session(request: Request, session_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Extract session from query, Authorization header, or cookie, with active account fallback."""
    sid = session_id
    if not sid:
        auth_hdr = request.headers.get("Authorization")
        if auth_hdr and auth_hdr.startswith("Bearer "):
            sid = auth_hdr.split(" ")[1]
    if not sid:
        sid = request.cookies.get(settings.SESSION_COOKIE_NAME)
    
    if sid:
        session = session_service.get_session(sid)
        if session:
            return {"session_id": sid, **session}
    
    # Fallback to active account if available
    return session_service.get_active_account()

@router.post("/api/webhooks/gmail")
async def gmail_pubsub_webhook(request: Request, token: Optional[str] = Query(None)):
    """
    Webhook endpoint receiving push notifications from Google Cloud Pub/Sub.
    Google Cloud Pub/Sub sends an HTTP POST with a JSON body containing base64 data.
    Must respond with HTTP 200 to acknowledge receipt.
    """
    # Verification token validation if configured
    if settings.PUBSUB_VERIFICATION_TOKEN:
        header_token = request.headers.get("X-Goog-Channel-Token") or request.headers.get("x-goog-channel-token")
        incoming_token = token or header_token
        if incoming_token != settings.PUBSUB_VERIFICATION_TOKEN:
            logger.warning("Pub/Sub webhook rejected: invalid verification token")
            return Response(status_code=403, content="Forbidden: Invalid verification token")

    try:
        body = await request.json()
    except Exception:
        # Acknowledge receipt even on parse error to avoid infinite retry storms from Pub/Sub
        logger.error("Failed to parse JSON body from Pub/Sub webhook")
        return JSONResponse(status_code=200, content={"status": "error", "message": "invalid_json"})

    decoded = sync_service.decode_pubsub_message(body)
    if not decoded:
        return JSONResponse(status_code=200, content={"status": "ignored", "reason": "empty_or_invalid_payload"})

    email = decoded.get("emailAddress")
    gmail_api_service = None
    active = session_service.get_active_account()
    if active and active.get("email") == email:
        try:
            gmail_api_service = gmail_service._get_service(active.get("session_id"))
        except Exception as e:
            logger.warning(f"Could not build Gmail service for {email}: {e}")

    result = await sync_service.process_notification(decoded, gmail_service=gmail_api_service)
    return JSONResponse(status_code=200, content={"status": "success", "result": result})

@router.post("/api/sync/watch")
async def register_watch(request: Request, session_id: Optional[str] = Query(None)):
    """Register Gmail push notifications watch for the currently authenticated user."""
    session = _get_session(request, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    user_email = session["email"]
    try:
        service = gmail_service._get_service(session.get("session_id"))
        result = sync_service.register_watch(service, user_email)
        return {"success": True, "watch": result}
    except Exception as e:
        logger.error(f"Error registering watch for {user_email}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/sync/stop")
async def stop_watch(request: Request, session_id: Optional[str] = Query(None)):
    """Stop Gmail push notifications watch for the currently authenticated user."""
    session = _get_session(request, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    user_email = session["email"]
    try:
        service = gmail_service._get_service(session.get("session_id"))
        stopped = sync_service.stop_watch(service, user_email)
        return {"success": stopped}
    except Exception as e:
        logger.error(f"Error stopping watch for {user_email}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/sync/status")
async def get_sync_status(request: Request, session_id: Optional[str] = Query(None)):
    """Get current synchronization and watch status for the user."""
    session = _get_session(request, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    user_email = session["email"]
    state = get_sync_state(user_email)
    return {
        "user_email": user_email,
        "sync_state": state or {
            "history_id": None,
            "watch_expiration": None,
            "last_synced_at": None
        }
    }

@router.websocket("/ws/realtime")
async def websocket_realtime_endpoint(websocket: WebSocket, email: str = Query(...)):
    """
    WebSocket endpoint for real-time mailbox push notifications.
    Clients connect via ws://localhost:8000/ws/realtime?email=user@gmail.com
    Receives 'INBOX_UPDATED' broadcasts when Pub/Sub webhook triggers.
    """
    await ws_manager.connect(websocket, email)
    try:
        # Send initial connection acknowledgment
        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "email": email,
            "message": "Connected to Nebula Real-Time Notification Hub"
        })
        while True:
            # Keep connection alive; accept ping/pong or client messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, email)
    except Exception as e:
        logger.warning(f"WebSocket connection error for {email}: {e}")
        ws_manager.disconnect(websocket, email)

from fastapi import APIRouter, Request, Response, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from typing import Optional

from app.core.config import settings
from app.core.security import generate_csrf_state, verify_csrf_state
from app.core.logging import logger
from app.services.oauth_service import oauth_service
from app.services.session_service import session_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get("/google/start")
async def start_google_auth():
    """
    Initialize server-side Google OAuth 2.0 flow.
    Returns authorization URL with secure CSRF state parameter and prompt=select_account.
    """
    state = generate_csrf_state()
    auth_url = oauth_service.get_authorization_url(state=state)
    return {
        "success": True,
        "data": {
            "auth_url": auth_url,
            "state": state
        },
        "error": None
    }

@router.get("/google/callback")
async def google_auth_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None
):
    """
    Handle Google OAuth 2.0 callback with authorization code.
    Validates CSRF state, exchanges code for tokens, retrieves user profile, and creates session.
    """
    if error:
        logger.warning(f"OAuth authorization error received: {error}")
        return RedirectResponse(f"{settings.FRONTEND_URL}/auth?error={error}")

    if not code or not state:
        logger.warning("Missing code or state parameter in OAuth callback")
        return RedirectResponse(f"{settings.FRONTEND_URL}/auth?error=invalid_request")

    # Validate CSRF state token
    if not verify_csrf_state(state):
        logger.error("CSRF state token validation failed in OAuth callback")
        return RedirectResponse(f"{settings.FRONTEND_URL}/auth?error=csrf_validation_failed")

    try:
        # Exchange code for tokens
        token_data = await oauth_service.exchange_code_for_tokens(code)
        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        expires_in = token_data.get("expires_in", 3600)

        # Retrieve user profile
        user_info = await oauth_service.get_user_profile(access_token)
        email = user_info.get("email")

        if not email:
            raise ValueError("No email address associated with authorized Google account")

        # Create session
        session_id = session_service.create_session(
            email=email,
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=expires_in,
            user_info=user_info
        )

        response = RedirectResponse(f"{settings.FRONTEND_URL}/inbox?session_id={session_id}")
        response.set_cookie(
            key=settings.SESSION_COOKIE_NAME,
            value=session_id,
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            httponly=True,
            samesite="lax",
            secure=settings.ENVIRONMENT == "production"
        )
        return response

    except Exception as e:
        logger.error(f"Error completing OAuth flow: {str(e)}", exc_info=True)
        return RedirectResponse(f"{settings.FRONTEND_URL}/auth?error=auth_failed")

@router.get("/me")
async def get_current_user(request: Request, session_id: Optional[str] = Query(None)):
    """
    Return currently connected account information.
    Checks session cookie or explicit session_id query/header.
    """
    # Check session cookie or query param or Authorization header
    sid = session_id or request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not sid:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            sid = auth_header.split(" ")[1]

    session = session_service.get_session(sid) if sid else session_service.get_active_account()

    if not session:
        return {
            "success": True,
            "data": {
                "connected": False,
                "email": None,
                "name": None,
                "picture": None
            },
            "error": None
        }

    user_info = session.get("user_info", {})
    return {
        "success": True,
        "data": {
            "connected": True,
            "email": session.get("email"),
            "name": user_info.get("name"),
            "picture": user_info.get("picture"),
            "session_id": sid or session.get("session_id")
        },
        "error": None
    }

@router.post("/logout")
async def logout(request: Request, response: Response, session_id: Optional[str] = None):
    """
    Disconnect currently connected Gmail account and destroy session.
    """
    sid = session_id or request.cookies.get(settings.SESSION_COOKIE_NAME)
    if sid:
        session = session_service.get_session(sid)
        if session and session.get("access_token"):
            try:
                await oauth_service.revoke_token(session["access_token"])
            except Exception as e:
                logger.warning(f"Failed to revoke token on Google: {str(e)}")
        session_service.delete_session(sid)

    response.delete_cookie(settings.SESSION_COOKIE_NAME)
    return {
        "success": True,
        "data": {
            "message": "Account disconnected successfully"
        },
        "error": None
    }

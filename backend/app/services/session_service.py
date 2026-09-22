import time
import secrets
from typing import Dict, Any, Optional
from app.core.logging import logger

class SessionService:
    def __init__(self):
        # In-memory session store (can be persisted to SQLite)
        self._sessions: Dict[str, Dict[str, Any]] = {}

    def create_session(
        self,
        email: str,
        access_token: str,
        refresh_token: Optional[str] = None,
        expires_in: int = 3600,
        user_info: Optional[Dict[str, Any]] = None
    ) -> str:
        """Create a new secure server-side session."""
        session_id = secrets.token_urlsafe(32)
        expires_at = time.time() + expires_in
        
        self._sessions[session_id] = {
            "email": email,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_at": expires_at,
            "user_info": user_info or {},
            "created_at": time.time(),
        }
        logger.info(f"Session created for {email}")
        return session_id

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve active session by session ID."""
        session = self._sessions.get(session_id)
        if not session:
            return None
        return session

    def update_tokens(self, session_id: str, access_token: str, expires_in: int = 3600):
        """Update access token and expiration for an existing session."""
        if session_id in self._sessions:
            self._sessions[session_id]["access_token"] = access_token
            self._sessions[session_id]["expires_at"] = time.time() + expires_in

    def delete_session(self, session_id: str) -> bool:
        """Delete session on logout / disconnect."""
        if session_id in self._sessions:
            email = self._sessions[session_id].get("email")
            del self._sessions[session_id]
            logger.info(f"Session destroyed for {email}")
            return True
        return False

    def get_active_account(self) -> Optional[Dict[str, Any]]:
        """Get the primary active session if one exists."""
        if not self._sessions:
            return None
        # Return most recently created session
        latest_session_id = list(self._sessions.keys())[-1]
        return {
            "session_id": latest_session_id,
            **self._sessions[latest_session_id]
        }

session_service = SessionService()

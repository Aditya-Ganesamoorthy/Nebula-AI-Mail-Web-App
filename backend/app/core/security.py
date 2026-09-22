import secrets
import hashlib
import hmac
import time
from typing import Optional
from app.core.config import settings

def generate_csrf_state() -> str:
    """Generate cryptographically secure random state parameter for OAuth CSRF protection."""
    random_bytes = secrets.token_urlsafe(32)
    timestamp = str(int(time.time()))
    signature = hmac.new(
        settings.SESSION_SECRET.encode(),
        f"{random_bytes}:{timestamp}".encode(),
        hashlib.sha256
    ).hexdigest()
    return f"{random_bytes}.{timestamp}.{signature}"

def verify_csrf_state(state: str, max_age_seconds: int = 600) -> bool:
    """Verify OAuth state parameter signature and expiration (default 10 minutes)."""
    try:
        parts = state.split(".")
        if len(parts) != 3:
            return False
        random_bytes, timestamp_str, provided_sig = parts
        timestamp = int(timestamp_str)
        
        # Check expiration
        current_time = int(time.time())
        if current_time - timestamp > max_age_seconds or timestamp > current_time + 60:
            return False
            
        expected_sig = hmac.new(
            settings.SESSION_SECRET.encode(),
            f"{random_bytes}:{timestamp_str}".encode(),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(provided_sig, expected_sig)
    except Exception:
        return False

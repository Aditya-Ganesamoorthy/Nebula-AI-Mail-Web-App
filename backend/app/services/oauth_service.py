import urllib.parse
import httpx
from typing import Dict, Any, Optional
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from app.core.config import settings
from app.core.logging import logger

# Essential Gmail and profile scopes (least privilege)
GMAIL_SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/gmail.modify",
]

class OAuthService:
    def __init__(self):
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = settings.GOOGLE_REDIRECT_URI

    def is_configured(self) -> bool:
        """Verify whether Google OAuth credentials are provided."""
        return bool(self.client_id and self.client_secret and self.redirect_uri)

    def get_authorization_url(self, state: str) -> str:
        """
        Generate Google OAuth 2.0 authorization URL with CSRF state and explicit account selection.
        prompt='select_account' ensures the user explicitly picks their desired separate mail account.
        """
        if not self.is_configured():
            logger.warning("Google OAuth credentials missing. Generating demo authorization URL.")
            params = {
                "client_id": self.client_id or "demo-client-id",
                "redirect_uri": self.redirect_uri,
                "response_type": "code",
                "scope": " ".join(GMAIL_SCOPES),
                "state": state,
                "access_type": "offline",
                "prompt": "select_account",
                "include_granted_scopes": "true",
            }
            return f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"

        client_config = {
            "web": {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [self.redirect_uri],
            }
        }

        flow = Flow.from_client_config(
            client_config=client_config,
            scopes=GMAIL_SCOPES,
            redirect_uri=self.redirect_uri
        )

        auth_url, _ = flow.authorization_url(
            access_type="offline",
            prompt="select_account",
            include_granted_scopes="true",
            state=state
        )
        return auth_url

    async def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        """
        Exchange OAuth authorization code for access and refresh tokens.
        """
        if not self.is_configured():
            raise ValueError("Google OAuth is not configured with client ID and secret.")

        token_url = "https://oauth2.googleapis.com/token"
        payload = {
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code",
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(token_url, data=payload)
            if response.status_code != 200:
                logger.error(f"OAuth token exchange failed: {response.text}")
                raise ValueError(f"Failed to exchange authorization code: {response.text}")
            return response.json()

    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        Refresh an expired access token using the stored refresh token.
        """
        if not self.is_configured():
            raise ValueError("Google OAuth is not configured.")

        token_url = "https://oauth2.googleapis.com/token"
        payload = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(token_url, data=payload)
            if response.status_code != 200:
                logger.error(f"Failed to refresh access token: {response.text}")
                raise ValueError("Access token refresh failed.")
            return response.json()

    async def get_user_profile(self, access_token: str) -> Dict[str, Any]:
        """
        Fetch authenticated user's email address and profile info.
        """
        userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(userinfo_url, headers=headers)
            if response.status_code != 200:
                logger.error(f"Failed to fetch user profile: {response.text}")
                raise ValueError("Failed to retrieve user profile.")
            return response.json()

    async def revoke_token(self, token: str) -> bool:
        """
        Revoke an OAuth token upon logout/disconnect.
        """
        revoke_url = f"https://oauth2.googleapis.com/revoke?token={token}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(revoke_url, headers={"content-type": "application/x-www-form-urlencoded"})
            return response.status_code == 200

oauth_service = OAuthService()

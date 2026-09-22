import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch
from app.main import app
from app.services.session_service import session_service

@pytest.fixture
def mock_session():
    return session_service.create_session(
        email="aditya.test@gmail.com",
        access_token="mock_valid_token_xyz",
        refresh_token="mock_valid_refresh_xyz",
        expires_in=3600
    )

@pytest.mark.asyncio
async def test_get_inbox_requires_auth():
    # Calling without any session
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/mail/inbox")
    assert response.status_code == 200
    data = response.json()
    # When no session exists, returns user-friendly auth required error
    assert data["success"] is False
    assert data["error"]["code"] == "GMAIL_AUTH_REQUIRED"

@pytest.mark.asyncio
async def test_get_inbox_with_mocked_gmail(mock_session):
    mock_messages = [
        {
            "id": "msg_001",
            "thread_id": "thread_001",
            "subject": "Welcome to Nebula KnowLab",
            "from": {"name": "Nebula Team", "email": "team@nebulaknowlab.com"},
            "snippet": "We are excited to share the project details with you.",
            "date": "Tue, 23 Sep 2026 09:00:00 +0000",
            "is_unread": True
        }
    ]

    with patch("app.services.gmail_service.gmail_service.list_inbox", new_callable=AsyncMock) as mock_list:
        mock_list.return_value = {
            "messages": mock_messages,
            "next_page_token": None,
            "result_size_estimate": 1
        }

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.get(f"/api/mail/inbox?session_id={mock_session}")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]["messages"]) == 1
        assert data["data"]["messages"][0]["subject"] == "Welcome to Nebula KnowLab"
        assert data["data"]["messages"][0]["is_unread"] is True

@pytest.mark.asyncio
async def test_send_email_endpoint(mock_session):
    with patch("app.services.gmail_service.gmail_service.send_message", new_callable=AsyncMock) as mock_send:
        mock_send.return_value = {
            "id": "sent_msg_777",
            "thread_id": "thread_777",
            "label_ids": ["SENT"]
        }

        payload = {
            "to": "john@example.com",
            "subject": "Meeting Tomorrow",
            "body": "Let's meet at 3pm"
        }

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.post(f"/api/mail/send?session_id={mock_session}", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["id"] == "sent_msg_777"

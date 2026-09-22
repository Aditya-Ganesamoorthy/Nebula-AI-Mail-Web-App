import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.schemas.assistant import UIContext

@pytest.mark.asyncio
async def test_ai_compose_command():
    payload = {
        "prompt": "Send an email to john@example.com with subject 'Meeting Tomorrow' and body 'Let\\'s meet at 3pm'",
        "context": {"current_view": "inbox"}
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/assistant/command", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["action"] == "compose_email"
    assert data["params"]["to"] == "john@example.com"
    assert "Meeting Tomorrow" in data["params"]["subject"]
    assert "3pm" in data["params"]["body"]
    assert data["requires_confirmation"] is True

@pytest.mark.asyncio
async def test_ai_search_last_10_days():
    payload = {
        "prompt": "Show me emails from the last 10 days",
        "context": {"current_view": "inbox"}
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/assistant/command", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["action"] == "search_emails"
    assert data["params"]["date_preset"] == "last_10_days"

@pytest.mark.asyncio
async def test_ai_search_sender_and_topic():
    payload = {
        "prompt": "Find the email from Sarah about the project update",
        "context": {"current_view": "inbox"}
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/assistant/command", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["action"] == "search_emails"
    assert data["params"]["sender"].lower() == "sarah"
    assert "project update" in data["params"]["keyword"].lower()

@pytest.mark.asyncio
async def test_ai_open_latest_email():
    payload = {
        "prompt": "Open the latest email from David",
        "context": {"current_view": "inbox"}
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/assistant/command", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["action"] in ("open_email", "message")
    if data["action"] == "open_email":
        assert data["params"]["sender"] == "David"

@pytest.mark.asyncio
async def test_ai_reply_with_context():
    payload = {
        "prompt": "Reply to this",
        "context": {
            "current_view": "email_detail",
            "current_email_id": "msg_sarah_101",
            "selected_email": {
                "id": "msg_sarah_101",
                "from": {"name": "Sarah", "email": "sarah@example.com"},
                "subject": "Project Status"
            }
        }
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/assistant/command", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["action"] == "reply_email"
    assert data["params"]["email_id"] == "msg_sarah_101"

@pytest.mark.asyncio
async def test_ai_reply_without_context_warns_user():
    payload = {
        "prompt": "Reply to this",
        "context": {
            "current_view": "inbox",
            "current_email_id": None
        }
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/assistant/command", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["action"] == "message"
    assert "open an email" in data["explanation"].lower()

@pytest.mark.asyncio
async def test_ai_filter_unread_this_week():
    payload = {
        "prompt": "Show only unread emails from this week",
        "context": {"current_view": "inbox"}
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/assistant/command", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["action"] == "filter_emails"
    assert data["params"]["unread"] is True
    assert data["params"]["date_preset"] == "this_week"

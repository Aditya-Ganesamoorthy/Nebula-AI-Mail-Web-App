import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.session_service import session_service
from app.core.security import generate_csrf_state

@pytest.mark.asyncio
async def test_oauth_start_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/auth/google/start")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "auth_url" in data["data"]
    assert "accounts.google.com" in data["data"]["auth_url"]
    assert "prompt=select_account" in data["data"]["auth_url"]
    assert "state" in data["data"]

@pytest.mark.asyncio
async def test_oauth_callback_missing_params():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", follow_redirects=False) as ac:
        response = await ac.get("/auth/google/callback")
    # Should redirect to frontend with error
    assert response.status_code == 307
    assert "error=invalid_request" in response.headers["location"]

@pytest.mark.asyncio
async def test_oauth_callback_invalid_csrf():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", follow_redirects=False) as ac:
        response = await ac.get("/auth/google/callback?code=mock_code&state=invalid_csrf_state")
    assert response.status_code == 307
    assert "error=csrf_validation_failed" in response.headers["location"]

@pytest.mark.asyncio
async def test_auth_me_unauthenticated():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["connected"] is False
    assert data["data"]["email"] is None

@pytest.mark.asyncio
async def test_session_lifecycle():
    # Create test session
    session_id = session_service.create_session(
        email="test.engineer@example.com",
        access_token="mock_access_token_12345",
        refresh_token="mock_refresh_token_67890",
        expires_in=3600,
        user_info={"name": "Test Engineer", "picture": "https://example.com/photo.jpg"}
    )
    assert session_id is not None

    # Retrieve session
    session = session_service.get_session(session_id)
    assert session is not None
    assert session["email"] == "test.engineer@example.com"
    assert session["access_token"] == "mock_access_token_12345"

    # Verify /auth/me returns connected user when session_id is passed
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(f"/auth/me?session_id={session_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["connected"] is True
    assert data["data"]["email"] == "test.engineer@example.com"
    assert data["data"]["name"] == "Test Engineer"

    # Logout
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        logout_resp = await ac.post(f"/auth/logout?session_id={session_id}")
    assert logout_resp.status_code == 200

    # Verify session is destroyed
    assert session_service.get_session(session_id) is None

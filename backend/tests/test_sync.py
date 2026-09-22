import pytest
import base64
import json
import os
import tempfile
from fastapi.testclient import TestClient

from app.main import app
from app.services.sync_service import sync_service
from app.models.sync_state import init_db, get_sync_state, upsert_sync_state
from app.core.config import settings

client = TestClient(app)

def test_decode_pubsub_valid_payload():
    payload_data = {"emailAddress": "adityaganesamoorthy2912@gmail.com", "historyId": "987654"}
    data_b64 = base64.b64encode(json.dumps(payload_data).encode("utf-8")).decode("utf-8")
    
    pubsub_msg = {
        "message": {
            "data": data_b64,
            "messageId": "msg_001",
            "publishTime": "2026-09-23T00:00:00Z"
        },
        "subscription": "projects/nebula/subscriptions/gmail-sub"
    }

    decoded = sync_service.decode_pubsub_message(pubsub_msg)
    assert decoded is not None
    assert decoded["emailAddress"] == "adityaganesamoorthy2912@gmail.com"
    assert decoded["historyId"] == "987654"

def test_decode_pubsub_missing_data():
    empty_msg = {"message": {}}
    assert sync_service.decode_pubsub_message(empty_msg) is None

def test_decode_pubsub_invalid_base64():
    corrupted_msg = {"message": {"data": "not-valid-base64!!!"}}
    assert sync_service.decode_pubsub_message(corrupted_msg) is None

def test_sqlite_sync_state_crud():
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tf:
        temp_db = tf.name

    try:
        init_db(temp_db)
        state = get_sync_state("test@example.com", temp_db)
        assert state is None

        # Insert new
        upsert_sync_state("test@example.com", history_id="1001", watch_expiration=1750000000, db_path=temp_db)
        state = get_sync_state("test@example.com", temp_db)
        assert state is not None
        assert state["history_id"] == "1001"
        assert state["watch_expiration"] == 1750000000

        # Update existing
        upsert_sync_state("test@example.com", history_id="1002", db_path=temp_db)
        updated = get_sync_state("test@example.com", temp_db)
        assert updated["history_id"] == "1002"
        assert updated["watch_expiration"] == 1750000000
    finally:
        if os.path.exists(temp_db):
            os.remove(temp_db)

@pytest.mark.asyncio
async def test_process_notification():
    data = {
        "emailAddress": "test_notify@gmail.com",
        "historyId": "55555"
    }
    result = await sync_service.process_notification(data)
    assert result["status"] == "processed"
    assert result["delta"]["newHistoryId"] == "55555"

def test_webhook_endpoint_success():
    payload_data = {"emailAddress": "webhook_user@gmail.com", "historyId": "77777"}
    data_b64 = base64.b64encode(json.dumps(payload_data).encode("utf-8")).decode("utf-8")
    
    body = {
        "message": {
            "data": data_b64,
            "messageId": "msg_999"
        }
    }

    response = client.post("/api/webhooks/gmail", json=body)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["status"] == "success"

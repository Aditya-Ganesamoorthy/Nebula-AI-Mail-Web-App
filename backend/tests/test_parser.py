import pytest
import base64
from app.services.gmail_parser import (
    sanitize_html,
    decode_base64url,
    parse_address_field,
    parse_gmail_message
)

def test_sanitize_html_removes_scripts():
    dangerous_html = '<div>Hello<script>alert("pwned")</script> World!</div>'
    cleaned = sanitize_html(dangerous_html)
    assert "<script>" not in cleaned
    assert "alert" not in cleaned
    assert "Hello" in cleaned
    assert "World!" in cleaned

def test_sanitize_html_removes_dangerous_attributes():
    dangerous_html = '<img src="https://example.com/pic.jpg" onerror="alert(1)" onload="evil()">'
    cleaned = sanitize_html(dangerous_html)
    assert "onerror" not in cleaned
    assert "onload" not in cleaned
    assert 'src="https://example.com/pic.jpg"' in cleaned

def test_sanitize_html_removes_iframes_and_objects():
    dangerous_html = '<iframe src="https://evil.com"></iframe><object data="bad.swf"></object>'
    cleaned = sanitize_html(dangerous_html)
    assert "<iframe" not in cleaned
    assert "<object" not in cleaned

def test_decode_base64url():
    raw_text = "Let's meet at 3pm for project review!"
    encoded = base64.urlsafe_b64encode(raw_text.encode('utf-8')).decode('ascii').rstrip('=')
    decoded = decode_base64url(encoded)
    assert decoded == raw_text

def test_decode_base64url_corrupted():
    # Corrupted string shouldn't crash
    result = decode_base64url("???invalid===base64")
    assert isinstance(result, str)

def test_parse_address_field():
    name, email = parse_address_field("Sarah Jenkins <sarah.j@example.com>")
    assert name == "Sarah Jenkins"
    assert email == "sarah.j@example.com"

    name2, email2 = parse_address_field("david@example.com")
    assert name2 == "david@example.com"
    assert email2 == "david@example.com"

def test_parse_gmail_message_multipart():
    plain_text = "Hey there, here is the project update."
    html_text = "<p>Hey there, here is the <b>project update</b>.<script>evil()</script></p>"

    encoded_plain = base64.urlsafe_b64encode(plain_text.encode()).decode()
    encoded_html = base64.urlsafe_b64encode(html_text.encode()).decode()

    mock_msg = {
        "id": "msg_12345",
        "threadId": "thread_67890",
        "labelIds": ["INBOX", "UNREAD"],
        "snippet": "Hey there, here is the project update.",
        "payload": {
            "headers": [
                {"name": "Subject", "value": "Project Update"},
                {"name": "From", "value": "Sarah <sarah@example.com>"},
                {"name": "To", "value": "aditya@example.com"},
                {"name": "Date", "value": "Mon, 22 Sep 2026 14:00:00 +0000"}
            ],
            "parts": [
                {
                    "mimeType": "text/plain",
                    "body": {"data": encoded_plain}
                },
                {
                    "mimeType": "text/html",
                    "body": {"data": encoded_html}
                }
            ]
        }
    }

    parsed = parse_gmail_message(mock_msg)
    assert parsed["id"] == "msg_12345"
    assert parsed["thread_id"] == "thread_67890"
    assert parsed["subject"] == "Project Update"
    assert parsed["from"]["name"] == "Sarah"
    assert parsed["from"]["email"] == "sarah@example.com"
    assert parsed["is_unread"] is True
    assert "Hey there, here is the project update." in parsed["body_plain"]
    assert "<b>project update</b>" in parsed["body_html"]
    assert "<script>" not in parsed["body_html"]

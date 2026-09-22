import pytest
from pydantic import ValidationError
from app.schemas.mail import SendEmailRequest, ReplyEmailRequest

def test_send_email_valid_request():
    req = SendEmailRequest(
        to="john@example.com",
        subject="Meeting Tomorrow",
        body="Let's meet at 3pm."
    )
    assert req.to == "john@example.com"
    assert req.subject == "Meeting Tomorrow"
    assert req.body == "Let's meet at 3pm."

def test_send_email_with_name_format():
    req = SendEmailRequest(
        to="John Doe <john.doe@example.com>",
        subject="Hello",
        body="Body content"
    )
    assert "john.doe@example.com" in req.to

def test_send_email_multiple_recipients():
    req = SendEmailRequest(
        to="alice@example.com, bob@example.com",
        subject="Team Update",
        body="All hands meeting tomorrow"
    )
    assert req.to == "alice@example.com, bob@example.com"

def test_send_email_empty_to_fails():
    with pytest.raises(ValidationError):
        SendEmailRequest(
            to="",
            subject="Empty recipient",
            body="Body"
        )

def test_send_email_invalid_email_format_fails():
    with pytest.raises(ValidationError):
        SendEmailRequest(
            to="not-an-email",
            subject="Invalid format",
            body="Body"
        )

def test_reply_email_valid_request():
    req = ReplyEmailRequest(
        message_id="msg_998877",
        body="Thanks for the update, will review shortly."
    )
    assert req.message_id == "msg_998877"
    assert "Thanks" in req.body

def test_reply_email_empty_body_fails():
    with pytest.raises(ValidationError):
        ReplyEmailRequest(
            message_id="msg_998877",
            body=""
        )

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, field_validator
import re

class EmailRecipient(BaseModel):
    raw: str = ""
    name: str = ""
    email: str = ""

class EmailSummary(BaseModel):
    id: str
    thread_id: str
    subject: str = "(No Subject)"
    sender: EmailRecipient = Field(default_factory=EmailRecipient, alias="from")
    snippet: str = ""
    date: str = ""
    is_unread: bool = False
    labels: List[str] = Field(default_factory=list)

    model_config = {
        "populate_by_name": True
    }

class EmailDetail(BaseModel):
    id: str
    thread_id: str
    subject: str = "(No Subject)"
    sender: EmailRecipient = Field(default_factory=EmailRecipient, alias="from")
    to: EmailRecipient = Field(default_factory=EmailRecipient)
    cc: str = ""
    date: str = ""
    snippet: str = ""
    body_plain: str = ""
    body_html: str = ""
    has_html: bool = False
    attachments: List[Dict[str, Any]] = Field(default_factory=list)
    labels: List[str] = Field(default_factory=list)
    is_unread: bool = False
    headers: Dict[str, str] = Field(default_factory=dict)

    model_config = {
        "populate_by_name": True
    }

class SendEmailRequest(BaseModel):
    to: str = Field(..., description="Recipient email address or comma-separated addresses")
    subject: str = Field(default="", max_length=500)
    body: str = Field(..., description="Email body content")
    cc: Optional[str] = None
    bcc: Optional[str] = None
    thread_id: Optional[str] = None
    in_reply_to: Optional[str] = None
    references: Optional[str] = None

    @field_validator("to")
    @classmethod
    def validate_recipients(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Recipient address (To) cannot be empty.")
        # Validate individual addresses
        addresses = [addr.strip() for addr in v.split(",") if addr.strip()]
        email_regex = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')
        for addr in addresses:
            # Handle "Name <email@domain.com>" format
            clean_addr = addr
            match = re.match(r'^.*?<([^>]+)>$', addr)
            if match:
                clean_addr = match.group(1).strip()
            if not email_regex.match(clean_addr):
                raise ValueError(f"Invalid email address: {addr}")
        return v

class ReplyEmailRequest(BaseModel):
    message_id: str
    body: str = Field(..., min_length=1, description="Reply message body")
    reply_all: bool = False

class MarkReadRequest(BaseModel):
    message_ids: List[str] = Field(..., min_length=1)
    unread: bool = False

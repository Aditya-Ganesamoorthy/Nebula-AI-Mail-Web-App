from pydantic import BaseModel, Field
from typing import Optional, List, Literal, Dict, Any

class ComposeEmailAction(BaseModel):
    action: Literal["compose_email"] = "compose_email"
    to: str = Field(..., description="Recipient email address")
    subject: str = Field(default="", description="Subject line of email")
    body: str = Field(default="", description="Body text of email")
    explanation: Optional[str] = Field(default="Preparing email draft for review...", description="User-facing status explanation")

class SearchEmailsAction(BaseModel):
    action: Literal["search_emails"] = "search_emails"
    sender: Optional[str] = Field(default=None, description="Sender name or email address")
    keyword: Optional[str] = Field(default=None, description="Topic, subject, or keyword phrase")
    date_preset: Optional[str] = Field(default=None, description="Preset date range: today, yesterday, last_7_days, last_10_days, this_week, last_30_days")
    date_from: Optional[str] = Field(default=None, description="YYYY/MM/DD start date")
    date_to: Optional[str] = Field(default=None, description="YYYY/MM/DD end date")
    unread: Optional[bool] = Field(default=None, description="Filter for unread emails only")
    explanation: Optional[str] = Field(default="Searching your mailbox...", description="User-facing status explanation")

class OpenEmailAction(BaseModel):
    action: Literal["open_email"] = "open_email"
    email_id: Optional[str] = Field(default=None, description="Specific message ID if known")
    sender: Optional[str] = Field(default=None, description="Sender name e.g. David")
    keyword: Optional[str] = Field(default=None, description="Topic or subject keyword")
    latest: bool = Field(default=True, description="Open the newest/latest matching email")
    explanation: Optional[str] = Field(default="Opening email...", description="User-facing status explanation")

class ReplyEmailAction(BaseModel):
    action: Literal["reply_email"] = "reply_email"
    email_id: Optional[str] = Field(default=None, description="ID of email to reply to (uses current open email from context if omitted)")
    body: str = Field(default="", description="Draft reply body content")
    explanation: Optional[str] = Field(default="Opening reply composer...", description="User-facing status explanation")

class FilterEmailsAction(BaseModel):
    action: Literal["filter_emails"] = "filter_emails"
    unread: Optional[bool] = None
    date_preset: Optional[str] = None
    sender: Optional[str] = None
    keyword: Optional[str] = None
    explanation: Optional[str] = Field(default="Applying filters...", description="User-facing status explanation")

class ClearFiltersAction(BaseModel):
    action: Literal["clear_filters"] = "clear_filters"
    explanation: Optional[str] = Field(default="Clearing all filters and showing all inbox emails.", description="User-facing status explanation")

class NavigateAction(BaseModel):
    action: Literal["navigate"] = "navigate"
    destination: Literal["inbox", "sent", "compose"] = Field(..., description="Target navigation view")
    explanation: Optional[str] = Field(default="Navigating...", description="User-facing status explanation")

class GeneralMessageAction(BaseModel):
    action: Literal["message"] = "message"
    message: str = Field(..., description="Conversational or clarification response to the user")

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class UIContext(BaseModel):
    current_view: str = Field(default="inbox", description="Active frontend view: inbox, sent, email_detail, compose")
    current_email_id: Optional[str] = None
    current_thread_id: Optional[str] = None
    current_folder: str = "inbox"
    current_filters: Dict[str, Any] = Field(default_factory=dict)
    selected_email: Optional[Dict[str, Any]] = None

class AssistantCommandRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="Natural language command from user")
    context: Optional[UIContext] = Field(default_factory=UIContext)
    session_id: Optional[str] = None

class AssistantCommandResponse(BaseModel):
    action: str = Field(..., description="Action name e.g. compose_email, search_emails, open_email, reply_email")
    params: Dict[str, Any] = Field(default_factory=dict, description="Action arguments passed to frontend UI controller")
    explanation: str = Field(..., description="User-facing response or progress message")
    requires_confirmation: bool = Field(default=False, description="Flag indicating human-in-the-loop confirmation is needed")
    rich_card: Optional[Dict[str, Any]] = Field(default=None, description="Optional interactive rich card data to render in chat")

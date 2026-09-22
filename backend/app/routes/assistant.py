from fastapi import APIRouter, Request, HTTPException
from typing import Optional

from app.core.logging import logger
from app.schemas.assistant import AssistantCommandRequest, AssistantCommandResponse, UIContext
from app.services.groq_service import groq_service
from app.services.action_service import action_service

router = APIRouter(prefix="/api/assistant", tags=["Assistant"])

@router.post("/command", response_model=AssistantCommandResponse)
async def process_assistant_command(
    req: AssistantCommandRequest,
    request: Request
):
    """
    Process natural-language instructions from user into structured actions that drive the UI.
    """
    # Extract session_id
    sid = req.session_id or request.cookies.get("nebula_mail_session")
    if not sid:
        auth_hdr = request.headers.get("Authorization")
        if auth_hdr and auth_hdr.startswith("Bearer "):
            sid = auth_hdr.split(" ")[1]

    try:
        # Step 1: Process prompt with Groq / Tool Calling
        cmd_response = await groq_service.process_command(
            prompt=req.prompt,
            context=req.context or UIContext()
        )

        # Step 2: Resolve backend effects (e.g. finding message IDs)
        final_response = await action_service.resolve_action(
            command_resp=cmd_response,
            session_id=sid
        )

        return final_response

    except Exception as e:
        logger.error(f"Error processing assistant command: {str(e)}", exc_info=True)
        return AssistantCommandResponse(
            action="message",
            params={},
            explanation="The AI assistant is temporarily unavailable. You can continue using the mail application normally."
        )

@router.get("/health")
async def assistant_health():
    """Verify Groq AI configuration status."""
    return {
        "status": "active",
        "configured": groq_service.is_configured(),
        "model": groq_service.model
    }

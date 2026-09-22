from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    """Liveness probe: verifies that the service is running."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

@router.get("/health/ready")
async def readiness_check():
    """Readiness probe: verifies dependencies and configurations."""
    return {
        "status": "ready",
        "service": settings.PROJECT_NAME,
        "oauth_configured": bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET),
        "groq_configured": bool(settings.GROQ_API_KEY)
    }

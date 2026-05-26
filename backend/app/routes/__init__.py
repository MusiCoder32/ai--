from .papers import router as papers_router
from .questions import router as questions_router
from .auth import router as auth_router
from .chat import router as chat_router

__all__ = ["papers_router", "questions_router", "auth_router", "chat_router"]
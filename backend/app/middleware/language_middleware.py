from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.auth import verify_token
from app.services import UserService


class LanguageMiddleware(BaseHTTPMiddleware):
    """Middleware to detect and set user's preferred language"""
    
    async def dispatch(self, request: Request, call_next):
        # Try to get language from Authorization header (authenticated user)
        user_language = "en"  # default
        
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = verify_token(token)
                user_email = payload.get("sub")
                if user_email:
                    user = await UserService.get_user_by_email(user_email)
                    if user and hasattr(user, 'preferred_language'):
                        user_language = user.preferred_language or "en"
            except Exception:
                # If token verification fails, continue with default language
                pass
        
        # Also check for language in query params or headers (override)
        query_lang = request.query_params.get("lang")
        header_lang = request.headers.get("accept-language")
        
        if query_lang and query_lang in ["en", "hi", "mr"]:
            user_language = query_lang
        elif header_lang and header_lang in ["en", "hi", "mr"]:
            user_language = header_lang
        
        # Store language in request state for use in endpoints
        request.state.user_language = user_language
        
        response = await call_next(request)
        
        # Add language to response headers
        response.headers["X-User-Language"] = user_language
        
        return response

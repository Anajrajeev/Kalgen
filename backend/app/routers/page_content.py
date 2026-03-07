from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer
from typing import Dict, Any
from app.services import PageTranslationService
from app.auth import verify_token
from app.models import UserResponse

router = APIRouter(prefix="/pages", tags=["page-content"])
page_service = PageTranslationService()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserResponse:
    """Get current authenticated user"""
    try:
        payload = verify_token(token)
        user_email = payload.get("sub")
        if not user_email:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        from app.services import UserService
        user = await UserService.get_user_by_email(user_email)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication")


@router.get("/{page_name}/content")
async def get_page_content(
    page_name: str,
    request: Request,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get translated page content based on user's language preference
    
    Args:
        page_name: Name of the page (dashboard, profile, settings, etc.)
        request: Request object to get user language from middleware
        current_user: Authenticated user
    
    Returns:
        Translated page content
    """
    # Get user language from middleware state or user preference
    target_language = getattr(request.state, 'user_language', current_user.preferred_language or 'en')
    
    # Define page content templates
    page_templates = {
        "dashboard": {
            "title": "AgriNiti Dashboard",
            "sections": {
                "welcome": {
                    "heading": "Welcome to Your Dashboard",
                    "message": "Here's an overview of your agricultural activities"
                },
                "crops": {
                    "heading": "Your Crops",
                    "items": [
                        "Wheat - 5 acres",
                        "Rice - 3 acres", 
                        "Cotton - 2 acres"
                    ]
                },
                "weather": {
                    "heading": "Weather Forecast",
                    "current": "Temperature: 28°C",
                    "forecast": "Rain expected in 2 days"
                },
                "market": {
                    "heading": "Market Prices",
                    "items": [
                        "Wheat: ₹2,100 per quintal",
                        "Rice: ₹1,900 per quintal",
                        "Cotton: ₹6,500 per quintal"
                    ]
                }
            },
            "actions": {
                "view_details": "View Details",
                "refresh": "Refresh Data",
                "export": "Export Report"
            }
        },
        "profile": {
            "title": "My Profile",
            "sections": {
                "personal": {
                    "heading": "Personal Information",
                    "fields": {
                        "name": "Full Name",
                        "email": "Email Address",
                        "phone": "Phone Number",
                        "language": "Preferred Language"
                    }
                },
                "farm": {
                    "heading": "Farm Information", 
                    "fields": {
                        "location": "Farm Location",
                        "size": "Farm Size (acres)",
                        "crops": "Primary Crops"
                    }
                }
            },
            "actions": {
                "edit_profile": "Edit Profile",
                "change_password": "Change Password",
                "save_changes": "Save Changes"
            }
        },
        "settings": {
            "title": "Settings",
            "sections": {
                "language": {
                    "heading": "Language Settings",
                    "description": "Choose your preferred language for the interface"
                },
                "notifications": {
                    "heading": "Notification Settings", 
                    "description": "Manage your notification preferences"
                },
                "privacy": {
                    "heading": "Privacy Settings",
                    "description": "Control your privacy and data sharing preferences"
                }
            },
            "actions": {
                "save": "Save Settings",
                "reset": "Reset to Default",
                "cancel": "Cancel"
            }
        }
    }
    
    # Get the page template
    page_content = page_templates.get(page_name)
    if not page_content:
        raise HTTPException(status_code=404, detail=f"Page '{page_name}' not found")
    
    # Translate content if needed
    if target_language != "en":
        try:
            translated_content = await page_service.translate_page_content(
                content=page_content,
                target_language=target_language,
                source_language="en"
            )
            return {
                "page_name": page_name,
                "language": target_language,
                "content": translated_content
            }
        except Exception as e:
            # Fallback to original content if translation fails
            return {
                "page_name": page_name,
                "language": "en",
                "content": page_content,
                "translation_error": str(e)
            }
    
    return {
        "page_name": page_name,
        "language": target_language,
        "content": page_content
    }


@router.get("/{page_name}/ui-strings")
async def get_ui_strings(
    page_name: str,
    request: Request,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get translated UI strings for a specific page
    
    Args:
        page_name: Name of the page
        request: Request object to get user language
        current_user: Authenticated user
    
    Returns:
        Dictionary of translated UI strings
    """
    # Get user language from middleware state or user preference
    target_language = getattr(request.state, 'user_language', current_user.preferred_language or 'en')
    
    try:
        ui_strings = await page_service.translate_ui_strings(page_name, target_language)
        return {
            "page_name": page_name,
            "language": target_language,
            "ui_strings": ui_strings
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get UI strings: {str(e)}"
        )


@router.post("/translate-content")
async def translate_custom_content(
    content: Dict[str, Any],
    request: Request,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Translate custom content based on user's language preference
    
    Args:
        content: Custom content to translate (JSON structure)
        request: Request object to get user language
        current_user: Authenticated user
    
    Returns:
        Translated content
    """
    # Get user language from middleware state or user preference
    target_language = getattr(request.state, 'user_language', current_user.preferred_language or 'en')
    
    if target_language == "en":
        return {
            "language": target_language,
            "translated_content": content,
            "message": "No translation needed (already English)"
        }
    
    try:
        translated_content = await page_service.translate_page_content(
            content=content,
            target_language=target_language,
            source_language="en"
        )
        
        return {
            "language": target_language,
            "translated_content": translated_content,
            "message": f"Content translated to {target_language}"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to translate content: {str(e)}"
        )


@router.post("/clear-translation-cache")
async def clear_translation_cache(current_user: UserResponse = Depends(get_current_user)):
    """Clear the translation cache (admin function)"""
    page_service.clear_cache()
    return {"message": "Translation cache cleared successfully"}

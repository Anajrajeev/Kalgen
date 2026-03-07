from typing import Dict, Any, Optional
from fastapi import HTTPException
from app.services.translate_service import TranslateService
import json
import hashlib


class PageTranslationService:
    """Service for translating page content based on user preferences"""
    
    def __init__(self):
        self.translate_service = TranslateService()
        # Cache for translated content
        self._translation_cache: Dict[str, Dict[str, Any]] = {}
    
    def _get_cache_key(self, content: str, target_lang: str) -> str:
        """Generate cache key for translated content"""
        content_hash = hashlib.md5(content.encode()).hexdigest()
        return f"{content_hash}_{target_lang}"
    
    async def translate_page_content(
        self, 
        content: Dict[str, Any], 
        target_language: str = "en",
        source_language: str = "en"
    ) -> Dict[str, Any]:
        """
        Translate page content dictionary
        
        Args:
            content: Dictionary containing page content (strings, nested dicts, lists)
            target_language: Target language code (en/hi/mr)
            source_language: Source language code (default: en)
        
        Returns:
            Translated content dictionary with same structure
        """
        if target_language == source_language:
            return content
        
        cache_key = self._get_cache_key(json.dumps(content, sort_keys=True), target_language)
        
        # Check cache first
        if cache_key in self._translation_cache:
            return self._translation_cache[cache_key]
        
        try:
            translated_content = await self._translate_recursive(content, source_language, target_language)
            
            # Cache the result
            self._translation_cache[cache_key] = translated_content
            
            return translated_content
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to translate page content: {str(e)}"
            )
    
    async def _translate_recursive(
        self, 
        data: Any, 
        source_lang: str, 
        target_lang: str
    ) -> Any:
        """Recursively translate data structure"""
        
        if isinstance(data, str):
            # Only translate non-empty strings longer than 1 character
            if len(data.strip()) > 1 and not data.startswith('http'):
                try:
                    return await self.translate_service.translate_text_async(
                        text=data,
                        source_language=source_lang,
                        target_language=target_lang
                    )
                except Exception:
                    # If translation fails, return original text
                    return data
            return data
            
        elif isinstance(data, dict):
            translated_dict = {}
            for key, value in data.items():
                # Don't translate keys, only values
                translated_dict[key] = await self._translate_recursive(value, source_lang, target_lang)
            return translated_dict
            
        elif isinstance(data, list):
            translated_list = []
            for item in data:
                translated_list.append(await self._translate_recursive(item, source_lang, target_lang))
            return translated_list
            
        else:
            # Return numbers, booleans, None as-is
            return data
    
    async def translate_ui_strings(
        self, 
        page_name: str, 
        target_language: str = "en"
    ) -> Dict[str, str]:
        """
        Get translated UI strings for a specific page
        
        Args:
            page_name: Name of the page (e.g., 'dashboard', 'profile', 'settings')
            target_language: Target language code
        
        Returns:
            Dictionary of translated UI strings
        """
        
        # Define UI strings for different pages
        ui_strings = {
            "dashboard": {
                "welcome": "Welcome to AgriNiti Dashboard",
                "total_crops": "Total Crops",
                "weather": "Weather Information",
                "market_prices": "Market Prices",
                "recommendations": "Recommendations",
                "view_details": "View Details",
                "last_updated": "Last Updated"
            },
            "profile": {
                "profile_title": "My Profile",
                "personal_info": "Personal Information",
                "name": "Name",
                "email": "Email",
                "phone": "Phone Number",
                "preferred_language": "Preferred Language",
                "save_changes": "Save Changes",
                "update_profile": "Update Profile"
            },
            "settings": {
                "settings_title": "Settings",
                "language_settings": "Language Settings",
                "notification_settings": "Notification Settings",
                "account_settings": "Account Settings",
                "privacy_settings": "Privacy Settings",
                "save": "Save",
                "cancel": "Cancel"
            }
        }
        
        page_strings = ui_strings.get(page_name, {})
        
        if target_language == "en":
            return page_strings
        
        # Translate each string
        translated_strings = {}
        for key, value in page_strings.items():
            try:
                translated_strings[key] = await self.translate_service.translate_text_async(
                    text=value,
                    source_language="en",
                    target_language=target_language
                )
            except Exception:
                # Fallback to original string if translation fails
                translated_strings[key] = value
        
        return translated_strings
    
    def clear_cache(self):
        """Clear translation cache"""
        self._translation_cache.clear()

"""
Translation Service for Multilingual RAG System
Supports AWS Translate and Google Translate
"""

import boto3
from typing import Optional, Dict, Any
from app.agree_utils.config import settings


class TranslationService:
    """Service for translating text between languages using AWS Translate"""
    
    def __init__(self):
        """Initialize AWS Translate and Comprehend clients"""
        self.translate_client = boto3.client(
            'translate',
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key,
            aws_secret_access_key=settings.aws_secret_key
        )
        
        self.comprehend_client = boto3.client(
            'comprehend',
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key,
            aws_secret_access_key=settings.aws_secret_key
        )
    
    def detect_language(self, text: str) -> Dict[str, Any]:
        """
        Detect the language of input text
        
        Args:
            text: Text to analyze
            
        Returns:
            Dict containing detected language and confidence
        """
        try:
            response = self.comprehend_client.detect_dominant_language(Text=text)
            
            languages = response.get('Languages', [])
            if languages:
                primary_language = languages[0]
                return {
                    'success': True,
                    'language_code': primary_language.get('LanguageCode'),
                    'confidence': primary_language.get('Score', 0.0),
                    'all_languages': languages
                }
            else:
                return {
                    'success': False,
                    'error': 'Could not detect language'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f"Language detection error: {str(e)}"
            }
    
    def translate_text(
        self, 
        text: str, 
        source_language: str, 
        target_language: str
    ) -> Dict[str, Any]:
        """
        Translate text from source to target language
        
        Args:
            text: Text to translate
            source_language: Source language code (e.g., 'en', 'hi', 'es')
            target_language: Target language code (e.g., 'en', 'hi', 'es')
            
        Returns:
            Dict containing translated text and metadata
        """
        # Map common language names to ISO codes
        language_mapping = {
            'hindi': 'hi',
            'english': 'en',
            'spanish': 'es',
            'french': 'fr',
            'german': 'de',
            'italian': 'it',
            'portuguese': 'pt',
            'japanese': 'ja',
            'chinese': 'zh',
            'korean': 'ko',
            'arabic': 'ar',
            'russian': 'ru',
            'hindi-us': 'hi',  # Add mapping for detected language
            'hindi-in': 'hi'   # Add mapping for detected language
        }
        
        # Map to ISO codes
        source_lang = language_mapping.get(source_language.lower(), source_language)
        target_lang = language_mapping.get(target_language.lower(), target_language)
        
        if source_lang == target_lang:
            return {
                'success': True,
                'translated_text': text,
                'source_language': source_lang,
                'target_language': target_lang,
                'confidence': 1.0
            }
        
        try:
            response = self.translate_client.translate_text(
                Text=text,
                SourceLanguageCode=source_lang,
                TargetLanguageCode=target_lang,
                Settings={
                    'Formality': 'FORMAL'  # Use formal tone for agricultural content
                }
            )
            
            return {
                'success': True,
                'translated_text': response.get('TranslatedText'),
                'source_language': source_lang,
                'target_language': target_lang,
                'confidence': response.get('ConfidenceScore', 0.0)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"Translation error: {str(e)}"
            }
    
    def translate_to_english(self, text: str, source_language: Optional[str] = None) -> Dict[str, Any]:
        """
        Convenience method to translate text to English
        
        Args:
            text: Text to translate
            source_language: Optional source language (auto-detect if None)
            
        Returns:
            Dict containing translation results
        """
        if source_language is None:
            # Auto-detect language first
            detection_result = self.detect_language(text)
            if not detection_result['success']:
                return detection_result
            
            source_language = detection_result['language_code']
        
        return self.translate_text(text, source_language, 'en')
    
    def translate_from_english(self, text: str, target_language: str) -> Dict[str, Any]:
        """
        Convenience method to translate from English to target language
        
        Args:
            text: English text to translate
            target_language: Target language code
            
        Returns:
            Dict containing translation results
        """
        return self.translate_text(text, 'en', target_language)
    
    def get_supported_languages(self) -> Dict[str, str]:
        """Get list of supported language pairs for translation"""
        return {
            'en': 'English',
            'hi': 'Hindi',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ja': 'Japanese',
            'zh': 'Chinese (Simplified)',
            'zh-TW': 'Chinese (Traditional)',
            'ko': 'Korean',
            'ar': 'Arabic',
            'ru': 'Russian',
            'tr': 'Turkish',
            'pl': 'Polish',
            'nl': 'Dutch',
            'sv': 'Swedish',
            'da': 'Danish',
            'no': 'Norwegian',
            'fi': 'Finnish',
            'he': 'Hebrew',
            'th': 'Thai',
            'vi': 'Vietnamese',
            'id': 'Indonesian',
            'ms': 'Malay',
            'tl': 'Filipino',
            'uk': 'Ukrainian',
            'el': 'Greek',
            'cs': 'Czech',
            'hu': 'Hungarian',
            'ro': 'Romanian',
            'bg': 'Bulgarian',
            'hr': 'Croatian',
            'sk': 'Slovak',
            'sl': 'Slovenian',
            'et': 'Estonian',
            'lv': 'Latvian',
            'lt': 'Lithuanian'
        }
    
    def is_language_supported(self, language_code: str) -> bool:
        """Check if a language code is supported"""
        supported_languages = self.get_supported_languages()
        return language_code in supported_languages
    
    def translate_agricultural_terms(
        self, 
        text: str, 
        source_language: str, 
        target_language: str
    ) -> Dict[str, Any]:
        """
        Translate text with agricultural terminology preservation
        
        Args:
            text: Agricultural text to translate
            source_language: Source language code
            target_language: Target language code
            
        Returns:
            Dict containing translated text with preserved agricultural terms
        """
        # First perform standard translation
        translation_result = self.translate_text(text, source_language, target_language)
        
        if not translation_result['success']:
            return translation_result
        
        translated_text = translation_result['translated_text']
        
        # TODO: Implement agricultural terminology preservation
        # This could involve:
        # 1. Creating a dictionary of agricultural terms
        # 2. Identifying terms in the original text
        # 3. Ensuring proper translation of technical terms
        # 4. Adding context-specific translations
        
        return translation_result


# Alternative implementation using Google Translate
class GoogleTranslationService:
    """Alternative service using Google Translate"""
    
    def __init__(self):
        """Initialize Google Translate client"""
        try:
            from google.cloud import translate_v2 as translate
            self.client = translate.Client()
        except ImportError:
            raise ImportError("Google Cloud Translate library not installed")
    
    def detect_language(self, text: str) -> Dict[str, Any]:
        """Detect language using Google Translate"""
        try:
            result = self.client.detect_language(text)
            return {
                'success': True,
                'language_code': result['language'],
                'confidence': result.get('confidence', 0.0)
            }
        except Exception as e:
            return {
                'success': False,
                'error': f"Google language detection error: {str(e)}"
            }
    
    def translate_text(
        self, 
        text: str, 
        source_language: str, 
        target_language: str
    ) -> Dict[str, Any]:
        """Translate text using Google Translate"""
        if source_language == target_language:
            return {
                'success': True,
                'translated_text': text,
                'source_language': source_language,
                'target_language': target_language,
                'confidence': 1.0
            }
        
        try:
            result = self.client.translate(
                text,
                source_language=source_language,
                target_language=target_language
            )
            
            return {
                'success': True,
                'translated_text': result['translatedText'],
                'source_language': source_language,
                'target_language': target_language,
                'confidence': 1.0  # Google doesn't provide confidence scores
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"Google translation error: {str(e)}"
            }

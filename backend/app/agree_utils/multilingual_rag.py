"""
Multilingual RAG Service
Integrates Speech-to-Text, Translation, RAG, and Text-to-Speech
"""

import asyncio
import time
from typing import Optional, Dict, Any, Tuple
from app.agree_utils.speech_to_text import SpeechToTextService
from app.agree_utils.translation import TranslationService
from app.agree_utils.text_to_speech import TextToSpeechService
from app.agree_utils.rag import RAGSystem


class MultilingualRAGService:
    """Integrated multilingual RAG service with speech capabilities"""
    
    def __init__(self, use_google_services: bool = False):
        """Initialize all service components"""
        # Initialize speech services
        if use_google_services:
            self.stt_service = GoogleSpeechToTextService()
            self.translation_service = GoogleTranslationService()
            self.tts_service = GoogleTextToSpeechService()
        else:
            self.stt_service = SpeechToTextService()
            self.translation_service = TranslationService()
            self.tts_service = TextToSpeechService()
        
        # Initialize RAG system
        self.rag_system = RAGSystem(collection_name="kb_collection", embed_dim=512, require_bedrock=True)
        
        # Cache for translation results
        self.translation_cache = {}
    
    async def process_speech_query(
        self, 
        audio_data: bytes, 
        source_language: str = "auto",
        target_language: str = "auto",
        voice_preference: Optional[str] = None,
        return_text: bool = False
    ) -> Dict[str, Any]:
        """
        Complete speech-to-speech RAG pipeline
        
        Args:
            audio_data: Audio file bytes
            source_language: Source language code or "auto" for detection
            target_language: Response language code or "auto" to match source
            voice_preference: Preferred voice for TTS
            return_text: Whether to return text instead of audio
            
        Returns:
            Dict containing complete query results
        """
        start_time = time.time()
        processing_steps = []
        
        try:
            # Step 1: Speech-to-Text
            processing_steps.append("speech_to_text")
            stt_result = await self._transcribe_audio(audio_data, source_language)
            
            if not stt_result['success']:
                return self._create_error_response("Speech-to-Text failed", stt_result['error'], processing_steps)
            
            transcribed_text = stt_result['text']
            detected_language = stt_result.get('language_code', 'en-US')
            
            # Use detected language if source is auto
            if source_language == "auto":
                source_language = detected_language.split('-')[0]  # Extract language code
            
            # Use source language for target if auto
            if target_language == "auto":
                target_language = source_language
            
            # Step 2: Translate to English for RAG processing
            processing_steps.append("translate_to_english")
            if source_language != "en":
                translation_result = self.translation_service.translate_to_english(transcribed_text, source_language)
                if not translation_result['success']:
                    return self._create_error_response("Translation to English failed", translation_result['error'], processing_steps)
                english_text = translation_result['translated_text']
            else:
                english_text = transcribed_text
            
            # Step 3: RAG Query
            processing_steps.append("rag_query")
            rag_result = await self._query_rag(english_text)
            
            if not rag_result['success']:
                return self._create_error_response("RAG query failed", rag_result['error'], processing_steps)
            
            rag_response = rag_result['answer']
            context = rag_result['context']
            
            # Step 4: Translate response back to user language
            processing_steps.append("translate_response")
            if target_language != "en":
                response_translation = self.translation_service.translate_from_english(rag_response, target_language)
                if not response_translation['success']:
                    # Fall back to English response
                    translated_response = rag_response
                    target_language = "en"
                else:
                    translated_response = response_translation['translated_text']
            else:
                translated_response = rag_response
            
            # Step 5: Text-to-Speech (if not returning text)
            processing_steps.append("text_to_speech")
            if not return_text:
                tts_result = await self._synthesize_speech(translated_response, target_language, voice_preference)
                if not tts_result['success']:
                    return self._create_error_response("Text-to-Speech failed", tts_result['error'], processing_steps)
                audio_data = tts_result['audio_data']
                content_type = tts_result['content_type']
            else:
                audio_data = None
                content_type = None
            
            # Calculate processing time
            processing_time = time.time() - start_time
            
            # Create success response
            return {
                'success': True,
                'processing_steps': processing_steps,
                'processing_time': processing_time,
                'transcribed_text': transcribed_text,
                'detected_language': detected_language,
                'source_language': source_language,
                'target_language': target_language,
                'english_query': english_text,
                'rag_response': rag_response,
                'translated_response': translated_response,
                'context': context,
                'audio_data': audio_data,
                'content_type': content_type,
                'return_text': return_text,
                'confidence_scores': {
                    'stt_confidence': stt_result.get('confidence', 0.0),
                    'translation_confidence': translation_result.get('confidence', 0.0) if source_language != 'en' else 1.0,
                    'tts_quality': 'neural' if audio_data else None
                }
            }
            
        except Exception as e:
            return self._create_error_response("Pipeline error", str(e), processing_steps)
    
    async def _transcribe_audio(self, audio_data: bytes, language: str) -> Dict[str, Any]:
        """Transcribe audio to text"""
        if language == "auto":
            # Try with English first, then detect language
            result = await self.stt_service.transcribe_audio_file(audio_data, "en-US")
            if result['success'] and result['confidence'] > 0.7:
                return result
            
            # Try other common languages
            for lang in ["hi-IN", "es-US", "fr-FR", "de-DE"]:
                result = await self.stt_service.transcribe_audio_file(audio_data, lang)
                if result['success'] and result['confidence'] > 0.7:
                    return result
            
            # Fall back to English
            return await self.stt_service.transcribe_audio_file(audio_data, "en-US")
        else:
            return await self.stt_service.transcribe_audio_file(audio_data, f"{language}-US")
    
    async def _query_rag(self, query: str) -> Dict[str, Any]:
        """Query the RAG system"""
        try:
            answer, context = self.rag_system.query(query, return_context=True)
            return {
                'success': True,
                'answer': answer,
                'context': context
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def _synthesize_speech(
        self, 
        text: str, 
        language: str, 
        voice_preference: Optional[str] = None
    ) -> Dict[str, Any]:
        """Convert text to speech"""
        # Map language codes to AWS Polly language codes
        language_mapping = {
            'en': 'en-US',
            'hi': 'hi-IN',
            'es': 'es-ES',
            'fr': 'fr-FR',
            'de': 'de-DE',
            'it': 'it-IT',
            'pt': 'pt-BR',
            'ja': 'ja-JP',
            'zh': 'zh-CN',
            'ko': 'ko-KR',
            'ar': 'ar-SA',
            'ru': 'ru-RU'
        }
        
        language_code = language_mapping.get(language, 'en-US')
        
        if voice_preference:
            return self.tts_service.synthesize_speech(text, language_code, voice_preference)
        else:
            return self.tts_service.synthesize_speech(text, language_code)
    
    def _create_error_response(self, error_type: str, error_message: str, processing_steps: list) -> Dict[str, Any]:
        """Create standardized error response"""
        return {
            'success': False,
            'error_type': error_type,
            'error_message': error_message,
            'processing_steps': processing_steps,
            'processing_time': time.time(),
            'transcribed_text': None,
            'detected_language': None,
            'rag_response': None,
            'translated_response': None,
            'audio_data': None,
            'context': None
        }
    
    async def process_text_query(
        self, 
        text: str, 
        source_language: str = "auto",
        target_language: str = "auto",
        return_audio: bool = False,
        voice_preference: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process text-based multilingual RAG query
        
        Args:
            text: Input text query
            source_language: Source language code or "auto" for detection
            target_language: Response language code or "auto" to match source
            return_audio: Whether to return audio response
            voice_preference: Preferred voice for TTS
            
        Returns:
            Dict containing query results
        """
        start_time = time.time()
        processing_steps = []
        
        try:
            # Step 1: Detect language if auto
            processing_steps.append("language_detection")
            if source_language == "auto":
                detection_result = self.translation_service.detect_language(text)
                if detection_result['success']:
                    source_language = detection_result['language_code']
                else:
                    source_language = "en"  # Default to English
            
            # Use source language for target if auto
            if target_language == "auto":
                target_language = source_language
            
            # Step 2: Translate to English for RAG processing
            processing_steps.append("translate_to_english")
            if source_language != "en":
                translation_result = self.translation_service.translate_to_english(text, source_language)
                if not translation_result['success']:
                    return self._create_error_response("Translation to English failed", translation_result['error'], processing_steps)
                english_text = translation_result['translated_text']
            else:
                english_text = text
            
            # Step 3: RAG Query
            processing_steps.append("rag_query")
            rag_result = await self._query_rag(english_text)
            
            if not rag_result['success']:
                return self._create_error_response("RAG query failed", rag_result['error'], processing_steps)
            
            rag_response = rag_result['answer']
            context = rag_result['context']
            
            # Step 4: Translate response back to user language
            processing_steps.append("translate_response")
            if target_language != "en":
                response_translation = self.translation_service.translate_from_english(rag_response, target_language)
                if not response_translation['success']:
                    translated_response = rag_response
                    target_language = "en"
                else:
                    translated_response = response_translation['translated_text']
            else:
                translated_response = rag_response
            
            # Step 5: Text-to-Speech (if requested)
            processing_steps.append("text_to_speech")
            if return_audio:
                tts_result = await self._synthesize_speech(translated_response, target_language, voice_preference)
                if not tts_result['success']:
                    return self._create_error_response("Text-to-Speech failed", tts_result['error'], processing_steps)
                audio_data = tts_result['audio_data']
                content_type = tts_result['content_type']
            else:
                audio_data = None
                content_type = None
            
            processing_time = time.time() - start_time
            
            return {
                'success': True,
                'processing_steps': processing_steps,
                'processing_time': processing_time,
                'source_language': source_language,
                'target_language': target_language,
                'english_query': english_text,
                'rag_response': rag_response,
                'translated_response': translated_response,
                'context': context,
                'audio_data': audio_data,
                'content_type': content_type,
                'return_audio': return_audio
            }
            
        except Exception as e:
            return self._create_error_response("Text query error", str(e), processing_steps)
    
    def get_supported_languages(self) -> Dict[str, str]:
        """Get all supported languages for the pipeline"""
        # Combine supported languages from all services
        stt_languages = self.stt_service.get_supported_languages()
        tts_languages = self.tts_service.get_supported_languages()
        translation_languages = self.translation_service.get_supported_languages()
        
        # Find intersection of all services
        common_languages = set(stt_languages.keys()) & set(tts_languages.keys()) & set(translation_languages.keys())
        
        return {lang: translation_languages[lang] for lang in common_languages}
    
    def get_service_status(self) -> Dict[str, Any]:
        """Get status of all service components"""
        return {
            'speech_to_text': {
                'service': 'AWS Transcribe' if isinstance(self.stt_service, SpeechToTextService) else 'Google Speech-to-Text',
                'supported_languages': len(self.stt_service.get_supported_languages()),
                'status': 'active'
            },
            'translation': {
                'service': 'AWS Translate' if isinstance(self.translation_service, TranslationService) else 'Google Translate',
                'supported_languages': len(self.translation_service.get_supported_languages()),
                'status': 'active'
            },
            'text_to_speech': {
                'service': 'AWS Polly' if isinstance(self.tts_service, TextToSpeechService) else 'Google TTS',
                'supported_languages': len(self.tts_service.get_supported_languages()),
                'status': 'active'
            },
            'rag_system': {
                'service': 'RAG with Bedrock',
                'status': 'active'
            },
            'pipeline_languages': len(self.get_supported_languages())
        }

"""
Speech Advisory Router
Multilingual RAG endpoints with speech capabilities
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import base64
import io
from typing import Optional, Dict, Any

from app.agree_utils.multilingual_rag import MultilingualRAGService

router = APIRouter()

# Global service instance
_multilingual_rag = None

def get_multilingual_rag():
    """Get or create multilingual RAG service instance"""
    global _multilingual_rag
    if _multilingual_rag is None:
        _multilingual_rag = MultilingualRAGService()
    return _multilingual_rag


class SpeechQueryRequest(BaseModel):
    language: str = "auto"
    target_language: str = "auto"
    return_text: bool = False
    voice_preference: Optional[str] = None


class TextQueryRequest(BaseModel):
    text: str
    language: str = "auto"
    target_language: str = "auto"
    return_audio: bool = False
    voice_preference: Optional[str] = None


class LanguageDetectionRequest(BaseModel):
    text: str


@router.post("/speech-query")
async def speech_query(
    audio_file: UploadFile = File(...),
    language: str = Form(default="auto"),
    target_language: str = Form(default="auto"),
    return_text: bool = Form(default=False),
    voice_preference: Optional[str] = Form(default=None)
):
    """
    Process speech query and return audio or text response
    
    Supports multilingual speech input and output with RAG processing.
    
    Args:
        audio_file: Audio file (wav, mp3, m4a, flac)
        language: Source language code or "auto" for detection
        target_language: Response language code or "auto" to match source
        return_text: Return text response instead of audio
        voice_preference: Preferred voice for TTS
    
    Returns:
        Complete speech query result with audio or text response
    """
    try:
        # Validate audio file
        if not audio_file.content_type or not audio_file.content_type.startswith('audio/'):
            raise HTTPException(
                status_code=400, 
                detail="File must be an audio file (wav, mp3, m4a, flac)"
            )
        
        # Check file size (max 25MB)
        audio_file.file.seek(0, 2)  # Seek to end
        file_size = audio_file.file.tell()
        audio_file.file.seek(0)  # Reset to start
        
        if file_size > 25 * 1024 * 1024:  # 25MB
            raise HTTPException(
                status_code=400,
                detail="Audio file size must be less than 25MB"
            )
        
        # Read audio data
        audio_data = await audio_file.read()
        
        # Process through multilingual RAG pipeline
        multilingual_rag = get_multilingual_rag()
        result = await multilingual_rag.process_speech_query(
            audio_data=audio_data,
            source_language=language,
            target_language=target_language,
            voice_preference=voice_preference,
            return_text=return_text
        )
        
        if not result['success']:
            raise HTTPException(
                status_code=500,
                detail=f"Speech query failed: {result.get('error_message', 'Unknown error')}"
            )
        
        # Return appropriate response format
        if return_text:
            return {
                'transcribed_text': result['transcribed_text'],
                'detected_language': result['detected_language'],
                'source_language': result['source_language'],
                'target_language': result['target_language'],
                'rag_response': result['rag_response'],
                'translated_response': result['translated_response'],
                'context': result['context'],
                'processing_time': result['processing_time'],
                'processing_steps': result['processing_steps'],
                'confidence_scores': result['confidence_scores']
            }
        else:
            # Return audio response
            audio_base64 = base64.b64encode(result['audio_data']).decode('utf-8')
            
            return {
                'transcribed_text': result['transcribed_text'],
                'detected_language': result['detected_language'],
                'source_language': result['source_language'],
                'target_language': result['target_language'],
                'rag_response': result['rag_response'],
                'translated_response': result['translated_response'],
                'audio_response': audio_base64,
                'content_type': result['content_type'],
                'processing_time': result['processing_time'],
                'processing_steps': result['processing_steps'],
                'confidence_scores': result['confidence_scores']
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Speech query processing failed: {str(e)}"
        )


@router.post("/text-query")
async def text_query(request: TextQueryRequest):
    """
    Process text query with multilingual support and optional audio response
    
    Args:
        text: Input text query
        language: Source language code or "auto" for detection
        target_language: Response language code or "auto" to match source
        return_audio: Whether to return audio response
        voice_preference: Preferred voice for TTS
    
    Returns:
        Complete text query result with optional audio response
    """
    try:
        # Validate input
        if not request.text or len(request.text.strip()) == 0:
            raise HTTPException(
                status_code=400,
                detail="Text query cannot be empty"
            )
        
        if len(request.text) > 5000:  # Max 5000 characters
            raise HTTPException(
                status_code=400,
                detail="Text query must be less than 5000 characters"
            )
        
        # Process through multilingual RAG pipeline
        multilingual_rag = get_multilingual_rag()
        result = await multilingual_rag.process_text_query(
            text=request.text,
            source_language=request.language,
            target_language=request.target_language,
            return_audio=request.return_audio,
            voice_preference=request.voice_preference
        )
        
        if not result['success']:
            raise HTTPException(
                status_code=500,
                detail=f"Text query failed: {result.get('error_message', 'Unknown error')}"
            )
        
        # Return appropriate response format
        if request.return_audio:
            audio_base64 = base64.b64encode(result['audio_data']).decode('utf-8')
            return {
                'source_language': result['source_language'],
                'target_language': result['target_language'],
                'english_query': result['english_query'],
                'rag_response': result['rag_response'],
                'translated_response': result['translated_response'],
                'audio_response': audio_base64,
                'content_type': result['content_type'],
                'processing_time': result['processing_time'],
                'processing_steps': result['processing_steps']
            }
        else:
            return {
                'source_language': result['source_language'],
                'target_language': result['target_language'],
                'english_query': result['english_query'],
                'rag_response': result['rag_response'],
                'translated_response': result['translated_response'],
                'context': result['context'],
                'processing_time': result['processing_time'],
                'processing_steps': result['processing_steps']
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Text query processing failed: {str(e)}"
        )


@router.post("/detect-language")
async def detect_language(request: LanguageDetectionRequest):
    """
    Detect the language of input text
    
    Args:
        text: Text to analyze
    
    Returns:
        Detected language and confidence score
    """
    try:
        if not request.text or len(request.text.strip()) == 0:
            raise HTTPException(
                status_code=400,
                detail="Text cannot be empty"
            )
        
        multilingual_rag = get_multilingual_rag()
        result = multilingual_rag.translation_service.detect_language(request.text)
        
        if not result['success']:
            raise HTTPException(
                status_code=500,
                detail=f"Language detection failed: {result['error']}"
            )
        
        return {
            'detected_language': result['language_code'],
            'confidence': result['confidence'],
            'all_languages': result.get('all_languages', [])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Language detection failed: {str(e)}"
        )


@router.get("/supported-languages")
async def get_supported_languages():
    """
    Get list of supported languages for the speech pipeline
    
    Returns:
        Dictionary of supported language codes and names
    """
    try:
        multilingual_rag = get_multilingual_rag()
        languages = multilingual_rag.get_supported_languages()
        
        return {
            'supported_languages': languages,
            'total_languages': len(languages),
            'services': {
                'speech_to_text': 'AWS Transcribe',
                'translation': 'AWS Translate',
                'text_to_speech': 'AWS Polly'
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get supported languages: {str(e)}"
        )


@router.get("/available-voices")
async def get_available_voices(language_code: Optional[str] = None):
    """
    Get list of available voices for text-to-speech
    
    Args:
        language_code: Optional language filter
    
    Returns:
        List of available voices
    """
    try:
        multilingual_rag = get_multilingual_rag()
        voices = multilingual_rag.tts_service.get_available_voices(language_code)
        
        return {
            'available_voices': voices,
            'total_voices': len(voices),
            'language_filter': language_code
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get available voices: {str(e)}"
        )


@router.get("/service-status")
async def get_service_status():
    """
    Get status of all speech and translation services
    
    Returns:
        Status of all service components
    """
    try:
        multilingual_rag = get_multilingual_rag()
        status = multilingual_rag.get_service_status()
        
        return status
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get service status: {str(e)}"
        )


@router.post("/translate-text")
async def translate_text(
    text: str = Form(...),
    source_language: str = Form(...),
    target_language: str = Form(...)
):
    """
    Translate text between languages
    
    Args:
        text: Text to translate
        source_language: Source language code
        target_language: Target language code
    
    Returns:
        Translated text and metadata
    """
    try:
        if not text or len(text.strip()) == 0:
            raise HTTPException(
                status_code=400,
                detail="Text cannot be empty"
            )
        
        multilingual_rag = get_multilingual_rag()
        result = multilingual_rag.translation_service.translate_text(
            text=text,
            source_language=source_language,
            target_language=target_language
        )
        
        if not result['success']:
            raise HTTPException(
                status_code=500,
                detail=f"Translation failed: {result['error']}"
            )
        
        return {
            'source_language': source_language,
            'target_language': target_language,
            'original_text': text,
            'translated_text': result['translated_text'],
            'confidence': result.get('confidence', 0.0)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Translation failed: {str(e)}"
        )


@router.post("/synthesize-speech")
async def synthesize_speech(
    text: str = Form(...),
    language: str = Form(default="en"),
    voice_id: Optional[str] = Form(default=None)
):
    """
    Convert text to speech
    
    Args:
        text: Text to convert
        language: Language code
        voice_id: Optional specific voice ID
    
    Returns:
        Audio data in base64 format
    """
    try:
        if not text or len(text.strip()) == 0:
            raise HTTPException(
                status_code=400,
                detail="Text cannot be empty"
            )
        
        if len(text) > 3000:  # Max 3000 characters for TTS
            raise HTTPException(
                status_code=400,
                detail="Text must be less than 3000 characters for speech synthesis"
            )
        
        multilingual_rag = get_multilingual_rag()
        # Extract language code from full language code (e.g., 'hi-IN' -> 'hi')
        language_code = language.split('-')[0] if '-' in language else language
        result = await multilingual_rag._synthesize_speech(text, language_code, voice_id)
        
        if not result['success']:
            raise HTTPException(
                status_code=500,
                detail=f"Speech synthesis failed: {result['error']}"
            )
        
        audio_base64 = base64.b64encode(result['audio_data']).decode('utf-8')
        
        return {
            'text': text,
            'language': language,
            'voice_id': result.get('voice_id'),
            'audio_response': audio_base64,
            'content_type': result['content_type']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Speech synthesis failed: {str(e)}"
        )

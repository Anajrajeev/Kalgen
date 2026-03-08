"""
Simple Speech Advisory Router - Only Speech Query Endpoint
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import base64
import io
from typing import Optional, Dict, Any

from app.agree_utils.multilingual_rag import MultilingualRAGService

# Global service instance
_multilingual_rag = None

def get_multilingual_rag():
    """Get or create multilingual RAG service instance"""
    global _multilingual_rag
    if _multilingual_rag is None:
        _multilingual_rag = MultilingualRAGService()
    return _multilingual_rag

# Request/Response models
class SpeechQueryRequest(BaseModel):
    audio_file: UploadFile = File(...)
    language: Optional[str] = "auto"
    target_language: str

class SpeechQueryResponse(BaseModel):
    success: bool
    transcribed_text: Optional[str] = None
    detected_language: Optional[str] = None
    rag_response: Optional[str] = None
    translated_response: Optional[str] = None
    audio_response: Optional[str] = None
    processing_time: Optional[float] = None
    processing_steps: Optional[list] = None
    confidence_scores: Optional[Dict[str, Any]] = None

# Create router
router = APIRouter()

@router.post("/speech-advisory/speech-query")
async def speech_query(
    audio_file: UploadFile = File(...),
    language: Optional[str] = Form(None),
    target_language: Optional[str] = Form(None)
):
    """Complete speech-to-speech pipeline"""
    try:
        # Get service instance
        service = get_multilingual_rag()
        
        # Read audio file
        audio_data = await audio_file.read()
        
        # Get form data
        form_data = await audio_file.form()
        language = form_data.get("language", "auto")
        target_language = form_data.get("target_language", "en")
        
        # Process speech query
        result = await service.process_speech_query(
            audio_data=audio_data,
            language=language,
            target_language=target_language,
            return_audio=True,
            return_text=True
        )
        
        return SpeechQueryResponse(
            success=result.get('success', False),
            transcribed_text=result.get('transcribed_text'),
            detected_language=result.get('detected_language'),
            rag_response=result.get('rag_response'),
            translated_response=result.get('translated_response'),
            audio_response=result.get('audio_response'),
            processing_time=result.get('processing_time'),
            processing_steps=result.get('processing_steps'),
            confidence_scores=result.get('confidence_scores')
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Speech query failed: {str(e)}"
        )

@router.get("/service-status")
async def service_status():
    """Get service health status"""
    try:
        service = get_multilingual_rag()
        status = service.get_service_status()
        return status
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Service status check failed: {str(e)}"
        )

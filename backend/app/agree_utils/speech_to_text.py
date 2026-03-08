"""
Speech-to-Text Service for RAG System
Supports AWS Transcribe and Google Speech-to-Text
"""

import boto3
import json
import time
import os
import tempfile
from typing import Optional, Dict, Any
from app.agree_utils.config import settings


class SpeechToTextService:
    """Service for converting speech to text using AWS Transcribe"""
    
    def __init__(self):
        """Initialize AWS Transcribe client"""
        self.transcribe_client = boto3.client(
            'transcribe',
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key,
            aws_secret_access_key=settings.aws_secret_key
        )
    
    async def transcribe_audio_file(
        self, 
        audio_data: bytes, 
        language_code: str = "en-US",
        job_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Transcribe audio file using AWS Transcribe streaming
        
        Args:
            audio_data: Audio file bytes
            language_code: Language code (en-US, hi-IN, es-ES, etc.)
            job_name: Optional custom job name
            
        Returns:
            Dict containing transcribed text and metadata
        """
        try:
            # For now, return a mock transcription for testing
            # In production, this would use AWS Transcribe streaming
            if language_code.startswith('hi'):
                mock_text = "किसान सम्मान योजना क्या है और इसके लाभ क्या हैं?"
            elif language_code.startswith('es'):
                mock_text = "¿Qué es el esquema Kisan Samman y cuáles son sus beneficios?"
            else:
                mock_text = "What is Kisan Samman scheme and what are its benefits?"
            
            return {
                'success': True,
                'text': mock_text,
                'language_code': language_code,
                'confidence': 0.95,
                'job_name': job_name or 'mock-transcription',
                'processing_time': 1.5,
                'note': 'Mock transcription for testing - replace with AWS Transcribe streaming'
            }
                
        except Exception as e:
            return {
                'success': False,
                'error': f"Transcription error: {str(e)}"
            }
    
    def _wait_for_transcription(self, job_name: str, max_wait_time: int = 300) -> Dict:
        """Wait for transcription job to complete"""
        start_time = time.time()
        
        while time.time() - start_time < max_wait_time:
            response = self.transcribe_client.get_transcription_job(
                TranscriptionJobName=job_name
            )
            
            status = response['TranscriptionJob']['TranscriptionJobStatus']
            
            if status in ['COMPLETED', 'FAILED']:
                return response
            
            time.sleep(5)  # Wait 5 seconds before checking again
        
        raise TimeoutError(f"Transcription job {job_name} timed out")
    
    def _parse_transcript_results(self, transcript_url: str) -> str:
        """Parse transcript results from URL"""
        import requests
        
        response = requests.get(transcript_url)
        transcript_data = response.json()
        
        # Extract the actual transcript text
        results = transcript_data.get('results', {})
        transcripts = results.get('transcripts', [])
        
        if transcripts:
            return transcripts[0].get('transcript', '')
        
        return ""
    
    def _get_confidence_score(self, transcription_result: Dict) -> float:
        """Calculate average confidence score from transcription"""
        try:
            results = transcription_result['TranscriptionJob']['Transcript'].get('results', {})
            items = results.get('items', [])
            
            if not items:
                return 0.0
            
            total_confidence = 0.0
            total_items = 0
            
            for item in items:
                alternatives = item.get('alternatives', [])
                if alternatives:
                    total_confidence += alternatives[0].get('confidence', 0.0)
                    total_items += 1
            
            return total_confidence / total_items if total_items > 0 else 0.0
            
        except Exception:
            return 0.0
    
    def get_supported_languages(self) -> Dict[str, str]:
        """Get list of supported languages for transcription"""
        return {
            'en-US': 'English (US)',
            'en-GB': 'English (UK)',
            'hi-IN': 'Hindi (India)',
            'es-ES': 'Spanish (Spain)',
            'es-US': 'Spanish (US)',
            'fr-FR': 'French (France)',
            'de-DE': 'German (Germany)',
            'it-IT': 'Italian (Italy)',
            'pt-BR': 'Portuguese (Brazil)',
            'ja-JP': 'Japanese (Japan)',
            'zh-CN': 'Chinese (Mandarin)',
            'ko-KR': 'Korean (South Korea)',
            'ar-SA': 'Arabic (Saudi Arabia)',
            'ru-RU': 'Russian (Russia)'
        }
    
    async def transcribe_real_time(self, audio_stream: bytes, language_code: str = "en-US") -> Dict[str, Any]:
        """
        Real-time transcription (placeholder for future implementation)
        This would use AWS Transcribe Streaming or similar service
        """
        # TODO: Implement real-time transcription using streaming
        return {
            'success': False,
            'error': 'Real-time transcription not yet implemented'
        }


# Alternative implementation using Google Speech-to-Text
class GoogleSpeechToTextService:
    """Alternative service using Google Speech-to-Text"""
    
    def __init__(self):
        """Initialize Google Speech-to-Text client"""
        try:
            from google.cloud import speech
            self.client = speech.SpeechClient()
        except ImportError:
            raise ImportError("Google Cloud Speech library not installed")
    
    async def transcribe_audio_file(
        self, 
        audio_data: bytes, 
        language_code: str = "en-US"
    ) -> Dict[str, Any]:
        """Transcribe audio using Google Speech-to-Text"""
        try:
            # Configure audio and recognition settings
            audio = speech.RecognitionAudio(content=audio_data)
            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.ENCODING_AUTO,
                language_code=language_code,
                enable_automatic_punctuation=True,
                model="latest_short"
            )
            
            # Perform transcription
            response = self.client.recognize(config=config, audio=audio)
            
            # Extract transcript
            transcript = ""
            confidence = 0.0
            
            for result in response.results:
                transcript += result.alternatives[0].transcript
                confidence += result.alternatives[0].confidence
            
            avg_confidence = confidence / len(response.results) if response.results else 0.0
            
            return {
                'success': True,
                'text': transcript,
                'language_code': language_code,
                'confidence': avg_confidence,
                'processing_time': 0.0  # Google provides this directly
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"Google Speech-to-Text error: {str(e)}"
            }

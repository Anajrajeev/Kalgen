"""
Text-to-Speech Service for RAG System
Supports AWS Polly and Google Text-to-Speech
"""

import boto3
import io
from typing import Optional, Dict, Any, List
from app.agree_utils.config import settings


class TextToSpeechService:
    """Service for converting text to speech using AWS Polly"""
    
    def __init__(self):
        """Initialize AWS Polly client"""
        self.polly_client = boto3.client(
            'polly',
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key,
            aws_secret_access_key=settings.aws_secret_key
        )
    
    def synthesize_speech(
        self, 
        text: str, 
        language_code: str = "en-US",
        voice_id: Optional[str] = None,
        output_format: str = "mp3"
    ) -> Dict[str, Any]:
        """
        Convert text to speech using AWS Polly
        
        Args:
            text: Text to convert to speech
            language_code: Language code (en-US, hi-IN, es-ES, etc.)
            voice_id: Optional specific voice ID
            output_format: Audio output format (mp3, ogg_vorbis, pcm)
            
        Returns:
            Dict containing audio data and metadata
        """
        try:
            # Select voice based on language if not specified
            if not voice_id:
                voice_id = self._get_default_voice_for_language(language_code)
            
            # Synthesize speech
            response = self.polly_client.synthesize_speech(
                Text=text,
                OutputFormat=output_format,
                VoiceId=voice_id,
                LanguageCode=language_code,
                Engine='standard'  # Use standard engine for broader compatibility
            )
            
            # Read audio stream
            audio_data = response['AudioStream'].read()
            
            return {
                'success': True,
                'audio_data': audio_data,
                'content_type': response.get('ContentType', f'audio/{output_format}'),
                'request_characters': len(text),
                'voice_id': voice_id,
                'language_code': language_code,
                'output_format': output_format
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"Text-to-speech error: {str(e)}"
            }
    
    def _get_default_voice_for_language(self, language_code: str) -> str:
        """Get default voice ID for a given language"""
        voice_mapping = {
            'en-US': 'Joanna',
            'en-GB': 'Emma',
            'hi-IN': 'Aditi',
            'es-ES': 'Lucia',
            'es-US': 'Lupe',
            'fr-FR': 'Céline',
            'de-DE': 'Marlene',
            'it-IT': 'Bianca',
            'pt-BR': 'Camila',
            'ja-JP': 'Mizuki',
            'zh-CN': 'Zhiyu',
            'ko-KR': 'Seoyeon',
            'ar-SA': 'Zeina',
            'ru-RU': 'Tatyana'
        }
        
        return voice_mapping.get(language_code, 'Joanna')  # Default to Joanna
    
    def get_available_voices(self, language_code: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get list of available voices
        
        Args:
            language_code: Optional language filter
            
        Returns:
            List of available voices
        """
        try:
            response = self.polly_client.describe_voices(LanguageCode=language_code)
            
            voices = []
            for voice in response['Voices']:
                voices.append({
                    'voice_id': voice['Id'],
                    'name': voice['Name'],
                    'language_code': voice['LanguageCode'],
                    'language_name': voice['LanguageName'],
                    'gender': voice['Gender'],
                    'engine': voice.get('SupportedEngines', ['standard']),
                    'additional_language_codes': voice.get('AdditionalLanguageCodes', [])
                })
            
            return voices
            
        except Exception as e:
            return []
    
    def get_supported_languages(self) -> Dict[str, str]:
        """Get list of supported languages for TTS"""
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
            'ru-RU': 'Russian (Russia)',
            'da-DK': 'Danish (Denmark)',
            'nl-NL': 'Dutch (Netherlands)',
            'id-ID': 'Indonesian (Indonesia)',
            'is-IS': 'Icelandic (Iceland)',
            'nb-NO': 'Norwegian (Norway)',
            'pl-PL': 'Polish (Poland)',
            'pt-PT': 'Portuguese (Portugal)',
            'ro-RO': 'Romanian (Romania)',
            'sv-SE': 'Swedish (Sweden)',
            'tr-TR': 'Turkish (Turkey)',
            'cy-GB': 'Welsh (UK)'
        }
    
    def synthesize_with_speech_marks(
        self, 
        text: str, 
        language_code: str = "en-US",
        voice_id: Optional[str] = None,
        speech_mark_types: List[str] = ['sentence', 'word']
    ) -> Dict[str, Any]:
        """
        Synthesize speech with speech marks for timing information
        
        Args:
            text: Text to convert to speech
            language_code: Language code
            voice_id: Optional voice ID
            speech_mark_types: Types of speech marks to include
            
        Returns:
            Dict containing audio data and speech marks
        """
        try:
            if not voice_id:
                voice_id = self._get_default_voice_for_language(language_code)
            
            # Synthesize speech with speech marks
            response = self.polly_client.synthesize_speech(
                Text=text,
                OutputFormat='json',
                VoiceId=voice_id,
                LanguageCode=language_code,
                Engine='neural',
                SpeechMarkTypes=speech_mark_types
            )
            
            # Read speech marks
            speech_marks = []
            for line in response['AudioStream'].read().decode('utf-8').split('\n'):
                if line.strip():
                    speech_marks.append(json.loads(line))
            
            # Now get the actual audio
            audio_response = self.synthesize_speech(text, language_code, voice_id)
            
            if audio_response['success']:
                audio_response['speech_marks'] = speech_marks
            
            return audio_response
            
        except Exception as e:
            return {
                'success': False,
                'error': f"Speech marks synthesis error: {str(e)}"
            }
    
    def synthesize_ssml(
        self, 
        ssml_text: str, 
        language_code: str = "en-US",
        voice_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Convert SSML text to speech for more control over speech output
        
        Args:
            ssml_text: SSML formatted text
            language_code: Language code
            voice_id: Optional voice ID
            
        Returns:
            Dict containing audio data and metadata
        """
        try:
            if not voice_id:
                voice_id = self._get_default_voice_for_language(language_code)
            
            response = self.polly_client.synthesize_speech(
                Text=ssml_text,
                OutputFormat='mp3',
                VoiceId=voice_id,
                LanguageCode=language_code,
                Engine='neural',
                TextType='ssml'
            )
            
            audio_data = response['AudioStream'].read()
            
            return {
                'success': True,
                'audio_data': audio_data,
                'content_type': 'audio/mpeg',
                'voice_id': voice_id,
                'language_code': language_code,
                'text_type': 'ssml'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"SSML synthesis error: {str(e)}"
            }
    
    def create_ssml_with_emphasis(
        self, 
        text: str, 
        emphasis_words: List[str] = None
    ) -> str:
        """
        Create SSML with emphasis on specific words
        
        Args:
            text: Plain text
            emphasis_words: List of words to emphasize
            
        Returns:
            SSML formatted text
        """
        if not emphasis_words:
            return f"<speak>{text}</speak>"
        
        words = text.split()
        ssml_parts = ["<speak>"]
        
        for word in words:
            clean_word = word.strip('.,!?;:')
            if clean_word.lower() in [w.lower() for w in emphasis_words]:
                ssml_parts.append(f'<emphasis level="strong">{word}</emphasis>')
            else:
                ssml_parts.append(word)
        
        ssml_parts.append("</speak>")
        return ' '.join(ssml_parts)


# Alternative implementation using Google Text-to-Speech
class GoogleTextToSpeechService:
    """Alternative service using Google Text-to-Speech"""
    
    def __init__(self):
        """Initialize Google TTS client"""
        try:
            from google.cloud import texttospeech
            self.client = texttospeech.TextToSpeechClient()
        except ImportError:
            raise ImportError("Google Cloud Text-to-Speech library not installed")
    
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
        
        language_code = language_mapping.get(language, f"{language}-US")
        
        if voice_preference:
            return self.tts_service.synthesize_speech(text, language_code, voice_preference)
        else:
            return self.tts_service.synthesize_speech(text, language_code)
    
    def synthesize_speech(
        self, 
        text: str, 
        language_code: str = "en-US",
        voice_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Synthesize speech using Google TTS"""
        try:
            # Map language codes to Google voice names
            voice_mapping = {
                'en-US': 'en-US-Wavenet-D',
                'hi-IN': 'hi-IN-Wavenet-D',
                'es-ES': 'es-ES-Wavenet-D',
                'fr-FR': 'fr-FR-Wavenet-D',
                'de-DE': 'de-DE-Wavenet-D'
            }
            
            if not voice_name:
                voice_name = voice_mapping.get(language_code, 'en-US-Wavenet-D')
            
            # Set the text input to be synthesized
            synthesis_input = texttospeech.SynthesisInput(text=text)
            
            # Build the voice request
            voice = texttospeech.VoiceSelectionParams(
                language_code=language_code,
                name=voice_name
            )
            
            # Select the type of audio file you want
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3
            )
            
            # Perform the text-to-speech request
            response = self.client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )
            
            return {
                'success': True,
                'audio_data': response.audio_content,
                'content_type': 'audio/mpeg',
                'voice_name': voice_name,
                'language_code': language_code
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"Google TTS error: {str(e)}"
            }

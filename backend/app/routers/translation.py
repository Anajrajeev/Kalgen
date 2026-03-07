from __future__ import annotations

import asyncio
import base64
import hashlib
import json
import time
import uuid
from collections import OrderedDict
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, File, Form, UploadFile
from fastapi.responses import JSONResponse

from app.config import (
    build_prefixed_key,
    build_s3_uri,
    get_settings,
    get_s3_client,
)
from app.services.translate_service import TranslateService
from app.services.tts_service import PollyService
from app.services.transcribe_service import TranscribeService

router = APIRouter(tags=["translation"])
translate_service = TranslateService()
polly_service = PollyService()
transcribe_service = TranscribeService()
settings = get_settings()

_translation_cache: OrderedDict[str, str] = OrderedDict()
_translation_cache_limit = 1000


def _cache_key(text: str, src: str, tgt: str) -> str:
    normalized = text.strip() if text else ""
    return hashlib.md5(f"{normalized}|{src}|{tgt}".encode("utf-8")).hexdigest()


def _cache_get(text: str, src: str, tgt: str) -> Optional[str]:
    key = _cache_key(text, src, tgt)
    result = _translation_cache.get(key)
    if result is not None:
        _translation_cache.move_to_end(key)
    return result


def _cache_set(text: str, src: str, tgt: str, translated: str) -> None:
    key = _cache_key(text, src, tgt)
    _translation_cache[key] = translated
    _translation_cache.move_to_end(key)
    if len(_translation_cache) > _translation_cache_limit:
        _translation_cache.popitem(last=False)


def _infer_media_format(filename: str, fallback: str = "wav") -> str:
    import os
    ext = os.path.splitext(filename or "")[1].lower().lstrip(".")
    if ext in {"wav", "mp3", "mp4", "flac", "ogg", "amr", "webm"}:
        return ext
    return fallback


# Text Translation Endpoints

@router.post("/translate-text")
async def translate_text(
    text: str,
    source_language: str,
    target_language: str,
):
    """Batch text translation with Amazon Translate."""
    # Check cache first
    cached = _cache_get(text, source_language, target_language)
    if cached is not None:
        return {"translated_text": cached}
    
    translated = await translate_service.translate_text_async(
        text, source_language, target_language
    )
    _cache_set(text, source_language, target_language, translated)
    return {"translated_text": translated}


@router.post("/tts/synthesize")
async def synthesize_speech(
    data: dict,
):
    """Text-to-speech synthesis with Amazon Polly."""
    text = data.get("text")
    language_code = data.get("language_code", "en-US")
    
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
        
    try:
        audio_bytes = await polly_service.synthesize_async(text, language_code)
        audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
        return {"audio_base64": audio_base64, "format": "mp3"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language_code: str = "en-US",
):
    """Speech-to-text transcription with Amazon Transcribe."""
    audio_bytes = await file.read()
    filename = file.filename or "audio.wav"
    media_format = _infer_media_format(filename)
    
    try:
        transcript = await transcribe_service.transcribe_audio_bytes_async(
            audio_bytes, filename, media_format, language_code
        )
        return {"text": transcript}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/translate-text-live")
async def translate_text_live(websocket: WebSocket):
    """Live text translation over WebSocket."""
    await websocket.accept()
    
    # Get query parameters
    source_language = websocket.query_params.get("source_language", "auto")
    target_language = websocket.query_params.get("target_language", "en")
    
    try:
        while True:
            # Receive message (can be text or JSON)
            data = await websocket.receive_text()
            
            # Parse the message
            try:
                message = json.loads(data)
                text = message.get("text", "")
                src = message.get("source_language", source_language)
                tgt = message.get("target_language", target_language)
            except json.JSONDecodeError:
                # Plain text message
                text = data
                src = source_language
                tgt = target_language
            
            if not text.strip():
                await websocket.send_json({"error": "Empty text"})
                continue
            
            # Check cache
            cached = _cache_get(text, src, tgt)
            if cached is not None:
                await websocket.send_json({"translated_text": cached})
                continue
            
            # Translate
            try:
                translated = await translate_service.translate_text_async(text, src, tgt)
                _cache_set(text, src, tgt, translated)
                await websocket.send_json({"translated_text": translated})
            except Exception as e:
                await websocket.send_json({"error": str(e)})
                
    except WebSocketDisconnect:
        pass


# Speech Translation Endpoints

@router.post("/translate-speech")
async def translate_speech(
    file: UploadFile = File(...),
    source_language: str = Form("auto"),
    target_language: str = Form("en"),
):
    """
    Speech translation pipeline: uploaded audio -> Transcribe -> Translate -> Polly -> translated audio.
    """
    audio_bytes = await file.read()
    filename = file.filename or "audio.wav"
    media_format = _infer_media_format(filename)
    
    try:
        # Step 1: Transcribe
        transcript = await transcribe_service.transcribe_audio_bytes_async(
            audio_bytes, filename, media_format, source_language
        )
        
        if not transcript.strip():
            return JSONResponse(
                status_code=400,
                content={"error": "No speech detected in audio"}
            )
        
        # Step 2: Translate
        translated_text = await translate_service.translate_text_async(
            transcript, source_language, target_language
        )
        
        # Step 3: Text-to-Speech
        translated_audio = await polly_service.synthesize_async(
            translated_text, target_language
        )
        
        # Return as base64 for JSON response
        audio_base64 = base64.b64encode(translated_audio).decode("utf-8")
        
        return {
            "transcript": transcript,
            "translated_text": translated_text,
            "translated_audio": audio_base64,
            "audio_format": "mp3"
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Speech translation failed: {str(e)}"}
        )


@router.websocket("/translate-speech-live")
async def translate_speech_live(websocket: WebSocket):
    """Real-time speech translation over WebSocket."""
    await websocket.accept()
    
    # Get query parameters
    source_language = websocket.query_params.get("source_language", "auto")
    target_language = websocket.query_params.get("target_language", "en")
    sample_rate = websocket.query_params.get("sample_rate", "16000")
    media_encoding = websocket.query_params.get("media_encoding", "pcm")
    
    try:
        # Initialize streaming transcription
        from amazon_transcribe.client import TranscribeStreamingClient
        from amazon_transcribe.model import TranscriptEvent
        
        client = TranscribeStreamingClient(region=settings.aws_region)
        
        # Start streaming session
        stream = await client.start_stream_transcription(
            language_code=transcribe_service.normalize_language_code(source_language),
            media_sample_rate_hz=int(sample_rate),
            media_encoding=media_encoding,
        )
        
        async def handle_transcript_events():
            """Handle incoming transcript events and translate them."""
            async for event in stream.transcript_stream:
                if isinstance(event, TranscriptEvent):
                    results = event.results
                    if results and results.transcripts:
                        transcript = results.transcripts[0].transcript
                        
                        if transcript.strip() and results.is_partial == False:
                            # Translate the transcript
                            try:
                                translated = await translate_service.translate_text_async(
                                    transcript, source_language, target_language
                                )
                                
                                # Generate speech
                                audio_bytes = await polly_service.synthesize_async(
                                    translated, target_language
                                )
                                
                                # Send results
                                await websocket.send_json({
                                    "transcript": transcript,
                                    "translated_text": translated,
                                    "audio_base64": base64.b64encode(audio_bytes).decode("utf-8")
                                })
                                
                            except Exception as e:
                                await websocket.send_json({
                                    "error": f"Translation failed: {str(e)}"
                                })
        
        # Run event handler in background
        event_handler_task = asyncio.create_task(handle_transcript_events())
        
        try:
            while True:
                # Receive audio data
                message = await websocket.receive_bytes()
                
                # Check for control messages
                try:
                    control = json.loads(message.decode("utf-8"))
                    if control.get("event") == "flush":
                        # Force processing of buffered audio
                        await stream.input_stream.send_audio_event(audio_chunk=b"")
                        continue
                    elif control.get("event") == "stop":
                        break
                except (json.JSONDecodeError, UnicodeDecodeError):
                    # Binary audio data
                    await stream.input_stream.send_audio_event(audio_chunk=message)
                    
        except WebSocketDisconnect:
            pass
        finally:
            # Clean up
            event_handler_task.cancel()
            await stream.input_stream.end_stream()
            
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"error": f"Streaming failed: {str(e)}"})
        except:
            pass


# Utility Endpoints

@router.get("/translation-health")
async def translation_health():
    """Translation service health check."""
    return {"status": "ok", "service": "translation_service"}


@router.get("/aws-identity")
async def aws_identity():
    """Return the AWS caller identity for verification."""
    from app.config import get_boto3_session
    session = get_boto3_session()
    sts = session.client("sts")
    identity = sts.get_caller_identity()
    return {
        "UserId": identity["UserId"],
        "Account": identity["Account"],
        "Arn": identity["Arn"],
    }

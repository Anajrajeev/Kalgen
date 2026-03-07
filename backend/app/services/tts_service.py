from __future__ import annotations

import asyncio
from typing import Dict

from fastapi import HTTPException
from botocore.exceptions import BotoCoreError, ClientError

from app.config import get_polly_client


class PollyService:
    """Text-to-speech service backed by Amazon Polly."""

    _VOICE_BY_LANGUAGE: Dict[str, str] = {
        "en": "Joanna",
        "de": "Vicki",
        "es": "Lupe",
        "fr": "Lea",
        "it": "Bianca",
        "pt": "Camila",
        "ja": "Takumi",
        "ko": "Seoyeon",
        "hi": "Kajal",
        "ar": "Zeina",
        "zh": "Zhiyu",
    }

    _POLLY_LANGUAGE_MAP: Dict[str, str] = {
        "en": "en-US",
        "de": "de-DE",
        "es": "es-ES",
        "fr": "fr-FR",
        "it": "it-IT",
        "pt": "pt-BR",
        "ja": "ja-JP",
        "ko": "ko-KR",
        "hi": "hi-IN",
        "ar": "ar-AE",
        "zh": "cmn-CN",
    }

    def __init__(self) -> None:
        self.client = get_polly_client()

    async def synthesize_async(self, text: str, language_code: str, output_format: str = "mp3") -> bytes:
        return await asyncio.to_thread(self.synthesize, text, language_code, output_format)

    def synthesize(self, text: str, language_code: str, output_format: str = "mp3") -> bytes:
        language_key = (language_code or "en").split("-")[0].lower()
        polly_language = self._POLLY_LANGUAGE_MAP.get(language_key, "en-US")
        voice_id = self._VOICE_BY_LANGUAGE.get(language_key, "Joanna")

        def _call_polly(engine: str) -> bytes:
            response = self.client.synthesize_speech(
                Text=text,
                OutputFormat=output_format,
                VoiceId=voice_id,
                LanguageCode=polly_language,
                Engine=engine,
            )
            return response["AudioStream"].read()

        try:
            return _call_polly("neural")
        except ClientError as exc:
            err = exc.response.get("Error", {})
            msg = str(err.get("Message", "")).lower()
            code = err.get("Code", "ClientError")

            # Mirror SAMPLE's behavior: fallback to standard if neural is unsupported for voice/language.
            is_neural_compat_issue = code == "ValidationException" and (
                "neural" in msg or "engine" in msg or "voice" in msg
            )
            if is_neural_compat_issue:
                try:
                    return _call_polly("standard")
                except Exception as fallback_exc:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Amazon Polly error ({code}): {err.get('Message', str(fallback_exc))}",
                    ) from fallback_exc

            raise HTTPException(status_code=500, detail=f"Amazon Polly error ({code}): {err.get('Message', str(exc))}") from exc
        except BotoCoreError as exc:
            raise HTTPException(status_code=500, detail=f"Amazon Polly synthesis failed: {exc}") from exc

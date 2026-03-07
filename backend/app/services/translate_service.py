from __future__ import annotations

import asyncio
from typing import List, Tuple, Union

from fastapi import HTTPException
from botocore.exceptions import BotoCoreError, ClientError

from app.services.transcribe_service import convert_to_translate_language
from app.config import get_translate_client


class TranslateService:
    """Wrapper around Amazon Translate with async-friendly methods."""

    BYTE_LIMIT = 10_000
    SAFE_CHUNK_BYTES = 9_000

    def __init__(self) -> None:
        self.client = get_translate_client()

    async def translate_text_async(
        self,
        text: str,
        source_language: str,
        target_language: str,
        return_detected_lang: bool = False,
    ) -> Union[str, Tuple[str, str]]:
        return await asyncio.to_thread(
            self.translate_text,
            text,
            source_language,
            target_language,
            return_detected_lang,
        )

    def translate_text(
        self,
        text: str,
        source_language: str,
        target_language: str,
        return_detected_lang: bool = False,
    ) -> Union[str, Tuple[str, str]]:
        if not text:
            return ("", source_language) if return_detected_lang else ""

        source_language_code = convert_to_translate_language(source_language)
        target_language_code = convert_to_translate_language(target_language)

        byte_count = len(text.encode("utf-8"))
        if byte_count <= self.BYTE_LIMIT:
            return self._translate_chunk(
                text,
                source_language_code,
                target_language_code,
                return_detected_lang=return_detected_lang,
            )

        chunks = self._split_text_for_translate(text)
        translated_chunks: List[str] = []
        detected_lang = source_language_code

        for idx, chunk in enumerate(chunks):
            # Defensive check: Amazon Translate has a 10,000 byte limit per request (match SAMPLE)
            chunk_bytes = len(chunk.encode("utf-8"))
            if chunk_bytes > self.BYTE_LIMIT:
                raise HTTPException(
                    status_code=500,
                    detail=f"Chunk {idx + 1} exceeds 10,000 byte limit ({chunk_bytes} bytes). This should not happen.",
                )
            chunk_result = self._translate_chunk(
                chunk,
                source_language_code,
                target_language_code,
                return_detected_lang=return_detected_lang and idx == 0,
            )
            if isinstance(chunk_result, tuple):
                translated_text, detected_lang = chunk_result
            else:
                translated_text = chunk_result
            translated_chunks.append(translated_text)

        final_text = " ".join(part for part in translated_chunks if part)
        if return_detected_lang:
            return final_text, detected_lang
        return final_text

    def _translate_chunk(
        self,
        text: str,
        source_language: str,
        target_language: str,
        return_detected_lang: bool = False,
    ) -> Union[str, Tuple[str, str]]:
        try:
            response = self.client.translate_text(
                Text=text,
                SourceLanguageCode=source_language,
                TargetLanguageCode=target_language,
            )
            translated_text = response["TranslatedText"]
            if return_detected_lang and source_language == "auto":
                detected_lang = response.get("SourceLanguageCode", "auto")
                return translated_text, detected_lang
            return translated_text
        except ClientError as exc:
            err = exc.response.get("Error", {})
            code = err.get("Code", "ClientError")
            msg = err.get("Message", str(exc))
            raise HTTPException(status_code=500, detail=f"Amazon Translate error ({code}): {msg}") from exc
        except BotoCoreError as exc:
            raise HTTPException(status_code=500, detail=f"Amazon Translate error: {exc}") from exc

    def _split_text_for_translate(self, text: str) -> List[str]:
        chunks: List[str] = []
        current = ""

        for sentence in text.split(". "):
            candidate = f"{current}. {sentence}" if current else sentence
            if len(candidate.encode("utf-8")) <= self.SAFE_CHUNK_BYTES:
                current = candidate
                continue

            if current:
                chunks.append(current)
            current = sentence

            # If one sentence is still too large, split by bytes conservatively.
            while len(current.encode("utf-8")) > self.SAFE_CHUNK_BYTES:
                encoded = current.encode("utf-8")
                piece = encoded[: self.SAFE_CHUNK_BYTES].decode("utf-8", errors="ignore")
                chunks.append(piece)
                current = encoded[self.SAFE_CHUNK_BYTES :].decode("utf-8", errors="ignore")

        if current:
            chunks.append(current)

        return chunks


translate_service = TranslateService()

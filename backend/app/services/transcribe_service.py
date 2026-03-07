from __future__ import annotations

import asyncio
import json
import os
import time
import uuid
from urllib.parse import urlparse
from urllib.request import urlopen

from fastapi import HTTPException
from botocore.exceptions import BotoCoreError, ClientError

from app.config import (
    build_prefixed_key,
    build_s3_uri,
    get_s3_client,
    get_settings,
    get_transcribe_client,
)

# Central mapping: Transcribe (region format) -> Translate (base format).
# Transcribe uses codes like en-US, hi-IN; Translate uses en, hi.
TRANSCRIBE_TO_TRANSLATE_LANG: dict[str, str] = {
    "en-US": "en",
    "en-GB": "en",
    "de-DE": "de",
    "es-ES": "es",
    "fr-FR": "fr",
    "it-IT": "it",
    "pt-BR": "pt",
    "pt-PT": "pt",
    "hi-IN": "hi",
    "mr-IN": "mr",
    "ja-JP": "ja",
    "ko-KR": "ko",
    "zh-CN": "zh",
    "zh-TW": "zh",
    "ar-SA": "ar",
    "ar-AE": "ar",
    "ta-IN": "ta",
    "ml-IN": "ml",
    "kn-IN": "kn",
    "te-IN": "te",
    "el-GR": "el",
    "ru-RU": "ru",
    "no-NO": "no",
    "sk-SK": "sk",
    "cmn-CN": "zh",
}


def normalize_transcribe_language(language_code: str | None) -> str:
    """
    Return a language code in Amazon Transcribe format (region, e.g. en-US, hi-IN).
    Accepts either base (en, hi) or region format; always returns region format.
    """
    if not (language_code or "").strip():
        return "en-US"
    value = (language_code or "").strip()
    if "-" in value:
        return value
    return _BASE_TO_TRANSCRIBE.get(value.lower(), "en-US")


def convert_to_translate_language(language_code: str | None) -> str:
    """
    Return a language code in Amazon Translate format (base, e.g. en, hi).
    Accepts 'auto', or region format (en-US), or base format (en); always returns base or 'auto'.
    """
    if not (language_code or "").strip():
        return "auto"
    value = (language_code or "").strip().lower()
    if value == "auto":
        return "auto"
    # Case-insensitive lookup for region format (e.g. en-us -> en)
    for region_code, base_code in TRANSCRIBE_TO_TRANSLATE_LANG.items():
        if region_code.lower() == value:
            return base_code
    if "-" in value:
        return value.split("-")[0]
    return value


# Base (short) code -> Transcribe (region) code for normalize_transcribe_language
_BASE_TO_TRANSCRIBE: dict[str, str] = {
    "en": "en-US",
    "de": "de-DE",
    "es": "es-ES",
    "fr": "fr-FR",
    "it": "it-IT",
    "pt": "pt-BR",
    "hi": "hi-IN",
    "mr": "mr-IN",
    "ja": "ja-JP",
    "ko": "ko-KR",
    "zh": "zh-CN",
    "ar": "ar-SA",
    "ta": "ta-IN",
    "ml": "ml-IN",
    "kn": "kn-IN",
    "te": "te-IN",
    "el": "el-GR",
    "ru": "ru-RU",
    "no": "no-NO",
    "sk": "sk-SK",
    "cmn": "zh-CN",
}


class TranscribeService:
    """Amazon Transcribe helper for short batch jobs and chunk processing."""

    _LANGUAGE_MAP = _BASE_TO_TRANSCRIBE

    def __init__(self) -> None:
        self.settings = get_settings()
        self.s3 = get_s3_client()
        self.transcribe = get_transcribe_client()

    async def transcribe_audio_bytes_async(
        self,
        audio_bytes: bytes,
        filename: str,
        media_format: str,
        source_language: str,
    ) -> str:
        return await asyncio.to_thread(
            self.transcribe_audio_bytes,
            audio_bytes,
            filename,
            media_format,
            source_language,
        )

    def transcribe_audio_bytes(
        self,
        audio_bytes: bytes,
        filename: str,
        media_format: str,
        source_language: str,
    ) -> str:
        self._validate_buckets()

        input_key = build_prefixed_key(self.settings.transcribe_input_prefix, f"{uuid.uuid4()}_{filename}")
        input_uri = build_s3_uri(self.settings.transcribe_input_bucket, input_key)

        self.s3.put_object(
            Bucket=self.settings.transcribe_input_bucket,
            Key=input_key,
            Body=audio_bytes,
            ContentType=f"audio/{media_format}",
        )

        job_name = f"language-service-{uuid.uuid4().hex[:18]}"
        output_key = build_prefixed_key(self.settings.transcribe_output_prefix, job_name)

        start_params = {
            "TranscriptionJobName": job_name,
            "Media": {"MediaFileUri": input_uri},
            "MediaFormat": media_format,
            "OutputBucketName": self.settings.transcribe_output_bucket,
            "OutputKey": output_key,
        }

        if source_language.lower() == "auto":
            start_params["IdentifyLanguage"] = True
        else:
            start_params["LanguageCode"] = normalize_transcribe_language(source_language)

        try:
            self.transcribe.start_transcription_job(**start_params)
            job = self._wait_for_job(job_name)
            transcript_uri = job["Transcript"]["TranscriptFileUri"]
            return self._extract_transcript_text(transcript_uri)
        except ClientError as exc:
            err = exc.response.get("Error", {})
            code = err.get("Code", "ClientError")
            msg = err.get("Message", str(exc))
            raise HTTPException(status_code=500, detail=f"Amazon Transcribe error ({code}): {msg}") from exc
        except BotoCoreError as exc:
            raise HTTPException(status_code=500, detail=f"Amazon Transcribe error: {exc}") from exc
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Transcription failed: {exc}") from exc

    def _wait_for_job(self, job_name: str, timeout_seconds: int = 300, poll_seconds: int = 2) -> dict:
        deadline = time.time() + timeout_seconds

        while time.time() < deadline:
            status_response = self.transcribe.get_transcription_job(TranscriptionJobName=job_name)
            job = status_response["TranscriptionJob"]
            status = job["TranscriptionJobStatus"]

            if status == "COMPLETED":
                return job
            if status == "FAILED":
                reason = job.get("FailureReason", "unknown")
                raise RuntimeError(f"Transcription job failed: {reason}")

            time.sleep(poll_seconds)

        raise TimeoutError(f"Transcription job timed out after {timeout_seconds} seconds")

    def _parse_s3_bucket_key(self, transcript_uri: str) -> tuple[str, str] | None:
        """Parse transcript URI into (bucket, key) for S3 GetObject, or None if not an S3 location."""
        uri = (transcript_uri or "").strip()
        if not uri:
            return None
        if uri.startswith("s3://"):
            path = uri[5:].lstrip("/")
            if "/" in path:
                bucket, _, key = path.partition("/")
                return bucket, key
            return None
        if uri.startswith("https://") and "amazonaws.com" in uri:
            parsed = urlparse(uri)
            path = (parsed.path or "").lstrip("/")
            host = (parsed.netloc or "").lower()
            # Virtual-hosted: bucket.s3.region.amazonaws.com/key
            if ".s3." in host and host.endswith(".amazonaws.com"):
                bucket = host.split(".s3.")[0]
                key = path
                if bucket and key:
                    return bucket, key
            # Path-style: s3.region.amazonaws.com/bucket/key
            if path.count("/") >= 1:
                parts = path.split("/", 1)
                bucket, key = parts[0], parts[1]
                if bucket and key:
                    return bucket, key
        return None

    def _extract_transcript_text(self, transcript_uri: str) -> str:
        payload_bytes: bytes | None = None
        s3_parts = self._parse_s3_bucket_key(transcript_uri)
        if s3_parts:
            bucket, key = s3_parts
            try:
                response = self.s3.get_object(Bucket=bucket, Key=key)
                payload_bytes = response["Body"].read()
            except ClientError as exc:
                err = exc.response.get("Error", {})
                code = err.get("Code", "ClientError")
                msg = err.get("Message", str(exc))
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to fetch transcript from S3 ({code}): {msg}. Ensure the IAM user has s3:GetObject on the output bucket.",
                ) from exc
        if payload_bytes is None:
            try:
                with urlopen(transcript_uri) as response:  # nosec B310 - URI from AWS Transcribe
                    payload_bytes = response.read()
            except Exception as exc:
                raise HTTPException(status_code=500, detail=f"Failed to fetch transcript JSON: {exc}") from exc
        try:
            payload = json.loads(payload_bytes.decode("utf-8"))
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Failed to parse transcript JSON: {exc}") from exc
        transcripts = payload.get("results", {}).get("transcripts", [])
        if not transcripts:
            return ""
        return transcripts[0].get("transcript", "")

    def normalize_language_code(self, language: str | None) -> str:
        """Backward-compatible alias: returns Transcribe (region) format."""
        return normalize_transcribe_language(language)

    @staticmethod
    def to_translate_language_code(transcribe_language: str | None) -> str:
        """Backward-compatible alias: returns Translate (base) format or 'auto'."""
        return convert_to_translate_language(transcribe_language)

    def _validate_buckets(self) -> None:
        if not self.settings.transcribe_input_bucket:
            raise RuntimeError("Missing TRANSCRIBE_INPUT_BUCKET configuration")
        if not self.settings.transcribe_output_bucket:
            raise RuntimeError("Missing TRANSCRIBE_OUTPUT_BUCKET configuration")

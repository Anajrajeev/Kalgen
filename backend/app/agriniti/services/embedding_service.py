"""
Embedding service — Gemini embeddings via direct REST API (no SDK version issues).
Model: gemini-embedding-001 (available on free tier).
"""

import asyncio
import json
import httpx
from typing import List

from app.agriniti.core.config import settings

_API_KEY = settings.GEMINI_API_KEY
_BASE = "https://generativelanguage.googleapis.com/v1beta"
_MODEL = "models/gemini-embedding-001"


async def embed_text(text: str, task_type: str = "RETRIEVAL_DOCUMENT") -> List[float]:
    """Generates an embedding vector using Gemini via async HTTP request, with retries."""
    url = f"{_BASE}/{_MODEL}:embedContent?key={_API_KEY}"
    payload = {"model": _MODEL, "content": {"parts": [{"text": text}]}, "taskType": task_type}
    
    import random
    
    # Retry with exponential backoff to handle free-tier API rate limits under stress
    for attempt in range(8):
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                r = await client.post(url, json=payload)
                r.raise_for_status()
                data = r.json()
                return data["embedding"]["values"]
        except (httpx.HTTPStatusError, httpx.RequestError) as e:
            if attempt == 7:  # Re-raise on final attempt
                raise
            # Exponential backoff + jitter (0.5s, 1s, 2s, 4s, etc.)
            await asyncio.sleep((2 ** attempt) * 0.5 + random.uniform(0, 0.5))


# ---------------------------------------------------------------------------
# Text builders — deterministic natural language from structured data
# ---------------------------------------------------------------------------

def build_listing_text(
    commodity: str,
    variety: str | None,
    quantity_qtl: float,
    price_per_qtl: float,
    state: str | None,
    district: str | None,
    available_from: str | None = None,
    available_until: str | None = None,
) -> str:
    parts = [f"Selling {quantity_qtl:.0f} quintal"]
    if variety:
        parts.append(variety)
    parts.append(commodity)
    if district or state:
        loc = ", ".join(filter(None, [district, state]))
        parts.append(f"from {loc}")
    parts.append(f"at Rs {price_per_qtl:.0f} per quintal.")
    if available_from:
        parts.append(f"Available from {available_from}")
    if available_until:
        parts.append(f"until {available_until}.")
    return " ".join(parts)


def build_buyer_text(
    name: str,
    primary_crops: str | None,
    state: str | None,
    district: str | None,
    role: str = "buyer",
) -> str:
    parts = [f"{role.capitalize()} based in"]
    loc = ", ".join(filter(None, [district, state]))
    parts.append(loc if loc else "India")
    if primary_crops:
        crops = primary_crops.replace(",", ", ")
        parts.append(f". Interested in buying {crops}.")
    return " ".join(parts)


def build_buy_request_text(
    commodity: str,
    variety: str | None,
    quantity_needed_qtl: float,
    max_price_per_qtl: float | None,
    delivery_state: str | None,
    delivery_district: str | None,
) -> str:
    parts = [f"Buyer looking for {quantity_needed_qtl:.0f} quintal"]
    if variety:
        parts.append(variety)
    parts.append(commodity)
    loc = ", ".join(filter(None, [delivery_district, delivery_state]))
    if loc:
        parts.append(f"delivered to {loc}")
    if max_price_per_qtl:
        parts.append(f"at up to Rs {max_price_per_qtl:.0f} per quintal.")
    return " ".join(parts)

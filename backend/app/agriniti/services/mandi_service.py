"""
Mandi Service — async HTTP client wrapping data.gov.in's commodity price API.

Features:
- Async httpx client (shared via app lifespan)
- Simple in-memory TTL cache (60 s by default) to avoid hammering upstream
- Typed return values using schemas.py
"""

import asyncio
import time
from typing import Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.agriniti.core.config import settings
from app.agriniti.core.schemas import MandiRecord, MandiResponse

# ---------------------------------------------------------------------------
# Simple TTL cache (key → (timestamp, value))
# ---------------------------------------------------------------------------
_cache: dict[str, tuple[float, Any]] = {}
_cache_lock = asyncio.Lock()


def _cache_key(**kwargs: Any) -> str:
    return str(sorted(kwargs.items()))


async def _get_cached(key: str) -> Any | None:
    async with _cache_lock:
        entry = _cache.get(key)
        if entry and (time.monotonic() - entry[0]) < settings.CACHE_TTL_SECONDS:
            return entry[1]
        return None


async def _set_cached(key: str, value: Any) -> None:
    async with _cache_lock:
        _cache[key] = (time.monotonic(), value)


# ---------------------------------------------------------------------------
# HTTP helper
# ---------------------------------------------------------------------------

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=6))
async def _fetch(
    client: httpx.AsyncClient,
    *,
    limit: int = 10,
    offset: int = 0,
    filters: dict[str, str] | None = None,
    sort_by: str | None = None,
    sort_order: str = "asc",
    fields: list[str] | None = None,
    q: str | None = None,
) -> dict[str, Any]:
    """
    Low-level call to data.gov.in. Returns the raw JSON dict.
    Raises httpx.HTTPStatusError on non-2xx responses.
    """
    params: dict[str, Any] = {
        "api-key": settings.DATA_GOV_API_KEY,
        "format": "json",
        "limit": limit,
        "offset": offset,
    }

    if filters:
        for field, value in filters.items():
            params[f"filters[{field}]"] = value

    if sort_by:
        params[f"sort[{sort_by}]"] = sort_order

    if fields:
        params["fields"] = ",".join(fields)

    if q:
        params["q"] = q

    url = f"{settings.DATA_GOV_BASE_URL}/{settings.MANDI_RESOURCE_ID}"
    # Increase local timeout for this specific call since gov API is slow
    response = await client.get(url, params=params, timeout=15.0)
    response.raise_for_status()
    return response.json()


def _parse_response(raw: dict[str, Any], offset: int, limit: int) -> MandiResponse:
    """Convert raw upstream JSON into a typed MandiResponse."""
    records_raw = raw.get("records", [])
    records = [MandiRecord(**r) for r in records_raw]
    return MandiResponse(
        total=int(raw.get("total", 0)),
        count=int(raw.get("count", len(records))),
        offset=offset,
        limit=limit,
        records=records,
    )


# ---------------------------------------------------------------------------
# Public service functions
# ---------------------------------------------------------------------------

async def get_prices(
    client: httpx.AsyncClient,
    *,
    limit: int = 10,
    offset: int = 0,
    state: str | None = None,
    district: str | None = None,
    market: str | None = None,
    commodity: str | None = None,
    variety: str | None = None,
    sort_by: str | None = None,
    sort_order: str = "asc",
    q: str | None = None,
) -> MandiResponse:
    filters: dict[str, str] = {}
    if state:
        filters["state"] = state
    if district:
        filters["district"] = district
    if market:
        filters["market"] = market
    if commodity:
        filters["commodity"] = commodity
    if variety:
        filters["variety"] = variety

    key = _cache_key(
        fn="get_prices", limit=limit, offset=offset,
        sort_by=sort_by, sort_order=sort_order, q=q or "", **filters,
    )
    cached = await _get_cached(key)
    if cached:
        return cached

    raw = await _fetch(
        client,
        limit=limit,
        offset=offset,
        filters=filters or None,
        sort_by=sort_by,
        sort_order=sort_order,
        q=q
    )
    result = _parse_response(raw, offset, limit)
    await _set_cached(key, result)
    return result


async def get_distinct_values(
    client: httpx.AsyncClient,
    field: str,
    *,
    state: str | None = None,
    limit: int = 1000,
) -> list[str]:
    """
    Fetch a larger batch of records and extract distinct values for `field`.
    Used for /commodities, /states, /markets endpoints.
    """
    filters: dict[str, str] = {}
    if state:
        filters["state"] = state

    key = _cache_key(fn="get_distinct", field=field, state=state or "", limit=limit)
    cached = await _get_cached(key)
    if cached:
        return cached

    # We remove the 'fields' restriction to be safer with case-sensitive API fields
    raw = await _fetch(
        client,
        limit=limit,
        offset=0,
        filters=filters or None,
    )
    
    records = raw.get("records", [])
    seen: set[str] = set()
    values: list[str] = []
    
    # Try multiple casings for the field name
    field_variants = [field, field.capitalize(), field.lower(), field.upper()]
    
    for r in records:
        v = None
        for variant in field_variants:
            if variant in r:
                v = r[variant]
                break
        
        if v and isinstance(v, str):
            v_strip = v.strip()
            if v_strip and v_strip not in seen:
                seen.add(v_strip)
                values.append(v_strip)

    values.sort()
    await _set_cached(key, values)
    return values

"""
FastAPI router for all Mandi commodity price endpoints.
Prefix: /api/v1/mandi
"""

from typing import Annotated, Literal

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.agriniti.core.schemas import DistinctValuesResponse, MandiResponse
from app.agriniti.services import mandi_service

router = APIRouter(prefix="/api/v1/mandi", tags=["Mandi Prices"])


# ---------------------------------------------------------------------------
# Dependency — pull the shared httpx client from app state
# ---------------------------------------------------------------------------

def get_http_client(request: Request) -> httpx.AsyncClient:
    return request.app.state.http_client


HttpClient = Annotated[httpx.AsyncClient, Depends(get_http_client)]


# ---------------------------------------------------------------------------
# Common query param type aliases
# ---------------------------------------------------------------------------

LimitQ = Annotated[int, Query(ge=1, le=500, description="Records per page (max 500)")]
OffsetQ = Annotated[int, Query(ge=0, description="Pagination offset")]
SortByQ = Annotated[
    str | None,
    Query(
        description="Field to sort by. One of: state, district, market, commodity, "
                    "variety, arrival_date, min_price, max_price, modal_price"
    ),
]
SortOrderQ = Annotated[
    Literal["asc", "desc"],
    Query(description="Sort direction"),
]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get(
    "/prices",
    response_model=MandiResponse,
    summary="Get commodity prices",
    description=(
        "Fetch daily mandi commodity prices with optional filters for state, district, "
        "market, commodity and variety. Supports pagination and sorting."
    ),
)
async def get_prices(
    client: HttpClient,
    limit: LimitQ = 10,
    offset: OffsetQ = 0,
    state: Annotated[str | None, Query(description="Filter by state name")] = None,
    district: Annotated[str | None, Query(description="Filter by district name")] = None,
    market: Annotated[str | None, Query(description="Filter by mandi / market name")] = None,
    commodity: Annotated[str | None, Query(description="Filter by commodity name")] = None,
    variety: Annotated[str | None, Query(description="Filter by commodity variety")] = None,
    sort_by: SortByQ = None,
    sort_order: SortOrderQ = "asc",
    q: Annotated[str | None, Query(description="Generic search query")] = None,
) -> MandiResponse:
    try:
        return await mandi_service.get_prices(
            client,
            limit=limit,
            offset=offset,
            state=state,
            district=district,
            market=market,
            commodity=commodity,
            variety=variety,
            sort_by=sort_by,
            sort_order=sort_order,
            q=q,
        )
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=f"Upstream API error: {exc.response.text}",
        )
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=f"Could not reach upstream API: {exc}")


@router.get(
    "/prices/commodity/{commodity}",
    response_model=MandiResponse,
    summary="Prices for a specific commodity",
    description="Returns daily prices for the given commodity across all mandis.",
)
async def prices_by_commodity(
    commodity: str,
    client: HttpClient,
    limit: LimitQ = 10,
    offset: OffsetQ = 0,
    state: Annotated[str | None, Query(description="Optionally narrow by state")] = None,
    sort_by: SortByQ = None,
    sort_order: SortOrderQ = "asc",
) -> MandiResponse:
    try:
        return await mandi_service.get_prices(
            client,
            limit=limit,
            offset=offset,
            state=state,
            commodity=commodity,
            sort_by=sort_by,
            sort_order=sort_order,
        )
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.get(
    "/prices/state/{state}",
    response_model=MandiResponse,
    summary="Prices within a state",
    description="Returns all commodity prices for a given state.",
)
async def prices_by_state(
    state: str,
    client: HttpClient,
    limit: LimitQ = 10,
    offset: OffsetQ = 0,
    commodity: Annotated[str | None, Query(description="Optionally narrow by commodity")] = None,
    sort_by: SortByQ = None,
    sort_order: SortOrderQ = "asc",
) -> MandiResponse:
    try:
        return await mandi_service.get_prices(
            client,
            limit=limit,
            offset=offset,
            state=state,
            commodity=commodity,
            sort_by=sort_by,
            sort_order=sort_order,
        )
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.get(
    "/prices/state/{state}/district/{district}",
    response_model=MandiResponse,
    summary="Prices in a specific district",
    description="Returns commodity prices for a given state and district combination.",
)
async def prices_by_district(
    state: str,
    district: str,
    client: HttpClient,
    limit: LimitQ = 10,
    offset: OffsetQ = 0,
    commodity: Annotated[str | None, Query(description="Optionally narrow by commodity")] = None,
    sort_by: SortByQ = None,
    sort_order: SortOrderQ = "asc",
) -> MandiResponse:
    try:
        return await mandi_service.get_prices(
            client,
            limit=limit,
            offset=offset,
            state=state,
            district=district,
            commodity=commodity,
            sort_by=sort_by,
            sort_order=sort_order,
        )
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.get(
    "/prices/market/{market}",
    response_model=MandiResponse,
    summary="Prices in a specific mandi",
    description="Returns all commodities and their prices for the given market/mandi.",
)
async def prices_by_market(
    market: str,
    client: HttpClient,
    limit: LimitQ = 10,
    offset: OffsetQ = 0,
    sort_by: SortByQ = None,
    sort_order: SortOrderQ = "asc",
) -> MandiResponse:
    try:
        return await mandi_service.get_prices(
            client,
            limit=limit,
            offset=offset,
            market=market,
            sort_by=sort_by,
            sort_order=sort_order,
        )
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


# ---------------------------------------------------------------------------
# Helper / metadata endpoints
# ---------------------------------------------------------------------------


@router.get(
    "/commodities",
    response_model=DistinctValuesResponse,
    summary="List distinct commodities",
    description=(
        "Returns a list of distinct commodity names available in the dataset. "
        "Useful for populating dropdowns in the frontend. "
        "Fetches up to 500 records and deduplicates."
    ),
)
async def list_commodities(
    client: HttpClient,
    state: Annotated[str | None, Query(description="Optionally filter commodities by state")] = None,
) -> DistinctValuesResponse:
    try:
        values = await mandi_service.get_distinct_values(client, "commodity", state=state)
        return DistinctValuesResponse(field="commodity", count=len(values), values=values)
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.get(
    "/states",
    response_model=DistinctValuesResponse,
    summary="List distinct states",
    description="Returns a sorted list of distinct state names present in today's dataset.",
)
async def list_states(client: HttpClient) -> DistinctValuesResponse:
    try:
        values = await mandi_service.get_distinct_values(client, "state")
        return DistinctValuesResponse(field="state", count=len(values), values=values)
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.get(
    "/markets",
    response_model=DistinctValuesResponse,
    summary="List distinct markets / mandis",
    description=(
        "Returns a sorted list of distinct market names. "
        "Pass `state` to limit to mandis in a particular state."
    ),
)
async def list_markets(
    client: HttpClient,
    state: Annotated[str | None, Query(description="Filter markets by state")] = None,
) -> DistinctValuesResponse:
    try:
        values = await mandi_service.get_distinct_values(client, "market", state=state)
        return DistinctValuesResponse(field="market", count=len(values), values=values)
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

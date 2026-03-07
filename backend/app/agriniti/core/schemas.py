from typing import Any
from pydantic import BaseModel, Field, model_validator


class MandiRecord(BaseModel):
    """One row of commodity price data from the upstream API.

    Prices (min/max/modal) come back as integers from the upstream API
    (₹ per quintal, wholesale). We store them as int | None but also
    coerce string numerics gracefully.
    """

    state: str | None = None
    district: str | None = None
    market: str | None = None
    commodity: str | None = None
    variety: str | None = None
    grade: str | None = None
    arrival_date: str | None = None
    min_price: float | None = None
    max_price: float | None = None
    modal_price: float | None = None

    model_config = {"populate_by_name": True}

    @model_validator(mode="before")
    @classmethod
    def coerce_price_fields(cls, values: Any) -> Any:
        """Upstream sometimes returns prices as strings — coerce to int."""
        if isinstance(values, dict):
            for field in ("min_price", "max_price", "modal_price"):
                v = values.get(field)
                if isinstance(v, (str, int, float)):
                    try:
                        values[field] = float(v)
                    except (ValueError, TypeError):
                        values[field] = None
        return values


class MandiResponse(BaseModel):
    """Paginated wrapper around a list of MandiRecord."""

    total: int = Field(..., description="Total matching records in upstream dataset")
    count: int = Field(..., description="Number of records returned in this response")
    offset: int = Field(..., description="Pagination offset used")
    limit: int = Field(..., description="Page size used")
    records: list[MandiRecord]


class DistinctValuesResponse(BaseModel):
    """Generic wrapper for a list of distinct values (commodities, states, markets)."""

    field: str
    count: int
    values: list[str]


class ErrorResponse(BaseModel):
    detail: str
    upstream_status: int | None = None
    raw: Any = None

# ---------------------------------------------------------------------------
# Ratings
# ---------------------------------------------------------------------------

class RatingCreate(BaseModel):
    ratee_id: str
    score: int = Field(..., ge=1, le=5)
    comment: str | None = None

class RatingOut(BaseModel):
    id: str
    rater_id: str
    ratee_id: str
    score: int
    comment: str | None
    
    model_config = {"from_attributes": True}

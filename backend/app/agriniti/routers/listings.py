"""
FastAPI router — /listings
CRUD for farmer produce listings.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import supabase
from app.agriniti.core.models import Listing, User
from app.agriniti.routers.auth import get_current_user
from app.agriniti.services import chroma_service, embedding_service

router = APIRouter(prefix="/listings", tags=["Listings"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ListingCreate(BaseModel):
    commodity: str
    variety: str | None = None
    quantity_qtl: float
    price_per_qtl: float
    state: str | None = None
    district: str | None = None
    available_from: str | None = None   # ISO date e.g. "2026-03-15"
    available_until: str | None = None
    unit: str = "Quintal"


class ListingUpdate(BaseModel):
    quantity_qtl: float | None = None
    price_per_qtl: float | None = None
    available_until: str | None = None
    status: str | None = None


class ListingOut(BaseModel):
    id: str
    seller_id: str
    commodity: str
    variety: str | None
    quantity_qtl: float
    price_per_qtl: float
    state: str | None
    district: str | None
    available_from: str | None
    available_until: str | None
    status: str
    created_at: str

    # seller info (flattened for convenience)
    seller_name: str | None = None
    seller_phone: str | None = None
    seller_is_verified: bool = False
    seller_tier: str = "standard"
    seller_rating: float | None = None

    model_config = {"from_attributes": True}


def _listing_out(listing: Listing) -> dict:
    created_at_val = listing.created_at
    if isinstance(created_at_val, str):
        created_at_iso = created_at_val
    elif created_at_val:
        created_at_iso = created_at_val.isoformat()
    else:
        created_at_iso = ""

    return {
        "id": listing.id,
        "seller_id": listing.seller_id,
        "commodity": listing.commodity,
        "variety": listing.variety,
        "quantity_qtl": listing.quantity_qtl,
        "price_per_qtl": listing.price_per_qtl,
        "state": listing.state,
        "district": listing.district,
        "available_from": listing.available_from,
        "available_until": listing.available_until,
        "status": listing.status,
        "created_at": created_at_iso,
        "seller_name": listing.seller.name if listing.seller else None,
        "seller_phone": listing.seller.phone if listing.seller else None,
        "seller_is_verified": listing.seller.is_verified if listing.seller else False,
        "seller_tier": listing.seller.tier if listing.seller else "standard",
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("", response_model=ListingOut, status_code=201, summary="Post a produce listing")
async def create_listing(
    body: ListingCreate,
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("farmer", "both"):
        raise HTTPException(status_code=403, detail="Only farmers can post listings")

    listing_data = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.id,
        "produce_name": body.commodity,
        "variety": body.variety,
        "quantity": body.quantity_qtl,
        "unit": body.unit,
        "expected_price": str(body.price_per_qtl),
        "state": body.state or current_user.state,
        "district": body.district or current_user.district,
        "available_from": body.available_from,
        "available_until": body.available_until,
        "status": "active"
    }
    
    response = supabase.table("produce_listings").insert(listing_data).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create listing in Supabase")
    
    listing = Listing(**response.data[0])
    # Manually attach seller for _listing_out
    listing.seller = current_user

    # Embed listing and store in ChromaDB (non-blocking, best-effort)
    try:
        text = embedding_service.build_listing_text(
            commodity=listing.commodity,
            variety=listing.variety,
            quantity_qtl=listing.quantity_qtl,
            price_per_qtl=listing.price_per_qtl,
            state=listing.state,
            district=listing.district,
            available_from=listing.available_from,
            available_until=listing.available_until,
        )
        vec = await embedding_service.embed_text(text, task_type="RETRIEVAL_DOCUMENT")
        chroma_service.upsert_listing(
            listing_id=listing.id,
            embedding=vec,
            metadata={
                "commodity": listing.commodity or "",
                "state": listing.state or "",
                "district": listing.district or "",
                "price": listing.price_per_qtl,
            },
        )
    except Exception:
        pass  # embedding is best-effort; DB write already succeeded

    return _listing_out(listing)


@router.get("", response_model=list[ListingOut], summary="Browse listings")
def browse_listings(
    commodity: str | None = None,
    state: str | None = None,
    status: str = "active",
    limit: int = 20,
    offset: int = 0,
):
    query = supabase.table("produce_listings").select("*, users(*)").eq("status", status)
    
    if commodity:
        query = query.ilike("produce_name", f"%{commodity}%")
    if state:
        query = query.eq("state", state)
        
    response = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    
    results = []
    for item in response.data:
        user_data = item.pop("users", None)
        listing = Listing(**item)
        if user_data:
            listing.seller = User(**user_data)
        results.append(_listing_out(listing))
    
    return results


@router.get("/mine", response_model=list[ListingOut], summary="My listings")
def my_listings(
    current_user: User = Depends(get_current_user),
):
    response = supabase.table("produce_listings")\
        .select("*, users(*)")\
        .eq("user_id", current_user.id)\
        .order("created_at", desc=True)\
        .execute()
    
    results = []
    for item in response.data:
        user_data = item.pop("users", None)
        listing = Listing(**item)
        if user_data:
            listing.seller = User(**user_data)
        results.append(_listing_out(listing))
    
    return results


@router.get("/{listing_id}", response_model=ListingOut, summary="Get listing detail")
def get_listing(listing_id: str):
    response = supabase.table("produce_listings")\
        .select("*, users(*)")\
        .eq("id", listing_id)\
        .execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Listing not found")
        
    item = response.data[0]
    user_data = item.pop("users", None)
    listing = Listing(**item)
    if user_data:
        listing.seller = User(**user_data)
    return _listing_out(listing)


@router.patch("/{listing_id}", response_model=ListingOut, summary="Update my listing")
def update_listing(
    listing_id: str,
    body: ListingUpdate,
    current_user: User = Depends(get_current_user),
):
    response = supabase.table("produce_listings").select("*").eq("id", listing_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Listing not found")
        
    listing_item = response.data[0]
    if listing_item["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not your listing")

    update_dict = body.model_dump(exclude_none=True)
    if "quantity_qtl" in update_dict:
        update_dict["quantity"] = update_dict.pop("quantity_qtl")
    if "price_per_qtl" in update_dict:
        update_dict["expected_price"] = str(update_dict.pop("price_per_qtl"))

    upd_response = supabase.table("produce_listings")\
        .update(update_dict)\
        .eq("id", listing_id)\
        .execute()
        
    listing = Listing(**upd_response.data[0])
    listing.seller = current_user
    return _listing_out(listing)


@router.delete("/{listing_id}", status_code=204, summary="Deactivate listing")
def delete_listing(
    listing_id: str,
    current_user: User = Depends(get_current_user),
):
    response = supabase.table("produce_listings").select("*").eq("id", listing_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    listing_item = response.data[0]
    if listing_item["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not your listing")
        
    supabase.table("produce_listings").update({"status": "expired"}).eq("id", listing_id).execute()
    # Remove from vector store
    try:
        chroma_service.delete_listing(listing_id)
    except Exception:
        pass

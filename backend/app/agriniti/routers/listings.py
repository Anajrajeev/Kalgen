"""
FastAPI router — /listings
CRUD for farmer produce listings.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.agriniti.core.database import get_db
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
        "created_at": listing.created_at.isoformat(),
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("farmer", "both"):
        raise HTTPException(status_code=403, detail="Only farmers can post listings")

    listing = Listing(
        id=str(uuid.uuid4()),
        seller_id=current_user.id,
        commodity=body.commodity,
        variety=body.variety,
        quantity_qtl=body.quantity_qtl,
        price_per_qtl=body.price_per_qtl,
        state=body.state or current_user.state,
        district=body.district or current_user.district,
        available_from=body.available_from,
        available_until=body.available_until,
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)

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
    db: Session = Depends(get_db),
):
    q = db.query(Listing).filter(Listing.status == status)
    if commodity:
        q = q.filter(Listing.commodity.ilike(f"%{commodity}%"))
    if state:
        q = q.filter(Listing.state == state)
    listings = q.order_by(Listing.created_at.desc()).offset(offset).limit(limit).all()
    return [_listing_out(l) for l in listings]


@router.get("/mine", response_model=list[ListingOut], summary="My listings")
def my_listings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    listings = (
        db.query(Listing)
        .filter(Listing.seller_id == current_user.id)
        .order_by(Listing.created_at.desc())
        .all()
    )
    return [_listing_out(l) for l in listings]


@router.get("/{listing_id}", response_model=ListingOut, summary="Get listing detail")
def get_listing(listing_id: str, db: Session = Depends(get_db)):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return _listing_out(listing)


@router.patch("/{listing_id}", response_model=ListingOut, summary="Update my listing")
def update_listing(
    listing_id: str,
    body: ListingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your listing")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(listing, field, value)
    db.commit()
    db.refresh(listing)
    return _listing_out(listing)


@router.delete("/{listing_id}", status_code=204, summary="Deactivate listing")
def delete_listing(
    listing_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your listing")
    listing.status = "expired"
    db.commit()
    # Remove from vector store
    try:
        chroma_service.delete_listing(listing_id)
    except Exception:
        pass

"""
FastAPI router — /buy-requests
Buyers post what they're looking for.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.agriniti.core.database import get_db
from app.agriniti.core.models import BuyRequest, User
from app.agriniti.routers.auth import get_current_user

router = APIRouter(prefix="/buy-requests", tags=["Buy Requests"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class BuyRequestCreate(BaseModel):
    commodity: str
    variety: str | None = None
    quantity_needed_qtl: float
    max_price_per_qtl: float | None = None
    delivery_state: str | None = None
    delivery_district: str | None = None


class BuyRequestOut(BaseModel):
    id: str
    buyer_id: str
    commodity: str
    variety: str | None
    quantity_needed_qtl: float
    max_price_per_qtl: float | None
    delivery_state: str | None
    delivery_district: str | None
    status: str
    created_at: str
    buyer_name: str | None = None

    model_config = {"from_attributes": True}


def _br_out(br: BuyRequest) -> dict:
    return {
        "id": br.id,
        "buyer_id": br.buyer_id,
        "commodity": br.commodity,
        "variety": br.variety,
        "quantity_needed_qtl": br.quantity_needed_qtl,
        "max_price_per_qtl": br.max_price_per_qtl,
        "delivery_state": br.delivery_state,
        "delivery_district": br.delivery_district,
        "status": br.status,
        "created_at": br.created_at.isoformat(),
        "buyer_name": br.buyer.name if br.buyer else None,
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("", response_model=BuyRequestOut, status_code=201, summary="Post a buy request")
def create_buy_request(
    body: BuyRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("buyer", "both"):
        raise HTTPException(status_code=403, detail="Only buyers can post buy requests")

    br = BuyRequest(
        id=str(uuid.uuid4()),
        buyer_id=current_user.id,
        commodity=body.commodity,
        variety=body.variety,
        quantity_needed_qtl=body.quantity_needed_qtl,
        max_price_per_qtl=body.max_price_per_qtl,
        delivery_state=body.delivery_state or current_user.state,
        delivery_district=body.delivery_district or current_user.district,
    )
    db.add(br)
    db.commit()
    db.refresh(br)
    return _br_out(br)


@router.get("/mine", response_model=list[BuyRequestOut], summary="My buy requests")
def my_buy_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    requests = (
        db.query(BuyRequest)
        .filter(BuyRequest.buyer_id == current_user.id)
        .order_by(BuyRequest.created_at.desc())
        .all()
    )
    return [_br_out(r) for r in requests]


@router.delete("/{request_id}", status_code=204, summary="Cancel a buy request")
def cancel_buy_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    br = db.query(BuyRequest).filter(BuyRequest.id == request_id).first()
    if not br:
        raise HTTPException(status_code=404, detail="Request not found")
    if br.buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your request")
    br.status = "cancelled"
    db.commit()

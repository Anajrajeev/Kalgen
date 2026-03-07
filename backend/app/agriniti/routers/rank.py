"""
FastAPI router — /rank
Semantic ranking using Gemini embeddings + ChromaDB.

GET /rank/sellers?q=<text>              → ranked listings for a buyer search
GET /rank/buyers-for-listing/{id}       → ranked buyers for a farmer's listing
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
import httpx

from app.agriniti.core.database import get_db
from app.agriniti.core.models import Listing, User, Rating
from app.agriniti.services import chroma_service, embedding_service, mandi_service
from app.agriniti.utils import geo

router = APIRouter(prefix="/rank", tags=["Ranking"])


# ---------------------------------------------------------------------------
# Helper — enrich listing dict with seller info from SQLite
# ---------------------------------------------------------------------------

def _enrich(listing: Listing, score: float, metadata: dict, db: Session) -> dict:
    # Get average rating for seller
    avg_score = 0.0
    total_ratings = 0
    if listing.seller_id:
        result = db.query(
            func.avg(Rating.score).label('average_score'),
            func.count(Rating.id).label('total_ratings')
        ).filter(Rating.ratee_id == listing.seller_id).first()
        
        if result and result.total_ratings:
            avg_score = round(result.average_score, 1)
            total_ratings = result.total_ratings

    return {
        "score": score,
        "id": listing.id,
        "commodity": listing.commodity,
        "variety": listing.variety,
        "quantity_qtl": listing.quantity_qtl,
        "price_per_qtl": listing.price_per_qtl,
        "state": listing.state,
        "district": listing.district,
        "available_from": listing.available_from,
        "available_until": listing.available_until,
        "status": listing.status,
        "seller_name": listing.seller.name if listing.seller else None,
        "seller_phone": listing.seller.phone if listing.seller else None,
        "seller_is_verified": listing.seller.is_verified if listing.seller else False,
        "seller_tier": listing.seller.tier if listing.seller else "standard",
        "seller_rating": avg_score,
        "seller_rating_count": total_ratings,
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get(
    "/sellers",
    summary="Rank sellers/listings for a buyer search query",
    description=(
        "Embed the buyer's natural language query using Gemini `text-embedding-004`, "
        "then run cosine similarity search across all active listing embeddings in ChromaDB. "
        "Returns ranked listing cards with similarity scores."
    ),
)
async def rank_sellers(
    q: str = Query(..., description="Free-text search query, e.g. 'Onion from North India, 200 quintal'"),
    buyer_district: str | None = Query(None, description="Buyer's district for distance calculation (e.g. 'Pune')"),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    # 1. Embed the query (use RETRIEVAL_QUERY task type for search)
    try:
        query_vec = await embedding_service.embed_text(q, task_type="RETRIEVAL_QUERY")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini embedding failed: {e}")

    # 2. Similarity search in ChromaDB listings collection
    chroma_results = chroma_service.query_listings(query_vec, n=limit)
    if not chroma_results:
        return {"query": q, "total": 0, "results": []}

    # 3. Fetch full listing details from SQLite
    listing_ids = [r["id"] for r in chroma_results]
    listings = {
        l.id: l
        for l in db.query(Listing)
        .filter(Listing.id.in_(listing_ids), Listing.status == "active")
        .all()
    }

    # 4. Build ranked response (preserve ChromaDB order) and fetch mandi prices
    ranked = []
    for r in chroma_results:
        listing = listings.get(r["id"])
        if listing:
            enriched = _enrich(listing, r["score"], r["metadata"], db)
            
            # 5. Enrich with Mandi Price Label
            enriched["mandi_modal_price"] = None
            enriched["price_vs_market"] = "unknown"
            try:
                # Need to run async mandi call (data.gov API expects title case)
                st = listing.state.title() if listing.state else None
                cm = listing.commodity.title() if listing.commodity else None
                print(f"DEBUG MANDI QUERY: state={st}, commodity={cm}")
                async with httpx.AsyncClient(timeout=10.0) as client:
                    mandi_res = await mandi_service.get_prices(
                        client,
                        state=st,
                        commodity=cm,
                        limit=1
                    )
                if mandi_res.records and mandi_res.records[0].modal_price:
                    modal = mandi_res.records[0].modal_price
                    enriched["mandi_modal_price"] = modal
                    
                    diff = listing.price_per_qtl - modal
                    percent_diff = (diff / modal) * 100
                    
                    if percent_diff > 15:
                        enriched["price_vs_market"] = "above_market"
                    elif percent_diff < -15:
                        enriched["price_vs_market"] = "below_market"
                    else:
                        enriched["price_vs_market"] = "fair_price"
            except Exception as e:
                import traceback
                print(f"MANDI ERROR for {listing.commodity}: {repr(e)}")
            
            # 6. Distance Calculation
            enriched["distance_km"] = None
            if buyer_district:
                buyer_c = geo.get_coords(buyer_district)
                seller_c = geo.get_coords(listing.district)
                if buyer_c and seller_c:
                    enriched["distance_km"] = round(geo.haversine(buyer_c[0], buyer_c[1], seller_c[0], seller_c[1]), 1)

            ranked.append(enriched)

    return {"query": q, "total": len(ranked), "results": ranked}


@router.get(
    "/buyers-for-listing/{listing_id}",
    summary="Find matching buyers for a farmer's listing",
    description=(
        "Uses the listing's stored embedding to find buyers whose profiles "
        "are semantically similar — i.e. they want what the farmer is selling."
    ),
)
async def rank_buyers_for_listing(
    listing_id: str,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    # 1. Get the listing's own embedding by querying ChromaDB with itself
    #    (re-embed listing text from SQLite data)
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # 2. Build listing text and embed it as a query
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
    try:
        listing_vec = await embedding_service.embed_text(text, task_type="RETRIEVAL_QUERY")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini embedding failed: {e}")

    # 3. Search buyer profiles collection
    chroma_results = chroma_service.query_buyers(listing_vec, n=limit)
    if not chroma_results:
        return {"listing_id": listing_id, "total": 0, "matched_buyers": []}

    # 4. Fetch buyer details from SQLite
    buyer_ids = [r["id"] for r in chroma_results]
    buyers = {
        u.id: u
        for u in db.query(User)
        .filter(User.id.in_(buyer_ids))
        .all()
    }

    matched = []
    for r in chroma_results:
        buyer = buyers.get(r["id"])
        if buyer:
            dist = None
            if listing.district and buyer.district:
                lc = geo.get_coords(listing.district)
                bc = geo.get_coords(buyer.district)
                if lc and bc:
                    dist = round(geo.haversine(lc[0], lc[1], bc[0], bc[1]), 1)
                    
            matched.append({
                "score": r["score"],
                "buyer_id": buyer.id,
                "name": buyer.name,
                "state": buyer.state,
                "district": buyer.district,
                "distance_km": dist,
                "primary_crops": buyer.primary_crops,
                "phone": buyer.phone,
                "is_verified": buyer.is_verified,
            })

    return {
        "listing_id": listing_id,
        "commodity": listing.commodity,
        "total": len(matched),
        "matched_buyers": matched,
    }

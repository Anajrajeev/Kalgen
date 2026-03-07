from fastapi import APIRouter, HTTPException, Depends
from app.services.marketplace_service import marketplace_service
from app.routers.auth import get_current_user
from typing import List, Dict, Any, Optional

router = APIRouter()

@router.get("/v1/marketplace/listings")
async def get_listings():
    """Get all active produce listings"""
    try:
        return marketplace_service.get_all_listings()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/v1/marketplace/stats")
async def get_stats():
    """Get overall marketplace stats for marketplace page"""
    try:
        return marketplace_service.get_marketplace_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/v1/marketplace/listings")
async def create_listing(listing_data: Dict[str, Any], current_user: Dict[str, Any] = Depends(get_current_user)):
    """Create a new produce listing"""
    try:
        # listing_data structure match frontend form
        # { produce_name, quantity, unit, expected_price, location }
        return marketplace_service.create_listing(current_user.id, listing_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/v1/marketplace/profile/me")
async def get_my_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get marketplace profile for the logged in user"""
    try:
        profile = marketplace_service.get_marketplace_profile(current_user.id)
        if not profile:
            # If no profile, we can create an empty one or return 404
            return {}
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/v1/marketplace/profile")
async def update_profile(profile_data: Dict[str, Any], current_user: Dict[str, Any] = Depends(get_current_user)):
    """Update or create user marketplace performance profile"""
    try:
        return marketplace_service.create_or_update_profile(current_user.id, profile_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

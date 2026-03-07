from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.agriniti.core.database import get_db
from app.agriniti.core.models import Rating, User
from app.agriniti.routers.auth import get_current_user
from app.agriniti.core.schemas import RatingCreate, RatingOut

router = APIRouter(prefix="/ratings", tags=["Ratings"])

@router.post("/", response_model=RatingOut, status_code=201)
def submit_rating(
    data: RatingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Ensure ratee exists
    ratee = db.query(User).filter(User.id == data.ratee_id).first()
    if not ratee:
        raise HTTPException(status_code=404, detail="User to rate not found")

    # Prevent self-rating
    if current_user.id == data.ratee_id:
        raise HTTPException(status_code=400, detail="Cannot rate yourself")

    # In a real app we'd verify a transaction happened here.
    # For now, allow one rating per rater->ratee pair to avoid spam
    existing = db.query(Rating).filter(
        Rating.rater_id == current_user.id,
        Rating.ratee_id == data.ratee_id
    ).first()
    
    if existing:
        # Update existing
        existing.score = data.score
        existing.comment = data.comment
        db.commit()
        db.refresh(existing)
        return existing

    new_rating = Rating(
        rater_id=current_user.id,
        ratee_id=data.ratee_id,
        score=data.score,
        comment=data.comment
    )
    db.add(new_rating)
    db.commit()
    db.refresh(new_rating)
    return new_rating

@router.get("/user/{user_id}", summary="Get average rating for a user")
def get_user_rating(user_id: str, db: Session = Depends(get_db)):
    result = db.query(
        func.avg(Rating.score).label('average_score'),
        func.count(Rating.id).label('total_ratings')
    ).filter(Rating.ratee_id == user_id).first()
    
    return {
        "user_id": user_id,
        "average_score": round(result.average_score, 1) if result.average_score else 0.0,
        "total_ratings": result.total_ratings or 0
    }

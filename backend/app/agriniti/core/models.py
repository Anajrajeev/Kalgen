"""
SQLAlchemy ORM models — all 5 tables for the AgriNiti marketplace.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.agriniti.core.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    name: Mapped[str] = mapped_column(String)
    role: Mapped[str] = mapped_column(String, default="farmer")  # farmer | buyer | both
    state: Mapped[str | None] = mapped_column(String, nullable=True)
    district: Mapped[str | None] = mapped_column(String, nullable=True)
    pincode: Mapped[str | None] = mapped_column(String, nullable=True)
    primary_crops: Mapped[str | None] = mapped_column(Text, nullable=True)  # comma-separated
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    tier: Mapped[str] = mapped_column(String, default="standard")  # standard | premium
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    listings: Mapped[list["Listing"]] = relationship("Listing", back_populates="seller")
    buy_requests: Mapped[list["BuyRequest"]] = relationship("BuyRequest", back_populates="buyer")


class Listing(Base):
    __tablename__ = "listings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    seller_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    commodity: Mapped[str] = mapped_column(String, index=True)
    variety: Mapped[str | None] = mapped_column(String, nullable=True)
    quantity_qtl: Mapped[float] = mapped_column(Float)
    price_per_qtl: Mapped[float] = mapped_column(Float)
    state: Mapped[str | None] = mapped_column(String, nullable=True)
    district: Mapped[str | None] = mapped_column(String, nullable=True)
    available_from: Mapped[str | None] = mapped_column(String, nullable=True)   # ISO date string
    available_until: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="active")  # active | sold | expired
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    seller: Mapped["User"] = relationship("User", back_populates="listings")


class BuyRequest(Base):
    __tablename__ = "buy_requests"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    buyer_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    commodity: Mapped[str] = mapped_column(String, index=True)
    variety: Mapped[str | None] = mapped_column(String, nullable=True)
    quantity_needed_qtl: Mapped[float] = mapped_column(Float)
    max_price_per_qtl: Mapped[float | None] = mapped_column(Float, nullable=True)
    delivery_state: Mapped[str | None] = mapped_column(String, nullable=True)
    delivery_district: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="open")  # open | fulfilled | cancelled
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    buyer: Mapped["User"] = relationship("User", back_populates="buy_requests")


class Rating(Base):
    __tablename__ = "ratings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    rater_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    ratee_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    score: Mapped[int] = mapped_column(Integer)   # 1–5
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class Interaction(Base):
    __tablename__ = "interactions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    listing_id: Mapped[str] = mapped_column(String, ForeignKey("listings.id"), index=True)
    buyer_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    action: Mapped[str] = mapped_column(String)   # viewed | contacted | transacted
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

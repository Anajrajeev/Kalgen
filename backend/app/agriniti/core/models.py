"""
SQLAlchemy ORM models — Unified schema for AgriNiti profiles, marketplace, and messaging.
Adapted for SQLite compatibility in agriniti.db.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, DECIMAL
from sqlalchemy.orm import Mapped, mapped_column, relationship, synonym, column_property

from app.agriniti.core.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    """Core user authentication and identity."""
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    password: Mapped[str] = mapped_column(String)  # Reverted to match legacy schema
    full_name: Mapped[str | None] = mapped_column(String, nullable=True)
    preferred_language: Mapped[str] = mapped_column(String, default="en")
    
    # Existing fields for backward compatibility/quick access
    role: Mapped[str] = mapped_column(String, default="farmer")  # farmer | buyer | both
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    # Relationships
    profile: Mapped[Optional["UserProfile"]] = relationship("UserProfile", back_populates="user", uselist=False)
    marketplace_profile: Mapped[Optional["MarketplaceProfile"]] = relationship("MarketplaceProfile", back_populates="user", uselist=False)
    listings: Mapped[List["ProduceListing"]] = relationship("ProduceListing", back_populates="seller")
    buy_requests: Mapped[List["BuyRequest"]] = relationship("BuyRequest", back_populates="buyer")
    sent_messages: Mapped[List["Message"]] = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages: Mapped[List["Message"]] = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")

    # Mapped Aliases for robust SQLAlchemy queries
    name_syn = synonym("full_name")
    
    @property
    def name(self):
        return self.full_name
    
    @name.setter
    def name(self, value):
        self.full_name = value

    @property
    def phone(self):
        return self.profile.phone_number if self.profile else None

    @property
    def tier(self):
        return "premium" if self.is_verified else "standard"


class UserProfile(Base):
    """Detailed profile information for a farmer/user."""
    __tablename__ = "user_profiles"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    phone_number: Mapped[str | None] = mapped_column(String, nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    farm_size_acres: Mapped[float | None] = mapped_column(Float, nullable=True)
    primary_crops: Mapped[str | None] = mapped_column(Text, nullable=True)  # Store as comma-separated or JSON string
    location_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    location_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    trust_score: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    user: Mapped["User"] = relationship("User", back_populates="profile")


class MarketplaceProfile(Base):
    """Business-level profile for marketplace activities."""
    __tablename__ = "marketplace_profiles"

    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    business_name: Mapped[str | None] = mapped_column(String, nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    rating: Mapped[float] = mapped_column(Float, default=0.0)
    total_sales: Mapped[int] = mapped_column(Integer, default=0)
    avg_response_time_hrs: Mapped[float] = mapped_column(Float, default=0.0)
    total_listings: Mapped[int] = mapped_column(Integer, default=0)
    trust_score: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    user: Mapped["User"] = relationship("User", back_populates="marketplace_profile")


class ProduceListing(Base):
    """A produce listing on the AgriNiti marketplace."""
    __tablename__ = "produce_listings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    produce_name: Mapped[str] = mapped_column(String, index=True) 
    variety: Mapped[str | None] = mapped_column(String, nullable=True)
    quantity: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String)
    expected_price: Mapped[str] = mapped_column(String)  # Kept as string to match your DDL
    location: Mapped[str | None] = mapped_column(Text, nullable=True)
    state: Mapped[str | None] = mapped_column(String, nullable=True)
    district: Mapped[str | None] = mapped_column(String, nullable=True)
    available_from: Mapped[str | None] = mapped_column(String, nullable=True)
    available_until: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="active")  # active | sold | expired
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    seller: Mapped["User"] = relationship("User", back_populates="listings")

    # Mapped Aliases for legacy router compatibility
    seller_id_syn = synonym("user_id")
    commodity_syn = synonym("produce_name")
    quantity_qtl_syn = synonym("quantity")

    @property
    def seller_id(self):
        return self.user_id
    
    @seller_id.setter
    def seller_id(self, value):
        self.user_id = value

    @property
    def commodity(self):
        return self.produce_name
    
    @commodity.setter
    def commodity(self, value):
        self.produce_name = value

    @property
    def quantity_qtl(self):
        return self.quantity
    
    @quantity_qtl.setter
    def quantity_qtl(self, value):
        self.quantity = value

    @property
    def price_per_qtl(self):
        try:
            return float(self.expected_price or 0)
        except (ValueError, TypeError):
            return 0.0
    
    @price_per_qtl.setter
    def price_per_qtl(self, value):
        self.expected_price = str(value)


class Message(Base):
    """Direct chat messages between users."""
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    sender_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    receiver_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    original_content: Mapped[str] = mapped_column(Text, nullable=False)
    translated_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_language: Mapped[str | None] = mapped_column(String, nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    sender: Mapped["User"] = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver: Mapped["User"] = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")


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
    listing_id: Mapped[str] = mapped_column(String, ForeignKey("produce_listings.id"), index=True)
    buyer_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    action: Mapped[str] = mapped_column(String)   # viewed | contacted | transacted
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

# Backward compatibility alias
Listing = ProduceListing

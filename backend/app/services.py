from typing import Optional
from fastapi import HTTPException, status
from app.database import supabase
from app.models import UserCreate, UserResponse
from app.auth import get_password_hash, verify_password


class UserService:
    @staticmethod
    async def create_user(user_data: UserCreate) -> UserResponse:
        """Create a new user"""
        # Check if user already exists
        existing_user = supabase.table("users").select("*").eq("email", user_data.email).execute()
        
        if existing_user.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash the password
        hashed_password = get_password_hash(user_data.password)
        
        # Create user in Supabase
        user_dict = user_data.dict()
        user_dict["password"] = hashed_password
        
        result = supabase.table("users").insert({
            "email": user_dict["email"],
            "full_name": user_dict.get("full_name"),
            "preferred_language": user_dict.get("preferred_language", "en"),
            "password": hashed_password
        }).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )
        
        # Return user without password
        user_response = result.data[0]
        user_response.pop("password", None)
        
        return UserResponse(**user_response)
    
    @staticmethod
    async def authenticate_user(email: str, password: str) -> Optional[UserResponse]:
        """Authenticate a user"""
        result = supabase.table("users").select("*").eq("email", email).execute()
        
        if not result.data:
            return None
        
        user_data = result.data[0]
        
        if not verify_password(password, user_data["password"]):
            return None
        
        # Remove password from response
        user_data.pop("password", None)
        
        return UserResponse(**user_data)
    
    @staticmethod
    async def get_user_by_email(email: str) -> Optional[UserResponse]:
        """Get user by email"""
        result = supabase.table("users").select("*").eq("email", email).execute()
        
        if not result.data:
            return None
        
        user_data = result.data[0]
        user_data.pop("password", None)
        
        return UserResponse(**user_data)
    
    @staticmethod
    async def update_user(user_id: str, update_data: dict) -> UserResponse:
        """Update user information"""
        # Remove password from update data if present
        update_data.pop("password", None)
        
        result = supabase.table("users").update(update_data).eq("id", user_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserResponse(**result.data[0])

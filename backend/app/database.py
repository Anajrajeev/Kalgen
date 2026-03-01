from supabase import create_client, Client
from app.config import settings


def get_supabase_client() -> Client:
    """Create and return a Supabase client"""
    return create_client(
        supabase_url=settings.supabase_url,
        supabase_key=settings.supabase_service_key
    )


# Global Supabase client instance
supabase = get_supabase_client()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth

app = FastAPI(
    title="AgriNiti API",
    description="Backend API for AgriNiti agricultural platform",
    version="1.0.0",
    debug=settings.debug
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Temporarily allow all origins for debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)

@app.get("/")
async def root():
    return {"message": "Welcome to AgriNiti API"}

@app.options("/{path:path}")
async def options_handler(path: str):
    """Handle OPTIONS requests for debugging"""
    return {"message": "CORS preflight successful"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "AgriNiti API"}

@app.get("/test-db")
async def test_database():
    """Test database connection"""
    try:
        from app.database import supabase
        # Try to query the users table
        result = supabase.table("users").select("count").execute()
        return {"database": "connected", "users_table": "accessible", "data": result.data}
    except Exception as e:
        return {"database": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

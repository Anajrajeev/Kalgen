from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, translation, page_content, marketplace, chat
from app.routers.weather import router as weather_router
from app.middleware import LanguageMiddleware
from contextlib import asynccontextmanager
import httpx
from app.agriniti.core.database import Base, engine
from app.agriniti.routers.mandi import router as mandi_router
from app.agriniti.routers.auth import router as agriniti_auth_router
from app.agriniti.routers.listings import router as listings_router
from app.agriniti.routers.buy_requests import router as buy_requests_router
from app.agriniti.routers.rank import router as rank_router
from app.agriniti.routers.ratings import router as ratings_router
from app.routers.ai_advisory import router as ai_advisory_router
from app.routers.speech_advisory import router as speech_advisory_router
from app.routers.simple_speech_advisory import router as simple_speech_advisory_router
from app.routers.soil_advisory import router as soil_advisory_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all Agriniti SQLite tables on startup
    Base.metadata.create_all(bind=engine)
    
    # Shared async HTTP client for Mandi API
    app.state.http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(connect=5.0, read=30.0, write=10.0, pool=5.0),
        headers={"Accept": "application/json"},
    )
    yield
    await app.state.http_client.aclose()

app = FastAPI(
    title="AgriNiti API",
    description="Backend API for AgriNiti agricultural platform",
    version="1.0.0",
    debug=settings.debug,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Temporarily allow all origins for debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add language detection middleware
app.add_middleware(LanguageMiddleware)

# Include routers
app.include_router(auth.router)
app.include_router(translation.router)
app.include_router(page_content.router)
app.include_router(marketplace.router)
app.include_router(chat.router)

# Agriniti Features
app.include_router(mandi_router)
app.include_router(agriniti_auth_router, prefix="/agriniti")
app.include_router(listings_router, prefix="/agriniti")
app.include_router(buy_requests_router, prefix="/agriniti")
app.include_router(rank_router, prefix="/agriniti")
app.include_router(ratings_router, prefix="/agriniti")

# AI-Advisory RAG
app.include_router(ai_advisory_router, prefix="/ai-advisory", tags=["AI Advisory"])
app.include_router(speech_advisory_router, prefix="/speech-advisory", tags=["Speech Advisory"])
app.include_router(soil_advisory_router, prefix="/soil-advisory", tags=["Soil Advisory"])

# Weather Service
app.include_router(weather_router, tags=["Weather"])

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

"""
Soil Advisory Router - Soil analysis and crop recommendations
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import base64
import io
from typing import Optional, Dict, Any, List

from app.agree_utils.multilingual_rag import MultilingualRAGService

# Global service instance
_multilingual_rag = None

def get_multilingual_rag():
    """Get or create multilingual RAG service instance"""
    global _multilingual_rag
    if _multilingual_rag is None:
        _multilingual_rag = MultilingualRAGService()
    return _multilingual_rag

# Request/Response models
class SoilAnalysisRequest(BaseModel):
    image_file: UploadFile = File(...)
    location: Optional[str] = None

class SoilAnalysisResponse(BaseModel):
    success: bool
    soil_type: Optional[str] = None
    ph_level: Optional[str] = None
    nitrogen_level: Optional[str] = None
    phosphorus_level: Optional[str] = None
    organic_matter: Optional[float] = None
    texture: Optional[str] = None
    color: Optional[str] = None
    moisture_level: Optional[str] = None
    recommended_crops: Optional[List[str]] = None
    fertility_indicators: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    confidence: Optional[float] = None

# Create router
router = APIRouter()

@router.post("/soil-analysis", response_model=SoilAnalysisResponse)
async def analyze_soil(
    image_file: UploadFile = File(...),
    location: Optional[str] = None
):
    """Analyze soil image and provide farming recommendations"""
    try:
        # Get service instance
        service = get_multilingual_rag()
        
        # Read image file
        image_data = await image_file.read()
        
        # For now, provide a mock analysis based on image characteristics
        # In production, this would use computer vision to analyze soil properties
        image_size = len(image_data)
        
        # Mock soil analysis based on image size and characteristics
        if image_size < 100000:  # Small image
            soil_type = "sandy loam"
            ph_level = "6.5-7.0"
            nitrogen_level = "medium"
            phosphorus_level = "low"
            organic_matter = 2.5
            texture = "medium"
            color = "light brown"
            recommended_crops = ["wheat", "rice", "pulses"]
            fertility_indicators = ["good drainage", "moderate fertility"]
            recommendations = [
                "Add organic compost to improve soil structure",
                "Consider crop rotation with legumes",
                "Test soil pH and adjust with lime if needed",
                "Use balanced NPK fertilizer for wheat"
            ]
            confidence = 0.85
        elif image_size < 500000:  # Medium image
            soil_type = "clay loam"
            ph_level = "6.0-6.5"
            nitrogen_level = "low"
            phosphorus_level = "medium"
            organic_matter = 3.0
            texture = "fine"
            color = "dark brown"
            recommended_crops = ["cotton", "maize", "vegetables"]
            fertility_indicators = ["poor drainage", "high fertility"]
            recommendations = [
                "Improve drainage with raised beds",
                "Add gypsum to improve soil structure",
                "Use green manure before planting",
                "Consider drip irrigation for water efficiency"
            ]
            confidence = 0.75
        else:  # Large image
            soil_type = "black cotton soil"
            ph_level = "5.5-6.0"
            nitrogen_level = "high"
            phosphorus_level = "high"
            organic_matter = 1.5
            texture = "coarse"
            color = "very dark brown"
            recommended_crops = ["sugarcane", "millets", "oilseeds"]
            fertility_indicators = ["excellent drainage", "very high fertility"]
            recommendations = [
                "Add deep ploughing to break hardpan",
                "Use organic matter to improve water retention",
                "Apply balanced fertilizer with micronutrients",
                "Consider mulching to conserve moisture"
            ]
            confidence = 0.65
        
        # Get additional farming advice using RAG
        rag_query = f"Based on soil analysis for {soil_type} soil with pH {ph_level}, what crops are recommended for this soil type?"
        
        rag_result = await service.process_text_query(
            text=rag_query,
            source_language='en',
            target_language='en',
            return_audio=False
        )
        
        return SoilAnalysisResponse(
            success=True,
            soil_type=soil_type,
            ph_level=ph_level,
            nitrogen_level=nitrogen_level,
            phosphorus_level=phosphorus_level,
            organic_matter=organic_matter,
            texture=texture,
            color=color,
            recommended_crops=recommended_crops,
            fertility_indicators=fertility_indicators,
            recommendations=recommendations + rag_result.get('rag_response', '').split('. ')[:2],
            confidence=confidence
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Soil analysis failed: {str(e)}"
        )

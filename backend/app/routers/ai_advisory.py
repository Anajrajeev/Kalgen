from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from pydantic import BaseModel
import os
import base64
import json
import re
from typing import Dict, Any

from app.agree_utils.rag import RAGSystem
from app.agree_utils.document_loader import load_pdf_documents, ingest_documents
from app.agree_utils.bedrock_client import BedrockClient

router = APIRouter()

# Lazy initialization - RAGSystem will be created on first request
_rag_instance = None
_bedrock_client = None

def get_rag():
    global _rag_instance
    if _rag_instance is None:
        _rag_instance = RAGSystem(collection_name="kb_collection", embed_dim=512, require_bedrock=True)
    return _rag_instance

def get_bedrock_client():
    global _bedrock_client
    if _bedrock_client is None:
        _bedrock_client = BedrockClient()
    return _bedrock_client


class IngestRequest(BaseModel):
    id: str
    text: str


class QueryRequest(BaseModel):
    query: str
    model_id: str = "amazon.titan-embed-text-v1"
    top_k: int = 3

    class Config:
        schema_extra = {
            "example": {
                "query": "What is Kisan Samman scheme?",
                "model_id": "amazon.titan-embed-text-v1",
                "top_k": 3
            }
        }


@router.post("/test-query")
def test_query(req: QueryRequest):
    """Test endpoint to verify request parsing."""
    return {"received": req.dict(), "message": "Request parsed successfully"}


@router.post("/ingest-pdf")
def ingest_pdf():
    """Load and ingest PDF documents from KB folder."""
    try:
        # Use the KB directory path
        kb_dir = os.path.join(os.path.dirname(__file__), "..", "agree_utils", "KB")
        kb_dir = os.path.abspath(kb_dir)
        
        if not os.path.exists(kb_dir):
            raise HTTPException(status_code=400, detail=f"KB directory not found: {kb_dir}")
        
        documents = load_pdf_documents(kb_dir)
        if not documents:
            return {"status": "ok", "message": "No PDF files found to ingest", "count": 0}
        
        rag = get_rag()
        ingest_documents(rag, documents)
        
        return {
            "status": "ok",
            "message": f"Successfully ingested {len(documents)} documents from KB directory",
            "count": len(documents),
            "kb_directory": kb_dir
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clear-kb")
def clear_kb_collection():
    """Clear the KB collection and create a fresh one."""
    try:
        global _rag_instance
        _rag_instance = None  # Reset the instance
        
        # Create new RAG instance which will create fresh collection
        rag = get_rag()
        
        return {
            "status": "ok",
            "message": "KB collection cleared successfully. Ready for fresh ingestion.",
            "collection_name": "kb_collection"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ingest")
def ingest(req: IngestRequest):
    try:
        rag = get_rag()
        rag.ingest([req.id], [req.text])
        return {"status": "ok", "id": req.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/kb-status")
def get_kb_status():
    """Get the status of the KB collection."""
    try:
        rag = get_rag()
        collection_info = {
            "collection_name": "kb_collection",
            "status": "active"
        }
        
        # Try to get collection count if possible
        try:
            count = rag.store.collection.count()
            collection_info["document_count"] = count
        except:
            collection_info["document_count"] = "unknown"
        
        return collection_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class PlantDiseaseResponse(BaseModel):
    plant_type: str
    disease_detected: str
    confidence_score: float
    symptoms: str
    treatment_suggestions: str
    severity: str
    additional_notes: str


@router.post("/analyze-plant-disease", response_model=PlantDiseaseResponse)
async def analyze_plant_disease(file: UploadFile = File(...)):
    """
    Analyze plant image for disease detection using Claude 3 Haiku vision model.
    
    Upload a plant/leaf image to identify:
    - Plant type (tomato, rice, wheat, etc.)
    - Disease or abnormality
    - Confidence score
    - Treatment suggestions
    
    Note: Uses Claude 3 Haiku for cost-effective analysis with good accuracy.
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image (JPEG, PNG, etc.)")
        
        # Read and encode image
        image_bytes = await file.read()
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        # Determine media type
        media_type = file.content_type if file.content_type else "image/jpeg"
        
        # Create detailed prompt for plant disease analysis
        prompt = """
        You are an expert agricultural pathologist. Analyze this plant image carefully and provide a detailed assessment in the following JSON format:

        {
            "plant_type": "Identify the plant (e.g., tomato, rice, wheat, corn, etc.)",
            "disease_detected": "Name of the disease or 'healthy' if no disease detected",
            "confidence_score": 0.8,
            "symptoms": "Detailed description of visible symptoms",
            "treatment_suggestions": "Specific treatment recommendations",
            "severity": "mild/moderate/severe",
            "additional_notes": "Any other relevant observations"
        }

        Focus on:
        1. Accurate plant identification
        2. Disease detection if present
        3. Visible symptoms and patterns
        4. Practical treatment suggestions
        5. Severity assessment

        If you cannot identify the plant or detect disease with confidence, indicate that clearly.
        Return only valid JSON format.
        """
        
        # Get Bedrock client and analyze image
        bedrock = get_bedrock_client()
        
        # Try Claude 3 Sonnet first
        try:
            def analyze_image_with_media_type(image_data, prompt, media_type):
                try:
                    import boto3
                    from app.agree_utils.config import settings
                    
                    runtime_client = boto3.client(
                        "bedrock-runtime",
                        region_name=settings.aws_region,
                        aws_access_key_id=settings.aws_access_key,
                        aws_secret_access_key=settings.aws_secret_key,
                    )
                    
                    body = {
                        "anthropic_version": "bedrock-2023-05-31",
                        "messages": [
                            {
                                "role": "user",
                                "content": [
                                    {
                                        "type": "image",
                                        "source": {
                                            "type": "base64",
                                            "media_type": media_type,
                                            "data": image_data
                                        }
                                    },
                                    {
                                        "type": "text",
                                        "text": prompt
                                    }
                                ]
                            }
                        ],
                        "max_tokens": 1000,
                        "temperature": 0.1
                    }
                    
                    response = runtime_client.invoke_model(
                        modelId="anthropic.claude-3-haiku-20240307-v1:0",
                        body=json.dumps(body)
                    )
                    
                    response_body = json.loads(response["body"].read())
                    answer = response_body.get("content", [{}])[0].get("text", "")
                    
                    return answer
                    
                except Exception as e:
                    return f"Error calling Claude 3 Vision: {str(e)}"
            
            # Analyze image
            analysis_result = analyze_image_with_media_type(image_base64, prompt, media_type)
            
            if analysis_result.startswith("Error"):
                # If Claude 3 Haiku fails, provide a helpful response
                return PlantDiseaseResponse(
                    plant_type="Analysis unavailable",
                    disease_detected="Claude 3 Haiku not available",
                    confidence_score=0.0,
                    symptoms="AWS Bedrock Claude 3 Haiku model is not available in your region. Please check AWS Bedrock console for available models.",
                    treatment_suggestions="Contact AWS support or try a different AWS region",
                    severity="high",
                    additional_notes="Consider using AWS us-east-1 region for Claude 3 model availability"
                )
            
            # Parse JSON response
            try:
                # Extract JSON from the response
                json_match = re.search(r'\{.*\}', analysis_result, re.DOTALL)
                if json_match:
                    result_dict = json.loads(json_match.group())
                else:
                    # Fallback if JSON parsing fails
                    result_dict = {
                        "plant_type": "Unknown",
                        "disease_detected": "Analysis failed",
                        "confidence_score": 0.0,
                        "symptoms": analysis_result[:200],
                        "treatment_suggestions": "Consult with agricultural expert",
                        "severity": "unknown",
                        "additional_notes": "AI analysis completed but parsing failed. Please check the input image and try again."
                    }
                
                return PlantDiseaseResponse(**result_dict)
                
            except Exception as parse_error:
                raise HTTPException(
                    status_code=500, 
                    detail=f"Failed to parse analysis result: {str(parse_error)}"
                )
        
        except HTTPException as http_ex:
            raise HTTPException(status_code=500, detail=analysis_result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plant disease analysis failed: {str(e)}")


@router.post("/query")
def query(req: QueryRequest):
    try:
        print("Query request received")
        rag = get_rag()
        # return_context for debugging, always include context in the response
        answer, context = rag.query(req.query, model_id=req.model_id, n_ctx=req.top_k, return_context=True)
        return {"answer": answer, "context": context}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

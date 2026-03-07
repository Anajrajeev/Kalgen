from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import os

from app.agree_utils.rag import RAGSystem
from app.agree_utils.document_loader import load_pdf_documents, ingest_documents

router = APIRouter()

# Lazy initialization - RAGSystem will be created on first request
_rag_instance = None

def get_rag():
    global _rag_instance
    if _rag_instance is None:
        _rag_instance = RAGSystem(collection_name="kb_collection", embed_dim=512, require_bedrock=True)
    return _rag_instance


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

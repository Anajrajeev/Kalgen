from fastapi import APIRouter, HTTPException, Depends
from app.services.chat_service import chat_service
from app.routers.auth import get_current_user
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/v1/chat", tags=["chat"])

@router.get("/conversations")
async def get_conversations(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get list of active chat partners"""
    try:
        return chat_service.get_recent_chats(current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{receiver_id}")
async def get_history(receiver_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get chat history with a specific person"""
    try:
        return chat_service.get_chat_history(current_user.id, receiver_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send")
async def send_message(msg_data: Dict[str, Any], current_user: Dict[str, Any] = Depends(get_current_user)):
    """Send a new message with auto-translation"""
    try:
        sender_id = current_user.id
        receiver_id = msg_data.get("receiver_id")
        content = msg_data.get("content")
        target_language = msg_data.get("target_language") # Language of receiver
        
        if not receiver_id or not content:
            raise HTTPException(status_code=400, detail="Missing receiver or content")
            
        return chat_service.send_message(sender_id, receiver_id, content, target_language)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

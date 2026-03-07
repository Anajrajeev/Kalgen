from app.database import supabase
from app.services.translate_service import translate_service
from typing import List, Dict, Any, Optional
from datetime import datetime

class ChatService:
    @staticmethod
    def send_message(sender_id: str, receiver_id: str, content: str, target_language: str) -> Dict[str, Any]:
        """Send a message with automatic translation"""
        # 1. Translate content if target language is different
        translated_content = content
        # For demo purposes/simplicity, we translate and store both.
        # In a high-scale app, we might translate on the fly.
        try:
            # We assume translation service handles language detection or we use preferred_language
            translated_content = translate_service.translate_text(content, "auto", target_language or "en")
        except Exception as e:
            print(f"Translation failed: {e}")

        data = {
            "sender_id": sender_id,
            "receiver_id": receiver_id,
            "original_content": content,
            "translated_content": translated_content,
            "target_language": target_language,
            "is_read": False,
            "created_at": datetime.utcnow().isoformat()
        }
        
        response = supabase.table("messages").insert(data).execute()
        return response.data[0] if response.data else {}

    @staticmethod
    def get_chat_history(user1_id: str, user2_id: str) -> List[Dict[str, Any]]:
        """Fetch message history between two users"""
        # A safer way to query for OR when versions vary: get all for this user and filter or use filter('or', ...)
        # We use a query that gets all messages involving BOTH users.
        # This is very reliable for 2-person chats.
        try:
            # Get all messages where either user is sender or receiver
            # This approach is more reliable than complex OR queries
            response1 = supabase.table("messages") \
                .select("*") \
                .filter("sender_id", "eq", user1_id) \
                .filter("receiver_id", "eq", user2_id) \
                .order("created_at", desc=False) \
                .execute()
                
            response2 = supabase.table("messages") \
                .select("*") \
                .filter("sender_id", "eq", user2_id) \
                .filter("receiver_id", "eq", user1_id) \
                .order("created_at", desc=False) \
                .execute()
            
            # Combine and sort by timestamp
            all_messages = (response1.data or []) + (response2.data or [])
            all_messages.sort(key=lambda x: x.get('created_at', ''))
            
            return all_messages
        except Exception as e:
            print(f"Chat history query failed: {e}")
            return []

    @staticmethod
    def get_recent_chats(user_id: str) -> List[Dict[str, Any]]:
        """Fetch list of people the user has chatted with"""
        try:
            # Get messages where user is sender or receiver, without complex joins
            res1 = supabase.table("messages")\
                .select("*")\
                .filter("sender_id", "eq", user_id)\
                .order("created_at", desc=True)\
                .execute()
                
            res2 = supabase.table("messages")\
                .select("*")\
                .filter("receiver_id", "eq", user_id)\
                .order("created_at", desc=True)\
                .execute()
                
            messages = (res1.data or []) + (res2.data or [])
            messages.sort(key=lambda x: x.get('created_at', ''), reverse=True)
            
            # Get unique user IDs the user has chatted with
            unique_user_ids = set()
            for msg in messages:
                other_id = msg['receiver_id'] if msg['sender_id'] == user_id else msg['sender_id']
                unique_user_ids.add(other_id)
            
            # Get user details for each unique user
            contacts = []
            for other_user_id in unique_user_ids:
                try:
                    # Get user details
                    user_response = supabase.table("users")\
                        .select("full_name")\
                        .filter("id", "eq", other_user_id)\
                        .execute()
                    
                    user_name = "Unknown"
                    if user_response.data and len(user_response.data) > 0:
                        user_name = user_response.data[0].get('full_name', 'Unknown')
                    
                    # Find the last message with this user
                    last_msg = None
                    for msg in messages:
                        if (msg['sender_id'] == user_id and msg['receiver_id'] == other_user_id) or \
                           (msg['sender_id'] == other_user_id and msg['receiver_id'] == user_id):
                            last_msg = msg
                            break
                    
                    if last_msg:
                        contacts.append({
                            "user_id": other_user_id,
                            "name": user_name,
                            "last_message": last_msg['translated_content'] if last_msg['translated_content'] else last_msg['original_content'],
                            "timestamp": last_msg['created_at'],
                            "unread_count": 0  # To be implemented
                        })
                except Exception as e:
                    print(f"Error getting user details for {other_user_id}: {e}")
                    continue
                    
            return contacts
        except Exception as e:
            print(f"Failed to get recent chats: {e}")
            return []

chat_service = ChatService()

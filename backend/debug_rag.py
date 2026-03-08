from app.agree_utils.multilingual_rag import MultilingualRAGService
import asyncio

async def debug_rag():
    try:
        service = MultilingualRAGService()
        
        # Test with debug output
        result = await service.process_text_query(
            text='What is Kisan Samman scheme?',
            source_language='en',
            target_language='en',
            return_audio=False
        )
        
        print('Debug Results:')
        print('Success:', result['success'])
        print('RAG Response Type:', type(result.get('rag_response')))
        print('RAG Response:', result.get('rag_response'))
        print('RAG Response Repr:', repr(result.get('rag_response')))
        print('Processing Time:', result.get('processing_time', 0))
        
    except Exception as e:
        print('Error:', e)
        import traceback
        traceback.print_exc()

asyncio.run(debug_rag())

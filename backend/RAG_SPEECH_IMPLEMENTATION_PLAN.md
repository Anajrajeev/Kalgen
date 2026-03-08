# RAG Speech-to-Speech & Multilingual Implementation Plan

## 🎯 Objective
Enhance the existing RAG system to support:
1. **Speech-to-Speech** - Voice input and voice output
2. **Multilingual** - Support for multiple languages
3. **Integration** - Seamless with existing RAG pipeline

## 🏗️ Architecture Overview

```
User Speech Input → STT → Translation → RAG Query → Response → Translation → TTS → User Speech Output
```

## 📋 Implementation Phases

### Phase 1: Speech-to-Text (STT) Integration
**Purpose**: Convert voice input to text for RAG processing

**Technologies**:
- **AWS Transcribe** (already in requirements.txt)
- **Alternative**: Google Speech-to-Text (google-generativeai already available)

**Implementation**:
```python
# app/agree_utils/speech_to_text.py
class SpeechToText:
    def __init__(self):
        # AWS Transcribe or Google Speech-to-Text
        
    def transcribe_audio(self, audio_data: bytes, language: str = "en-US") -> str:
        # Convert speech to text
        return transcribed_text
```

**Endpoints**:
- `POST /ai-advisory/speech-query` - Accept audio file
- `POST /ai-advisory/streaming-speech` - Real-time speech processing

### Phase 2: Multilingual Translation
**Purpose**: Translate between user language and RAG processing language

**Technologies**:
- **AWS Translate** (boto3 already available)
- **Alternative**: Google Translate API

**Implementation**:
```python
# app/agree_utils/translation.py
class TranslationService:
    def __init__(self):
        # AWS Translate or Google Translate
        
    def detect_language(self, text: str) -> str:
        # Detect input language
        
    def translate_text(self, text: str, source_lang: str, target_lang: str) -> str:
        # Translate text
```

**Supported Languages**:
- English (en) - Primary RAG language
- Hindi (hi) - Indian agricultural context
- Spanish (es) - Global agricultural support
- French (fr) - International agricultural research
- Mandarin (zh) - Asian agricultural markets

### Phase 3: Text-to-Speech (TTS) Integration
**Purpose**: Convert RAG response back to speech

**Technologies**:
- **AWS Polly** (boto3 already available)
- **Alternative**: Google Text-to-Speech

**Implementation**:
```python
# app/agree_utils/text_to_speech.py
class TextToSpeech:
    def __init__(self):
        # AWS Polly or Google TTS
        
    def synthesize_speech(self, text: str, language: str = "en-US") -> bytes:
        # Convert text to speech audio
        return audio_data
```

### Phase 4: RAG Integration
**Purpose**: Integrate speech pipeline with existing RAG system

**Implementation**:
```python
# app/routers/speech_advisory.py
@router.post("/speech-query")
async def speech_query(audio_file: UploadFile = File(...), language: str = "auto"):
    # 1. Transcribe audio to text
    # 2. Detect language if auto
    # 3. Translate to English if needed
    # 4. Query RAG system
    # 5. Translate response back to user language
    # 6. Convert to speech
    # 7. Return audio response
```

## 🛠️ Technical Implementation Details

### File Structure
```
app/
├── agree_utils/
│   ├── speech_to_text.py      # STT implementation
│   ├── translation.py         # Translation services
│   ├── text_to_speech.py      # TTS implementation
│   └── multilingual_rag.py    # Integrated pipeline
├── routers/
│   ├── speech_advisory.py     # Speech endpoints
│   └── ai_advisory.py         # Existing RAG (enhanced)
└── models/
    └── speech_models.py       # Pydantic models for speech
```

### Key Components

#### 1. Speech-to-Text Service
```python
class SpeechToTextService:
    def __init__(self):
        self.transcribe_client = boto3.client('transcribe')
        
    async def transcribe_audio_file(self, audio_data: bytes, language: str = "en-US"):
        # Start transcription job
        # Poll for completion
        # Return transcribed text
```

#### 2. Translation Service
```python
class TranslationService:
    def __init__(self):
        self.translate_client = boto3.client('translate')
        
    def detect_language(self, text: str) -> str:
        # AWS Comprehend for language detection
        
    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        # AWS Translate for text translation
```

#### 3. Text-to-Speech Service
```python
class TextToSpeechService:
    def __init__(self):
        self.polly_client = boto3.client('polly')
        
    def synthesize(self, text: str, language: str = "en-US", voice: str = "Joanna"):
        # AWS Polly for speech synthesis
        # Return audio bytes
```

#### 4. Multilingual RAG Pipeline
```python
class MultilingualRAG:
    def __init__(self):
        self.stt = SpeechToTextService()
        self.translation = TranslationService()
        self.tts = TextToSpeechService()
        self.rag = RAGSystem()  # Existing RAG
        
    async def process_speech_query(self, audio_data: bytes, source_language: str = "auto"):
        # 1. Transcribe audio
        transcribed_text = await self.stt.transcribe_audio_file(audio_data)
        
        # 2. Detect language if auto
        if source_language == "auto":
            source_language = self.translation.detect_language(transcribed_text)
        
        # 3. Translate to English for RAG
        if source_language != "en":
            english_text = self.translation.translate(transcribed_text, source_language, "en")
        else:
            english_text = transcribed_text
        
        # 4. Query RAG
        rag_response, context = self.rag.query(english_text, return_context=True)
        
        # 5. Translate response back
        if source_language != "en":
            translated_response = self.translation.translate(rag_response, "en", source_language)
        else:
            translated_response = rag_response
        
        # 6. Convert to speech
        audio_response = self.tts.synthesize(translated_response, source_language)
        
        return {
            "transcribed_text": transcribed_text,
            "rag_response": rag_response,
            "translated_response": translated_response,
            "audio_response": audio_response,
            "source_language": source_language,
            "context": context
        }
```

## 🌐 API Endpoints

### 1. Speech Query Endpoint
```python
@router.post("/speech-query")
async def speech_query(
    audio_file: UploadFile = File(...),
    language: str = "auto",
    return_text: bool = False
):
    """
    Process speech query and return audio response
    """
    # Process audio through multilingual RAG pipeline
    # Return audio file or text based on return_text flag
```

### 2. Streaming Speech Endpoint
```python
@router.post("/streaming-speech")
async def streaming_speech():
    """
    Real-time speech processing using WebSockets
    """
    # WebSocket implementation for real-time speech
```

### 3. Language Detection Endpoint
```python
@router.post("/detect-language")
async def detect_language(text: str):
    """
    Detect language of input text
    """
    # Return detected language code
```

## 📊 Data Models

```python
class SpeechQueryRequest(BaseModel):
    language: str = "auto"
    return_text: bool = False
    voice_preference: Optional[str] = None

class SpeechQueryResponse(BaseModel):
    transcribed_text: str
    rag_response: str
    translated_response: str
    audio_response_url: Optional[str]
    source_language: str
    confidence_score: float
    processing_time: float
```

## 🎛️ Configuration

### Environment Variables (.env)
```env
# AWS Services
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Speech Services
TRANSCRIBE_SERVICE=aws  # aws or google
TRANSLATE_SERVICE=aws   # aws or google
TTS_SERVICE=aws         # aws or google

# Supported Languages
SUPPORTED_LANGUAGES=en,hi,es,fr,zh,de,ja,ar
DEFAULT_LANGUAGE=en

# Audio Settings
MAX_AUDIO_SIZE=25MB
SUPPORTED_FORMATS=wav,mp3,m4a,flac
```

## 🚀 Implementation Steps

### Step 1: Setup Speech Services (Week 1)
1. Configure AWS Transcribe for STT
2. Configure AWS Translate for multilingual support
3. Configure AWS Polly for TTS
4. Create base service classes

### Step 2: Implement Core Pipeline (Week 2)
1. Build Speech-to-Text service
2. Build Translation service
3. Build Text-to-Speech service
4. Create integrated pipeline

### Step 3: API Integration (Week 3)
1. Create speech endpoints
2. Add error handling and validation
3. Implement audio file processing
4. Add streaming support

### Step 4: Testing & Optimization (Week 4)
1. Unit tests for all services
2. Integration tests
3. Performance optimization
4. User testing and feedback

## 💡 Advanced Features

### 1. Voice Personalization
- User-specific voice preferences
- Custom voice training
- Accent adaptation

### 2. Context-Aware Translation
- Agricultural terminology preservation
- Domain-specific translation models
- Contextual language detection

### 3. Real-time Processing
- WebSocket streaming
- Low-latency processing
- Progressive response generation

### 4. Offline Capabilities
- Local STT/TTS models
- Caching strategies
- Fallback mechanisms

## 🔧 Technical Considerations

### Performance
- **Audio Processing**: Optimize for large audio files
- **Caching**: Cache translation results
- **Async Processing**: Use async/await for I/O operations
- **Queue Management**: Handle concurrent speech requests

### Security
- **Audio Validation**: Validate audio file formats and sizes
- **Rate Limiting**: Prevent abuse of speech endpoints
- **Data Privacy**: Secure handling of audio data
- **Access Control**: Authentication for speech features

### Scalability
- **Microservices**: Separate speech services
- **Load Balancing**: Distribute speech processing
- **Auto-scaling**: Scale based on demand
- **Monitoring**: Track speech service performance

## 📈 Success Metrics

### Technical Metrics
- **Accuracy**: STT accuracy > 90%
- **Latency**: End-to-end processing < 10 seconds
- **Languages**: Support for 8+ languages
- **Uptime**: 99.9% availability

### User Metrics
- **Usage**: Number of speech queries per day
- **Satisfaction**: User feedback scores
- **Adoption**: % of users using speech features
- **Retention**: User engagement over time

## 🎯 Next Steps

1. **Start with Phase 1**: Implement basic STT integration
2. **Add Phase 2**: Add translation capabilities
3. **Integrate Phase 3**: Add TTS for complete pipeline
4. **Deploy Phase 4**: Full integration with RAG system

This implementation provides a comprehensive, scalable, and user-friendly multilingual speech-enabled RAG system that builds upon your existing infrastructure while adding powerful new capabilities.

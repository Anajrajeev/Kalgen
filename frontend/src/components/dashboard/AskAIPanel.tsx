import { ImageIcon, Mic, SendHorizontal, Sparkles, Square } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTranslation } from '../../services/useTranslation';
import { apiClient } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '../../store/languageStore';

interface AskAIPanelProps {
  onChatStart?: () => void;
}

export function AskAIPanel({ onChatStart }: AskAIPanelProps) {
  const { label, t } = useTranslation();
  const navigate = useNavigate();
  const selectedLanguage = useLanguageStore((s) => s.selectedLanguage);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'ai', content: string }>>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAsk = async () => {
    if (!query.trim() || isAsking) return;
    onChatStart?.();

    const userMessage = query.trim();
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setQuery('');
    setIsAsking(true);

    try {
      const response = await apiClient.queryKb(userMessage);
      if (response.error) {
        setMessages(prev => [...prev, { type: 'ai', content: `Error: ${response.error}` }]);
      } else if (response.data && response.data.answer) {
        const translatedResponse = await t(response.data.answer);
        setMessages(prev => [...prev, { type: 'ai', content: translatedResponse }]);
      } else {
        setMessages(prev => [...prev, { type: 'ai', content: "I couldn't process your request at the moment." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { type: 'ai', content: "An unexpected error occurred while communicating with the AI." }]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const handleVoiceQuery = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        onChatStart?.();
        setMessages(prev => [...prev, { type: 'user', content: '🎤 Voice Message' }]);
        setIsAsking(true);
        stream.getTracks().forEach(track => track.stop());

        try {
          const response = await apiClient.speechQuery(audioBlob, selectedLanguage);
          if (response.error) {
            setMessages(prev => [...prev, { type: 'ai', content: `Error: ${response.error}` }]);
          } else if (response.data) {
            const data = response.data;
            const aiMessage = `${data.translated_response || data.rag_response}\n\n(Transcribed: ${data.transcribed_text})`;
            setMessages(prev => [...prev, { type: 'ai', content: aiMessage }]);

            if (data.audio_response) {
              const audioObj = new Audio(`data:audio/mp3;base64,${data.audio_response}`);
              audioObj.play().catch(e => console.error('Audio playback failed', e));
            }
          }
        } catch (err) {
          setMessages(prev => [...prev, { type: 'ai', content: "An error occurred while processing your voice query." }]);
        } finally {
          setIsAsking(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setMessages(prev => [...prev, { type: 'ai', content: "Microphone access is required for voice queries." }]);
    }
  };

  const handleImageUpload = () => {
    navigate('/ai-disease-detection');
  };

  return (
    <Card className="p-6 h-full flex flex-col bg-AgriNiti-primary/5 border-AgriNiti-primary/20">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-AgriNiti-text">{label('askAiTitle')}</h2>
          <p className="mt-2 text-sm text-AgriNiti-text-muted">
            {label('askAiDescription')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            className={`inline-flex items-center gap-2 px-4 py-2 text-base ${isRecording ? 'bg-red-500 hover:bg-red-600 border-red-500 text-white' : ''}`}
            onClick={handleVoiceQuery}
          >
            {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            <span>{isRecording ? 'Stop Recording' : label('voiceQuery')}</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="inline-flex items-center gap-2 px-4 py-2 text-base"
            onClick={handleImageUpload}
          >
            <ImageIcon className="h-5 w-5" />
            <span>{label('uploadImage')}</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-auto mb-4 space-y-3 pr-2 custom-scrollbar" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-AgriNiti-text-muted opacity-50 py-10">
              <Sparkles className="h-12 w-12 mb-4" />
              <p>{label('emptyChatMessage') || "Start a conversation to get AI-powered insights."}</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.type === 'user'
                  ? 'bg-AgriNiti-primary text-white shadow-md'
                  : 'bg-white border border-AgriNiti-border/50 text-AgriNiti-text shadow-sm'
                  }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isAsking && (
            <div className="flex justify-start">
              <div className="bg-white border border-AgriNiti-border/50 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-AgriNiti-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-AgriNiti-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-AgriNiti-primary rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[80px] max-h-48 resize-none pr-12 px-4 py-3 border border-AgriNiti-border/50 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-AgriNiti-primary/50 bg-white"
            placeholder={label('askAiPlaceholder')}
            disabled={isAsking}
          />
          <button
            type="button"
            onClick={handleAsk}
            disabled={!query.trim() || isAsking}
            className="absolute bottom-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-AgriNiti-primary text-white shadow-soft-card hover:bg-AgriNiti-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SendHorizontal className={`h-5 w-5 ${isAsking ? 'animate-pulse' : ''}`} />
          </button>
        </div>
      </div>
    </Card>
  );
}



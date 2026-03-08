import { AlertTriangle, Droplets, Bug, CloudRain, Camera, Sparkles, TrendingUp, Lightbulb, SendHorizontal, Mic, ImageIcon, Square } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../services/useTranslation';
import { apiClient } from '../services/api';
import { useLanguageStore } from '../store/languageStore';

interface Feature {
  id: number;
  title: string;
  description: string;
  icon: any;
  color: string;
  features: string[];
}

export function CropAnalysisPage() {
  const { label, t } = useTranslation();
  const navigate = useNavigate();
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'ai', content: string }>>([]);
  const [isAsking, setIsAsking] = useState(false);
  const selectedLanguage = useLanguageStore((s) => s.selectedLanguage);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const aiFeatures: Feature[] = [
    {
      id: 1,
      title: label('aiDiseaseDetectionTitle'),
      description: label('aiDiseaseDetectionDesc'),
      icon: Camera,
      color: 'bg-AgriNiti-accent-gold/15 border-AgriNiti-accent-gold/40',
      features: [
        label('aiDiseaseDetectionF1'),
        label('aiDiseaseDetectionF2'),
        label('aiDiseaseDetectionF3')
      ]
    },
    {
      id: 2,
      title: label('soilAnalysisTitle'),
      description: label('soilAnalysisDesc'),
      icon: Droplets,
      color: 'bg-AgriNiti-accent-blue/10 border-AgriNiti-accent-blue/40',
      features: [
        label('soilAnalysisF1'),
        label('soilAnalysisF2'),
        label('soilAnalysisF3')
      ]
    },
    {
      id: 3,
      title: label('predictiveModelsTitle'),
      description: label('predictiveModelsDesc'),
      icon: TrendingUp,
      color: 'bg-AgriNiti-primary/5 border-AgriNiti-primary/40',
      features: [
        label('predictiveModelsF1'),
        label('predictiveModelsF2'),
        label('predictiveModelsF3')
      ]
    },
    {
      id: 4,
      title: label('personalizedRecsTitle'),
      description: label('personalizedRecsDesc'),
      icon: Lightbulb,
      color: 'bg-green-50 border-green-200 text-green-700',
      features: [
        label('personalizedRecsF1'),
        label('personalizedRecsF2'),
        label('personalizedRecsF3')
      ]
    }
  ];

  const handleAsk = async () => {
    if (!query.trim() || isAsking) return;

    // Add user message
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const handleUploadClick = () => {
    navigate('/ai-disease-detection');
  };

  const handlePredictiveModelsClick = () => {
    navigate('/rain-forecast');
  };

  const handleRecommendationClick = () => {
    chatPanelRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-AgriNiti-text leading-tight uppercase tracking-tight">{label('cropAnalysisTitle')}</h2>
          <p className="mt-2 text-base text-AgriNiti-text-muted max-w-2xl leading-relaxed">
            {label('cropAnalysisSubtitle')}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {aiFeatures.map((feature) => {
          const Icon = feature.icon;
          const isDiseaseDetection = feature.id === 1;
          const isPredictiveModels = feature.id === 3;
          const isPersonalizedRecs = feature.id === 4;

          const getClickHandler = () => {
            if (isDiseaseDetection) return handleUploadClick;
            if (isPredictiveModels) return handlePredictiveModelsClick;
            if (isPersonalizedRecs) return handleRecommendationClick;
            if (feature.id === 2) return () => navigate('/soil-analysis');
            return undefined;
          };

          const isClickable = isDiseaseDetection || isPredictiveModels || isPersonalizedRecs || feature.id === 2;

          return (
            <Card
              key={feature.id}
              className={`p-6 border-dashed ${feature.color} hover:shadow-soft-card hover:-translate-y-0.5 transition-all ${isClickable ? 'cursor-pointer' : ''}`}
              onClick={getClickHandler()}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-soft-card">
                    <Icon className="h-6 w-6 text-AgriNiti-text" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-AgriNiti-text mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-base text-AgriNiti-text-muted mb-4">
                    {feature.description}
                  </p>
                  <ul className="space-y-2">
                    {feature.features.map((item, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-AgriNiti-text">
                        <div className="h-1.5 w-1.5 rounded-full bg-AgriNiti-primary"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-12" ref={chatPanelRef}>
        <Card className="p-8 bg-AgriNiti-primary/5 border-AgriNiti-primary/20">
          <div className="text-center mb-8">
            <Sparkles className="h-16 w-16 text-AgriNiti-primary mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-AgriNiti-text mb-4">
              {label('cropIntelligenceTitle')}
            </h3>
            <p className="text-lg text-AgriNiti-text-muted mb-6 max-w-2xl mx-auto">
              {label('cropIntelligenceDesc')}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-AgriNiti-border/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-AgriNiti-text">{label('askAnalysisTitle')}</h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleVoiceQuery}
                    className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${isRecording ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-AgriNiti-accent-blue/10 text-AgriNiti-accent-blue hover:bg-AgriNiti-accent-blue/20'}`}
                  >
                    {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    <span>{isRecording ? 'Stop Recording' : label('voice')}</span>
                  </button>
                  <button onClick={handleUploadClick} className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-AgriNiti-accent-gold/10 text-AgriNiti-accent-gold rounded-lg hover:bg-AgriNiti-accent-gold/20 transition-colors">
                    <ImageIcon className="h-4 w-4" />
                    <span>{label('upload')}</span>
                  </button>
                </div>
              </div>

              <div className="h-96 overflow-auto mb-4 space-y-3 p-4 bg-AgriNiti-bg/30 rounded-xl">
                {messages.length === 0 && (
                  <div className="text-center text-AgriNiti-text-muted py-8">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{label('emptyChatMessage')}</p>
                  </div>
                )}
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.type === 'user'
                        ? 'bg-AgriNiti-primary text-white'
                        : 'bg-white border border-AgriNiti-border/50 text-AgriNiti-text'
                        }`}
                    >
                      <p>{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full min-h-[80px] max-h-48 resize-none pr-12 px-4 py-3 border border-AgriNiti-border/50 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-AgriNiti-primary/50"
                  placeholder={label('cropAnalysisPlaceholder')}
                />
                <button
                  type="button"
                  onClick={handleAsk}
                  disabled={!query.trim()}
                  className="absolute bottom-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-AgriNiti-primary text-white shadow-soft-card hover:bg-AgriNiti-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SendHorizontal className={`h-5 w-5 ${isAsking ? 'animate-pulse' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

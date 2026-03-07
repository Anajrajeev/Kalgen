import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle2, Mic, PauseCircle, PlayCircle, IndianRupee, Send, Volume2, MessageCircle } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useTranslation } from '../services/useTranslation';
import { apiClient } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';

interface Message {
  sender_id: string;
  original_content: string;
  translated_content: string;
  created_at: string;
  target_language: string;
}

const steps = ['Offer sent', 'In discussion', 'Confirmed'] as const;

export function NegotiationPage() {
  const { label, t } = useTranslation();
  const location = useLocation();
  const { user } = useAuthStore();
  const { sellerName, sellerId } = location.state || { sellerName: 'Anita Patil', sellerId: 'd1e22222-2222-2222-2222-222222222222' };
  const { selectedLanguage } = useLanguageStore();
  const [currentOffer, setCurrentOffer] = useState(7150);
  const [stepIndex, setStepIndex] = useState(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Setup actual receiver ID from state
  const receiverId = sellerId;

  useEffect(() => {
    const fetchHistory = async () => {
      const response = await apiClient.getChatHistory(receiverId);
      if (response.data) {
        setMessages(response.data);
      }
    };
    fetchHistory();
    // Poll for new messages every 3 seconds for demo
    const interval = setInterval(fetchHistory, 3000);
    return () => clearInterval(interval);
  }, [receiverId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getReceiverLanguage = async (receiverId: string): Promise<string> => {
    try {
      // Get receiver's user profile to know their preferred language
      const response = await apiClient.getUserById(receiverId);
      if (response.data && response.data.preferred_language) {
        return response.data.preferred_language;
      }
      // Fallback: if we can't get receiver's language, use a sensible default
      // For Indian users, default to Hindi if current user is using regional language
      return selectedLanguage !== 'en' ? 'hi' : 'en';
    } catch (err) {
      console.error("Error getting receiver language:", err);
      return selectedLanguage !== 'en' ? 'hi' : 'en'; // Default fallback
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const textToSend = inputText;
    setInputText('');

    try {
      // Get receiver's language preference
      const receiverLanguage = await getReceiverLanguage(receiverId);

      const response = await apiClient.sendMessage({
        receiver_id: receiverId,
        content: textToSend,
        target_language: receiverLanguage
      });

      if (response.data) {
        setMessages(prev => [...prev, response.data]);
      }
    } catch (err) {
      console.error("Chat error:", err);
    }
  };

  const handleSpeech = async (text: string, msgId: string) => {
    setIsPlaying(msgId);
    try {
      const response = await apiClient.textToSpeech(text, selectedLanguage === 'en' ? 'en-US' : 'hi-IN');
      if (response.data?.audio_base64) {
        const audio = new Audio(`data:audio/mp3;base64,${response.data.audio_base64}`);
        audio.onended = () => setIsPlaying(null);
        audio.play();
      } else {
        setIsPlaying(null);
      }
    } catch (err) {
      console.error("TTS error:", err);
      setIsPlaying(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-AgriNiti-text font-serif leading-tight uppercase tracking-tight">{label('negotiationTitle')}</h2>
          <p className="mt-2 text-base text-AgriNiti-text-muted max-w-2xl leading-relaxed">
            {label('negotiationSubtitle')}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)] gap-4 items-start">
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-medium text-AgriNiti-text-muted uppercase tracking-[0.18em]">
                {label('chatInterface')}
              </p>
              <h3 className="text-sm font-semibold text-AgriNiti-text">{sellerName}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="success" className="text-[9px] font-black uppercase">Fair Price</Badge>
              <Badge tone="info">{label('realTimeTranslation')}</Badge>
            </div>
          </div>
          <div className="rounded-2xl border border-AgriNiti-border/80 bg-AgriNiti-bg/60 p-3 h-64 overflow-auto space-y-2">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-40">
                <MessageCircle className="h-8 w-8 mb-2" />
                <p className="text-[10px]">{label('noMessagesYet')}</p>
              </div>
            ) : messages.map((msg, idx) => {
              const isMe = msg.sender_id === user?.id;

              // Determine what content to display based on user's language preference
              let displayContent;
              let shouldShowTranslation = false;

              if (isMe) {
                // Always show my own messages in original language
                displayContent = msg.original_content;
              } else {
                // For received messages: show in user's preferred language
                // Check if there's a translation that matches the user's preferred language
                if (msg.translated_content && msg.translated_content !== msg.original_content) {
                  // If translation exists and matches user's language preference, show it
                  displayContent = msg.translated_content;
                  shouldShowTranslation = true;
                } else {
                  // Otherwise show original content
                  displayContent = msg.original_content;
                  shouldShowTranslation = false;
                }
              }

              return (
                <div
                  key={idx}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-3 py-2 text-xs leading-relaxed group relative ${isMe
                      ? 'bg-AgriNiti-primary text-white rounded-br-sm'
                      : 'bg-white text-AgriNiti-text border border-AgriNiti-border rounded-bl-sm'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p>{displayContent}</p>
                      <button
                        onClick={() => handleSpeech(displayContent, idx.toString())}
                        className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/5 ${isPlaying === idx.toString() ? 'text-AgriNiti-accent-blue opacity-100 animate-pulse' : ''}`}
                      >
                        <Volume2 className="h-3 w-3" />
                      </button>
                    </div>
                    {shouldShowTranslation && (
                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] opacity-80">
                        <span className="h-1.5 w-1.5 rounded-full bg-AgriNiti-accent-blue" />
                        {label('translatedAutomatically')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <Button
                type="button"
                variant={isRecording ? 'danger' : 'secondary'}
                className="inline-flex items-center gap-1"
                onClick={() => setIsRecording(!isRecording)}
              >
                <Mic className={`h-3.5 w-3.5 ${isRecording ? 'animate-pulse' : ''}`} />
                {isRecording ? label('stopRecording') : label('recordOffer')}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <input
                className="AgriNiti-input text-xs"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={label('chatPlaceholder')}
              />
              <Button type="button" variant="primary" onClick={handleSendMessage}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <p className="text-xs font-medium text-AgriNiti-text-muted uppercase tracking-[0.18em]">
              Counterparty Information
            </p>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-AgriNiti-primary/10 rounded-xl flex items-center justify-center font-bold text-AgriNiti-primary">
                {sellerName[0]}
              </div>
              <div>
                <h4 className="text-sm font-bold text-AgriNiti-text">{sellerName}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge tone="success" className="text-[10px]">98% Trust</Badge>
                  <span className="text-[10px] text-AgriNiti-text-muted">145 Trades</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-AgriNiti-border/30">
              <div className="text-center p-2 bg-AgriNiti-bg/40 rounded-lg">
                <p className="text-[9px] text-AgriNiti-text-muted uppercase tracking-wider">Avg Res.</p>
                <p className="text-xs font-bold text-AgriNiti-text">1.2 hrs</p>
              </div>
              <div className="text-center p-2 bg-AgriNiti-bg/40 rounded-lg">
                <p className="text-[9px] text-AgriNiti-text-muted uppercase tracking-wider">Verified</p>
                <p className="text-xs font-bold text-AgriNiti-success">Yes</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <p className="text-xs font-medium text-AgriNiti-text-muted uppercase tracking-[0.18em]">
              {label('offerCounterOffer')}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1.5">
                <IndianRupee className="h-3 w-3 text-AgriNiti-text-muted" />
                <span className="text-xl font-semibold text-AgriNiti-text">
                  {currentOffer.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-AgriNiti-text-muted">{label('perQtl')}</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCurrentOffer((v) => v - 25)}
                >
                  -25
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCurrentOffer((v) => v + 25)}
                >
                  +25
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-AgriNiti-text-muted uppercase tracking-[0.18em]">
                {label('dealConfirmation')}
              </p>
              <Badge tone={stepIndex === 2 ? 'success' : 'warning'}>
                {stepIndex === 2 ? label('readyToConfirm') : label('inDiscussion')}
              </Badge>
            </div>
            <Button
              type="button"
              className="w-full inline-flex items-center justify-center gap-2"
              onClick={() => setStepIndex(2)}
            >
              <CheckCircle2 className="h-4 w-4" />
              {label('confirmDealBtn')}
            </Button>
          </Card>

          <Card className="p-4 space-y-3">
            <p className="text-xs font-medium text-AgriNiti-text-muted uppercase tracking-[0.18em]">
              {label('dealStatusTracker')}
            </p>
            <div className="flex items-center justify-between text-[11px] text-AgriNiti-text-muted">
              {steps.map((step, index) => (
                <div key={step} className="flex-1 flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center h-6 w-6 rounded-full text-[10px] ${index <= stepIndex ? 'bg-AgriNiti-success text-white' : 'bg-AgriNiti-border'
                      }`}
                  >
                    {index + 1}
                  </div>
                  <p className="mt-1 text-center">{step}</p>
                  {index < steps.length - 1 && (
                    <div className="w-full h-0.5 mt-1 bg-AgriNiti-border relative">
                      <div
                        className={`absolute inset-y-0 left-0 ${index < stepIndex ? 'bg-AgriNiti-success' : 'bg-AgriNiti-border'
                          }`}
                        style={{ width: '100%' }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


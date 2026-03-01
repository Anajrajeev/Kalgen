import { ImageIcon, Mic, SendHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useLanguageStore } from '../../store/languageStore';
import { labels } from '../../i18n/labels';

interface AskAIPanelProps {
  onChatStart?: () => void;
}

export function AskAIPanel({ onChatStart }: AskAIPanelProps) {
  const lang = useLanguageStore((s) => s.selectedLanguage);
  const copy = labels[lang];
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{type: 'user' | 'ai', content: string}>>([]);

  const handleAsk = () => {
    if (!query.trim()) return;
    onChatStart?.();
    
    // Add user message
    const userMessage = query.trim();
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    
    // Add AI response
    const aiResponse = 'Demo response: Based on your description, AgriNiti would summarize key risks, recommend actions, and highlight relevant schemes or market moves here.';
    setMessages(prev => [...prev, { type: 'ai', content: aiResponse }]);
    
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const handleVoiceQuery = () => {
    onChatStart?.();
    const aiResponse = 'Listening (demo): In a real deployment, AgriNiti would capture your voice, transcribe it, and respond in your selected language.';
    setMessages(prev => [...prev, { type: 'ai', content: aiResponse }]);
  };

  const handleImageUpload = () => {
    onChatStart?.();
    const aiResponse = 'Image upload (demo): AgriNiti would analyze crop images for stress, disease or growth patterns.';
    setMessages(prev => [...prev, { type: 'ai', content: aiResponse }]);
  };

  return (
    <Card className="p-6 h-full flex flex-col">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-AgriNiti-text">{copy.askAiTitle}</h2>
          <p className="mt-2 text-sm text-AgriNiti-text-muted">
            Central hub to ask questions, share photos and get instant intelligence.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 text-base"
            onClick={handleVoiceQuery}
          >
            <Mic className="h-5 w-5" />
            <span>Voice query</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="inline-flex items-center gap-2 px-4 py-2 text-base"
            onClick={handleImageUpload}
          >
            <ImageIcon className="h-5 w-5" />
            <span>Upload image</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-auto mb-4 space-y-3">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.type === 'user'
                    ? 'bg-AgriNiti-primary text-white'
                    : 'bg-AgriNiti-bg/80 border border-dashed border-AgriNiti-accent-blue/40 text-AgriNiti-text'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>
        
        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="AgriNiti-input min-h-[80px] max-h-48 resize-none pr-12 text-base"
            placeholder={copy.askAiPlaceholder}
          />
          <button
            type="button"
            onClick={handleAsk}
            className="absolute bottom-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-AgriNiti-primary text-white shadow-soft-card hover:bg-AgriNiti-primary-hover transition-colors"
          >
            <SendHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>
    </Card>
  );
}


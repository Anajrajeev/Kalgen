import { ImageIcon, Mic, SendHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTranslation } from '../../services/useTranslation';

interface AskAIPanelProps {
  onChatStart?: () => void;
}

export function AskAIPanel({ onChatStart }: AskAIPanelProps) {
  const { label, t } = useTranslation();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'ai', content: string }>>([]);

  const handleAsk = async () => {
    if (!query.trim()) return;
    onChatStart?.();

    // Add user message
    const userMessage = query.trim();
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);

    // Add AI response
    const aiResponse = 'Demo response: Based on your description, AgriNiti would summarize key risks, recommend actions, and highlight relevant schemes or market moves here.';
    const translatedResponse = await t(aiResponse);
    setMessages(prev => [...prev, { type: 'ai', content: translatedResponse }]);

    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const handleVoiceQuery = async () => {
    onChatStart?.();
    const aiResponse = 'Listening (demo): In a real deployment, AgriNiti would capture your voice, transcribe it, and respond in your selected language.';
    const translatedResponse = await t(aiResponse);
    setMessages(prev => [...prev, { type: 'ai', content: translatedResponse }]);
  };

  const handleImageUpload = async () => {
    onChatStart?.();
    const aiResponse = 'Image upload (demo): AgriNiti would analyze crop images for stress, disease or growth patterns.';
    const translatedResponse = await t(aiResponse);
    setMessages(prev => [...prev, { type: 'ai', content: translatedResponse }]);
  };

  return (
    <Card className="p-6 h-full flex flex-col">
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
            className="inline-flex items-center gap-2 px-4 py-2 text-base"
            onClick={handleVoiceQuery}
          >
            <Mic className="h-5 w-5" />
            <span>{label('voiceQuery')}</span>
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

      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-auto mb-4 space-y-3">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.type === 'user'
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
            placeholder={label('askAiPlaceholder')}
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


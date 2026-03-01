import { AlertTriangle, Droplets, Bug, CloudRain, Camera, Sparkles, TrendingUp, Lightbulb, SendHorizontal, Mic, ImageIcon } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useState } from 'react';

interface Feature {
  id: number;
  title: string;
  description: string;
  icon: any;
  color: string;
  features: string[];
}

const aiFeatures: Feature[] = [
  {
    id: 1,
    title: 'AI Disease Detection',
    description: 'Automated identification of crop diseases through image recognition.',
    icon: Camera,
    color: 'bg-AgriNiti-accent-gold/15 border-AgriNiti-accent-gold/40',
    features: [
      'Real-time disease identification',
      '95% accuracy on common crop diseases',
      'Treatment recommendations included'
    ]
  },
  {
    id: 2,
    title: 'Soil Condition Analysis',
    description: 'Assessment of soil health using uploaded images.',
    icon: Droplets,
    color: 'bg-AgriNiti-accent-blue/10 border-AgriNiti-accent-blue/40',
    features: [
      'Soil nutrient analysis',
      'Moisture content detection',
      'pH level estimation'
    ]
  },
  {
    id: 3,
    title: 'Predictive Models',
    description: 'Real-time alerts for weather, floods, and droughts, alongside yield forecasts.',
    icon: TrendingUp,
    color: 'bg-AgriNiti-primary/5 border-AgriNiti-primary/40',
    features: [
      '7-day weather predictions',
      'Flood and drought warnings',
      'Yield forecasting models'
    ]
  },
  {
    id: 4,
    title: 'Personalized Recommendations',
    description: 'Tailored farming guidance based on the specific analysis.',
    icon: Lightbulb,
    color: 'bg-green-50 border-green-200 text-green-700',
    features: [
      'Crop-specific advice',
      'Seasonal planning guidance',
      'Resource optimization tips'
    ]
  }
];

export function CropAnalysisPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{type: 'user' | 'ai', content: string}>>([]);

  const handleAsk = () => {
    if (!query.trim()) return;
    
    // Add user message
    const userMessage = query.trim();
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    
    // Add AI response based on context
    let aiResponse = '';
    if (userMessage.toLowerCase().includes('disease') || userMessage.toLowerCase().includes('pest')) {
      aiResponse = 'Based on your crop analysis, I recommend monitoring for early signs of fungal diseases, especially during humid conditions. The AI detection system can identify common diseases like leaf rust and blight with 95% accuracy. Consider preventive treatment if weather conditions favor disease spread.';
    } else if (userMessage.toLowerCase().includes('soil') || userMessage.toLowerCase().includes('nutrient')) {
      aiResponse = 'Your soil analysis shows moderate nitrogen levels but low phosphorus content. I recommend applying a balanced NPK fertilizer with higher phosphorus ratio. The soil pH is optimal at 6.5, which is ideal for most crops. Consider adding organic matter to improve water retention.';
    } else if (userMessage.toLowerCase().includes('weather') || userMessage.toLowerCase().includes('rain')) {
      aiResponse = 'The predictive models indicate moderate rainfall over the next 5 days, which should be beneficial for crop growth. However, there\'s a 30% chance of heavy rainfall on day 3, so ensure proper drainage. Temperature conditions are optimal for current crop stage.';
    } else if (userMessage.toLowerCase().includes('yield') || userMessage.toLowerCase().includes('harvest')) {
      aiResponse = 'Based on current crop health indicators and weather patterns, the yield forecast is 15% above average for your region. Key factors contributing to this include adequate soil moisture and low disease pressure. Continue current management practices for optimal results.';
    } else {
      aiResponse = 'I can help you with specific questions about your crop analysis results, disease detection, soil conditions, weather predictions, or yield forecasts. The AI system provides personalized recommendations based on your specific field conditions and crop type.';
    }
    
    setMessages(prev => [...prev, { type: 'ai', content: aiResponse }]);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };
  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-AgriNiti-text mb-3">Crop Analysis</h1>
        <p className="text-lg text-AgriNiti-text-muted">
          Advanced AI-powered tools for comprehensive crop monitoring and analysis.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {aiFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.id} className={`p-6 border-dashed ${feature.color} hover:shadow-soft-card hover:-translate-y-0.5 transition-all`}>
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

      <div className="mt-12">
        <Card className="p-8 bg-AgriNiti-primary/5 border-AgriNiti-primary/20">
          <div className="text-center mb-8">
            <Sparkles className="h-16 w-16 text-AgriNiti-primary mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-AgriNiti-text mb-4">
              AI-Powered Crop Intelligence
            </h3>
            <p className="text-lg text-AgriNiti-text-muted mb-6 max-w-2xl mx-auto">
              Leverage cutting-edge AI technology to monitor, analyze, and optimize your crop health and yield potential.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-AgriNiti-border/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-AgriNiti-text">Ask About Your Analysis</h4>
                <div className="flex items-center gap-2">
                  <button className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-AgriNiti-accent-blue/10 text-AgriNiti-accent-blue rounded-lg hover:bg-AgriNiti-accent-blue/20 transition-colors">
                    <Mic className="h-4 w-4" />
                    <span>Voice</span>
                  </button>
                  <button className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-AgriNiti-accent-gold/10 text-AgriNiti-accent-gold rounded-lg hover:bg-AgriNiti-accent-gold/20 transition-colors">
                    <ImageIcon className="h-4 w-4" />
                    <span>Upload</span>
                  </button>
                </div>
              </div>

              <div className="h-96 overflow-auto mb-4 space-y-3 p-4 bg-AgriNiti-bg/30 rounded-xl">
                {messages.length === 0 && (
                  <div className="text-center text-AgriNiti-text-muted py-8">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Ask questions about your crop analysis results, disease detection, soil conditions, or any farming-related doubts.</p>
                  </div>
                )}
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        message.type === 'user'
                          ? 'bg-AgriNiti-primary text-white'
                          : 'bg-white border border-AgriNiti-border/50 text-AgriNiti-text'
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
                  className="w-full min-h-[80px] max-h-48 resize-none pr-12 px-4 py-3 border border-AgriNiti-border/50 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-AgriNiti-primary/50"
                  placeholder="Ask about your crop analysis results..."
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
          </div>
        </Card>
      </div>
    </div>
  );
}

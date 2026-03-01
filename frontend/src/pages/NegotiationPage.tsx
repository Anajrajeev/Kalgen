import { useState } from 'react';
import { CheckCircle2, Mic, PauseCircle, PlayCircle, IndianRupee } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const mockMessages = [
  {
    from: 'you' as const,
    text: 'I have 50 qtl of tur, clean and dried. What price can you offer at your mandi?',
    translated: false
  },
  {
    from: 'buyer' as const,
    text: 'For current arrivals we are paying around ₹7,050 / qtl. Transport extra.',
    translated: true
  },
  {
    from: 'you' as const,
    text: 'If you can pick up from farm and pay within 3 days, I can consider ₹7,150 / qtl.',
    translated: false
  }
];

const steps = ['Offer sent', 'In discussion', 'Confirmed'] as const;

export function NegotiationPage() {
  const [currentOffer, setCurrentOffer] = useState(7150);
  const [stepIndex, setStepIndex] = useState(1);

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-AgriNiti-text">Conversation &amp; negotiation</h2>
          <p className="mt-1 text-xs text-AgriNiti-text-muted max-w-2xl">
            Track messages, adjust offers and confirm a deal with clear status at every step.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)] gap-4 items-start">
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-AgriNiti-text-muted uppercase tracking-[0.18em]">
              Chat interface
            </p>
            <Badge tone="info">Real-time translation (mock)</Badge>
          </div>
          <div className="rounded-2xl border border-AgriNiti-border/80 bg-AgriNiti-bg/60 p-3 h-64 overflow-auto space-y-2">
            {mockMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.from === 'you' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    msg.from === 'you'
                      ? 'bg-AgriNiti-primary text-white rounded-br-sm'
                      : 'bg-white text-AgriNiti-text border border-AgriNiti-border rounded-bl-sm'
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.translated && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] opacity-80">
                      <span className="h-1.5 w-1.5 rounded-full bg-AgriNiti-accent-blue" />
                      Translated automatically (demo)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <Button type="button" variant="secondary" className="inline-flex items-center gap-1">
                <Mic className="h-3.5 w-3.5" />
                Record offer
              </Button>
              <Button type="button" variant="ghost" className="inline-flex items-center gap-1">
                <PlayCircle className="h-3.5 w-3.5" />
                Play last message
              </Button>
              <Button type="button" variant="ghost" className="inline-flex items-center gap-1">
                <PauseCircle className="h-3.5 w-3.5" />
                Pause
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <input
                className="AgriNiti-input text-xs"
                placeholder="Type a message to the buyer..."
              />
              <Button type="button" variant="primary">
                Send
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <p className="text-xs font-medium text-AgriNiti-text-muted uppercase tracking-[0.18em]">
              Offer / Counter-offer
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1.5">
                <IndianRupee className="h-3 w-3 text-AgriNiti-text-muted" />
                <span className="text-xl font-semibold text-AgriNiti-text">
                  {currentOffer.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-AgriNiti-text-muted">per qtl</span>
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
                Deal confirmation
              </p>
              <Badge tone={stepIndex === 2 ? 'success' : 'warning'}>
                {stepIndex === 2 ? 'Ready to confirm' : 'In discussion'}
              </Badge>
            </div>
            <Button
              type="button"
              className="w-full inline-flex items-center justify-center gap-2"
              onClick={() => setStepIndex(2)}
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirm deal
            </Button>
          </Card>

          <Card className="p-4 space-y-3">
            <p className="text-xs font-medium text-AgriNiti-text-muted uppercase tracking-[0.18em]">
              Deal status tracker
            </p>
            <div className="flex items-center justify-between text-[11px] text-AgriNiti-text-muted">
              {steps.map((step, index) => (
                <div key={step} className="flex-1 flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center h-6 w-6 rounded-full text-[10px] ${
                      index <= stepIndex ? 'bg-AgriNiti-success text-white' : 'bg-AgriNiti-border'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <p className="mt-1 text-center">{step}</p>
                  {index < steps.length - 1 && (
                    <div className="w-full h-0.5 mt-1 bg-AgriNiti-border relative">
                      <div
                        className={`absolute inset-y-0 left-0 ${
                          index < stepIndex ? 'bg-AgriNiti-success' : 'bg-AgriNiti-border'
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


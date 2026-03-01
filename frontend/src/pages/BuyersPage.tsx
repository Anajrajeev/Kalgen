import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ShieldQuestion } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const buyers = [
  {
    name: 'Sri Venkateshwara Traders',
    rank: 1,
    trust: 96,
    gstVerified: true,
    reliability: 'Highly reliable',
    history: '34 trades · 96% on-time · Pulses focus'
  },
  {
    name: 'GreenLine Agro Exports',
    rank: 2,
    trust: 90,
    gstVerified: true,
    reliability: 'Export-grade quality checks',
    history: '18 trades · 92% on-time · Multi-crop'
  },
  {
    name: 'Local Market Agent (New)',
    rank: 3,
    trust: 72,
    gstVerified: false,
    reliability: 'New profile · negotiate carefully',
    history: '4 trades · 75% on-time · Nearby'
  }
];

export function BuyersPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-AgriNiti-text">Buyer matching &amp; trust</h2>
          <p className="mt-1 text-xs text-AgriNiti-text-muted max-w-2xl">
            Compare buyers ranked by trust score, verification and trade history before starting a
            negotiation.
          </p>
        </div>
      </header>

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-AgriNiti-text-muted uppercase tracking-[0.18em]">
            Ranked buyers
          </p>
          <Badge tone="info">Demo ranking</Badge>
        </div>
        <div className="space-y-2">
          {buyers.map((buyer) => (
            <div
              key={buyer.name}
              className="rounded-2xl border border-AgriNiti-border px-3 py-2.5 flex items-center justify-between gap-3 hover:border-AgriNiti-primary/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-xs font-semibold text-AgriNiti-neutral w-6 text-right">
                  #{buyer.rank}
                </div>
                <div>
                  <p className="text-sm font-medium text-AgriNiti-text">{buyer.name}</p>
                  <p className="mt-1 text-[11px] text-AgriNiti-text-muted">{buyer.history}</p>
                  <p className="mt-1 text-[11px] text-AgriNiti-text">{buyer.reliability}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 rounded-full bg-AgriNiti-border overflow-hidden">
                    <div
                      className={`h-full ${
                        buyer.trust > 90
                          ? 'bg-AgriNiti-success'
                          : buyer.trust >= 80
                            ? 'bg-AgriNiti-warning'
                            : 'bg-AgriNiti-error'
                      }`}
                      style={{ width: `${buyer.trust}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-AgriNiti-text-muted">{buyer.trust}% trust</span>
                </div>
                <div className="flex items-center gap-1">
                  {buyer.gstVerified ? (
                    <Badge tone="success" className="inline-flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      <span>GST verified</span>
                    </Badge>
                  ) : (
                    <Badge tone="warning" className="inline-flex items-center gap-1">
                      <ShieldQuestion className="h-3 w-3" />
                      <span>GST check advised</span>
                    </Badge>
                  )}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-1"
                  onClick={() => navigate('/negotiation')}
                >
                  Contact / Make offer
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}


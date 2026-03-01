import { AlertTriangle, IndianRupee, ScrollText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';

const actions = [
  {
    id: 'crop-analysis',
    title: 'Crop Analysis',
    summary: 'Pest, disease and rainfall advisories for your fields.',
    icon: AlertTriangle,
    color: 'bg-AgriNiti-accent-gold/15 border-AgriNiti-accent-gold/40',
    route: '/crop-analysis'
  },
  {
    id: 'market-prices',
    title: 'Market price highlights',
    summary: 'Daily mandi & wholesale prices for your produce.',
    icon: IndianRupee,
    color: 'bg-AgriNiti-accent-blue/10 border-AgriNiti-accent-blue/40',
    route: '/marketplace'
  },
  {
    id: 'scheme-notes',
    title: 'Government scheme notifications',
    summary: 'Subsidies, insurance and support programs you may be eligible for.',
    icon: ScrollText,
    color: 'bg-AgriNiti-primary/5 border-AgriNiti-primary/40',
    route: '/schemes'
  }
];

export function DashboardActionBar() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-3 gap-6 mb-8">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            type="button"
            onClick={() => navigate(action.route)}
            className="text-left"
          >
            <Card
              className={`h-full border-dashed ${action.color} hover:shadow-soft-card hover:-translate-y-0.5 transition-all`}
            >
              <div className="p-5 flex items-start gap-4">
                <div className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-soft-card text-AgriNiti-text">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base font-medium text-AgriNiti-text">{action.title}</p>
                  <p className="mt-2 text-sm text-AgriNiti-text-muted leading-snug">
                    {action.summary}
                  </p>
                </div>
              </div>
            </Card>
          </button>
        );
      })}
    </div>
  );
}


import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { useTranslation } from '../services/useTranslation';
import { useLanguageStore, AgriNitiLanguage } from '../store/languageStore';
import { useAuthStore } from '../store/authStore';

const recentActivities = [
  'Posted tur listing to marketplace',
  'Viewed buyer trust profiles',
  'Simulated negotiation and confirmed demo deal',
  'Browsed government scheme eligibility',
  'Checked today’s weather snapshot'
];

const advisoryHistory = [
  'Yellowing leaves in cotton – nutrient deficiency guidance',
  'Sowing window suggestion for rabi maize',
  'Market timing hint for selling stored chana'
];

const trades = [
  { item: 'Cotton lint', status: 'Completed', value: '₹3.8 lakh' },
  { item: 'Maize', status: 'Completed', value: '₹1.2 lakh' },
  { item: 'Tur (demo)', status: 'In negotiation', value: 'TBD' }
];

const languageLabels: Record<AgriNitiLanguage, string> = {
  en: 'English',
  hi: 'हिंदी',
  mr: 'मराठी',
  kn: 'ಕನ್ನಡ',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  ml: 'മലയാളം'
};

export function ProfilePage() {
  const { selectedLanguage, setLanguage } = useLanguageStore();
  const { updateUser } = useAuthStore();
  const { label } = useTranslation();

  const handleLanguageChange = async (code: AgriNitiLanguage) => {
    setLanguage(code);
    try {
      await updateUser({ preferred_language: code });
    } catch (err) {
      console.error('Failed to update language on server:', err);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold text-AgriNiti-text">{label('profileTitle')}</h2>
          <p className="mt-2 text-base text-AgriNiti-text-muted max-w-3xl">
            {label('profileSubtitle')}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)] gap-6 items-start">
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-AgriNiti-primary text-white text-base font-semibold">
              KS
            </div>
            <div>
              <p className="text-base font-semibold text-AgriNiti-text">AgriNiti Sample Farmer</p>
              <p className="text-sm text-AgriNiti-text-muted">
                Nizamabad · 8 acres · Tur, cotton, maize
              </p>
            </div>
          </div>

          <div className="border-t border-AgriNiti-border/80 pt-6 space-y-5">
            <div>
              <p className="text-sm font-medium text-AgriNiti-text-muted mb-3">
                {label('languageSettings')}
              </p>
              <div className="flex flex-wrap gap-3">
                {(Object.keys(languageLabels) as AgriNitiLanguage[]).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleLanguageChange(code)}
                    className={`text-sm px-4 py-2 rounded-full border transition-colors ${selectedLanguage === code
                      ? 'border-AgriNiti-primary bg-AgriNiti-primary/5 text-AgriNiti-text'
                      : 'border-AgriNiti-border bg-white text-AgriNiti-text-muted hover:border-AgriNiti-primary/40'
                      }`}
                  >
                    {languageLabels[code]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-medium text-AgriNiti-text-muted mb-1">{label('profileTrustScore')}</p>
              <div className="flex items-center gap-3">
                <div className="h-2 w-32 rounded-full bg-AgriNiti-border overflow-hidden">
                  <div className="h-full w-11/12 bg-AgriNiti-success" />
                </div>
                <p className="text-xs text-AgriNiti-text">
                  <span className="font-semibold">92 / 100</span> · strong and growing
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4 space-y-2">
            <p className="text-xs font-medium text-AgriNiti-text-muted uppercase tracking-[0.18em]">
              {label('profileAdvisoryHistory')}
            </p>
            <ul className="mt-1 space-y-1.5 text-xs text-AgriNiti-text">
              {advisoryHistory.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-AgriNiti-accent-blue" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-4 space-y-2">
            <p className="text-xs font-medium text-AgriNiti-text-muted uppercase tracking-[0.18em]">
              {label('profileTradeHistory')}
            </p>
            <div className="mt-1 space-y-1.5 text-xs text-AgriNiti-text">
              {trades.map((trade) => (
                <div
                  key={trade.item}
                  className="flex items-center justify-between gap-2 rounded-xl border border-AgriNiti-border px-3 py-1.5"
                >
                  <div>
                    <p className="font-medium">{trade.item}</p>
                    <p className="text-[11px] text-AgriNiti-text-muted">{trade.value}</p>
                  </div>
                  <Badge tone={trade.status === 'Completed' ? 'success' : 'warning'}>
                    {trade.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <p className="text-xs font-medium text-AgriNiti-text-muted uppercase tracking-[0.18em]">
              {label('profileRecentActivity')}
            </p>
            <ul className="mt-1 space-y-1.5 text-xs text-AgriNiti-text">
              {recentActivities.map((item, index) => (
                <li key={item} className="flex items-start gap-2">
                  <div className="flex flex-col items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-AgriNiti-accent-gold" />
                    {index < recentActivities.length - 1 && (
                      <span className="mt-0.5 h-4 w-px bg-AgriNiti-border/80" />
                    )}
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}


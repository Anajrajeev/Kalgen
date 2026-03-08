import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { useState, useEffect } from 'react';
import { useTranslation } from '../services/useTranslation';
import { AskAIPanel } from '../components/dashboard/AskAIPanel';

const schemes = [
  {
    name: 'PM Kisan Samman Nidhi',
    explanation: 'Direct income support for small and marginal farmers across India.',
    deadline: 'Rolling · Renewal every season',
    eligible: true
  },
  {
    name: 'Crop Insurance Support',
    explanation: 'Financial protection for yield loss due to weather or pest incidents.',
    deadline: 'Enroll before sowing window closes',
    eligible: false
  },
  {
    name: 'Irrigation Modernization Grant',
    explanation: 'Subsidy for drip and sprinkler systems to optimize water use.',
    deadline: 'Applications close in 45 days',
    eligible: true
  }
];

export function SchemesPage() {
  const { label, t } = useTranslation();
  const [translatedSchemes, setTranslatedSchemes] = useState(schemes);

  useEffect(() => {
    const translateContent = async () => {
      const translated = await Promise.all(
        schemes.map(async (s) => ({
          ...s,
          name: await t(s.name),
          explanation: await t(s.explanation),
          deadline: await t(s.deadline),
        }))
      );
      setTranslatedSchemes(translated);
    };
    translateContent();
  }, [t]);

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold text-AgriNiti-text">{label('schemesPageTitle')}</h2>
          <p className="mt-2 text-base text-AgriNiti-text-muted max-w-3xl">
            {label('schemesPageSubtitle')}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)] gap-6">
        {/* Left Aspect: Schemes */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-AgriNiti-text-muted uppercase tracking-[0.18em]">
              {label('schemesTitle')}
            </p>
            <Badge tone="info">{translatedSchemes.length} {label('programsFound')}</Badge>
          </div>
          <div className="space-y-5">
            {translatedSchemes.map((scheme) => (
              <div
                key={scheme.name}
                className="rounded-2xl border border-AgriNiti-border px-5 py-4 hover:border-AgriNiti-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-medium text-AgriNiti-text">{scheme.name}</p>
                    <p className="mt-2 text-sm text-AgriNiti-text-muted leading-snug">
                      {scheme.explanation}
                    </p>
                    <p className="mt-3 text-sm text-AgriNiti-neutral">
                      {label('appWindow')} · {scheme.deadline}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right Aspect: Chatbot Panel */}
        <div className="h-full">
          <AskAIPanel />
        </div>
      </div>

      {/* Bottom Horizontal Row: Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <p className="text-sm font-medium text-AgriNiti-text-muted uppercase tracking-[0.18em]">
            {label('applyAssistanceTitle')}
          </p>
          <ol className="mt-5 space-y-4 text-sm text-AgriNiti-text">
            <li>
              <span className="font-semibold">{label('applyTitle1')}</span> – {label('applyStep1')}
            </li>
            <li>
              <span className="font-semibold">{label('applyTitle2')}</span> – {label('applyStep2')}
            </li>
            <li>
              <span className="font-semibold">{label('applyTitle3')}</span> – {label('applyStep3')}
            </li>
            <li>
              <span className="font-semibold">{label('applyTitle4')}</span> – {label('applyStep4')}
            </li>
          </ol>
        </Card>

        <Card className="p-6">
          <p className="text-sm font-medium text-AgriNiti-text-muted uppercase tracking-[0.18em]">
            {label('formGuidanceTitle')}
          </p>
          <p className="mt-3 text-sm text-AgriNiti-text-muted">
            {label('formGuidanceDesc')}
          </p>
          <ul className="mt-4 space-y-3 text-sm text-AgriNiti-text">
            <li>• {label('formPoint1')}</li>
            <li>• {label('formPoint2')}</li>
            <li>• {label('formPoint3')}</li>
            <li>• {label('formPoint4')}</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

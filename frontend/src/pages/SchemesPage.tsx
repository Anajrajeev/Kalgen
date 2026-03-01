import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

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
  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold text-AgriNiti-text">Government schemes</h2>
          <p className="mt-2 text-base text-AgriNiti-text-muted max-w-3xl">
            View schemes you are likely eligible for, understand them in simple language, and get
            guided support to complete applications on time.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)] gap-6">
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-AgriNiti-text-muted uppercase tracking-[0.18em]">
              Eligible schemes
            </p>
            <Badge tone="info">{schemes.length} programs found</Badge>
          </div>
          <div className="space-y-5">
            {schemes.map((scheme) => (
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
                      Application window · {scheme.deadline}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge tone={scheme.eligible ? 'success' : 'warning'}>
                      {scheme.eligible ? 'Likely eligible' : 'Check eligibility'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <p className="text-sm font-medium text-AgriNiti-text-muted uppercase tracking-[0.18em]">
              Apply assistance
            </p>
            <ol className="mt-5 space-y-4 text-sm text-AgriNiti-text">
              <li>
                <span className="font-semibold">1. Confirm basic details</span> – land records,
                bank account and Aadhaar mapping.
              </li>
              <li>
                <span className="font-semibold">2. Collect supporting documents</span> – pattadar
                passbook, ID proofs, and recent photographs.
              </li>
              <li>
                <span className="font-semibold">3. Visit nearest facilitation center</span> – CSC,
                PACS or agri office for assisted application.
              </li>
              <li>
                <span className="font-semibold">4. Track status regularly</span> – note application
                ID and check for messages or calls.
              </li>
            </ol>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-medium text-AgriNiti-text-muted uppercase tracking-[0.18em]">
              Form guidance
            </p>
            <p className="mt-3 text-sm text-AgriNiti-text-muted">
              This section walks you through typical questions asked in government forms so you can
              prepare responses calmly before visiting any office or kiosk.
            </p>
            <ul className="mt-4 space-y-3 text-sm text-AgriNiti-text">
              <li>• Personal and family details</li>
              <li>• Landholding and tenancy information</li>
              <li>• Crop patterns and seasons</li>
              <li>• Existing loans, insurance and support received</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}


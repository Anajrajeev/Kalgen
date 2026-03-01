import { useState } from 'react';
import { WeatherWidget } from '../components/dashboard/WeatherWidget';
import { DashboardActionBar } from '../components/dashboard/DashboardActionBar';
import { AskAIPanel } from '../components/dashboard/AskAIPanel';
import { useLanguageStore } from '../store/languageStore';
import { labels } from '../i18n/labels';

export function DashboardPage() {
  const lang = useLanguageStore((s) => s.selectedLanguage);
  const copy = labels[lang];
  const [isChatMode, setIsChatMode] = useState(false);

  return (
    <div className="space-y-8">
      {!isChatMode && (
        <>
          <header className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold text-AgriNiti-text">{copy.dashboardTitle}</h2>
              <p className="mt-2 text-base text-AgriNiti-text-muted max-w-2xl">{copy.dashboardSubtitle}</p>
            </div>
          </header>

          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6 items-stretch">
            <WeatherWidget />
            <div className="text-sm text-AgriNiti-text-muted flex items-center justify-end">
              <div className="text-right">
                <p className="font-medium text-AgriNiti-text">Today&apos;s farm snapshot</p>
                <p className="mt-2">
                  Weather · Prices · Schemes · AI — all starting from this dashboard.
                </p>
              </div>
            </div>
          </div>

          <DashboardActionBar />
        </>
      )}

      <div className="grid grid-cols-[minmax(0,3fr)]">
        <AskAIPanel onChatStart={() => setIsChatMode(true)} />
      </div>
    </div>
  );
}


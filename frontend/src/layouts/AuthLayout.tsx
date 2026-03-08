import { ReactNode } from 'react';
import { useLanguageStore } from '../store/languageStore';
import { labels } from '../i18n/labels';
import logoImg from '/logo.png';

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  const lang = useLanguageStore((s) => s.selectedLanguage);
  const copy = labels[lang];

  return (
    <div className="min-h-screen bg-AgriNiti-bg flex items-center justify-center px-12 py-16">
      <div className="w-full max-w-7xl flex flex-col gap-16">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={logoImg}
              alt="AgriNiti Logo"
              className="h-12 w-12 rounded-lg"
            />
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-AgriNiti-text">AgriNiti</h1>
              <p className="mt-2 text-lg text-AgriNiti-text-muted">
                {copy.appTagline}
              </p>
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-stretch gap-12">{children}</main>
      </div>
    </div>
  );
}

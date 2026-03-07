import { useState } from 'react';
import { Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useLanguageStore, AgriNitiLanguage } from '../store/languageStore';
import { useAuthStore } from '../store/authStore';
import { labels } from '../i18n/labels';

type LanguageCardConfig = {
  code: AgriNitiLanguage;
  title: string;
  native: string;
};

const LANGUAGES: LanguageCardConfig[] = [
  { code: 'en', title: 'English', native: 'English' },
  { code: 'hi', title: 'Hindi', native: 'हिंदी' },
  { code: 'mr', title: 'Marathi', native: 'मराठी' },
  { code: 'kn', title: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ta', title: 'Tamil', native: 'தமிழ்' },
  { code: 'te', title: 'Telugu', native: 'తెలుగు' },
  { code: 'ml', title: 'Malayalam', native: 'മലയാളം' }
];

export function LoginPage() {
  const navigate = useNavigate();
  const { selectedLanguage, setLanguage } = useLanguageStore();
  const { login, register, isLoading, error, clearError } = useAuthStore();
  const [hasSelected, setHasSelected] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: ''
  });
  const [isRegistering, setIsRegistering] = useState(false);

  const copy = labels[selectedLanguage];

  const handleLanguageClick = (code: AgriNitiLanguage) => {
    setLanguage(code);
    setHasSelected(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Truncate password to 72 characters max (bcrypt limitation)
    if (name === 'password' && value.length > 72) {
      return; // Don't allow passwords longer than 72 characters
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    clearError();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) {
      // Handle registration
      await register({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        preferred_language: selectedLanguage
      });
      // Registration calls login automatically in authStore
    } else {
      // Handle login
      await login({
        username: formData.email,
        password: formData.password
      });

      // Once login finishes, we have a user in the store. 
      // If our chosen language differs from the profile, update it.
      const state = useAuthStore.getState();
      if (state.isAuthenticated && state.user && state.user.id) {
        if (state.user.preferred_language !== selectedLanguage) {
          await useAuthStore.getState().updateUser({ preferred_language: selectedLanguage });
        }
        navigate('/dashboard');
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    await register({
      email: formData.email,
      password: formData.password,
      full_name: formData.full_name,
      preferred_language: selectedLanguage
    });
    // authStore handles login inside register
    const state = useAuthStore.getState();
    if (state.isAuthenticated) {
      navigate('/dashboard');
    }
  };

  return (
    <AuthLayout>
      <section className="flex-1">
        <header className="mb-8">
          <h2 className="text-2xl font-semibold text-AgriNiti-text mb-3">{copy.loginTitle}</h2>
          <p className="text-base text-AgriNiti-text-muted">{copy.loginSubtitle}</p>
        </header>
        <div className="grid grid-cols-3 gap-6">
          {LANGUAGES.map((lang) => {
            const isActive = selectedLanguage === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageClick(lang.code)}
                className={`group flex flex-col items-start justify-between rounded-2xl border px-6 py-5 text-left shadow-sm transition-all ${isActive
                  ? 'border-AgriNiti-primary bg-white shadow-soft-card'
                  : 'border-AgriNiti-border bg-AgriNiti-surface hover:border-AgriNiti-primary/60 hover:bg-white'
                  }`}
              >
                <div>
                  <p className="text-base font-medium text-AgriNiti-text">{lang.title}</p>
                  <p className="mt-2 text-lg font-semibold text-AgriNiti-text">{lang.native}</p>
                </div>
                <div className="mt-4 inline-flex items-center gap-2 text-sm text-AgriNiti-text-muted">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-AgriNiti-primary text-white shadow-sm">
                    <Mic className="h-4 w-4" />
                  </span>
                  <span>Voice-ready</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="w-[400px]">
        <Card className="h-full p-8 flex flex-col justify-center">
          <h2 className="text-xl font-semibold text-AgriNiti-text mb-6">
            {hasSelected ? (isRegistering ? 'Create Account' : copy.login) : copy.loginTitle}
          </h2>
          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-base">
                {error}
              </div>
            )}
            {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-AgriNiti-text-muted mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="AgriNiti-input"
                  placeholder="Enter your full name"
                  disabled={isLoading}
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-AgriNiti-text-muted mb-2">
                {isRegistering ? 'Email Address' : copy.username}
              </label>
              <input
                type={isRegistering ? "email" : "text"}
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="AgriNiti-input"
                placeholder={isRegistering ? "Enter your email address" : copy.username}
                autoComplete="username"
                disabled={isLoading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-AgriNiti-text-muted mb-2">
                {copy.password} <span className="text-gray-400">({formData.password.length}/72)</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="AgriNiti-input"
                placeholder={copy.password}
                autoComplete="current-password"
                disabled={isLoading}
                maxLength={72}
              />
              {formData.password.length >= 65 && (
                <p className="text-sm text-yellow-600 mt-2">
                  Password approaching maximum length (72 characters)
                </p>
              )}
            </div>

            <div className="pt-4 space-y-3">
              <Button type="submit" className="w-full py-3 text-base" disabled={!hasSelected || isLoading}>
                {isLoading ? 'Processing...' : (isRegistering ? 'Creating Account...' : copy.login)}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full py-3 text-base"
                disabled={!hasSelected || isLoading}
                onClick={() => setIsRegistering(!isRegistering)}
              >
                {isRegistering ? 'Back to Login' : copy.createAccount}
              </Button>
            </div>
          </form>
          {!hasSelected && (
            <p className="mt-6 text-sm text-AgriNiti-text-muted">
              Select a language card first to continue.
            </p>
          )}
        </Card>
      </section>
    </AuthLayout>
  );
}


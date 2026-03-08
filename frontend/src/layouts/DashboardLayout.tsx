import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useState, useEffect } from 'react';
import logoImg from '../assets/logo.png';

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, fetchUsername } = useAuthStore();
  const [username, setUsername] = useState('Guest');

  useEffect(() => {
    const loadUsername = async () => {
      const userData = await fetchUsername();
      setUsername(userData.username);
    };
    loadUsername();
  }, [fetchUsername]);

  return (
    <div className="min-h-screen bg-AgriNiti-bg flex items-start justify-center px-12 py-16">
      <div className="w-full max-w-7xl">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={logoImg}
              alt="AgriNiti Logo"
              className="h-10 w-10 rounded-lg"
            />
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-AgriNiti-text">AgriNiti</h1>
              <p className="mt-2 text-sm uppercase tracking-[0.2em] text-AgriNiti-text-muted">
                Unified farm intelligence dashboard
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex items-center gap-3 rounded-full border border-AgriNiti-border bg-AgriNiti-surface px-4 py-2.5 text-base text-AgriNiti-text hover:bg-AgriNiti-bg transition-colors"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-AgriNiti-primary text-white">
                <User className="h-5 w-5" />
              </span>
              <div className="hidden md:inline text-left">
                <div className="text-sm font-medium">{username}</div>
                <div className="text-xs text-AgriNiti-text-muted">Profile</div>
              </div>
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-3 rounded-full border border-AgriNiti-border bg-AgriNiti-surface px-4 py-2.5 text-base text-AgriNiti-text hover:bg-AgriNiti-bg transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </header>

        <div className="rounded-2xl bg-AgriNiti-surface/60 border border-AgriNiti-border shadow-soft-card">
          <div className="border-b border-AgriNiti-border/80 px-8 py-4 flex items-center gap-4 text-sm text-AgriNiti-text-muted">
            <span className="font-medium text-AgriNiti-text">You are here:</span>
            <span className="inline-flex items-center gap-1">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-AgriNiti-primary hover:underline transition-colors"
              >
                Dashboard
              </button>
              {location.pathname !== '/dashboard' && (
                <>
                  <span className="text-AgriNiti-border">/</span>
                  <button
                    onClick={() => navigate(location.pathname)}
                    className="capitalize hover:underline transition-colors"
                  >
                    {location.pathname === '/dashboard'
                      ? 'Overview'
                      : location.pathname.replace('/', '').replace('-', ' ')}
                  </button>
                </>
              )}
            </span>
          </div>
          <div className="p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

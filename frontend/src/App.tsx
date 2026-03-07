import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { SchemesPage } from './pages/SchemesPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { ListProducePage } from './pages/ListProducePage';
import { BrowseProducePage } from './pages/BrowseProducePage';
import { BuyersPage } from './pages/BuyersPage';
import { NegotiationPage } from './pages/NegotiationPage';
import { ProfilePage } from './pages/ProfilePage';
import { CropAnalysisPage } from './pages/CropAnalysisPage';
import { EnquiriesPage } from './pages/EnquiriesPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import { useLanguageStore } from './store/languageStore';
import { useEffect, useRef } from 'react';

function App() {
  const { isAuthenticated, refreshToken, user } = useAuthStore();
  const { selectedLanguage, setLanguage } = useLanguageStore();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      refreshToken();
    }
  }, [isAuthenticated, refreshToken]);

  // Sync language with user profile preference on initial load/login
  const lastSyncedIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only sync FROM server if we are NOT on the login page
    // This prevents overwriting the user's fresh selection on the login page
    if (location.pathname !== '/login' && user?.id && user.id !== lastSyncedIdRef.current) {
      if (user.preferred_language) {
        setLanguage(user.preferred_language as any);
      }
      lastSyncedIdRef.current = user.id;
    } else if (!user?.id) {
      lastSyncedIdRef.current = null;
    }
  }, [user?.id, user?.preferred_language, location.pathname, setLanguage]);

  return (
    <div className="min-h-screen bg-AgriNiti-bg">
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/schemes" element={<SchemesPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/list-produce" element={<ListProducePage />} />
          <Route path="/browse-produce" element={<BrowseProducePage />} />
          <Route path="/buyers" element={<BuyersPage />} />
          <Route path="/negotiation" element={<NegotiationPage />} />
          <Route path="/enquiries" element={<EnquiriesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/crop-analysis" element={<CropAnalysisPage />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;

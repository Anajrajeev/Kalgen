import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { SchemesPage } from './pages/SchemesPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { ListProducePage } from './pages/ListProducePage';
import { BrowseProducePage } from './pages/BrowseProducePage';
import { BusinessAssistancePage } from './pages/TrackShipmentsPage';
import { BuyersPage } from './pages/BuyersPage';
import { NegotiationPage } from './pages/NegotiationPage';
import { ProfilePage } from './pages/ProfilePage';
import { CropAnalysisPage } from './pages/CropAnalysisPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';

function App() {
  const { isAuthenticated, refreshToken } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      refreshToken();
    }
  }, [isAuthenticated, refreshToken]);

  return (
    <div className="min-h-screen bg-AgriNiti-bg">
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
          <Route path="/business-assistance" element={<BusinessAssistancePage />} />
          <Route path="/buyers" element={<BuyersPage />} />
          <Route path="/negotiation" element={<NegotiationPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/crop-analysis" element={<CropAnalysisPage />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;

import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Package, Sparkles, MapPin, IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../services/useTranslation';
import { apiClient } from '../services/api';
import { useAuthStore } from '../store/authStore';

export function ListProducePage() {
  const navigate = useNavigate();
  const { label } = useTranslation();
  const { user } = useAuthStore();

  const [commodity, setCommodity] = useState('');
  const [variety, setVariety] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [district, setDistrict] = useState((user as any)?.district || '');
  const [state, setState] = useState((user as any)?.state || '');

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total_listings: '2,847',
    active_buyers: '1,523',
    avg_response_time: '2.3 hrs'
  });

  useEffect(() => {
    const fetchStats = async () => {
      const response = await apiClient.getMarketplaceStats();
      if (response.data) {
        setStats({
          total_listings: response.data.total_listings,
          active_buyers: response.data.active_buyers,
          avg_response_time: response.data.avg_response_time
        });
      }
    };
    fetchStats();
  }, []);

  const handleSubmit = async () => {
    if (!commodity || !quantity || !price || !district) return;

    setLoading(true);
    try {
      // Use Agriniti Listing for AI integration
      const response = await apiClient.createAgrinitiListing({
        commodity: commodity,
        variety: variety,
        quantity_qtl: parseFloat(quantity),
        price_per_qtl: parseFloat(price.replace(/[^0-9.]/g, '')),
        state: state,
        district: district,
        available_from: new Date().toISOString().split('T')[0]
      });

      if (response.data) {
        // Successful listing -> Show matched buyers
        navigate('/buyers', { state: { listingId: response.data.id, commodity } });
      } else if (response.error) {
        alert("Error creating listing: " + response.error);
      }
    } catch (err) {
      console.error("Listing error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="secondary"
            onClick={() => navigate('/marketplace')}
            className="inline-flex items-center gap-2 font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-AgriNiti-accent-gold/20 rounded-xl flex items-center justify-center">
              <Package className="h-5 w-5 text-AgriNiti-accent-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-AgriNiti-text font-serif leading-tight uppercase tracking-tight">Market Listing</h1>
              <p className="text-sm text-AgriNiti-text-muted">Post your harvest to reach high-intent verified buyers.</p>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <Card className="p-8 shadow-soft-card">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-AgriNiti-text-muted uppercase tracking-wider mb-2 block">Commodity</label>
                <input
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value)}
                  className="AgriNiti-input w-full"
                  placeholder="e.g. Wheat"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-AgriNiti-text-muted uppercase tracking-wider mb-2 block">Variety (Optional)</label>
                <input
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  className="AgriNiti-input w-full"
                  placeholder="e.g. Sharbati"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-AgriNiti-text-muted uppercase tracking-wider mb-2 block">Quantity (Quintals)</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="AgriNiti-input w-full"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-AgriNiti-text-muted uppercase tracking-wider mb-2 block">Asking Price (₹/qtl)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-AgriNiti-text-muted" />
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="AgriNiti-input w-full pl-10"
                    placeholder="7500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-AgriNiti-text-muted uppercase tracking-wider mb-2 block">District</label>
                <input
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="AgriNiti-input w-full"
                  placeholder="e.g. Nizamabad"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-AgriNiti-text-muted uppercase tracking-wider mb-2 block">State</label>
                <input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="AgriNiti-input w-full"
                  placeholder="e.g. Telangana"
                />
              </div>
            </div>

            <div className="p-4 bg-AgriNiti-primary/[0.03] border border-AgriNiti-primary/20 rounded-2xl flex gap-4">
              <Sparkles className="h-6 w-6 text-AgriNiti-primary flex-shrink-0" />
              <p className="text-xs text-AgriNiti-text leading-relaxed">
                <span className="font-bold">AI Insight:</span> After listing, our semantic engine will match you with buyers who have previously requested similar variety and quality in your region.
              </p>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSubmit}
                disabled={!commodity || !quantity || !price || !district || loading}
                className="w-full bg-AgriNiti-accent-gold hover:bg-AgriNiti-accent-gold/90 text-white py-4 text-sm font-bold uppercase tracking-widest shadow-lg shadow-AgriNiti-accent-gold/20 disabled:opacity-50"
              >
                {loading ? 'Submitting to AgriNiti...' : 'Confirm and Find Buyers'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

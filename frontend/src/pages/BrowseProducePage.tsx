import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { TranslatedText } from '../components/ui/TranslatedText';
import { ArrowLeft, MessageCircle, Star, MapPin, Package, Search, Sparkles, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../services/useTranslation';
import { apiClient } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface Seller {
  id: string;
  userId: string;
  name: string;
  location: string;
  distance: string;
  rating: number;
  totalSales: number;
  responseTime: string;
  produce: string;
  quantity: string;
  price: number;
  quality: 'Premium' | 'Standard' | 'Basic';
  verified: boolean;
  priceTag?: { label: string, tone: 'success' | 'warning' | 'error' | 'info' };
}

export function BrowseProducePage() {
  const navigate = useNavigate();
  const { label } = useTranslation();
  const { user } = useAuthStore();

  const [listingSellers, setListingSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [stats, setStats] = useState({
    available_produce: '5,421',
    verified_sellers: '3,892',
    quality_score: '4.7/5'
  });

  const fetchData = async (query?: string) => {
    setLoading(true);
    try {
      let listingsData: any[] = [];
      const district = (user as any)?.district || undefined;

      if (query && query.length > 3) {
        setIsAiSearching(true);
        const rankRes = await apiClient.rankSellers(query, district);
        listingsData = rankRes.data || [];
      } else {
        setIsAiSearching(false);
        const [statsRes, listingsRes] = await Promise.all([
          apiClient.getMarketplaceStats(),
          apiClient.getAgrinitiListings() // Use Agriniti/SQLite for real distance ranking
        ]);
        if (statsRes.data) setStats(statsRes.data);
        listingsData = listingsRes.data || [];
      }

      // Fetch market prices for comparison
      const commoditiesInResults = Array.from(new Set(listingsData.map(l => l.commodity)));
      const marketRes = await apiClient.getMarketPrices({ limit: 100 }); // Get some recent prices
      const marketRecords = marketRes.data?.records || [];

      const mappedSellers: Seller[] = listingsData.map((l: any, index: number) => {
        // Simple Price Comparison
        const marketInfo = marketRecords.find((m: any) => m.commodity.toLowerCase() === l.commodity.toLowerCase());
        let priceTag: any = undefined;

        if (marketInfo && l.price_per_qtl) {
          const diff = ((l.price_per_qtl - marketInfo.modal_price) / marketInfo.modal_price) * 100;
          if (diff < -5) priceTag = { label: 'Below Market', tone: 'success' };
          else if (diff > 5) priceTag = { label: 'Above Market', tone: 'warning' };
          else priceTag = { label: 'Fair Price', tone: 'info' };
        }

        return {
          id: l.id,
          userId: l.seller_id,
          name: l.seller_name || 'Farmer ' + l.seller_id.substring(0, 4),
          location: `${l.district}, ${l.state}`,
          distance: l.distance_km ? `${Math.round(l.distance_km)} km away` : 'Nearby',
          rating: l.seller_rating || 4.8,
          totalSales: 120, // Example
          responseTime: '1.5 hrs',
          produce: l.commodity + (l.variety ? ` (${l.variety})` : ''),
          quantity: `${l.quantity_qtl} qtl`,
          price: l.price_per_qtl,
          quality: 'Standard',
          verified: l.seller_is_verified || false,
          priceTag
        };
      });
      setListingSellers(mappedSellers);
    } catch (err) {
      console.error("Fetch listings error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearchClick = () => {
    fetchData(searchQuery);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            onClick={() => navigate('/marketplace')}
            className="inline-flex items-center gap-2 font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-AgriNiti-text font-serif">{label('browseProduceTitle')}</h1>
            <p className="text-sm text-AgriNiti-text-muted">Live produce inventory with AI distance-aware ranking.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-AgriNiti-border/30 w-full md:w-[450px]">
          <div className="flex-1 relative">
            <Sparkles className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isAiSearching ? 'text-AgriNiti-primary animate-pulse' : 'text-AgriNiti-text-muted'}`} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
              placeholder={label('aiSearchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 text-sm bg-transparent border-none focus:ring-0"
            />
          </div>
          <Button onClick={handleSearchClick} className="bg-AgriNiti-primary text-white scale-90">{label('sendBtn')}</Button>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 flex items-center gap-4 bg-AgriNiti-accent-blue/5 border-AgriNiti-accent-blue/20">
          <TrendingUp className="h-8 w-8 text-AgriNiti-accent-blue" />
          <div>
            <p className="text-xl font-bold text-AgriNiti-text">{stats.available_produce}</p>
            <p className="text-[10px] uppercase font-bold text-AgriNiti-text-muted tracking-widest">{label('available')}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4 bg-AgriNiti-accent-gold/5 border-AgriNiti-accent-gold/20">
          <Star className="h-8 w-8 text-AgriNiti-accent-gold" />
          <div>
            <p className="text-xl font-bold text-AgriNiti-text">{stats.verified_sellers}</p>
            <p className="text-[10px] uppercase font-bold text-AgriNiti-text-muted tracking-widest">{label('verifiedSellers')}</p>
          </div>
        </Card>
      </div>

      {/* Sellers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <div className="animate-spin h-10 w-10 border-4 border-AgriNiti-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-AgriNiti-text-muted italic">Connecting with AgriNiti AI Engine...</p>
          </div>
        ) : listingSellers.length === 0 ? (
          <div className="col-span-full py-24 text-center bg-white rounded-3xl border border-dashed border-AgriNiti-border">
            <Search className="h-12 w-12 text-AgriNiti-text-muted mx-auto mb-4 opacity-30" />
            <p className="text-AgriNiti-text font-bold">No results found.</p>
            <p className="text-sm text-AgriNiti-text-muted">Try a natural language search like "Grains near me".</p>
          </div>
        ) : listingSellers.map((seller) => (
          <Card key={seller.id} className="p-6 overflow-hidden relative group hover:border-AgriNiti-primary/40 transition-all shadow-soft-card">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 bg-AgriNiti-primary/10 rounded-2xl flex items-center justify-center font-bold text-AgriNiti-primary text-xl">
                  {seller.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-AgriNiti-text">{seller.name}</h3>
                    {seller.verified && <Badge tone="success" className="h-5 text-[9px] uppercase font-black">{label('verifiedBadge')}</Badge>}
                  </div>
                  <p className="text-xs text-AgriNiti-text-muted font-medium flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 text-AgriNiti-primary" />
                    <TranslatedText text={seller.location} /> · <span className="text-AgriNiti-accent-blue"><TranslatedText text={seller.distance} /></span>
                  </p>
                </div>
              </div>
              {seller.priceTag && (
                <Badge tone={seller.priceTag.tone} className="text-[9px] font-black uppercase tracking-tighter">
                  {seller.priceTag.label}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-AgriNiti-bg/40 rounded-2xl border border-AgriNiti-border/20">
                <p className="text-[10px] text-AgriNiti-text-muted uppercase font-bold tracking-widest mb-1">{label('produceLabel')}</p>
                <p className="text-sm font-bold text-AgriNiti-text truncate"><TranslatedText text={seller.produce} /></p>
              </div>
              <div className="p-3 bg-AgriNiti-bg/40 rounded-2xl border border-AgriNiti-border/20 text-right">
                <p className="text-[10px] text-AgriNiti-text-muted uppercase font-bold tracking-widest mb-1">{label('expectedPriceLabel')}</p>
                <p className="text-lg font-black text-AgriNiti-accent-blue">₹{seller.price}<span className="text-[10px] font-normal">/{label('unitLabel')}</span></p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="secondary"
                className="flex-1 font-bold text-xs"
                onClick={() => navigate(`/seller/${seller.userId}`)}
              >
                {label('producerViewBtn')}
              </Button>
              <Button
                className="flex-1 bg-AgriNiti-accent-blue text-white font-bold text-xs shadow-lg shadow-AgriNiti-accent-blue/20"
                onClick={() => navigate('/negotiation', { state: { sellerId: seller.userId, sellerName: seller.name } })}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                {label('contactMakeOfferBtn')}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

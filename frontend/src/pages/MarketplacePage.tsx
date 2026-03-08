import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../services/api';
import { useTranslation } from '../services/useTranslation';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Package, ShoppingCart, Truck, Plus, MessageCircle, Filter, MapPin } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TranslatedText } from '../components/ui/TranslatedText';

interface MarketPrice {
  commodity: string;
  state: string;
  district: string;
  market: string;
  min_price: number | string;
  max_price: number | string;
  modal_price: number | string;
  arrival_date: string;
}

export function MarketplacePage() {
  const navigate = useNavigate();
  const { label } = useTranslation();

  // State for market data
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [commodities, setCommodities] = useState<string[]>([]);

  // Filters
  const [selectedState, setSelectedState] = useState('');
  const [selectedCommodity, setSelectedCommodity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    total_listings: '2,847',
    active_buyers: '1,523',
    avg_response_time: '2.3 hrs',
    available_produce: '5,421',
    verified_sellers: '3,892',
    quality_score: '4.7/5'
  });

  // Fetch initial data once on mount
  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      console.log("MarketplacePage: Fetching initial data...");
      setLoading(true);
      try {
        const [statsRes, pricesRes, statesRes, commoditiesRes] = await Promise.all([
          apiClient.getMarketplaceStats().catch(e => ({ data: null })),
          apiClient.getMarketPrices().catch(e => ({ data: null })),
          apiClient.getMarketStates().catch(e => ({ data: null })),
          apiClient.getMarketCommodities().catch(e => ({ data: null }))
        ]);

        if (!isMounted) return;

        if (statsRes?.data) {
          setStats(prev => ({ ...prev, ...statsRes.data }));
        }

        if (pricesRes?.data?.records) {
          setMarketPrices(pricesRes.data.records);
        }

        if (statesRes?.data?.values && Array.isArray(statesRes.data.values)) {
          setStates(statesRes.data.values);
        }

        if (commoditiesRes?.data?.values && Array.isArray(commoditiesRes.data.values)) {
          setCommodities(commoditiesRes.data.values);
        }
      } catch (err) {
        console.error("MarketplacePage: Error in fetchInitialData", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInitialData();
    return () => { isMounted = false; };
  }, []);

  // Debounce search query to avoid hammering the API
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle filter and search changes
  useEffect(() => {
    let isMounted = true;
    const fetchFiltered = async () => {
      setLoading(true);
      try {
        const params: any = { limit: 100 };
        if (selectedState) params.state = selectedState;
        if (selectedCommodity) params.commodity = selectedCommodity;

        // Use the generic 'q' parameter for the search bar input
        const searchInput = debouncedSearch.trim();
        if (searchInput.length >= 2) {
          params.q = searchInput;
        }

        const response = await apiClient.getMarketPrices(params);

        if (isMounted && response?.data?.records) {
          setMarketPrices(response.data.records);
        }
      } catch (err) {
        console.error("MarketplacePage: Filter fetch failed", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFiltered();
    return () => { isMounted = false; };
  }, [selectedState, selectedCommodity, debouncedSearch]);

  // Update commodities list when state changes
  useEffect(() => {
    let isMounted = true;
    const updateCommodities = async () => {
      try {
        const res = await apiClient.getMarketCommodities(selectedState || undefined);
        if (isMounted && res?.data?.values) {
          setCommodities(res.data.values);
        }
      } catch (err) {
        console.error("MarketplacePage: Commodity update failed", err);
      }
    };
    updateCommodities();
    return () => { isMounted = false; };
  }, [selectedState]);

  // Derived filter for search bar
  const filteredPrices = useMemo(() => {
    const prices = Array.isArray(marketPrices) ? marketPrices : [];
    if (!searchQuery) return prices;

    const query = searchQuery.toLowerCase();
    return prices.filter(p =>
      (p?.commodity || "").toLowerCase().includes(query) ||
      (p?.district || "").toLowerCase().includes(query) ||
      (p?.market || "").toLowerCase().includes(query) ||
      (p?.state || "").toLowerCase().includes(query)
    );
  }, [marketPrices, searchQuery]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-AgriNiti-text font-serif leading-tight uppercase tracking-tight">{label('marketIntelligenceTitle')}</h2>
          <p className="mt-2 text-base text-AgriNiti-text-muted max-w-2xl leading-relaxed">
            {label('marketIntelligenceDesc')}
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={() => navigate('/list-produce')}
            className="bg-AgriNiti-primary hover:bg-AgriNiti-primary/90 text-white shadow-soft-card group transition-all"
          >
            <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
            {label('sellProduceBtn')}
          </Button>
          <Button
            onClick={() => navigate('/enquiries')}
            className="bg-white border border-AgriNiti-border/30 text-AgriNiti-text hover:bg-slate-50 shadow-sm"
          >
            <MessageCircle className="h-4 w-4 mr-2 text-AgriNiti-primary" />
            {label('myEnquiriesBtn')}
          </Button>
        </div>
      </header>

      {/* Discovery Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar/Column */}
        <Card className="lg:col-span-1 p-6 h-fit sticky top-4">
          <h3 className="text-sm font-bold text-AgriNiti-text uppercase tracking-widest mb-6 flex items-center gap-2">
            <Filter className="h-4 w-4 text-AgriNiti-primary" />
            Market Filters
          </h3>

          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-AgriNiti-text-muted uppercase mb-2 block tracking-wider">Global Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-AgriNiti-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Wheat, Rice, Punjab..."
                  className="w-full pl-9 pr-4 py-2 bg-AgriNiti-bg/40 border border-AgriNiti-border/20 rounded-xl text-sm transition-all focus:bg-white focus:ring-2 focus:ring-AgriNiti-primary/20 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-AgriNiti-text-muted uppercase mb-2 block tracking-wider">State</label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-AgriNiti-border/30 rounded-xl text-sm outline-none focus:ring-2 focus:ring-AgriNiti-primary/10"
              >
                <option value="">{label('allStates')}</option>
                {Array.isArray(states) && states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-AgriNiti-text-muted uppercase mb-2 block tracking-wider">Commodity</label>
              <select
                value={selectedCommodity}
                onChange={(e) => setSelectedCommodity(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-AgriNiti-border/30 rounded-xl text-sm outline-none focus:ring-2 focus:ring-AgriNiti-primary/10"
              >
                <option value="">{label('allCommodities')}</option>
                {Array.isArray(commodities) && commodities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="pt-4 border-t border-AgriNiti-border/20">
              <div className="flex items-center gap-3 text-AgriNiti-text-muted">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Real-time Feed</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Results Main Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              [1, 2].map(i => <Card key={i} className="p-6 h-40 animate-pulse bg-AgriNiti-bg/10"><div className="h-full w-full" /></Card>)
            ) : filteredPrices.length === 0 ? (
              <Card className="md:col-span-2 p-12 text-center bg-AgriNiti-bg/10 border-dashed">
                <Package className="h-10 w-10 text-AgriNiti-text-muted mx-auto mb-3 opacity-20" />
                <p className="text-sm font-bold text-AgriNiti-text-muted">No market matches your query.</p>
                <button onClick={() => { setSelectedState(''); setSelectedCommodity(''); setSearchQuery(''); }} className="mt-4 text-AgriNiti-primary font-bold text-xs uppercase tracking-widest underline underline-offset-4">Reset Dashboard</button>
              </Card>
            ) : filteredPrices.slice(0, 4).map((price, idx) => (
              <Card key={`${price.market}-${idx}`} className="p-6 hover:shadow-xl transition-all shadow-soft-card group border-l-4 border-l-AgriNiti-primary/50">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-[10px] font-black text-AgriNiti-primary uppercase tracking-widest">{label('liveQuote')}</span>
                    <h3 className="text-xl font-black text-AgriNiti-text mt-1 group-hover:text-AgriNiti-primary transition-colors">
                      <TranslatedText text={price.commodity} />
                    </h3>
                    <p className="text-xs text-AgriNiti-text-muted mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <TranslatedText text={price.market} />, <TranslatedText text={price.district} />
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-AgriNiti-text">₹{price.modal_price || '—'}</p>
                    <p className="text-[9px] font-bold text-AgriNiti-text-muted uppercase">Per Quintal</p>
                  </div>
                </div>
                <div className="py-3 border-y border-AgriNiti-border/10 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[9px] text-AgriNiti-text-muted font-black uppercase">Market Flow</p>
                    <p className="text-xs font-bold text-AgriNiti-text">{price.state}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[9px] text-AgriNiti-text-muted font-black uppercase">Last Updated</p>
                    <p className="text-xs font-bold text-AgriNiti-text">{price.arrival_date || 'Today'}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Trade Entry Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="group">
              <Card className="p-8 bg-AgriNiti-accent-gold/5 border-AgriNiti-accent-gold/30 hover:bg-AgriNiti-accent-gold/10 transition-colors h-full flex flex-col">
                <div className="h-12 w-12 bg-AgriNiti-accent-gold/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Package className="h-6 w-6 text-AgriNiti-accent-gold" />
                </div>
                <h4 className="text-2xl font-black text-AgriNiti-text font-serif">{label('tradeProduceTitle')}</h4>
                <p className="text-sm text-AgriNiti-text-muted mt-2 mb-8">{label('tradeProduceDesc')}</p>

                <div className="mt-auto flex flex-wrap gap-4">
                  <button
                    onClick={() => navigate('/list-produce')}
                    className="flex items-center gap-2 text-sm font-black text-AgriNiti-accent-gold uppercase tracking-widest hover:opacity-80 transition-opacity"
                  >
                    {label('sellProduceBtn')} <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => navigate('/enquiries')}
                    className="flex items-center gap-2 text-sm font-black text-AgriNiti-text uppercase tracking-widest hover:opacity-80 transition-opacity border-l border-AgriNiti-border/40 pl-4"
                  >
                    {label('enquiriesBtn')} <MessageCircle className="h-4 w-4 text-AgriNiti-primary" />
                  </button>
                </div>
              </Card>
            </div>

            <div className="cursor-pointer group" onClick={() => navigate('/browse-produce')}>
              <Card className="p-8 bg-AgriNiti-accent-blue/5 border-AgriNiti-accent-blue/30 hover:bg-AgriNiti-accent-blue/10 transition-colors">
                <div className="h-12 w-12 bg-AgriNiti-accent-blue/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <ShoppingCart className="h-6 w-6 text-AgriNiti-accent-blue" />
                </div>
                <h4 className="text-2xl font-black text-AgriNiti-text font-serif">{label('buyDirectTitle')}</h4>
                <p className="text-sm text-AgriNiti-text-muted mt-2 mb-6">{label('buyDirectDesc')}</p>
                <button className="flex items-center gap-2 text-sm font-black text-AgriNiti-accent-blue uppercase tracking-widest">
                  {label('browseStoreBtn')} <Search className="h-4 w-4" />
                </button>
              </Card>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}

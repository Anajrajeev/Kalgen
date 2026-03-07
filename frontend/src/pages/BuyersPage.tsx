import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Star, MapPin, UserCheck, MessageCircle, ArrowLeft, Package, Sparkles } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { apiClient } from '../services/api';
import { useTranslation } from '../services/useTranslation';

interface MatchedBuyer {
  id: string;
  name: string;
  location: string;
  distance_km?: number;
  trust_score: number;
  is_verified: boolean;
  total_trades: number;
  avg_response_time: number;
  reason?: string; // AI matching reason
}

export function BuyersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { label } = useTranslation();

  const listingId = location.state?.listingId;
  const commodity = location.state?.commodity || "";

  const [buyers, setBuyers] = useState<MatchedBuyer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatchedBuyers = async () => {
      setLoading(true);
      try {
        let response;
        if (listingId) {
          // AI Farmer-Buyer Matching
          response = await apiClient.matchBuyersForListing(listingId);
        } else {
          // Fallback semantic search for top buyers in general
          response = await apiClient.rankSellers(commodity || "Top Buyers");
        }

        if (response.data) {
          // Map to UI format
          const mapped: MatchedBuyer[] = (response.data || []).map((b: any) => ({
            id: b.id || b.seller_id,
            name: b.name || b.seller_name || 'AgriBuyer ' + (b.id?.substring(0, 4) || 'X'),
            location: b.location || `${b.district || 'Nearby'}, ${b.state || ''}`,
            distance_km: b.distance_km,
            trust_score: b.trust_score || (b.seller_rating ? Math.round(b.seller_rating * 20) : 85),
            is_verified: b.is_verified || b.seller_is_verified || false,
            total_trades: b.total_sales || 42,
            avg_response_time: b.avg_response_time_hrs || 1.8,
            reason: b.matching_reason || "Semantically matched with your requirements"
          }));
          setBuyers(mapped);
        }
      } catch (err) {
        console.error("Match buyers error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatchedBuyers();
  }, [listingId, commodity]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/marketplace')} className="inline-flex items-center gap-2 font-bold">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-AgriNiti-text font-serif leading-tight uppercase tracking-tight">AI Deep-Match Buyers</h2>
            <p className="mt-2 text-base text-AgriNiti-text-muted max-w-2xl leading-relaxed">
              {commodity ? `AI-ranked potential buyers for ${commodity}` : "Buyers matched by trust and historical trade patterns."}
            </p>
          </div>
        </div>
        {listingId && (
          <Badge tone="info" className="flex items-center gap-2 px-4 py-2">
            <Sparkles className="h-4 w-4" />
            AI Matching Active
          </Badge>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar stats or info */}
        <Card className="p-6 h-fit bg-AgriNiti-primary/5 border-AgriNiti-primary/30">
          <h3 className="text-sm font-bold text-AgriNiti-text uppercase tracking-widest mb-4">How we rank</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="h-8 w-8 bg-AgriNiti-success/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="h-4 w-4 text-AgriNiti-success" />
              </div>
              <p className="text-[11px] text-AgriNiti-text italic">Verified GST & Business Identity</p>
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 bg-AgriNiti-accent-blue/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-AgriNiti-accent-blue" />
              </div>
              <p className="text-[11px] text-AgriNiti-text italic">Haversine Distance Prioritization</p>
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 bg-AgriNiti-accent-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-AgriNiti-accent-gold" />
              </div>
              <p className="text-[11px] text-AgriNiti-text italic">Semantic Requirement Matching</p>
            </div>
          </div>
        </Card>

        <div className="md:col-span-2 space-y-4">
          {loading ? (
            <div className="py-20 text-center animate-pulse">
              <Sparkles className="h-10 w-10 text-AgriNiti-primary mx-auto mb-4" />
              <p className="text-AgriNiti-text font-bold italic">Simulating trade history matching...</p>
            </div>
          ) : buyers.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-AgriNiti-border">
              <Package className="h-10 w-10 text-AgriNiti-text-muted mx-auto mb-2 opacity-30" />
              <p className="text-sm text-AgriNiti-text-muted">No specific matches found. Try searching for broader categories.</p>
            </div>
          ) : buyers.map((buyer, idx) => (
            <Card key={buyer.id} className="p-5 hover:border-AgriNiti-primary/50 transition-all shadow-soft-card group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1 font-black text-AgriNiti-primary/40 text-lg">#{idx + 1}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-bold text-AgriNiti-text">{buyer.name}</h4>
                      {buyer.is_verified && <ShieldCheck className="h-4 w-4 text-AgriNiti-success" />}
                    </div>
                    <p className="text-xs text-AgriNiti-text-muted flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {buyer.location} · <span className="text-AgriNiti-accent-blue font-semibold">{buyer.distance_km ? `${Math.round(buyer.distance_km)}km away` : 'Nearby'}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-AgriNiti-text">{buyer.trust_score}%</div>
                  <p className="text-[10px] text-AgriNiti-text-muted uppercase font-bold tracking-tighter">Trust Score</p>
                </div>
              </div>

              <div className="mb-4 p-3 bg-AgriNiti-bg/40 rounded-2xl border border-AgriNiti-border/20">
                <p className="text-[10px] text-AgriNiti-primary font-bold uppercase tracking-widest mb-1">Matching Insight</p>
                <p className="text-xs text-AgriNiti-text leading-relaxed font-medium">"{buyer.reason}"</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-[10px] text-AgriNiti-text-muted font-bold uppercase">Trades</p>
                    <p className="text-xs font-bold">{buyer.total_trades}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-AgriNiti-text-muted font-bold uppercase">Response</p>
                    <p className="text-xs font-bold">{buyer.avg_response_time}h</p>
                  </div>
                </div>
                <Button
                  className="bg-AgriNiti-primary text-white font-bold text-xs"
                  onClick={() => navigate('/negotiation', { state: { sellerId: buyer.id, sellerName: buyer.name } })}
                >
                  Initiate Deal
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

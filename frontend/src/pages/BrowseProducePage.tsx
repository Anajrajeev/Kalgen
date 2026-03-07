import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, MessageCircle, Star, MapPin, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../services/useTranslation';
import { apiClient } from '../services/api';

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
  price: string;
  quality: 'Premium' | 'Standard' | 'Basic';
  verified: boolean;
}

const sellers: Seller[] = [];

export function BrowseProducePage() {
  const navigate = useNavigate();
  const { label } = useTranslation();
  const [listingSellers, setListingSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    available_produce: '5,421',
    verified_sellers: '3,892',
    quality_score: '4.7/5'
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, listingsRes] = await Promise.all([
          apiClient.getMarketplaceStats(),
          apiClient.getListings()
        ]);

        if (statsRes.data) {
          setStats(statsRes.data);
        }

        if (listingsRes.data) {
          const mappedSellers: Seller[] = listingsRes.data.map((l: any, index: number) => ({
            id: l.id || `listing-${index}`,
            userId: l.user_id || `farmer-${index}`,
            name: l.marketplace_profiles?.business_name || 'Farmer ' + (index + 1),
            location: l.location,
            distance: 'Unknown', // In real app, calculate distance from l.marketplace_profiles?.location
            rating: l.marketplace_profiles?.rating || 4.5,
            totalSales: l.marketplace_profiles?.total_sales || 100,
            responseTime: l.marketplace_profiles?.avg_response_time_hrs ? `${l.marketplace_profiles.avg_response_time_hrs} hrs` : '2.0 hrs',
            produce: l.produce_name,
            quantity: `${l.quantity} ${l.unit}`,
            price: l.expected_price,
            quality: 'Standard', // Mocked quality
            verified: l.marketplace_profiles?.is_verified || false
          }));
          setListingSellers(mappedSellers);
        }
      } catch (err) {
        console.error("Fetch listings error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleMessageSeller = (sellerId: string, sellerName: string) => {
    // Navigate to negotiation page with the seller
    navigate('/negotiation', { state: { sellerId, sellerName } });
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'Premium': return 'bg-AgriNiti-accent-gold/10 text-AgriNiti-accent-gold border-AgriNiti-accent-gold/30';
      case 'Standard': return 'bg-AgriNiti-accent-blue/10 text-AgriNiti-accent-blue border-AgriNiti-accent-blue/30';
      case 'Basic': return 'bg-gray-100 text-gray-600 border-gray-300';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-AgriNiti-bg/30 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              onClick={() => navigate('/marketplace')}
              className="inline-flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Marketplace
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-AgriNiti-accent-blue/20 rounded-xl flex items-center justify-center">
                <Package className="h-5 w-5 text-AgriNiti-accent-blue" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-AgriNiti-text">{label('browseProduceTitle')}</h1>
                <p className="text-sm text-AgriNiti-text-muted">{label('browseProduceSubtitle')}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-lg font-bold text-AgriNiti-text">{stats.available_produce}</div>
              <div className="text-xs text-AgriNiti-text-muted">{label('available')}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-AgriNiti-text">{stats.verified_sellers}</div>
              <div className="text-xs text-AgriNiti-text-muted">{label('verifiedSellers')}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-AgriNiti-text">{stats.quality_score}</div>
              <div className="text-xs text-AgriNiti-text-muted">{label('qualityScore')}</div>
            </div>
          </div>
        </div>

        {/* Sellers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center">
              <div className="animate-spin h-10 w-10 border-4 border-AgriNiti-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-AgriNiti-text-muted">Loading produce listings...</p>
            </div>
          ) : listingSellers.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-AgriNiti-border/50">
              <Package className="h-12 w-12 text-AgriNiti-text-muted mx-auto mb-4 opacity-50" />
              <p className="text-AgriNiti-text-muted">No produce listings found. Be the first to list yours!</p>
              <Button
                onClick={() => navigate('/list-produce')}
                className="mt-4 bg-AgriNiti-accent-gold text-white"
              >
                List Your Produce
              </Button>
            </div>
          ) : listingSellers.map((seller) => (
            <Card key={seller.id} className="p-6 hover:shadow-soft-card transition-all">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-AgriNiti-text">{seller.name}</h3>
                    {seller.verified && (
                      <Badge tone="success" className="text-xs">{label('sellerVerified')}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-AgriNiti-text-muted">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {seller.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      {seller.rating}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${getQualityColor(seller.quality)}`}>
                    {seller.quality}
                  </div>
                </div>
              </div>

              {/* Produce Details */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-AgriNiti-text-muted">{label('produceLabel')}</span>
                  <span className="text-sm font-medium text-AgriNiti-text">{seller.produce}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-AgriNiti-text-muted">{label('availableQuantity')}</span>
                  <span className="text-sm font-medium text-AgriNiti-text">{seller.quantity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-AgriNiti-text-muted">{label('priceHeader')}</span>
                  <span className="text-sm font-semibold text-AgriNiti-accent-blue">{seller.price}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-AgriNiti-text-muted">{label('distance')}</span>
                  <span className="text-sm font-medium text-AgriNiti-text">{seller.distance}</span>
                </div>
              </div>

              {/* Seller Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-AgriNiti-bg/30 rounded-lg">
                <div className="text-center">
                  <div className="text-xs text-AgriNiti-text-muted">{label('sales')}</div>
                  <div className="text-sm font-semibold text-AgriNiti-text">{seller.totalSales}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-AgriNiti-text-muted">Response</div>
                  <div className="text-sm font-semibold text-AgriNiti-text">{seller.responseTime}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-AgriNiti-text-muted">Rating</div>
                  <div className="text-sm font-semibold text-AgriNiti-text">{seller.rating}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => navigate(`/seller/${seller.userId}`)}
                >
                  {label('viewDetailsBtn')}
                </Button>
                <Button
                  className="flex-1 bg-AgriNiti-accent-blue hover:bg-AgriNiti-accent-blue/90 text-white"
                  onClick={() => handleMessageSeller(seller.userId, seller.name)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {label('messageSellerBtn')}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <Button variant="secondary" className="px-8">
            {label('loadMoreBtn')}
          </Button>
        </div>
      </div>
    </div>
  );
}

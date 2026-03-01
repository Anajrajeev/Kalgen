import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, MessageCircle, Star, MapPin, Package, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Seller {
  id: number;
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

const sellers: Seller[] = [
  {
    id: 1,
    name: 'GreenField Farms',
    location: 'Nashik, Maharashtra',
    distance: '45 km',
    rating: 4.8,
    totalSales: 1247,
    responseTime: '1.2 hrs',
    produce: 'Tur / Arhar',
    quantity: '150 qtl',
    price: '₹7,100 / qtl',
    quality: 'Premium',
    verified: true
  },
  {
    id: 2,
    name: 'Shree Krishna Traders',
    location: 'Pune, Maharashtra',
    distance: '78 km',
    rating: 4.6,
    totalSales: 892,
    responseTime: '2.1 hrs',
    produce: 'Tur / Arhar',
    quantity: '200 qtl',
    price: '₹7,050 / qtl',
    quality: 'Standard',
    verified: true
  },
  {
    id: 3,
    name: 'Organic Harvest Co.',
    location: 'Ahmednagar, Maharashtra',
    distance: '120 km',
    rating: 4.9,
    totalSales: 634,
    responseTime: '0.8 hrs',
    produce: 'Tur / Arhar',
    quantity: '80 qtl',
    price: '₹7,250 / qtl',
    quality: 'Premium',
    verified: true
  },
  {
    id: 4,
    name: 'Vasudha Agro',
    location: 'Satara, Maharashtra',
    distance: '95 km',
    rating: 4.4,
    totalSales: 445,
    responseTime: '3.2 hrs',
    produce: 'Maize',
    quantity: '300 qtl',
    price: '₹2,180 / qtl',
    quality: 'Standard',
    verified: false
  },
  {
    id: 5,
    name: 'Progressive Farmers Group',
    location: 'Kolhapur, Maharashtra',
    distance: '156 km',
    rating: 4.7,
    totalSales: 1567,
    responseTime: '1.5 hrs',
    produce: 'Maize',
    quantity: '250 qtl',
    price: '₹2,150 / qtl',
    quality: 'Premium',
    verified: true
  }
];

export function BrowseProducePage() {
  const navigate = useNavigate();

  const handleMessageSeller = (sellerId: number, sellerName: string) => {
    // Navigate to a chat page with the seller
    navigate(`/chat/${sellerId}`, { state: { sellerName } });
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
                <h1 className="text-2xl font-bold text-AgriNiti-text">Browse Produce</h1>
                <p className="text-sm text-AgriNiti-text-muted">Connect with verified sellers across India</p>
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-lg font-bold text-AgriNiti-text">5,421</div>
              <div className="text-xs text-AgriNiti-text-muted">Available</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-AgriNiti-text">3,892</div>
              <div className="text-xs text-AgriNiti-text-muted">Verified Sellers</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-AgriNiti-text">4.7/5</div>
              <div className="text-xs text-AgriNiti-text-muted">Avg Quality</div>
            </div>
          </div>
        </div>

        {/* Sellers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sellers.map((seller) => (
            <Card key={seller.id} className="p-6 hover:shadow-soft-card transition-all">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-AgriNiti-text">{seller.name}</h3>
                    {seller.verified && (
                      <Badge tone="success" className="text-xs">Verified</Badge>
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
                  <span className="text-sm text-AgriNiti-text-muted">Produce</span>
                  <span className="text-sm font-medium text-AgriNiti-text">{seller.produce}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-AgriNiti-text-muted">Available Quantity</span>
                  <span className="text-sm font-medium text-AgriNiti-text">{seller.quantity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-AgriNiti-text-muted">Price</span>
                  <span className="text-sm font-semibold text-AgriNiti-accent-blue">{seller.price}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-AgriNiti-text-muted">Distance</span>
                  <span className="text-sm font-medium text-AgriNiti-text">{seller.distance}</span>
                </div>
              </div>

              {/* Seller Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-AgriNiti-bg/30 rounded-lg">
                <div className="text-center">
                  <div className="text-xs text-AgriNiti-text-muted">Sales</div>
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
                  onClick={() => navigate(`/seller/${seller.id}`)}
                >
                  View Details
                </Button>
                <Button
                  className="flex-1 bg-AgriNiti-accent-blue hover:bg-AgriNiti-accent-blue/90 text-white"
                  onClick={() => handleMessageSeller(seller.id, seller.name)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message them
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <Button variant="secondary" className="px-8">
            Load More Sellers
          </Button>
        </div>
      </div>
    </div>
  );
}

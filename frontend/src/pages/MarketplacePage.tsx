import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, TrendingDown, Package, ShoppingCart, Truck, Plus } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ListProducePage } from './ListProducePage';
import { BrowseProducePage } from './BrowseProducePage';
import { BusinessAssistancePage } from './TrackShipmentsPage';

interface MarketPrice {
  crop: string;
  price: string;
  change: string;
  direction: 'up' | 'down';
  location: string;
  lastUpdated: string;
}

const liveMarketPrices: MarketPrice[] = [
  { crop: 'Tur / Arhar', price: '₹7,200 / qtl', change: '+₹150', direction: 'up', location: 'Maharashtra', lastUpdated: '2 mins ago' },
  { crop: 'Maize', price: '₹2,150 / qtl', change: '-₹60', direction: 'down', location: 'Karnataka', lastUpdated: '5 mins ago' },
  { crop: 'Cotton', price: '₹7,450 / qtl', change: '+₹40', direction: 'up', location: 'Gujarat', lastUpdated: '3 mins ago' },
  { crop: 'Wheat', price: '₹2,800 / qtl', change: '+₹25', direction: 'up', location: 'Punjab', lastUpdated: '1 min ago' },
  { crop: 'Rice', price: '₹3,200 / qtl', change: '-₹30', direction: 'down', location: 'Andhra Pradesh', lastUpdated: '4 mins ago' },
  { crop: 'Soybean', price: '₹4,100 / qtl', change: '+₹80', direction: 'up', location: 'Madhya Pradesh', lastUpdated: '6 mins ago' }
];

export function MarketplacePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPrices, setFilteredPrices] = useState(liveMarketPrices);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = liveMarketPrices.filter(price => 
      price.crop.toLowerCase().includes(query.toLowerCase()) ||
      price.location.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredPrices(filtered);
  };

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold text-AgriNiti-text">Marketplace</h2>
          <p className="mt-2 text-base text-AgriNiti-text-muted max-w-3xl">
            Live market prices, sell your produce across India, and buy from farmers nationwide.
          </p>
        </div>
      </header>

      {/* Search and Live Market Prices Section */}
      <div className="space-y-6">
        {/* Search Bar */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-AgriNiti-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search for crops or locations..."
                className="w-full pl-10 pr-4 py-3 border border-AgriNiti-border/50 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-AgriNiti-primary/50"
              />
            </div>
            <Badge tone="info">Live Prices</Badge>
          </div>
        </Card>

        {/* Live Market Prices - 3 Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredPrices.slice(0, 3).map((price) => (
            <Card key={price.crop} className="p-4 border-l-4 border-l-AgriNiti-primary hover:shadow-soft-card transition-all">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-AgriNiti-text">{price.crop}</h3>
                  <p className="text-sm text-AgriNiti-text-muted">{price.location}</p>
                </div>
                <div className="flex items-center gap-1">
                  {price.direction === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-AgriNiti-success" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-AgriNiti-error" />
                  )}
                  <span className={`text-sm font-medium ${
                    price.direction === 'up' ? 'text-AgriNiti-success' : 'text-AgriNiti-error'
                  }`}>
                    {price.change}
                  </span>
                </div>
              </div>
              <div className="text-lg font-bold text-AgriNiti-accent-blue mb-1">
                {price.price}
              </div>
              <p className="text-xs text-AgriNiti-text-muted">
                Updated {price.lastUpdated}
              </p>
            </Card>
          ))}
        </div>

        {/* All Market Prices Table */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-AgriNiti-text mb-4">All Market Prices</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-AgriNiti-border/50">
                  <th className="text-left py-3 px-4 font-medium text-AgriNiti-text-muted">Crop</th>
                  <th className="text-left py-3 px-4 font-medium text-AgriNiti-text-muted">Location</th>
                  <th className="text-right py-3 px-4 font-medium text-AgriNiti-text-muted">Price</th>
                  <th className="text-right py-3 px-4 font-medium text-AgriNiti-text-muted">Change</th>
                  <th className="text-right py-3 px-4 font-medium text-AgriNiti-text-muted">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrices.map((price) => (
                  <tr key={price.crop} className="border-b border-AgriNiti-border/30 hover:bg-AgriNiti-bg/30">
                    <td className="py-3 px-4 font-medium text-AgriNiti-text">{price.crop}</td>
                    <td className="py-3 px-4 text-AgriNiti-text-muted">{price.location}</td>
                    <td className="py-3 px-4 text-right font-semibold text-AgriNiti-accent-blue">{price.price}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {price.direction === 'up' ? (
                          <TrendingUp className="h-3 w-3 text-AgriNiti-success" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-AgriNiti-error" />
                        )}
                        <span className={`font-medium ${
                          price.direction === 'up' ? 'text-AgriNiti-success' : 'text-AgriNiti-error'
                        }`}>
                          {price.change}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-AgriNiti-text-muted">{price.lastUpdated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* SELL and BUY Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SELL Across India Card */}
        <Card className="p-6 bg-AgriNiti-accent-gold/5 border-AgriNiti-accent-gold/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-AgriNiti-accent-gold/20 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-AgriNiti-accent-gold" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-AgriNiti-text">SELL Across India</h3>
                <p className="text-sm text-AgriNiti-text-muted">Reach buyers nationwide</p>
              </div>
            </div>
            <Badge tone="success">Active</Badge>
          </div>
          
          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-AgriNiti-text-muted">Total Listings</span>
              <span className="font-semibold text-AgriNiti-text">2,847</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-AgriNiti-text-muted">Active Buyers</span>
              <span className="font-semibold text-AgriNiti-text">1,523</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-AgriNiti-text-muted">Avg. Response Time</span>
              <span className="font-semibold text-AgriNiti-text">2.3 hrs</span>
            </div>
          </div>
          
          <Button 
            onClick={() => navigate('/list-produce')}
            className="w-full bg-AgriNiti-accent-gold hover:bg-AgriNiti-accent-gold/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            List Your Produce
          </Button>
        </Card>

        {/* BUY Across India Card */}
        <Card className="p-6 bg-AgriNiti-accent-blue/5 border-AgriNiti-accent-blue/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-AgriNiti-accent-blue/20 rounded-xl flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-AgriNiti-accent-blue" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-AgriNiti-text">BUY Across India</h3>
                <p className="text-sm text-AgriNiti-text-muted">Source from farmers directly</p>
              </div>
            </div>
            <Badge tone="info">Active</Badge>
          </div>
          
          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-AgriNiti-text-muted">Available Produce</span>
              <span className="font-semibold text-AgriNiti-text">5,421</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-AgriNiti-text-muted">Verified Sellers</span>
              <span className="font-semibold text-AgriNiti-text">3,892</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-AgriNiti-text-muted">Quality Score</span>
              <span className="font-semibold text-AgriNiti-text">4.7/5</span>
            </div>
          </div>
          
          <Button 
            onClick={() => navigate('/browse-produce')}
            className="w-full bg-AgriNiti-accent-blue hover:bg-AgriNiti-accent-blue/90 text-white"
          >
            <Search className="h-4 w-4 mr-2" />
            Browse Produce
          </Button>
        </Card>
      </div>

      {/* Manage Logistics Card */}
      <Card className="p-6 bg-AgriNiti-primary/5 border-AgriNiti-primary/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-AgriNiti-primary/20 rounded-xl flex items-center justify-center">
              <Truck className="h-7 w-7 text-AgriNiti-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-AgriNiti-text">Bussiness Assisstance</h3>
              <p className="text-sm text-AgriNiti-text-muted">Transport, storage, and delivery solutions</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-AgriNiti-text-muted">Active Shipments</p>
              <p className="text-2xl font-bold text-AgriNiti-text">147</p>
            </div>
            <Button 
            onClick={() => navigate('/business-assistance')}
            className="bg-AgriNiti-primary hover:bg-AgriNiti-primary/90 text-white"
          >
            Manage Logistics
          </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}


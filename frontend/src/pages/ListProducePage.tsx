import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ListProducePage() {
  const navigate = useNavigate();
  const [produce, setProduce] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('qtl');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = () => {
    // Here you would typically send the data to your backend
    console.log('Produce listing:', { produce, quantity, unit, expectedPrice, location });
    
    // Navigate to buyers page after successful listing
    navigate('/buyers');
  };

  return (
    <div className="min-h-screen bg-AgriNiti-bg/30 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="secondary"
            onClick={() => navigate('/marketplace')}
            className="inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-AgriNiti-accent-gold/20 rounded-xl flex items-center justify-center">
              <Package className="h-5 w-5 text-AgriNiti-accent-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-AgriNiti-text">Produce Listing</h1>
              <p className="text-sm text-AgriNiti-text-muted">List your produce for buyers across India</p>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <Card className="p-8">
          <div className="space-y-6">
            {/* Produce Input */}
            <div>
              <label className="block text-sm font-medium text-AgriNiti-text-muted mb-2">
                Produce
              </label>
              <input
                type="text"
                value={produce}
                onChange={(e) => setProduce(e.target.value)}
                className="AgriNiti-input w-full"
                placeholder="e.g. Tur (pigeon pea)"
              />
            </div>

            {/* Quantity and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-AgriNiti-text-muted mb-2">
                  Quantity
                </label>
                <input
                  type="text"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="AgriNiti-input w-full"
                  placeholder="e.g. 50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-AgriNiti-text-muted mb-2">
                  Unit
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="AgriNiti-input w-full"
                >
                  <option value="qtl">Quintals</option>
                  <option value="tonnes">Tonnes</option>
                  <option value="kg">Kilograms</option>
                </select>
              </div>
            </div>

            {/* Expected Price */}
            <div>
              <label className="block text-sm font-medium text-AgriNiti-text-muted mb-2">
                Expected price
              </label>
              <input
                type="text"
                value={expectedPrice}
                onChange={(e) => setExpectedPrice(e.target.value)}
                className="AgriNiti-input w-full"
                placeholder="e.g. ₹7,000 / qtl"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-AgriNiti-text-muted mb-2">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="AgriNiti-input w-full"
                placeholder="Village · Mandal · District"
              />
            </div>

            {/* Info Note */}
            <div className="bg-AgriNiti-primary/5 border border-AgriNiti-primary/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 bg-AgriNiti-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="h-2 w-2 bg-AgriNiti-primary rounded-full"></div>
                </div>
                <p className="text-sm text-AgriNiti-text">
                  You'll next see ranked buyers based on trust score and distance.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                onClick={handleSubmit}
                disabled={!produce || !quantity || !expectedPrice || !location}
                className="w-full bg-AgriNiti-accent-gold hover:bg-AgriNiti-accent-gold/90 text-white py-3 text-base"
              >
                List Your Produce
              </Button>
            </div>
          </div>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-AgriNiti-accent-gold mb-1">2,847</div>
            <div className="text-sm text-AgriNiti-text-muted">Active Listings</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-AgriNiti-accent-blue mb-1">1,523</div>
            <div className="text-sm text-AgriNiti-text-muted">Active Buyers</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-AgriNiti-primary mb-1">2.3 hrs</div>
            <div className="text-sm text-AgriNiti-text-muted">Avg Response Time</div>
          </Card>
        </div>
      </div>
    </div>
  );
}

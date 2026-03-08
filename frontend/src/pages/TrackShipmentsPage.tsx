import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, Truck, MapPin, Package, Warehouse, DollarSign, Search, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../services/useTranslation';

interface Shipment {
  id: string;
  status: 'in-transit' | 'delivered' | 'pending' | 'delayed';
  origin: string;
  destination: string;
  estimatedDelivery: string;
  progress: number;
  driver: string;
  vehicle: string;
  cost: string;
}

interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacity: number;
  available: number;
  type: 'cold-storage' | 'regular' | 'temperature-controlled';
  price: string;
}

const shipments: Shipment[] = [
  {
    id: 'SH-2024-001',
    status: 'in-transit',
    origin: 'Nashik, Maharashtra',
    destination: 'Mumbai, Maharashtra',
    estimatedDelivery: '2 hours',
    progress: 75,
    driver: 'Ramesh Kumar',
    vehicle: 'Truck #MH-12-AB-1234',
    cost: '₹4,500'
  },
  {
    id: 'SH-2024-002',
    status: 'delivered',
    origin: 'Pune, Maharashtra',
    destination: 'Nagpur, Maharashtra',
    estimatedDelivery: 'Delivered',
    progress: 100,
    driver: 'Suresh Patel',
    vehicle: 'Truck #MH-20-CD-5678',
    cost: '₹6,200'
  },
  {
    id: 'SH-2024-003',
    status: 'pending',
    origin: 'Ahmednagar, Maharashtra',
    destination: 'Hyderabad, Telangana',
    estimatedDelivery: 'Tomorrow 10:00 AM',
    progress: 0,
    driver: 'Not assigned',
    vehicle: 'Not assigned',
    cost: '₹8,500'
  }
];

const warehouses: Warehouse[] = [
  {
    id: 'WH-001',
    name: 'AgriNiti Central Warehouse',
    location: 'Nashik, Maharashtra',
    capacity: 1000,
    available: 342,
    type: 'cold-storage',
    price: '₹150/ton/day'
  },
  {
    id: 'WH-002',
    name: 'Regional Storage Hub',
    location: 'Pune, Maharashtra',
    capacity: 750,
    available: 128,
    type: 'regular',
    price: '₹80/ton/day'
  },
  {
    id: 'WH-003',
    name: 'Temperature Controlled Facility',
    location: 'Mumbai, Maharashtra',
    capacity: 500,
    available: 89,
    type: 'temperature-controlled',
    price: '₹200/ton/day'
  }
];

export function BusinessAssistancePage() {
  const navigate = useNavigate();
  const { label } = useTranslation();
  const [startLocation, setStartLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState('');
  const [warehouseLocation, setWarehouseLocation] = useState('');
  const [activeTab, setActiveTab] = useState<'track' | 'book' | 'warehouse'>('track');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-transit': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'delayed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWarehouseTypeColor = (type: string) => {
    switch (type) {
      case 'cold-storage': return 'bg-AgriNiti-accent-blue/10 text-AgriNiti-accent-blue border-AgriNiti-accent-blue/30';
      case 'regular': return 'bg-AgriNiti-accent-gold/10 text-AgriNiti-accent-gold border-AgriNiti-accent-gold/30';
      case 'temperature-controlled': return 'bg-AgriNiti-primary/10 text-AgriNiti-primary border-AgriNiti-primary/30';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const handleBookTransport = () => {
    // Handle transport booking logic
    console.log('Booking transport:', { startLocation, destination, budget });
    alert('Transport booking request submitted! You will receive confirmation shortly.');
  };

  const handleSearchWarehouse = () => {
    // Handle warehouse search logic
    console.log('Searching warehouse:', { warehouseLocation });
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
              {label('backToMarketplaceBtn')}
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-AgriNiti-primary/20 rounded-xl flex items-center justify-center">
                <Truck className="h-5 w-5 text-AgriNiti-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-AgriNiti-text">{label('businessAssistanceTitle')}</h1>
                <p className="text-sm text-AgriNiti-text-muted">{label('businessAssistanceSubtitle')}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-lg font-bold text-AgriNiti-text">147</div>
              <div className="text-xs text-AgriNiti-text-muted">{label('activeShipmentsLabel')}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-AgriNiti-text">23</div>
              <div className="text-xs text-AgriNiti-text-muted">{label('availableTrucksLabel')}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-AgriNiti-text">89%</div>
              <div className="text-xs text-AgriNiti-text-muted">{label('onTimeDeliveryLabel')}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 p-1 bg-AgriNiti-bg/50 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('track')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'track'
              ? 'bg-white text-AgriNiti-primary shadow-sm'
              : 'text-AgriNiti-text-muted hover:text-AgriNiti-text'
              }`}
          >
            {label('trackShipmentsTab')}
          </button>
          <button
            onClick={() => setActiveTab('book')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'book'
              ? 'bg-white text-AgriNiti-primary shadow-sm'
              : 'text-AgriNiti-text-muted hover:text-AgriNiti-text'
              }`}
          >
            {label('bookTransportTab')}
          </button>
          <button
            onClick={() => setActiveTab('warehouse')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'warehouse'
              ? 'bg-white text-AgriNiti-primary shadow-sm'
              : 'text-AgriNiti-text-muted hover:text-AgriNiti-text'
              }`}
          >
            {label('findWarehouseTab')}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'track' && (
          <div className="space-y-6">
            {shipments.map((shipment) => (
              <Card key={shipment.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-AgriNiti-text">{shipment.id}</h3>
                      <Badge className={getStatusColor(shipment.status)}>
                        {shipment.status.replace('-', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-AgriNiti-text-muted">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {shipment.origin} → {shipment.destination}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {shipment.estimatedDelivery}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-AgriNiti-accent-blue">{shipment.cost}</div>
                    <div className="text-sm text-AgriNiti-text-muted">{label('transportCostLabel')}</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-AgriNiti-text-muted">{label('progressLabel')}</span>
                    <span className="text-AgriNiti-text">{shipment.progress}%</span>
                  </div>
                  <div className="w-full bg-AgriNiti-border/30 rounded-full h-2">
                    <div
                      className="bg-AgriNiti-primary h-2 rounded-full transition-all"
                      style={{ width: `${shipment.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Driver Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-AgriNiti-text-muted">{label('driverLabel')}:</span>
                    <span className="ml-2 text-AgriNiti-text">{shipment.driver}</span>
                  </div>
                  <div>
                    <span className="text-AgriNiti-text-muted">{label('vehicleLabel')}:</span>
                    <span className="ml-2 text-AgriNiti-text">{shipment.vehicle}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'book' && (
          <Card className="p-8">
            <h3 className="text-xl font-semibold text-AgriNiti-text mb-6">{label('bookTransportTab')}</h3>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-AgriNiti-text-muted mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    {label('startLocationLabel')}
                  </label>
                  <input
                    type="text"
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    className="AgriNiti-input w-full"
                    placeholder="e.g. Nashik, Maharashtra"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-AgriNiti-text-muted mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    {label('destinationLabel')}
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="AgriNiti-input w-full"
                    placeholder="e.g. Mumbai, Maharashtra"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-AgriNiti-text-muted mb-2">
                  <DollarSign className="inline h-4 w-4 mr-1" />
                  {label('transportBudgetLabel')}
                </label>
                <input
                  type="text"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="AgriNiti-input w-full"
                  placeholder="e.g. ₹5,000 - ₹8,000"
                />
              </div>

              <div className="bg-AgriNiti-primary/5 border border-AgriNiti-primary/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 bg-AgriNiti-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="h-2 w-2 bg-AgriNiti-primary rounded-full"></div>
                  </div>
                  <div className="text-sm text-AgriNiti-text">
                    <p className="font-medium mb-1">{label('transportOptionsTitle')}</p>
                    <ul className="space-y-1 text-AgriNiti-text-muted">
                      <li>• Standard trucks (10-20 tons capacity)</li>
                      <li>• Refrigerated vehicles for perishable goods</li>
                      <li>• Express delivery for urgent shipments</li>
                      <li>• Shared transport for cost optimization</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleBookTransport}
                disabled={!startLocation || !destination || !budget}
                className="w-full bg-AgriNiti-primary hover:bg-AgriNiti-primary/90 text-white py-3 text-base"
              >
                <Truck className="h-4 w-4 mr-2" />
                {label('bookTransportTab')}
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'warehouse' && (
          <div className="space-y-6">
            {/* Search Section */}
            <Card className="p-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-AgriNiti-text-muted" />
                  <input
                    type="text"
                    value={warehouseLocation}
                    onChange={(e) => setWarehouseLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-AgriNiti-border/50 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-AgriNiti-primary/50"
                    placeholder={label('searchWarehousePlaceholder')}
                  />
                </div>
                <Button onClick={handleSearchWarehouse} className="bg-AgriNiti-primary hover:bg-AgriNiti-primary/90 text-white">
                  Search
                </Button>
              </div>
            </Card>

            {/* Warehouse Listings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {warehouses.map((warehouse) => (
                <Card key={warehouse.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-AgriNiti-text">{warehouse.name}</h3>
                        <Badge className={getWarehouseTypeColor(warehouse.type)}>
                          {warehouse.type.replace('-', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-AgriNiti-text-muted">
                        <MapPin className="h-3 w-3" />
                        {warehouse.location}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-AgriNiti-accent-blue">{warehouse.price}</div>
                      <div className="text-sm text-AgriNiti-text-muted">per day</div>
                    </div>
                  </div>

                  {/* Capacity */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-AgriNiti-text-muted">Available Space</span>
                      <span className="text-AgriNiti-text">{warehouse.available} / {warehouse.capacity} tons</span>
                    </div>
                    <div className="w-full bg-AgriNiti-border/30 rounded-full h-2">
                      <div
                        className="bg-AgriNiti-accent-green h-2 rounded-full"
                        style={{ width: `${(warehouse.available / warehouse.capacity) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {warehouse.type === 'cold-storage' && (
                      <>
                        <Badge tone="info" className="text-xs">Temperature: 2-8°C</Badge>
                        <Badge tone="info" className="text-xs">Humidity Controlled</Badge>
                      </>
                    )}
                    {warehouse.type === 'temperature-controlled' && (
                      <>
                        <Badge tone="info" className="text-xs">Custom Temperature</Badge>
                        <Badge tone="info" className="text-xs">24/7 Monitoring</Badge>
                      </>
                    )}
                    <Badge tone="success" className="text-xs">24/7 Security</Badge>
                    <Badge tone="success" className="text-xs">Insurance Available</Badge>
                  </div>

                  {/* Action Button */}
                  <Button className="w-full bg-AgriNiti-accent-gold hover:bg-AgriNiti-accent-gold/90 text-white">
                    <Warehouse className="h-4 w-4 mr-2" />
                    {label('bookWarehouseBtn')}
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

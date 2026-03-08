import { useState, useEffect } from 'react';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useTranslation } from '../services/useTranslation';
import { useLanguageStore, AgriNitiLanguage } from '../store/languageStore';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../services/api';
import { Edit2, Save, X, MapPin, Sprout, Ruler, Package, Trash2, ShieldCheck, UserCheck } from 'lucide-react';

const languageLabels: Record<AgriNitiLanguage, string> = {
  en: 'English',
  hi: 'हिंदी',
  mr: 'मराठी',
  kn: 'ಕನ್ನಡ',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  ml: 'മലയാളം'
};

export function ProfilePage() {
  const { selectedLanguage, setLanguage } = useLanguageStore();
  const { user, updateUser } = useAuthStore();
  const { label } = useTranslation();

  const [profile, setProfile] = useState<any>(null);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [editedName, setEditedName] = useState(user?.full_name || '');
  const [location, setLocation] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [primaryCrops, setPrimaryCrops] = useState('');
  const [userRole, setUserRole] = useState('farmer');

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [profileRes, listingsRes] = await Promise.all([
          apiClient.getMarketplaceProfile(),
          apiClient.getMyAgrinitiListings() // Real inventory from SQLite/Agriniti
        ]);

        if (profileRes.data && Object.keys(profileRes.data).length > 0) {
          setProfile(profileRes.data);
          setLocation(profileRes.data.location || '');
          setFarmSize(profileRes.data.farm_size || '');
          setPrimaryCrops(profileRes.data.primary_crops || '');
          setUserRole(profileRes.data.role || 'farmer');
        }

        if (listingsRes.data) {
          setMyListings(listingsRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
    if (user?.full_name) setEditedName(user.full_name);
  }, [user]);

  const handleLanguageChange = async (code: AgriNitiLanguage) => {
    setLanguage(code);
    try {
      await updateUser({ preferred_language: code });
    } catch (err) {
      console.error('Failed to update language on server:', err);
    }
  };

  const handleSave = async () => {
    try {
      if (editedName !== user?.full_name) {
        await updateUser({ full_name: editedName });
      }

      const response = await apiClient.updateMarketplaceProfile({
        location,
        farm_size: farmSize,
        primary_crops: primaryCrops,
        business_name: editedName,
        role: userRole
      });

      if (response.data) {
        setProfile(response.data);
      }
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const handleDeactivateListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to deactivate this listing?')) return;
    try {
      await apiClient.updateAgrinitiListingStatus(listingId, 'expired');
      setMyListings(prev => prev.map(l => l.id === listingId ? { ...l, status: 'expired' } : l));
    } catch (err) {
      console.error('Deactivate listing error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-AgriNiti-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const initials = editedName
    ? editedName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : user?.email?.substring(0, 2).toUpperCase() || 'UN';

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold text-AgriNiti-text">{label('profileTitle')}</h2>
          <p className="mt-2 text-base text-AgriNiti-text-muted max-w-3xl">
            {label('profileSubtitle')}
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="secondary" className="flex items-center gap-2">
            <Edit2 className="h-4 w-4" />
            {label('editProfileBtn')}
          </Button>
        ) : (
          <div className="flex gap-4">
            <Button onClick={() => setIsEditing(false)} variant="secondary" className="flex items-center gap-2">
              <X className="h-4 w-4" />
              {label('cancelBtn')}
            </Button>
            <Button onClick={handleSave} className="flex items-center gap-2 bg-AgriNiti-primary text-white">
              <Save className="h-4 w-4" />
              {label('saveChangesBtn')}
            </Button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr] gap-8 items-start">
        {/* Left Column: Profile Card */}
        <div className="space-y-6">
          <Card className="p-8 space-y-8">
            <div className="flex flex-col items-center text-center">
              <div className="h-24 w-24 bg-AgriNiti-primary/10 rounded-3xl flex items-center justify-center mb-4 relative">
                <span className="text-3xl font-bold text-AgriNiti-primary">{initials}</span>
                {profile?.is_verified && (
                  <div className="absolute -bottom-2 -right-2 bg-AgriNiti-success text-white p-1.5 rounded-xl shadow-lg border-2 border-white">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-bold text-AgriNiti-text">{editedName || 'Unnamed User'}</h3>
              <div className="mt-1">
                <Badge tone={profile?.tier === 'premium' ? 'info' : 'neutral'} className="uppercase tracking-wider">
                  {profile?.tier || 'Standard'} {label('tier' as any) || 'Tier'}
                </Badge>
              </div>
            </div>

            <div className="space-y-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-AgriNiti-text-muted uppercase tracking-wider mb-2 block">{label('fullNameLabel')}</label>
                    <input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="AgriNiti-input w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-AgriNiti-text-muted uppercase tracking-wider mb-2 block">{label('roleLabel')}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['farmer', 'buyer', 'both'].map((role) => (
                        <button
                          key={role}
                          onClick={() => setUserRole(role)}
                          className={`px-3 py-2 rounded-xl border text-xs font-semibold capitalize transition-all ${userRole === role
                            ? 'bg-AgriNiti-primary text-white border-AgriNiti-primary shadow-sm'
                            : 'bg-white text-AgriNiti-text-muted border-AgriNiti-border hover:border-AgriNiti-primary/40'
                            }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-AgriNiti-text-muted uppercase tracking-wider mb-2 block">{label('locationLabel')}</label>
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Nizamabad, Telangana"
                      className="AgriNiti-input w-full"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-AgriNiti-text-muted uppercase tracking-wider mb-2 block">{label('farmSizeLabel')}</label>
                      <input
                        value={farmSize}
                        onChange={(e) => setFarmSize(e.target.value)}
                        placeholder="e.g. 5"
                        className="AgriNiti-input w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-AgriNiti-text-muted uppercase tracking-wider mb-2 block">{label('primaryCropsLabel')}</label>
                      <input
                        value={primaryCrops}
                        onChange={(e) => setPrimaryCrops(e.target.value)}
                        placeholder="e.g. Rice, Maize"
                        className="AgriNiti-input w-full"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-AgriNiti-surface rounded-2xl flex items-center gap-4 border border-AgriNiti-border/30">
                    <MapPin className="h-5 w-5 text-AgriNiti-primary/60" />
                    <div>
                      <p className="text-[10px] font-bold text-AgriNiti-text-muted uppercase tracking-wider">{label('location')}</p>
                      <p className="text-sm font-semibold">{location || label('notSet')}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-AgriNiti-surface rounded-2xl flex items-center gap-4 border border-AgriNiti-border/30">
                    <Sprout className="h-5 w-5 text-AgriNiti-primary/60" />
                    <div>
                      <p className="text-[10px] font-bold text-AgriNiti-text-muted uppercase tracking-wider">{label('primaryCropsLabel')}</p>
                      <p className="text-sm font-semibold">{primaryCrops || label('noneListed')}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-AgriNiti-surface rounded-2xl flex items-center gap-4 border border-AgriNiti-border/30">
                    <Ruler className="h-5 w-5 text-AgriNiti-primary/60" />
                    <div>
                      <p className="text-[10px] font-bold text-AgriNiti-text-muted uppercase tracking-wider">{label('farmCapacityLabel')}</p>
                      <p className="text-sm font-semibold">{farmSize ? `${farmSize} ${label('acres' as any) || 'Acres'}` : label('notSet')}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-AgriNiti-surface rounded-2xl flex items-center gap-4 border border-AgriNiti-border/30">
                    <UserCheck className="h-5 w-5 text-AgriNiti-primary/60" />
                    <div>
                      <p className="text-[10px] font-bold text-AgriNiti-text-muted uppercase tracking-wider">{label('experienceLevelLabel')}</p>
                      <p className="text-sm font-semibold capitalize">{userRole} · {profile?.total_sales || 0} {label('tradesCountLabel')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-AgriNiti-border/50">
              <p className="text-[10px] font-bold text-AgriNiti-text-muted uppercase tracking-widest mb-4">{label('preferredLanguageLabel')}</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(languageLabels) as AgriNitiLanguage[]).map((code) => (
                  <button
                    key={code}
                    onClick={() => handleLanguageChange(code)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${selectedLanguage === code
                      ? 'bg-AgriNiti-primary text-white border-AgriNiti-primary'
                      : 'bg-white text-AgriNiti-text-muted border-AgriNiti-border hover:border-AgriNiti-primary/40'
                      }`}
                  >
                    {languageLabels[code]}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Trust Score Card */}
          <Card className="p-6 bg-AgriNiti-primary/[0.02]">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 flex-shrink-0">
                <svg className="h-full w-full" viewBox="0 0 36 36">
                  <path className="text-AgriNiti-border stroke-current" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-AgriNiti-success stroke-current" strokeWidth="3" strokeDasharray={`${profile?.rating ? profile.rating * 20 : 92}, 100`} fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-lg text-AgriNiti-text">
                  {profile?.rating ? Math.round(profile.rating * 20) : 92}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-AgriNiti-text">{label('profileTrustScore')}</p>
                <p className="text-xs text-AgriNiti-text-muted mt-1">
                  {label('trustScoreDesc')}
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge tone="success" className="text-[10px]">{label('verifiedBadge')}</Badge>
                  <Badge tone="info" className="text-[10px]">{label('regularTraderBadge')}</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Inventory & Activity */}
        <div className="space-y-8">
          {/* Inventory Management Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-AgriNiti-text flex items-center gap-2">
                <Package className="h-5 w-5 text-AgriNiti-accent-blue" />
                {label('manageInventoryTitle')}
              </h3>
              <Badge tone="info">{myListings.length} {label('totalListings')}</Badge>
            </div>

            <div className="space-y-4">
              {myListings.length === 0 ? (
                <div className="text-center py-8 bg-AgriNiti-bg/20 rounded-2xl border border-dashed border-AgriNiti-border">
                  <Package className="h-10 w-10 text-AgriNiti-border mx-auto mb-2" />
                  <p className="text-sm text-AgriNiti-text-muted">{label('noListingsFound')}</p>
                  <Button variant="secondary" className="mt-4 scale-90" onClick={() => window.location.href = '/list-produce'}>{label('postNewItemBtn')}</Button>
                </div>
              ) : (
                myListings.map((listing) => (
                  <div key={listing.id} className="p-4 bg-white border border-AgriNiti-border/50 rounded-2xl flex items-center justify-between shadow-sm hover:border-AgriNiti-primary/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${listing.status === 'active' ? 'bg-AgriNiti-success/10' : 'bg-AgriNiti-error/10'}`}>
                        <Package className={`h-6 w-6 ${listing.status === 'active' ? 'text-AgriNiti-success' : 'text-AgriNiti-error'}`} />
                      </div>
                      <div>
                        <p className="font-bold text-AgriNiti-text">{listing.commodity}</p>
                        <p className="text-xs text-AgriNiti-text-muted">
                          {listing.quantity_qtl} qtl · ₹{listing.price_per_qtl}/qtl · {listing.district}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone={listing.status === 'active' ? 'success' : 'error'} className="capitalize">
                        {listing.status}
                      </Badge>
                      {listing.status === 'active' && (
                        <button
                          onClick={() => handleDeactivateListing(listing.id)}
                          className="p-2 text-AgriNiti-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Deactivate listing"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Activity Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-sm font-bold text-AgriNiti-text-muted uppercase tracking-widest mb-4">{label('advisorySnapshotTitle')}</h3>
              <div className="space-y-4">
                {[
                  { title: 'Disease Detection', result: 'Pest identified: Aphids', date: '2 days ago', icon: ShieldCheck },
                  { title: 'Soil Analysis', result: 'Nitrogen levels: Optimal', date: '1 week ago', icon: Sprout }
                ].map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-8 w-8 bg-AgriNiti-accent-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-4 w-4 text-AgriNiti-accent-blue" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-AgriNiti-text">{item.title}</p>
                      <p className="text-[11px] text-AgriNiti-text-muted">{item.result}</p>
                      <p className="text-[10px] text-AgriNiti-primary italic mt-1">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-bold text-AgriNiti-text-muted uppercase tracking-widest mb-4">{label('recentActivityTitle')}</h3>
              <div className="space-y-4 relative before:absolute before:left-2 before:top-1 before:bottom-1 before:w-px before:bg-AgriNiti-border/30">
                {[
                  'Updated primary crops to Rice and Maize',
                  'Checked market prices for Nizamabad',
                  'Contacted GreenLine Agro Exports'
                ].map((act, i) => (
                  <div key={i} className="pl-6 relative">
                    <div className="absolute left-0 top-1.5 h-4 w-4 bg-white border-2 border-AgriNiti-accent-gold rounded-full" />
                    <p className="text-[11px] text-AgriNiti-text leading-tight">{act}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Grid,
  Heart,
  Info,
  Loader2,
  MapPin,
  MessageCircle,
  Search,
  Share2,
  Star,
  Store,
  User,
} from 'lucide-react';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { apiService, type Item, type Shop } from '../services/api';
import Footer from '../components/Footer';
import SiteHeader from '../components/SiteHeader';

type TabKey = 'listings' | 'reviews' | 'details';

const normalizeItems = (items: any): Item[] => {
  if (Array.isArray(items)) return items;
  if (Array.isArray(items?.data)) return items.data;
  if (Array.isArray(items?.items)) return items.items;
  return [];
};

export default function ShopDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { settings } = useAppSettings();

  const [shop, setShop] = useState<Shop | null>(null);
  const [shopItems, setShopItems] = useState<Item[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isShopFav, setIsShopFav] = useState(false);
  const [savedItemIds, setSavedItemIds] = useState<Set<number>>(new Set());

  const [tab, setTab] = useState<TabKey>('listings');
  const [q, setQ] = useState('');

  const primaryColor = settings?.primary_color || '#0ea5e9';
  const isLoggedIn = !!localStorage.getItem('auth_token');

  useEffect(() => {
    if (!id) return;
    const shopId = parseInt(id, 10);
    if (!Number.isFinite(shopId)) return;
    loadAll(shopId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadAll = async (shopId: number) => {
    setError(null);
    setLoading(true);

    try {
      const shopData = await apiService.getShop(shopId);
      setShop(shopData);

      setItemsLoading(true);
      setReviewsLoading(true);

      const tasks: Promise<any>[] = [
        apiService.getShopItems(shopId),
        apiService.getShopReviewsPublic(shopId),
      ];

      if (isLoggedIn) {
        tasks.push(apiService.getFavoriteShops());
        tasks.push(apiService.getUserFavorites());
      }

      const results = await Promise.allSettled(tasks);

      const itemsRes = results[0];
      if (itemsRes.status === 'fulfilled') setShopItems(normalizeItems(itemsRes.value));
      else setShopItems([]);

      const revRes = results[1];
      if (revRes.status === 'fulfilled') setReviews(Array.isArray(revRes.value) ? revRes.value : []);
      else setReviews([]);

      if (isLoggedIn) {
        const favShopRes = results[2];
        if (favShopRes && favShopRes.status === 'fulfilled') {
          const favShops: any[] = favShopRes.value || [];
          setIsShopFav(favShops.some((s: any) => Number(s.id) === Number(shopId)));
        }

        const savedItemsRes = results[3];
        if (savedItemsRes && savedItemsRes.status === 'fulfilled') {
          const saved: any[] = savedItemsRes.value || [];
          const set = new Set<number>(
            saved.map((x: any) => Number(x.id)).filter((n) => Number.isFinite(n))
          );
          setSavedItemIds(set);
        }
      }
    } catch (e) {
      console.error(e);
      setShop(null);
      setError('Failed to load business details');
    } finally {
      setLoading(false);
      setItemsLoading(false);
      setReviewsLoading(false);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

  const formatPrice = (price: any) => {
    const n = Number(price);
    if (Number.isNaN(n)) return '0';
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
  };

  const handleShare = async () => {
    if (!shop) return;
    const title = (shop as any).shop_name || (shop as any).name || 'Business';
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Check out ${title} on Megzed!`,
          url: window.location.href,
        });
      } catch {}
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
    alert('Business link copied!');
  };

  const toggleShopFav = async () => {
    if (!shop) return;
    if (!isLoggedIn) {
      alert('Please login to add favourite.');
      return;
    }

    const next = !isShopFav;
    setIsShopFav(next);
    try {
      await apiService.toggleShopFavorite(shop.id);
    } catch (e) {
      console.error(e);
      setIsShopFav(!next);
      alert('Unable to update favourite. Try again.');
    }
  };

  const toggleItemSave = async (itemId: number) => {
    if (!isLoggedIn) {
      alert('Please login to save items.');
      return;
    }

    setSavedItemIds((prev) => {
      const s = new Set(prev);
      if (s.has(itemId)) s.delete(itemId);
      else s.add(itemId);
      return s;
    });

    try {
      await apiService.toggleSaveItem(itemId);
    } catch (e) {
      console.error(e);
      setSavedItemIds((prev) => {
        const s = new Set(prev);
        if (s.has(itemId)) s.delete(itemId);
        else s.add(itemId);
        return s;
      });
      alert('Unable to update saved item.');
    }
  };

  const filteredShopItems = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return shopItems;
    return shopItems.filter((it: any) => (it.name || '').toLowerCase().includes(query));
  }, [shopItems, q]);

  const location = useMemo(() => {
    if (!shop) return '';
    const parts = [(shop as any).city, (shop as any).state, (shop as any).country].filter(Boolean);
    return parts.join(', ');
  }, [shop]);

  const memberSince = useMemo(() => {
    if (!shop?.created_at) return null;
    return formatDate(shop.created_at);
  }, [shop?.created_at]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
        <Footer settings={settings ?? undefined} primaryColor={primaryColor} />
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 px-4">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 text-center space-y-4">
            <p className="text-slate-700">{error || 'Business not found'}</p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg font-semibold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Go Home
            </button>
          </div>
        </div>
        <Footer settings={settings ?? undefined} primaryColor={primaryColor} />
      </div>
    );
  }

  const coverImage = (shop as any)?.photo?.url || null;
  const profileImage = (shop as any)?.photo?.url || null;
  const shopName = (shop as any).shop_name || (shop as any).name || 'Business';
  const shopRating =
    (shop as any)?.avg_rating && !Number.isNaN(Number((shop as any).avg_rating))
      ? parseFloat((shop as any).avg_rating).toFixed(1)
      : 'New';
  const itemsCount = (shop as any).items_count ?? shopItems.length;
  const reviewsCount = (shop as any).reviews_count ?? reviews.length ?? 0;
  const shopType = (shop as any).shop_type || 'Business';
  const isVerified = (shop as any).is_verified === true || (shop as any).is_verified === 1;

  const stats = [
    { label: 'Listings', value: itemsCount },
    { label: 'Reviews', value: reviewsCount },
    { label: 'Type', value: shopType },
    { label: 'Rating', value: shopRating },
  ];

  const tabs: { key: TabKey; label: string; icon: JSX.Element }[] = [
    { key: 'listings', label: 'Listings', icon: <Grid className="w-4 h-4" /> },
    { key: 'reviews', label: 'Reviews', icon: <Star className="w-4 h-4" /> },
    { key: 'details', label: 'Details', icon: <Info className="w-4 h-4" /> },
  ];

  const renderMap = () => {
    const rawLat = (shop as any).lat ?? (shop as any).latitude;
    const rawLng = (shop as any).lng ?? (shop as any).long ?? (shop as any).longitude;

    if (rawLat == null || rawLng == null) {
      return (
        <div className="h-40 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Map not available
          </span>
        </div>
      );
    }

    const lat = Number(rawLat);
    const lng = Number(rawLng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return (
        <div className="h-40 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Invalid location
          </span>
        </div>
      );
    }

    const delta = 0.005;
    const left = lng - delta;
    const right = lng + delta;
    const top = lat + delta;
    const bottom = lat - delta;

    const embedUrl =
      `https://www.openstreetmap.org/export/embed.html?` +
      `bbox=${left}%2C${bottom}%2C${right}%2C${top}` +
      `&layer=mapnik&marker=${lat}%2C${lng}`;

    const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

    return (
      <div className="space-y-3">
        <div className="h-52 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
          <iframe title="Business Location" src={embedUrl} className="w-full h-full" loading="lazy" />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500 font-semibold">
            {lat.toFixed(6)}, {lng.toFixed(6)}
          </div>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
          >
            Directions
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/40 to-white flex flex-col">
      <SiteHeader />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-full bg-white shadow border border-slate-200 hover:shadow-md"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div>
              <p className="text-sm text-slate-500">Business profile</p>
              <h1 className="text-2xl font-bold text-slate-900">{shopName}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleShopFav}
              className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center"
              title={isShopFav ? 'Remove favourite' : 'Add favourite'}
            >
              <Heart className={`w-5 h-5 ${isShopFav ? 'fill-red-500 text-red-500' : 'text-slate-700'}`} />
            </button>
            <button className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center" onClick={handleShare}>
              <Share2 className="w-5 h-5 text-slate-700" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-md border border-slate-200 overflow-hidden">
          {coverImage && (
            <div className="h-36 sm:h-44 w-full relative">
              <img src={coverImage} alt={shopName} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
            </div>
          )}

          <div className="p-5 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow bg-slate-100 -mt-10 sm:mt-0 flex items-center justify-center">
                  {profileImage ? (
                    <img src={profileImage} alt={shopName} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-10 h-10 text-slate-400" />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">{shopName}</h2>
                    {isVerified && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100">
                        <CheckCircle2 className="w-4 h-4" />
                        Verified
                      </span>
                    )}
                  </div>
                  {location && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <MapPin className="w-4 h-4" />
                      <span>{location}</span>
                    </div>
                  )}
                  {memberSince && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {memberSince}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      {shopType}
                    </span>
                    {(shop as any).address && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                        {(shop as any).address}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <button
                  type="button"
                  className="px-5 py-2 rounded-xl text-white font-semibold shadow"
                  style={{ backgroundColor: primaryColor }}
                >
                  Contact
                </button>
                <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  <div>
                    <div className="text-base font-semibold text-slate-900">{shopRating}</div>
                    <div className="text-xs text-slate-500">{reviewsCount} reviews</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center"
                >
                  <div className="text-lg font-bold text-slate-900">{stat.value}</div>
                  <div className="text-xs text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <h3 className="text-base font-semibold text-slate-900 mb-2">About</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {(shop as any).description || 'No description provided by the business.'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-3 flex flex-wrap gap-2">
          {tabs.map((tabItem) => {
            const isActive = tab === tabItem.key;
            return (
              <button
                key={tabItem.key}
                type="button"
                onClick={() => setTab(tabItem.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                  isActive ? 'text-white shadow' : 'text-slate-600 bg-slate-50 border border-slate-200'
                }`}
                style={isActive ? { backgroundColor: primaryColor } : {}}
              >
                {tabItem.icon}
                {tabItem.label}
              </button>
            );
          })}
        </div>

        {tab === 'listings' && (
          <section className="mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Grid className="w-5 h-5 text-slate-700" />
                <h3 className="text-lg font-bold text-slate-900">Business Listings</h3>
              </div>
              <div className="relative group w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  type="text"
                  placeholder="Search items..."
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all shadow-sm"
                />
              </div>
            </div>

            {itemsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : filteredShopItems.length === 0 ? (
              <div className="text-slate-500 text-sm bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                No listings found.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredShopItems.map((item: any) => {
                  const isSaved = savedItemIds.has(item.id);
                  const photo = item?.feature_photo?.url || null;
                  const isRent = item?.listing_type === 'rent';

                  return (
                    <div
                      key={item.id}
                      className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
                    >
                      <div className="relative w-full h-40 bg-slate-100 border-b border-slate-200">
                        {photo ? (
                          <img src={photo} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                            No image
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleItemSave(item.id);
                          }}
                          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 border border-slate-200 shadow-sm flex items-center justify-center"
                          aria-label="Favourite listing"
                        >
                          <Heart
                            className={`w-4.5 h-4.5 ${
                              isSaved ? 'fill-red-500 text-red-500' : 'text-slate-700'
                            }`}
                          />
                        </button>
                      </div>

                      <Link to={`/item/${item.id}`} className="block p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-base font-semibold text-slate-900 line-clamp-1">
                            {item.name}
                          </h4>
                          <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-semibold whitespace-nowrap">
                            ₹ {formatPrice(String(item.price ?? 0))}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">
                            {[item.city, item.state].filter(Boolean).join(', ') || '—'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-50 border border-slate-200">
                            {isRent ? 'Rent' : 'Sale'}
                          </span>
                          {Array.isArray(item.dynamic_fields) && item.dynamic_fields[0]?.value && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-50 border border-slate-200">
                              {item.dynamic_fields[0].value}
                            </span>
                          )}
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {tab === 'reviews' && (
          <section className="mt-8 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-slate-900">Reviews</h3>
              </div>
              <span className="text-sm text-slate-500">{reviews.length} total</span>
            </div>

            {reviewsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
              </div>
            ) : reviews.length ? (
              <div className="space-y-4">
                {reviews.slice(0, 10).map((r: any, idx: number) => (
                  <div key={r.id ?? idx} className="border border-slate-100 rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-bold text-slate-900">{r.user?.name || 'User'}</div>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-semibold text-slate-800">{r.rating ?? '-'}</span>
                      </div>
                    </div>
                    {r.comment && (
                      <p className="text-slate-600 text-sm mt-2 leading-relaxed">{r.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">No reviews yet.</p>
            )}
          </section>
        )}

        {tab === 'details' && (
          <section className="mt-8 grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Business Details</h3>
                <p className="text-slate-600 leading-relaxed">
                  {(shop as any).description || 'No description provided by the business owner.'}
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-slate-500" />
                  Location
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  {(shop as any).address || 'Address not provided'}
                  <br />
                  {[ (shop as any).city, (shop as any).state ].filter(Boolean).join(', ')}
                </p>
                {renderMap()}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Listed by</p>
                  {isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-100 rounded-full text-[10px] font-bold text-blue-700 uppercase tracking-tight">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100">
                      {profileImage ? (
                        <img src={profileImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-900 text-base truncate leading-tight">
                      {(shop as any)?.user?.name || 'Business Owner'}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-slate-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <p className="text-xs font-medium truncate">
                        {(shop as any)?.user?.city || (shop as any)?.city || 'Location N/A'}
                        {((shop as any)?.user?.state || (shop as any)?.state)
                          ? `, ${(shop as any)?.user?.state || (shop as any)?.state}`
                          : ''}
                      </p>
                    </div>
                    {(shop as any)?.user?.created_at && (
                      <div className="flex items-center gap-1.5 mt-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <p className="text-xs">Since {formatDate((shop as any).user.created_at)}</p>
                      </div>
                    )}
                  </div>
                </div>

                <button className="w-full mt-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Contact Seller
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      <Footer settings={settings ?? undefined} primaryColor={primaryColor} />
    </div>
  );
}

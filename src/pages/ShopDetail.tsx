import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { apiService, type Shop, type Item } from '../services/api';

import {
  ArrowLeft,
  MapPin,
  Star,
  Package,
  Share2,
  Phone,
  MessageCircle,
  Clock,
  Loader2,
  Home,
  Store,
  Globe,
  Search,
  CheckCircle2,
  User,
  Heart,
  Grid, 
  Info   
} from 'lucide-react';

// ✅ Your 2 icons
import userVerifiedIcon from '../assets/icons/verified.png';
import shopVerifiedIcon from '../assets/icons/storeverified.png';

type TabKey = 'items' | 'reviews' | 'about';

function normalizeItems(input: any): Item[] {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.items)) return input.items; // ✅ support { items: [] }
  if (Array.isArray(input?.data)) return input.data;
  if (Array.isArray(input?.data?.data)) return input.data.data;
  return [];
}

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

  // Favorites state
  const [isShopFav, setIsShopFav] = useState(false);
  const [savedItemIds, setSavedItemIds] = useState<Set<number>>(new Set());

  // Search inside shop items
  const [q, setQ] = useState('');

  // Tabs
  const [tab, setTab] = useState<TabKey>('items');

  const primaryColor = settings?.primary_color || '#0ea5e9';
  const isLoggedIn = !!localStorage.getItem('auth_token');

  // ✅ Theme-colored PNG tint helper (uses mask)
  const TintedIcon = ({
    src,
    title,
    size = 18,
  }: {
    src: string;
    title?: string;
    size?: number;
  }) => (
    <span
      title={title}
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        backgroundColor: primaryColor,
        WebkitMask: `url(${src}) center / contain no-repeat`,
        mask: `url(${src}) center / contain no-repeat`,
      }}
    />
  );

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

      // ✅ ITEMS
      const itemsRes = results[0];
      if (itemsRes.status === 'fulfilled') setShopItems(normalizeItems(itemsRes.value));
      else setShopItems([]);

      // reviews
      const revRes = results[1];
      if (revRes.status === 'fulfilled') setReviews(Array.isArray(revRes.value) ? revRes.value : []);
      else setReviews([]);

      // favorites
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
      setError('Failed to load shop details');
    } finally {
      setLoading(false);
      setItemsLoading(false);
      setReviewsLoading(false);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const formatPrice = (price: any) => {
    const n = Number(price);
    if (Number.isNaN(n)) return '0';
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
  };

  const handleShare = async () => {
    if (!shop) return;
    const title = (shop as any).shop_name || (shop as any).name || 'Shop';
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
    alert('Shop link copied!');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: primaryColor }} />
        <p className="text-slate-500 font-medium tracking-wide">Loading shop profile...</p>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-10 rounded-3xl shadow-xl max-w-sm w-full border border-slate-100">
          <Store className="w-20 h-20 text-slate-200 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Shop Unavailable</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            The shop you are looking for does not exist or has been removed from our platform.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full px-6 py-3 bg-slate-900 text-white rounded-2xl font-medium hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const coverImage = (shop as any)?.photo?.url || null;
  const profileImage = (shop as any)?.user?.profile_photo || null;
  const shopName = (shop as any).shop_name || (shop as any).name || 'Shop';
  const shopRating = (shop as any)?.avg_rating ? parseFloat((shop as any).avg_rating).toFixed(1) : 'New';
  const itemsCount = (shop as any).items_count ?? shopItems.length;
  const reviewsCount = (shop as any).reviews_count ?? reviews.length ?? 0;

  const ownerMobile = (shop as any)?.user?.mobile || '';
  const hasPhone = String(ownerMobile || '').trim().length > 0;

  // ✅ VERIFIED FLAGS (correct keys)
  const isShopVerified = (shop as any)?.is_verified === true;
  const isUserVerified = (shop as any)?.user?.is_verified === true;

  const verifiedIconToUse = isUserVerified ? userVerifiedIcon : shopVerifiedIcon;
  const verifiedTitle = isUserVerified ? 'Verified User' : 'Verified Shop';


const TabButton = ({ k, label, icon: Icon, count, currentTab, setTab }: any) => {
  const isActive = currentTab === k;
  return (
    <button
      onClick={() => setTab(k)}
      className={`
        relative px-6 py-3 rounded-full font-bold text-sm sm:text-base transition-all duration-200 flex items-center gap-2.5
        ${isActive 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-105' /* <--- CHANGED TO BLUE */
          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
        }
      `}
    >
      {Icon && <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-blue-100' : 'text-slate-400'}`} />}
      
      <span>{label}</span>

      {count !== undefined && (
        <span className={`
          ml-1 px-2 py-0.5 rounded-md text-xs
          ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}
        `}>
          {count}
        </span>
      )}
    </button>
  );
};


  

  const ListSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex gap-4">
            <div className="w-44 h-32 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-2/3 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-1/3 bg-slate-100 rounded animate-pulse" />
              <div className="h-6 w-1/2 bg-slate-100 rounded animate-pulse" />
              <div className="h-8 w-full bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors group"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:text-slate-900" />
              </button>

              <div className="hidden sm:flex items-center gap-2 text-sm">
                <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
                  <Home className="w-4 h-4" />
                  <span className="font-medium">Home</span>
                </Link>
                <span className="text-slate-300">/</span>
                <span className="font-semibold text-slate-900 truncate max-w-[240px]">{shopName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleShopFav}
                className="p-2.5 hover:bg-slate-100 rounded-full transition-all active:scale-95 text-slate-600"
                title={isShopFav ? 'Remove favourite' : 'Add favourite'}
              >
                <Heart className={`w-5 h-5 ${isShopFav ? 'fill-red-500 text-red-500' : ''}`} />
              </button>

              <button
                onClick={handleShare}
                className="p-2.5 hover:bg-slate-100 rounded-full transition-all active:scale-95 text-slate-600"
                title="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Banner */}
        <div className="relative bg-white">
          <div className="h-56 sm:h-72 lg:h-80 w-full relative overflow-hidden">
            {coverImage ? (
              <>
                <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                <Store className="w-24 h-24 text-white/10" />
              </div>
            )}
          </div>

    {/* Floating profile card */}
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-16 pb-6">
  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-6">
    <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
      <div className="flex items-center gap-4">
        
        {/* PROFILE IMAGE BOX */}
        {/* Removed Shop Badge from here, kept User Badge if needed */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 border border-slate-100 shrink-0">
          
          <div className="w-full h-full rounded-2xl overflow-hidden">
            {profileImage ? (
              <img
                src={profileImage}
                alt={shopName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <Store className="w-10 h-10" />
              </div>
            )}
          </div>

          {/* USER VERIFIED BADGE (Kept at Top-Right of image) */}
          {isUserVerified && (
            <div
              className="absolute -top-2 -right-2 z-20 bg-white p-1.4 rounded-full shadow-md border border-slate-200"
              title="Verified User"
            >
              <TintedIcon src={userVerifiedIcon} size={20} />
            </div>
          )}
          
        </div>

        {/* SHOP NAME + LOCATION + VERIFIED ICON */}
        <div>
          {/* Added 'flex items-center gap-2' to align text and icon */}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            {shopName}
            
            {/* 🏪 SHOP VERIFIED ICON - Moved here */}
            {isShopVerified && (
              <div title="Verified Shop" className="mt-1"> 
                {/* Slightly increased size to match header text weight */}
                <TintedIcon src={shopVerifiedIcon} size={24} />
              </div>
            )}
          </h1>

          <p className="text-sm text-slate-600 mt-1 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {(shop as any).city || (shop as any).address || 'Online Store'}
          </p>
        </div>
      </div>

      <div className="flex-1" />

      {/* STATS (Unchanged) */}
      <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2 text-center">
          <div className="flex items-center justify-center gap-1 text-amber-500">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-extrabold text-slate-900">
              {shopRating}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
            Rating
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2 text-center">
          <div className="font-extrabold text-slate-900">
            {itemsCount}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
            Items
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2 text-center">
          <div className="font-extrabold text-slate-900">
            {reviewsCount}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
            Reviews
          </div>
        </div>
      </div>
    </div>

    {/* BADGES ROW */}
    <div className="mt-5 flex flex-wrap gap-2">
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
        <Globe className="w-4 h-4" />
        {(shop as any).shop_type || 'Retail'}
      </span>

      {(shop as any).created_at && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
          <Clock className="w-4 h-4" />
          Joined {formatDate((shop as any).created_at)}
        </span>
      )}
    </div>
  </div>
</div>
</div>
       {/* Main grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-12 gap-8">
            
            {/* Left Column */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* ✅ NEW TABS SECTION */}
              <div className="bg-slate-50/50 p-2 rounded-3xl border border-slate-100 inline-flex flex-wrap gap-2">
                <TabButton 
                  k="items" 
                  label="Items" 
                  icon={Grid} 
                  count={filteredShopItems.length} 
                  currentTab={tab} // Pass the current tab state
                  setTab={setTab}  // Pass the function to change tab
                />
                <TabButton 
                  k="reviews" 
                  label="Reviews" 
                  icon={Star} 
                  count={reviewsCount}
                  currentTab={tab}
                  setTab={setTab}
                />
                <TabButton 
                  k="about" 
                  label="About" 
                  icon={Info} 
                  currentTab={tab}
                  setTab={setTab}
                />
              </div>

              {/* ✅ ITEMS TAB (LIST VIEW) */}
              {tab === 'items' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    {/* Title */}
                    <div>
                      <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        Shop Items
                      </h2>
                      <p className="text-slate-500 text-sm mt-1">
                        Browse our latest collection
                      </p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative group w-full sm:w-80">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        type="text"
                        placeholder="Search items..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  {itemsLoading ? (
                    <ListSkeleton />
                  ) : filteredShopItems.length > 0 ? (
                    <div className="space-y-4">
                      {filteredShopItems.map((item: any) => {
                        const isSaved = savedItemIds.has(item.id);
                        const photo = item?.feature_photo?.url || null;
                        const isPromoted = item?.is_promoted === true;
                        const isRent = item?.listing_type === 'rent';

                        const dynamicFields = Array.isArray(item?.dynamic_fields)
                          ? item.dynamic_fields
                              .filter((f: any) => f && typeof f?.image === 'string' && f.image.length > 0)
                              .slice(0, 3)
                          : [];

                        return (
                          <div
                            key={item.id}
                            className="bg-white rounded-2xl border border-slate-200 hover:shadow-md transition-all overflow-hidden"
                          >
                            {/* ✅ Correct route */}
                            <Link to={`/item/${item.id}`} className="flex gap-4 p-4">
                              {/* IMAGE */}
                              <div className="relative w-36 h-28 sm:w-44 sm:h-32 flex-shrink-0 rounded-2xl overflow-hidden border border-slate-200 bg-white">
                                {photo ? (
                                  <img src={photo} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                                    No image
                                  </div>
                                )}

                                {/* PROMOTED */}
                                {isPromoted && (
                                  <span className="absolute top-2 left-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500 text-white text-[11px] font-semibold shadow">
                                    Promoted
                                  </span>
                                )}

                                {/* ✅ VERIFIED ICON (theme colored) */}
                                {(isShopVerified || isUserVerified) && (
                                  <div
                                    className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center"
                                    title={verifiedTitle}
                                  >
                                    <TintedIcon src={verifiedIconToUse} size={18} />
                                  </div>
                                )}
                              </div>

                              {/* CONTENT */}
                              <div className="flex-1 min-w-0">
                                {/* TITLE + HEART */}
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <h3 className="text-slate-900 font-semibold text-base sm:text-lg line-clamp-1">
                                      {item.name}
                                    </h3>

                                    {/* LOCATION */}
                                    <div className="mt-1 flex items-center gap-2 text-slate-500 text-sm min-w-0">
                                      <MapPin className="w-4 h-4 flex-shrink-0" />
                                      <span className="truncate">{item.city || item.address || '—'}</span>
                                    </div>
                                  </div>

                                  {/* SAVE */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      toggleItemSave(item.id);
                                    }}
                                    className="w-10 h-10 rounded-full bg-white border border-slate-200 hover:bg-slate-50 shadow-sm flex items-center justify-center flex-shrink-0"
                                    aria-label="Favourite"
                                    title={isSaved ? 'Unsave' : 'Save'}
                                  >
                                    <Heart
                                      className={`w-5 h-5 ${
                                        isSaved ? 'fill-red-500 text-red-500' : 'text-slate-700'
                                      }`}
                                    />
                                  </button>
                                </div>

                                {/* PRICE + TYPE */}
                                <div className="mt-3 flex items-center justify-between gap-3">
                                  <div className="text-green-600 font-bold text-xl">
                                    ₹ {formatPrice(String(item.price ?? 0))}
                                    {isRent && (
                                      <span className="text-sm font-semibold text-slate-400">/mo</span>
                                    )}
                                  </div>

                                  {isRent ? (
                                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold whitespace-nowrap">
                                      Rent • {item.rent_duration || '—'}
                                    </span>
                                  ) : (
                                    <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-semibold whitespace-nowrap">
                                      Sale
                                    </span>
                                  )}
                                </div>

                                {/* ✅ DYNAMIC FIELDS */}
                                {dynamicFields.length > 0 && (
                                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                                    {dynamicFields.map((field: any, idx: number) => {
                                      const v = field.value ?? '';
                                      const valueText = String(v).trim() !== '' ? String(v) : '—';
                                      const labelText = field.label ?? 'Field';

                                      return (
                                        <div
                                          key={`${labelText}-${idx}`}
                                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200"
                                        >
                                          <img
                                            src={field.image}
                                            alt=""
                                            className="w-4 h-4 object-contain"
                                            onError={(e) => {
                                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                                            }}
                                          />
                                          <span className="text-xs font-medium text-slate-700">
                                            {labelText}: {valueText}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* CTA */}
                                <div className="mt-4 flex items-center justify-between">
                                  <span className="text-xs text-slate-400">Tap to view details</span>
                                  <span className="text-xs font-semibold" style={{ color: primaryColor }}>
                                    View →
                                  </span>
                                </div>
                              </div>
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-900 mb-1">No items found</h3>
                      <p className="text-slate-500">Try a different search.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Reviews TAB */}
              {tab === 'reviews' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h2 className="text-xl font-extrabold text-slate-900">Reviews</h2>
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
                              <span className="text-sm font-extrabold text-slate-800">{r.rating ?? '-'}</span>
                            </div>
                          </div>
                          {r.comment && <p className="text-slate-600 text-sm mt-2 leading-relaxed">{r.comment}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500">No reviews yet.</p>
                  )}
                </div>
              )}

              {/* About TAB */}
              {tab === 'about' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
                  <h2 className="text-xl font-extrabold text-slate-900 mb-4">About the Shop</h2>
                  <div className="text-slate-600 leading-relaxed">
                    {(shop as any).description ? (
                      (shop as any).description
                    ) : (
                      <p className="italic text-slate-400">No description provided by the shop owner.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right */}
            <div className="lg:col-span-4 space-y-6">
              <div className="lg:sticky lg:top-24 space-y-6">
               

                {/* Location card */}
<div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
  <h3 className="font-extrabold text-slate-900 mb-4 flex items-center gap-2">
    <MapPin className="w-5 h-5 text-slate-400" />
    Location
  </h3>

  <p className="text-slate-600 text-sm leading-relaxed mb-4">
    {(shop as any).address || "Address not provided"}
    <br />
    {[(shop as any).city, (shop as any).state].filter(Boolean).join(", ")}
  </p>

  {(() => {
  const rawLat = (shop as any).lat ?? (shop as any).latitude;
  const rawLng =
    (shop as any).lng ?? (shop as any).long ?? (shop as any).longitude;

  if (rawLat == null || rawLng == null) {
    return (
      <div className="h-32 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
          Map not available
        </span>
      </div>
    );
  }

  const lat = Number(rawLat);
  const lng = Number(rawLng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return (
      <div className="h-32 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
          Invalid location
        </span>
      </div>
    );
  }

  // ✅ lat & lng are GUARANTEED numbers below
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
      <div className="h-56 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
        <iframe
          title="Shop Location"
          src={embedUrl}
          className="w-full h-full"
          loading="lazy"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500 font-semibold">
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-slate-800 transition"
        >
          Directions
        </a>
      </div>
    </div>
  );
})()}

</div>


              {/* Shop listed by card */}
<div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-300">
  
  {/* Header Label */}
  <div className="flex items-center justify-between mb-4">
    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
      Listed by
    </p>
    
    {/* Verified Badge (Top Right) */}
    {(isShopVerified || isUserVerified) && (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 border border-blue-100 rounded-full">
        <TintedIcon src={verifiedIconToUse} size={14} />
        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-tight">
          {verifiedTitle}
        </span>
      </div>
    )}
  </div>

  <div className="flex items-start gap-4">
    
    {/* Avatar with Ring */}
    <div className="relative shrink-0">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100">
        {profileImage ? (
          <img src={profileImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <User className="w-6 h-6 text-slate-400" />
        )}
      </div>
      {/* Online Status Dot (Optional decoration) */}
      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
    </div>

    {/* User Details */}
    <div className="min-w-0 flex-1">
      <h3 className="font-extrabold text-slate-900 text-lg truncate leading-tight">
        {(shop as any)?.user?.name || 'Shop Owner'}
      </h3>

      {/* Location */}
      <div className="flex items-center gap-1.5 mt-1 text-slate-500">
        <MapPin className="w-3.5 h-3.5" />
        <p className="text-xs font-medium truncate">
          {(shop as any)?.user?.city || (shop as any)?.city || 'Location N/A'}
          {((shop as any)?.user?.state || (shop as any)?.state) ? `, ${((shop as any)?.user?.state || (shop as any)?.state)}` : ''}
        </p>
      </div>

      {/* Member Since */}
      {(shop as any)?.user?.created_at && (
        <div className="flex items-center gap-1.5 mt-1 text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <p className="text-xs">
            Since {formatDate((shop as any).user.created_at)}
          </p>
        </div>
      )}
    </div>
  </div>

  {/* Contact Button */}
  <button className="w-full mt-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2">
    <MessageCircle className="w-4 h-4" /> {/* Make sure to import MessageCircle */}
    Contact Seller
  </button>

</div>

               

              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  Grid,
  Heart,
  Info,
  Loader2,
  MapPin,
  MoreHorizontal,
  MessageCircle,
  Send,
  Share2,
  Star,
  Zap,
  Key,
  BedDouble,
} from 'lucide-react';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { apiService, type Item, type Shop } from '../services/api';
import Footer from '../components/Footer';
import SiteHeader from '../components/SiteHeader';
import Modal from '../components/ui/Modal';
import type { ItemAction } from '../types/action';

type TabKey = 'listings' | 'reviews' | 'details';
type PickerMode = 'chat' | 'request';

const normalizeItems = (items: any): Item[] => {
  if (Array.isArray(items)) return items;
  if (Array.isArray(items?.data)) return items.data;
  if (Array.isArray(items?.items)) return items.items;
  return [];
};

const normalizeCode = (code?: string | null) => (code ?? '').toLowerCase().trim();

const NON_FORM_ACTIONS = new Set([
  'price',
  'navigate',
  'call',
  'whatsapp',
  'chat',
  'make_offer',
  'edit',
  'edit_item',
  'promote',
  'promote_item',
]);

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
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<PickerMode>('chat');
  const [pickerError, setPickerError] = useState<string | null>(null);

  const primaryColor = settings?.primary_color || '#0ea5e9';
  const isLoggedIn = !!localStorage.getItem('auth_token');

  useEffect(() => {
    if (!id) return;
    const shopId = parseInt(id, 10);
    if (!Number.isFinite(shopId)) return;
    loadAll(shopId);
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

  const location = useMemo(() => {
    if (!shop) return '';
    return (shop as any).city || '';
  }, [shop]);

  const memberSince = useMemo(() => {
    if (!shop?.created_at) return null;
    return formatDate(shop.created_at);
  }, [shop?.created_at]);

  const openPicker = (mode: PickerMode) => {
    if (!isLoggedIn) {
      alert('Please login to continue.');
      navigate('/login');
      return;
    }
    setPickerMode(mode);
    setPickerError(null);
    setIsPickerOpen(true);
  };

  const handlePickItem = async (item: Item) => {
    if (!item?.id) return;

    if (pickerMode === 'chat') {
      const sellerId =
        (item as any)?.shop?.user?.id ??
        (shop as any)?.user_id ??
        (shop as any)?.user?.id ??
        (item as any)?.user?.id ??
        null;
      setIsPickerOpen(false);
      navigate('/dashboard/chat', {
        state: {
          itemId: item.id,
          sellerId,
        },
      });
      return;
    }

    try {
      const response = await apiService.getItemActions(item.id);
      const data = (response as any)?.data ?? response;
      const actionList = data?.actions ?? data ?? [];
      const sorted = (Array.isArray(actionList) ? actionList : [])
        .map((action: ItemAction) => ({ ...action, code: normalizeCode(action.code) }))
        .sort((a: ItemAction, b: ItemAction) => (a.slot ?? 0) - (b.slot ?? 0));

      const action = sorted.find(
        (action: ItemAction) => !NON_FORM_ACTIONS.has(normalizeCode(action.code)) && !action.pending
      );

      if (action) {
        setIsPickerOpen(false);
        navigate('/action-form', { state: { item, action } });
        return;
      }

      setPickerError('No request forms available for this item yet.');
    } catch (err) {
      console.error(err);
      setPickerError('Unable to load request form. Please try again.');
    }
  };

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

  const profileImage = (shop as any)?.photo?.url || null;
  const shopName = (shop as any).shop_name || (shop as any).name || 'Business';
  const shopRating =
    (shop as any)?.avg_rating && !Number.isNaN(Number((shop as any).avg_rating))
      ? parseFloat((shop as any).avg_rating).toFixed(1)
      : '0.0';
  const itemsCount = (shop as any).items_count ?? shopItems.length;
  const reviewsCount = (shop as any).reviews_count ?? reviews.length ?? 0;
  const shopType = (shop as any).shop_type || 'Business';
  const isVerified = (shop as any).is_verified === true || (shop as any).is_verified === 1;

  const stats = [
    { 
      label: 'Listings', 
      value: itemsCount,
      icon: <FileText className="w-3 h-3" />
    },
    { 
      label: 'Reviews', 
      value: reviewsCount,
      icon: <Star className="w-3 h-3" />
    },
    { 
      label: 'Type', 
      value: shopType,
      icon: <Building2 className="w-3 h-3" />
    },
  ];

  const tabs: { key: TabKey; label: string; icon: JSX.Element }[] = [
    { key: 'listings', label: 'Listings', icon: <Grid className="w-4 h-4" /> },
    { key: 'reviews', label: 'Reviews', icon: <Star className="w-4 h-4" /> },
    { key: 'details', label: 'Details', icon: <Info className="w-4 h-4" /> },
  ];

  const renderMap = () => {
    const rawLat = (shop as any).lat ?? (shop as any).latitude;
    const rawLng = (shop as any).lng ?? (shop as any).long ?? (shop as any).longitude;

    if (rawLat == null || rawLng == null) return null;

    const lat = Number(rawLat);
    const lng = Number(rawLng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    const delta = 0.005;
    const left = lng - delta;
    const right = lng + delta;
    const top = lat + delta;
    const bottom = lat - delta;

    const embedUrl =
      `https://www.openstreetmap.org/export/embed.html?` +
      `bbox=${left}%2C${bottom}%2C${right}%2C${top}` +
      `&layer=mapnik&marker=${lat}%2C${lng}`;

    return (
      <div className="mt-4 h-40 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
         <iframe title="Business Location" src={embedUrl} className="w-full h-full" loading="lazy" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/40 to-white flex flex-col">
      <SiteHeader />

      <Modal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        title={pickerMode === 'chat' ? 'Select a listing to chat' : 'Select a listing to send request'}
      >
        <div className="space-y-4">
          {shopItems.length === 0 ? (
            <p className="text-sm text-slate-500">No listings available.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {shopItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handlePickItem(item)}
                  className="w-full flex items-center gap-3 rounded-2xl border border-slate-200 p-3 text-left hover:border-blue-300 hover:bg-slate-50 transition"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                    {item.feature_photo?.url ? (
                      <img src={item.feature_photo.url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-slate-400">No image</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500 truncate">{item.category?.name || 'Listing'}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {pickerError && <p className="text-sm text-rose-500">{pickerError}</p>}
        </div>
      </Modal>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* Navigation Header */}
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
            <button className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center" onClick={handleShare}>
              <Share2 className="w-5 h-5 text-slate-700" />
            </button>
            <button className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center">
              <MoreHorizontal className="w-5 h-5 text-slate-700" />
            </button>
          </div>
        </div>

        {/* Flex Layout: 45% Sidebar / 55% Content */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* UPDATED: Sidebar - 45% width, Sticky */}
          <aside className="w-full lg:w-[45%] space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white rounded-3xl shadow-md border border-slate-200 p-5">
              
              <div className="flex flex-row items-start gap-4">
                {/* Avatar */}
                <div className="w-20 h-20 shrink-0 rounded-2xl overflow-hidden border-2 border-white shadow bg-slate-100 flex items-center justify-center">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={shopName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-10 h-10 text-slate-400" />
                  )}
                </div>

                {/* Info Container */}
                <div className="flex-1 min-w-0 flex justify-between">
                   
                   {/* Left Side: Name, Verified, Location, Date */}
                   <div>
                      <h2 className="text-xl font-bold text-slate-900 truncate">{shopName}</h2>
                      
                      {isVerified && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <CheckCircle2 className="w-4 h-4 text-blue-500 fill-white" />
                          <span className="text-xs font-semibold text-blue-600">Verified business</span>
                        </div>
                      )}
                      
                      {location && (
                        <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{location}</span>
                        </div>
                      )}

                      {memberSince && (
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Joined {memberSince}</span>
                        </div>
                      )}
                   </div>

                   {/* Right Side: Actions (Follow + Rating) */}
                   <div className="flex flex-col items-end gap-2 ml-2">
                        <button
                            type="button"
                            onClick={toggleShopFav}
                            className={`px-6 py-1.5 rounded-lg text-white text-sm font-semibold shadow w-full flex items-center justify-center gap-2 ${
                                isShopFav ? 'bg-red-500' : ''
                            }`}
                            style={!isShopFav ? { backgroundColor: primaryColor } : {}}
                        >
                            {isShopFav ? (
                                <>
                                    <Heart className="w-3 h-3 fill-white" /> Saved
                                </>
                            ) : (
                                <>
                                    <Heart className="w-3 h-3" /> Save
                                </>
                            )}
                        </button>

                        <div className="flex flex-col items-center justify-center bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 shadow-sm w-full min-w-[90px]">
                            <div className="flex items-center gap-1">
                                <span className="text-2xl font-extrabold text-amber-500">
                                    {shopRating}
                                </span>
                                <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                            </div>
                            <span className="text-[10px] font-medium text-amber-700/80 mt-0.5 whitespace-nowrap">
                                {reviewsCount} reviews
                            </span>
                        </div>
                   </div>

                </div>
              </div>

              <hr className="my-5 border-slate-100" />

              <div className="flex flex-wrap items-center justify-between gap-2">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex flex-col items-center">
                    <span className="text-lg font-bold text-slate-900 leading-none">{stat.value}</span>
                    <div className="flex items-center gap-1 mt-1 text-slate-500">
                        {stat.icon}
                        <span className="text-[10px] uppercase tracking-wider font-medium">
                          {stat.label}
                        </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">About</h3>
                <p className="text-sm text-slate-600 leading-relaxed text-justify">
                  {(shop as any).description || 'No description provided by the business owner.'}
                </p>
              </div>

              {/* UPDATED: Chat & Request Buttons moved inside the Sidebar (Profile Half), at the bottom */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => openPicker('chat')}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-white font-semibold shadow-md active:scale-95 transition-transform"
                  style={{ backgroundColor: primaryColor }}
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat
                </button>
                <button
                  type="button"
                  onClick={() => openPicker('request')}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 bg-slate-900 text-white font-semibold shadow-md hover:bg-slate-800 active:scale-95 transition-all"
                >
                  <Send className="w-4 h-4" />
                  Request
                </button>
              </div>

            </div>
          </aside>

          {/* Main Content - 55% width */}
          <div className="w-full lg:w-[55%] space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 flex flex-wrap gap-2">
              {tabs.map((tabItem) => {
                const isActive = tab === tabItem.key;
                return (
                  <button
                    key={tabItem.key}
                    type="button"
                    onClick={() => setTab(tabItem.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                      isActive
                        ? 'text-white shadow'
                        : 'text-slate-600 bg-slate-50 border border-slate-200'
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
              <section>
                {shopItems.length === 0 ? (
                  <div className="text-slate-500 text-sm bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    No listings found.
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {shopItems.map((item: any) => (
                      <Link
                        key={item.id}
                        to={`/item/${item.id}`}
                        className="group flex flex-row bg-white rounded-2xl border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-lg transition-all overflow-hidden h-40 sm:h-44"
                      >
                        <div className="w-32 sm:w-44 h-full relative shrink-0">
                          {item.feature_photo?.url ? (
                            <img
                              src={item.feature_photo.url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs text-center p-2">
                              No image
                            </div>
                          )}
                          <div className="absolute top-2 left-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm">
                             <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                                <Zap className="w-3 h-3 text-white fill-white" />
                             </div>
                          </div>
                        </div>

                        <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                             <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                               <Building2 className="w-3 h-3" />
                               {item.category?.name || "Product"}
                             </span>
                             <button className="text-slate-300 hover:text-red-500 transition-colors">
                                <Heart className="w-5 h-5" />
                             </button>
                          </div>

                          <h4 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-1 mt-1">
                            {item.name}
                          </h4>

                          <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                             {Array.isArray(item.dynamic_fields) && item.dynamic_fields.length > 0 ? (
                               item.dynamic_fields.slice(0, 2).map((field:any, idx:number) => (
                                 <span key={idx} className="flex items-center gap-1">
                                    <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                                    {field.value}
                                 </span>
                               ))
                             ) : (
                               <span className="flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                                  Available
                               </span>
                             )}
                          </div>

                          <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="truncate">
                                {(shop as any).city || 'Location not specified'}
                            </span>
                          </div>

                          <div className="border-t border-slate-100 pt-2 mt-auto flex justify-between items-center">
                             <span className="text-lg font-bold text-blue-700">
                                ₹ {formatPrice(item.price)}
                             </span>
                             {(() => {
                               const listingDetail = item?.listing_type_detail || {};
                               const listingName =
                                 listingDetail?.name || (item?.listing_type === 'rent' ? 'Rent' : 'Sale');
                               const listingIcon = listingDetail?.icon || null;
                               return (
                                 <span className="px-3 py-1 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs font-bold flex items-center gap-1">
                                   {listingIcon ? (
                                     <img src={listingIcon} alt="" className="w-3 h-3 object-contain" />
                                   ) : (
                                     <Key className="w-3 h-3" />
                                   )}
                                   {listingName}
                                 </span>
                               );
                             })()}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )}

            {tab === 'reviews' && (
              <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
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
              <section className="space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-slate-500" />
                    Full Address
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">
                    {(shop as any).address || 'Address not provided'}
                    <br />
                    {[ (shop as any).city, (shop as any).state ].filter(Boolean).join(', ')}
                  </p>
                  {renderMap()}
                </div>
              </section>
            )}

          </div>
        </div>
      </div>

      <Footer settings={settings ?? undefined} primaryColor={primaryColor} />
    </div>
  );
}

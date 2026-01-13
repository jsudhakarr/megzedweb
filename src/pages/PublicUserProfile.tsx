import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  MapPin,
  MoreHorizontal,
  Share2,
  Star,
  Users,
  UserCheck,
  Loader2,
  Heart,
  Zap,
  Key,
  BedDouble,
} from 'lucide-react';
import { apiService, type Item, type PublicUserDetails } from '../services/api';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useI18n } from '../contexts/I18nContext';
import Footer from '../components/Footer';
import SiteHeader from '../components/SiteHeader';

type TabKey = 'all' | 'listings';

const normalizeItems = (items: any): Item[] => {
  if (Array.isArray(items)) return items;
  if (Array.isArray(items?.data)) return items.data;
  return [];
};

const formatCurrency = (price: any) => {
  const n = Number(price);
  if (Number.isNaN(n)) return '0';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
};

export default function PublicUserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { settings } = useAppSettings();
  const { t } = useI18n();

  const [user, setUser] = useState<PublicUserDetails | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [tab, setTab] = useState<TabKey>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const primaryColor = settings?.primary_color || '#0ea5e9';

  useEffect(() => {
    if (!id) return;
    const userId = Number(id);
    if (!Number.isFinite(userId)) return;
    loadData(userId);
  }, [id]);

  const loadData = async (userId: number) => {
    setLoading(true);
    setError(null);
    try {
      const [profile, userItems] = await Promise.all([
        apiService.getPublicUser(userId),
        apiService.getItemsByUser(userId).catch(() => []),
      ]);

      setUser(profile);
      setItems(normalizeItems(userItems));
    } catch (err) {
      console.error(err);
      setError('Failed to load user profile');
      setUser(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const verified = user?.is_verified === true || user?.is_verified === 1;
  
  const memberSince = useMemo(() => {
    if (!user?.created_at) return null;
    return new Date(user.created_at).toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric',
    });
  }, [user?.created_at]);

  const location = useMemo(() => {
    if (!user) return '';
    return user.city || '';
  }, [user]);

  const stats = [
    { 
      label: t('followers'), 
      value: user?.followers_count ?? 0, 
      icon: <Users className="w-3 h-3" /> 
    },
    { 
      label: t('following'), 
      value: user?.following_count ?? 0,
      icon: <UserCheck className="w-3 h-3" />
    },
    { 
      label: t('listings'), 
      value: user?.items_count ?? 0,
      icon: <FileText className="w-3 h-3" />
    },
    { 
      label: t('businesses'), 
      value: user?.shops_count ?? 0,
      icon: <Building2 className="w-3 h-3" />
    },
  ];

  const tabs: { key: TabKey; label: string; icon: JSX.Element }[] = [
    { key: 'all', label: t('all'), icon: <Users className="w-4 h-4" /> },
    { key: 'listings', label: t('listings'), icon: <FileText className="w-4 h-4" /> },
  ];

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

  if (error || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 px-4">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 text-center space-y-4">
            <p className="text-slate-700">{error || t('user_not_found')}</p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg font-semibold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {t('go_home')}
            </button>
          </div>
        </div>
        <Footer settings={settings ?? undefined} primaryColor={primaryColor} />
      </div>
    );
  }

  const showListings = tab === 'all' || tab === 'listings';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/40 to-white flex flex-col">
      <SiteHeader />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
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
              <p className="text-sm text-slate-500">{t('user_profile')}</p>
              <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center">
              <Share2 className="w-5 h-5 text-slate-700" />
            </button>
            <button className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center">
              <MoreHorizontal className="w-5 h-5 text-slate-700" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          <aside className="w-full lg:w-[45%] space-y-6">
            <div className="bg-white rounded-3xl shadow-md border border-slate-200 p-5">
              
              <div className="flex flex-row items-start gap-4">
                {/* Avatar */}
                <div className="w-20 h-20 shrink-0 rounded-2xl overflow-hidden border-2 border-white shadow bg-slate-100 flex items-center justify-center">
                  {user.profile_photo_url ? (
                    <img
                      src={user.profile_photo_url}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-semibold text-slate-600">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info Container */}
                <div className="flex-1 min-w-0 flex justify-between">
                   
                   {/* Left Side: Name, Verified, Location, Date */}
                   <div>
                      <h2 className="text-xl font-bold text-slate-900 truncate">{user.name}</h2>
                      
                      {/* UPDATED: Verified Status below name */}
                      {verified && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <CheckCircle2 className="w-4 h-4 text-blue-500 fill-white" />
                          <span className="text-xs font-semibold text-blue-600">{t('verified_user')}</span>
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
                          <span>Since {memberSince}</span>
                        </div>
                      )}
                   </div>

                   {/* Right Side: Actions (Follow + Rating) */}
                   {/* UPDATED: Follow button stacked above rating box */}
                   <div className="flex flex-col items-end gap-2 ml-2">
                        <button
                            type="button"
                            className="px-6 py-1.5 rounded-lg text-white text-sm font-semibold shadow w-full"
                            style={{ backgroundColor: primaryColor }}
                        >
                            {t('follow')}
                        </button>

                        <div className="flex flex-col items-center justify-center bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 shadow-sm w-full min-w-[90px]">
                            <div className="flex items-center gap-1">
                                <span className="text-2xl font-extrabold text-amber-500">
                                    {(user.avg_rating ?? 0).toFixed(1)}
                                </span>
                                <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                            </div>
                            <span className="text-[10px] font-medium text-amber-700/80 mt-0.5 whitespace-nowrap">
                                {user.reviews_count} {t('reviews')}
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
                <h3 className="text-sm font-semibold text-slate-900 mb-2">{t('about')}</h3>
                <p className="text-sm text-slate-600 leading-relaxed text-justify">
                  {user.about || t('no_bio_provided')}
                </p>
              </div>
            </div>
          </aside>

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

            {showListings && (
              <section>
                {items.length === 0 ? (
                  <div className="text-slate-500 text-sm bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    {t('no_listings_found')}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {items.map((item) => (
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
                              {t('no_image')}
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
                               {item.category?.name || "Property"}
                             </span>
                             <button className="text-slate-300 hover:text-red-500 transition-colors">
                                <Heart className="w-5 h-5" />
                             </button>
                          </div>

                          <h4 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-1 mt-1">
                            {item.name}
                          </h4>

                          <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                             {item.dynamic_fields && item.dynamic_fields.length > 0 ? (
                               item.dynamic_fields.slice(0, 2).map((field, idx) => (
                                 <span key={idx} className="flex items-center gap-1">
                                    <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                                    {field.value}
                                 </span>
                               ))
                             ) : (
                               <span className="flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                                  {t('available')}
                               </span>
                             )}
                          </div>

                          <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="truncate">
                                {item.city || 'Location not specified'}
                            </span>
                          </div>

                          <div className="border-t border-slate-100 pt-2 mt-auto flex justify-between items-center">
                             <span className="text-lg font-bold text-blue-700">
                                ₹ {formatCurrency(item.price)}
                             </span>
                             
                             <span className="px-3 py-1 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs font-bold flex items-center gap-1">
                                <Key className="w-3 h-3" />
                                {item.listing_type === 'rent' ? 'Rent' : 'Sale'}
                             </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>

      <Footer settings={settings ?? undefined} primaryColor={primaryColor} />
    </div>
  );
}

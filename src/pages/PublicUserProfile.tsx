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
  Loader2,
} from 'lucide-react';
import {
  apiService,
  type Item,
  type Shop,
  type PublicUserDetails,
} from '../services/api';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useI18n } from '../contexts/I18nContext';

type TabKey = 'all' | 'shops' | 'listings';

const normalizeItems = (items: any): Item[] => {
  if (Array.isArray(items)) return items;
  if (Array.isArray(items?.data)) return items.data;
  return [];
};

const normalizeShops = (shops: any): Shop[] => {
  if (Array.isArray(shops)) return shops;
  if (Array.isArray(shops?.data)) return shops.data;
  if (Array.isArray(shops?.shops)) return shops.shops;
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
  const [shops, setShops] = useState<Shop[]>([]);
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
      const [profile, userItems, userShops] = await Promise.all([
        apiService.getPublicUser(userId),
        apiService.getItemsByUser(userId).catch(() => []),
        apiService.getPublicUserShops(userId).catch(() => []),
      ]);

      setUser(profile);
      setItems(normalizeItems(userItems));
      setShops(normalizeShops(userShops));
    } catch (err) {
      console.error(err);
      setError('Failed to load user profile');
      setUser(null);
      setItems([]);
      setShops([]);
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
    const parts = [user.city, user.state, user.country].filter(Boolean);
    return parts.join(', ');
  }, [user]);

  const stats = [
    { label: t('followers'), value: user?.followers_count ?? 0 },
    { label: t('following'), value: user?.following_count ?? 0 },
    { label: t('listings'), value: user?.items_count ?? 0 },
    { label: t('businesses'), value: user?.shops_count ?? 0 },
  ];

  const tabs: { key: TabKey; label: string; icon: JSX.Element }[] = [
    { key: 'all', label: t('all'), icon: <Users className="w-4 h-4" /> },
    { key: 'shops', label: t('businesses'), icon: <Building2 className="w-4 h-4" /> },
    { key: 'listings', label: t('listings'), icon: <FileText className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
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
    );
  }

  const showShops = tab === 'all' || tab === 'shops';
  const showListings = tab === 'all' || tab === 'listings';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/40 to-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

        <div className="bg-white rounded-3xl shadow-md border border-slate-200 p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow bg-slate-100 flex items-center justify-center">
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
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                  {verified && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100">
                      <CheckCircle2 className="w-4 h-4" />
                      {t('verified_user')}
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
                    <span>
                      {t('member_since')} {memberSince}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <button
                type="button"
                className="px-5 py-2 rounded-xl text-white font-semibold shadow"
                style={{ backgroundColor: primaryColor }}
              >
                {t('follow')}
              </button>
              <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                <div>
                  <div className="text-base font-semibold text-slate-900">
                    {(user.avg_rating ?? 0).toFixed(1)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {user.reviews_count ?? 0} {t('reviews')}
                  </div>
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
            <h3 className="text-base font-semibold text-slate-900 mb-2">{t('about')}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {user.about || t('no_bio_provided')}
            </p>
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

        {showShops && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-slate-700" />
                <h3 className="text-lg font-bold text-slate-900">
                  {user.name}&apos;s {t('businesses')}
                </h3>
              </div>
              <Link
                to="/shops"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                {t('view_all')}
              </Link>
            </div>

            {shops.length === 0 ? (
              <div className="text-slate-500 text-sm bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                {t('no_businesses_found')}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {shops.map((shop) => (
                  <Link
                    key={shop.id}
                    to={`/shop/${shop.id}`}
                    className="group block bg-white rounded-2xl border border-slate-200 hover:border-blue-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                        {shop.photo?.url ? (
                          <img
                            src={shop.photo.url}
                            alt={shop.shop_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                            {t('no_image')}
                          </div>
                        )}
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-semibold text-slate-900 line-clamp-1">
                            {shop.shop_name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">
                            {[shop.city, shop.state].filter(Boolean).join(', ') || '—'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {shop.items_count ?? 0} {t('listings')}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {showListings && (
          <section className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-700" />
                <h3 className="text-lg font-bold text-slate-900">
                  {t('recent_listings')}
                </h3>
              </div>
              <Link
                to="/items"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                {t('view_all')}
              </Link>
            </div>

            {items.length === 0 ? (
              <div className="text-slate-500 text-sm bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                {t('no_listings_found')}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    to={`/item/${item.id}`}
                    className="group block bg-white rounded-2xl border border-slate-200 hover:border-blue-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                        {item.feature_photo?.url ? (
                          <img
                            src={item.feature_photo.url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                            {t('no_image')}
                          </div>
                        )}
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-base font-semibold text-slate-900 line-clamp-1">
                            {item.name}
                          </h4>
                          <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-semibold">
                            ₹ {formatCurrency(item.price)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">
                            {[item.city, item.state].filter(Boolean).join(', ') || '—'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-50 border border-slate-200">
                            {item.listing_type === 'rent' ? t('rent') : t('sale')}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-50 border border-slate-200">
                            {item.dynamic_fields?.[0]?.value || t('available')}
                          </span>
                        </div>
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
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, MapPin, Heart, TrendingUp } from 'lucide-react';
import { apiService, type Item } from '../services/api';

// ✅ Custom verified icon (no public folder needed)
import verifiedIcon from '../assets/icons/verified.png';

interface ItemsGridProps {
  primaryColor: string;
  items?: Item[];
  limit?: number;
  subcategoryId?: number | null;
  subcategoryName?: string | null; // (kept for compatibility, not used for title now)
  onClearFilter?: () => void;       // (kept for compatibility, not used now)
  showFilters?: boolean;
  layout?: 'grid' | 'list';
  lat?: number;
  lng?: number;
  distance?: number;
}

export default function ItemsGrid({
  primaryColor,
  items: itemsOverride,
  limit,
  subcategoryId,
  subcategoryName, // unused now
  onClearFilter,   // unused now
  showFilters = false,
  layout = 'grid',
  lat,
  lng,
  distance,
}: ItemsGridProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(!itemsOverride);
  const listRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (itemsOverride) {
      setItems(itemsOverride);
      setLoading(false);
      return;
    }
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsOverride, subcategoryId, lat, lng, distance]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await apiService.getItems(subcategoryId ?? undefined, lat, lng, distance);
      const defaultLimit = typeof limit === 'number' ? limit : 10;
      setItems((data || []).slice(0, defaultLimit));
    } catch (error) {
      console.error('Failed to load items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: any) => {
    const n = Number(price);
    if (Number.isNaN(n)) return '0';
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
  };

  // ✅ REAL API: promoted
  const isPromoted = (item: any) => item?.is_promoted === true;

  // ✅ REAL API: verified
  const isVerified = (item: any) =>
    item?.shop?.user?.verified === true ||
    item?.shop?.is_verified === true ||
    item?.is_verified === true;

  // ✅ Dynamic fields: icon + value only (no label, no dummy)
  const getDynamicFields = (item: any) => {
    if (!Array.isArray(item?.dynamic_fields)) return [];
    return item.dynamic_fields
      .filter(
        (f: any) =>
          f &&
          typeof f?.image === 'string' &&
          f.image.length > 0 &&
          f?.value !== null &&
          f?.value !== undefined &&
          String(f.value).trim() !== ''
      )
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const resolvedItems = typeof limit === 'number' ? items.slice(0, limit) : items;
  const isListLayout = layout === 'list';

  useEffect(() => {
    if (!isListLayout) return;
    const el = listRef.current;
    if (!el) return;

    const updateScrollState = () => {
      const maxScrollLeft = el.scrollWidth - el.clientWidth;
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft < maxScrollLeft - 1);
    };

    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [isListLayout, resolvedItems.length]);

  if (resolvedItems.length === 0) return null;

  const scrollByAmount = (direction: 'left' | 'right') => {
    const el = listRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const gridClass =
    layout === 'list'
      ? 'flex gap-4 overflow-x-auto pb-4 scrollbar-hide'
      : `grid sm:grid-cols-2 md:grid-cols-3 gap-4 ${
          showFilters ? 'lg:grid-cols-3 xl:grid-cols-4' : 'lg:grid-cols-4 xl:grid-cols-5'
        }`;

  return (
    <div className="space-y-4">
      <div className={isListLayout ? 'relative' : ''}>
        {isListLayout && canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollByAmount('left')}
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-900 shadow-md backdrop-blur"
            aria-label="Scroll left"
          >
            ‹
          </button>
        )}
        {isListLayout && canScrollRight && (
          <button
            type="button"
            onClick={() => scrollByAmount('right')}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-900 shadow-md backdrop-blur"
            aria-label="Scroll right"
          >
            ›
          </button>
        )}
        <div ref={isListLayout ? listRef : undefined} className={gridClass}>
        {resolvedItems.map((item: any) => {
          const fields = getDynamicFields(item);

          return (
            <Link
              key={item.id}
              to={`/item/${item.id}`}
              className={`group block bg-white rounded-2xl border border-slate-200 hover:shadow-md transition-all overflow-hidden ${
                layout === 'list' ? 'min-w-[240px] max-w-[280px] w-64 flex-shrink-0' : ''
              }`}
            >
              {/* IMAGE */}
              <div className="p-3">
                <div className="relative w-full h-44 bg-white rounded-2xl overflow-hidden border border-slate-200">
                  {item.feature_photo?.url ? (
                    <img
                      src={item.feature_photo.url}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                      No image
                    </div>
                  )}

                  {/* PROMOTED (top-left) */}
                  {isPromoted(item) && (
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-semibold shadow">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Promoted
                    </span>
                  )}

                  {/* HEART (top-right) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center"
                    aria-label="Favourite"
                  >
                    <Heart className="w-4.5 h-4.5 text-slate-700" />
                  </button>

                  {/* VERIFIED (bottom-right on image) */}
                  {isVerified(item) && (
                    <div
                      title="Verified"
                      className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center"
                    >
                      <img src={verifiedIcon} alt="Verified" className="w-5 h-5 object-contain" />
                    </div>
                  )}
                </div>
              </div>

              {/* BODY */}
              <div className="p-4 pt-0">
                {/* PRICE */}
                <div className="text-green-600 font-bold text-xl mb-2">
                  ₹ {formatPrice(item.price)}
                </div>

                {/* TITLE */}
                <div className="text-slate-900 font-semibold text-base line-clamp-1 mb-3">
                  {item.name}
                </div>

                {/* DYNAMIC FIELDS (icon + value only) */}
                {fields.length > 0 && (
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {fields.map((field: any) => (
                      <div
                        key={field.field_id}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200"
                      >
                        <img src={field.image} alt="" className="w-4 h-4 object-contain" />
                        <span className="text-xs font-medium text-slate-700">{field.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* LOCATION + TYPE */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-slate-500 min-w-0">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm truncate">{item.city}</span>
                  </div>

                  {item.listing_type === 'rent' ? (
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold whitespace-nowrap">
                      Rent • {item.rent_duration}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-semibold whitespace-nowrap">
                      Sale
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
        </div>
      </div>
    </div>
  );
}

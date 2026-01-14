import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BedDouble,
  Building2,
  CheckCircle2,
  Heart,
  Key,
  KeyRound,
  Loader2,
  MapPin,
  Star,
  TrendingUp,
  Eye,
  Zap,
} from 'lucide-react';
import { apiService, type Item } from '../services/api';

// ✅ Custom verified icon (no public folder needed)
import verifiedIcon from '../assets/icons/verified.png';

interface ItemsGridProps {
  primaryColor: string;
  items?: Item[];
  limit?: number;
  gridColumns?: 3 | 4;
  categoryId?: number | null;
  subcategoryId?: number | null;
  subcategoryName?: string | null;
  onClearFilter?: () => void;
  showFilters?: boolean;
  layout?: 'grid' | 'list';
  listVariant?: 'carousel' | 'stacked';
  cardStyle?: string;
  listingType?: string | null;
  minPrice?: string;
  maxPrice?: string;
  verified?: boolean | null;
  city?: string | null;
  state?: string | null;
  lat?: number;
  lng?: number;
  distance?: number;
}

export default function ItemsGrid(props: ItemsGridProps) {
  const {
    items: itemsOverride,
    limit,
    gridColumns = 4,
    categoryId,
    subcategoryId,
    showFilters: _showFilters = false,
    layout = 'grid',
    listVariant = 'carousel',
    cardStyle,
    listingType,
    minPrice,
    maxPrice,
    verified,
    city,
    state,
    lat,
    lng,
    distance,
  } = props;
  const [items, setItems] = useState<Item[]>(itemsOverride ?? []);
  const [loading, setLoading] = useState(!itemsOverride);
  const listRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
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
  }, [
    itemsOverride,
    categoryId,
    subcategoryId,
    listingType,
    minPrice,
    maxPrice,
    verified,
    city,
    state,
    lat,
    lng,
    distance,
    limit,
  ]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const defaultLimit = typeof limit === 'number' ? limit : 10;
      const data = await apiService.filterItems({
        categoryId: categoryId ?? undefined,
        subcategoryId: subcategoryId ?? undefined,
        listingType,
        minPrice,
        maxPrice,
        verified,
        city,
        state,
        lat,
        lng,
        distance,
        perPage: defaultLimit,
      });
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

  // ✅ Dynamic fields
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

  const normalizeCardStyle = (style?: string) => {
    if (!style) return 'default';
    const normalized = style.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (['style1', 'listcard1', 'list_card_1', '1'].includes(normalized)) return 'list_card_1';
    if (['style2', 'listcard2', 'list_card_2', '2'].includes(normalized)) return 'list_card_2';
    if (['gridcard1', 'grid_card_1'].includes(normalized)) return 'grid_card_1';
    if (['gridcard2', 'grid_card_2'].includes(normalized)) return 'grid_card_2';
    return 'default';
  };

  const resolvedCardStyle = normalizeCardStyle(cardStyle);

  const resolvedItems = typeof limit === 'number' ? items.slice(0, limit) : items;
  const isListLayout = layout === 'list';
  const isCarouselList = isListLayout && listVariant === 'carousel';
  const isStackedList = isListLayout && listVariant === 'stacked';

  useEffect(() => {
    if (!isCarouselList) return;
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
  }, [isCarouselList, resolvedItems.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (resolvedItems.length === 0) return null;

  const scrollByAmount = (direction: 'left' | 'right') => {
    const el = listRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isCarouselList) return;
    const el = listRef.current;
    if (!el) return;
    setIsDragging(true);
    dragStartX.current = event.pageX - el.offsetLeft;
    dragScrollLeft.current = el.scrollLeft;
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isCarouselList || !isDragging) return;
    const el = listRef.current;
    if (!el) return;
    event.preventDefault();
    const x = event.pageX - el.offsetLeft;
    const walk = (x - dragStartX.current) * 1.1;
    el.scrollLeft = dragScrollLeft.current - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const gridClass = isListLayout
    ? isCarouselList
      ? `flex gap-4 overflow-x-auto pb-4 scrollbar-hide ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`
      : 'flex flex-col gap-4'
    : gridColumns === 3
      ? 'grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4'
      : 'grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4';

  const formatDuration = (item: any) =>
    item?.duration_detail?.name || item?.rent_duration || '';

  const formatCount = (value: any) => {
    const parsed = Number(value ?? 0);
    if (Number.isNaN(parsed)) return 0;
    return parsed;
  };

  const getListingTag = (item: any) => {
    const detail = item?.listing_type_detail || {};
    const name =
      detail?.name ||
      (item?.listing_type === 'rent' ? 'Rent' : 'Sale');
    return {
      name,
      icon: detail?.icon || null,
      color: detail?.tag_color || null,
    };
  };

  return (
    <div className="space-y-4">
      <div className={isCarouselList ? 'relative' : ''}>
        {isCarouselList && canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollByAmount('left')}
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-900 shadow-md backdrop-blur"
            aria-label="Scroll left"
          >
            ‹
          </button>
        )}
        {isCarouselList && canScrollRight && (
          <button
            type="button"
            onClick={() => scrollByAmount('right')}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-900 shadow-md backdrop-blur"
            aria-label="Scroll right"
          >
            ›
          </button>
        )}
        <div
          ref={isListLayout ? listRef : undefined}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={gridClass}
        >
          {resolvedItems.map((item: any) => {
            const fields = getDynamicFields(item);
            const durationLabel = formatDuration(item);
            const listingTag = getListingTag(item);
            const tagStyles = listingTag.color
              ? {
                  backgroundColor: `${listingTag.color}1a`,
                  borderColor: `${listingTag.color}40`,
                  color: listingTag.color,
                }
              : undefined;
            const isFavourite = item?.is_favorite === true;

            if (isStackedList) {
              const previewFields = Array.isArray(item?.dynamic_fields)
                ? item.dynamic_fields.filter((field: any) => field?.value).slice(0, 2)
                : [];
              return (
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

                    {isPromoted(item) && (
                      <div className="absolute top-2 left-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                          <Zap className="w-3 h-3 text-white fill-white" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {item.category?.name || 'Product'}
                      </span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                        aria-label="Favourite"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            isFavourite ? 'fill-red-500 text-red-500' : ''
                          }`}
                        />
                      </button>
                    </div>

                    <h4 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-1 mt-1">
                      {item.name}
                    </h4>

                    <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                      {previewFields.length > 0 ? (
                        previewFields.map((field: any, index: number) => (
                          <span key={index} className="flex items-center gap-1">
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
                      <span className="truncate">{item.city || 'Location not specified'}</span>
                    </div>

                    <div className="border-t border-slate-100 pt-2 mt-auto flex justify-between items-center">
                      <span className="text-lg font-bold text-blue-700">
                        ₹ {formatPrice(item.price)}
                      </span>
                      <span
                        className="px-3 py-1 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs font-bold flex items-center gap-1"
                        style={tagStyles}
                      >
                        {listingTag.icon ? (
                          <img src={listingTag.icon} alt="" className="w-3 h-3 object-contain" />
                        ) : (
                          <Key className="w-3 h-3" />
                        )}
                        {listingTag.name}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            }

            // ----------------------------------------------------------------------
            // LIST CARD 1
            // ----------------------------------------------------------------------
            if (resolvedCardStyle === 'list_card_1') {
              const cardClass = `group flex bg-white rounded-2xl border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-lg transition-all overflow-hidden ${
                layout === 'list' ? 'min-w-[320px] max-w-[420px] w-96 flex-shrink-0' : ''
              } h-36 sm:h-40`;
              const imageClass = 'w-32 sm:w-40 h-full';
              const priceClass = 'text-sky-600 font-bold text-lg sm:text-xl';
              const titleClass = 'text-base sm:text-lg font-bold text-slate-900 line-clamp-1';
              return (
                <Link key={item.id} to={`/item/${item.id}`} className={cardClass}>
                  <div className={`${imageClass} relative shrink-0`}>
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

                    {isPromoted(item) && (
                      <span className="absolute top-2 left-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500 text-white text-[11px] font-semibold shadow">
                        <Star className="w-3.5 h-3.5" />
                        Promoted
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center"
                      aria-label="Favourite"
                    >
                      <Heart
                        className={`w-4 h-4 ${isFavourite ? 'fill-red-500 text-red-500' : 'text-slate-700'}`}
                      />
                    </button>

                    {isVerified(item) && (
                      <div
                        title="Verified"
                        className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center"
                      >
                        <img src={verifiedIcon} alt="Verified" className="w-4 h-4 object-contain" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {item.category?.name || 'Product'}
                      </span>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
                        style={tagStyles}
                      >
                        {listingTag.icon ? (
                          <img src={listingTag.icon} alt="" className="w-3.5 h-3.5 object-contain" />
                        ) : (
                          <KeyRound className="w-3.5 h-3.5" />
                        )}
                        {listingTag.name}
                      </span>
                    </div>

                    <h3 className={titleClass}>{item.name}</h3>

                    <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{formatCount(item.total_view)} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" />
                        <span>{formatCount(item.favorites_count)} favs</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{item.city || '—'}</span>
                    </div>

                    <div className="border-t border-slate-100 pt-2 mt-auto flex items-center justify-between">
                      <div className={`${priceClass} flex items-baseline`}>
                        ₹ {formatPrice(item.price)}
                        {durationLabel && item.listing_type === 'rent' && (
                          <span className="text-[11px] font-medium text-slate-400 ml-1.5 relative -top-0.5">
                            /{durationLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            }

            // ----------------------------------------------------------------------
            // LIST CARD 2
            // ----------------------------------------------------------------------
            if (resolvedCardStyle === 'list_card_2') {
              const cardClass = `group flex bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all overflow-hidden ${
                layout === 'list' ? 'min-w-[300px] max-w-[380px] w-80 flex-shrink-0' : ''
              } h-32 sm:h-36`;
              const imageClass = 'w-28 sm:w-36 h-full';
              const priceClass = 'text-sky-600 font-bold text-base sm:text-lg';
              const titleClass = 'text-sm sm:text-base font-semibold text-slate-900 line-clamp-2';
              return (
                <Link key={item.id} to={`/item/${item.id}`} className={cardClass}>
                  <div className={`${imageClass} relative shrink-0`}>
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

                    {isPromoted(item) && (
                      <span className="absolute top-2 left-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500 text-white text-[11px] font-semibold shadow">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Promoted
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center"
                      aria-label="Favourite"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${isFavourite ? 'fill-red-500 text-red-500' : 'text-slate-700'}`}
                      />
                    </button>

                    {isVerified(item) && (
                      <div
                        title="Verified"
                        className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center"
                      >
                        <img src={verifiedIcon} alt="Verified" className="w-3.5 h-3.5 object-contain" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-3 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.city || '—'}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap"
                        style={tagStyles}
                      >
                        {listingTag.icon ? (
                          <img src={listingTag.icon} alt="" className="w-3 h-3 object-contain" />
                        ) : (
                          <KeyRound className="w-3 h-3" />
                        )}
                        {listingTag.name}
                      </span>
                    </div>

                    <h3 className={`${titleClass} mt-1`}>{item.name}</h3>

                    {fields.length > 0 && (
                      <div className="flex items-center gap-2 mt-1 flex-wrap text-slate-600 text-xs">
                        {fields.map((field: any) => (
                          <div key={field.field_id} className="flex items-center gap-1">
                            <img src={field.image} alt="" className="w-4 h-4 object-contain" />
                            <span className="font-medium">{field.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="border-t border-slate-100 pt-2 mt-auto flex items-center justify-between">
                      <div className={`${priceClass} flex items-baseline`}>
                        ₹ {formatPrice(item.price)}
                        {durationLabel && item.listing_type === 'rent' && (
                          <span className="text-[10px] font-medium text-slate-400 ml-1.5 relative -top-0.5">
                            /{durationLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            }

            // ----------------------------------------------------------------------
            // GRID CARD 1
            // ----------------------------------------------------------------------
            if (resolvedCardStyle === 'grid_card_1') {
              const cardClass = `group block bg-white rounded-2xl border border-slate-200 hover:shadow-md transition-all overflow-hidden ${
                layout === 'list' ? 'min-w-[240px] max-w-[280px] w-64 flex-shrink-0' : ''
              }`;
              const imageHeight = 'h-52';
              const priceClass = 'text-sky-600 font-bold text-2xl';
              return (
                <Link key={item.id} to={`/item/${item.id}`} className={cardClass}>
                  <div className="p-1.5">
                    <div
                      className={`relative w-full ${imageHeight} bg-white rounded-xl overflow-hidden border border-slate-200`}
                    >
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

                      {isPromoted(item) && (
                        <span className="absolute top-2 left-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-semibold shadow">
                          <TrendingUp className="w-3.5 h-3.5" />
                          Promoted
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center"
                        aria-label="Favourite"
                      >
                        <Heart
                          className={`w-4.5 h-4.5 ${isFavourite ? 'fill-red-500 text-red-500' : 'text-slate-700'}`}
                        />
                      </button>

                      {isVerified(item) && (
                        <div
                          title="Verified"
                          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center"
                        >
                          <img src={verifiedIcon} alt="Verified" className="w-5 h-5 object-contain" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-4 pb-4 pt-1">
                    <div className={`${priceClass} leading-tight mb-1 flex items-baseline`}>
                      ₹ {formatPrice(item.price)}
                      {durationLabel && item.listing_type === 'rent' && (
                        <span className="text-xs font-medium text-slate-400 ml-1.5 relative -top-0.5">
                          /{durationLabel}
                        </span>
                      )}
                    </div>

                    <div className="text-slate-900 font-semibold text-base line-clamp-1 mb-3">
                      {item.name}
                    </div>

                    <div className="flex items-center gap-6 text-slate-500 text-sm mb-3">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span>{formatCount(item.total_view)} Views</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        <span>{formatCount(item.favorites_count)} Favorites</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-slate-500 min-w-0">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm truncate">{item.city || '—'}</span>
                      </div>

                      <span
                        className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap"
                        style={tagStyles}
                      >
                        {listingTag.icon ? (
                          <img src={listingTag.icon} alt="" className="w-4 h-4 object-contain" />
                        ) : (
                          <KeyRound className="w-4 h-4" />
                        )}
                        {listingTag.name}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            }

            // ----------------------------------------------------------------------
            // GRID CARD 2
            // ----------------------------------------------------------------------
            if (resolvedCardStyle === 'grid_card_2') {
              const cardClass = `group block bg-white rounded-2xl border border-slate-200 hover:shadow-md transition-all overflow-hidden ${
                layout === 'list' ? 'min-w-[240px] max-w-[280px] w-64 flex-shrink-0' : ''
              }`;
              const imageHeight = 'h-48';
              const priceClass = 'text-sky-600 font-bold text-xl';
              return (
                <Link key={item.id} to={`/item/${item.id}`} className={cardClass}>
                  <div className="p-1.5">
                    <div
                      className={`relative w-full ${imageHeight} bg-white rounded-xl overflow-hidden border border-slate-200`}
                    >
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

                      {isPromoted(item) && (
                        <span className="absolute top-2 left-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-semibold shadow">
                          <TrendingUp className="w-3.5 h-3.5" />
                          Promoted
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center"
                        aria-label="Favourite"
                      >
                        <Heart
                          className={`w-4.5 h-4.5 ${isFavourite ? 'fill-red-500 text-red-500' : 'text-slate-700'}`}
                        />
                      </button>

                      {isVerified(item) && (
                        <div
                          title="Verified"
                          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center"
                        >
                          <img src={verifiedIcon} alt="Verified" className="w-5 h-5 object-contain" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-4 pb-4 pt-1">
                    <div className={`${priceClass} leading-tight mb-1 flex items-baseline`}>
                      ₹ {formatPrice(item.price)}
                      {durationLabel && item.listing_type === 'rent' && (
                        <span className="text-xs font-medium text-slate-400 ml-1.5 relative -top-0.5">
                          /{durationLabel}
                        </span>
                      )}
                    </div>

                    <div className="text-slate-900 font-semibold text-base line-clamp-1 mb-3">
                      {item.name}
                    </div>

                    {fields.length > 0 && (
                      <div className="flex items-center gap-3 mb-3 flex-wrap text-slate-600 text-sm">
                        {fields.map((field: any) => (
                          <div key={field.field_id} className="flex items-center gap-2">
                            <img src={field.image} alt="" className="w-5 h-5 object-contain" />
                            <span className="font-medium">{field.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-slate-500 min-w-0">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm truncate">{item.city || '—'}</span>
                      </div>

                      <span
                        className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap"
                        style={tagStyles}
                      >
                        {listingTag.icon ? (
                          <img src={listingTag.icon} alt="" className="w-4 h-4 object-contain" />
                        ) : (
                          <KeyRound className="w-4 h-4" />
                        )}
                        {listingTag.name}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            }

            // ----------------------------------------------------------------------
            // DEFAULT CARD
            // ----------------------------------------------------------------------
            const cardClass = `group block bg-white rounded-2xl border border-slate-200 hover:shadow-md transition-all overflow-hidden ${
              layout === 'list' ? 'min-w-[240px] max-w-[280px] w-64 flex-shrink-0' : ''
            }`;
            const imageHeight = 'h-56';
            const priceClass = 'text-green-600 font-bold text-xl';
            return (
              <Link key={item.id} to={`/item/${item.id}`} className={cardClass}>
                <div className="p-1.5">
                  <div
                    className={`relative w-full ${imageHeight} bg-white rounded-xl overflow-hidden border border-slate-200`}
                  >
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

                    {/* ✅ PROMOTED: Top-2 Left-2 */}
                    {isPromoted(item) && (
                      <span className="absolute top-2 left-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-semibold shadow">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Promoted
                      </span>
                    )}

                    {/* ✅ HEART: Top-2 Right-2 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center"
                      aria-label="Favourite"
                    >
                      <Heart className="w-4.5 h-4.5 text-slate-700" />
                    </button>

                    {/* ✅ VERIFIED: Bottom-2 Right-2 */}
                    {isVerified(item) && (
                      <div
                        title="Verified"
                        className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center"
                      >
                        <img src={verifiedIcon} alt="Verified" className="w-5 h-5 object-contain" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-4 pb-4 pt-1">
                  <div className={`${priceClass} leading-tight mb-1 flex items-baseline`}>
                    ₹ {formatPrice(item.price)}
                    {/* ✅ DURATION: Smaller text-xs */}
                    {durationLabel && item.listing_type === 'rent' && (
                      <span className="text-xs font-medium text-slate-400 ml-1.5 relative -top-0.5">
                        /{durationLabel}
                      </span>
                    )}
                  </div>

                  <div className="text-slate-900 font-semibold text-base line-clamp-1 mb-3">
                    {item.name}
                  </div>

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

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-slate-500 min-w-0">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm truncate">{item.city || '—'}</span>
                    </div>

                    <span
                      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap"
                      style={tagStyles}
                    >
                      {listingTag.icon ? (
                        <img src={listingTag.icon} alt="" className="w-4 h-4 object-contain" />
                      ) : (
                        <KeyRound className="w-4 h-4" />
                      )}
                      {listingTag.name}
                    </span>
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

import { Link } from 'react-router-dom';
import { MapPin, Heart, TrendingUp } from 'lucide-react';
import verifiedIcon from '../assets/icons/verified.png';
import type { Item } from '../services/api';

interface ItemsListProps {
  items: Item[];
  primaryColor: string;
  // optional: used if you want save/fav toggle
  savedItemIds?: Set<number>;
  onToggleSave?: (itemId: number) => void;
}

export default function ItemsList({
  items,
  primaryColor,
  savedItemIds,
  onToggleSave,
}: ItemsListProps) {
  const formatPrice = (price: any) => {
    const n = Number(price);
    if (Number.isNaN(n)) return '0';
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
  };

  const isPromoted = (item: any) => item?.is_promoted === true;

  const isVerified = (item: any) =>
    item?.shop?.user?.verified === true ||
    item?.shop?.is_verified === true ||
    item?.is_verified === true;

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
      .slice(0, 3); // list view can show 3
  };

  if (!items?.length) return null;

  return (
    <div className="space-y-4">
      {items.map((item: any) => {
        const fields = getDynamicFields(item);
        const photo = item?.feature_photo?.url || null;
        const isSaved = savedItemIds?.has(item.id) ?? false;
        const listingDetail = item?.listing_type_detail || {};
        const listingName =
          listingDetail?.name || (item?.listing_type === 'rent' ? 'Rent' : 'Sale');
        const listingCode = (listingDetail?.code || item?.listing_type || '').toLowerCase();
        const durationLabel = item?.duration_detail?.name || item?.rent_duration || '—';
        const isRentListing = listingCode === 'rent';

        return (
          <Link
            key={item.id}
            to={`/item/${item.id}`}
            className="group block bg-white rounded-2xl border border-slate-200 hover:shadow-md transition-all overflow-hidden"
          >
            <div className="flex gap-4 p-3 sm:p-4">
              {/* LEFT IMAGE */}
              <div className="relative w-32 h-28 sm:w-44 sm:h-32 flex-shrink-0 rounded-2xl overflow-hidden border border-slate-200 bg-white">
                {photo ? (
                  <img
                    src={photo}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                    No image
                  </div>
                )}

                {/* PROMOTED */}
                {isPromoted(item) && (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500 text-white text-[11px] font-semibold shadow">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Promoted
                  </span>
                )}

                {/* VERIFIED */}
                {isVerified(item) && (
                  <div
                    title="Verified"
                    className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center"
                  >
                    <img
                      src={verifiedIcon}
                      alt="Verified"
                      className="w-5 h-5 object-contain"
                    />
                  </div>
                )}
              </div>

              {/* RIGHT BODY */}
              <div className="flex-1 min-w-0">
                {/* TOP ROW: TITLE + HEART */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-slate-900 font-semibold text-base sm:text-lg line-clamp-1">
                      {item.name}
                    </div>
                    <div className="mt-1 text-slate-500 text-sm flex items-center gap-2 min-w-0">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.city || '—'}</span>
                    </div>
                  </div>

                  {/* Heart (optional toggle) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (onToggleSave) onToggleSave(item.id);
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
                    ₹ {formatPrice(item.price)}
                  </div>

                  {isRentListing ? (
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold whitespace-nowrap">
                      {listingName} • {durationLabel}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-semibold whitespace-nowrap">
                      {listingName}
                    </span>
                  )}
                </div>

                {/* DYNAMIC FIELDS */}
                {fields.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {fields.map((field: any) => (
                      <div
                        key={field.field_id}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200"
                      >
                        <img
                          src={field.image}
                          alt=""
                          className="w-4 h-4 object-contain"
                        />
                        <span className="text-xs font-medium text-slate-700">
                          {field.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTA ROW */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Tap to view details
                  </span>

                  <span
                    className="text-xs font-semibold"
                    style={{ color: primaryColor }}
                  >
                    View →
                  </span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

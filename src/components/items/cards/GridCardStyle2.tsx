import { Link } from 'react-router-dom';
import { Heart, KeyRound, MapPin, TrendingUp } from 'lucide-react';
import type { Item } from '../../../services/api';
import verifiedIcon from '../../../assets/icons/verified.png';
import {
  formatDuration,
  formatPrice,
  getDynamicFields,
  getListingTag,
  isPromoted,
  isVerified,
} from '../../../utils/itemCardUtils';

interface GridCardStyle2Props {
  item: Item;
  onToggleFavorite?: () => void;
  isCarousel?: boolean;
}

export default function GridCardStyle2({
  item,
  onToggleFavorite,
  isCarousel = false,
}: GridCardStyle2Props) {
  const listingTag = getListingTag(item);
  const durationLabel = formatDuration(item);
  const listingCode = (item?.listing_type_detail?.code || item?.listing_type || '').toLowerCase();
  const isRentListing = listingCode === 'rent';
  const fields = getDynamicFields(item);
  const tagStyles = listingTag.color
    ? {
        backgroundColor: `${listingTag.color}1a`,
        borderColor: `${listingTag.color}40`,
        color: listingTag.color,
      }
    : undefined;
  const isFavourite = item?.is_favorite === true;
  const cardClass = `group block bg-white rounded-2xl border border-slate-200 hover:shadow-md transition-all overflow-hidden ${
    isCarousel ? 'min-w-[280px] max-w-[340px] w-[320px] flex-shrink-0' : ''
  }`;
  const imageHeight = 'h-48';
  const priceClass = 'text-sky-600 font-bold text-xl';

  return (
    <Link to={`/item/${item.id}`} className={cardClass}>
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
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleFavorite?.();
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
          {durationLabel && isRentListing && (
            <span className="text-xs font-medium text-slate-400 ml-1.5 relative -top-0.5">
              /{durationLabel}
            </span>
          )}
        </div>

        <div className="text-slate-900 font-semibold text-base line-clamp-1 mb-3">{item.name}</div>

        {fields.length > 0 && (
          <div className="flex items-center gap-3 mb-3 flex-wrap text-slate-600 text-sm">
            {fields.map((field) => (
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

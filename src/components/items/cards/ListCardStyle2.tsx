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

interface ListCardStyle2Props {
  item: Item;
  onToggleFavorite?: () => void;
  isCarousel?: boolean;
  favoriteMessage?: string;
}

export default function ListCardStyle2({
  item,
  onToggleFavorite,
  isCarousel = false,
  favoriteMessage,
}: ListCardStyle2Props) {
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
  const cardClass = `group flex bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all overflow-hidden ${
    isCarousel ? 'min-w-[300px] max-w-[380px] w-[320px] flex-shrink-0' : ''
  } h-32 sm:h-36`;
  const imageClass = 'w-28 sm:w-36 h-full';
  const priceClass = 'text-sky-600 font-bold text-base sm:text-lg';
  const titleClass = 'text-sm sm:text-base font-semibold text-slate-900 line-clamp-2';

  return (
    <Link to={`/item/${item.id}`} className={cardClass}>
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
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleFavorite?.();
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center"
          aria-label="Favourite"
        >
          <Heart
            className={`w-3.5 h-3.5 ${isFavourite ? 'fill-red-500 text-red-500' : 'text-slate-700'}`}
          />
        </button>

        {favoriteMessage && (
          <span className="absolute top-11 right-2 rounded-full bg-slate-900/85 px-2.5 py-1 text-[10px] font-medium text-white shadow">
            {favoriteMessage}
          </span>
        )}

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
            {fields.map((field) => (
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
            {durationLabel && isRentListing && (
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

import { Link } from 'react-router-dom';
import { Eye, Heart, KeyRound, MapPin, Star, TrendingUp } from 'lucide-react';
import type { Item } from '../../../services/api';
import verifiedIcon from '../../../assets/icons/verified.png';
import {
  formatCount,
  formatDuration,
  formatPrice,
  getListingTag,
  isPromoted,
  isVerified,
} from '../../../utils/itemCardUtils';

interface ListCardStyle1Props {
  item: Item;
  onToggleFavorite?: () => void;
  isCarousel?: boolean;
  favoriteMessage?: string;
}

export default function ListCardStyle1({
  item,
  onToggleFavorite,
  isCarousel = false,
  favoriteMessage,
}: ListCardStyle1Props) {
  const listingTag = getListingTag(item);
  const durationLabel = formatDuration(item);
  const listingCode = (item?.listing_type_detail?.code || item?.listing_type || '').toLowerCase();
  const isRentListing = listingCode === 'rent';
  const tagStyles = listingTag.color
    ? {
        backgroundColor: `${listingTag.color}1a`,
        borderColor: `${listingTag.color}40`,
        color: listingTag.color,
      }
    : undefined;
  const isFavourite = item?.is_favorite === true;
  const cardClass = `group flex bg-white rounded-2xl border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-lg transition-all overflow-hidden ${
    isCarousel ? 'min-w-[320px] max-w-[420px] w-[360px] flex-shrink-0' : ''
  } h-36 sm:h-40`;
  const imageClass = 'w-32 sm:w-40 h-full';
  const priceClass = 'text-sky-600 font-bold text-lg sm:text-xl';
  const titleClass = 'text-base sm:text-lg font-bold text-slate-900 line-clamp-1';

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
            <Star className="w-3.5 h-3.5" />
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
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center"
          aria-label="Favourite"
        >
          <Heart
            className={`w-4 h-4 ${isFavourite ? 'fill-red-500 text-red-500' : 'text-slate-700'}`}
          />
        </button>

        {favoriteMessage && (
          <span className="absolute top-12 right-2 rounded-full bg-slate-900/85 px-2.5 py-1 text-[10px] font-medium text-white shadow">
            {favoriteMessage}
          </span>
        )}

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
            {durationLabel && isRentListing && (
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

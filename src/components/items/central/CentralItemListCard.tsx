import { Link } from 'react-router-dom';
import { BedDouble, Building2, CheckCircle2, Heart, Key, MapPin, Zap } from 'lucide-react';
import type { Item } from '../../../services/api';
import { formatPrice, getListingTag, isPromoted } from '../../../utils/itemCardUtils';

interface CentralItemListCardProps {
  item: Item;
  onToggleFavorite?: () => void;
}

export default function CentralItemListCard({
  item,
  onToggleFavorite,
}: CentralItemListCardProps) {
  const listingTag = getListingTag(item);
  const tagStyles = listingTag.color
    ? {
        backgroundColor: `${listingTag.color}1a`,
        borderColor: `${listingTag.color}40`,
        color: listingTag.color,
      }
    : undefined;
  const isFavourite = item?.is_favorite === true;
  const previewFields = Array.isArray(item?.dynamic_fields)
    ? item.dynamic_fields.filter((field) => field?.value).slice(0, 2)
    : [];

  return (
    <Link
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
              onToggleFavorite?.();
            }}
            className="text-slate-300 hover:text-red-500 transition-colors"
            aria-label="Favourite"
          >
            <Heart
              className={`w-5 h-5 ${isFavourite ? 'fill-red-500 text-red-500' : ''}`}
            />
          </button>
        </div>

        <h4 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-1 mt-1">
          {item.name}
        </h4>

        <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
          {previewFields.length > 0 ? (
            previewFields.map((field, index) => (
              <span key={`${field.field_id}-${index}`} className="flex items-center gap-1">
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
          <span className="text-lg font-bold text-blue-700">₹ {formatPrice(item.price)}</span>
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

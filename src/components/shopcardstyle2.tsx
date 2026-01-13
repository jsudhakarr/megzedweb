import { Link } from 'react-router-dom';
import { Building2, CheckCircle2, FileText, MapPin, Star } from 'lucide-react';
import type { Shop } from '../services/api';

interface ShopCardProps {
  shop: Shop;
  accentColor: string;
}

const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

export default function ShopCard({ shop, accentColor }: ShopCardProps) {
  const verified = shop.is_verified === true || shop.is_verified === 1;
  const location =
    [shop.city, shop.state].filter(Boolean).join(', ') || shop.country || '—';
  const rating =
    typeof shop.avg_rating === 'number' && !Number.isNaN(shop.avg_rating)
      ? shop.avg_rating.toFixed(1)
      : '0.0';

  return (
    <Link
      to={`/shop/${shop.id}`}
      className="group w-full max-w-[22rem] sm:max-w-none bg-white rounded-3xl border border-slate-200 hover:border-blue-200 shadow-sm hover:shadow-md transition-all duration-300 p-4 flex flex-col items-center text-center"
    >
      {/* 1. Updated 3D Title Tag (Hexagonal Shape with Gloss) */}
      <div className="mb-4 w-full flex justify-center filter drop-shadow-sm">
        <div
          className="relative flex items-center justify-center w-full h-9 px-6"
          style={{
            backgroundColor: accentColor,
            // Glossy Gradient Overlay + Inner Bevel Shadows
            backgroundImage: `linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.12) 100%)`,
            // The Elongated Hexagon Shape
            clipPath:
              'polygon(12px 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0% 50%)',
            // Inner Highlight (Top) and Shadow (Bottom)
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.2)',
          }}
        >
          <div className="flex items-center gap-1.5 max-w-full overflow-hidden px-2">
            <h3 className="text-sm font-bold text-white line-clamp-1 truncate drop-shadow-md">
              {shop.shop_name}
            </h3>
            {verified && (
              <CheckCircle2 className="w-4 h-4 text-white shrink-0 drop-shadow-md" />
            )}
          </div>
        </div>
      </div>

      {/* 2. YouTube-style Rectangular Thumbnail (16:9) */}
      <div className="w-full aspect-video mb-3 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 relative">
        {shop.photo?.url ? (
          <img
            src={shop.photo.url}
            alt={shop.shop_name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100">
            <span className="text-2xl font-bold text-slate-400">
              {initials(shop.shop_name)}
            </span>
          </div>
        )}
      </div>

      {/* Location */}
      <div className="flex items-center gap-1 text-xs text-slate-400 mb-4">
        <MapPin className="w-3.5 h-3.5" />
        <span className="truncate max-w-[180px]">{location}</span>
      </div>

      {/* Stats */}
      <div className="w-full space-y-2 text-xs sm:text-sm px-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <Building2 className="w-3.5 h-3.5 text-purple-500" />
            <span>{shop.shop_type || 'Business'}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            <span>Listings</span>
          </div>
          <span className="font-semibold text-slate-900">
            {shop.items_count ?? 0}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <Star className="w-3.5 h-3.5 text-amber-500" />
            <span>Rating</span>
          </div>
          <span className="font-semibold text-slate-900">{rating}</span>
        </div>
      </div>
    </Link>
  );
}

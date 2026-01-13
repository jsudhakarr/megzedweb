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
      className="group w-full max-w-[22rem] sm:max-w-none bg-white rounded-3xl border border-slate-200 hover:border-blue-200 shadow-sm hover:shadow-md transition-all duration-300 p-5 pt-8 flex flex-col items-center text-center"
    >
      <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        {shop.photo?.url ? (
          <img src={shop.photo.url} alt={shop.shop_name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg font-semibold text-slate-600">
            {initials(shop.shop_name)}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1 justify-center">
        <h3 className="text-lg font-semibold text-slate-900 line-clamp-1">{shop.shop_name}</h3>
        {verified && <CheckCircle2 className="w-5 h-5" style={{ color: accentColor }} />}
      </div>

      <div className="flex items-center gap-1 text-sm text-slate-400 mt-1">
        <MapPin className="w-4 h-4" />
        <span className="truncate max-w-[180px]">{location}</span>
      </div>

      <div className="mt-4 w-full space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <Building2 className="w-4 h-4 text-purple-500" />
            <span>{shop.shop_type || 'Business'}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <FileText className="w-4 h-4 text-amber-500" />
            <span>Listings</span>
          </div>
          <span className="font-semibold text-slate-900">{shop.items_count ?? 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <Star className="w-4 h-4 text-amber-500" />
            <span>Rating</span>
          </div>
          <span className="font-semibold text-slate-900">{rating}</span>
        </div>
      </div>
    </Link>
  );
}

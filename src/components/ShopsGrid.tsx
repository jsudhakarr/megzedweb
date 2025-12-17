import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, MapPin, Heart, Store } from 'lucide-react';
import { apiService, type Shop } from '../services/api';

interface ShopsGridProps {
  primaryColor: string;
}

export default function ShopsGrid({ primaryColor }: ShopsGridProps) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShops();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadShops = async () => {
    setLoading(true);
    try {
      const data = await apiService.getShops();
      setShops((data || []).slice(0, 4));
    } catch (error) {
      console.error('Failed to load shops:', error);
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  const shopTypeLabel = (shop: any) => shop?.shop_type || shop?.type || 'Shop';

  const shopLocation = (shop: any) => {
    const parts = [shop.city, shop.state, shop.country].filter(Boolean);
    return parts.join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (shops.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {shops.map((shop: any) => (
          <Link
            key={shop.id}
            to={`/shop/${shop.id}`}
            className="group block bg-white rounded-2xl border border-slate-200 hover:shadow-lg transition-all overflow-hidden"
          >
            {/* IMAGE */}
            <div className="p-3">
              <div className="relative w-full h-40 bg-white rounded-2xl overflow-hidden border border-slate-200">
                {shop.photo?.url ? (
                  <img
                    src={shop.photo.url}
                    alt={shop.shop_name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                    No image
                  </div>
                )}

                {/* ITEM COUNT (top-left) */}
                <div className="absolute top-3 left-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/95 border border-slate-200 shadow-sm">
                  <Store className="w-4 h-4 text-slate-700" />
                  <span className="text-xs font-semibold text-slate-800">
                    {shop?.items_count ?? 1}
                  </span>
                </div>

                {/* HEART (top-right) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 border border-slate-200 shadow-sm flex items-center justify-center"
                  aria-label="Favourite shop"
                >
                  <Heart className="w-4.5 h-4.5 text-slate-700" />
                </button>
              </div>
            </div>

            {/* BODY */}
            <div className="px-4 pb-4 pt-0">
              <div className="text-slate-900 font-semibold text-base line-clamp-1 mb-2">
                {shop.shop_name}
              </div>

              {/* TYPE */}
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold mb-3">
                {shopTypeLabel(shop)}
              </span>

              {/* LOCATION */}
              <div className="flex items-center gap-2 text-slate-500 min-w-0">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm truncate">{shopLocation(shop)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

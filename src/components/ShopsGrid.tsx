import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { apiService, type Shop } from '../services/api';
import ShopCard from './ShopCard';

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

  const shopTypeLabel = (shop: any) => shop?.shop_type || shop?.type || 'Business';

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
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
        {shops.map((shop: any) => (
          <ShopCard
            key={shop.id}
            shop={{
              ...shop,
              shop_type: shopTypeLabel(shop),
            }}
            accentColor={primaryColor}
          />
        ))}
      </div>
    </div>
  );
}

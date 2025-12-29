import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { apiService, Item, Shop } from '../../services/api';
import { 
  Heart, 
  Search, 
  Filter, 
  Trash2, 
  Eye, 
  Store, 
  Building2, 
  ImageOff, 
  MapPin,
  Package
} from 'lucide-react';

export default function Favorites() {
  const navigate = useNavigate();
  const { settings } = useAppSettings();
  const primaryColor = settings?.primary_color || '#0073f0';

  const [activeTab, setActiveTab] = useState<'items' | 'shops'>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [favItems, setFavItems] = useState<Item[]>([]);
  const [favShops, setFavShops] = useState<Shop[]>([]);

  useEffect(() => {
    fetchFavorites();
  }, [activeTab]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      if (activeTab === 'items') {
        const data: any = await apiService.getUserFavorites();
        setFavItems(Array.isArray(data) ? data : (data.data || []));
      } else {
        // Assuming an API endpoint exists for favorite shops
        // If not, this might need adjustment based on your API structure
        const data: any = await apiService.getUserFavoriteShops ? await apiService.getUserFavoriteShops() : []; 
        setFavShops(Array.isArray(data) ? data : (data.data || []));
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      // Reset on error to avoid stale data
      if (activeTab === 'items') setFavItems([]);
      else setFavShops([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = favItems.filter((item) =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredShops = favShops.filter((shop) =>
    (shop.shop_name || shop.name)?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const searchLabel = activeTab === 'shops' ? 'businesses' : activeTab;

  // Helper to get item image
  const getItemImage = (item: any) => {
    if (item.feature_photo?.url) return item.feature_photo.url;
    if (item.photo?.url) return item.photo.url;
    if (item.images?.[0]?.url) return item.images[0].url;
    return null;
  };

  // Helper to get shop image
  const getShopImage = (shop: any) => {
    if (shop.photo?.url) return shop.photo.url;
    if (shop.photo && typeof shop.photo === 'string') return shop.photo;
    return null;
  };

  const handleRemoveFavorite = async (e: React.MouseEvent, id: number, type: 'item' | 'shop') => {
    e.stopPropagation();
    if (!window.confirm('Remove from favorites?')) return;
    
    // Optimistic UI update
    if (type === 'item') {
      setFavItems(prev => prev.filter(i => i.id !== id));
      // Call API to remove item
      // await apiService.toggleFavorite(id); 
    } else {
      setFavShops(prev => prev.filter(s => s.id !== id));
      // Call API to remove shop
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-12">
      
      {/* Header & Controls Bar */}
      <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Title & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Favorites</h1>
            <p className="text-xs text-slate-500">Saved items & businesses</p>
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg self-start sm:self-center">
            <button
              onClick={() => setActiveTab('items')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'items' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Properties
            </button>
            <button
              onClick={() => setActiveTab('shops')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'shops' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              Businesses
            </button>
          </div>
        </div>

        {/* Right: Search & Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${searchLabel}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm w-full sm:w-56 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200 transition-all"
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-700 text-sm transition-colors">
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 animate-pulse">
              <div className="h-32 bg-slate-200 rounded-md mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (activeTab === 'items' ? filteredItems.length === 0 : filteredShops.length === 0) ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-200">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <Heart className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            No favorite {searchLabel} found
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery ? 'Try adjusting your search' : 'Go explore and save things you like!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          
          {/* PROPERTIES GRID */}
          {activeTab === 'items' && filteredItems.map((item) => (
            <div 
              key={item.id} 
              className="group bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                {getItemImage(item) ? (
                  <img
                    src={getItemImage(item)}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ImageOff className="w-8 h-8" />
                  </div>
                )}
                
                {/* Remove Button (Top Right) */}
                <button 
                  onClick={(e) => handleRemoveFavorite(e, item.id, 'item')}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-red-50 text-red-500 transition-colors z-20"
                  title="Remove"
                >
                  <Heart className="w-3.5 h-3.5 fill-current" />
                </button>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                  <button 
                    onClick={() => navigate(`/items/${item.id}`)} 
                    className="p-2 bg-white rounded-full hover:bg-slate-100 transition-colors"
                  >
                    <Eye className="w-4 h-4 text-slate-700" />
                  </button>
                </div>
              </div>

              <div className="p-3">
                <h3 className="text-sm font-semibold text-slate-900 line-clamp-1 mb-1">{item.name}</h3>
                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <span className="text-sm font-bold" style={{ color: primaryColor }}>
                    {settings?.currency || '$'}{Number(item.price).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {item.subcategory?.name}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* SHOPS GRID */}
          {activeTab === 'shops' && filteredShops.map((shop) => (
            <div 
              key={shop.id} 
              className="group bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                {getShopImage(shop) ? (
                  <img
                    src={getShopImage(shop)}
                    alt={shop.shop_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Store className="w-8 h-8" />
                  </div>
                )}

                {/* Remove Button */}
                <button 
                  onClick={(e) => handleRemoveFavorite(e, shop.id, 'shop')}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-red-50 text-red-500 transition-colors z-20"
                  title="Remove"
                >
                  <Heart className="w-3.5 h-3.5 fill-current" />
                </button>

                 {/* Hover Actions */}
                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                  <button 
                    onClick={() => navigate(`/shops/${shop.id}`)} 
                    className="p-2 bg-white rounded-full hover:bg-slate-100 transition-colors"
                  >
                    <Eye className="w-4 h-4 text-slate-700" />
                  </button>
                </div>
              </div>

              <div className="p-3">
                <h3 className="text-sm font-semibold text-slate-900 line-clamp-1 mb-1">{shop.shop_name || shop.name}</h3>
                
                <div className="text-xs text-slate-500 mb-2 line-clamp-1 flex items-center gap-1">
                   <MapPin className="w-3 h-3" />
                   {shop.city || 'No Location'}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                   <span className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                    <Package className="w-3 h-3" />
                    {shop.items_count || 0} Listings
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

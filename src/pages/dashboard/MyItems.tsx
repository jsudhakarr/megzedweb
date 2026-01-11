import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { apiService, Item } from '../../services/api';

// ✅ IMPORT THE MODAL (Ensure this path is correct!)
import PromoteModal from '../../components/PromoteModal'; 

import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Eye,
  ImageOff,
  MoreHorizontal,
  Zap,
  Clock,
  Rocket, // ✅ Added Rocket icon
} from 'lucide-react';

export default function MyItems() {
  const navigate = useNavigate();
  const { settings } = useAppSettings();
  const primaryColor = settings?.primary_color || '#0073f0';

  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ STATES FOR MODAL
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    id: number;
    action: 'activate' | 'promote';
    categoryId?: number | string;
  } | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response: any = await apiService.getUserItems();
      if (response?.data && Array.isArray(response.data)) setItems(response.data);
      else if (Array.isArray(response)) setItems(response);
      else setItems([]);
    } catch (error) {
      console.error('Failed to fetch items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredItems = items.filter((item: any) => {
    const itemName = item?.name || '';
    return itemName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getItemImage = (item: any) => {
    if (item?.feature_photo?.url) return item.feature_photo.url;
    if (item?.photo?.url) return item.photo.url;
    if (item?.images?.[0]?.url) return item.images[0].url;
    return null;
  };

  const getStatusColor = (status: any) => {
    const s = String(status).toLowerCase();
    if (s === '1' || s === 'active') return 'bg-green-100 text-green-700 border-green-200';
    if (s === '0' || s === 'inactive' || s === 'pending') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (s === 'rejected') return 'bg-red-100 text-red-700 border-red-200';
    if (s === 'sold') return 'bg-slate-100 text-slate-700 border-slate-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const handleEdit = (id: number | string) => {
    navigate(`/dashboard/items/create?edit=${id}`);
  };

  const handleDelete = async (id: number | string, name?: string) => {
    const ok = window.confirm(`Delete this property?\n\n${name || `#${id}`}`);
    if (!ok) return;

    try {
      await apiService.deleteItem(Number(id));
      await fetchItems();
    } catch (e: any) {
      console.error("Delete failed:", e);
      alert(e?.message ? String(e.message) : "Delete failed");
    }
  };

  // ✅ HANDLE MODAL OPEN
  const openPromoteModal = (item: any) => {
    // Logic: If status is 0 or 'inactive', action is 'activate'. Otherwise 'promote'.
    const isInactive = item.status === 0 || String(item.status) === 'inactive' || String(item.status) === 'pending';
    
    setSelectedItem({
      id: item.id,
      action: isInactive ? 'activate' : 'promote',
      categoryId: item?.category_id ?? item?.categoryId ?? item?.category?.id,
    });
    setModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-12">
      {/* Top Bar */}
      <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">My Properties</h1>
          <p className="text-xs text-slate-500">Manage your active listings</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm w-40 sm:w-64 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200 transition-all"
            />
          </div>

          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-700 text-sm transition-colors">
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filter</span>
          </button>

          <button
            onClick={() => navigate("/dashboard/items/create")}
            className="flex items-center gap-2 px-4 py-2 text-white font-bold rounded-lg text-sm shadow-md hover:opacity-95 active:scale-[0.99] transition-all whitespace-nowrap ring-2 ring-offset-2"
            style={{
              backgroundColor: primaryColor,
              boxShadow: `0 0 0 3px ${primaryColor}55`,
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Property</span>
          </button>
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 animate-pulse">
              <div className="h-32 bg-slate-200 rounded-md mb-2" />
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-200">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <ShoppingBag className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">No properties found</h3>
          <p className="text-xs text-slate-500 mt-1">Add a new property to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item: any) => {
            // Check if inactive for button logic
            const isInactive = item.status === 0 || String(item.status) === 'inactive' || String(item.status) === 'pending';

            return (
              <div
                key={item.id}
                className="group bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
              >
                {/* Image */}
                <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                  <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-sm border ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {item.status === 0 ? 'Inactive' : item.status === 1 ? 'Active' : item.status}
                    </span>

                    {item.is_promoted && (
                      <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-sm bg-purple-100 text-purple-700 border border-purple-200">
                        <Zap className="w-3 h-3 fill-current" />
                        Promoted
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-2 left-2 z-10">
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-black/60 text-white backdrop-blur-sm rounded-sm uppercase">
                      For {item.listing_type}
                    </span>
                  </div>

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

                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                    <button
                      onClick={() => navigate(`/item/${item.id}`)}
                      className="p-2 bg-white rounded-full hover:bg-slate-100 transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4 text-slate-700" />
                    </button>
                    <button
                      onClick={() => handleEdit(item.id)}
                      className="p-2 bg-white rounded-full hover:bg-slate-100 transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="p-2 bg-white rounded-full hover:bg-slate-100 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="p-3 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-semibold text-slate-900 line-clamp-1" title={item.name}>
                      {item.name || 'Untitled Property'}
                    </h3>
                    <button className="text-slate-400 hover:text-slate-600 lg:hidden" type="button">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-slate-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {item.total_view || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.created_at || Date.now()).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mt-auto pt-2 border-t border-slate-50">
                     <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold" style={{ color: primaryColor }}>
                          {settings?.currency || '$'}
                          {Number(item.price || 0).toLocaleString()}
                          {item.listing_type === 'rent' && (
                            <span className="text-xs font-normal text-slate-400">
                              /{item.rent_duration || 'mo'}
                            </span>
                          )}
                        </span>
    
                        {item.subcategory?.name && (
                          <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 truncate max-w-[80px]">
                            {item.subcategory.name}
                          </span>
                        )}
                     </div>

                     {/* ✅ NEW ACTIVATE / PROMOTE BUTTON */}
                     <button
                       onClick={() => openPromoteModal(item)}
                       className={`w-full py-2 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                         isInactive
                           ? "bg-slate-900 text-white hover:bg-slate-800"
                           : "bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200"
                       }`}
                     >
                       {isInactive ? (
                         <>
                           <Zap className="w-3.5 h-3.5" />
                           Activate Listing
                         </>
                       ) : (
                         <>
                           <Rocket className="w-3.5 h-3.5" />
                           Boost Visibility
                         </>
                       )}
                     </button>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ✅ RENDER MODAL HERE */}
      {selectedItem && (
        <PromoteModal 
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          targetId={selectedItem.id}
          targetType="item"
          actionType={selectedItem.action}
          categoryId={selectedItem.categoryId}
          onSuccess={() => {
             fetchItems(); // Refresh the list after purchase
          }}
        />
      )}
    </div>
  );
}

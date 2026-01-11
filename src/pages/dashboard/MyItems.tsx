import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { apiService, Item } from '../../services/api';

// ✅ IMPORT THE MODAL
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
  Zap,
  Clock,
  Rocket,
  CalendarDays,
  Timer,
  AlertCircle, // ✅ Added Alert Icon
  ShieldAlert    // ✅ Added Shield Icon
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

  const getStatusColor = (status: any, approvalStatus?: string) => {
    // Priority: Check approval status first
    if (approvalStatus === 'pending') return 'bg-orange-100 text-orange-700 border-orange-200';
    if (approvalStatus === 'rejected') return 'bg-red-100 text-red-700 border-red-200';

    // Fallback: Check standard status
    const s = String(status).toLowerCase();
    if (s === '1' || s === 'active') return 'bg-green-100 text-green-700 border-green-200';
    if (s === '0' || s === 'inactive' || s === 'pending') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (s === 'sold') return 'bg-slate-100 text-slate-700 border-slate-200';
    
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusLabel = (item: any) => {
    if (item.approval_status === 'pending') return 'Pending Review';
    if (item.approval_status === 'rejected') return 'Rejected';
    
    if (item.status === 0 || String(item.status) === 'inactive') return 'Inactive';
    if (item.status === 1 || String(item.status) === 'active') return 'Active';
    return item.status;
  };

  // ✅ Helper to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
    const isInactive = item.status === 0 || String(item.status) === 'inactive' || String(item.status) === 'pending';
    
    setSelectedItem({
      id: item.id,
      action: isInactive ? 'activate' : 'promote',
      categoryId: item?.category_id ?? item?.categoryId ?? item?.category?.id,
    });
    setModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Properties</h1>
          <p className="text-sm text-slate-500">Manage and boost your active listings</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm w-40 sm:w-64 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
            />
          </div>

          <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
          </button>

          <button
            onClick={() => navigate("/dashboard/items/create")}
            className="flex items-center gap-2 px-5 py-2 text-white font-bold rounded-lg text-sm shadow-md hover:brightness-110 active:scale-[0.98] transition-all whitespace-nowrap"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Property</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 animate-pulse">
              <div className="h-48 bg-slate-200 rounded-lg mb-4" />
              <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-4" />
              <div className="h-10 bg-slate-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <ShoppingBag className="w-8 h-8" style={{ color: primaryColor }} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No properties found</h3>
          <p className="text-slate-500 mt-1 mb-6">Create a new listing to start selling or renting.</p>
          <button
            onClick={() => navigate("/dashboard/items/create")}
            className="px-6 py-2.5 text-white font-bold rounded-lg shadow-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            Add New Property
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item: any) => {
            const isInactive =
              item.status === 0 ||
              String(item.status) === 'inactive' ||
              String(item.status) === 'pending';
            
            const isPendingApproval = item.approval_status === 'pending';
            const isRejected = item.approval_status === 'rejected';

            return (
              <div
                key={item.id}
                className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col"
              >
                {/* --- IMAGE SECTION --- */}
                <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2">
                    <span
                      className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm border ${getStatusColor(
                        item.status,
                        item.approval_status
                      )}`}
                    >
                      {getStatusLabel(item)}
                    </span>
                    {item.is_promoted && (
                      <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md bg-amber-400 text-black shadow-sm border border-amber-500">
                        <Zap className="w-3 h-3 fill-current" />
                        Boosted
                      </span>
                    )}
                  </div>

                  {/* Type Badge (Rent/Sale) */}
                  <div className="absolute bottom-3 left-3 z-10">
                    <span className="px-2.5 py-1 text-[10px] font-bold bg-slate-900/90 text-white backdrop-blur-md rounded-md uppercase shadow-sm">
                      {item.listing_type}
                    </span>
                  </div>

                  {/* Main Image */}
                  {getItemImage(item) ? (
                    <img
                      src={getItemImage(item)}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                      <ImageOff className="w-10 h-10 mb-2" />
                      <span className="text-xs text-slate-400">No Image</span>
                    </div>
                  )}

                  {/* Hover Overlay Actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
                    <button
                      onClick={() => navigate(`/item/${item.id}`)}
                      className="p-2.5 bg-white rounded-full hover:bg-slate-100 hover:scale-110 transition-all shadow-lg"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4 text-slate-700" />
                    </button>
                    <button
                      onClick={() => handleEdit(item.id)}
                      className="p-2.5 bg-white rounded-full hover:bg-blue-50 hover:scale-110 transition-all shadow-lg"
                      title="Edit Listing"
                    >
                      <Edit3 className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="p-2.5 bg-white rounded-full hover:bg-red-50 hover:scale-110 transition-all shadow-lg"
                      title="Delete Listing"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                {/* --- CONTENT SECTION --- */}
                <div className="p-4 flex-1 flex flex-col">
                  {/* Header & Price */}
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-base font-bold text-slate-900 leading-tight line-clamp-1 group-hover:text-blue-600 transition-colors"
                        title={item.name}
                      >
                        {item.name || 'Untitled Property'}
                      </h3>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {item.category?.name} • {item.subcategory?.name}
                      </p>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <p
                        className="text-lg font-bold"
                        style={{ color: primaryColor }}
                      >
                        {settings?.currency || '$'}
                        {Number(item.price || 0).toLocaleString()}
                      </p>
                      {item.listing_type === 'rent' && (
                        <p className="text-[10px] text-slate-400 font-medium">
                          /{item.rent_duration || 'mo'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 py-3 border-t border-b border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-500" title="Views">
                      <Eye className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">
                        {item.total_view || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500" title="Likes">
                      <span className="text-xs">❤️</span>
                      <span className="text-xs font-medium">
                        {item.likes_count ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 ml-auto" title="Posted Date">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* ✅ DATES SECTION (Expiry & Promoted Until) */}
                  <div className="mt-3 space-y-2 empty:hidden">
                    {/* 1. Listing Expiry (Only if NOT pending/rejected) */}
                    {!isPendingApproval && !isRejected && item.active_until && (
                      <div className="flex items-center justify-between text-[11px] bg-slate-50 px-2.5 py-1.5 rounded-md text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium">Expires:</span>
                        </div>
                        <span className={`font-semibold ${new Date(item.active_until) < new Date() ? 'text-red-600' : 'text-slate-800'}`}>
                          {formatDate(item.active_until)}
                        </span>
                      </div>
                    )}

                    {/* 2. Promotion Expiry */}
                    {item.is_promoted && item.promoted_until && (
                      <div className="flex items-center justify-between text-[11px] bg-amber-50 px-2.5 py-1.5 rounded-md text-amber-700 border border-amber-100">
                        <div className="flex items-center gap-1.5">
                          <Timer className="w-3.5 h-3.5" />
                          <span className="font-bold">Boost Ends:</span>
                        </div>
                        <span className="font-bold text-amber-800">
                          {formatDate(item.promoted_until)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* --- ACTION BUTTON AREA --- */}
                  <div className="mt-auto pt-3">
                    {/* ✅ PENDING APPROVAL VIEW */}
                    {isPendingApproval ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-yellow-800">Pending Approval</p>
                          <p className="text-[10px] text-yellow-700 leading-tight mt-0.5">
                            Your listing is waiting for administrative approval before it goes live.
                          </p>
                        </div>
                      </div>
                    ) : isRejected ? (
                      /* ✅ REJECTED VIEW */
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
                         <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                         <div>
                          <p className="text-xs font-bold text-red-800">Listing Rejected</p>
                          <p className="text-[10px] text-red-700 leading-tight mt-0.5">
                            This listing was rejected. Please edit and resubmit or contact support.
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* ✅ STANDARD ACTIVE/INACTIVE VIEW */
                      <>
                        <button
                          onClick={() => openPromoteModal(item)}
                          className={`w-full relative overflow-hidden py-2.5 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] ${
                            isInactive
                              ? 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md'
                              : 'bg-gradient-to-r from-amber-50 to-orange-50 text-orange-700 border border-orange-200 hover:border-orange-300 hover:from-amber-100 hover:to-orange-100'
                          }`}
                        >
                          {isInactive ? (
                            <>
                              <Zap className="w-4 h-4 text-yellow-400 fill-current" />
                              <span>Activate Listing</span>
                            </>
                          ) : (
                            <>
                              <Rocket className="w-4 h-4 text-orange-600 fill-current animate-pulse" />
                              <span>Boost Visibility</span>
                            </>
                          )}
                        </button>
                        {!isInactive && (
                          <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
                            Get up to 3x more views
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ✅ RENDER MODAL */}
      {selectedItem && (
        <PromoteModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          targetId={selectedItem.id}
          targetType="item"
          actionType={selectedItem.action}
          categoryId={selectedItem.categoryId}
          onSuccess={() => {
            fetchItems();
          }}
        />
      )}
    </div>
  );
}
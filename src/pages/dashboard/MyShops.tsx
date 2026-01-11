import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  MapPin,
  Package,
  CheckCircle2,
  Eye,
  ImageOff,
  Zap,
  Rocket,
  Clock,
  CalendarDays,
  Timer,
  AlertCircle,
  ShieldAlert
} from "lucide-react";

import { useAppSettings } from "../../contexts/AppSettingsContext";
import { apiService, type Shop } from "../../services/api";
import PromoteModal from "../../components/PromoteModal";

export default function MyShops() {
  const navigate = useNavigate();
  const { settings } = useAppSettings();
  const primaryColor = settings?.primary_color || "#0073f0";

  const [searchQuery, setSearchQuery] = useState("");
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Promote/Activate modal state
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoShopId, setPromoShopId] = useState<number | null>(null);
  const [promoAction, setPromoAction] = useState<"activate" | "promote">("promote");
  const [promoCategoryId, setPromoCategoryId] = useState<number | string | null>(null);

  useEffect(() => {
    fetchShops();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchShops = async () => {
    setLoading(true);
    try {
      const response: any = await apiService.getUserShops();

      // supports both response.data and direct array
      if (response?.data && Array.isArray(response.data)) {
        setShops(response.data);
      } else if (Array.isArray(response)) {
        setShops(response);
      } else {
        setShops([]);
      }
    } catch (error) {
      console.error("Failed to fetch businesses:", error);
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name?: string) => {
    if (!window.confirm(`Are you sure you want to delete this business?\n\n${name || ''}`)) return;

    try {
      await apiService.deleteShop(id);
      setShops((prev) => prev.filter((s: any) => s.id !== id));
    } catch (error) {
      console.error("Failed to delete business", error);
      alert("Failed to delete business. Please try again.");
    }
  };

  const openShopAction = (
    shop: any,
    action: "activate" | "promote"
  ) => {
    setPromoShopId(shop.id);
    setPromoAction(action);
    setPromoCategoryId(shop?.category_id ?? shop?.category?.id ?? null);
    setPromoOpen(true);
  };

  // ---------- Helpers ----------
  const getShopImage = (shop: any) => {
    if (shop?.photo?.url) return shop.photo.url;
    if (typeof shop?.photo === "string") return shop.photo;
    if (shop?.images?.[0]?.url) return shop.images[0].url;
    if (typeof shop?.image === "string") return shop.image;
    return null;
  };

  // Helper to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: any, approvalStatus?: string) => {
    // Priority: Check approval status first
    if (approvalStatus === 'pending') return 'bg-orange-100 text-orange-700 border-orange-200';
    if (approvalStatus === 'rejected') return 'bg-red-100 text-red-700 border-red-200';

    // Fallback: Check standard status
    const s = String(status).toLowerCase();
    if (s === '1' || s === 'active') return 'bg-green-100 text-green-700 border-green-200';
    if (s === '0' || s === 'inactive' || s === 'pending') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusLabel = (shop: any) => {
    // Some backends might use different keys for approval
    const approval = shop.approval_status || (shop.is_approved === false ? 'pending' : 'approved');

    if (approval === 'pending') return 'Pending Review';
    if (approval === 'rejected') return 'Rejected';
    
    const s = String(shop.status || "").toLowerCase();
    if (s === '0' || s === 'inactive') return 'Inactive';
    if (s === '1' || s === 'active') return 'Active';
    return shop.status;
  };

  // Helper to check active promotion
  const isShopPromoted = (shop: any) => {
    const flag = shop?.is_promoted;
    if (!flag) return false;
    
    // Check date validity
    const until = shop?.promoted_until;
    if (until) {
      const d = new Date(until);
      if (!Number.isNaN(d.getTime())) return d.getTime() > Date.now();
    }
    return !!flag;
  };

  const filteredShops = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return shops;

    return (shops || []).filter((shop: any) => {
      const name = (shop?.shop_name || shop?.name || "").toLowerCase();
      return name.includes(q);
    });
  }, [shops, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Businesses</h1>
          <p className="text-sm text-slate-500">Manage and boost your business profiles</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
            <input
              type="text"
              placeholder="Search businesses..."
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
            onClick={() => navigate("/dashboard/shops/create")}
            className="flex items-center gap-2 px-5 py-2 text-white font-bold rounded-lg text-sm shadow-md hover:brightness-110 active:scale-[0.98] transition-all whitespace-nowrap"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Business</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 animate-pulse">
              <div className="h-48 bg-slate-200 rounded-lg mb-4" />
              <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-4" />
              <div className="h-10 bg-slate-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : filteredShops.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <Store className="w-8 h-8" style={{ color: primaryColor }} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No businesses found</h3>
          <p className="text-slate-500 mt-1 mb-6">Create a business profile to start selling.</p>
          <button
            onClick={() => navigate("/dashboard/shops/create")}
            className="px-6 py-2.5 text-white font-bold rounded-lg shadow-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            Create Business
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShops.map((shop: any) => {
            const isInactive = String(shop.status).toLowerCase() === "inactive" || shop.status === 0;
            const isPromoted = isShopPromoted(shop);
            
            // Logic for approval states
            const approvalStatus = shop.approval_status || (shop.is_approved === false ? 'pending' : 'approved');
            const isPendingApproval = approvalStatus === 'pending';
            const isRejected = approvalStatus === 'rejected';

            const img = getShopImage(shop);

            return (
              <div
                key={shop.id}
                className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col"
              >
                {/* --- IMAGE SECTION --- */}
                <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                   {/* Status Badge */}
                   <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2">
                    <span
                      className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm border ${getStatusColor(
                        shop.status,
                        approvalStatus
                      )}`}
                    >
                      {getStatusLabel(shop)}
                    </span>
                    {isPromoted && (
                      <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md bg-amber-400 text-black shadow-sm border border-amber-500">
                        <Zap className="w-3 h-3 fill-current" />
                        Boosted
                      </span>
                    )}
                  </div>

                  {/* Shop Type Badge */}
                  {shop.shop_type && (
                    <div className="absolute bottom-3 left-3 z-10">
                      <span className="px-2.5 py-1 text-[10px] font-bold bg-slate-900/90 text-white backdrop-blur-md rounded-md uppercase shadow-sm">
                        {shop.shop_type}
                      </span>
                    </div>
                  )}

                  {/* Main Image */}
                  {img ? (
                    <img
                      src={img}
                      alt={shop.shop_name}
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
                      onClick={() => navigate(`/shop/${shop.id}`)}
                      className="p-2.5 bg-white rounded-full hover:bg-slate-100 hover:scale-110 transition-all shadow-lg"
                      title="View Business"
                    >
                      <Eye className="w-4 h-4 text-slate-700" />
                    </button>
                    <button
                      onClick={() => navigate(`/dashboard/shops/create?edit=${shop.id}`)}
                      className="p-2.5 bg-white rounded-full hover:bg-blue-50 hover:scale-110 transition-all shadow-lg"
                      title="Edit Business"
                    >
                      <Edit3 className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(shop.id, shop.shop_name)}
                      className="p-2.5 bg-white rounded-full hover:bg-red-50 hover:scale-110 transition-all shadow-lg"
                      title="Delete Business"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                {/* --- CONTENT SECTION --- */}
                <div className="p-4 flex-1 flex flex-col">
                  {/* Header */}
                  <div className="mb-2">
                    <h3
                      className="text-base font-bold text-slate-900 leading-tight line-clamp-1 group-hover:text-blue-600 transition-colors"
                      title={shop.shop_name}
                    >
                      {shop.shop_name || "Untitled Business"}
                    </h3>
                    <div className="flex items-start gap-1.5 mt-1 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span className="truncate">
                        {[shop.city, shop.state].filter(Boolean).join(", ") || "No location set"}
                      </span>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 py-3 border-t border-b border-slate-100 mb-2">
                     <div className="flex items-center gap-1.5 text-slate-500" title="Total Listings">
                      <Package className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">
                        {shop.items_count || 0} listings
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 ml-auto" title="Created Date">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">
                        {formatDate(shop.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* ✅ DATES SECTION */}
                  <div className="mt-2 space-y-2 empty:hidden">
                    {/* Expiry Date (if exists) */}
                    {!isPendingApproval && !isRejected && shop.active_until && (
                      <div className="flex items-center justify-between text-[11px] bg-slate-50 px-2.5 py-1.5 rounded-md text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium">Expires:</span>
                        </div>
                        <span className={`font-semibold ${new Date(shop.active_until) < new Date() ? 'text-red-600' : 'text-slate-800'}`}>
                          {formatDate(shop.active_until)}
                        </span>
                      </div>
                    )}

                    {/* Promotion Expiry */}
                    {isPromoted && shop.promoted_until && (
                       <div className="flex items-center justify-between text-[11px] bg-amber-50 px-2.5 py-1.5 rounded-md text-amber-700 border border-amber-100">
                        <div className="flex items-center gap-1.5">
                          <Timer className="w-3.5 h-3.5" />
                          <span className="font-bold">Boost Ends:</span>
                        </div>
                        <span className="font-bold text-amber-800">
                          {formatDate(shop.promoted_until)}
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
                            Your business is under review by the administration.
                          </p>
                        </div>
                      </div>
                    ) : isRejected ? (
                      /* ✅ REJECTED VIEW */
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
                         <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                         <div>
                          <p className="text-xs font-bold text-red-800">Business Rejected</p>
                          <p className="text-[10px] text-red-700 leading-tight mt-0.5">
                            This profile was rejected. Please edit details and resubmit.
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* ✅ STANDARD ACTION BUTTON */
                      <>
                        <button
                          onClick={() => openShopAction(shop, isInactive ? "activate" : "promote")}
                          className={`w-full relative overflow-hidden py-2.5 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] ${
                            isInactive
                              ? 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md'
                              : 'bg-gradient-to-r from-amber-50 to-orange-50 text-orange-700 border border-orange-200 hover:border-orange-300 hover:from-amber-100 hover:to-orange-100'
                          }`}
                        >
                          {isInactive ? (
                            <>
                              <Zap className="w-4 h-4 text-yellow-400 fill-current" />
                              <span>Activate Business</span>
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
                            Reach more customers
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

      {/* Promote / Activate modal */}
      {promoShopId !== null && (
        <PromoteModal
          isOpen={promoOpen}
          onClose={() => setPromoOpen(false)}
          targetId={promoShopId}
          targetType="shop"
          actionType={promoAction}
          categoryId={promoCategoryId ?? undefined}
          onSuccess={() => fetchShops()}
        />
      )}
    </div>
  );
}

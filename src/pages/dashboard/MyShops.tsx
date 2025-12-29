// File: src/pages/dashboard/MyShops.tsx
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
  Sparkles,
  CheckCircle2,
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

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();

    if (!window.confirm("Are you sure you want to delete this business?")) return;

    try {
      await apiService.deleteShop(id);
      setShops((prev) => prev.filter((s: any) => s.id !== id));
    } catch (error) {
      console.error("Failed to delete business", error);
      alert("Failed to delete business. Please try again.");
    }
  };

  const openShopAction = (
    e: React.MouseEvent,
    shopId: number,
    action: "activate" | "promote"
  ) => {
    e.stopPropagation();
    setPromoShopId(shopId);
    setPromoAction(action);
    setPromoOpen(true);
  };

  // ---------- helpers ----------
  const getShopImage = (shop: any) => {
    if (shop?.photo?.url) return shop.photo.url;
    if (typeof shop?.photo === "string") return shop.photo;
    if (shop?.images?.[0]?.url) return shop.images[0].url;
    if (typeof shop?.image === "string") return shop.image;
    return null;
  };

  const isShopActive = (shop: any) => String(shop?.status || "").toLowerCase() === "active";

  // ✅ change these keys if your backend uses different field names
  const isShopPromoted = (shop: any) => {
    const flag =
      shop?.is_promoted ??
      shop?.promoted ??
      shop?.promotion_active ??
      shop?.is_premium ??
      shop?.is_featured;

    if (flag === true || flag === 1 || String(flag) === "true") return true;

    const until = shop?.promoted_until || shop?.promoted_till || shop?.promotion_until;
    if (until) {
      const d = new Date(until);
      if (!Number.isNaN(d.getTime())) return d.getTime() > Date.now();
    }

    return false;
  };

  const promotedLabel = (shop: any) => {
    const until = shop?.promoted_until || shop?.promoted_till || shop?.promotion_until;
    if (!until) return "Promoted";
    const d = new Date(until);
    if (Number.isNaN(d.getTime())) return "Promoted";
    return `Promoted · till ${d.toLocaleDateString()}`;
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
    <div className="max-w-7xl mx-auto space-y-4 pb-14">
      {/* Top Bar */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">My Businesses</h1>
          <p className="text-xs text-slate-500">Manage your business profiles</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search businesses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm w-64 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
            />
          </div>

          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 text-sm"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard/shops/create")}
            className="flex items-center gap-1.5 px-3 py-2 text-white font-bold rounded-lg shadow-sm hover:opacity-90 transition"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Business</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-pulse"
            >
              <div className="aspect-[16/9] bg-slate-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-2/3" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                <div className="h-10 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredShops.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <Store className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No businesses found</h3>
          <p className="text-xs text-slate-500 mt-1">Create a business to start selling.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredShops.map((shop: any) => {
            const active = isShopActive(shop);
            const promoted = isShopPromoted(shop);
            const img = getShopImage(shop);

            return (
              <div
                key={shop.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden"
              >
                {/* Image */}
              <div
                className="relative aspect-[16/9] bg-slate-100 cursor-pointer"
                onClick={() => navigate(`/shop/${shop.id}`)}
                title="Open business"
              >
                  <div className="absolute top-3 left-3 flex gap-2 z-10">
                    <span
                      className={`px-2.5 py-1 text-[11px] font-bold uppercase rounded-lg border ${
                        active
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      {active ? "Active" : (shop.status || "Inactive")}
                    </span>

                    {promoted && (
                      <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-amber-50 text-amber-800 border-amber-200">
                        Promoted
                      </span>
                    )}
                  </div>

                  {img ? (
                  <img src={img} alt={shop.shop_name || "Business"} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Store className="w-10 h-10" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-base font-bold text-slate-900 truncate">
                        {shop.shop_name || shop.name || "Untitled Business"}
                      </div>

                      <div className="mt-1 text-sm text-slate-500 flex items-center gap-1 truncate">
                        <MapPin className="w-4 h-4" />
                        {shop.city || "No location"}
                      </div>

                      {promoted && (
                        <div className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 inline-flex">
                          {promotedLabel(shop)}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/shop/${shop.id}`)}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-bold"
                    >
                      View
                    </button>
                  </div>

                  {/* meta */}
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      {shop.items_count || 0} listings
                    </span>
                    <span>{shop.created_at ? new Date(shop.created_at).toLocaleDateString() : ""}</span>
                  </div>

                  {/* Action buttons (big & clear) */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/shops/create?edit=${shop.id}`)}
                      className="py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold flex items-center justify-center gap-2"
                    >
                      <Edit3 className="w-5 h-5" />
                      Edit
                    </button>

                    {!active ? (
                      <button
                        type="button"
                        onClick={(e) => openShopAction(e, shop.id, "activate")}
                        className="py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        Activate
                      </button>
                    ) : promoted ? (
                      <button
                        type="button"
                        disabled
                        className="py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                      >
                        <Sparkles className="w-5 h-5" />
                        Promoted
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => openShopAction(e, shop.id, "promote")}
                        className="py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Sparkles className="w-5 h-5" />
                        Promote
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, shop.id)}
                    className="mt-3 w-full py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete
                  </button>
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
          onSuccess={() => fetchShops()}
        />
      )}
    </div>
  );
}

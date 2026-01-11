import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppSettings } from "../contexts/AppSettingsContext";
import { apiService, type Item } from "../services/api";
import MapEmbed from "../components/MapEmbed";
import LeafletRadiusMap from "../components/LeafletRadiusMap";
import Footer from '../components/Footer';
import SiteHeader from '../components/SiteHeader';
import type { ItemAction } from "../types/action";
import ActionFormRenderer from "../components/actionForm/ActionFormRenderer";
import Modal from "../components/ui/Modal";
import Toast from "../components/ui/Toast";


import {
  ArrowLeft,
  MapPin,
  Clock,
  BadgeCheck,
  Share2,
  Heart,
  ChevronLeft,
  ChevronRight,
  User,
  MessageCircle,
  Phone,
  Calendar,
  Tag,
  Loader2,
  Home,
  ShieldCheck,
  Store,
  Pencil,
  Megaphone,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const ACTION_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  in_progress: "In Progress",
  completed: "View",
  cancelled: "View",
  rejected: "View",
};

const NON_FORM_ACTIONS = new Set([
  "price",
  "navigate",
  "call",
  "whatsapp",
  "chat",
  "make_offer",
]);

const OWNER_ACTION_CODES = new Set(["edit", "edit_item", "promote", "promote_item"]);
const PROMOTE_ACTION_CODES = new Set(["promote", "promote_item"]);

const ACTION_ICON_MAP: Record<string, JSX.Element> = {
  call: <Phone className="w-4 h-4" />,
  chat: <MessageCircle className="w-4 h-4" />,
  whatsapp: <MessageCircle className="w-4 h-4" />,
  navigate: <MapPin className="w-4 h-4" />,
  price: <Tag className="w-4 h-4" />,
  edit: <Pencil className="w-4 h-4" />,
  edit_item: <Pencil className="w-4 h-4" />,
  promote: <Megaphone className="w-4 h-4" />,
  promote_item: <Megaphone className="w-4 h-4" />,
};

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { settings } = useAppSettings();
  const { user } = useAuth();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [actions, setActions] = useState<ItemAction[]>([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [actionsContact, setActionsContact] = useState<{ phone?: string | null; whatsapp?: string | null }>({});
  const [activeAction, setActiveAction] = useState<ItemAction | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const primaryColor = settings?.primary_color || "#0ea5e9";

  useEffect(() => {
    if (id) loadItem(Number(id));
    if (id) loadItemActions(Number(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!actionToast) return;
    const timer = window.setTimeout(() => setActionToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [actionToast]);

  const loadItem = async (itemId: number) => {
    try {
      setLoading(true);
      setError(null);

      const response: any = await apiService.getItem(itemId);

      // ✅ Handles: {data: {...}} OR {data:[...]} OR direct object
      const data = response?.data ?? response;
      const normalized: Item | null = Array.isArray(data) ? data[0] ?? null : data ?? null;

      setItem(normalized);
    } catch (err) {
      console.error(err);
      setError("Failed to load item details");
      setItem(null);
    } finally {
      setLoading(false);
    }
  };

  const loadItemActions = async (itemId: number) => {
    try {
      setActionsLoading(true);
      const response = await apiService.getItemActions(itemId);
      const data = response?.data ?? response;
      const actionList = data?.actions ?? data ?? [];
      setActions(Array.isArray(actionList) ? actionList : []);
      setActionsContact(data?.contact ?? {});
    } catch (err) {
      console.error(err);
      setActions([]);
    } finally {
      setActionsLoading(false);
    }
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(parseFloat(price));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const sortedActions = useMemo(() => {
    return [...actions].sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
  }, [actions]);

  const isOwner = useMemo(() => {
    const ownerId =
      item?.user?.id ??
      item?.user_id ??
      item?.shop?.user?.id ??
      item?.shop?.user_id ??
      null;
    return !!user && ownerId !== null && user.id === Number(ownerId);
  }, [item?.shop?.user?.id, item?.shop?.user_id, item?.user?.id, item?.user_id, user]);

  const visibleActions = useMemo(() => {
    if (!isOwner) return sortedActions;
    return sortedActions.filter((action) => OWNER_ACTION_CODES.has(action.code));
  }, [isOwner, sortedActions]);

  const getPendingLabel = (action: ItemAction) => {
    const status = (action.submission_status ?? "pending").toString().toLowerCase();
    return ACTION_STATUS_LABELS[status] ?? "View";
  };

  const getActionLabel = (action: ItemAction) => {
    if (action.pending) return getPendingLabel(action);
    if (PROMOTE_ACTION_CODES.has(action.code) && item?.is_promoted) return "Promoted";
    if (action.code === "price") return formatPrice(item?.price ?? "0");
    return action.label || "Action";
  };

  const getActionIcon = (action: ItemAction) => {
    const iconUrl = action.icon_url || (action as { iconUrl?: string | null }).iconUrl || null;
    const iconValue = action.icon || "";
    const iconKey = (iconValue || action.code || "").toLowerCase();

    if (iconUrl) {
      return <img src={iconUrl} alt="" className="w-4 h-4 object-contain" />;
    }

    if (iconValue && /^(https?:\/\/|\/)/i.test(iconValue)) {
      return <img src={iconValue} alt="" className="w-4 h-4 object-contain" />;
    }

    return ACTION_ICON_MAP[iconKey] || ACTION_ICON_MAP[action.code] || null;
  };

  const handleActionClick = (action: ItemAction) => {
    if (action.pending && action.submission_id) {
      navigate(`/submission-details/${action.submission_id}`);
      return;
    }

    if (PROMOTE_ACTION_CODES.has(action.code) && item?.is_promoted) {
      return;
    }

    if (!NON_FORM_ACTIONS.has(action.code)) {
      setActiveAction(action);
      setIsActionModalOpen(true);
      return;
    }

    const contactPhone = actionsContact.phone || contactMobile;
    const contactWhatsapp = actionsContact.whatsapp || actionsContact.phone || contactMobile;

    switch (action.code) {
      case "edit":
      case "edit_item":
        if (item?.id) {
          navigate(`/dashboard/items/create?edit=${item.id}`);
        }
        return;
      case "price": {
        const priceCard = document.getElementById("price-card");
        if (priceCard) {
          priceCard.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }
      case "chat":
        navigate("/dashboard/chat");
        return;
      case "call":
        if (contactPhone) window.location.href = `tel:${contactPhone}`;
        return;
      case "whatsapp": {
        if (!contactWhatsapp) return;
        const formatted = contactWhatsapp.replace(/[^\d]/g, "");
        window.open(`https://wa.me/${formatted}`, "_blank", "noopener,noreferrer");
        return;
      }
      case "navigate":
        if (item?.latitude && item?.longitude) {
          window.open(
            `https://www.google.com/maps?q=${item.latitude},${item.longitude}`,
            "_blank",
            "noopener,noreferrer"
          );
        }
        return;
      default:
        navigate("/action-form", { state: { item, action } });
    }
  };

  const handleCloseActionModal = () => {
    setIsActionModalOpen(false);
    setActiveAction(null);
  };

  const handleActionSuccess = () => {
    if (item?.id) loadItemActions(item.id);
    setActionToast("Submitted successfully.");
    handleCloseActionModal();
  };

  const getAllImages = () => {
    if (!item) return [];
    const images: string[] = [];

    if (item.feature_photo?.url) images.push(item.feature_photo.url);

    if (item.item_photos && Array.isArray(item.item_photos)) {
      item.item_photos.forEach((photo) => {
        if (photo.url && !images.includes(photo.url)) images.push(photo.url);
      });
    }

    return images;
  };

  const images = getAllImages();

  const nextImage = () => {
    if (!images.length) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (!images.length) return;
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleShare = async () => {
    if (navigator.share && item) {
      try {
        await navigator.share({
          title: item.name,
          text: `Check out ${item.name} for ${formatPrice(item.price)}`,
          url: window.location.href,
        });
      } catch {
        // cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied!");
    }
  };

  const handleVisitShop = () => {
    if (item?.shop?.id) navigate(`/shop/${item.shop.id}`);
  };

  // -----------------------------
  // Loading / Error / Empty
  // -----------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: primaryColor }} />
          <p className="text-slate-500 font-medium">Loading details...</p>
        </div>
        <Footer settings={settings ?? undefined} primaryColor={primaryColor} />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Item Not Found</h2>
            <p className="text-slate-500 mb-6">
              {error || "The item you requested could not be found."}
            </p>
            <button
              onClick={() => navigate("/")}
              className="w-full px-4 py-2 bg-slate-900 text-white rounded-xl"
            >
              Back to Home
            </button>
          </div>
        </div>
        <Footer settings={settings ?? undefined} primaryColor={primaryColor} />
      </div>
    );
  }

  // -----------------------------
  // SELLER LOGIC: Shop > User
  // -----------------------------
  const hasShop = !!item.shop;

  const sellerName = hasShop ? item.shop!.shop_name : item.user?.name || "Seller";
  const sellerPhoto = hasShop ? item.shop!.photo?.url : item.user?.profile_photo;

  const sellerLocation = hasShop
    ? item.shop!.address
    : item.user?.city || item.city || "Unknown Location";

  const dateToFormat = hasShop ? item.shop!.created_at : item.user?.member_since;
  const memberSince = dateToFormat ? formatDate(dateToFormat) : "Recently";

  const isVerified = hasShop ? item.shop!.is_verified : item.user?.verified || false;

  const contactMobile = item.user?.mobile || item.shop?.user?.mobile || "";
  const sellerType = hasShop ? item.shop!.shop_type || "Business" : "Individual";
  const categoryId = Number(item.category_id || 0);

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 flex flex-col">
      <SiteHeader />
      <Modal
        isOpen={isActionModalOpen}
        onClose={handleCloseActionModal}
        title={activeAction?.label || "Action Form"}
      >
        {activeAction ? (
          categoryId ? (
            <ActionFormRenderer
              itemId={item.id}
              categoryId={categoryId}
              actionCode={activeAction.code}
              onCancel={handleCloseActionModal}
              onSuccess={handleActionSuccess}
            />
          ) : (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              Missing category information for this item.
            </div>
          )
          ) : null}
      </Modal>
      {actionToast ? (
        <div className="fixed right-6 top-20 z-50 max-w-sm">
          <Toast message={actionToast} variant="success" />
        </div>
      ) : null}
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:text-slate-900" />
              </button>

              <div className="h-6 w-px bg-slate-200 hidden sm:block" />

              <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline font-medium text-sm">Home</span>
              </Link>

              <span className="text-slate-300 hidden sm:inline">/</span>

              <span className="hidden sm:inline text-sm font-medium text-slate-900 truncate max-w-[200px]">
                {item.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`p-2.5 rounded-full transition-all active:scale-95 ${
                  isWishlisted ? "bg-red-50 text-red-500" : "hover:bg-slate-100 text-slate-600"
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
              </button>

              <button
                onClick={handleShare}
                className="p-2.5 hover:bg-slate-100 rounded-full transition-all active:scale-95 text-slate-600"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-8 space-y-8">
            {/* Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-video sm:aspect-[16/10] bg-slate-100 rounded-3xl overflow-hidden shadow-sm border border-slate-100">
                {images.length > 0 ? (
                  <>
                    <img src={images[currentImageIndex]} alt={item.name} className="w-full h-full object-cover" />

                    {images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all active:scale-95"
                        >
                          <ChevronLeft className="w-5 h-5 text-slate-700" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all active:scale-95"
                        >
                          <ChevronRight className="w-5 h-5 text-slate-700" />
                        </button>
                      </>
                    )}

                    <div className="absolute top-4 left-4 flex gap-2">
                      {item.is_promoted && (
                        <span
                          className="px-3 py-1 text-xs font-bold text-white rounded-full shadow-sm uppercase tracking-wider"
                          style={{ backgroundColor: primaryColor }}
                        >
                          Featured
                        </span>
                      )}
                      <span
                        className={`px-3 py-1 text-xs font-bold text-white rounded-full shadow-sm uppercase tracking-wider ${
                          item.listing_type === "rent" ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                      >
                        {item.listing_type}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Tag className="w-12 h-12 opacity-20" />
                    <span className="text-sm font-medium">No images</span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden transition-all duration-200 ${
                        index === currentImageIndex ? "ring-2 ring-offset-2 opacity-100" : "opacity-70 hover:opacity-100"
                      }`}
                      style={
                        { "--tw-ring-color": primaryColor, "--tw-ring-offset-color": "#fff" } as React.CSSProperties
                      }
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile-only Price/Seller Block */}
            <div className="lg:hidden bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold" style={{ color: primaryColor }}>
                  {formatPrice(item.price)}
                </span>
                {item.listing_type === "rent" && item.rent_duration && (
                  <span className="text-lg text-slate-500 font-medium">/ {item.rent_duration}</span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-4">{item.name}</h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                    <Tag className="w-3.5 h-3.5" />
                    {item.category?.name} • {item.subcategory?.name}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {item.created_at ? formatDate(item.created_at) : "Recently"}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {item.city}, {item.state}
                  </span>
                </div>
              </div>

             {/* Dynamic Fields */}
{item.dynamic_fields && item.dynamic_fields.length > 0 && (
  <div className="mt-8">
    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">
      Specifications
    </h3>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {item.dynamic_fields.map((field) => (
        <div
          key={field.field_id}
          className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100"
        >
          {/* Icon (Left) */}
          <div className="shrink-0 flex items-center justify-center w-6 h-6">
            {field.image ? (
              <img 
                src={field.image} 
                alt="" 
                className="w-5 h-5 object-contain opacity-60" 
              />
            ) : (
              <Tag className="w-4 h-4 text-slate-400" />
            )}
          </div>

          {/* Label & Value (Same Line) */}
          <div className="flex items-center gap-2 text-sm overflow-hidden">
            <span className="font-medium text-slate-500 shrink-0">
              {field.label}:
            </span>
            <span className="font-bold text-slate-900 truncate">
              {field.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
<hr className="border-slate-100 my-8" />

<h2 className="text-lg font-bold text-slate-900 mb-4">Description</h2>
              <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                {item.description || "No description provided."}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-4 space-y-6">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Price Card */}
              <div
                id="price-card"
                className="hidden lg:block bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
              >
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-extrabold tracking-tight" style={{ color: primaryColor }}>
                    {formatPrice(item.price)}
                  </span>
                  {item.listing_type === "rent" && item.rent_duration && (
                    <span className="text-lg text-slate-400 font-medium">/ {item.rent_duration}</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900">Actions</h3>
                  {actionsLoading && (
                    <span className="text-xs text-slate-400">Loading...</span>
                  )}
                </div>

                {visibleActions.length === 0 && !actionsLoading ? (
                  <p className="text-sm text-slate-500">No actions available.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {visibleActions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleActionClick(action)}
                        disabled={PROMOTE_ACTION_CODES.has(action.code) && item?.is_promoted}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all border ${
                          action.pending
                            ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
                            : PROMOTE_ACTION_CODES.has(action.code) && item?.is_promoted
                              ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {getActionIcon(action) && (
                          <span className={action.pending ? "text-white" : "text-slate-500"}>
                            {getActionIcon(action)}
                          </span>
                        )}
                        <span>{getActionLabel(action)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Seller / Business Info Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                  {hasShop ? "Business Information" : "Seller Information"}
                </h3>

                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-50 border border-slate-100">
                      {sellerPhoto ? (
                        <img src={sellerPhoto} alt={sellerName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {hasShop ? <Store className="w-8 h-8 text-slate-300" /> : <User className="w-8 h-8 text-slate-300" />}
                        </div>
                      )}
                    </div>

                    {isVerified && (
                      <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full">
                        <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-50" />
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-lg text-slate-900 line-clamp-1" title={sellerName}>
                      {sellerName}
                    </h4>

                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                      {sellerType}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-slate-400" />
                    </div>
                    <span>
                      {hasShop ? "Created" : "Joined"} {memberSince}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="line-clamp-2" title={sellerLocation}>
                      {sellerLocation}
                    </span>
                  </div>
                </div>

                {/* Business Navigation Button */}
                {hasShop && (
                  <button
                    onClick={handleVisitShop}
                    className="w-full mt-6 flex items-center justify-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 py-3 rounded-xl border border-slate-100 transition-all"
                  >
                    <Store className="w-4 h-4" />
                    Visit Business Profile
                  </button>
                )}
              </div>

              {/* ✅ Item Location Card (separate) */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  Item Location
                </h3>

                <MapEmbed
                  title="Item Location"
                  latitude={item.latitude}
                  longitude={item.longitude}
                  heightClassName="h-56"
                  showFooter={true}
                  blockInteractions={true}
                  directionsLabel="Directions"
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer settings={settings ?? undefined} primaryColor={primaryColor} />
    </div>
  );
}

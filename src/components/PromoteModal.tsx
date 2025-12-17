// File: src/components/PromoteModal.tsx
import { useEffect, useState } from "react";
import { X, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { promotionService, type PromotionPlan } from "../services/promotion";
import { useAppSettings } from "../contexts/AppSettingsContext";

// 👇 If you don't have this icon, remove these 2 lines and the <img> usage
import coinIcon from "../assets/icons/coin.png";

interface PromoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: number;
  targetType: "item" | "shop";
  actionType: "activate" | "promote";
  onSuccess: () => void;
}

export default function PromoteModal({
  isOpen,
  onClose,
  targetId,
  targetType,
  actionType,
  onSuccess,
}: PromoteModalProps) {
  const { settings } = useAppSettings();
  const primaryColor = settings?.primary_color || "#0073f0";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [plans, setPlans] = useState<PromotionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setError(null);
    setPlans([]);
    setSelectedPlanId(null);

    // backend types you already use:
    // item_post / item_promotion / shop_post / shop_promotion
    const planApiType = `${targetType}_${actionType === "activate" ? "post" : "promotion"}`;

    promotionService
      .getPlansByType(planApiType)
      .then((data: any[]) => {
        const safeData = Array.isArray(data) ? data : [];
        const activePlans = safeData.filter(
          (p) => p?.is_active === true || p?.is_active === 1 || String(p?.is_active) === "true"
        );
        setPlans(activePlans);
        if (activePlans.length > 0) setSelectedPlanId(activePlans[0].id);
      })
      .catch(() => setError("Failed to load plans"))
      .finally(() => setLoading(false));
  }, [isOpen, targetType, actionType]);

  const handlePurchase = async () => {
    if (!selectedPlanId) return;

    setSubmitting(true);
    setError(null);

    try {
      await promotionService.purchasePlan({
        type: targetType, // ✅ helpful for backend validation
        plan_id: selectedPlanId,
        [targetType === "item" ? "item_id" : "shop_id"]: targetId,
      });

      onSuccess();
      onClose();
    } catch (e: any) {
      // ✅ IMPORTANT FIX: support both "clean Error" and axios errors
      const msg =
        e?.message ||
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Purchase failed.";

      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b flex justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900">
              {actionType === "activate" ? "Activate Listing" : "Boost Visibility"}
            </h3>
            <p className="text-xs text-slate-500">Select a plan to proceed</p>
          </div>

          <button type="button" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin text-slate-300" />
            </div>
          ) : error ? (
            <div className="text-red-600 bg-red-50 p-3 rounded text-sm flex gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center text-slate-500 py-4">
              No plans available for this action.
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map((p) => {
                const selected = selectedPlanId === p.id;
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`w-full flex justify-between items-center p-4 rounded-xl border-2 transition-all ${
                      selected
                        ? "bg-blue-50 border-blue-500"
                        : "bg-white border-slate-100 hover:bg-slate-50"
                    }`}
                    style={selected ? { borderColor: primaryColor } : {}}
                  >
                    <div className="text-left">
                      <div className="font-bold text-slate-800">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.duration} days validity</div>
                    </div>

                    <div className="font-bold text-slate-900 flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100">
                      <img
                        src={coinIcon}
                        className="w-4 h-4 object-contain"
                        alt=""
                        onError={(ev) => (ev.currentTarget.style.display = "none")}
                      />
                      {p.coins}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={handlePurchase}
            disabled={loading || submitting || !selectedPlanId}
            className="w-full mt-6 py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            {submitting ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {actionType === "activate" ? "Pay & Activate" : "Pay & Promote"}
          </button>
        </div>
      </div>
    </div>
  );
}

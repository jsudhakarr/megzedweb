import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles } from "lucide-react"; // Kept Loader for UI state
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { useAuth } from "../../contexts/AuthContext";
import { apiService } from "../../services/api";
import { getCoinPackages } from "../../services/coins";
import type { CoinPackage } from "../../types/wallet";
import type { PaymentGateway } from "../../types/payments";

// --- Asset Imports ---
// Adjust the path "../.." based on where this file is located inside src/
import coinIcon from "../../assets/icons/coin.png";
import moneyBagIcon from "../../assets/icons/money-bag.png";
import verifiedIcon from "../../assets/icons/storeverified.png";
import walletIcon from "../../assets/icons/wallet.png";
import bankIcon from "../../assets/bankicons/bank.jpg";
import phonepeIcon from "../../assets/bankicons/phonepe.png";
import razorpayIcon from "../../assets/bankicons/razorpay.png";
import upiIcon from "../../assets/bankicons/upi.png";

const toInt = (v: any, d = 0) => {
  if (v == null) return d;
  if (typeof v === "number") return Math.trunc(v);
  if (typeof v === "string") return parseInt(v, 10) || d;
  return d;
};
const toNum = (v: any, d = 0) => {
  if (v == null) return d;
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v) || d;
  return d;
};

declare global {
  interface Window {
    Razorpay?: any;
  }
}

type CheckoutStatus = "idle" | "creating" | "awaiting" | "confirming" | "success" | "error";

const allowedGatewayCodes = new Set([
  "razorpay",
  "cashfree",
  "payu",
  "phonepe",
  "phonepe_pg",
  "upi_manual",
  "bank_transfer",
  "manual",
]);

const gatewayLabelOverrides: Record<string, string> = {
  razorpay: "Razorpay",
  cashfree: "Cashfree",
  payu: "PayU",
  phonepe: "PhonePe",
  phonepe_pg: "PhonePe",
  upi_manual: "Manual (UPI)",
  bank_transfer: "Manual (Bank Transfer)",
  manual: "Manual (UPI / Bank)",
};

const gatewayIconMap: Record<string, { src: string; alt: string }> = {
  razorpay: { src: razorpayIcon, alt: "Razorpay" },
  phonepe: { src: phonepeIcon, alt: "PhonePe" },
  phonepe_pg: { src: phonepeIcon, alt: "PhonePe" },
  upi_manual: { src: upiIcon, alt: "UPI" },
  manual: { src: upiIcon, alt: "UPI" },
  bank_transfer: { src: bankIcon, alt: "Bank transfer" },
  cashfree: { src: bankIcon, alt: "Cashfree" },
  payu: { src: bankIcon, alt: "PayU" },
};

export default function CoinPackages() {
  const { settings } = useAppSettings();
  const { token, loading: authLoading } = useAuth();
  const primaryColor = settings?.primary_color || "#0073f0";

  const [loading, setLoading] = useState(true);
  const [packs, setPacks] = useState<CoinPackage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [gatewaysLoading, setGatewaysLoading] = useState(false);
  const [gatewaysError, setGatewaysError] = useState<string | null>(null);
  const [selectedPack, setSelectedPack] = useState<CoinPackage | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>("idle");
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [intentData, setIntentData] = useState<Record<string, unknown> | null>(null);
  const [showGatewayModal, setShowGatewayModal] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getCoinPackages();
      setPacks(list.filter((p) => !!p.is_active));
    } catch (e: any) {
      setError(e?.message || "Failed to load coin packages");
    } finally {
      setLoading(false);
    }
  };

  const loadGateways = async () => {
    setGatewaysLoading(true);
    setGatewaysError(null);
    try {
      const list = await apiService.getPaymentGateways("web");
      setGateways(list);
    } catch (e: any) {
      setGatewaysError(e?.message || "Failed to load payment gateways");
    } finally {
      setGatewaysLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadGateways();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const availableGateways = useMemo(() => {
    return gateways
      .filter((gateway) => gateway.code !== "google_play")
      .filter((gateway) => allowedGatewayCodes.has(gateway.code))
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [gateways]);

  const resetCheckoutState = () => {
    setSelectedGateway(null);
    setCheckoutStatus("idle");
    setCheckoutMessage(null);
    setIntentData(null);
  };

  const handleOpenModal = (pack: CoinPackage) => {
    setSelectedPack(pack);
    resetCheckoutState();
    setShowGatewayModal(true);
    if (!token && !authLoading) {
      setCheckoutStatus("error");
      setCheckoutMessage("Please sign in to continue with payment.");
    }
    if (!gatewaysLoading && gateways.length === 0 && !gatewaysError) {
      loadGateways();
    }
  };

  const handleCloseModal = () => {
    setShowGatewayModal(false);
    setSelectedPack(null);
    resetCheckoutState();
  };

  const formatGatewayLabel = (gateway: PaymentGateway) =>
    gatewayLabelOverrides[gateway.code] || gateway.name || gateway.code;

  const getGatewayIcon = (gateway: PaymentGateway) => gatewayIconMap[gateway.code];
  const getRazorpayKey = (
    gateway: PaymentGateway,
    intent: Record<string, unknown>
  ): string | undefined => {
    const publicConfig = gateway.public_config as Record<string, string | undefined> | null;
    return (
      (intent.razorpay_key_id as string | undefined) ||
      (intent.key_id as string | undefined) ||
      (intent.key as string | undefined) ||
      (intent.public_key as string | undefined) ||
      publicConfig?.key_id ||
      publicConfig?.key ||
      publicConfig?.public_key
    );
  };

  const startCheckout = async (gateway: PaymentGateway, pack: CoinPackage) => {
    setSelectedGateway(gateway);
    if (!token) {
      if (authLoading) {
        setCheckoutStatus("idle");
        setCheckoutMessage("Finishing sign-in. Please try again in a moment.");
      } else {
        setCheckoutStatus("error");
        setCheckoutMessage("Please sign in to continue with payment.");
      }
      return;
    }

    setCheckoutStatus("creating");
    setCheckoutMessage(null);
    try {
      const amount = toNum(pack.price);
      const intent = await apiService.initPayment({
        gateway_code: gateway.code,
        package_id: pack.id,
        platform: "web",
      });
      const currency = (
        (intent as any).currency ||
        pack.currency ||
        gateway.currency ||
        "INR"
      ).toString();
      setIntentData(intent as Record<string, unknown>);

      if (gateway.code === "razorpay") {
        const razorpayConstructor = window.Razorpay;
        if (!razorpayConstructor) {
          throw new Error("Razorpay SDK not loaded. Please refresh the page.");
        }

        const razorpayKey = getRazorpayKey(gateway, intent as Record<string, unknown>);
        if (!razorpayKey) {
          setCheckoutStatus("error");
          setCheckoutMessage("Razorpay is not configured. Please contact admin.");
          return;
        }

        const options = {
          key: razorpayKey,
          amount:
            (intent as any).amount_paise ??
            (intent as any).amount ??
            Math.round(amount * 100),
          currency,
          name: "Megzed",
          description: pack.name,
          order_id:
            (intent as any).razorpay_order_id ||
            (intent as any).order_id ||
            (intent as any).orderId,
          handler: async (response: any) => {
            setCheckoutStatus("confirming");
            try {
              await apiService.confirmPayment({
                gateway_code: gateway.code,
                transaction_id: (intent as any).transaction_id,
                payload: response,
              });
              setCheckoutStatus("success");
              setCheckoutMessage("Payment confirmed. Coins will be credited shortly.");
            } catch (confirmError: any) {
              setCheckoutStatus("error");
              setCheckoutMessage(
                confirmError?.message || "Payment confirmation failed. Please try again."
              );
            }
          },
          modal: {
            ondismiss: () => {
              setCheckoutStatus("awaiting");
              setCheckoutMessage("Checkout closed. You can try again or check status.");
            },
          },
          prefill: (intent as any).prefill,
        };

        const checkout = new razorpayConstructor(options);
        checkout.open();
        setCheckoutStatus("awaiting");
        setCheckoutMessage("Complete payment in the Razorpay checkout window.");
      } else if (
        gateway.code === "upi_manual" ||
        gateway.code === "bank_transfer" ||
        gateway.code === "manual"
      ) {
        setCheckoutStatus("awaiting");
        setCheckoutMessage(
          ((intent as any).instructions as string | undefined) ||
            gateway.instructions ||
            "Please follow the instructions to complete the manual payment."
        );
      } else {
        const checkoutUrl =
          (intent as any).checkout_url ||
          (intent as any).payment_url ||
          (intent as any).redirect_url;
        if (checkoutUrl) {
          window.open(checkoutUrl as string, "_blank", "noopener,noreferrer");
        }
        setCheckoutStatus("awaiting");
        setCheckoutMessage(
          checkoutUrl
            ? "Complete the payment in the opened tab. We will confirm it when the gateway sends the webhook."
            : "Payment initiated. We will confirm it when the gateway sends the webhook."
        );
      }
    } catch (checkoutError: any) {
      setCheckoutStatus("error");
      const rawMessage = checkoutError?.message || "Unable to start checkout.";
      const friendlyMessage =
        typeof rawMessage === "string" && rawMessage.toLowerCase().includes("unauthenticated")
          ? "Please sign in to continue with payment."
          : rawMessage;
      setCheckoutMessage(friendlyMessage);
    }
  };

  const handleCheckStatus = async () => {
    if (!selectedGateway || !intentData) return;
    if (!token) {
      setCheckoutStatus("error");
      setCheckoutMessage("Please sign in to check payment status.");
      return;
    }
    setCheckoutStatus("confirming");
    setCheckoutMessage(null);
    try {
      await apiService.confirmPayment({
        gateway_code: selectedGateway.code,
        transaction_id: intentData.transaction_id as string | number,
        payload: {},
      });
      setCheckoutStatus("success");
      setCheckoutMessage("Payment confirmed. Coins will be credited shortly.");
    } catch (confirmError: any) {
      setCheckoutStatus("awaiting");
      setCheckoutMessage(
        confirmError?.message || "Payment not confirmed yet. Please try again later."
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200"
            style={{ backgroundColor: `${primaryColor}10` }}
          >
            {/* Money Bag Icon for Store Header */}
            <img 
              src={moneyBagIcon} 
              alt="Store" 
              className="w-10 h-10 object-contain drop-shadow-sm" 
            />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Coin Store
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Top up your wallet to unlock premium features
            </p>
          </div>
        </div>
        
        {/* Trust Badge using storeverified.png */}
        <div className="hidden md:flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-50 border border-slate-100 shadow-sm">
          <img src={verifiedIcon} alt="Verified" className="w-5 h-5 object-contain" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
            Secure Payment Gateway
          </span>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
          <p className="font-medium animate-pulse">Fetching best offers...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-50 border border-red-100 text-center">
          <p className="text-red-600 font-bold mb-2">Something went wrong</p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button 
            onClick={load}
            className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition"
          >
            Try Again
          </button>
        </div>
      ) : packs.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400">
          No packages available at the moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {packs.map((p) => {
            const coins = toInt(p.coins);
            const price = toNum(p.price);
            const currency = (p.currency || "INR").toString();
            const isHighValue = price > 1000; 

            return (
              <div
                key={String(p.id)}
                className="group relative bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
              >
                {/* Decorative Gradient Background */}
                <div 
                  className="absolute top-0 left-0 w-full h-32 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                  style={{ background: `linear-gradient(to bottom, ${primaryColor}, transparent)` }}
                />

                {/* Top Section: Icon & Validity */}
                <div className="relative z-10 flex justify-between items-start mb-4">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-300 group-hover:bg-white bg-slate-50"
                  >
                    {/* Coin Icon for Packages */}
                    <img 
                        src={coinIcon} 
                        alt="Coins" 
                        className={`object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-110 ${isHighValue ? 'w-9 h-9' : 'w-8 h-8'}`} 
                    />
                  </div>
                  {p.validity_days ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-1 rounded-md">
                       {toInt(p.validity_days)} Days
                    </span>
                  ) : null}
                </div>

                {/* Main Value */}
                <div className="relative z-10 mb-2">
                   <div className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      You Get {isHighValue && <Sparkles className="w-3 h-3 text-amber-400" />}
                   </div>
                   <div className="text-4xl font-black text-slate-900 flex items-baseline gap-1">
                      {coins}
                      <span className="text-lg font-bold text-slate-500">Coins</span>
                   </div>
                </div>

                <div className="relative z-10 mb-6 min-h-[40px]">
                    <h3 className="text-lg font-bold text-slate-700 leading-tight">
                        {p.name}
                    </h3>
                    {p.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {p.description}
                        </p>
                    )}
                </div>

                {/* Divider */}
                <div className="relative z-10 border-t border-slate-100 my-auto"></div>

                {/* Bottom Action Section */}
                <div className="relative z-10 pt-6 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                        handleOpenModal(p);
                    }}
                    className="w-full relative overflow-hidden rounded-xl py-3.5 px-4 flex items-center justify-between group-active:scale-[0.98] transition-all duration-200"
                    style={{ 
                        backgroundColor: primaryColor,
                        boxShadow: `0 8px 20px -6px ${primaryColor}50`
                    }}
                  >
                    <span className="text-white/90 text-sm font-medium flex items-center gap-2">
                        {/* Wallet Icon for Button */}
                        <img src={walletIcon} className="w-5 h-5 invert brightness-0 opacity-90" alt="Buy" />
                        Buy Now
                    </span>
                    <span className="bg-white/20 px-3 py-1 rounded-lg text-white font-bold text-sm">
                        {currency} {price}
                    </span>
                  </button>
                  
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showGatewayModal && selectedPack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Choose a payment method</h2>
                <p className="text-sm text-slate-500">
                  {selectedPack.name} · {selectedPack.currency || "INR"} {toNum(selectedPack.price)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="px-6 py-5">
              {authLoading && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  Preparing your secure checkout...
                </div>
              )}
              {!token && !authLoading && (
                <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700">
                  Please sign in to continue with payment.
                </div>
              )}
              {checkoutMessage && !selectedGateway && (
                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {checkoutMessage}
                </div>
              )}

              {gatewaysLoading ? (
                <div className="flex items-center gap-3 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading payment gateways...
                </div>
              ) : gatewaysError ? (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {gatewaysError}
                </div>
              ) : availableGateways.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  No payment methods are currently available.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {availableGateways.map((gateway) => (
                    <button
                      key={gateway.code}
                      type="button"
                      onClick={() => startCheckout(gateway, selectedPack)}
                      disabled={authLoading || !token}
                      className={`rounded-xl border border-slate-200 px-4 py-3 text-left transition ${
                        authLoading || !token
                          ? "cursor-not-allowed opacity-60"
                          : "hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                        {getGatewayIcon(gateway) && (
                          <img
                            src={getGatewayIcon(gateway)?.src}
                            alt={getGatewayIcon(gateway)?.alt}
                            className="h-7 w-7 rounded-full border border-slate-200 bg-white object-contain p-1"
                          />
                        )}
                        <span>{formatGatewayLabel(gateway)}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {gateway.mode ? `Mode: ${gateway.mode}` : "Online checkout"}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedGateway && (
                <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getGatewayIcon(selectedGateway) && (
                        <img
                          src={getGatewayIcon(selectedGateway)?.src}
                          alt={getGatewayIcon(selectedGateway)?.alt}
                          className="h-8 w-8 rounded-full border border-slate-200 bg-white object-contain p-1"
                        />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {formatGatewayLabel(selectedGateway)}
                        </p>
                      <p className="text-xs text-slate-500">
                        Status: {checkoutStatus === "idle" ? "Ready" : checkoutStatus}
                      </p>
                      </div>
                    </div>
                    {checkoutStatus === "awaiting" && (
                      <button
                        type="button"
                        onClick={handleCheckStatus}
                        className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-100"
                      >
                        Check status
                      </button>
                    )}
                  </div>

                  {selectedGateway.instructions && (
                    <p className="mt-3 text-xs text-slate-500">
                      {selectedGateway.instructions}
                    </p>
                  )}

                  {checkoutMessage && (
                    <p className="mt-3 text-sm text-slate-600">{checkoutMessage}</p>
                  )}

                  {checkoutStatus === "error" && (
                    <button
                      type="button"
                      onClick={() => startCheckout(selectedGateway, selectedPack)}
                      className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      Try again
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

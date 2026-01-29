import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { useAuth } from "../../contexts/AuthContext";
import { apiService } from "../../services/api";
import { getCoinPackages } from "../../services/coins";
import type { CoinPackage } from "../../types/wallet";
import type { PaymentGateway } from "../../types/payments";

// --- Asset Imports ---
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

const isDev = Boolean(import.meta.env?.DEV);

declare global {
  interface Window {
    Razorpay?: any;
  }
}

type CheckoutStatus =
  | "idle"
  | "creating"
  | "awaiting"
  | "confirming"
  | "success"
  | "error";

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

const loadRazorpayCheckoutScript = () =>
  new Promise<void>((resolve, reject) => {
    if (window.Razorpay) return resolve();

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-razorpay-checkout="true"]'
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Razorpay SDK failed to load.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.setAttribute("data-razorpay-checkout", "true");
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay SDK failed to load."));
    document.body.appendChild(script);
  });

function getApiErrorMessage(err: any, fallback: string) {
  const data = err?.response?.data ?? err?.data;
  const msg =
    data?.message ||
    err?.message ||
    (typeof data === "string" ? data : null) ||
    null;

  // Laravel validation { errors: { field: ["msg"] } }
  const errors = data?.errors;
  if (errors && typeof errors === "object") {
    const firstKey = Object.keys(errors)[0];
    const firstVal = firstKey ? errors[firstKey] : null;
    if (Array.isArray(firstVal) && typeof firstVal[0] === "string") {
      return firstVal[0];
    }
  }

  if (typeof msg === "string" && msg.trim()) return msg;

  // unauthenticated
  if (typeof err?.message === "string" && err.message.toLowerCase().includes("unauthenticated")) {
    return "Please sign in to continue with payment.";
  }

  return fallback;
}

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

  // init response saved here
  const [intentData, setIntentData] = useState<Record<string, any> | null>(null);

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
      .filter((g) => g.code !== "google_play")
      .filter((g) => allowedGatewayCodes.has(g.code))
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

  const startCheckout = async (gateway: PaymentGateway, pack: CoinPackage) => {
    setSelectedGateway(gateway);

    if (!token) {
      setCheckoutStatus("error");
      setCheckoutMessage(authLoading ? "Finishing sign-in. Try again." : "Please sign in to continue.");
      return;
    }

    setCheckoutStatus("creating");
    setCheckoutMessage(null);

    try {
      // 1) init payment
      const intent = (await apiService.initPayment({
        gateway_code: gateway.code,
        package_id: pack.id,
        platform: "web",
      })) as Record<string, any>;

      if (isDev) console.log("PAYMENT INIT:", intent);

      setIntentData(intent);

      // 2) Razorpay web checkout
      if (gateway.code === "razorpay") {
        await loadRazorpayCheckoutScript();

        const RazorpayCtor = window.Razorpay;
        if (!RazorpayCtor) throw new Error("Razorpay SDK not available.");

        const razorpayKey = intent?.razorpay_key_id;
        const razorpayOrderId = intent?.razorpay_order_id || intent?.gateway_order_id;

        if (!razorpayKey || !razorpayOrderId) {
          setCheckoutStatus("error");
          setCheckoutMessage("Razorpay is not configured. Please contact support.");
          return;
        }

        const amountPaise = toNum(intent?.amount_paise);
        const currency = (intent?.currency || "INR")?.toString();

        const options = {
          key: razorpayKey,
          amount: amountPaise,
          currency,
          name: "Megzed",
          description: pack.name,
          order_id: razorpayOrderId,

          handler: async (response: any) => {
            setCheckoutStatus("confirming");
            setCheckoutMessage(null);

            const finalOrderId = response?.razorpay_order_id || razorpayOrderId;

            try {
              // ✅ IMPORTANT:
              // Send razorpay fields as payload (apiService.confirmPayment FLATTENS them to top-level)
              await apiService.confirmPayment({
                gateway_code: "razorpay",
                transaction_id: intent?.transaction_id,
                payload: {
                  razorpay_payment_id: response?.razorpay_payment_id,
                  razorpay_order_id: finalOrderId,
                  razorpay_signature: response?.razorpay_signature,
                  // optional extra (some backends like it):
                  gateway_order_id: finalOrderId,
                },
              });

              setCheckoutStatus("success");
              setCheckoutMessage("Payment confirmed. Coins will be credited shortly.");
            } catch (confirmError: any) {
              const msg = getApiErrorMessage(confirmError, "Payment confirmation failed. Please try again.");
              setCheckoutStatus("error");
              setCheckoutMessage(msg);
            }
          },

          modal: {
            ondismiss: () => {
              setCheckoutStatus("awaiting");
              setCheckoutMessage("Checkout closed. You can try again.");
            },
          },

          prefill: intent?.prefill,
        };

        const checkout = new RazorpayCtor(options);
        checkout.open();

        setCheckoutStatus("awaiting");
        setCheckoutMessage("Complete payment in the Razorpay checkout window.");
        return;
      }

      // 3) Manual gateways
      if (gateway.code === "upi_manual" || gateway.code === "bank_transfer" || gateway.code === "manual") {
        setCheckoutStatus("awaiting");
        setCheckoutMessage(
          intent?.instructions ||
            gateway.instructions ||
            "Please follow the instructions to complete the manual payment."
        );
        return;
      }

      // 4) Other redirect gateways
      const checkoutUrl = intent?.checkout_url || intent?.payment_url || intent?.redirect_url;
      if (checkoutUrl) window.open(checkoutUrl, "_blank", "noopener,noreferrer");

      setCheckoutStatus("awaiting");
      setCheckoutMessage(
        checkoutUrl
          ? "Complete the payment in the opened tab. We will confirm it when the gateway sends the webhook."
          : "Payment initiated. We will confirm it when the gateway sends the webhook."
      );
    } catch (err: any) {
      const msg = getApiErrorMessage(err, "Unable to start checkout. Please try again.");
      setCheckoutStatus("error");
      setCheckoutMessage(msg);
      if (isDev) console.error("Payment API error:", err);
    }
  };

  // For non-razorpay gateways / webhook based
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
        transaction_id: intentData.transaction_id,
        payload: {},
      });

      setCheckoutStatus("success");
      setCheckoutMessage("Payment confirmed. Coins will be credited shortly.");
    } catch (err: any) {
      setCheckoutStatus("awaiting");
      setCheckoutMessage(getApiErrorMessage(err, "Payment not confirmed yet. Please try again later."));
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
            <img src={moneyBagIcon} alt="Store" className="w-10 h-10 object-contain drop-shadow-sm" />
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
                <div
                  className="absolute top-0 left-0 w-full h-32 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                  style={{ background: `linear-gradient(to bottom, ${primaryColor}, transparent)` }}
                />

                <div className="relative z-10 flex justify-between items-start mb-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-300 group-hover:bg-white bg-slate-50">
                    <img
                      src={coinIcon}
                      alt="Coins"
                      className={`object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-110 ${
                        isHighValue ? "w-9 h-9" : "w-8 h-8"
                      }`}
                    />
                  </div>
                  {p.validity_days ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-1 rounded-md">
                      {toInt(p.validity_days)} Days
                    </span>
                  ) : null}
                </div>

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
                  <h3 className="text-lg font-bold text-slate-700 leading-tight">{p.name}</h3>
                  {p.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                  )}
                </div>

                <div className="relative z-10 border-t border-slate-100 my-auto"></div>

                <div className="relative z-10 pt-6 mt-4">
                  <button
                    type="button"
                    onClick={() => handleOpenModal(p)}
                    className="w-full relative overflow-hidden rounded-xl py-3.5 px-4 flex items-center justify-between group-active:scale-[0.98] transition-all duration-200"
                    style={{
                      backgroundColor: primaryColor,
                      boxShadow: `0 8px 20px -6px ${primaryColor}50`,
                    }}
                  >
                    <span className="text-white/90 text-sm font-medium flex items-center gap-2">
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
                    <p className="mt-3 text-xs text-slate-500">{selectedGateway.instructions}</p>
                  )}

                  {checkoutMessage && <p className="mt-3 text-sm text-slate-600">{checkoutMessage}</p>}

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

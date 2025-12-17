import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react"; // Kept Loader for UI state
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { getCoinPackages } from "../../services/coins";
import type { CoinPackage } from "../../types/wallet";

// --- Asset Imports ---
// Adjust the path "../.." based on where this file is located inside src/
import coinIcon from "../../assets/icons/coin.png";
import moneyBagIcon from "../../assets/icons/money-bag.png";
import verifiedIcon from "../../assets/icons/storeverified.png";
import walletIcon from "../../assets/icons/wallet.png";

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

export default function CoinPackages() {
  const { settings } = useAppSettings();
  const primaryColor = settings?.primary_color || "#0073f0";

  const [loading, setLoading] = useState(true);
  const [packs, setPacks] = useState<CoinPackage[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                        alert("Integrate purchase flow here");
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
    </div>
  );
}
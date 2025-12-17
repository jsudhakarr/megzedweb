import { useEffect, useMemo, useState } from "react";
import { 
  Loader2, 
  RefreshCcw, 
  ArrowDownLeft, 
  ArrowUpRight, 
  History, 
  TrendingUp 
} from "lucide-react";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { getWalletBalance, getWalletHistory } from "../../services/wallet";
import type { WalletTransaction } from "../../types/wallet";

// --- Asset Imports ---
// Adjust paths based on your file structure
import coinIcon from "../../assets/icons/coin.png";
import walletIcon from "../../assets/icons/wallet.png";

const toInt = (v: any, d = 0) => {
  if (v == null) return d;
  if (typeof v === "number") return Math.trunc(v);
  if (typeof v === "string") return parseInt(v, 10) || d;
  return d;
};

function typeLabel(t: string) {
  switch (t) {
    case "purchase": return "Coins Purchased";
    case "post_item": return "Item Posting Fee";
    case "promote_item": return "Item Promotion";
    case "post_shop": return "Shop Listing Fee";
    case "promote_shop": return "Shop Promotion";
    case "bonus": return "System Bonus";
    case "mobile_view": return "Contact View Unlock";
    default: return (t || "").split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }
}

export default function Wallet() {
  const { settings } = useAppSettings();
  const primaryColor = settings?.primary_color || "#0073f0";

  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [tx, setTx] = useState<WalletTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const w = await getWalletBalance();
      const t = await getWalletHistory();
      setBalance(toInt(w.coins_balance));
      setTx(t);
    } catch (e: any) {
      setError(e?.message || "Failed to load wallet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recent = useMemo(() => tx.slice(0, 50), [tx]);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8">
      
      {/* --- Header Section --- */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center p-3">
             <img src={walletIcon} alt="Wallet" className="w-full h-full object-contain opacity-90" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Wallet</h1>
            <p className="text-sm text-slate-500 font-medium">Manage your coins & transactions</p>
          </div>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="group p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all active:scale-95 disabled:opacity-50"
          title="Refresh Wallet"
        >
          <RefreshCcw className={`w-5 h-5 ${loading ? "animate-spin text-slate-400" : "group-hover:text-slate-900"}`} />
        </button>
      </div>

      {/* --- Balance Card --- */}
      <div 
        className="relative overflow-hidden rounded-[2rem] p-8 shadow-xl shadow-slate-200 mb-10 text-white"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
        }}
      >
        {/* Background Patterns */}
        <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-1/4 -translate-y-1/4">
             <img src={coinIcon} className="w-64 h-64 grayscale brightness-200" alt="" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-white/80 font-semibold mb-2 text-sm uppercase tracking-wider">
               <TrendingUp className="w-4 h-4" /> Available Balance
            </div>
            
            {loading ? (
              <div className="h-16 w-48 bg-white/20 animate-pulse rounded-xl" />
            ) : (
              <div className="flex items-center gap-4">
                 <img src={coinIcon} alt="Coins" className="w-16 h-16 drop-shadow-md" />
                 <span className="text-6xl font-black tracking-tighter drop-shadow-sm">
                   {balance.toLocaleString()}
                 </span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-start md:items-end gap-1 opacity-90">
             <div className="text-xs font-medium text-white/70">Wallet ID</div>
             <div className="font-mono text-lg tracking-widest">•••• •••• •••• {Math.floor(Math.random() * 9000) + 1000}</div>
          </div>
        </div>
      </div>

      {/* --- Transactions Section --- */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
             <History className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Transaction History</h2>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm font-medium">Updating records...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
             <div className="text-red-500 font-bold mb-2">Error loading history</div>
             <div className="text-slate-500 text-sm">{error}</div>
          </div>
        ) : recent.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
               <History className="w-8 h-8 text-slate-300" />
             </div>
             <p>No transactions found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recent.map((t) => {
              const change = toInt(t.change);
              const after = toInt(t.balance_after);
              const isPlus = change > 0;
              const meta = (t.meta || {}) as any;

              const title =
                meta?.plan_name ||
                meta?.item_name ||
                meta?.shop_name ||
                typeLabel(t.type);

              const sub =
                meta?.reason ||
                meta?.plan_type ||
                meta?.item_uid ||
                meta?.shop_uid ||
                null;

              return (
                <div 
                  key={String(t.id)} 
                  className="group hover:bg-slate-50/80 transition-colors p-4 sm:px-6 flex items-center justify-between gap-4"
                >
                  {/* Left: Icon & Details */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                        isPlus 
                          ? "bg-green-50 border-green-100 text-green-600" 
                          : "bg-red-50 border-red-100 text-red-600"
                      }`}
                    >
                      {isPlus ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 text-sm sm:text-base truncate">
                        {title}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                         <span>{sub ? sub : typeLabel(t.type)}</span>
                         {t.created_at && (
                           <>
                             <span className="w-1 h-1 rounded-full bg-slate-300" />
                             <span>{new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}</span>
                           </>
                         )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Balance */}
                  <div className="text-right shrink-0">
                    <div className={`text-base sm:text-lg font-extrabold ${isPlus ? "text-green-600" : "text-slate-800"}`}>
                      {isPlus ? "+" : ""}{change}
                    </div>
                    <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Bal: {after}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
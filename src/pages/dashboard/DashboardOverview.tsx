import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { apiService } from "../../services/api";
import {
  ShoppingBag,
  Store,
  Heart,
  Calendar,
  DollarSign,
  User as UserIcon,
  TrendingUp,
  Bell,
  MessageCircle,
  Wallet,
  Coins,
} from "lucide-react";

export default function DashboardOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useAppSettings();
  const primaryColor = settings?.primary_color || "#0073f0";

  const [itemsCount, setItemsCount] = useState(0);
  const [shopsCount, setShopsCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [bookingsCount, setBookingsCount] = useState(0);

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // ✅ NEW: wallet + history
  const [coinsBalance, setCoinsBalance] = useState(0);
  const [walletTxCount, setWalletTxCount] = useState(0);

  const [loading, setLoading] = useState(true);

  const safeLen = (v: any) => (Array.isArray(v) ? v.length : 0);
  const toInt = (v: any, d = 0) => {
    if (v === null || v === undefined) return d;
    if (typeof v === "number") return Math.trunc(v);
    if (typeof v === "string") return parseInt(v, 10) || d;
    return d;
  };

  useEffect(() => {
    let alive = true;

    const fetchUserData = async () => {
      setLoading(true);

      try {
        const results = await Promise.allSettled([
          apiService.getUserItems(),
          apiService.getUserShops(),
          apiService.getUserFavorites(),
          apiService.getUserBookings(),

          apiService.getUnreadNotificationCount(),
          apiService.getConversations(),

          // ✅ wallet
          apiService.getWallet(),
          apiService.getWalletTransactions(),
        ]);

        if (!alive) return;

        // 1. Items
        const items = results[0].status === "fulfilled" ? results[0].value : [];
        setItemsCount(safeLen(items));

        // 2. Shops
        const shops = results[1].status === "fulfilled" ? results[1].value : [];
        setShopsCount(safeLen(shops));

        // 3. Favorites
        const favorites = results[2].status === "fulfilled" ? results[2].value : [];
        setFavoritesCount(safeLen(favorites));

        // 4. Bookings
        const bookings = results[3].status === "fulfilled" ? results[3].value : [];
        setBookingsCount(safeLen(bookings));

        // 5. Notifications (Handle { count: 5 } or plain number)
        const notifData = results[4].status === "fulfilled" ? results[4].value : 0;
        setUnreadNotifications(
          typeof notifData === "object" ? notifData.count || 0 : Number(notifData) || 0
        );

        // 6. Chat unread total
        const conversations = results[5].status === "fulfilled" ? results[5].value : [];
        const chats = Array.isArray(conversations) ? conversations : (conversations as any).data || [];
        const totalUnreadMessages = Array.isArray(chats)
          ? chats.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0)
          : 0;
        setUnreadMessages(totalUnreadMessages);

        // 7. Wallet balance
        const wallet = results[6].status === "fulfilled" ? results[6].value : null;
        const w = (wallet as any)?.data ?? wallet; // supports either shape
        setCoinsBalance(toInt(w?.coins_balance, 0));

        // 8. Wallet tx count
        const tx = results[7].status === "fulfilled" ? results[7].value : [];
        const txList = Array.isArray(tx) ? tx : (tx as any)?.data || [];
        setWalletTxCount(Array.isArray(txList) ? txList.length : 0);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        if (!alive) return;

        setItemsCount(0);
        setShopsCount(0);
        setFavoritesCount(0);
        setBookingsCount(0);
        setUnreadNotifications(0);
        setUnreadMessages(0);
        setCoinsBalance(0);
        setWalletTxCount(0);
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchUserData();

    return () => {
      alive = false;
    };
  }, []);

  const stats = [
    {
      title: "Profile Status",
      value: user?.is_verified ? "Verified" : "Not Verified",
      subtitle: `KYC: ${user?.kyc_status || "pending"}`,
      icon: <UserIcon className="w-6 h-6" />,
      bgColor: `${primaryColor}20`,
      iconColor: primaryColor,
      onClick: () => navigate("/dashboard/profile"),
    },

    // ✅ Wallet coins
    {
      title: "Wallet Coins",
      value: loading ? "..." : String(coinsBalance),
      subtitle: "Available balance",
      icon: <Wallet className="w-6 h-6" />,
      bgColor: "#ecfeff",
      iconColor: "#0891b2",
      onClick: () => navigate("/dashboard/wallet"),
    },

    // ✅ Wallet history count
    {
      title: "Wallet History",
      value: loading ? "..." : String(walletTxCount),
      subtitle: "Transactions",
      icon: <TrendingUp className="w-6 h-6" />,
      bgColor: "#f1f5f9",
      iconColor: "#0f172a",
      onClick: () => navigate("/dashboard/wallet"),
    },

    // ✅ Coin Packages
    {
      title: "Buy Coins",
      value: "Store",
      subtitle: "View packages",
      icon: <Coins className="w-6 h-6" />,
      bgColor: "#fff7ed",
      iconColor: "#f97316",
      onClick: () => navigate("/dashboard/coins"),
    },

    {
      title: "Notifications",
      value: loading ? "..." : String(unreadNotifications),
      subtitle: "Unread alerts",
      icon: <Bell className="w-6 h-6" />,
      bgColor: "#fff7ed",
      iconColor: "#f97316",
      onClick: () => navigate("/dashboard/notifications"),
    },

    {
      title: "Messages",
      value: loading ? "..." : String(unreadMessages),
      subtitle: "Unread chats",
      icon: <MessageCircle className="w-6 h-6" />,
      bgColor: "#eff6ff",
      iconColor: "#3b82f6",
      onClick: () => navigate("/dashboard/chat"),
    },

    {
      title: "My Items",
      value: loading ? "..." : String(itemsCount),
      subtitle: "Active listings",
      icon: <ShoppingBag className="w-6 h-6" />,
      bgColor: "#dcfce7",
      iconColor: "#16a34a",
      onClick: () => navigate("/dashboard/items"),
    },
    {
      title: "My Shops",
      value: loading ? "..." : String(shopsCount),
      subtitle: "Active shops",
      icon: <Store className="w-6 h-6" />,
      bgColor: "#fed7aa",
      iconColor: "#ea580c",
      onClick: () => navigate("/dashboard/shops"),
    },
    {
      title: "Favorites",
      value: loading ? "..." : String(favoritesCount),
      subtitle: "Saved items",
      icon: <Heart className="w-6 h-6" />,
      bgColor: "#fecdd3",
      iconColor: "#e11d48",
      onClick: () => navigate("/dashboard/likes"),
    },
    {
      title: "Bookings",
      value: loading ? "..." : String(bookingsCount),
      subtitle: "Total bookings",
      icon: <Calendar className="w-6 h-6" />,
      bgColor: "#ddd6fe",
      iconColor: "#7c3aed",
      onClick: () => navigate("/dashboard/bookings"),
    },
    {
      title: "Currency",
      value: settings?.currency || "USD",
      subtitle: (settings?.language || "en").toUpperCase(),
      icon: <DollarSign className="w-6 h-6" />,
      bgColor: "#bfdbfe",
      iconColor: "#2563eb",
      onClick: () => navigate("/dashboard/profile"),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Welcome back, {user?.name || "User"}!
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Here&apos;s an overview of your account activity
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <button
            key={index}
            type="button"
            onClick={stat.onClick}
            className="text-left bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <div className="p-2 sm:p-3 rounded-lg flex-shrink-0" style={{ backgroundColor: stat.bgColor }}>
                <div style={{ color: stat.iconColor }}>{stat.icon}</div>
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-slate-900">{stat.title}</h3>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">{stat.value}</p>
            <p className="text-xs sm:text-sm text-slate-500">{stat.subtitle}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200">
        <div className="flex items-center gap-2 sm:gap-3 mb-4">
          <div className="p-2 sm:p-3 rounded-lg flex-shrink-0" style={{ backgroundColor: `${primaryColor}20` }}>
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Recent Activity</h2>
            <p className="text-xs sm:text-sm text-slate-500">Your latest actions and updates</p>
          </div>
        </div>

        <div className="text-center py-8 sm:py-12">
          <p className="text-sm sm:text-base text-slate-500">No recent activity to display</p>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Start by creating items or shops to see activity here
          </p>
        </div>
      </div>
    </div>
  );
}

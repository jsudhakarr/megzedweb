import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import {
  ShoppingBag,
  Store,
  Heart,
  Inbox,
  Send,
  DollarSign,
  User as UserIcon,
  TrendingUp,
  Bell,
  MessageCircle,
  Wallet,
  Coins,
} from "lucide-react";
import { useDashboardSummary } from "../../hooks/useDashboardSummary";

export default function DashboardOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useAppSettings();
  const primaryColor = settings?.primary_color || "#0073f0";

  const { data: summary, isLoading } = useDashboardSummary();
  const unreadNotifications = summary?.unread_count ?? 0;
  const unreadMessages =
    summary?.recent_conversations?.filter((conversation) => conversation.unread).length ?? 0;
  const itemsCount = summary?.my_items_count ?? 0;
  const shopsCount = summary?.my_shops_count ?? 0;
  const favoritesCount = summary?.saved_items_count ?? 0;
  const pendingActionsCount = summary?.pending_action_submissions ?? 0;
  const walletBalance = summary?.wallet_balance ?? 0;
  const recentTransactions = summary?.recent_transactions ?? [];
  const recentConversations = summary?.recent_conversations ?? [];

  const walletTxCount = recentTransactions.length;
  const formatAmount = (amount: number) => {
    const absAmount = Math.abs(amount);
    const formatted = absAmount.toLocaleString();
    return amount < 0 ? `-${formatted}` : `+${formatted}`;
  };

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
      value: isLoading ? "..." : String(walletBalance),
      subtitle: "Available balance",
      icon: <Wallet className="w-6 h-6" />,
      bgColor: "#ecfeff",
      iconColor: "#0891b2",
      onClick: () => navigate("/dashboard/wallet"),
    },

    // ✅ Wallet history count
    {
      title: "Wallet History",
      value: isLoading ? "..." : String(walletTxCount),
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
      value: isLoading ? "..." : String(unreadNotifications),
      subtitle: "Unread alerts",
      icon: <Bell className="w-6 h-6" />,
      bgColor: "#fff7ed",
      iconColor: "#f97316",
      onClick: () => navigate("/dashboard/notifications"),
    },

    {
      title: "Messages",
      value: isLoading ? "..." : String(unreadMessages),
      subtitle: "Unread chats",
      icon: <MessageCircle className="w-6 h-6" />,
      bgColor: "#eff6ff",
      iconColor: "#3b82f6",
      onClick: () => navigate("/dashboard/chat"),
    },

    {
      title: "My Items",
      value: isLoading ? "..." : String(itemsCount),
      subtitle: "Active listings",
      icon: <ShoppingBag className="w-6 h-6" />,
      bgColor: "#dcfce7",
      iconColor: "#16a34a",
      onClick: () => navigate("/dashboard/items"),
    },
    {
      title: "My Businesses",
      value: isLoading ? "..." : String(shopsCount),
      subtitle: "Active businesses",
      icon: <Store className="w-6 h-6" />,
      bgColor: "#fed7aa",
      iconColor: "#ea580c",
      onClick: () => navigate("/dashboard/shops"),
    },
    {
      title: "Favorites",
      value: isLoading ? "..." : String(favoritesCount),
      subtitle: "Saved items",
      icon: <Heart className="w-6 h-6" />,
      bgColor: "#fecdd3",
      iconColor: "#e11d48",
      onClick: () => navigate("/dashboard/likes"),
    },
    {
      title: "Pending Actions",
      value: isLoading ? "..." : String(pendingActionsCount),
      subtitle: "Awaiting response",
      icon: <Inbox className="w-6 h-6" />,
      bgColor: "#ddd6fe",
      iconColor: "#7c3aed",
      onClick: () => navigate("/dashboard/requests/received"),
    },
    {
      title: "Action Submissions",
      value: isLoading ? "..." : String(pendingActionsCount),
      subtitle: "Your pending requests",
      icon: <Send className="w-6 h-6" />,
      bgColor: "#e0f2fe",
      iconColor: "#0284c7",
      onClick: () => navigate("/dashboard/requests/sent"),
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200">
          <div className="flex items-center gap-2 sm:gap-3 mb-4">
            <div className="p-2 sm:p-3 rounded-lg flex-shrink-0" style={{ backgroundColor: `${primaryColor}20` }}>
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: primaryColor }} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">Recent Transactions</h2>
              <p className="text-xs sm:text-sm text-slate-500">Latest wallet activity</p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-sm text-slate-500">Loading transactions...</div>
          ) : recentTransactions.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <p className="text-sm sm:text-base text-slate-500">No recent transactions.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-3 border border-slate-100 rounded-lg px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {tx.description || "Transaction"}
                    </p>
                    <p className="text-xs text-slate-500">{tx.created_at}</p>
                  </div>
                  <span className={tx.amount < 0 ? "text-rose-600 font-semibold" : "text-emerald-600 font-semibold"}>
                    {formatAmount(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200">
          <div className="flex items-center gap-2 sm:gap-3 mb-4">
            <div className="p-2 sm:p-3 rounded-lg flex-shrink-0" style={{ backgroundColor: `${primaryColor}20` }}>
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: primaryColor }} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">Recent Conversations</h2>
              <p className="text-xs sm:text-sm text-slate-500">Latest chat updates</p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-sm text-slate-500">Loading conversations...</div>
          ) : recentConversations.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <p className="text-sm sm:text-base text-slate-500">No recent conversations.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => navigate("/dashboard/chat")}
                  className="w-full flex items-center gap-3 text-left border border-slate-100 rounded-lg px-3 py-2 hover:bg-slate-50"
                >
                  {conversation.other_user.avatar ? (
                    <img
                      src={conversation.other_user.avatar}
                      alt={conversation.other_user.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-sm">
                      {conversation.other_user.name?.[0] || "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {conversation.other_user.name}
                      </p>
                      <span className="text-xs text-slate-400">{conversation.updated_at}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {conversation.last_message || "No messages yet"}
                    </p>
                  </div>
                  {conversation.unread && (
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      New
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAppSettings } from "../contexts/AppSettingsContext";
import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  Heart,
  Inbox,
  Send,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Home as HomeIcon,
  Bell,
  MessageCircle,
  Coins, // Keep generic icon for "Buy Coins"
  SlidersHorizontal,
} from "lucide-react";
import Footer from "../components/Footer";
import { useDashboardSummary } from "../hooks/useDashboardSummary";

// --- Asset Imports ---
// Adjust path if needed (e.g. "../../assets/icons/...")
import coinIcon from "../assets/icons/coin.png";
import walletIcon from "../assets/icons/wallet.png";

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  isWallet?: boolean; // New flag for custom rendering
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { settings } = useAppSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const primaryColor = settings?.primary_color || "#0073f0";

  const { data: summary } = useDashboardSummary();
  const unreadNotifications = summary?.unread_count ?? 0;
  const unreadMessages =
    summary?.recent_conversations?.filter((conversation) => conversation.unread).length ?? 0;
  const coinsBalance = summary?.wallet_balance ?? 0;

  const navItems: NavItem[] = [
    { 
      path: "/dashboard", 
      label: "Overview", 
      icon: <LayoutDashboard className="w-5 h-5" /> 
    },
    
    // --- Custom Wallet Item ---
    {
      path: "/dashboard/wallet",
      label: "My Wallet",
      // Using the PNG icon for visual distinction
      icon: <img src={walletIcon} alt="Wallet" className="w-5 h-5 object-contain opacity-80" />, 
      isWallet: true,
    },
    { 
      path: "/dashboard/coins", 
      label: "Buy Coins", 
      icon: <Coins className="w-5 h-5" /> 
    },
    // --------------------------

    { path: "/dashboard/items", label: "My Items", icon: <ShoppingBag className="w-5 h-5" /> },
    { path: "/dashboard/shops", label: "My Businesses", icon: <Store className="w-5 h-5" /> },
    { path: "/dashboard/likes", label: "Favorites", icon: <Heart className="w-5 h-5" /> },
    { path: "/dashboard/requests/received", label: "Received Requests", icon: <Inbox className="w-5 h-5" /> },
    { path: "/dashboard/requests/sent", label: "Sent Requests", icon: <Send className="w-5 h-5" /> },

    {
      path: "/dashboard/notifications",
      label: "Notifications",
      icon: <Bell className="w-5 h-5" />,
      badge: unreadNotifications,
    },
    {
      path: "/dashboard/chat",
      label: "Messages",
      icon: <MessageCircle className="w-5 h-5" />,
      badge: unreadMessages,
    },
    {
      path: "/dashboard/fallback-settings",
      label: "Fallback Settings",
      icon: <SlidersHorizontal className="w-5 h-5" />,
    },

    { path: "/dashboard/profile", label: "Profile Settings", icon: <Settings className="w-5 h-5" /> },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header
        className="border-b shadow-sm sticky top-0 z-40"
        style={{ backgroundColor: settings?.secondary_color || "#ffffff" }}
      >
        <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 flex-shrink-0"
              >
                {sidebarOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity min-w-0"
              >
                {settings?.logo?.url ? (
                  <img
                    src={settings.logo.url}
                    alt={settings.appname}
                    className="h-8 sm:h-10 w-auto object-contain flex-shrink-0"
                  />
                ) : (
                  <Store className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" style={{ color: primaryColor }} />
                )}
                <h1 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">
                  {settings?.appname?.split(" - ")[0] || "Megzed"}
                </h1>
              </button>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 flex-shrink-0">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg font-medium transition-colors hover:bg-slate-100"
              >
                <HomeIcon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: primaryColor }} />
                <span className="hidden md:inline text-slate-900 text-sm sm:text-base">Home</span>
              </button>
              
              <button
                onClick={() => navigate("/dashboard/profile")}
                className="flex items-center gap-2 hover:bg-slate-50 rounded-lg p-1 sm:p-2 transition-colors"
              >
                {user?.profile_photo_url ? (
                  <img
                    src={user.profile_photo_url}
                    alt={user.name}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-slate-200 object-cover"
                  />
                ) : (
                  <div
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <User className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: primaryColor }} />
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-semibold text-slate-900 truncate max-w-[120px]">{user?.name || "User"}</p>
                  <p className="text-xs text-slate-500 truncate max-w-[120px]">{user?.email}</p>
                </div>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="grid lg:grid-cols-[280px_1fr] gap-4 sm:gap-8">
          
          {/* Sidebar */}
          <aside
            className={`
              fixed lg:static inset-y-0 left-0 z-30 w-64 lg:w-auto
              transform transition-transform duration-200 ease-in-out
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
              lg:block bg-white lg:bg-transparent mt-[65px] sm:mt-[73px] lg:mt-0
            `}
          >
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 h-full lg:h-auto overflow-y-auto">
              <nav className="space-y-1 sm:space-y-2">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setSidebarOpen(false);
                      }}
                      className={`
                        w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg
                        transition-all font-medium text-left group
                        ${isActive ? "text-white shadow-md" : "text-slate-700 hover:bg-slate-50"}
                      `}
                      style={isActive ? { backgroundColor: primaryColor } : undefined}
                    >
                      <span className="flex items-center gap-3">
                        {/* If active & using PNG icon, increase brightness/white-out 
                          If active & SVG, currentColor handles it 
                        */}
                        <div className={isActive ? "brightness-0 invert" : ""}>
                           {item.icon}
                        </div>
                        {item.label}
                      </span>

                      {/* --- Custom Badge Rendering --- */}
                      
                      {/* 1. Wallet Balance Display */}
                      {item.isWallet && coinsBalance > 0 && (
                        <div className={`
                          flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border
                          ${isActive 
                            ? "bg-white/20 text-white border-white/20" 
                            : "bg-amber-50 text-amber-700 border-amber-100"
                          }
                        `}>
                           <img src={coinIcon} alt="C" className="w-3.5 h-3.5 object-contain" />
                           <span>{coinsBalance.toLocaleString()}</span>
                        </div>
                      )}

                      {/* 2. Standard Notification Badges (Messages/Alerts) */}
                      {!item.isWallet && typeof item.badge === "number" && item.badge > 0 && (
                        <span
                          className={`min-w-[24px] h-6 px-1.5 rounded-full text-xs font-bold flex items-center justify-center ${
                            isActive ? "bg-white/20 text-white" : "bg-red-500 text-white shadow-sm"
                          }`}
                        >
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Mobile Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content Area */}
          <main>
            <Outlet />
          </main>
        </div>
      </div>

      <Footer settings={settings || {}} primaryColor={primaryColor} />
    </div>
  );
}

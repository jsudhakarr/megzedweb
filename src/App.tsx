import { Suspense, lazy, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppSettingsProvider, useAppSettings } from './contexts/AppSettingsContext';
import AppLoader from './components/AppLoader';

// Public Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Categories from './pages/Categories';
import Blog from './pages/Blog';
import PageDetail from './pages/PageDetail';
import PublicUserProfile from './pages/PublicUserProfile';
import SubmissionDetails from './pages/SubmissionDetails';
import ActionForm from './pages/ActionForm';

// Dashboard Pages
import DashboardOverview from './pages/dashboard/DashboardOverview';
import MyItems from './pages/dashboard/MyItems';
import MyShops from './pages/dashboard/MyShops';
import CreateShop from './pages/dashboard/CreateShop';
import CreateItemFlow from './pages/dashboard/CreateItemFlow'; // ✅ NEW
import Favorites from './pages/dashboard/Favorites';
import ActionSubmissions from './pages/dashboard/ActionSubmissions';
import Profile from './pages/Profile';
import Notifications from './pages/dashboard/Notifications';
import Wallet from './pages/dashboard/Wallet';
import CoinPackages from './pages/dashboard/CoinPackages';
import FallbackSettings from './pages/dashboard/FallbackSettings';

const ItemsCentralScreen = lazy(() => import('./pages/ItemsCentralScreen'));
const ShopsCentralScreen = lazy(() => import('./pages/ShopsCentralScreen'));
const UsersCentralScreen = lazy(() => import('./pages/UsersCentralScreen'));
const ItemDetail = lazy(() => import('./pages/ItemDetail'));
const ShopDetail = lazy(() => import('./pages/ShopDetail'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Chat = lazy(() => import('./pages/dashboard/Chat'));

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <Navigate to="/" /> : <>{children}</>;
}

function BlogWrapper() {
  const { settings } = useAppSettings();
  const primaryColor = settings?.primary_color || '#2563eb';
  return <Blog primaryColor={primaryColor} />;
}

function PageDetailWrapper() {
  const { settings } = useAppSettings();
  const primaryColor = settings?.primary_color || '#2563eb';
  return <PageDetail primaryColor={primaryColor} />;
}

function App() {
  return (
    <BrowserRouter>
      <AppSettingsProvider>
        <AuthProvider>
          {/* Firebase recaptcha container (must stay mounted) */}
          <div id="recaptcha-container" className="hidden" />

          <Routes>
            {/* --- Public Routes --- */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            <Route path="/" element={<Home />} />
            <Route
              path="/items"
              element={
                <Suspense fallback={<AppLoader label="Loading search..." />}>
                  <ItemsCentralScreen />
                </Suspense>
              }
            />
            <Route
              path="/shops"
              element={
                <Suspense fallback={<AppLoader label="Loading businesses..." />}>
                  <ShopsCentralScreen />
                </Suspense>
              }
            />
            <Route path="/categories" element={<Categories />} />
            <Route
              path="/item/:id"
              element={
                <Suspense fallback={<AppLoader label="Loading item..." />}>
                  <ItemDetail />
                </Suspense>
              }
            />
            <Route
              path="/shop/:id"
              element={
                <Suspense fallback={<AppLoader label="Loading shop..." />}>
                  <ShopDetail />
                </Suspense>
              }
            />
            <Route
              path="/users"
              element={
                <Suspense fallback={<AppLoader label="Loading users..." />}>
                  <UsersCentralScreen />
                </Suspense>
              }
            />
            <Route path="/users/:id" element={<PublicUserProfile />} />
            <Route path="/blog" element={<BlogWrapper />} />
            <Route path="/blog/:slug" element={<PageDetailWrapper />} />
            <Route path="/pages/:slug" element={<PageDetailWrapper />} />
            <Route
              path="/submission-details"
              element={
                <PrivateRoute>
                  <SubmissionDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/submission-details/:id"
              element={
                <PrivateRoute>
                  <SubmissionDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/action-form"
              element={
                <PrivateRoute>
                  <ActionForm />
                </PrivateRoute>
              }
            />

            {/* --- Protected Dashboard Routes --- */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Suspense fallback={<AppLoader label="Loading dashboard..." />}>
                    <Dashboard />
                  </Suspense>
                </PrivateRoute>
              }
            >
              <Route index element={<DashboardOverview />} />
              <Route path="items" element={<MyItems />} />
              <Route path="shops" element={<MyShops />} />
              <Route path="shops/create" element={<CreateShop />} />
              <Route path="items/create" element={<CreateItemFlow />} /> {/* ✅ NEW */}
              <Route path="likes" element={<Favorites />} />
              <Route path="requests/received" element={<ActionSubmissions variant="received" />} />
              <Route path="requests/sent" element={<ActionSubmissions variant="sent" />} />
              <Route path="profile" element={<Profile />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="fallback-settings" element={<FallbackSettings />} />
              <Route
                path="chat"
                element={
                  <Suspense fallback={<AppLoader label="Loading chat..." />}>
                    <Chat />
                  </Suspense>
                }
              />
              <Route path="wallet" element={<Wallet />} />
              <Route path="coins" element={<CoinPackages />} />

            </Route>
          </Routes>
        </AuthProvider>
      </AppSettingsProvider>
    </BrowserRouter>
  );
}

export default App;

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, Store, User as UserIcon, ShoppingBag, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useI18n } from '../contexts/I18nContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import CategoryNav from './CategoryNav';
import LanguageButton from './LanguageButton';
import LoginModal from './LoginModal';

interface SiteHeaderProps {
  showLogout?: boolean;
}

export default function SiteHeader({ showLogout = true }: SiteHeaderProps) {
  const navigate = useNavigate();
  const { settings } = useAppSettings();
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const isOnline = useOnlineStatus();

  const primaryColor = settings?.primary_color || '#0ea5e9';
  const appName = settings?.appname
    ? settings.appname.split(' - ')[0]
    : settings?.name || 'Megzed';
  const appLogoUrl = settings?.logo?.url || null;
  const navItems = [
    { label: t('listings'), path: '/items', icon: <ShoppingBag className="w-4 h-4" /> },
    { label: t('businesses'), path: '/shops', icon: <Store className="w-4 h-4" /> },
    { label: 'Users', path: '/users', icon: <Users className="w-4 h-4" /> },
  ];

  const handleAddProperty = () => {
    if (!user) setLoginOpen(true);
    else navigate('/dashboard/items/create');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b shadow-sm"
        style={{ backgroundColor: settings?.secondary_color || '#ffffff' }}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                {appLogoUrl ? (
                  <img src={appLogoUrl} alt={appName} className="h-10 w-auto object-contain" />
                ) : (
                  <Store className="w-8 h-8" style={{ color: primaryColor }} />
                )}
                <h1 className="text-2xl font-bold text-slate-900 hidden sm:block">{appName}</h1>
              </button>

            </div>

            <div className="flex items-center gap-3">
              <nav className="hidden lg:flex items-center gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    <span className="text-slate-500">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
              <div className="hidden md:block">
                <LanguageButton />
              </div>

              <button
                onClick={handleAddProperty}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white shadow-sm hover:shadow-md transition-all transform active:scale-95"
                style={{ backgroundColor: primaryColor }}
              >
                <PlusCircle className="w-5 h-5" />
                <span>Post now</span>
              </button>

              {user ? (
                <div className="flex items-center gap-2 pl-2">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-3 hover:bg-slate-50 rounded-lg p-2 transition-colors"
                    title={t('my_dashboard')}
                  >
                    {user.profile_photo_url ? (
                      <img
                        src={user.profile_photo_url}
                        alt={user.name}
                        className="w-10 h-10 rounded-full border-2 border-slate-200 object-cover"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${primaryColor}20` }}
                      >
                        <UserIcon className="w-6 h-6" style={{ color: primaryColor }} />
                      </div>
                    )}
                  </button>

                  {showLogout && (
                    <button
                      onClick={handleLogout}
                      className="text-slate-500 hover:text-red-600 font-medium px-2"
                    >
                      {t('logout')}
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 pl-2">
                  <button
                    onClick={() => setLoginOpen(true)}
                    className="px-4 py-2 text-slate-700 font-bold hover:text-slate-900 transition-colors"
                  >
                    {t('login')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {!isOnline && (
          <div className="bg-amber-100 text-amber-900 text-sm font-medium text-center py-2">
            You&apos;re offline
          </div>
        )}
        <CategoryNav primaryColor={primaryColor} />
      </header>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}

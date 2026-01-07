import { useEffect, useState } from 'react';
import { Loader2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService, type PublicUser } from '../services/api';
import PublicUserCard from './PublicUserCard';
import { useI18n } from '../contexts/I18nContext';

interface UsersSliderProps {
  primaryColor: string;
  users?: PublicUser[];
  title?: string;
  subtitle?: string | null;
  viewAllRoute?: string;
  styleConfig?: {
    backgroundColor?: string;
    titleColor?: string;
    subtitleColor?: string;
    viewAllColor?: string;
    showDivider?: boolean;
  };
}

export default function UsersSlider({
  primaryColor,
  users: usersOverride,
  title,
  subtitle,
  viewAllRoute,
  styleConfig,
}: UsersSliderProps) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(!usersOverride);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (usersOverride) {
      setUsers(usersOverride);
      setLoading(false);
      return;
    }
    loadUsers();
  }, [usersOverride]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getPublicUsers();
      setUsers((data || []).slice(0, 10));
    } catch (err) {
      console.error(err);
      setUsers([]);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || users.length === 0) return null;

  const resolvedTitle = title || t('nearby_users');
  const resolvedViewAllRoute = viewAllRoute || '/users';
  const wrapperStyles = {
    backgroundColor: styleConfig?.backgroundColor || '#eff6ff',
  };
  const titleStyles = { color: styleConfig?.titleColor || '#0f172a' };
  const subtitleStyles = { color: styleConfig?.subtitleColor || '#64748b' };
  const viewAllStyles = { color: styleConfig?.viewAllColor || '#2563eb' };
  const dividerClass = styleConfig?.showDivider ? 'border-t border-b border-blue-100' : '';

  return (
    <section className={`mt-0 rounded-none py-8 ${dividerClass}`} style={wrapperStyles}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" style={viewAllStyles} />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              <span style={titleStyles}>{resolvedTitle}</span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {subtitle && (
              <span className="text-sm hidden sm:inline" style={subtitleStyles}>
                {subtitle}
              </span>
            )}
            <button
              type="button"
              onClick={() => navigate(resolvedViewAllRoute)}
              className="text-sm sm:text-base font-semibold transition"
              style={viewAllStyles}
            >
              {t('view_all')}
            </button>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {users.map((user) => (
            <PublicUserCard key={user.id} user={user} accentColor={primaryColor} />
          ))}
        </div>
      </div>
    </section>
  );
}

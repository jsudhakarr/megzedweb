import { useEffect, useState } from 'react';
import { Loader2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService, type PublicUser } from '../services/api';
import PublicUserCard from './PublicUserCard';
import { useI18n } from '../contexts/I18nContext';

interface UsersSliderProps {
  primaryColor: string;
}

export default function UsersSlider({ primaryColor }: UsersSliderProps) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

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

  return (
    <section className="mt-0 bg-blue-50 border-t border-b border-blue-100 rounded-none py-8">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              {t('nearby_users')}
            </h2>
          </div>

          <button
            type="button"
          onClick={() => navigate('/users')}
            className="text-sm sm:text-base font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            {t('view_all')}
          </button>
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

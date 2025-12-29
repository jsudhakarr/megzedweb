import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService, type PublicUser } from '../services/api';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useI18n } from '../contexts/I18nContext';
import PublicUserCard from '../components/PublicUserCard';

export default function UsersDirectory() {
  const { t } = useI18n();
  const { settings } = useAppSettings();
  const navigate = useNavigate();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const primaryColor = settings?.primary_color || '#0ea5e9';

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiService.getPublicUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!query.trim()) return users;
    return users.filter((user) =>
      user.name.toLowerCase().includes(query.trim().toLowerCase())
    );
  }, [users, query]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-white shadow hover:shadow-md border border-slate-200"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <p className="text-sm text-slate-500">{t('community')}</p>
            <h1 className="text-2xl font-bold text-slate-900">{t('browse_users')}</h1>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 bg-slate-50">
            <Search className="w-5 h-5 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search_users')}
              className="flex-1 bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-500">{t('no_users_found')}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <PublicUserCard key={user.id} user={user} accentColor={primaryColor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

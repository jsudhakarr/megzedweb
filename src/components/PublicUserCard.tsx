import { Link } from 'react-router-dom';
import { Building2, CheckCircle2, FileText, MapPin, Star } from 'lucide-react';
import type { PublicUser } from '../services/api';

interface PublicUserCardProps {
  user: PublicUser;
  accentColor: string;
}

const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

export default function PublicUserCard({ user, accentColor }: PublicUserCardProps) {
  const verified = user.is_verified === true || user.is_verified === 1;
  const location = [user.city, user.state].filter(Boolean).join(', ') || user.country || '—';
  const rating =
    typeof user.avg_rating === 'number' && !Number.isNaN(user.avg_rating)
      ? user.avg_rating.toFixed(1)
      : '0.0';

  return (
    <Link
      to={`/users/${user.id}`}
      className="group w-64 shrink-0 bg-white rounded-3xl border border-slate-200 hover:border-blue-200 shadow-sm hover:shadow-md transition-all duration-300 p-5 flex flex-col items-center text-center"
    >
      <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md -mt-8 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        {user.profile_photo_url ? (
          <img
            src={user.profile_photo_url}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-lg font-semibold text-slate-600">{initials(user.name)}</span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1 justify-center">
        <h3 className="text-lg font-semibold text-slate-900 line-clamp-1">{user.name}</h3>
        {verified && <CheckCircle2 className="w-5 h-5" style={{ color: accentColor }} />}
      </div>

      <div className="flex items-center gap-1 text-sm text-slate-400 mt-1">
        <MapPin className="w-4 h-4" />
        <span className="truncate max-w-[180px]">{location}</span>
      </div>

      <div className="mt-4 w-full space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <FileText className="w-4 h-4 text-amber-500" />
            <span>Listings</span>
          </div>
          <span className="font-semibold text-slate-900">{user.items_count ?? 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <Building2 className="w-4 h-4 text-sky-500" />
            <span>Businesses</span>
          </div>
          <span className="font-semibold text-slate-900">{user.shops_count ?? 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <Star className="w-4 h-4 text-amber-500" />
            <span>Rating</span>
          </div>
          <span className="font-semibold text-slate-900">{rating}</span>
        </div>
      </div>
    </Link>
  );
}

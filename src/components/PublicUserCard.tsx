import { Link } from 'react-router-dom';
import { Building2, CheckCircle2, FileText, MapPin } from 'lucide-react';
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

  return (
    <Link
      to={`/users/${user.id}`}
      className="group w-64 shrink-0 bg-white rounded-3xl border border-slate-200 hover:border-blue-200 shadow-sm hover:shadow-lg transition-all duration-300 p-4 flex flex-col items-center text-center"
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
        <h3 className="text-base font-semibold text-slate-900 line-clamp-1">{user.name}</h3>
        {verified && <CheckCircle2 className="w-4 h-4" style={{ color: accentColor }} />}
      </div>

      <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
        <MapPin className="w-4 h-4" />
        <span className="truncate max-w-[160px]">{location}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full mt-4">
        <div className="flex items-center justify-center gap-2">
          <FileText className="w-4 h-4 text-blue-500" />
          <div className="text-left">
            <div className="text-[11px] text-slate-500">Listings</div>
            <div className="text-sm font-semibold text-slate-900">{user.items_count ?? 0}</div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Building2 className="w-4 h-4 text-sky-500" />
          <div className="text-left">
            <div className="text-[11px] text-slate-500">Businesses</div>
            <div className="text-sm font-semibold text-slate-900">{user.shops_count ?? 0}</div>
          </div>
        </div>
      </div>

      {typeof user.distance_km === 'number' && (
        <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
          {user.distance_km.toFixed(1)} km away
        </div>
      )}

      <div
        className="mt-4 w-full h-1 rounded-full bg-slate-100 overflow-hidden"
        aria-hidden
      >
        <div
          className="h-full rounded-full"
          style={{
            width: '60%',
            background: accentColor,
            opacity: 0.7,
          }}
        />
      </div>
    </Link>
  );
}

import type { PublicUser } from '../types/user';
import PublicUserCard from './PublicUserCard';

interface UsersResultsProps {
  users: PublicUser[];
  loading: boolean;
  error?: string | null;
  accentColor: string;
}

export default function UsersResults({ users, loading, error, accentColor }: UsersResultsProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-slate-500">{error}</p>
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-slate-500">No users found.</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map((user) => (
        <PublicUserCard key={user.id} user={user} accentColor={accentColor} />
      ))}
    </div>
  );
}

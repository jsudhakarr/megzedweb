import ShopsGrid from './ShopsGrid';
import type { Shop } from '../services/api';

interface ShopsResultsProps {
  shops: Shop[];
  loading: boolean;
  error?: string | null;
  primaryColor: string;
}

export default function ShopsResults({ shops, loading, error, primaryColor }: ShopsResultsProps) {
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

  if (!shops.length) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-slate-500">No shops found.</p>
      </div>
    );
  }

  return <ShopsGrid primaryColor={primaryColor} shops={shops} limit={shops.length} />;
}

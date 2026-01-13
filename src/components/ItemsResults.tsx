import ItemsGrid from './ItemsGrid';
import type { Item } from '../services/api';

interface ItemsResultsProps {
  items: Item[];
  loading: boolean;
  error?: string | null;
  primaryColor: string;
  layout: 'grid' | 'list';
  cardStyle?: string;
}

export default function ItemsResults({
  items,
  loading,
  error,
  primaryColor,
  layout,
  cardStyle,
}: ItemsResultsProps) {
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

  if (!items.length) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-slate-500">No items found.</p>
      </div>
    );
  }

  return (
    <ItemsGrid
      primaryColor={primaryColor}
      items={items}
      limit={items.length}
      layout={layout}
      cardStyle={cardStyle}
    />
  );
}

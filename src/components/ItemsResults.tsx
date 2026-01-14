import ItemsGrid from './ItemsGrid';
import type { Item } from '../services/api';

interface ItemsResultsProps {
  items: Item[];
  loading: boolean;
  error?: string | null;
  primaryColor: string;
  layout: 'grid' | 'list';
  listVariant?: 'carousel' | 'stacked';
  cardStyle?: string;
}

export default function ItemsResults({
  items,
  loading,
  error,
  primaryColor,
  layout,
  listVariant,
  cardStyle,
}: ItemsResultsProps) {
  if (loading) {
    const skeletons = Array.from({ length: 8 }, (_, index) => (
      <div
        key={`skeleton-${index}`}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse"
      >
        <div className="h-32 w-full rounded-xl bg-slate-100" />
        <div className="mt-4 h-4 w-3/4 rounded bg-slate-100" />
        <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
        <div className="mt-4 h-6 w-24 rounded bg-slate-100" />
      </div>
    ));
    return (
      <div
        className={`grid gap-4 ${
          layout === 'list'
            ? 'grid-cols-1'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}
      >
        {skeletons}
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
      listVariant={listVariant}
      cardStyle={cardStyle}
    />
  );
}

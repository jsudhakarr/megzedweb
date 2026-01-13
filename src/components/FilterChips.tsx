interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface FilterChipsProps {
  chips: FilterChip[];
  onClearAll?: () => void;
}

export default function FilterChips({ chips, onClearAll }: FilterChipsProps) {
  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:border-slate-300"
        >
          <span>{chip.label}</span>
          <span className="text-slate-400">×</span>
        </button>
      ))}
      {onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

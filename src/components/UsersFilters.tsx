import type { UsersFiltersState } from '../types/filters';

interface UsersFiltersProps {
  filters: UsersFiltersState;
  onChange: (next: Partial<UsersFiltersState>) => void;
  onReset: () => void;
}

export default function UsersFilters({ filters, onChange, onReset }: UsersFiltersProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-900">Badges</h3>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={filters.verified}
            onChange={(event) => onChange({ verified: event.target.checked, page: 1 })}
          />
          Verified
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={filters.top_rated}
            onChange={(event) => onChange({ top_rated: event.target.checked, page: 1 })}
          />
          Top rated
        </label>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-900">Availability</h3>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={filters.only_sellers}
            onChange={(event) => onChange({ only_sellers: event.target.checked, page: 1 })}
          />
          Only sellers with active items
        </label>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900">Location</h3>
        <input
          placeholder="City"
          value={filters.city}
          onChange={(event) =>
            onChange({ city: event.target.value, lat: '', lng: '', km: '', page: 1 })
          }
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        <div className="mt-3 grid grid-cols-3 gap-2">
          <input
            type="number"
            inputMode="decimal"
            placeholder="Lat"
            value={filters.lat}
            onChange={(event) => onChange({ lat: event.target.value, city: '', page: 1 })}
            className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs"
          />
          <input
            type="number"
            inputMode="decimal"
            placeholder="Lng"
            value={filters.lng}
            onChange={(event) => onChange({ lng: event.target.value, city: '', page: 1 })}
            className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs"
          />
          <input
            type="number"
            inputMode="decimal"
            placeholder="Km"
            value={filters.km}
            onChange={(event) => onChange({ km: event.target.value, city: '', page: 1 })}
            className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        Reset filters
      </button>
    </div>
  );
}

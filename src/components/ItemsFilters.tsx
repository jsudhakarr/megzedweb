import { useEffect, useState } from 'react';
import {
  apiService,
  type Category,
  type ListingType,
  type Subcategory,
} from '../services/api';
import type { ItemsFiltersState } from '../types/filters';

interface ItemsFiltersProps {
  filters: ItemsFiltersState;
  onChange: (next: Partial<ItemsFiltersState>) => void;
  onReset: () => void;
}

export default function ItemsFilters({ filters, onChange, onReset }: ItemsFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [listingTypes, setListingTypes] = useState<ListingType[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await apiService.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const loadListingTypes = async () => {
      try {
        const data = await apiService.getListingTypes();
        setListingTypes(data);
      } catch (error) {
        console.error('Failed to load listing types:', error);
      }
    };

    loadListingTypes();
  }, []);

  useEffect(() => {
    const loadSubcategories = async () => {
      if (!filters.category_id) {
        setSubcategories([]);
        return;
      }
      try {
        const data = await apiService.getSubcategories(filters.category_id);
        setSubcategories(data);
      } catch (error) {
        console.error('Failed to load subcategories:', error);
      }
    };

    loadSubcategories();
  }, [filters.category_id]);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Categories</h3>
        <select
          value={filters.category_id ?? ''}
          onChange={(event) =>
            onChange({
              category_id: event.target.value ? Number(event.target.value) : null,
              subcategory_id: null,
              page: 1,
            })
          }
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900">Subcategories</h3>
        <select
          value={filters.subcategory_id ?? ''}
          onChange={(event) =>
            onChange({
              subcategory_id: event.target.value ? Number(event.target.value) : null,
              page: 1,
            })
          }
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          disabled={!filters.category_id}
        >
          <option value="">All subcategories</option>
          {subcategories.map((subcategory) => (
            <option key={subcategory.id} value={subcategory.id}>
              {subcategory.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900">Price range</h3>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <input
            type="number"
            inputMode="numeric"
            placeholder="Min"
            value={filters.price_min}
            onChange={(event) => onChange({ price_min: event.target.value, page: 1 })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          />
          <input
            type="number"
            inputMode="numeric"
            placeholder="Max"
            value={filters.price_max}
            onChange={(event) => onChange({ price_max: event.target.value, page: 1 })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900">Listing type</h3>
        <select
          value={filters.listing_type}
          onChange={(event) => onChange({ listing_type: event.target.value, page: 1 })}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          {listingTypes.map((type) => (
            <option key={type.id} value={type.code}>
              {type.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-900">Badges</h3>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={filters.featured}
            onChange={(event) => onChange({ featured: event.target.checked, page: 1 })}
          />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={filters.promoted}
            onChange={(event) => onChange({ promoted: event.target.checked, page: 1 })}
          />
          Promoted
        </label>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900">Location</h3>
        <input
          placeholder="City"
          value={filters.city}
          onChange={(event) =>
            onChange({
              city: event.target.value,
              lat: '',
              lng: '',
              km: '',
              page: 1,
            })
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

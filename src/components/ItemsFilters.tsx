import { useEffect, useState } from 'react';
import {
  apiService,
  type Category,
  type ListingType,
  type Subcategory,
} from '../services/api';
import type { ItemsFiltersState } from '../types/filters';
import LocationPicker from './LocationPicker';

interface ItemsFiltersProps {
  primaryColor: string;
  filters: ItemsFiltersState;
  onChange: (next: Partial<ItemsFiltersState>) => void;
  onReset: () => void;
}

type DynamicFieldConfig = {
  id: number;
  label: string;
  type: string;
  options: string[];
};

export default function ItemsFilters({
  primaryColor,
  filters,
  onChange,
  onReset,
}: ItemsFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [listingTypes, setListingTypes] = useState<ListingType[]>([]);
  const [dynamicFieldConfigs, setDynamicFieldConfigs] = useState<DynamicFieldConfig[]>([]);
  const [dynamicFieldsLoading, setDynamicFieldsLoading] = useState(false);
  const [dynamicFieldsError, setDynamicFieldsError] = useState<string | null>(null);

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
        setDynamicFieldConfigs([]);
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

  useEffect(() => {
    const loadDynamicFields = async () => {
      if (!filters.subcategory_id) {
        setDynamicFieldConfigs([]);
        setDynamicFieldsError(null);
        return;
      }
      setDynamicFieldsLoading(true);
      setDynamicFieldsError(null);
      try {
        const res = await apiService.getSubcategoryFields(filters.subcategory_id);
        const raw = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.fields)
            ? res.fields
            : Array.isArray(res?.data?.data)
              ? res.data.data
              : Array.isArray(res?.data?.fields)
                ? res.data.fields
                : [];

        const fields = raw.map((field: any) => ({
          id: Number(field.id),
          label: field.label ?? field.name ?? 'Field',
          type: String(field.type ?? 'text').toLowerCase(),
          options: Array.isArray(field.options)
            ? field.options.filter(Boolean).map((option: any) => String(option))
            : typeof field.options === 'string'
              ? field.options
                  .split(',')
                  .map((option: string) => option.trim())
                  .filter(Boolean)
              : [],
        }));

        setDynamicFieldConfigs(fields);
      } catch (error) {
        console.error('Failed to load dynamic fields:', error);
        setDynamicFieldConfigs([]);
        setDynamicFieldsError('Unable to load additional filters right now.');
      } finally {
        setDynamicFieldsLoading(false);
      }
    };

    loadDynamicFields();
  }, [filters.subcategory_id]);

  const updateDynamicValue = (fieldId: number, value: string | string[]) => {
    const key = String(fieldId);
    const next = { ...filters.df };
    if (Array.isArray(value)) {
      if (value.length === 0) delete next[key];
      else next[key] = value;
    } else if (!value) {
      delete next[key];
    } else {
      next[key] = value;
    }
    onChange({ df: next, page: 1 });
  };

  const updateDynamicRange = (fieldId: number, bound: 'min' | 'max', value: string) => {
    const key = String(fieldId);
    const nextMin = { ...filters.df_min };
    const nextMax = { ...filters.df_max };
    if (bound === 'min') {
      if (!value) delete nextMin[key];
      else nextMin[key] = value;
    } else {
      if (!value) delete nextMax[key];
      else nextMax[key] = value;
    }
    onChange({ df_min: nextMin, df_max: nextMax, page: 1 });
  };

  const isMultiSelectType = (type: string) =>
    ['checkbox', 'multiselect'].includes(type.toLowerCase());

  const isSingleSelectType = (type: string) =>
    ['radio', 'select', 'dropdown'].includes(type.toLowerCase());

  const isNumericType = (type: string) =>
    ['number', 'numeric', 'decimal', 'range', 'price', 'integer'].includes(type.toLowerCase());

  const renderDynamicField = (field: DynamicFieldConfig) => {
    const key = String(field.id);
    const type = field.type || 'text';
    const options = field.options ?? [];

    if (isNumericType(type)) {
      return (
        <div key={field.id} className="space-y-2">
          <label className="text-sm font-semibold text-slate-900">{field.label}</label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              inputMode="numeric"
              placeholder="Min"
              value={filters.df_min[key] ?? ''}
              onChange={(event) => updateDynamicRange(field.id, 'min', event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
            <input
              type="number"
              inputMode="numeric"
              placeholder="Max"
              value={filters.df_max[key] ?? ''}
              onChange={(event) => updateDynamicRange(field.id, 'max', event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </div>
        </div>
      );
    }

    if (options.length > 0 && (isMultiSelectType(type) || type === 'radio')) {
      const current = filters.df[key];
      const selected = Array.isArray(current)
        ? current.map(String)
        : current
          ? [String(current)]
          : [];
      const allowMultiple = isMultiSelectType(type);

      const toggleOption = (option: string) => {
        if (!allowMultiple) {
          updateDynamicValue(field.id, option);
          return;
        }
        const next = selected.includes(option)
          ? selected.filter((item) => item !== option)
          : [...selected, option];
        updateDynamicValue(field.id, next);
      };

      return (
        <div key={field.id} className="space-y-2">
          <span className="text-sm font-semibold text-slate-900">{field.label}</span>
          <div className="flex flex-wrap gap-2">
            {options.map((option) => {
              const active = selected.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleOption(option)}
                  className="px-3 py-1.5 rounded-full border text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: active ? primaryColor : 'white',
                    borderColor: active ? primaryColor : 'rgb(226 232 240)',
                    color: active ? 'white' : 'rgb(51 65 85)',
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (options.length > 0 && isSingleSelectType(type)) {
      const current = filters.df[key];
      const value = Array.isArray(current) ? current[0] ?? '' : current ?? '';
      return (
        <div key={field.id} className="space-y-2">
          <label className="text-sm font-semibold text-slate-900">{field.label}</label>
          <select
            value={value}
            onChange={(event) => updateDynamicValue(field.id, event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">Select {field.label}</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );
    }

    const currentValue = filters.df[key];
    return (
      <div key={field.id} className="space-y-2">
        <label className="text-sm font-semibold text-slate-900">{field.label}</label>
        <input
          value={typeof currentValue === 'string' ? currentValue : ''}
          onChange={(event) => updateDynamicValue(field.id, event.target.value)}
          placeholder={`Enter ${field.label}`}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        />
      </div>
    );
  };

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
              df: {},
              df_min: {},
              df_max: {},
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
              df: {},
              df_min: {},
              df_max: {},
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

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Additional filters</h3>
          {dynamicFieldsLoading && (
            <span className="text-xs text-slate-500">Loading...</span>
          )}
        </div>
        {dynamicFieldsError && (
          <p className="text-xs text-red-500">{dynamicFieldsError}</p>
        )}
        {dynamicFieldConfigs.length === 0 && !dynamicFieldsLoading ? (
          <p className="text-xs text-slate-500">
            {filters.subcategory_id
              ? 'No additional filters for this subcategory.'
              : 'Select a subcategory to see more filters.'}
          </p>
        ) : (
          <div className="space-y-4">{dynamicFieldConfigs.map(renderDynamicField)}</div>
        )}
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
        <div className="mt-2">
          <LocationPicker
            primaryColor={primaryColor}
            city={filters.city || null}
            state={filters.state || null}
            onLocationChange={(city, state, lat, lng, distance) => {
              onChange({
                city: city ?? '',
                state: state ?? '',
                lat: typeof lat === 'number' ? String(lat) : '',
                lng: typeof lng === 'number' ? String(lng) : '',
                km: typeof distance === 'number' ? String(distance) : '',
                page: 1,
              });
            }}
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

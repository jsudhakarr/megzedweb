import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { apiService, type Category, type Subcategory } from '../services/api';

interface FilterState {
  category: number | null;
  subcategory: number | null;
  listingType: string | null;
  minPrice: string;
  maxPrice: string;
  verified: boolean | null;
  city: string | null;
  state: string | null;
}

interface FilterSidebarProps {
  primaryColor: string;
  onFilterChange: (filters: FilterState) => void;
  initialFilters?: FilterState;
  expandedSection?: string | null;
}

export default function FilterSidebar({
  primaryColor,
  onFilterChange,
  initialFilters,
  expandedSection: controlledExpandedSection,
}: FilterSidebarProps) {
  const [filters, setFilters] = useState<FilterState>(
    initialFilters || {
      category: null,
      subcategory: null,
      listingType: null,
      minPrice: '',
      maxPrice: '',
      verified: null,
      city: null,
      state: null,
    }
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>('category');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (filters.category) {
      loadSubcategories(filters.category);
    } else {
      setSubcategories([]);
    }
  }, [filters.category]);

  useEffect(() => {
    if (controlledExpandedSection !== undefined) {
      setExpandedSection(controlledExpandedSection);
    }
  }, [controlledExpandedSection]);

  const loadCategories = async () => {
    try {
      const data = await apiService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadSubcategories = async (categoryId: number) => {
    try {
      const data = await apiService.getSubcategories(categoryId);
      setSubcategories(data);
    } catch (error) {
      console.error('Failed to load subcategories:', error);
    }
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFilterChange(updated);
  };

  const clearFilters = () => {
    const cleared = {
      category: null,
      subcategory: null,
      listingType: null,
      minPrice: '',
      maxPrice: '',
      verified: null,
      city: null,
      state: null,
    };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== null && v !== ''
  );
  const focusRingStyle = { '--tw-ring-color': primaryColor } as CSSProperties;

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5 h-fit sticky top-6 w-72 max-w-[20rem]">

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-4">
          <button
            onClick={() =>
              setExpandedSection(expandedSection === 'category' ? null : 'category')
            }
            className="w-full flex items-center justify-between py-2 text-slate-900 font-semibold hover:text-slate-700"
          >
            Category
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                expandedSection === 'category' ? 'rotate-180' : ''
              }`}
            />
          </button>
          {expandedSection === 'category' && (
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={filters.category === null}
                  onChange={() => handleFilterChange({ category: null, subcategory: null })}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: primaryColor }}
                />
                <span className="text-sm text-slate-700">All Categories</span>
              </label>
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={filters.category === cat.id}
                    onChange={() => handleFilterChange({ category: cat.id, subcategory: null })}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: primaryColor }}
                  />
                  <span className="text-sm text-slate-700">{cat.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {filters.category && subcategories.length > 0 && (
          <div className="border-b border-slate-200 pb-4">
            <button
              onClick={() =>
                setExpandedSection(
                  expandedSection === 'subcategory' ? null : 'subcategory'
                )
              }
              className="w-full flex items-center justify-between py-2 text-slate-900 font-semibold hover:text-slate-700"
            >
              Subcategory
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  expandedSection === 'subcategory' ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedSection === 'subcategory' && (
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={filters.subcategory === null}
                    onChange={() => handleFilterChange({ subcategory: null })}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: primaryColor }}
                  />
                  <span className="text-sm text-slate-700">All Subcategories</span>
                </label>
                {subcategories.map((sub) => (
                  <label key={sub.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={filters.subcategory === sub.id}
                      onChange={() => handleFilterChange({ subcategory: sub.id })}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: primaryColor }}
                    />
                    <span className="text-sm text-slate-700">{sub.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="border-b border-slate-200 pb-4">
          <button
            onClick={() =>
              setExpandedSection(
                expandedSection === 'listingType' ? null : 'listingType'
              )
            }
            className="w-full flex items-center justify-between py-2 text-slate-900 font-semibold hover:text-slate-700"
          >
            Type
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                expandedSection === 'listingType' ? 'rotate-180' : ''
              }`}
            />
          </button>
          {expandedSection === 'listingType' && (
            <div className="mt-3 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={filters.listingType === null}
                  onChange={() => handleFilterChange({ listingType: null })}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: primaryColor }}
                />
                <span className="text-sm text-slate-700">All</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={filters.listingType === 'sale'}
                  onChange={() => handleFilterChange({ listingType: 'sale' })}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: primaryColor }}
                />
                <span className="text-sm text-slate-700">For Sale</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={filters.listingType === 'rent'}
                  onChange={() => handleFilterChange({ listingType: 'rent' })}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: primaryColor }}
                />
                <span className="text-sm text-slate-700">For Rent</span>
              </label>
            </div>
          )}
        </div>

        <div className="border-b border-slate-200 pb-4">
          <button
            onClick={() =>
              setExpandedSection(expandedSection === 'price' ? null : 'price')
            }
            className="w-full flex items-center justify-between py-2 text-slate-900 font-semibold hover:text-slate-700"
          >
            Price
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                expandedSection === 'price' ? 'rotate-180' : ''
              }`}
            />
          </button>
          {expandedSection === 'price' && (
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">
                  Min Price
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minPrice}
                  onChange={(e) =>
                    handleFilterChange({ minPrice: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={focusRingStyle}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">
                  Max Price
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.maxPrice}
                  onChange={(e) =>
                    handleFilterChange({ maxPrice: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={focusRingStyle}
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() =>
              setExpandedSection(
                expandedSection === 'verification' ? null : 'verification'
              )
            }
            className="w-full flex items-center justify-between py-2 text-slate-900 font-semibold hover:text-slate-700"
          >
            Seller
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                expandedSection === 'verification' ? 'rotate-180' : ''
              }`}
            />
          </button>
          {expandedSection === 'verification' && (
            <div className="mt-3 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={filters.verified === null}
                  onChange={() => handleFilterChange({ verified: null })}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: primaryColor }}
                />
                <span className="text-sm text-slate-700">All Sellers</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={filters.verified === true}
                  onChange={() => handleFilterChange({ verified: true })}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: primaryColor }}
                />
                <span className="text-sm text-slate-700">Verified Only</span>
              </label>
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() =>
              setExpandedSection(expandedSection === 'location' ? null : 'location')
            }
            className="w-full flex items-center justify-between py-2 text-slate-900 font-semibold hover:text-slate-700"
          >
            Location
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                expandedSection === 'location' ? 'rotate-180' : ''
              }`}
            />
          </button>
          {expandedSection === 'location' && (
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">
                  State
                </label>
                <input
                  type="text"
                  placeholder="e.g., California"
                  value={filters.state || ''}
                  onChange={(e) =>
                    handleFilterChange({ state: e.target.value || null })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={focusRingStyle}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">
                  City
                </label>
                <input
                  type="text"
                  placeholder="e.g., San Francisco"
                  value={filters.city || ''}
                  onChange={(e) =>
                    handleFilterChange({ city: e.target.value || null })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={focusRingStyle}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

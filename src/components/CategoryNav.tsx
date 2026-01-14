import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { apiService, type Category, type Subcategory } from '../services/api';
import { useI18n } from '../contexts/I18nContext';
import { goToItemsCentral } from '../utils/navigation';
import { useCachedResource } from '../hooks/useCachedResource';
import { CACHE_TTL_MS } from '../lib/cache';

interface CategoryNavProps {
  primaryColor: string;
}

export default function CategoryNav({ primaryColor }: CategoryNavProps) {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [subcategoriesByCategory, setSubcategoriesByCategory] = useState<
    Record<number, Subcategory[]>
  >({});
  const [loadingCategoryId, setLoadingCategoryId] = useState<number | null>(null);

  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({
    left: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // CONSTANT: We increased this to 900 to use more horizontal space
  const DROPDOWN_WIDTH = 900; 

  const categoriesKey = useMemo(() => apiService.getCategoriesCacheKey(), [lang]);
  const { data: categories = [] } = useCachedResource<Category[]>(
    categoriesKey,
    () => apiService.fetchCategories(),
    { ttlMs: CACHE_TTL_MS.categories }
  );

  useEffect(() => {
    setActiveCategoryId(null);
    setSubcategoriesByCategory({});
  }, [lang]);

  const loadSubcategories = async (categoryId: number) => {
    if (subcategoriesByCategory[categoryId]) {
      return;
    }
    setLoadingCategoryId(categoryId);
    try {
      const data = await apiService.getSubcategories(categoryId);
      setSubcategoriesByCategory((prev) => ({ ...prev, [categoryId]: data }));
    } catch (error) {
      console.error('Failed to load subcategories:', error);
    } finally {
      setLoadingCategoryId(null);
    }
  };

  const handleCategoryEnter = (
    e: React.SyntheticEvent<HTMLButtonElement>,
    categoryId: number
  ) => {
    setActiveCategoryId(categoryId);
    void loadSubcategories(categoryId);

    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const targetRect = e.currentTarget.getBoundingClientRect();

      let calculatedLeft = targetRect.left - containerRect.left;
      const containerWidth = containerRect.width;

      // Logic to keep the dropdown within screen bounds
      if (calculatedLeft + DROPDOWN_WIDTH > containerWidth) {
        calculatedLeft = containerWidth - DROPDOWN_WIDTH - 20;
        if (calculatedLeft < 0) calculatedLeft = 20;
      }

      setDropdownStyle({ left: calculatedLeft });
    }
  };

  const activeCategory = categories.find((c) => c.id === activeCategoryId);

  if (categories.length === 0) {
    return null;
  }

  return (
    <div
      className="border-t border-slate-200 bg-white/70 backdrop-blur z-30 relative"
      onMouseLeave={() => setActiveCategoryId(null)}
    >
      <div 
        ref={containerRef}
        className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative"
      >
        <nav>
          <ul className="flex items-center gap-2 py-2 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <li key={category.id} className="flex-shrink-0">
                <button
                  type="button"
                  onMouseEnter={(e) => handleCategoryEnter(e, category.id)}
                  onFocus={(e) => handleCategoryEnter(e, category.id)}
                  onClick={() =>
                    goToItemsCentral(navigate, { categoryId: category.id })
                  }
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeCategoryId === category.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{category.name}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {activeCategory && (
          <div
            style={dropdownStyle}
            // UPDATED: Width set to 900px to match logic and provide more space
            className={`absolute top-full z-40 mt-1 w-[min(900px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white shadow-xl transition-all duration-200`}
          >
            <div className="p-5">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  {activeCategory.name}
                </h3>
                {activeCategory.icon?.url && (
                  <img
                    src={activeCategory.icon.url}
                    alt={activeCategory.name}
                    className="w-6 h-6 object-contain"
                  />
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Browse popular subcategories
              </p>
            </div>

            <div className="border-t border-slate-100 px-5 pb-5 pt-4">
              {loadingCategoryId === activeCategory.id ? (
                <div className="text-sm text-slate-500">Loading...</div>
              ) : (
                /* UPDATED: Changed to 'flex-wrap' so items wrap to next line when space is full */
                <div className="flex flex-wrap gap-3">
                  {(subcategoriesByCategory[activeCategory.id] || []).map(
                    (sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() =>
                          goToItemsCentral(navigate, {
                            categoryId: activeCategory.id,
                            subcategoryId: sub.id,
                          })
                        }
                        className="flex-shrink-0 flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-200 hover:bg-white hover:text-slate-900"
                      >
                        {sub.icon?.thumbnail ? (
                          <img
                            src={sub.icon.thumbnail}
                            alt={sub.name}
                            className="w-6 h-6 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: primaryColor }}
                          />
                        )}
                        <span className="whitespace-nowrap">{sub.name}</span>
                      </button>
                    )
                  )}
                  {!subcategoriesByCategory[activeCategory.id]?.length && (
                    <div className="text-sm text-slate-500 w-full">
                      No subcategories available.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

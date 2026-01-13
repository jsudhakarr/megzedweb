import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { apiService, type Category, type Subcategory } from '../services/api';

interface CategoryNavProps {
  primaryColor: string;
}

export default function CategoryNav({ primaryColor }: CategoryNavProps) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [subcategoriesByCategory, setSubcategoriesByCategory] = useState<
    Record<number, Subcategory[]>
  >({});
  const [loadingCategoryId, setLoadingCategoryId] = useState<number | null>(null);

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

  const handleCategoryEnter = (categoryId: number) => {
    setActiveCategoryId(categoryId);
    void loadSubcategories(categoryId);
  };

  if (categories.length === 0) {
    return null;
  }

  return (
    <div
      className="border-t border-slate-200 bg-white/70 backdrop-blur"
      onMouseLeave={() => setActiveCategoryId(null)}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="relative">
          <ul className="flex items-center gap-2 py-2 overflow-x-auto overflow-y-visible scrollbar-hide">
            {categories.map((category) => (
              <li key={category.id} className="relative">
                <button
                  type="button"
                  onMouseEnter={() => handleCategoryEnter(category.id)}
                  onFocus={() => handleCategoryEnter(category.id)}
                  onClick={() => navigate(`/items?category=${category.id}`)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeCategoryId === category.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{category.name}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {activeCategoryId === category.id && (
                  <div className="absolute left-0 top-full z-40 mt-2 w-[min(620px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white shadow-xl">
                    <div className="flex items-start gap-6 p-5">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-slate-900">
                          {category.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Browse popular subcategories
                        </p>
                      </div>
                      {category.icon?.url && (
                        <img
                          src={category.icon.url}
                          alt={category.name}
                          className="w-10 h-10 object-contain"
                        />
                      )}
                    </div>
                    <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                      {loadingCategoryId === category.id ? (
                        <div className="text-sm text-slate-500">Loading...</div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {(subcategoriesByCategory[category.id] || []).map((sub) => (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() =>
                                navigate(`/items?category=${category.id}&subcategory=${sub.id}`)
                              }
                              className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-200 hover:bg-white hover:text-slate-900"
                            >
                              {sub.icon?.thumbnail ? (
                                <img
                                  src={sub.icon.thumbnail}
                                  alt={sub.name}
                                  className="w-6 h-6 rounded-lg object-cover"
                                />
                              ) : (
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: primaryColor }}
                                />
                              )}
                              <span className="truncate">{sub.name}</span>
                            </button>
                          ))}
                          {!subcategoriesByCategory[category.id]?.length && (
                            <div className="text-sm text-slate-500">
                              No subcategories available.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

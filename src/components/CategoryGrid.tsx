import { useState, useEffect } from 'react';
import { Loader2, Grid3X3 } from 'lucide-react';
import { apiService, type Category, type Subcategory } from '../services/api';

interface CategoryGridProps {
  primaryColor: string;
  onSubcategorySelect?: (subcategory: Subcategory, category: Category) => void;
  selectedSubcategoryId?: number | null;
}

export default function CategoryGrid({ primaryColor, onSubcategorySelect, selectedSubcategoryId }: CategoryGridProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Record<number, Subcategory[]>>({});
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSubcategories, setLoadingSubcategories] = useState<number | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await apiService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubcategories = async (categoryId: number) => {
    if (subcategories[categoryId]) {
      setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
      return;
    }

    setLoadingSubcategories(categoryId);
    try {
      const data = await apiService.getSubcategories(categoryId);
      setSubcategories((prev) => ({ ...prev, [categoryId]: data }));
      setExpandedCategory(categoryId);
    } catch (error) {
      console.error('Failed to load subcategories:', error);
    } finally {
      setLoadingSubcategories(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => loadSubcategories(category.id)}
            className={`flex flex-col items-center justify-center p-6 rounded-2xl transition-all duration-200 ${
              expandedCategory === category.id
                ? 'bg-white shadow-xl border-2'
                : 'bg-slate-50 hover:bg-white hover:shadow-lg border-2 border-transparent'
            }`}
            style={{
              borderColor: expandedCategory === category.id ? primaryColor : undefined,
            }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-white shadow-md"
            >
              {category.icon?.url ? (
                <img
                  src={category.icon.url}
                  alt={category.name}
                  className="w-12 h-12 object-contain"
                />
              ) : (
                <Grid3X3
                  className="w-8 h-8"
                  style={{ color: primaryColor }}
                />
              )}
            </div>
            <span
              className={`font-semibold text-center text-sm leading-tight ${
                expandedCategory === category.id ? 'text-slate-900' : 'text-slate-700'
              }`}
            >
              {category.name}
            </span>
            {loadingSubcategories === category.id && (
              <Loader2 className="w-4 h-4 animate-spin mt-2" style={{ color: primaryColor }} />
            )}
          </button>
        ))}
      </div>

      {expandedCategory && subcategories[expandedCategory] && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {subcategories[expandedCategory]?.map((sub) => {
              const category = categories.find((c) => c.id === expandedCategory);
              const isSelected = selectedSubcategoryId === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => category && onSubcategorySelect?.(sub, category)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 group ${
                    isSelected
                      ? 'border-transparent shadow-lg'
                      : 'border-slate-100 hover:border-slate-200 hover:shadow-md bg-slate-50 hover:bg-white'
                  }`}
                  style={{
                    backgroundColor: isSelected ? primaryColor : undefined,
                  }}
                >
                  {sub.icon?.thumbnail ? (
                    <div className={`w-12 h-12 rounded-xl overflow-hidden ring-2 transition-all ${
                      isSelected ? 'ring-white/30' : 'ring-slate-100 group-hover:ring-slate-200'
                    }`}>
                      <img
                        src={sub.icon.thumbnail}
                        alt={sub.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : `${primaryColor}10` }}
                    >
                      <Grid3X3 className="w-5 h-5" style={{ color: isSelected ? 'white' : primaryColor }} />
                    </div>
                  )}
                  <span className={`text-sm font-medium text-center line-clamp-2 ${
                    isSelected ? 'text-white' : 'text-slate-700 group-hover:text-slate-900'
                  }`}>
                    {sub.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

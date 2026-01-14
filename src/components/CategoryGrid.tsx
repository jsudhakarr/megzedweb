import { useState, useEffect, useMemo, useRef } from 'react';
import { Loader2, Grid3X3 } from 'lucide-react';
import { apiService, type Category, type Subcategory } from '../services/api';
import { useI18n } from '../contexts/I18nContext';

interface CategoryGridProps {
  primaryColor: string;
  categories?: Category[];
  onSubcategorySelect?: (subcategory: Subcategory, category: Category) => void;
  selectedSubcategoryId?: number | null;
}

export default function CategoryGrid({
  primaryColor,
  categories: categoriesOverride,
  onSubcategorySelect,
  selectedSubcategoryId,
}: CategoryGridProps) {
  const { lang } = useI18n();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Record<number, Subcategory[]>>({});
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(!categoriesOverride);
  const [loadingSubcategories, setLoadingSubcategories] = useState<number | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (categoriesOverride) {
      setCategories(categoriesOverride);
      setLoading(false);
      return;
    }
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesOverride, lang]);

  useEffect(() => {
    setSubcategories({});
    setExpandedCategory(null);
  }, [lang]);

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

  const useSliderLayout = useMemo(() => categories.length > 4, [categories.length]);

  useEffect(() => {
    if (!useSliderLayout) return;
    const el = sliderRef.current;
    if (!el) return;

    const updateScrollState = () => {
      const maxScrollLeft = el.scrollWidth - el.clientWidth;
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft < maxScrollLeft - 1);
    };

    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [useSliderLayout, categories.length]);

  const scrollByAmount = (direction: 'left' | 'right') => {
    const el = sliderRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!useSliderLayout) return;
    const el = sliderRef.current;
    if (!el) return;
    setIsDragging(true);
    dragStartX.current = event.pageX - el.offsetLeft;
    dragScrollLeft.current = el.scrollLeft;
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!useSliderLayout || !isDragging) return;
    const el = sliderRef.current;
    if (!el) return;
    event.preventDefault();
    const x = event.pageX - el.offsetLeft;
    const walk = (x - dragStartX.current) * 1.1;
    el.scrollLeft = dragScrollLeft.current - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
      <div className={useSliderLayout ? 'relative' : ''}>
        {useSliderLayout && canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollByAmount('left')}
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-900 shadow-md backdrop-blur"
            aria-label="Scroll categories left"
          >
            ‹
          </button>
        )}
        {useSliderLayout && canScrollRight && (
          <button
            type="button"
            onClick={() => scrollByAmount('right')}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-900 shadow-md backdrop-blur"
            aria-label="Scroll categories right"
          >
            ›
          </button>
        )}
        <div
          ref={useSliderLayout ? sliderRef : undefined}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={
            useSliderLayout
              ? `flex gap-4 overflow-x-auto pb-3 scrollbar-hide ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`
              : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
          }
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => loadSubcategories(category.id)}
              className={`flex flex-col items-center justify-center p-6 rounded-2xl transition-all duration-200 ${
                expandedCategory === category.id
                  ? 'bg-white shadow-xl border-2'
                  : 'bg-slate-50 hover:bg-white hover:shadow-lg border-2 border-transparent'
              } ${useSliderLayout ? 'min-w-[150px] flex-shrink-0' : ''}`}
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

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiService, type Item } from '../services/api';
import CentralItemGridCard from './items/central/CentralItemGridCard';
import CentralItemListCard from './items/central/CentralItemListCard';
import DefaultGridCard from './items/cards/DefaultGridCard';
import GridCardStyle1 from './items/cards/GridCardStyle1';
import GridCardStyle2 from './items/cards/GridCardStyle2';
import ListCardStyle1 from './items/cards/ListCardStyle1';
import ListCardStyle2 from './items/cards/ListCardStyle2';

interface ItemsGridProps {
  primaryColor: string;
  items?: Item[];
  limit?: number;
  gridColumns?: 3 | 4;
  categoryId?: number | null;
  subcategoryId?: number | null;
  subcategoryName?: string | null;
  onClearFilter?: () => void;
  showFilters?: boolean;
  layout?: 'grid' | 'list';
  listVariant?: 'carousel' | 'stacked';
  cardStyle?: string;
  listingType?: string | null;
  minPrice?: string;
  maxPrice?: string;
  verified?: boolean | null;
  city?: string | null;
  state?: string | null;
  lat?: number;
  lng?: number;
  distance?: number;
}

export default function ItemsGrid(props: ItemsGridProps) {
  const {
    items: itemsOverride,
    limit,
    // ✅ Default to 3 columns (Wider cards)
    gridColumns = 3,
    categoryId,
    subcategoryId,
    showFilters: _showFilters = false,
    layout = 'grid',
    listVariant = 'carousel',
    cardStyle,
    listingType,
    minPrice,
    maxPrice,
    verified,
    city,
    state,
    lat,
    lng,
    distance,
  } = props;
  const [items, setItems] = useState<Item[]>(itemsOverride ?? []);
  const [loading, setLoading] = useState(!itemsOverride);
  const listRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [favoriteMessages, setFavoriteMessages] = useState<Record<number, string>>({});
  const favoriteMessageTimeouts = useRef<Record<number, number>>({});

  useEffect(() => {
    if (itemsOverride) {
      setItems(itemsOverride);
      setLoading(false);
      return;
    }
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    itemsOverride,
    categoryId,
    subcategoryId,
    listingType,
    minPrice,
    maxPrice,
    verified,
    city,
    state,
    lat,
    lng,
    distance,
    limit,
  ]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const defaultLimit = typeof limit === 'number' ? limit : 10;
      const data = await apiService.filterItems({
        categoryId: categoryId ?? undefined,
        subcategoryId: subcategoryId ?? undefined,
        listingType,
        minPrice,
        maxPrice,
        verified,
        city,
        state,
        lat,
        lng,
        distance,
        perPage: defaultLimit,
      });
      setItems((data || []).slice(0, defaultLimit));
    } catch (error) {
      console.error('Failed to load items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const normalizeCardStyle = (style?: string) => {
    if (!style) return 'default';
    const normalized = style.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (['style1', 'listcard1', 'list_card_1', '1'].includes(normalized)) return 'list_card_1';
    if (['style2', 'listcard2', 'list_card_2', '2'].includes(normalized)) return 'list_card_2';
    if (['gridcard1', 'grid_card_1'].includes(normalized)) return 'grid_card_1';
    if (['gridcard2', 'grid_card_2'].includes(normalized)) return 'grid_card_2';
    return 'default';
  };

  const resolvedCardStyle = normalizeCardStyle(cardStyle);

  const resolvedItems = typeof limit === 'number' ? items.slice(0, limit) : items;
  const isListCardStyle = resolvedCardStyle === 'list_card_1' || resolvedCardStyle === 'list_card_2';
  const isGridCarouselStyle = resolvedCardStyle === 'grid_card_2';
  const isCentralScreen = listVariant === 'stacked';
  const shouldForceCarousel = !isCentralScreen && (isListCardStyle || isGridCarouselStyle);
  const effectiveLayout = shouldForceCarousel ? 'list' : layout;
  const effectiveListVariant = shouldForceCarousel ? 'carousel' : listVariant;
  const effectiveGridColumns = resolvedCardStyle === 'grid_card_1' ? 4 : gridColumns;
  const isListLayout = effectiveLayout === 'list';
  const isCarouselList = isListLayout && effectiveListVariant === 'carousel';

  useEffect(() => {
    if (!isCarouselList) return;
    const el = listRef.current;
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
  }, [isCarouselList, resolvedItems.length]);

  useEffect(() => {
    return () => {
      Object.values(favoriteMessageTimeouts.current).forEach((timeout) =>
        window.clearTimeout(timeout)
      );
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (resolvedItems.length === 0) return null;

  const scrollByAmount = (direction: 'left' | 'right') => {
    const el = listRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isCarouselList) return;
    const el = listRef.current;
    if (!el) return;
    setIsDragging(true);
    dragStartX.current = event.pageX - el.offsetLeft;
    dragScrollLeft.current = el.scrollLeft;
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isCarouselList || !isDragging) return;
    const el = listRef.current;
    if (!el) return;
    event.preventDefault();
    const x = event.pageX - el.offsetLeft;
    const walk = (x - dragStartX.current) * 1.1;
    el.scrollLeft = dragScrollLeft.current - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const setFavoriteMessage = (itemId: number, message: string) => {
    setFavoriteMessages((prev) => ({ ...prev, [itemId]: message }));
    const existingTimeout = favoriteMessageTimeouts.current[itemId];
    if (existingTimeout) {
      window.clearTimeout(existingTimeout);
    }
    favoriteMessageTimeouts.current[itemId] = window.setTimeout(() => {
      setFavoriteMessages((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      delete favoriteMessageTimeouts.current[itemId];
    }, 2000);
  };

  const toggleFavorite = async (itemId: number) => {
    const currentItem = items.find((item) => item.id === itemId);
    const currentIsFavorite = currentItem?.is_favorite === true;
    try {
      const res = await apiService.toggleItemFavorite(itemId);
      const resolved =
        res?.is_favorite ??
        res?.data?.is_favorite ??
        res?.data?.is_saved ??
        res?.data?.favorite ??
        res?.favorite;
      const nextIsFavorite =
        typeof resolved === 'boolean'
          ? resolved
          : typeof resolved === 'number'
            ? resolved === 1
            : typeof resolved === 'string'
              ? resolved.toLowerCase() === 'true'
              : !currentIsFavorite;

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, is_favorite: nextIsFavorite } : item
        )
      );
      setFavoriteMessage(itemId, nextIsFavorite ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      console.error('Failed to update favorite:', error);
      setFavoriteMessage(itemId, 'Unable to update favorite');
    }
  };

  // ✅ UPDATED: Reduced Gap Logic
  // - Replaced `gap-6` (24px) with `gap-3` (12px)
  // - Replaced `gap-5` with `gap-3`
  const gridClass = isListLayout
    ? isCarouselList
      ? `flex gap-3 overflow-x-auto pb-4 scrollbar-hide ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`
      : 'flex flex-col gap-3'
    : effectiveGridColumns === 4
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-3'
      : effectiveGridColumns === 3
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3'
        : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3';

  return (
    <div className="space-y-4">
      <div className={isCarouselList ? 'relative' : ''}>
        {isCarouselList && canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollByAmount('left')}
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-900 shadow-md backdrop-blur"
            aria-label="Scroll left"
          >
            ‹
          </button>
        )}
        {isCarouselList && canScrollRight && (
          <button
            type="button"
            onClick={() => scrollByAmount('right')}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-900 shadow-md backdrop-blur"
            aria-label="Scroll right"
          >
            ›
          </button>
        )}
        <div
          ref={isListLayout ? listRef : undefined}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={gridClass}
        >
          {resolvedItems.map((item) => {
            const handleToggle = () => toggleFavorite(item.id);

            if (isCentralScreen) {
              return isListLayout ? (
                <CentralItemListCard
                  key={item.id}
                  item={item}
                  onToggleFavorite={handleToggle}
                  favoriteMessage={favoriteMessages[item.id]}
                />
              ) : (
                <CentralItemGridCard
                  key={item.id}
                  item={item}
                  onToggleFavorite={handleToggle}
                  favoriteMessage={favoriteMessages[item.id]}
                />
              );
            }

            if (resolvedCardStyle === 'list_card_1') {
              return (
                <ListCardStyle1
                  key={item.id}
                  item={item}
                  onToggleFavorite={handleToggle}
                  isCarousel={isCarouselList}
                  favoriteMessage={favoriteMessages[item.id]}
                />
              );
            }

            if (resolvedCardStyle === 'list_card_2') {
              return (
                <ListCardStyle2
                  key={item.id}
                  item={item}
                  onToggleFavorite={handleToggle}
                  isCarousel={isCarouselList}
                  favoriteMessage={favoriteMessages[item.id]}
                />
              );
            }

            if (resolvedCardStyle === 'grid_card_1') {
              return (
                <GridCardStyle1
                  key={item.id}
                  item={item}
                  onToggleFavorite={handleToggle}
                  isCarousel={isCarouselList}
                  favoriteMessage={favoriteMessages[item.id]}
                />
              );
            }

            if (resolvedCardStyle === 'grid_card_2') {
              return (
                <GridCardStyle2
                  key={item.id}
                  item={item}
                  onToggleFavorite={handleToggle}
                  isCarousel={isCarouselList}
                  favoriteMessage={favoriteMessages[item.id]}
                />
              );
            }

            return (
              <DefaultGridCard
                key={item.id}
                item={item}
                onToggleFavorite={handleToggle}
                isCarousel={isCarouselList}
                favoriteMessage={favoriteMessages[item.id]}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

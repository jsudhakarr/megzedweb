import { useEffect, useMemo, useRef, useState } from 'react';
import ShopsGrid from './ShopsGrid';

interface Props {
  themeColor: string;
}

export default function ShopsSlider({ themeColor }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const slides = useMemo(() => [0, 1, 2], []);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const width = el.clientWidth;
      if (!width) return;
      const idx = Math.round(el.scrollLeft / width);
      setActive(Math.max(0, Math.min(slides.length - 1, idx)));
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => el.removeEventListener('scroll', onScroll);
  }, [slides.length]);

  const goTo = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div>
      {/* SLIDER */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {slides.map((i) => (
          <div key={i} className="min-w-full snap-start">
            <ShopsGrid primaryColor={themeColor} />
          </div>
        ))}
      </div>

      {/* DOTS */}
      <div className="flex items-center justify-center gap-2 mt-3">
        {slides.map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2.5 rounded-full transition-all ${
              active === i
                ? 'w-6 bg-white'
                : 'w-2.5 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>

      <p className="text-center text-xs text-white/70 mt-2">
        Swipe to explore more businesses
      </p>
    </div>
  );
}

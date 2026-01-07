import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService, type Slider } from '../services/api';

interface HomeSliderProps {
  primaryColor: string;
}

export default function HomeSlider({ primaryColor }: HomeSliderProps) {
  const navigate = useNavigate();
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const loadSliders = async () => {
      setLoading(true);
      try {
        const data = await apiService.getSliders();
        const sorted = [...data].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        setSliders(sorted);
        setCurrentIndex(0);
      } catch (error) {
        console.error(error);
        setSliders([]);
      } finally {
        setLoading(false);
      }
    };

    loadSliders();
  }, []);

  useEffect(() => {
    if (sliders.length <= 1) return;
    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sliders.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [sliders.length]);

  const activeSlide = useMemo(() => sliders[currentIndex], [sliders, currentIndex]);

  const handleNavigate = (slide: Slider) => {
    if (!slide) return;

    if (slide.target_type === 'item' && slide.item_id) {
      navigate(`/item/${slide.item_id}`);
      return;
    }

    if (slide.target_type === 'shop' && slide.shop_id) {
      navigate(`/shop/${slide.shop_id}`);
      return;
    }

    if (slide.link_url) {
      if (slide.link_url.startsWith('http')) {
        window.open(slide.link_url, '_blank', 'noopener,noreferrer');
      } else {
        navigate(`/blog/${slide.link_url}`);
      }
    }
  };

  const goToSlide = (index: number) => {
    if (index < 0 || index >= sliders.length) return;
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[280px] rounded-2xl border border-slate-200 bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!activeSlide) {
    return (
      <div className="flex items-center justify-center min-h-[280px] rounded-2xl border border-slate-200 bg-white text-slate-500">
        No promotions available.
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm min-h-[280px] bg-slate-900">
      <button
        type="button"
        onClick={() => handleNavigate(activeSlide)}
        className="group absolute inset-0"
        aria-label={activeSlide.title}
      >
        <img
          src={activeSlide.image}
          alt={activeSlide.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 z-10 p-6 pl-16 pr-16 text-left text-white sm:pl-20 sm:pr-20">
          <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-white/80 mb-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
              <ExternalLink className="w-3 h-3" />
              Featured
            </span>
          </div>
          <h3 className="text-2xl font-bold leading-tight">{activeSlide.title}</h3>
          {activeSlide.subtitle && (
            <p className="mt-2 text-sm sm:text-base text-white/80">{activeSlide.subtitle}</p>
          )}
          <div
            className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm"
            style={{ backgroundColor: primaryColor }}
          >
            Explore now
          </div>
        </div>
      </button>

      {sliders.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goToSlide((currentIndex - 1 + sliders.length) % sliders.length)}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/80 p-2 text-slate-900 shadow-sm backdrop-blur-sm transition hover:bg-white"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => goToSlide((currentIndex + 1) % sliders.length)}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/80 p-2 text-slate-900 shadow-sm backdrop-blur-sm transition hover:bg-white"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {sliders.length > 1 && (
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
          {sliders.map((_, index) => (
            <button
              key={`slide-dot-${index}`}
              type="button"
              onClick={() => goToSlide(index)}
              className={`h-2.5 w-2.5 rounded-full transition ${
                index === currentIndex ? 'bg-white' : 'bg-white/40'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

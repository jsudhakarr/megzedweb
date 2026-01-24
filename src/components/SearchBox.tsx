import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Loader2, MapPin, ArrowRight, Mic } from "lucide-react";
import { apiService, type Item } from "../services/api";

interface SearchBoxProps {
  primaryColor: string;
  containerClassName?: string;
}

export default function SearchBox({ primaryColor, containerClassName }: SearchBoxProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const items = await apiService.searchItems(query);
        setResults(items);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [query]);

  const formatPrice = (price: string) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(price));

  const handleItemClick = (id: number) => {
    setQuery("");
    setShowResults(false);
    navigate(`/item/${id}`);
  };

  return (
    <div
      ref={searchRef}
      className={`relative w-full max-w-2xl mx-auto ${containerClassName ?? ''}`}
    >
      {/* Search input */}
      <div className="relative">
        <div
          className="
            flex items-center gap-3
            w-full
            bg-white border border-slate-300
            rounded-2xl px-4 py-3
            shadow-sm
            focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-100
          "
        >
          <Search className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-blue-700">Search</span>
          <span className="h-5 w-px bg-slate-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            placeholder="Enter UID to view item"
            className="
              flex-1 bg-transparent text-slate-800 placeholder-slate-400
              focus:outline-none
            "
          />
          <div className="flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            {!loading && query && (
              <button
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setShowResults(false);
                }}
                className="p-1 rounded-full hover:bg-slate-100"
                aria-label="Clear search"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
            <Mic className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Results */}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-[380px] overflow-y-auto">
            {results.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className="w-full flex gap-4 p-4 text-left hover:bg-slate-50 border-b last:border-0"
              >
                {/* Image */}
                {item.feature_photo?.thumbnail ? (
                  <img
                    src={item.feature_photo.thumbnail}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Search className="w-6 h-6 text-slate-300" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {item.name}
                  </p>

                  <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {item.city}, {item.state}
                  </div>

                  <div className="text-sm font-semibold mt-1" style={{ color: primaryColor }}>
                    {formatPrice(item.price)}
                  </div>
                </div>

                <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {showResults && query.length >= 2 && !loading && results.length === 0 && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-xl p-6 text-center">
          <Search className="w-6 h-6 mx-auto text-slate-400 mb-2" />
          <p className="text-slate-600 font-medium">No results found</p>
          <p className="text-sm text-slate-400">Try another keyword</p>
        </div>
      )}
    </div>
  );
}

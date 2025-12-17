import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, FileText, Book } from 'lucide-react';
import { apiService, type ContentPage } from '../services/api';

interface PagesDropdownProps {
  primaryColor: string;
}

export default function PagesDropdown({ primaryColor }: PagesDropdownProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && pages.length === 0) {
      loadPages();
    }
  }, [isOpen]);

  const loadPages = async () => {
    setLoading(true);
    try {
      const data = await apiService.getPages();
      setPages(data);
    } catch (error) {
      console.error('Failed to load pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageClick = (slug: string) => {
    navigate(`/pages/${slug}`);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-slate-700 font-medium hover:text-slate-900 transition-colors"
      >
        <FileText className="w-4 h-4" />
        <span>Pages</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
          <button
            onClick={() => {
              navigate('/blog');
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${primaryColor}10`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div className="flex items-center gap-2">
              <Book className="w-4 h-4" style={{ color: primaryColor }} />
              <span className="font-medium">Blog</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              View all articles
            </p>
          </button>

          <div className="h-px bg-slate-200 my-2"></div>

          {loading ? (
            <div className="px-4 py-3 text-center text-slate-500">
              <div className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : pages.length > 0 ? (
            <>
              {pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => handlePageClick(page.slug)}
                  className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                  style={{
                    '&:hover': {
                      backgroundColor: `${primaryColor}10`,
                    },
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${primaryColor}10`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" style={{ color: primaryColor }} />
                    <span className="font-medium">{page.title}</span>
                  </div>
                  {page.excerpt && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {page.excerpt}
                    </p>
                  )}
                </button>
              ))}
            </>
          ) : (
            <div className="px-4 py-3 text-center text-slate-500 text-sm">
              No pages available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

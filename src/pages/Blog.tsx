import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, FileText, Calendar, ArrowRight, Store } from 'lucide-react';
import { apiService, type ContentPage } from '../services/api';
import { useAppSettings } from '../contexts/AppSettingsContext';
import PagesDropdown from '../components/PagesDropdown';
import Footer from '../components/Footer';

interface BlogProps {
  primaryColor: string;
}

export default function Blog({ primaryColor }: BlogProps) {
  const navigate = useNavigate();
  const { settings } = useAppSettings();
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      const data = await apiService.getPages();
      setPages(data);
    } catch (error) {
      console.error('Failed to load pages:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      <header
        className="border-b shadow-sm"
        style={{ backgroundColor: settings?.secondary_color || '#ffffff' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              {settings?.logo?.url ? (
                <img
                  src={settings.logo.url}
                  alt={settings.appname}
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <Store className="w-8 h-8" style={{ color: primaryColor }} />
              )}
              <h1 className="text-2xl font-bold text-slate-900">
                {settings?.appname?.split(' - ')[0] || 'Megzed'}
              </h1>
            </button>
            <div className="flex items-center gap-6">
              <PagesDropdown primaryColor={primaryColor} />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <FileText className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Blog & Pages</h1>
              <p className="text-lg text-slate-600 mt-2">Read the latest articles and important information</p>
            </div>
          </div>
        </div>

        {pages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">No articles available yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((page) => (
              <Link
                key={page.id}
                to={`/blog/${page.slug}`}
                className="group flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="relative overflow-hidden aspect-video bg-gradient-to-br from-slate-200 to-slate-300">
                  {page.featured_image?.preview_url ? (
                    <img
                      src={page.featured_image.preview_url}
                      alt={page.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-12 h-12 text-slate-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 p-6 flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-slate-700 transition-colors">
                    {page.title}
                  </h3>

                  {page.excerpt && (
                    <p className="text-slate-600 text-sm line-clamp-3 mb-4 flex-1">
                      {page.excerpt}
                    </p>
                  )}

                  {page.created_at && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(page.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                  )}

                  <div
                    className="inline-flex items-center gap-2 text-sm font-medium transition-all group-hover:gap-3"
                    style={{ color: primaryColor }}
                  >
                    <span>Read More</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        </div>
      </main>

      <Footer settings={settings || {}} primaryColor={primaryColor} />
    </div>
  );
}

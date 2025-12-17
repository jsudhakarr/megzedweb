import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Calendar, Share2, Store, BookOpen, Clock } from 'lucide-react';
import { apiService, type ContentPage } from '../services/api';
import { useAppSettings } from '../contexts/AppSettingsContext';
import Footer from '../components/Footer';
import HtmlContentViewer from '../components/HtmlContentViewer';

interface PageDetailProps {
  primaryColor: string;
}

export default function PageDetail({ primaryColor }: PageDetailProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { settings } = useAppSettings();
  const [page, setPage] = useState<ContentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPage();
  }, [slug]);

  const loadPage = async () => {
    if (!slug) {
      setError('Page not found');
      setLoading(false);
      return;
    }

    try {
      const data = await apiService.getPageBySlug(slug);
      setPage(data);
    } catch (error) {
      console.error('Failed to load page:', error);
      setError('Failed to load page. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: primaryColor }} />
          <p className="text-slate-500 font-medium">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center border border-slate-100">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h1>
          <p className="text-slate-600 mb-6">{error || 'The content you are looking for does not exist.'}</p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            style={{ backgroundColor: primaryColor }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b border-slate-200/80 backdrop-blur-md bg-white/90 supports-[backdrop-filter]:bg-white/60"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate('/')} 
              className="flex items-center gap-3 group"
            >
              {settings?.logo?.url ? (
                <img
                  src={settings.logo.url}
                  alt={settings.appname}
                  className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
                />
              ) : (
                <Store className="w-8 h-8" style={{ color: primaryColor }} />
              )}
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {settings?.appname?.split(' - ')[0] || 'Megzed'}
              </h1>
            </button>
            
            <button
              onClick={() => navigate('/blog')}
              className="flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all hover:bg-slate-100 active:scale-95 text-slate-700"
            >
              <BookOpen className="w-5 h-5" style={{ color: primaryColor }} />
              <span className="hidden sm:inline">Blog</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Link */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6 group"
          >
            <div className="p-1 rounded-full group-hover:bg-slate-200 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Back to Articles
          </Link>

          <article className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-100">
            
            {/* 1. TITLE & META SECTION (Now at the top) */}
            <div className="p-8 sm:p-12 pb-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
                {page.title}
              </h1>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                  {page.created_at && (
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <time dateTime={page.created_at}>
                        {new Date(page.created_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </time>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>5 min read</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: page.title,
                        url: window.location.href,
                      }).catch(console.error);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>

            {/* 2. FEATURED IMAGE (Middle - Small Banner Size) */}
            {page.featured_image?.preview_url && (
              <div className="relative w-full h-64 sm:h-80 overflow-hidden bg-slate-100">
                <img
                  src={page.featured_image.preview_url}
                  alt={page.title}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            )}

            {/* 3. CONTENT SECTION (Bottom) */}
            <div className="p-8 sm:p-12 pt-8">
              
              {/* Excerpt */}
              {page.excerpt && (
                <div className="mb-10 relative pl-6 border-l-4" style={{ borderColor: primaryColor }}>
                  <p className="text-xl text-slate-700 font-medium italic leading-relaxed">
                    {page.excerpt}
                  </p>
                </div>
              )}

              {/* HTML Content */}
              <div className="prose prose-lg prose-slate max-w-none prose-headings:font-bold prose-a:text-blue-600 hover:prose-a:text-blue-500 prose-img:rounded-2xl">
                {page.content ? (
                  <HtmlContentViewer content={page.content} primaryColor={primaryColor} />
                ) : (
                  <p className="text-slate-400 italic text-center py-12">No content available.</p>
                )}
              </div>

              {/* Gallery */}
              {page.media && page.media.length > 0 && (
                <div className="mt-16 pt-10 border-t border-slate-100">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-8 w-1 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                    <h2 className="text-2xl font-bold text-slate-900">Gallery</h2>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {page.media.map((media) => (
                      <a
                        key={media.id}
                        href={media.preview_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative block aspect-square rounded-2xl overflow-hidden bg-slate-100 cursor-zoom-in"
                      >
                        <img
                          src={media.preview_url}
                          alt="Gallery item"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </article>
        </div>
      </main>

      <Footer settings={settings || undefined} primaryColor={primaryColor} />
    </div>
  );
}
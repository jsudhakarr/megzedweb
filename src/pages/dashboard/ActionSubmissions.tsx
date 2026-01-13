import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { apiService } from '../../services/api';
import { Search, Filter, Clock, MapPin, User, Inbox, Send } from 'lucide-react';

const getItemTitle = (submission: any) =>
  submission?.item_name ||
  submission?.item_title ||
  submission?.itemTitle ||
  submission?.item?.title ||
  submission?.title ||
  'Request';

const getItemImage = (submission: any) =>
  submission?.item_image || submission?.itemImage || submission?.item?.images?.[0]?.url || null;

const getItemAddress = (submission: any) =>
  submission?.item_address ||
  submission?.itemAddress ||
  submission?.item?.address ||
  submission?.location ||
  'Location';

const getStatus = (submission: any) => submission?.status || 'Pending';

const getCounterpartyName = (submission: any, variant: 'received' | 'sent') => {
  if (variant === 'received') {
    return submission?.buyer_name || submission?.buyerName || submission?.buyer?.name || 'Buyer';
  }

  return (
    submission?.lister_name ||
    submission?.seller_name ||
    submission?.sellerName ||
    submission?.seller?.name ||
    submission?.shop?.name ||
    'Seller'
  );
};

const formatDate = (value: any) => {
  if (!value) return 'Date & Time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date & Time';
  return date.toLocaleString();
};

export default function ActionSubmissions({ variant }: { variant: 'received' | 'sent' }) {
  const { settings } = useAppSettings();
  const primaryColor = settings?.primary_color || '#0073f0';
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data =
          variant === 'received'
            ? await apiService.getReceivedActionSubmissions()
            : await apiService.getMyActionSubmissions();
        setRequests(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch action submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [variant]);

  const filteredRequests = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return requests.filter((request) => getItemTitle(request).toLowerCase().includes(query));
  }, [requests, searchQuery]);

  const title = variant === 'received' ? 'Received Requests' : 'Sent Requests';
  const subtitle =
    variant === 'received'
      ? 'Review requests submitted by buyers'
      : 'Track requests you have submitted';
  const emptyTitle = variant === 'received' ? 'No received requests' : 'No sent requests';
  const emptyMessage =
    variant === 'received'
      ? 'Buyer requests will appear here once they submit them'
      : 'Your submissions will appear here once you send them';
  const Icon = variant === 'received' ? Inbox : Send;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{title}</h1>
        <p className="text-sm sm:text-base text-slate-600">{subtitle}</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Filter className="w-5 h-5" />
            Filter
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <p className="text-slate-600">Loading {title.toLowerCase()}...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-16">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <Icon className="w-10 h-10" style={{ color: primaryColor }} />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {searchQuery ? `No ${title.toLowerCase()} found` : emptyTitle}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchQuery ? 'Try adjusting your search' : emptyMessage}
            </p>
          </div>
        ) : null}
      </div>

      {!loading && filteredRequests.length > 0 && (
        <div className="space-y-4">
          {filteredRequests.map((request: any, index: number) => (
            <div
              key={request.id || index}
              role="button"
              tabIndex={0}
              onClick={() => request?.id && navigate(`/submission-details/${request.id}`, { state: { variant } })}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && request?.id) {
                  navigate(`/submission-details/${request.id}`, { state: { variant } });
                }
              }}
              className="bg-white rounded-xl shadow-md border border-slate-200 p-4 sm:p-6 hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ '--tw-ring-color': `${primaryColor}55` } as React.CSSProperties}
            >
              <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-4">
                <div className="flex gap-3 sm:gap-4 w-full sm:w-auto">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-200 rounded-lg flex-shrink-0">
                    {getItemImage(request) && (
                      <img
                        src={getItemImage(request)}
                        alt={getItemTitle(request)}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1 truncate">{getItemTitle(request)}</h3>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 mb-1">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{getCounterpartyName(request, variant)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 mb-1">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{formatDate(request?.created_at || request?.createdAt)}</span>
                    </div>
                    {request?.action_code ? (
                      <div className="text-xs sm:text-sm text-slate-500">
                        Action: <span className="font-medium text-slate-700">{request.action_code}</span>
                      </div>
                    ) : null}
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{getItemAddress(request)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right sm:text-left w-full sm:w-auto">
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium"
                    style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                  >
                    {getStatus(request)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

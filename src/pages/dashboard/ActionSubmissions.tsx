import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { apiService } from '../../services/api';
import { Search, Filter, Clock, MapPin, User, Inbox, Send, Home, Calendar, BadgeCheck } from 'lucide-react';

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

const getCategoryName = (submission: any) =>
  submission?.category_name ||
  submission?.categoryName ||
  submission?.item?.category?.name ||
  submission?.item?.subcategory?.name ||
  submission?.category ||
  'Category';

const getCategoryIcon = (submission: any) =>
  submission?.category_icon ||
  submission?.categoryIcon ||
  submission?.item?.category?.icon?.url ||
  submission?.item?.category?.icon ||
  submission?.item?.subcategory?.icon?.url ||
  submission?.item?.subcategory?.icon ||
  null;

const getActionLabel = (submission: any) =>
  submission?.action_button_label ||
  submission?.actionButtonLabel ||
  submission?.action_label ||
  submission?.actionLabel ||
  submission?.action?.label ||
  submission?.action_code ||
  'Appointment';

const getActionIcon = (submission: any) =>
  submission?.action_button_icon_url ||
  submission?.actionButtonIconUrl ||
  submission?.action_button_icon ||
  submission?.actionButtonIcon ||
  submission?.action?.icon_url ||
  submission?.action?.icon ||
  null;

const getRequestId = (submission: any) =>
  submission?.request_code ||
  submission?.requestCode ||
  submission?.code ||
  submission?.id ||
  'REQ';

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

const getCounterpartyAvatar = (submission: any, variant: 'received' | 'sent') => {
  if (variant === 'received') {
    return (
      submission?.buyer_profile_url ||
      submission?.buyerProfileUrl ||
      submission?.buyer_avatar ||
      submission?.buyerAvatar ||
      submission?.buyer_image ||
      submission?.buyerImage ||
      submission?.buyer?.profile_photo_url ||
      submission?.buyer?.profile_url ||
      submission?.buyer?.avatar ||
      submission?.buyer?.photo ||
      null
    );
  }

  return (
    submission?.seller_profile_url ||
    submission?.sellerProfileUrl ||
    submission?.seller_avatar ||
    submission?.sellerAvatar ||
    submission?.seller_image ||
    submission?.sellerImage ||
    submission?.owner_profile_url ||
    submission?.ownerProfileUrl ||
    submission?.owner_image ||
    submission?.ownerImage ||
    submission?.seller?.profile_photo_url ||
    submission?.seller?.profile_url ||
    submission?.seller?.avatar ||
    submission?.seller?.image ||
    submission?.seller?.logo ||
    submission?.owner?.profile_photo_url ||
    submission?.owner?.profile_url ||
    submission?.owner?.avatar ||
    submission?.owner?.image ||
    submission?.shop?.logo_url ||
    submission?.shop?.logo ||
    null
  );
};

const formatDate = (value: any) => {
  if (!value) return 'Date & Time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date & Time';
  return date.toLocaleString();
};

const formatStatusLabel = (value: any) => {
  if (!value) return 'pending';
  if (typeof value === 'string') return value.toLowerCase();
  return String(value).toLowerCase();
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
          {filteredRequests.map((request: any, index: number) => {
            const requestId = getRequestId(request);
            const status = formatStatusLabel(getStatus(request));
            const avatar = getCounterpartyAvatar(request, variant);
            const categoryIcon = getCategoryIcon(request);
            const actionIcon = getActionIcon(request);
            const actionLabel = getActionLabel(request);

            return (
              <div
                key={request.id || index}
                role="button"
                tabIndex={0}
                onClick={() =>
                  request?.id && navigate(`/dashboard/submission-details/${request.id}`, { state: { variant } })
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && request?.id) {
                    navigate(`/dashboard/submission-details/${request.id}`, { state: { variant } });
                  }
                }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ '--tw-ring-color': `${primaryColor}55` } as React.CSSProperties}
              >
                <div className="flex flex-col gap-4 p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-200 overflow-hidden flex-shrink-0">
                      {getItemImage(request) && (
                        <img
                          src={getItemImage(request)}
                          alt={getItemTitle(request)}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900 text-base sm:text-lg truncate">
                        {getItemTitle(request)}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                        {categoryIcon ? (
                          <img src={categoryIcon} alt="" className="w-4 h-4 rounded object-contain" />
                        ) : (
                          <Home className="w-4 h-4 text-slate-500" />
                        )}
                        <span className="truncate">{getCategoryName(request)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-700 mt-1">
                        {actionIcon ? (
                          <img src={actionIcon} alt="" className="w-4 h-4 rounded object-contain" />
                        ) : (
                          <Calendar className="w-4 h-4 text-slate-500" />
                        )}
                        <span className="font-semibold">
                          {actionLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex flex-col gap-3 text-sm text-slate-600">
                    {variant === 'received' ? (
                      <div className="flex items-center gap-3">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={getCounterpartyName(request, variant)}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                            <User className="w-5 h-5 text-slate-500" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-wide text-slate-400">Submitted By</p>
                          <div className="flex items-center gap-2 text-slate-900 font-semibold truncate">
                            <span>{getCounterpartyName(request, variant)}</span>
                            <BadgeCheck className="w-4 h-4 text-blue-500" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span>Submitted on {formatDate(request?.created_at || request?.createdAt)}</span>
                      </div>
                    )}

                    {variant === 'received' && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span>
                          Date {formatDate(request?.created_at || request?.createdAt)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="truncate">ID : {requestId}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <span>Status :</span>
                        <span className="font-semibold text-blue-600">{status}</span>
                      </div>
                    </div>
                    {variant === 'sent' && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{getItemAddress(request)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

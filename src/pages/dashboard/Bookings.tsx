import { useState, useEffect } from 'react';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { apiService } from '../../services/api';
import { Calendar, Search, Filter, Eye, Clock, MapPin } from 'lucide-react';

export default function Bookings() {
  const { settings } = useAppSettings();
  const primaryColor = settings?.primary_color || '#0073f0';
  const [searchQuery, setSearchQuery] = useState('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await apiService.getUserBookings();
        setBookings(data);
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter(booking =>
    booking.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Bookings</h1>
        <p className="text-sm sm:text-base text-slate-600">View and manage your bookings</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search bookings..."
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
            <p className="text-slate-600">Loading your bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-16">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <Calendar className="w-10 h-10" style={{ color: primaryColor }} />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {searchQuery ? 'No bookings found' : 'No bookings yet'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchQuery ? 'Try adjusting your search' : 'Your bookings will appear here once you make one'}
            </p>
          </div>
        ) : null}
      </div>

      {!loading && filteredBookings.length > 0 && (
        <div className="space-y-4">
          {filteredBookings.map((booking: any, index: number) => (
            <div key={booking.id || index} className="bg-white rounded-xl shadow-md border border-slate-200 p-4 sm:p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-4">
                <div className="flex gap-3 sm:gap-4 w-full sm:w-auto">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-200 rounded-lg flex-shrink-0">
                    {booking.item?.images?.[0]?.url && (
                      <img
                        src={booking.item.images[0].url}
                        alt={booking.title || 'Booking'}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1 truncate">{booking.title || booking.item?.title || 'Booking'}</h3>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 mb-1">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{booking.date || 'Date & Time'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{booking.location || 'Location'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right sm:text-left w-full sm:w-auto">
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium"
                    style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                  >
                    {booking.status || 'Confirmed'}
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-xs sm:text-sm">
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

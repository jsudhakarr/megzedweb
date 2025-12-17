import { useEffect, useState } from 'react';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { getNotifications, markAllNotificationsRead, markNotificationRead, type Notification } from '../../services/api';
import { Bell, CheckCheck, Clock, Check, MailOpen } from 'lucide-react';

export default function Notifications() {
  const { settings } = useAppSettings();
  const primaryColor = settings?.primary_color || '#0073f0';

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data: any = await getNotifications();
      // Handle potential Laravel response structures
      if (Array.isArray(data)) {
        setNotifications(data);
      } else if (data && Array.isArray(data.data)) {
        setNotifications(data.data);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error(error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      await markAllNotificationsRead();
    } catch (error) {
      console.error(error);
      // Revert or show error could go here
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      await markNotificationRead(id);
    } catch (error) {
      console.error(error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-12">
      
      {/* Header & Controls Bar */}
      <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Notifications</h1>
          <p className="text-xs text-slate-500">
            You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-white font-medium rounded-md text-sm shadow-sm hover:opacity-90 transition-all whitespace-nowrap"
              style={{ backgroundColor: primaryColor }}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 border-b border-slate-100 last:border-0 animate-pulse flex gap-4">
              <div className="w-10 h-10 bg-slate-200 rounded-full flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-3 bg-slate-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-200">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <Bell className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">No notifications</h3>
          <p className="text-xs text-slate-500 mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`group p-4 transition-colors hover:bg-slate-50 cursor-pointer ${
                  !notification.read_at ? 'bg-blue-50/40' : 'bg-white'
                }`}
                onClick={() => !notification.read_at && handleMarkOneRead(notification.id)}
              >
                <div className="flex gap-4">
                  {/* Icon Indicator */}
                  <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                    !notification.read_at 
                      ? 'bg-white border-blue-100' 
                      : 'bg-slate-100 border-slate-200'
                  }`}>
                    {!notification.read_at ? (
                      <Bell className="w-4 h-4" style={{ color: primaryColor }} />
                    ) : (
                      <MailOpen className="w-4 h-4 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!notification.read_at ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {notification.title || 'Notification'}
                      </p>
                      
                      {/* Time & Read Status */}
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {new Date(notification.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className={`text-sm mt-0.5 ${!notification.read_at ? 'text-slate-800' : 'text-slate-500'}`}>
                      {notification.message}
                    </p>

                    {/* Actions Row */}
                    <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.read_at && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleMarkOneRead(notification.id); }}
                          className="text-xs font-medium hover:underline flex items-center gap-1"
                          style={{ color: primaryColor }}
                        >
                          <Check className="w-3 h-3" /> Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
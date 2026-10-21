import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Clock,
  Filter,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  MailCheck
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const [filterType, setFilterType] = useState<string>('ALL');

  const filtered = notifications.filter((n) => {
    if (filterType === 'UNREAD') return !n.is_read;
    if (filterType === 'MATURITY') return n.notification_type === 'MATURITY_ALERT';
    if (filterType === 'SCRUTINY') return n.notification_type === 'SCRUTINY_UPDATE';
    if (filterType === 'RENEWAL') return n.notification_type === 'RENEWAL_ALERT';
    if (filterType === 'RELEASE') return n.notification_type === 'RELEASE_UPDATE';
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-aicte-navy-700 uppercase tracking-wider mb-1">
            <Bell className="h-4 w-4" />
            <span>Official Communications Hub</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Notification & Escalation Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Traceable alerts for upcoming maturities, scrutiny outcomes, and renewal notices.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <MailCheck className="h-3.5 w-3.5" />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {[
          { key: 'ALL', label: 'All Alerts' },
          { key: 'UNREAD', label: `Unread (${unreadCount})` },
          { key: 'MATURITY', label: 'Maturity Alerts' },
          { key: 'SCRUTINY', label: 'Scrutiny Decisions' },
          { key: 'RENEWAL', label: 'Renewals' },
          { key: 'RELEASE', label: 'Release Updates' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterType === tab.key
                ? 'bg-aicte-navy-900 text-white font-semibold shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading alerts...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <Bell className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No Notifications Found</p>
            <p className="text-slate-400">You are all caught up on all institutional compliance events.</p>
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              className={`p-4 transition-colors flex items-start justify-between gap-4 ${
                !n.is_read ? 'bg-blue-50/40' : 'hover:bg-slate-50'
              }`}
            >
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${!n.is_read ? 'bg-blue-600' : 'bg-transparent'}`} />
                  <span className="text-xs font-bold text-slate-900">{n.subject}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-100">
                    {n.notification_type.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-600 pl-4">{n.message}</p>

                <div className="pl-4 text-[10px] text-slate-400 flex items-center gap-3">
                  <span>{new Date(n.created_at).toLocaleString()}</span>
                  <span>•</span>
                  <span>Channel: <strong className="font-medium text-slate-600">{n.delivery_provider}</strong></span>
                  {n.fdr_number && (
                    <>
                      <span>•</span>
                      <span>Ref: {n.fdr_number}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {n.fdr_id && (
                  <Link
                    to={`/fdrs/${n.fdr_id}`}
                    onClick={() => markAsRead(n.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    <span>View Record</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
                {!n.is_read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="p-1 text-slate-400 hover:text-slate-600 text-xs"
                    title="Mark Read"
                  >
                    ✓
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

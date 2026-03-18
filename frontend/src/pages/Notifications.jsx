import { useState, useEffect } from 'react';
import { notificationAPI } from '../api';
import { Bell, Package, CreditCard, Anchor, CheckCheck, Info } from 'lucide-react';

const typeIcons = { order: Package, payment: CreditCard, port: Anchor, system: Info, warning: Bell };
const typeColors = { order: 'bg-blue-50 text-blue-500', payment: 'bg-green-50 text-green-500', port: 'bg-amber-50 text-amber-500', system: 'bg-gray-50 text-gray-500', warning: 'bg-red-50 text-red-500' };

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadNotifications(); }, []);

  async function loadNotifications() {
    try {
      const res = await notificationAPI.getList({ limit: 50 });
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unread_count);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleMarkRead(id) {
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) { console.error(err); }
  }

  async function handleMarkAllRead() {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) { console.error(err); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Bell className="w-5 h-5 text-ocean-500" /> 消息中心
          {unreadCount > 0 && <span className="badge-red">{unreadCount} 条未读</span>}
        </h2>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="text-sm text-ocean-600 hover:text-ocean-700 flex items-center gap-1">
            <CheckCheck className="w-4 h-4" /> 全部已读
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : notifications.length === 0 ? (
        <div className="card text-center py-12">
          <Bell className="w-16 h-16 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">暂无消息</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const Icon = typeIcons[n.type] || Bell;
            const color = typeColors[n.type] || 'bg-gray-50 text-gray-500';
            return (
              <div key={n.id} onClick={() => !n.is_read && handleMarkRead(n.id)}
                className={`card flex items-start gap-4 cursor-pointer transition-all ${n.is_read ? 'opacity-60' : 'border-l-4 border-ocean-400'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium text-gray-800">{n.title}</h4>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-ocean-500 flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{n.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString('zh-CN')}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

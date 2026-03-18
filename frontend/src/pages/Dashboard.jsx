import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderAPI, portAPI, notificationAPI } from '../api';
import {
  Package, Truck, CheckCircle, Clock, TrendingUp, Anchor,
  AlertTriangle, ArrowRight, Ship, MapPin, CreditCard, Bell, Layers
} from 'lucide-react';

const statusColors = {
  pending: 'badge-yellow', matching: 'badge-blue', matched: 'badge-blue',
  accepted: 'badge-blue', pickup: 'badge-purple', in_transit: 'badge-purple',
  at_port: 'badge-green', completed: 'badge-green', cancelled: 'badge-red', disputed: 'badge-red'
};
const statusLabels = {
  pending: '待接单', matching: '匹配中', matched: '已匹配', accepted: '已接单',
  pickup: '提货中', in_transit: '运输中', at_port: '已到港', completed: '已完成', cancelled: '已取消', disputed: '争议中'
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [portData, setPortData] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsRes, ordersRes, portRes, notifRes] = await Promise.all([
        orderAPI.getStats(),
        orderAPI.getList({ limit: 5 }),
        portAPI.getCongestion(),
        notificationAPI.getList({ limit: 5 }),
      ]);
      setStats(statsRes.data.stats);
      setRecentOrders(ordersRes.data.orders);
      setPortData(portRes.data.congestion);
      setNotifications(notifRes.data.notifications);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isDriver = user?.role === 'driver';
  const isShipper = user?.role === 'shipper' || user?.role === 'forwarder';

  return (
    <div className="space-y-6">
      {/* 欢迎横幅 */}
      <div className="bg-gradient-to-r from-primary-500 to-ocean-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">
          {getGreeting()}，{user?.real_name || user?.username}
        </h1>
        <p className="text-white/80 text-sm">
          {isDriver ? '今日运单等您来抢，港口动态实时更新中' : '欢迎使用智航云连，您的港航物流数字助手'}
        </p>
        <div className="flex gap-3 mt-4">
          {isShipper && (
            <Link to="/orders/create" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Package className="w-4 h-4" /> 发布新订单
            </Link>
          )}
          {isDriver && (
            <Link to="/orders/available" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Truck className="w-4 h-4" /> 去抢单
            </Link>
          )}
          <Link to="/port-dynamics" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Anchor className="w-4 h-4" /> 港口动态
          </Link>
        </div>
      </div>

      {/* 数据统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">{isDriver ? '总运单' : '总订单'}</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats?.total || 0}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">已完成</span>
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats?.completed || 0}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">运输中</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Truck className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats?.in_transit || 0}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">{isDriver ? '总收入' : '总运费'}</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">¥{(stats?.revenue || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 最近订单 */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">最近订单</h3>
            <Link to="/orders" className="text-sm text-ocean-600 hover:text-ocean-700 flex items-center gap-1">
              查看全部 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>暂无订单记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link key={order.id} to={`/orders/${order.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-800">{order.order_no}</span>
                      <span className={statusColors[order.status]}>{statusLabels[order.status]}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      {order.origin_address} → {order.destination_address}
                    </p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-800">¥{order.estimated_price || '-'}</p>
                    <p className="text-xs text-gray-400">{order.container_type}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 右侧信息面板 */}
        <div className="space-y-6">
          {/* 港口拥堵指数 */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">闸口拥堵</h3>
              <Link to="/port-dynamics" className="text-xs text-ocean-600 hover:text-ocean-700">详情</Link>
            </div>
            {portData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">暂无数据</p>
            ) : (
              <div className="space-y-3">
                {portData.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{item.gate_name}</p>
                      <p className="text-xs text-gray-400">{item.port_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-16 h-2 rounded-full bg-gray-100 overflow-hidden`}>
                        <div className={`h-full rounded-full ${item.congestion_index > 6 ? 'bg-red-500' : item.congestion_index > 4 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${(item.congestion_index / 10) * 100}%` }} />
                      </div>
                      <span className={`text-xs font-medium ${item.congestion_index > 6 ? 'text-red-600' : item.congestion_index > 4 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {item.congestion_index}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 最新通知 */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">最新通知</h3>
              <Link to="/notifications" className="text-xs text-ocean-600 hover:text-ocean-700">全部</Link>
            </div>
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">暂无通知</p>
            ) : (
              <div className="space-y-3">
                {notifications.slice(0, 4).map((notif) => (
                  <div key={notif.id} className={`flex gap-3 ${notif.is_read ? 'opacity-60' : ''}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      notif.type === 'order' ? 'bg-blue-50' : notif.type === 'payment' ? 'bg-green-50' : notif.type === 'port' ? 'bg-amber-50' : 'bg-gray-50'
                    }`}>
                      {notif.type === 'order' ? <Package className="w-4 h-4 text-blue-500" /> :
                       notif.type === 'payment' ? <CreditCard className="w-4 h-4 text-green-500" /> :
                       notif.type === 'port' ? <Anchor className="w-4 h-4 text-amber-500" /> :
                       <Bell className="w-4 h-4 text-gray-500" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{notif.title}</p>
                      <p className="text-xs text-gray-400 truncate">{notif.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 司机专属：快捷功能入口 */}
      {isDriver && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/orders/available" className="card flex items-center gap-4 hover:border-blue-200">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center"><Truck className="w-6 h-6 text-blue-500" /></div>
            <div><p className="font-medium text-gray-800">抢单大厅</p><p className="text-xs text-gray-400">查看最新货源</p></div>
          </Link>
          <Link to="/consolidation" className="card flex items-center gap-4 hover:border-green-200">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center"><Layers className="w-6 h-6 text-green-500" /></div>
            <div><p className="font-medium text-gray-800">智能拼单</p><p className="text-xs text-gray-400">减少空驶多赚钱</p></div>
          </Link>
          <Link to="/port-dynamics" className="card flex items-center gap-4 hover:border-amber-200">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center"><Anchor className="w-6 h-6 text-amber-500" /></div>
            <div><p className="font-medium text-gray-800">港区动态</p><p className="text-xs text-gray-400">避开拥堵高峰</p></div>
          </Link>
          <Link to="/settlements" className="card flex items-center gap-4 hover:border-purple-200">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center"><CreditCard className="w-6 h-6 text-purple-500" /></div>
            <div><p className="font-medium text-gray-800">结算中心</p><p className="text-xs text-gray-400">查看运费到账</p></div>
          </Link>
        </div>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return '夜深了';
  if (h < 12) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../api';
import { Package, MapPin, Filter, Search, ChevronRight, Clock } from 'lucide-react';

const statusColors = {
  pending: 'badge-yellow', matching: 'badge-blue', matched: 'badge-blue',
  accepted: 'badge-blue', pickup: 'badge-purple', in_transit: 'badge-purple',
  at_port: 'badge-green', completed: 'badge-green', cancelled: 'badge-red', disputed: 'badge-red'
};
const statusLabels = {
  pending: '待接单', matching: '匹配中', matched: '已匹配', accepted: '已接单',
  pickup: '提货中', in_transit: '运输中', at_port: '已到港', completed: '已完成', cancelled: '已取消', disputed: '争议中'
};

export default function OrderList() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });

  useEffect(() => { loadOrders(); }, [filter]);

  async function loadOrders(page = 1) {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filter) params.status = filter;
      const res = await orderAPI.getList(params);
      setOrders(res.data.orders);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('加载订单失败:', err);
    } finally {
      setLoading(false);
    }
  }

  const filters = [
    { value: '', label: '全部' },
    { value: 'pending', label: '待接单' },
    { value: 'accepted', label: '已接单' },
    { value: 'in_transit', label: '运输中' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-800">{user?.role === 'driver' ? '我的运单' : '我的订单'}</h2>
        {(user?.role === 'shipper' || user?.role === 'forwarder') && (
          <Link to="/orders/create" className="btn-primary flex items-center gap-2 text-sm">
            <Package className="w-4 h-4" /> 发布新订单
          </Link>
        )}
      </div>

      {/* 状态筛选 */}
      <div className="flex flex-wrap gap-2">
        {filters.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${filter === f.value ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* 订单列表 */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="w-16 h-16 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">暂无订单</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <Link key={order.id} to={`/orders/${order.id}`} className="card block hover:border-ocean-200 transition-colors">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">{order.order_no}</span>
                    <span className={statusColors[order.status]}>{statusLabels[order.status]}</span>
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(order.created_at).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary-500">¥{order.estimated_price || order.final_price || '-'}</p>
                  <p className="text-xs text-gray-400">{order.container_type}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center mt-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <div className="w-0.5 h-8 bg-gray-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate mb-2">{order.origin_address}</p>
                  <p className="text-sm text-gray-700 truncate">{order.destination_address}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 mt-4" />
              </div>

              {(order.driver_name || order.shipper_name) && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  {order.driver_name && <span>司机：{order.driver_name} {order.license_plate && `(${order.license_plate})`}</span>}
                  {order.shipper_name && <span>货主：{order.shipper_name} {order.company_name && `- ${order.company_name}`}</span>}
                  {order.cargo_type && <span>货物：{order.cargo_type}</span>}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* 分页 */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          {Array.from({ length: pagination.pages }, (_, i) => (
            <button key={i + 1} onClick={() => loadOrders(i + 1)}
              className={`w-9 h-9 rounded-lg text-sm ${pagination.page === i + 1 ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

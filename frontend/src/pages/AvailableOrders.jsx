import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../api';
import { Truck, MapPin, Clock, Package, Filter, Zap, Star, ChevronRight } from 'lucide-react';

const containerTypes = ['全部', '20GP', '40GP', '40HQ', '45HQ', '20RF', '40RF'];

export default function AvailableOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ container_type: '', port_name: '' });
  const [accepting, setAccepting] = useState(null);

  useEffect(() => { loadOrders(); }, [filter]);

  async function loadOrders() {
    setLoading(true);
    try {
      const params = {};
      if (filter.container_type) params.container_type = filter.container_type;
      if (filter.port_name) params.port_name = filter.port_name;
      const res = await orderAPI.getAvailable(params);
      setOrders(res.data.orders);
    } catch (err) {
      console.error('加载可接订单失败:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(orderId, e) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('确认接取该订单？接单后需按时完成运输。')) return;
    setAccepting(orderId);
    try {
      await orderAPI.accept(orderId);
      alert('接单成功！请前往"我的运单"查看详情。');
      loadOrders();
    } catch (err) {
      alert(err.response?.data?.error || '接单失败');
    } finally {
      setAccepting(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> 抢单大厅
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">发现附近的一手货源，告别空驶多赚钱</p>
        </div>
        <span className="badge-green text-sm">{orders.length} 单可接</span>
      </div>

      {/* 筛选区 */}
      <div className="card py-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">箱型：</span>
            <div className="flex flex-wrap gap-1">
              {containerTypes.map(ct => (
                <button key={ct} onClick={() => setFilter({...filter, container_type: ct === '全部' ? '' : ct})}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${(ct === '全部' && !filter.container_type) || filter.container_type === ct ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {ct}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">港口：</span>
            <select className="input-field py-1 text-sm w-auto" value={filter.port_name} onChange={(e) => setFilter({...filter, port_name: e.target.value})}>
              <option value="">全部港口</option>
              <option value="洋山">上海洋山港</option>
              <option value="外高桥">上海外高桥港</option>
              <option value="宁波">宁波舟山港</option>
            </select>
          </div>
        </div>
      </div>

      {/* 订单列表 */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="card text-center py-16">
          <Truck className="w-16 h-16 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-lg mb-1">暂时没有可接的订单</p>
          <p className="text-gray-300 text-sm">新订单会实时推送，请稍后刷新</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {orders.map(order => (
            <Link key={order.id} to={`/orders/${order.id}`} className="card hover:border-ocean-300 hover:shadow-lg transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="badge-blue text-xs mb-1">{order.container_type}</span>
                  {order.cargo_type && <span className="badge-gray text-xs ml-1">{order.cargo_type}</span>}
                </div>
                <p className="text-xl font-bold text-primary-500">¥{order.estimated_price}</p>
              </div>

              <div className="flex items-start gap-3 mb-4">
                <div className="flex flex-col items-center mt-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <div className="w-0.5 h-6 bg-gray-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{order.origin_address}</p>
                  <p className="text-sm text-gray-700 truncate mt-2">{order.destination_address}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {order.pickup_time ? new Date(order.pickup_time).toLocaleString('zh-CN', {month:'numeric',day:'numeric',hour:'numeric',minute:'numeric'}) : '时间待定'}</span>
                <span>{order.port_name}</span>
                {order.weight && <span>{order.weight}吨</span>}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Star className="w-3 h-3 text-amber-400" />
                  <span>货主信用: {order.shipper_credit || '-'}分</span>
                  {order.shipper_company && <span className="ml-2">{order.shipper_company}</span>}
                </div>
                <button
                  onClick={(e) => handleAccept(order.id, e)}
                  disabled={accepting === order.id}
                  className="bg-accent-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-accent-600 transition-colors flex items-center gap-1"
                >
                  {accepting === order.id ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Truck className="w-3.5 h-3.5" /> 立即接单</>}
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

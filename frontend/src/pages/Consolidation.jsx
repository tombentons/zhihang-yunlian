import { useState } from 'react';
import { consolidationAPI } from '../api';
import { Layers, Truck, MapPin, TrendingDown, Zap, Search, DollarSign, Route } from 'lucide-react';

export default function Consolidation() {
  const [plans, setPlans] = useState([]);
  const [nearbyContainers, setNearbyContainers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [form, setForm] = useState({ current_lat: 31.2, current_lng: 121.5, max_distance_km: 80 });

  async function handleSearch() {
    setLoading(true);
    try {
      const res = await consolidationAPI.smartMatch(form);
      setPlans(res.data.plans || []);
      setNearbyContainers(res.data.nearby_empty_containers || []);
      setSearched(true);
    } catch (err) {
      alert(err.response?.data?.error || '匹配失败');
    } finally {
      setLoading(false);
    }
  }

  const typeLabels = { single: '单程运输', double_load: '双重运输', return_cargo: '返程配货', nearby_return: '就近接单' };
  const typeColors = { single: 'badge-blue', double_load: 'badge-green', return_cargo: 'badge-purple', nearby_return: 'badge-yellow' };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Layers className="w-5 h-5 text-accent-500" /> 智能拼单
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">基于运筹优化算法，为您推荐最优的双重运输/返程配货方案，减少空驶多赚钱</p>
      </div>

      {/* 搜索区 */}
      <div className="card bg-gradient-to-r from-accent-50 to-emerald-50 border-accent-200">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-accent-600" /> 一键智能匹配
        </h3>
        <p className="text-sm text-gray-500 mb-4">输入您当前的位置，系统将根据附近的待运订单和空箱信息，为您推荐最优拼单方案</p>
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">当前纬度</label>
            <input type="number" step="0.01" className="input-field" value={form.current_lat} onChange={(e) => setForm({...form, current_lat: parseFloat(e.target.value) || 0})} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">当前经度</label>
            <input type="number" step="0.01" className="input-field" value={form.current_lng} onChange={(e) => setForm({...form, current_lng: parseFloat(e.target.value) || 0})} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">搜索半径(km)</label>
            <input type="number" className="input-field" value={form.max_distance_km} onChange={(e) => setForm({...form, max_distance_km: parseInt(e.target.value) || 50})} />
          </div>
          <div className="flex items-end">
            <button onClick={handleSearch} disabled={loading} className="btn-accent w-full flex items-center justify-center gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Search className="w-4 h-4" /> 开始匹配</>}
            </button>
          </div>
        </div>
      </div>

      {/* 匹配结果 */}
      {searched && (
        <>
          {plans.length === 0 ? (
            <div className="card text-center py-12">
              <Route className="w-16 h-16 mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400 text-lg">附近暂无可拼单的订单</p>
              <p className="text-gray-300 text-sm mt-1">请调整搜索半径或稍后重试</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">为您找到 {plans.length} 个方案</h3>
              {plans.map((plan, i) => (
                <div key={i} className={`card border-l-4 ${plan.type === 'double_load' ? 'border-green-500' : 'border-blue-500'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-300">#{i + 1}</span>
                      <span className={typeColors[plan.plan_type] || 'badge-blue'}>{typeLabels[plan.plan_type] || plan.type}</span>
                      {plan.type === 'double_load' && <span className="badge-green">推荐</span>}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-accent-600">¥{plan.estimated_earnings}</p>
                      <p className="text-xs text-gray-400">预计收入</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mb-3">{plan.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-800">{plan.total_distance}km</p>
                      <p className="text-xs text-gray-400">总行程</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-amber-600">{plan.empty_km}km</p>
                      <p className="text-xs text-gray-400">空驶里程</p>
                    </div>
                    {plan.saved_empty_km && (
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">-{plan.saved_empty_km}km</p>
                        <p className="text-xs text-gray-400">减少空驶</p>
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary-500">{plan.efficiency_score}分</p>
                      <p className="text-xs text-gray-400">效率评分</p>
                    </div>
                  </div>

                  {plan.estimated_savings > 0 && (
                    <div className="mt-3 p-2 bg-green-50 rounded-lg flex items-center gap-2 text-sm text-green-700">
                      <TrendingDown className="w-4 h-4" /> 相比单程运输，该方案可节省约 ¥{plan.estimated_savings} 的空驶成本
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-2">包含订单：</p>
                    {plan.orders.map((order, j) => (
                      <div key={j} className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="truncate">{order.origin_address} → {order.destination_address}</span>
                        <span className="text-xs badge-gray flex-shrink-0">{order.container_type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 附近空箱堆场 */}
          {nearbyContainers.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Truck className="w-5 h-5 text-ocean-500" /> 附近可还箱堆场
              </h3>
              <div className="grid md:grid-cols-3 gap-3">
                {nearbyContainers.map((c, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-800 text-sm">{c.yard_name}</p>
                    <p className="text-xs text-gray-500">{c.shipping_company} | {c.container_type} x {c.quantity}</p>
                    <p className="text-xs text-ocean-600 mt-1">距您 {c.distance_km}km</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

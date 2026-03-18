import { useState, useEffect } from 'react';
import { containerAPI } from '../api';
import { Box, MapPin, Ship, Filter, Search, Truck } from 'lucide-react';

export default function EmptyContainers() {
  const [containers, setContainers] = useState([]);
  const [matchResults, setMatchResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ container_type: '', yard_name: '', action_type: '' });
  const [matchForm, setMatchForm] = useState({ container_type: '40GP', action_type: 'pickup', current_lat: 31.2, current_lng: 121.5 });

  useEffect(() => { loadContainers(); }, [filter]);

  async function loadContainers() {
    setLoading(true);
    try {
      const res = await containerAPI.getEmpty(filter);
      setContainers(res.data.containers);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleMatch() {
    try {
      const res = await containerAPI.match(matchForm);
      setMatchResults(res.data);
    } catch (err) { alert(err.response?.data?.error || '匹配失败'); }
  }

  const actionLabels = { pickup: '提箱', return: '还箱', both: '提/还' };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Box className="w-5 h-5 text-ocean-500" /> 空箱动态</h2>
        <p className="text-sm text-gray-500 mt-0.5">实时查看各堆场空箱库存，智能匹配最优提还箱方案</p>
      </div>

      {/* 智能匹配卡片 */}
      <div className="card bg-gradient-to-r from-accent-50 to-green-50 border-accent-200">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Truck className="w-5 h-5 text-accent-600" /> 智能空箱匹配</h3>
        <div className="grid md:grid-cols-4 gap-3">
          <select className="input-field" value={matchForm.container_type} onChange={(e) => setMatchForm({...matchForm, container_type: e.target.value})}>
            <option value="20GP">20GP</option><option value="40GP">40GP</option><option value="40HQ">40HQ</option><option value="20RF">20RF</option>
          </select>
          <select className="input-field" value={matchForm.action_type} onChange={(e) => setMatchForm({...matchForm, action_type: e.target.value})}>
            <option value="pickup">我要提箱</option><option value="return">我要还箱</option>
          </select>
          <input className="input-field" placeholder="当前纬度" type="number" step="0.01" value={matchForm.current_lat} onChange={(e) => setMatchForm({...matchForm, current_lat: parseFloat(e.target.value)})} />
          <button onClick={handleMatch} className="btn-accent flex items-center justify-center gap-2"><Search className="w-4 h-4" /> 智能匹配</button>
        </div>
      </div>

      {/* 匹配结果 */}
      {matchResults && (
        <div className="card border-accent-200">
          <h3 className="font-semibold text-gray-800 mb-3">匹配结果（{matchResults.total_available} 个堆场可用）</h3>
          {matchResults.recommendations.length === 0 ? (
            <p className="text-gray-400 text-center py-4">附近暂无匹配的空箱</p>
          ) : (
            <div className="space-y-3">
              {matchResults.recommendations.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-accent-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{r.rank}</div>
                    <div>
                      <p className="font-medium text-gray-800">{r.container.yard_name}</p>
                      <p className="text-xs text-gray-500">{r.container.shipping_company} | {r.container.container_type} x {r.container.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-accent-600">{r.recommendation}</p>
                    <p className="text-xs text-gray-400">{r.container.distance_km ? `${r.container.distance_km}km` : ''} {r.estimated_savings > 0 ? `可省¥${r.estimated_savings}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 筛选 */}
      <div className="flex flex-wrap gap-2">
        <select className="input-field py-2 text-sm w-auto" value={filter.container_type} onChange={(e) => setFilter({...filter, container_type: e.target.value})}>
          <option value="">全部箱型</option><option value="20GP">20GP</option><option value="40GP">40GP</option><option value="40HQ">40HQ</option><option value="20RF">20RF</option>
        </select>
        <select className="input-field py-2 text-sm w-auto" value={filter.action_type} onChange={(e) => setFilter({...filter, action_type: e.target.value})}>
          <option value="">全部类型</option><option value="pickup">可提箱</option><option value="return">可还箱</option>
        </select>
      </div>

      {/* 空箱列表 */}
      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-4 border-ocean-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {containers.map(c => (
            <div key={c.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <span className="badge-blue">{c.container_type}</span>
                <span className={`badge ${c.action_type === 'pickup' ? 'badge-green' : c.action_type === 'return' ? 'badge-yellow' : 'badge-purple'}`}>
                  {actionLabels[c.action_type]}
                </span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-1">{c.yard_name}</h4>
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><MapPin className="w-3 h-3" />{c.yard_address}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-400">船公司：</span><span className="text-gray-700">{c.shipping_company || '-'}</span></div>
                <div><span className="text-gray-400">库存：</span><span className="text-gray-700 font-semibold">{c.quantity} 个</span></div>
                <div><span className="text-gray-400">可用期：</span><span className="text-gray-700">{c.available_from ? new Date(c.available_from).toLocaleDateString('zh-CN') : '-'}</span></div>
                <div><span className="text-gray-400">截止：</span><span className="text-gray-700">{c.available_until ? new Date(c.available_until).toLocaleDateString('zh-CN') : '-'}</span></div>
              </div>
              {c.notes && <p className="text-xs text-amber-600 mt-2 bg-amber-50 px-2 py-1 rounded">{c.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

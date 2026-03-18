import { useState, useEffect } from 'react';
import { portAPI } from '../api';
import { Anchor, Ship, AlertTriangle, Clock, Info, BarChart3, Navigation } from 'lucide-react';

const categories = [
  { value: '', label: '全部', icon: Anchor },
  { value: 'congestion', label: '闸口拥堵', icon: BarChart3 },
  { value: 'berth', label: '船舶动态', icon: Ship },
  { value: 'yard', label: '堆场作业', icon: Navigation },
  { value: 'restriction', label: '限行通知', icon: AlertTriangle },
  { value: 'notice', label: '港区公告', icon: Info },
];

const categoryColors = {
  congestion: 'bg-red-50 border-red-200 text-red-700',
  berth: 'bg-blue-50 border-blue-200 text-blue-700',
  yard: 'bg-green-50 border-green-200 text-green-700',
  restriction: 'bg-amber-50 border-amber-200 text-amber-700',
  notice: 'bg-purple-50 border-purple-200 text-purple-700',
};

const categoryIcons = {
  congestion: BarChart3, berth: Ship, yard: Navigation, restriction: AlertTriangle, notice: Info,
};

const categoryLabels = {
  congestion: '闸口拥堵', berth: '船舶动态', yard: '堆场作业', restriction: '限行通知', notice: '港区公告',
};

export default function PortDynamics() {
  const [dynamics, setDynamics] = useState([]);
  const [congestion, setCongestion] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ category: '', port_name: '' });

  useEffect(() => { loadData(); }, [filter]);

  async function loadData() {
    setLoading(true);
    try {
      const [dynRes, congRes, overRes] = await Promise.all([
        portAPI.getDynamics(filter),
        portAPI.getCongestion(),
        portAPI.getOverview(),
      ]);
      setDynamics(dynRes.data.dynamics);
      setCongestion(congRes.data.congestion);
      setOverview(overRes.data.overview);
    } catch (err) {
      console.error('加载港口数据失败:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Anchor className="w-5 h-5 text-ocean-500" /> 港口动态中心
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">实时掌握港区闸口拥堵、船舶动态、堆场作业等核心信息</p>
      </div>

      {/* 拥堵指数看板 */}
      {congestion.length > 0 && (
        <div className="card bg-gradient-to-r from-ocean-50 to-blue-50 border-ocean-200">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-ocean-500" /> 实时闸口拥堵指数
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {congestion.map((item, i) => {
              const level = item.congestion_index > 6 ? 'high' : item.congestion_index > 4 ? 'medium' : 'low';
              const colors = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-green-500' };
              const labels = { high: '严重拥堵', medium: '中度拥堵', low: '通行顺畅' };
              const textColors = { high: 'text-red-600', medium: 'text-amber-600', low: 'text-green-600' };
              return (
                <div key={i} className="bg-white rounded-xl p-3 text-center shadow-sm">
                  <p className="text-xs text-gray-500 truncate mb-2">{item.gate_name}</p>
                  <div className="relative w-14 h-14 mx-auto mb-2">
                    <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                      <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
                        stroke={level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#22c55e'}
                        strokeWidth="3" strokeDasharray={`${item.congestion_index * 10}, 100`} />
                    </svg>
                    <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${textColors[level]}`}>
                      {item.congestion_index}
                    </span>
                  </div>
                  <p className={`text-[10px] font-medium ${textColors[level]}`}>{labels[level]}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">约{item.estimated_wait_minutes}分钟</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2">
        {categories.map(c => {
          const Icon = c.icon;
          return (
            <button key={c.value} onClick={() => setFilter({...filter, category: c.value})}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-colors ${
                filter.category === c.value ? 'bg-ocean-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}>
              <Icon className="w-4 h-4" /> {c.label}
            </button>
          );
        })}
        <select className="input-field py-2 text-sm w-auto" value={filter.port_name} onChange={(e) => setFilter({...filter, port_name: e.target.value})}>
          <option value="">全部港口</option>
          <option value="上海洋山港">上海洋山港</option>
          <option value="上海外高桥港">上海外高桥港</option>
          <option value="宁波舟山港">宁波舟山港</option>
        </select>
      </div>

      {/* 动态列表 */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-ocean-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : dynamics.length === 0 ? (
        <div className="card text-center py-12">
          <Anchor className="w-16 h-16 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">暂无相关港口动态</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dynamics.map(item => {
            const Icon = categoryIcons[item.category] || Info;
            return (
              <div key={item.id} className={`card border-l-4 ${categoryColors[item.category] || 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold text-gray-800">{item.title}</h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/50 text-gray-500">{item.port_name}</span>
                      <span className="text-xs text-gray-400">{categoryLabels[item.category]}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{item.content}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                      {item.congestion_index && (
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" /> 拥堵指数: {item.congestion_index}/10
                        </span>
                      )}
                      {item.estimated_wait_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> 预计等待: {item.estimated_wait_minutes}分钟
                        </span>
                      )}
                      {item.ship_name && (
                        <span className="flex items-center gap-1">
                          <Ship className="w-3 h-3" /> {item.ship_name}
                        </span>
                      )}
                      {item.ship_eta && (
                        <span>ETA: {new Date(item.ship_eta).toLocaleString('zh-CN', {month:'numeric',day:'numeric',hour:'numeric',minute:'numeric'})}</span>
                      )}
                      {item.source && <span>来源: {item.source}</span>}
                      <span>{new Date(item.updated_at).toLocaleString('zh-CN')}</span>
                    </div>
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

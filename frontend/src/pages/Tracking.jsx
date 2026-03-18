import { useState } from 'react';
import { trackingAPI } from '../api';
import { MapPin, Search, Navigation, Clock, Truck } from 'lucide-react';

export default function Tracking() {
  const [orderId, setOrderId] = useState('');
  const [trackData, setTrackData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch() {
    if (!orderId) { setError('请输入订单ID'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await trackingAPI.getTrack(orderId);
      setTrackData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || '查询失败');
      setTrackData(null);
    } finally {
      setLoading(false);
    }
  }

  const statusLabels = { pending: '待接单', accepted: '已接单', pickup: '提货中', in_transit: '运输中', at_port: '已到港', completed: '已完成' };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><MapPin className="w-5 h-5 text-ocean-500" /> 物流追踪</h2>
        <p className="text-sm text-gray-500 mt-0.5">输入订单ID，实时查看货物运输轨迹（模拟北斗定位）</p>
      </div>

      <div className="card">
        <div className="flex gap-3">
          <input className="input-field flex-1" placeholder="请输入订单ID（如：1、2、3...）" value={orderId} onChange={(e) => setOrderId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
          <button onClick={handleSearch} disabled={loading} className="btn-ocean flex items-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Search className="w-4 h-4" /> 查询轨迹</>}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <p className="text-xs text-gray-400 mt-2">提示：可查询订单ID 1-10，其中订单4有完整的模拟轨迹数据</p>
      </div>

      {trackData && (
        <div className="space-y-4">
          {/* 订单概要 */}
          <div className="card bg-gradient-to-r from-ocean-50 to-blue-50 border-ocean-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-800 text-lg">订单 {trackData.order_no}</p>
                <p className="text-sm text-gray-500">状态：<span className="badge-blue">{statusLabels[trackData.order_status] || trackData.order_status}</span></p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">轨迹点数</p>
                <p className="text-2xl font-bold text-ocean-600">{trackData.total_points}</p>
              </div>
            </div>
          </div>

          {/* 最新位置 */}
          {trackData.latest_position && (
            <div className="card border-green-200">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-green-500" /> 最新位置
              </h3>
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div><span className="text-gray-400">纬度：</span><span className="font-medium">{trackData.latest_position.latitude.toFixed(6)}</span></div>
                <div><span className="text-gray-400">经度：</span><span className="font-medium">{trackData.latest_position.longitude.toFixed(6)}</span></div>
                <div><span className="text-gray-400">速度：</span><span className="font-medium">{trackData.latest_position.speed?.toFixed(0) || 0} km/h</span></div>
                <div><span className="text-gray-400">时间：</span><span className="font-medium">{new Date(trackData.latest_position.recorded_at).toLocaleString('zh-CN')}</span></div>
              </div>
              {trackData.latest_position.status_note && (
                <p className="mt-2 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg"><Truck className="w-3 h-3 inline mr-1" />{trackData.latest_position.status_note}</p>
              )}
            </div>
          )}

          {/* 轨迹时间线 */}
          {trackData.track.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-ocean-500" /> 轨迹时间线
              </h3>
              <div className="space-y-0">
                {trackData.track.slice().reverse().map((point, i) => (
                  <div key={point.id} className="flex gap-4 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${i === 0 ? 'bg-green-500 ring-4 ring-green-100' : 'bg-gray-300'}`} />
                      {i < trackData.track.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0 pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-700">
                          {point.status_note || `经过坐标 (${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)})`}
                        </p>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {point.speed ? `${point.speed.toFixed(0)}km/h` : ''}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(point.recorded_at).toLocaleString('zh-CN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {trackData.total_points === 0 && (
            <div className="card text-center py-12">
              <Navigation className="w-16 h-16 mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400">该订单暂无轨迹数据</p>
              <p className="text-gray-300 text-sm mt-1">可在订单详情页点击"生成模拟轨迹"按钮</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

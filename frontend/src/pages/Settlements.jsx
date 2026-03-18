import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { settlementAPI } from '../api';
import { CreditCard, CheckCircle, Clock, DollarSign, TrendingUp, ArrowUpRight } from 'lucide-react';

const statusLabels = { pending: '待结算', processing: '处理中', completed: '已到账', failed: '结算失败' };
const statusColors = { pending: 'badge-yellow', processing: 'badge-blue', completed: 'badge-green', failed: 'badge-red' };

export default function Settlements() {
  const { user } = useAuth();
  const [settlements, setSettlements] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { loadData(); }, [filter]);

  async function loadData() {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.status = filter;
      const res = await settlementAPI.getList(params);
      setSettlements(res.data.settlements);
      setStats(res.data.stats || {});
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const isDriver = user?.role === 'driver';

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-ocean-500" /> {isDriver ? '结算中心' : '费用中心'}
      </h2>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">{isDriver ? '总收入' : '总支出'}</span>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">¥{(isDriver ? stats.total_driver_amount : stats.total_amount || 0).toLocaleString()}</p>
        </div>
        {isDriver && (
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">平台服务费</span>
              <ArrowUpRight className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">¥{(stats.total_platform_fee || 0).toLocaleString()}</p>
          </div>
        )}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">交易笔数</span>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{settlements.length}</p>
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex gap-2">
        {['', 'pending', 'completed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm ${filter === f ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}>
            {f === '' ? '全部' : statusLabels[f]}
          </button>
        ))}
      </div>

      {/* 结算列表 */}
      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : settlements.length === 0 ? (
        <div className="card text-center py-12">
          <CreditCard className="w-16 h-16 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">暂无结算记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {settlements.map(s => (
            <div key={s.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.status === 'completed' ? 'bg-green-50' : 'bg-amber-50'}`}>
                  {s.status === 'completed' ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Clock className="w-5 h-5 text-amber-500" />}
                </div>
                <div>
                  <p className="font-medium text-gray-800">订单 {s.order_no}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <span className={statusColors[s.status]}>{statusLabels[s.status]}</span>
                    {s.paid_at && <span>到账时间: {new Date(s.paid_at).toLocaleString('zh-CN')}</span>}
                    {isDriver && s.shipper_name && <span>货主: {s.shipper_name}</span>}
                    {!isDriver && s.driver_name && <span>司机: {s.driver_name}</span>}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${isDriver ? 'text-green-600' : 'text-gray-800'}`}>
                  {isDriver ? '+' : ''}¥{isDriver ? s.driver_amount : s.amount}
                </p>
                {isDriver && <p className="text-xs text-gray-400">服务费 ¥{s.platform_fee}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

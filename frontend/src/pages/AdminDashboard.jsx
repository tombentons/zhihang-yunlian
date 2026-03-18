import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../api';
import { BarChart3, Users, Package, DollarSign, TrendingUp, Clock, Shield, Anchor } from 'lucide-react';

const roleLabels = { shipper: '货主', driver: '司机', forwarder: '货代', admin: '管理员' };
const statusLabels = {
  pending: '待接单', matching: '匹配中', accepted: '已接单', pickup: '提货中',
  in_transit: '运输中', at_port: '已到港', completed: '已完成', cancelled: '已取消'
};
const statusColors = {
  pending: 'bg-yellow-400', accepted: 'bg-blue-400', in_transit: 'bg-purple-400',
  completed: 'bg-green-400', cancelled: 'bg-red-400'
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard().then(res => setData(res.data.dashboard)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!data) return <div className="card text-center py-12"><p className="text-gray-400">加载失败</p></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-ocean-500" /> 管理后台数据总览
      </h2>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">总用户数</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Users className="w-5 h-5 text-blue-500" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{data.total_users}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {data.users_by_role.map(r => (
              <span key={r.role} className="text-xs text-gray-400">{roleLabels[r.role]}: {r.count}</span>
            ))}
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">总订单数</span>
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center"><Package className="w-5 h-5 text-green-500" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{data.total_orders}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">总交易额</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><DollarSign className="w-5 h-5 text-amber-500" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-800">¥{data.total_revenue.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">平台收入</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-purple-500" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-800">¥{data.total_platform_fee.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 订单状态分布 */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">订单状态分布</h3>
          <div className="space-y-3">
            {data.orders_by_status.map(item => {
              const pct = data.total_orders > 0 ? Math.round((item.count / data.total_orders) * 100) : 0;
              return (
                <div key={item.status} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-16">{statusLabels[item.status] || item.status}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${statusColors[item.status] || 'bg-gray-400'}`} style={{ width: `${Math.max(pct, 2)}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-16 text-right">{item.count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 热门港口 */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Anchor className="w-4 h-4 text-ocean-500" /> 热门港口
          </h3>
          {data.top_ports.length === 0 ? (
            <p className="text-gray-400 text-center py-8">暂无数据</p>
          ) : (
            <div className="space-y-3">
              {data.top_ports.map((port, i) => (
                <div key={port.port_name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-gray-400 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {i + 1}
                    </div>
                    <span className="font-medium text-gray-800">{port.port_name}</span>
                  </div>
                  <span className="text-sm font-semibold text-primary-500">{port.order_count} 单</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 待审核 */}
        {data.pending_reviews > 0 && (
          <div className="card border-amber-200 bg-amber-50">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-amber-500" />
              <div>
                <h3 className="font-semibold text-gray-800">待审核用户</h3>
                <p className="text-sm text-gray-500">有 {data.pending_reviews} 个司机账户等待资质审核</p>
              </div>
              <Link to="/admin/users" className="ml-auto btn-primary text-sm">去审核</Link>
            </div>
          </div>
        )}

        {/* 近7天订单趋势 */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">近7天订单趋势</h3>
          {data.order_trend.length === 0 ? (
            <p className="text-gray-400 text-center py-8">暂无数据</p>
          ) : (
            <div className="flex items-end gap-2 h-40">
              {data.order_trend.map((item, i) => {
                const maxCount = Math.max(...data.order_trend.map(t => t.count), 1);
                const height = (item.count / maxCount) * 100;
                return (
                  <div key={item.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium text-gray-700">{item.count}</span>
                    <div className="w-full bg-ocean-400 rounded-t-lg transition-all" style={{ height: `${Math.max(height, 5)}%` }} />
                    <span className="text-[10px] text-gray-400">{item.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

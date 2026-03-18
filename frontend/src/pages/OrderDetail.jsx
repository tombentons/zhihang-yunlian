import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderAPI, trackingAPI, ratingAPI } from '../api';
import { ArrowLeft, MapPin, Package, Truck, Clock, Star, CheckCircle, Navigation, User, Phone, CreditCard, AlertTriangle } from 'lucide-react';

const statusLabels = {
  pending: '待接单', matching: '匹配中', matched: '已匹配', accepted: '已接单',
  pickup: '提货中', in_transit: '运输中', at_port: '已到港', completed: '已完成', cancelled: '已取消', disputed: '争议中'
};
const statusSteps = ['pending', 'accepted', 'pickup', 'in_transit', 'at_port', 'completed'];

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [trackData, setTrackData] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [ratingForm, setRatingForm] = useState({ score: 5, comment: '' });

  useEffect(() => { loadOrder(); }, [id]);

  async function loadOrder() {
    try {
      const res = await orderAPI.getDetail(id);
      setOrder(res.data.order);
      setTrackData(res.data.trackingRecords || []);
      setRatings(res.data.ratings || []);
    } catch (err) {
      console.error('加载订单失败:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    if (!confirm('确认接取该订单？')) return;
    setActionLoading(true);
    try {
      await orderAPI.accept(id);
      await loadOrder();
    } catch (err) {
      alert(err.response?.data?.error || '接单失败');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStatusUpdate(status) {
    const labels = { pickup: '确认开始提货？', in_transit: '确认开始运输？', at_port: '确认已到达港区？', completed: '确认运输完成？', cancelled: '确认取消订单？' };
    if (!confirm(labels[status] || '确认更新状态？')) return;
    setActionLoading(true);
    try {
      await orderAPI.updateStatus(id, { status });
      await loadOrder();
    } catch (err) {
      alert(err.response?.data?.error || '状态更新失败');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSubmitRating() {
    const ratedId = user.role === 'driver' ? order.shipper_id : order.driver_id;
    try {
      await ratingAPI.create({ order_id: order.id, rated_id: ratedId, ...ratingForm });
      setShowRating(false);
      await loadOrder();
      alert('评价提交成功');
    } catch (err) {
      alert(err.response?.data?.error || '评价提交失败');
    }
  }

  async function handleSimulateTrack() {
    try {
      await trackingAPI.simulate(id);
      await loadOrder();
      alert('模拟轨迹生成成功');
    } catch (err) {
      alert(err.response?.data?.error || '轨迹生成失败');
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!order) return <div className="card text-center py-12"><p className="text-gray-400">订单不存在</p></div>;

  const currentStep = statusSteps.indexOf(order.status);
  const isDriver = user?.role === 'driver' && order.driver_id === user.id;
  const isShipper = (user?.role === 'shipper' || user?.role === 'forwarder') && order.shipper_id === user.id;
  const canRate = order.status === 'completed' && ((isShipper && !order.shipper_rated) || (isDriver && !order.driver_rated));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> 返回
      </button>

      {/* 订单头部 */}
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">订单 {order.order_no}</h2>
            <p className="text-sm text-gray-500">创建时间：{new Date(order.created_at).toLocaleString('zh-CN')}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-500">¥{order.final_price || order.estimated_price || '-'}</p>
            <p className="text-xs text-gray-400">
              {order.final_price ? '实付金额' : '预估运费'} | {order.container_type}
            </p>
          </div>
        </div>

        {/* 状态进度条 */}
        {order.status !== 'cancelled' && (
          <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2">
            {statusSteps.map((step, i) => (
              <div key={step} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    i <= currentStep ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {i <= currentStep ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-[10px] mt-1 ${i <= currentStep ? 'text-primary-500 font-medium' : 'text-gray-400'}`}>
                    {statusLabels[step]}
                  </span>
                </div>
                {i < statusSteps.length - 1 && (
                  <div className={`w-8 sm:w-16 h-0.5 mx-1 ${i < currentStep ? 'bg-primary-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-2">
          {user?.role === 'driver' && order.status === 'pending' && !order.driver_id && (
            <button onClick={handleAccept} disabled={actionLoading} className="btn-accent flex items-center gap-2">
              <Truck className="w-4 h-4" /> 接取订单
            </button>
          )}
          {isDriver && order.status === 'accepted' && (
            <button onClick={() => handleStatusUpdate('pickup')} disabled={actionLoading} className="btn-ocean flex items-center gap-2">
              <Navigation className="w-4 h-4" /> 开始提货
            </button>
          )}
          {isDriver && order.status === 'pickup' && (
            <button onClick={() => handleStatusUpdate('in_transit')} disabled={actionLoading} className="btn-ocean flex items-center gap-2">
              <Truck className="w-4 h-4" /> 开始运输
            </button>
          )}
          {isDriver && order.status === 'in_transit' && (
            <button onClick={() => handleStatusUpdate('completed')} disabled={actionLoading} className="btn-accent flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> 确认送达
            </button>
          )}
          {(isShipper || isDriver) && ['pending', 'accepted'].includes(order.status) && (
            <button onClick={() => handleStatusUpdate('cancelled')} disabled={actionLoading} className="btn-danger flex items-center gap-2 text-sm">
              取消订单
            </button>
          )}
          {canRate && (
            <button onClick={() => setShowRating(true)} className="btn-primary flex items-center gap-2">
              <Star className="w-4 h-4" /> 评价
            </button>
          )}
          {order.driver_id && trackData.length === 0 && (
            <button onClick={handleSimulateTrack} className="btn-outline flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4" /> 生成模拟轨迹
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 运输路线 */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-ocean-500" /> 运输路线
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">装货地</p>
                <p className="text-sm text-gray-700">{order.origin_address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">目的港</p>
                <p className="text-sm text-gray-700">{order.destination_address}</p>
                <p className="text-xs text-gray-400 mt-0.5">{order.port_name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 货物信息 */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-ocean-500" /> 货物信息
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoItem label="箱型" value={order.container_type} />
            <InfoItem label="货物类型" value={order.cargo_type} />
            <InfoItem label="箱号" value={order.container_no} />
            <InfoItem label="封号" value={order.seal_no} />
            <InfoItem label="提单号" value={order.bill_of_lading} />
            <InfoItem label="货重" value={order.weight ? `${order.weight}吨` : '-'} />
          </div>
          {order.notes && <div className="mt-3 p-2 bg-amber-50 rounded-lg text-sm text-amber-700"><AlertTriangle className="w-3 h-3 inline mr-1" />{order.notes}</div>}
        </div>

        {/* 司机信息 / 货主信息 */}
        {order.driver_id && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-ocean-500" /> 司机信息
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoItem label="姓名" value={order.driver_name} />
              <InfoItem label="车牌号" value={order.license_plate} />
              <InfoItem label="联系电话" value={order.driver_phone} />
              <InfoItem label="信用评分" value={order.driver_credit ? `${order.driver_credit}分` : '-'} />
              <InfoItem label="车辆类型" value={order.vehicle_type} />
            </div>
          </div>
        )}

        {isDriver && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-ocean-500" /> 货主信息
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoItem label="联系人" value={order.shipper_name} />
              <InfoItem label="公司" value={order.company_name} />
              <InfoItem label="电话" value={order.shipper_phone} />
              <InfoItem label="信用评分" value={order.shipper_credit ? `${order.shipper_credit}分` : '-'} />
            </div>
          </div>
        )}
      </div>

      {/* 轨迹记录 */}
      {trackData.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-ocean-500" /> 轨迹记录（{trackData.length}个点）
          </h3>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {trackData.slice().reverse().map((t, i) => (
              <div key={t.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${i === 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-700">
                      {t.status_note || `位置: ${t.latitude.toFixed(4)}, ${t.longitude.toFixed(4)}`}
                    </p>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{t.speed ? `${t.speed.toFixed(0)}km/h` : ''}</span>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(t.recorded_at).toLocaleString('zh-CN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 评价列表 */}
      {ratings.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-ocean-500" /> 评价记录
          </h3>
          <div className="space-y-3">
            {ratings.map(r => (
              <div key={r.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= r.score ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />)}</div>
                  <span className="text-xs text-gray-400">{r.rater_role === 'shipper' ? '货主评价' : r.rater_role === 'driver' ? '司机评价' : '评价'}</span>
                </div>
                {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 评价弹窗 */}
      {showRating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">评价本次运输</h3>
            <div className="flex justify-center gap-2 mb-4">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRatingForm({...ratingForm, score: s})}>
                  <Star className={`w-8 h-8 ${s <= ratingForm.score ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                </button>
              ))}
            </div>
            <textarea className="input-field" rows={3} placeholder="写下您的评价..." value={ratingForm.comment} onChange={(e) => setRatingForm({...ratingForm, comment: e.target.value})} />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowRating(false)} className="btn-outline flex-1">取消</button>
              <button onClick={handleSubmitRating} className="btn-primary flex-1">提交评价</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-gray-700 font-medium">{value || '-'}</p>
    </div>
  );
}

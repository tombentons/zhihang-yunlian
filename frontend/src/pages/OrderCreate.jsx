import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../api';
import { Package, MapPin, Clock, FileText, Send, ArrowLeft } from 'lucide-react';

const containerTypes = [
  { value: '20GP', label: '20GP - 20尺普通干货箱' },
  { value: '40GP', label: '40GP - 40尺普通干货箱' },
  { value: '40HQ', label: '40HQ - 40尺超高箱' },
  { value: '45HQ', label: '45HQ - 45尺超高箱' },
  { value: '20RF', label: '20RF - 20尺冷藏箱' },
  { value: '40RF', label: '40RF - 40尺冷藏箱' },
];

const ports = ['上海洋山港', '上海外高桥港', '宁波舟山港', '太仓港'];

export default function OrderCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    cargo_type: '', container_type: '40GP', container_no: '', seal_no: '',
    bill_of_lading: '', weight: '', origin_address: '', destination_address: '',
    port_name: '上海洋山港', pickup_time: '', delivery_deadline: '',
    notes: '', special_requirements: ''
  });

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.origin_address || !form.destination_address) {
      setError('请填写起始地址和目的地址'); return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await orderAPI.create({ ...form, weight: form.weight ? parseFloat(form.weight) : null });
      navigate(`/orders/${res.data.order.id}`);
    } catch (err) {
      setError(err.response?.data?.error || '发布订单失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> 返回
      </button>

      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
            <Package className="w-6 h-6 text-primary-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">发布运输订单</h2>
            <p className="text-sm text-gray-500">填写运输需求，系统将为您智能匹配优质运力</p>
          </div>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 运输路线 */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <MapPin className="w-4 h-4 text-ocean-500" /> 运输路线
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">起始地址（装货地） *</label>
                <input className="input-field" placeholder="如：上海市松江区九亭镇涞亭南路88号" value={form.origin_address} onChange={(e) => handleChange('origin_address', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">目的港口 *</label>
                <select className="input-field" value={form.port_name} onChange={(e) => handleChange('port_name', e.target.value)}>
                  {ports.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">目的地址（卸货地/码头） *</label>
                <input className="input-field" placeholder="如：上海洋山深水港一期码头" value={form.destination_address} onChange={(e) => handleChange('destination_address', e.target.value)} required />
              </div>
            </div>
          </div>

          {/* 货物信息 */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <Package className="w-4 h-4 text-ocean-500" /> 货物信息
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">箱型 *</label>
                <select className="input-field" value={form.container_type} onChange={(e) => handleChange('container_type', e.target.value)}>
                  {containerTypes.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">货物类型</label>
                <input className="input-field" placeholder="如：电子产品、纺织品等" value={form.cargo_type} onChange={(e) => handleChange('cargo_type', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">箱号</label>
                <input className="input-field" placeholder="如：CSLU2345678" value={form.container_no} onChange={(e) => handleChange('container_no', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">封号</label>
                <input className="input-field" placeholder="如：SL001234" value={form.seal_no} onChange={(e) => handleChange('seal_no', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">提单号</label>
                <input className="input-field" placeholder="如：SHSE24030101" value={form.bill_of_lading} onChange={(e) => handleChange('bill_of_lading', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">货重(吨)</label>
                <input type="number" step="0.1" className="input-field" placeholder="如：18.5" value={form.weight} onChange={(e) => handleChange('weight', e.target.value)} />
              </div>
            </div>
          </div>

          {/* 时间要求 */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <Clock className="w-4 h-4 text-ocean-500" /> 时间要求
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">期望提货时间</label>
                <input type="datetime-local" className="input-field" value={form.pickup_time} onChange={(e) => handleChange('pickup_time', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">送达截止时间</label>
                <input type="datetime-local" className="input-field" value={form.delivery_deadline} onChange={(e) => handleChange('delivery_deadline', e.target.value)} />
              </div>
            </div>
          </div>

          {/* 备注 */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <FileText className="w-4 h-4 text-ocean-500" /> 备注信息
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">特殊要求</label>
                <input className="input-field" placeholder="如：需危险品运输资质、需冷藏车等" value={form.special_requirements} onChange={(e) => handleChange('special_requirements', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">其他备注</label>
                <textarea className="input-field" rows={3} placeholder="其他需要说明的事项" value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-outline flex-1">取消</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send className="w-4 h-4" /> 发布订单</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

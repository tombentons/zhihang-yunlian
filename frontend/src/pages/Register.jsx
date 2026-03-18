import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Ship, UserPlus, Truck, Package, Building2 } from 'lucide-react';

const roles = [
  { value: 'shipper', label: '我是货主', desc: '中小微外贸企业/工厂', icon: Package, color: 'border-blue-400 bg-blue-50 text-blue-700' },
  { value: 'driver', label: '我是司机', desc: '集卡司机/微型车队', icon: Truck, color: 'border-green-400 bg-green-50 text-green-700' },
  { value: 'forwarder', label: '我是货代', desc: '货运代理企业', icon: Building2, color: 'border-purple-400 bg-purple-50 text-purple-700' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ role: '', username: '', password: '', confirm: '', real_name: '', phone: '', company_name: '', license_plate: '', vehicle_type: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('两次输入的密码不一致'); return; }
    if (form.password.length < 6) { setError('密码长度不能少于6位'); return; }
    setError('');
    setLoading(true);
    try {
      const user = await register(form);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-ocean-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-center mb-6">
          <Ship className="w-9 h-9 text-primary-500 mr-2" />
          <h1 className="text-2xl font-bold text-primary-500">智航云连</h1>
        </div>

        <h2 className="text-xl font-bold text-gray-800 text-center mb-1">创建账户</h2>
        <p className="text-gray-500 text-center text-sm mb-6">
          {step === 1 ? '请选择您的角色' : '填写基本信息完成注册'}
        </p>

        {/* 步骤指示器 */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
          <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-primary-500' : 'bg-gray-200'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

        {step === 1 ? (
          <div className="space-y-3">
            {roles.map((r) => {
              const Icon = r.icon;
              return (
                <button
                  key={r.value}
                  onClick={() => { setForm({ ...form, role: r.value }); setStep(2); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:shadow-md ${form.role === r.value ? r.color : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <Icon className="w-8 h-8 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-semibold">{r.label}</p>
                    <p className="text-xs text-gray-500">{r.desc}</p>
                  </div>
                </button>
              );
            })}
            <p className="text-center text-sm text-gray-500 mt-4">
              已有账号？<Link to="/login" className="text-ocean-600 font-medium">立即登录</Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名 *</label>
                <input className="input-field" placeholder="设置用户名" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密码 *</label>
                <input type="password" className="input-field" placeholder="至少6位" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">确认密码 *</label>
                <input type="password" className="input-field" placeholder="再次输入密码" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">真实姓名</label>
                <input className="input-field" placeholder="您的姓名" value={form.real_name} onChange={(e) => setForm({ ...form, real_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                <input className="input-field" placeholder="联系电话" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              {(form.role === 'shipper' || form.role === 'forwarder') && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">公司名称</label>
                  <input className="input-field" placeholder="企业全称" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
                </div>
              )}
              {form.role === 'driver' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">车牌号</label>
                    <input className="input-field" placeholder="如：沪A12345" value={form.license_plate} onChange={(e) => setForm({ ...form, license_plate: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">车辆类型</label>
                    <select className="input-field" value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}>
                      <option value="">请选择</option>
                      <option value="重型集装箱半挂车">重型集装箱半挂车</option>
                      <option value="中型集装箱车">中型集装箱车</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)} className="btn-outline flex-1">上一步</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><UserPlus className="w-4 h-4" /> 注册</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

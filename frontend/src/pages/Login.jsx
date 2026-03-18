import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Ship, Eye, EyeOff, LogIn, Anchor } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.username, form.password);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (username, password) => {
    setForm({ username, password });
    setError('');
    setLoading(true);
    try {
      const user = await login(username, password);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* 左侧品牌区域 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 via-primary-600 to-ocean-700 text-white flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-40 h-40 border-2 border-white rounded-full" />
          <div className="absolute bottom-32 right-16 w-60 h-60 border-2 border-white rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-20 h-20 border-2 border-white rounded-full" />
        </div>
        <div className="relative z-10 text-center max-w-md">
          <div className="flex items-center justify-center mb-8">
            <Ship className="w-16 h-16 text-accent-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4">智航云连</h1>
          <p className="text-xl text-white/80 mb-2">港航集疏运数字服务平台</p>
          <p className="text-sm text-white/60 leading-relaxed mt-6">
            打破港航信息孤岛，连通中小微货主与底层运力，<br/>
            以大数据与物联网技术驱动港航物流数字化转型。
          </p>
          <div className="flex justify-center gap-8 mt-10">
            <div className="text-center">
              <p className="text-3xl font-bold text-accent-400">10万+</p>
              <p className="text-xs text-white/60 mt-1">注册运力</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-accent-400">5000+</p>
              <p className="text-xs text-white/60 mt-1">合作企业</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-accent-400">50万+</p>
              <p className="text-xs text-white/60 mt-1">完成运单</p>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧登录表单 */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* 移动端Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Ship className="w-10 h-10 text-primary-500 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-primary-500">智航云连</h1>
              <p className="text-xs text-gray-500">港航集疏运数字服务平台</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">欢迎回来</h2>
          <p className="text-gray-500 mb-8">登录您的账户，开始高效港航物流之旅</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
              <input
                type="text"
                className="input-field"
                placeholder="请输入用户名"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="请输入密码"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPwd(!showPwd)}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> 登录
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            还没有账号？
            <Link to="/register" className="text-ocean-600 font-medium hover:text-ocean-700 ml-1">立即注册</Link>
          </p>

          {/* 快速体验入口 */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-400 text-center mb-3">快速体验（点击即可登录）</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => quickLogin('shipper1', '123456')} className="text-xs px-3 py-2 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors">
                货主端体验
              </button>
              <button onClick={() => quickLogin('driver1', '123456')} className="text-xs px-3 py-2 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors">
                司机端体验
              </button>
              <button onClick={() => quickLogin('forwarder1', '123456')} className="text-xs px-3 py-2 rounded-lg border border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors">
                货代端体验
              </button>
              <button onClick={() => quickLogin('admin', '123456')} className="text-xs px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                管理后台
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Ship, Package, MapPin, BarChart3, Bell, User, LogOut, Menu, X,
  Truck, ClipboardList, Anchor, Box, CreditCard, Users, Settings,
  Home, Navigation, Layers, ChevronDown
} from 'lucide-react';

const roleLabels = { shipper: '货主', driver: '司机', forwarder: '货代', admin: '管理员' };
const roleBadgeColors = { shipper: 'bg-blue-100 text-blue-700', driver: 'bg-green-100 text-green-700', forwarder: 'bg-purple-100 text-purple-700', admin: 'bg-red-100 text-red-700' };

const menuConfig = {
  shipper: [
    { path: '/dashboard', label: '工作台', icon: Home },
    { path: '/orders', label: '我的订单', icon: ClipboardList },
    { path: '/orders/create', label: '发布订单', icon: Package },
    { path: '/port-dynamics', label: '港口动态', icon: Anchor },
    { path: '/tracking', label: '物流追踪', icon: MapPin },
    { path: '/empty-containers', label: '空箱查询', icon: Box },
    { path: '/settlements', label: '费用中心', icon: CreditCard },
    { path: '/notifications', label: '消息中心', icon: Bell },
  ],
  driver: [
    { path: '/dashboard', label: '工作台', icon: Home },
    { path: '/orders/available', label: '抢单大厅', icon: Truck },
    { path: '/orders', label: '我的运单', icon: ClipboardList },
    { path: '/consolidation', label: '智能拼单', icon: Layers },
    { path: '/port-dynamics', label: '港口动态', icon: Anchor },
    { path: '/empty-containers', label: '空箱动态', icon: Box },
    { path: '/settlements', label: '结算中心', icon: CreditCard },
    { path: '/notifications', label: '消息中心', icon: Bell },
  ],
  forwarder: [
    { path: '/dashboard', label: '工作台', icon: Home },
    { path: '/orders', label: '订单管理', icon: ClipboardList },
    { path: '/orders/create', label: '发布订单', icon: Package },
    { path: '/port-dynamics', label: '港口动态', icon: Anchor },
    { path: '/tracking', label: '物流追踪', icon: MapPin },
    { path: '/settlements', label: '费用中心', icon: CreditCard },
    { path: '/notifications', label: '消息中心', icon: Bell },
  ],
  admin: [
    { path: '/admin/dashboard', label: '数据总览', icon: BarChart3 },
    { path: '/admin/users', label: '用户管理', icon: Users },
    { path: '/admin/orders', label: '订单管理', icon: ClipboardList },
    { path: '/port-dynamics', label: '港口动态', icon: Anchor },
    { path: '/empty-containers', label: '空箱管理', icon: Box },
    { path: '/notifications', label: '系统通知', icon: Bell },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const menus = menuConfig[user?.role] || menuConfig.shipper;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* 侧边栏 */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-primary-500 to-primary-700 text-white transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-white/10">
          <Ship className="w-8 h-8 text-accent-400 mr-3 flex-shrink-0" />
          <div>
            <h1 className="text-lg font-bold tracking-wide">智航云连</h1>
            <p className="text-[10px] text-white/60 -mt-0.5">港航集疏运数字服务平台</p>
          </div>
          <button className="lg:hidden ml-auto p-1" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 用户信息 */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
              {(user?.real_name || user?.username || '?')[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.real_name || user?.username}</p>
              <span className={`inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-full ${roleBadgeColors[user?.role] || 'bg-gray-100 text-gray-700'}`}>
                {roleLabels[user?.role] || '用户'}
              </span>
            </div>
          </div>
        </div>

        {/* 菜单列表 */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {menus.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-white/20 text-white font-medium shadow-sm'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部导航栏 */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">
              {menus.find(m => m.path === location.pathname)?.label || '智航云连'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Link>

            <div className="relative">
              <button
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold">
                  {(user?.real_name || user?.username || '?')[0]}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>
                      <User className="w-4 h-4" /> 个人中心
                    </Link>
                    <Link to="/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>
                      <Settings className="w-4 h-4" /> 系统设置
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      <LogOut className="w-4 h-4" /> 退出登录
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import OrderCreate from './pages/OrderCreate';
import OrderList from './pages/OrderList';
import OrderDetail from './pages/OrderDetail';
import AvailableOrders from './pages/AvailableOrders';
import PortDynamics from './pages/PortDynamics';
import EmptyContainers from './pages/EmptyContainers';
import Consolidation from './pages/Consolidation';
import Settlements from './pages/Settlements';
import Notifications from './pages/Notifications';
import Tracking from './pages/Tracking';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" /> : children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="orders" element={<OrderList />} />
            <Route path="orders/create" element={<OrderCreate />} />
            <Route path="orders/available" element={<AvailableOrders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="port-dynamics" element={<PortDynamics />} />
            <Route path="empty-containers" element={<EmptyContainers />} />
            <Route path="consolidation" element={<Consolidation />} />
            <Route path="settlements" element={<Settlements />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="tracking" element={<Tracking />} />
            <Route path="admin/dashboard" element={<AdminDashboard />} />
            <Route path="admin/users" element={<AdminUsers />} />
            <Route path="admin/orders" element={<OrderList />} />
            <Route path="profile" element={<Dashboard />} />
            <Route path="settings" element={<Dashboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App

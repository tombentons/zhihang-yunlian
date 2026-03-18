import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截器：自动附加JWT令牌
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('zhihang_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：处理401未授权
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('zhihang_token');
      localStorage.removeItem('zhihang_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ========== 认证相关 ==========
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// ========== 订单相关 ==========
export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getList: (params) => api.get('/orders', { params }),
  getAvailable: (params) => api.get('/orders/available', { params }),
  getDetail: (id) => api.get(`/orders/${id}`),
  accept: (id) => api.put(`/orders/${id}/accept`),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  getStats: () => api.get('/orders/stats/overview'),
};

// ========== 港口动态 ==========
export const portAPI = {
  getDynamics: (params) => api.get('/port/dynamics', { params }),
  getCongestion: () => api.get('/port/congestion'),
  getShips: (params) => api.get('/port/ships', { params }),
  getOverview: () => api.get('/port/overview'),
  createDynamic: (data) => api.post('/port/dynamics', data),
};

// ========== 轨迹追踪 ==========
export const trackingAPI = {
  report: (data) => api.post('/tracking', data),
  getTrack: (orderId) => api.get(`/tracking/${orderId}`),
  simulate: (orderId) => api.post(`/tracking/simulate/${orderId}`),
};

// ========== 空箱管理 ==========
export const containerAPI = {
  getEmpty: (params) => api.get('/containers/empty', { params }),
  match: (data) => api.post('/containers/match', data),
  createEmpty: (data) => api.post('/containers/empty', data),
};

// ========== 评价系统 ==========
export const ratingAPI = {
  create: (data) => api.post('/ratings', data),
  getUserRatings: (userId) => api.get(`/ratings/user/${userId}`),
};

// ========== 通知中心 ==========
export const notificationAPI = {
  getList: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// ========== 智能拼单 ==========
export const consolidationAPI = {
  smartMatch: (data) => api.post('/consolidation/smart-match', data),
  getPlans: () => api.get('/consolidation/plans'),
};

// ========== 结算中心 ==========
export const settlementAPI = {
  getList: (params) => api.get('/settlements', { params }),
  complete: (id) => api.put(`/settlements/${id}/complete`),
};

// ========== 管理后台 ==========
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  verifyUser: (id, data) => api.put(`/admin/users/${id}/verify`, data),
  updateUserStatus: (id, data) => api.put(`/admin/users/${id}/status`, data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getOrders: (params) => api.get('/admin/orders', { params }),
  updateOrder: (id, data) => api.put(`/admin/orders/${id}`, data),
  deleteOrder: (id) => api.delete(`/admin/orders/${id}`),
  createPortDynamic: (data) => api.post('/admin/port-dynamics', data),
  deletePortDynamic: (id) => api.delete(`/admin/port-dynamics/${id}`),
  createContainer: (data) => api.post('/admin/containers', data),
  deleteContainer: (id) => api.delete(`/admin/containers/${id}`),
};

export default api;

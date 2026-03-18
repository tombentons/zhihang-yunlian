import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('zhihang_token');
    const savedUser = localStorage.getItem('zhihang_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await authAPI.login({ username, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('zhihang_token', token);
    localStorage.setItem('zhihang_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    const { token, user: userData } = res.data;
    localStorage.setItem('zhihang_token', token);
    localStorage.setItem('zhihang_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('zhihang_token');
    localStorage.removeItem('zhihang_user');
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('zhihang_user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

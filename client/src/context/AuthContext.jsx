/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('dispohub_token'));
  // Only need to load if there's a token to verify
  const [loading, setLoading] = useState(() => !!localStorage.getItem('dispohub_token'));

  const setAuth = useCallback((newToken, newUser) => {
    if (newToken) {
      localStorage.setItem('dispohub_token', newToken);
      setToken(newToken);
    }
    if (newUser) {
      localStorage.setItem('dispohub_dev_user_id', newUser.id);
      setUser(newUser);
    }
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem('dispohub_token');
    localStorage.removeItem('dispohub_dev_user_id');
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  // Verify token on mount / token change
  useEffect(() => {
    if (token) {
      setLoading(true);
      api.get('/auth/me')
        .then((res) => setUser(res.data))
        .catch(() => clearAuth())
        .finally(() => setLoading(false));
    }
  }, [token, clearAuth]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setAuth(res.data.token, res.data.user);
    return res.data.user;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    setAuth(res.data.token, res.data.user);
    return res.data.user;
  };

  const logout = () => clearAuth();

  const devSwitch = async (roleOrId) => {
    const body = roleOrId.length > 20
      ? { userId: roleOrId }
      : { role: roleOrId };
    const res = await api.post('/auth/dev-switch', body);
    setAuth(res.data.token, res.data.user);
    return res.data.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        devSwitch,
        loading,
        isAuthenticated: !!user,
        role: user?.role || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

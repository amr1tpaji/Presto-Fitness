import { createContext, useState, useCallback, useEffect } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // On mount, check for existing token and validate it
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await authAPI.getMe();
          setUser(response.data.data.user);
          setIsAuthenticated(true);
        } catch {
          localStorage.removeItem('accessToken');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = useCallback(async (phone, password) => {
    const response = await authAPI.login({ identifier: phone, password });
    const payload = response.data.data;
    localStorage.setItem('accessToken', payload.accessToken);
    setUser(payload.user);
    setIsAuthenticated(true);
    return payload;
  }, []);

  const register = useCallback(async (userData) => {
    const response = await authAPI.register(userData);
    return response.data;
  }, []);

  const verifyOTP = useCallback(async (phone, code) => {
    const response = await authAPI.verifyOTP({ phone, otp: code });
    const payload = response.data.data;
    localStorage.setItem('accessToken', payload.accessToken);
    setUser(payload.user);
    setIsAuthenticated(true);
    return payload;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignore errors during logout
    }
    localStorage.removeItem('accessToken');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const reloadUser = useCallback(async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data.data.user);
    } catch {
      // ignore
    }
  }, []);

  const isAdmin = user?.role === 'admin';

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    verifyOTP,
    logout,
    reloadUser,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

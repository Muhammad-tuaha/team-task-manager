import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// ── Production Domain Configuration ──────────────────────────────────────────
// Explicitly routes client-side API requests to your live Render backend
axios.defaults.baseURL = 'https://team-task-manager-api-mvlu.onrender.com'; 

// Crucial: Directs the browser to append session cookies to cross-origin requests
axios.defaults.withCredentials = true; 

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await axios.get('/auth/me');
      setUser(res.data.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await axios.post('/auth/login', { email, password });
    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await axios.post('/auth/register', { name, email, password });
    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    await axios.post('/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
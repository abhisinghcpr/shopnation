import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { STORAGE_KEYS, BASE_API_URL, API_ENDPOINTS } from '../config/apiConfig';

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on load
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
      const savedUser = localStorage.getItem(STORAGE_KEYS.ADMIN_USER);

      if (savedToken && savedUser) {
        setToken(savedToken);
        setAdmin(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Failed to parse stored admin auth data:', error);
      localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.ADMIN_USER);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Login Admin Function
   */
  const loginAdmin = async (email, password) => {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    try {
      const response = await axios.post(`${BASE_API_URL}${API_ENDPOINTS.ADMIN.AUTH.LOGIN}`, {
        email: email.trim(),
        password,
      });

      if (response.data && response.data.token) {
        const adminUser = response.data.admin;
        const jwtToken = response.data.token;

        localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, jwtToken);
        localStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(adminUser));

        setToken(jwtToken);
        setAdmin(adminUser);
        return adminUser;
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      throw new Error(message);
    }
  };

  /**
   * Logout Admin Function
   */
  const logoutAdmin = () => {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_USER);
    setToken(null);
    setAdmin(null);
  };

  const value = {
    admin,
    token,
    loading,
    isAuthenticated: !!token && !!admin,
    loginAdmin,
    logoutAdmin,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

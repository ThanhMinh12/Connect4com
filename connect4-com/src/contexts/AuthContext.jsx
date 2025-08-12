import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, logout } from '../api/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/current`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
      else {
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('token');
      setUser(null);
    }
    setLoading(false);
  };

  const login = (userData, token) => {
    setUser(userData);
    if (token) {
      localStorage.setItem('token', token);
    }
  };

  const logoutUser = async () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const handleGoogleLogin = async (response) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/google-login`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${response.credential}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("token", data.token);
        setUser(data.user);
        console.log("Server response:", data)
        return true;
      }
      return false;
    }
    catch (error) {
      console.error("Google login error:", error);
      return false;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout: logoutUser,
    checkAuth,
    handleGoogleLogin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
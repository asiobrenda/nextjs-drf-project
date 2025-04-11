"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import LoadUser from '../../helper/load_user';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();


  const refreshAccessToken = async () => {
    const storedRefreshToken = localStorage.getItem('refresh_token');
    console.log('Attempting to refresh with token:', storedRefreshToken);
    if (!storedRefreshToken) {
      console.error('No refresh token available');
      logout();
      return null;
    }
    try {
      const response = await axios.post('http://localhost:8000/api/token/refresh/', {
        refresh: storedRefreshToken,
      });
      const newAccessToken = response.data.access;
      localStorage.setItem('access_token', newAccessToken);
      setAccessToken(newAccessToken);
      console.log('Token refreshed successfully:', newAccessToken);
      // Fetch user profile after refresh
      const userResponse = await axios.get('http://localhost:8000/api/user/', {
        headers: { Authorization: `Bearer ${newAccessToken}` },
      });
      setUser(userResponse.data);
      return newAccessToken;
    } catch (err) {
      console.error('Refresh token failed:', err.response?.data || err.message);
      logout();
      return null;
    }
  };

  // Load user data from localStorage and fetch full profile
  useEffect(() => {
    LoadUser({
        setUser, setAccessToken, setRefreshToken, setSuccess, setIsLoading, refreshAccessToken

    });
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);


  const login = async (access, refresh, username) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('username', username);
    setAccessToken(access);
    setRefreshToken(refresh);
    // Fetch full user profile after login
    try {
      const response = await axios.get('http://localhost:8000/api/user/', {
        headers: { Authorization: `Bearer ${access}` },
      });
      setUser(response.data);
      console.log('Logged in user profile:', response.data);
    } catch (err) {
      console.error('Failed to fetch user profile on login:', err.response?.data || err.message);
      setUser({ username }); // Fallback
    }
    setSuccess('You have successfully logged in!');
    router.push('/');
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setSuccess('Logout successful!');
    router.push('/');
  };

  return (
    <AuthContext.Provider
      value={{ user, accessToken, refreshToken, login, logout, success, refreshAccessToken, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
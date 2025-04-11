// src/app/login/page.js
"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [errors, setErrors] = useState({});
  const [showMFA, setShowMFA] = useState(false);
  const [success, setSuccess] = useState(''); // Success message
  const [showSuccess, setShowSuccess] = useState(false); // Control visibility
  const { login } = useAuth();

  // Handle success message display and fade
  useEffect(() => {
    if (success) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false); // Start fade-out
      }, 2500); // Show for 2.5s, then fade for 0.5s
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Clear success message after fade-out
  useEffect(() => {
    if (!showSuccess && success) {
      const fadeTimer = setTimeout(() => setSuccess(''), 500); // Match CSS transition duration
      return () => clearTimeout(fadeTimer);
    }
  }, [showSuccess, success]);

  const validateLoginInputs = () => {
    const newErrors = {};
    if (!username.trim()) newErrors.username = 'Username is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateMFAInput = () => {
    const newErrors = {};
    if (!totpCode.trim()) newErrors.totpCode = 'MFA code is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateLoginInputs()) return;

    try {
      const response = await axios.post('http://localhost:8000/token/', {
        username,
        password,
      });
      setSuccess('Login successful!');
      login(response.data.access, response.data.refresh, username);
      setPassword('');
    } catch (err) {
      if (err.response?.data?.detail === 'MFA is required. Please verify your second factor.') {
        setShowMFA(true);
        setErrors({ submit: 'Please enter your MFA code' });
      } else {
        setErrors({ submit: err.response?.data?.detail || 'Login failed' });
      }
    }
  };

  const handleMFASubmit = async (e) => {
    e.preventDefault();
    if (!validateMFAInput()) return;

    try {
      const response = await axios.post('http://localhost:8000/verify-mfa/', {
        username,
        totp_code: totpCode,
      });
      setSuccess('Login successful!');
      login(response.data.access, response.data.refresh, username);
      setPassword('');
      setTotpCode('');
    } catch (err) {
      setErrors({ submit: err.response?.data?.detail || 'Invalid MFA code' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
        {success && (
          <p
            className={`text-green-500 mb-4 text-center transition-opacity duration-500 ease-out ${
              showSuccess ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {success}
          </p>
        )}
        {errors.submit && <p className="text-red-500 mb-4 text-center">{errors.submit}</p>}
        {!showMFA ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className={`w-full p-2 border rounded focus:outline-none focus:ring-2 ${
                  errors.username ? 'border-red-500' : 'focus:ring-blue-500'
                }`}
              />
              {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className={`w-full p-2 border rounded focus:outline-none focus:ring-2 ${
                  errors.password ? 'border-red-500' : 'focus:ring-blue-500'
                }`}
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>
            <button
              type="submit"
              className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleMFASubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                placeholder="Enter MFA Code"
                className={`w-full p-2 border rounded focus:outline-none focus:ring-2 ${
                  errors.totpCode ? 'border-red-500' : 'focus:ring-blue-500'
                }`}
              />
              {errors.totpCode && <p className="text-red-500 text-sm mt-1">{errors.totpCode}</p>}
            </div>
            <button
              type="submit"
              className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Verify MFA
            </button>
          </form>
        )}
        <p className="mt-4 text-center">
          Don’t have an account?{' '}
          <Link href="/signup" className="text-green-500 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
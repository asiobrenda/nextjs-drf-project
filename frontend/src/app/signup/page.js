// src/app/signup/page.js
"use client";

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const { login } = useAuth(); // Still imported but not used here
  const router = useRouter();

  const validateInputs = () => {
    const newErrors = {};
    if (!username.trim()) newErrors.username = 'Username is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    try {
      await axios.post('http://localhost:8000/register/', { username, email, password });
      setUsername('');
      setEmail('');
      setPassword('');
      router.push('/login'); // Redirect to login page
    } catch (err) {
      setErrors({ submit: err.response?.data?.detail || 'Signup failed' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Sign Up</h1>
        {errors.submit && <p className="text-red-500 mb-4">{errors.submit}</p>}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className={`w-full p-2 border rounded focus:outline-none focus:ring-2 ${
                errors.username ? 'border-red-500' : 'focus:ring-green-500'
              }`}
            />
            {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
          </div>
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className={`w-full p-2 border rounded focus:outline-none focus:ring-2 ${
                errors.email ? 'border-red-500' : 'focus:ring-green-500'
              }`}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className={`w-full p-2 border rounded focus:outline-none focus:ring-2 ${
                errors.password ? 'border-red-500' : 'focus:ring-green-500'
              }`}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>
          <button
            type="submit"
            className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Sign Up
          </button>
        </form>
        <p className="mt-4 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-500 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
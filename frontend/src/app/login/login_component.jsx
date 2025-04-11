"use client";

import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginComponent() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState('credentials');  // 'credentials' or 'otp'
  const [message, setMessage] = useState('');
  const { login } = useAuth();
  const router = useRouter();

 const handleSubmit = async (e) => {
  e.preventDefault();
  console.log('Sending:', { username, password, otp_code: otpCode });
  try {
    if (step === 'credentials') {
      // Call your custom endpoint for OTP generation
      const response = await axios.post('http://localhost:8000/api/login/otp/', {
        username,
        password,
      });
      setMessage(response.data.message); // Message will be 'OTP sent to your email'
      setStep('otp');
    } else {
      const response = await axios.post('http://localhost:8000/api/login/otp/', {
        username,
        password,
        otp_code: otpCode,
      });
      login(response.data.access, response.data.refresh, username); // Login with new tokens
      router.push('/all-tasks');
    }
  } catch (err) {
    setMessage(err.response?.data?.error || 'An error occurred');
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="p-6 max-w-md w-full bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 'credentials' ? (
            <>
              <div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          ) : (
            <div>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Enter OTP from email"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <button
            type="submit"
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            {step === 'credentials' ? 'Send OTP' : 'Login'}
          </button>
        </form>
        {message && (
          <p className={`mt-2 text-center ${message.includes('error') ? 'text-red-500' : 'text-green-500'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
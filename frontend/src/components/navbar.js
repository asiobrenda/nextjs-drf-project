// src/components/Navbar.js
"use client";

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-blue-500 p-4 text-white">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="space-x-4">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          {user && (
            <>
              <Link href="/dashboard" className="hover:underline">
                Dashboard
              </Link>
              <Link href="/tasks" className="hover:underline">
                Tasks
              </Link>
              <Link href="/users" className="hover:underline">
                Users
              </Link>
            </>
          )}
        </div>
        <div className="space-x-4">
          {user ? (
            <button onClick={logout} className="hover:underline">
              Logout
            </button>
          ) : (
            <>
              <Link href="/login" className="hover:underline">
                Login
              </Link>
              <Link href="/signup" className="hover:underline">
                Signup
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
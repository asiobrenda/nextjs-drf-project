"use client";

import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export default function Home() {
  const { user, success } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Section */}
      <header className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">
            Welcome to Your Task Manager
          </h1>
          <p className="text-xl">
            {user
              ? `Hello, ${user.username || 'User'}! Manage your tasks with ease.`
              : 'Stay organized, boost productivity, and manage your tasks with ease.'}
          </p>
        </div>
      </header>

      {/* Content Section */}
      <section className="flex-grow flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto p-6">
          {user ? (
            <>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Your Task Hub
              </h2>
              {success && (
                <p className="text-green-600 font-medium mb-4">{success}</p>
              )}
              <p className="text-gray-600 mb-6">
                Jump into your dashboard or tasks to stay on top of your goals.
              </p>
              <div className="space-x-4">
                <Link
                  href="/dashboard"
                  className="inline-block bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600 transition"
                >
                  Dashboard
                </Link>
                <Link
                  href="/tasks"
                  className="inline-block bg-transparent border border-blue-500 text-blue-500 py-2 px-6 rounded-lg hover:bg-blue-500 hover:text-white transition"
                >
                  My Tasks
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Get Started Today
              </h2>
              {success && (
                <p className="text-green-600 font-medium mb-4">{success}</p>
              )}
              <p className="text-gray-600 mb-6">
                Whether you’re tackling personal projects or team goals, our task manager helps you stay on top of everything.
              </p>
              <div className="space-x-4">
                <a
                  href="/signup"
                  className="inline-block bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600 transition"
                >
                  Sign Up
                </a>
                <a
                  href="/login"
                  className="inline-block bg-transparent border border-blue-500 text-blue-500 py-2 px-6 rounded-lg hover:bg-blue-500 hover:text-white transition"
                >
                  Log In
                </a>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-500 text-white py-4">
        <div className="max-w-4xl mx-auto text-center">
          <p>© 2025 Task Manager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
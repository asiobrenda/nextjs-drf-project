// src/app/dashboard/page.js
"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/navbar'; // Adjust path if needed

export default function Dashboard() {
  const { user, accessToken, refreshAccessToken, isLoading } = useAuth();
  const router = useRouter();
  const [taskStats, setTaskStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) {
      console.log('Waiting for AuthContext to load...');
      return;
    }

    if (!accessToken || !user) {
      console.log('No access token or user, redirecting to /');
      router.push('/');
      return;
    }

    const fetchTaskStats = async () => {
      setLoading(true);
      try {
        console.log('Fetching tasks for dashboard with token:', accessToken);
        const response = await axios.get('http://localhost:8000/tasks/', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const tasks = response.data;
        console.log('Dashboard tasks response:', tasks);

        // Calculate stats
        const stats = {
          total: tasks.length,
          pending: tasks.filter((task) => task.status === 'pending').length,
          inProgress: tasks.filter((task) => task.status === 'in_progress').length,
          completed: tasks.filter((task) => task.status === 'completed').length,
        };
        setTaskStats(stats);
        setErrors({});
      } catch (err) {
        console.error('Fetch error:', {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
        });
        if (err.response?.status === 401) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            try {
              console.log('Retrying with new token:', newToken);
              const retryResponse = await axios.get('http://localhost:8000/tasks/', {
                headers: { Authorization: `Bearer ${newToken}` },
              });
              const tasks = retryResponse.data;
              const stats = {
                total: tasks.length,
                pending: tasks.filter((task) => task.status === 'pending').length,
                inProgress: tasks.filter((task) => task.status === 'in_progress').length,
                completed: tasks.filter((task) => task.status === 'completed').length,
              };
              setTaskStats(stats);
              setErrors({});
            } catch (retryErr) {
              console.error('Retry error:', retryErr.response?.data || retryErr.message);
              setErrors({ fetch: 'Failed to fetch tasks after refresh.' });
              router.push('/login');
            }
          } else {
            console.log('Token refresh failed, redirecting to login');
            setErrors({ fetch: 'Token refresh failed.' });
            router.push('/login');
          }
        } else {
          setErrors({ fetch: `Failed to fetch tasks: ${err.response?.data?.detail || err.message}` });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTaskStats();
  }, [accessToken, user, refreshAccessToken, isLoading, router]);

  if (isLoading) return <p>Loading authentication...</p>;
  if (!user) return null;

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Welcome to Your Dashboard, {user.username}!
      </h1>
      {errors.fetch && <p className="text-red-500 mb-4 text-center">{errors.fetch}</p>}

      <div className="max-w-4xl mx-auto">
        {loading ? (
          <p className="text-gray-500 text-center">Loading your dashboard...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-lg shadow text-center">
              <h2 className="text-xl font-semibold text-gray-700">Total Tasks</h2>
              <p className="text-2xl font-bold text-blue-500">{taskStats.total}</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow text-center">
              <h2 className="text-xl font-semibold text-gray-700">Pending</h2>
              <p className="text-2xl font-bold text-yellow-500">{taskStats.pending}</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow text-center">
              <h2 className="text-xl font-semibold text-gray-700">In Progress</h2>
              <p className="text-2xl font-bold text-orange-500">{taskStats.inProgress}</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow text-center">
              <h2 className="text-xl font-semibold text-gray-700">Completed</h2>
              <p className="text-2xl font-bold text-green-500">{taskStats.completed}</p>
            </div>
          </div>
        )}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/tasks')}
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go to Tasks
          </button>
        </div>
      </div>
    </div>
  );
}
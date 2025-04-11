"use client";

import { useState, useEffect, useReducer } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/navbar';

const taskReducer = (state, action) => {
  switch (action.type) {
    case 'SET_TASKS':
      return action.payload;
    case 'UPDATE_TASK':
      return state.map((task) => (task.id === action.payload.id ? action.payload : task));
    case 'DELETE_TASK':
      return state.filter((task) => task.id !== action.payload);
    default:
      return state;
  }
};

const useAllTasks = (accessToken, user, refreshAccessToken, isLoading) => {
  const [tasks, dispatch] = useReducer(taskReducer, []);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!accessToken || !user) {
      router.push('/');
      return;
    }

    const fetchTasks = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:8000/all-tasks/', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        console.log('API Response:', response.data);
        dispatch({ type: 'SET_TASKS', payload: response.data });
        setErrors({});
      } catch (err) {
        if (err.response?.status === 401) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            const retryResponse = await axios.get('http://localhost:8000/all-tasks/', {
              headers: { Authorization: `Bearer ${newToken}` },
            });
            dispatch({ type: 'SET_TASKS', payload: retryResponse.data });
            setErrors({});
          } else {
            setErrors({ fetch: 'Token refresh failed. Please log in again.' });
            router.push('/login');
          }
        } else {
          setErrors({ fetch: `Failed to fetch tasks: ${err.response?.data?.detail || err.message}` });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [accessToken, user, refreshAccessToken, isLoading, router]);

  const updateTask = async (id, title, description, status) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `http://localhost:8000/all-tasks/${id}/`,
        { title, description, status },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      dispatch({ type: 'UPDATE_TASK', payload: response.data });
      setErrors({});
      return true;
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to update task. You may not have permission.';
      setErrors({ submit: message });
      console.log('Update attempt failed for task ID:', id);
      console.log('User:', user);
      console.log('Error status:', err.response?.status);
      console.log('Error data:', err.response?.data);
      console.log('Full error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`http://localhost:8000/all-tasks/${id}/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      dispatch({ type: 'DELETE_TASK', payload: id });
      setErrors({});
    } catch (err) {
      const message = user.is_staff
        ? 'Staff cannot delete tasks.'
        : err.response?.data?.detail || 'You do not have permission to delete this task.';
      setErrors({ submit: message });
      console.log('Delete attempt failed for task ID:', id);
      console.log('User:', user);
      console.log('Error status:', err.response?.status);
      console.log('Error data:', err.response?.data);
      console.log('Full error:', err);
    } finally {
      setLoading(false);
    }
  };

  return { tasks, errors, setErrors, loading, updateTask, deleteTask };
};

export default function AllTasks() {
  const { user, accessToken, refreshAccessToken, isLoading } = useAuth();
  const { tasks, errors, setErrors, loading, updateTask, deleteTask } = useAllTasks(
    accessToken,
    user,
    refreshAccessToken,
    isLoading
  );
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const statusOptions = ['pending', 'in_progress', 'completed'];

  console.log('User:', user);
  console.log('Tasks:', tasks);

  const handleEdit = (task) => {
    setEditId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setStatus(task.status);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrors({ title: 'Title is required' });
      return;
    }
    const success = await updateTask(editId, title, description, status);
    if (success) {
      setEditId(null);
      setTitle('');
      setDescription('');
      setStatus('pending');
    }
  };

  const handleDeleteClick = (id) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    await deleteTask(confirmDeleteId);
    setConfirmDeleteId(null);
  };

  const cancelDelete = () => {
    setConfirmDeleteId(null);
  };

  if (isLoading) return <p>Loading authentication...</p>;
  if (!user) return null;

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-center">All Tasks</h1>
      {errors.fetch && <p className="text-red-500 mb-4 text-center">{errors.fetch}</p>}
      {errors.submit && <p className="text-red-500 mb-4 text-center">{errors.submit}</p>}

      <div className="max-w-4xl mx-auto">
        {loading ? (
          <p className="text-gray-500 text-center">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="text-gray-500 text-center">No tasks available.</p>
        ) : (
          <ul className="space-y-4">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="p-4 bg-white rounded-lg shadow flex justify-between items-center"
              >
                <div>
                  {editId === task.id ? (
                    <form onSubmit={handleSubmit} className="space-y-2">
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full p-2 border rounded"
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt.replace('_', ' ').toUpperCase()}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600 ml-2"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <>
                      <h2 className="text-xl font-semibold">{task.title}</h2>
                      <p className="text-gray-600">{task.description || 'No description'}</p>
                      <p className="text-sm text-gray-500">
                        Status: {task.status.replace('_', ' ').toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Owner: {task.owner_username}
                      </p>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(task.created_at).toLocaleString()}
                      </p>
                    </>
                  )}
                </div>
                <div className="space-x-2">
                  {confirmDeleteId === task.id ? (
                    <div className="flex space-x-2">
                      <p className="text-sm text-gray-700">Are you sure?</p>
                      <button
                        onClick={confirmDelete}
                        className="p-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
                        disabled={loading}
                      >
                        Yes
                      </button>
                      <button
                        onClick={cancelDelete}
                        className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(task)}
                        className="p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-400"
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(task.id)}
                        className="p-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
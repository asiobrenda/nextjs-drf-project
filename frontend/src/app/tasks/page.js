"use client";

import Navbar from '../../components/navbar';
import { useState, useEffect, useReducer } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

const taskReducer = (state, action) => {
  switch (action.type) {
    case 'SET_TASKS':
      return action.payload;
    case 'ADD_TASK':
      return [...state, action.payload];
    case 'UPDATE_TASK':
      return state.map((task) => (task.id === action.payload.id ? action.payload : task));
    case 'DELETE_TASK':
      return state.filter((task) => task.id !== action.payload);
    default:
      return state;
  }
};

const useTasks = (accessToken, username, refreshAccessToken) => {
  const [tasks, dispatch] = useReducer(taskReducer, []);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!accessToken) {
      console.error("Access token is missing.");
      router.push('/login');
      return;
    }

    const fetchTasks = async () => {
      setLoading(true);
      let token = accessToken;
      try {
        console.log('Fetching tasks with token:', token);
        const response = await axios.get('http://localhost:8000/tasks/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Raw API response:', response.data);
        dispatch({ type: 'SET_TASKS', payload: response.data });
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
              console.log('Retry response:', retryResponse.data);
              dispatch({ type: 'SET_TASKS', payload: retryResponse.data });
              setErrors({});
            } catch (retryErr) {
              console.error('Retry error:', retryErr.response?.data || retryErr.message);
              setErrors({ fetch: 'Failed to fetch tasks after refresh. Please log in again.' });
              router.push('/login');
            }
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
  }, [accessToken, router, username, refreshAccessToken]);

  const addTask = async (title, description, status) => {
    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:8000/tasks/add/',
        { title, description, status },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      dispatch({ type: 'ADD_TASK', payload: response.data });
      setErrors({});
      return true;
    } catch (err) {
      setErrors({ submit: err.response?.data?.detail || 'Failed to save task' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (id, title, description, status) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `http://localhost:8000/tasks/${id}/update/`,
        { title, description, status },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      dispatch({ type: 'UPDATE_TASK', payload: response.data });
      setErrors({});
      return true;
    } catch (err) {
      setErrors({ submit: err.response?.data?.detail || 'Failed to save task' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`http://localhost:8000/tasks/${id}/delete/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      dispatch({ type: 'DELETE_TASK', payload: id });
      setErrors({});
    } catch (err) {
      setErrors({ submit: err.response?.data?.detail || 'Failed to delete task' });
    } finally {
      setLoading(false);
    }
  };

  return { tasks, errors, setErrors, loading, addTask, updateTask, deleteTask };
};

export default function Tasks() {
  const { user, accessToken, refreshAccessToken } = useAuth();
  const { tasks, errors, setErrors, loading, addTask, updateTask, deleteTask } = useTasks(
    accessToken,
    user?.username,
    refreshAccessToken
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');
  const [editId, setEditId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const statusOptions = ['pending', 'in_progress', 'completed'];

  const validateInputs = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!status) newErrors.status = 'Status is required';
    return Object.keys(newErrors).length === 0 ? null : newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateInputs();
    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    if (editId) {
      const success = await updateTask(editId, title, description, status);
      if (success) {
        setEditId(null);
        setTitle('');
        setDescription('');
        setStatus('pending');
      }
    } else {
      const success = await addTask(title, description, status);
      if (success) {
        setTitle('');
        setDescription('');
        setStatus('pending');
      }
    }
  };

  const handleEdit = (task) => {
    setEditId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setStatus(task.status);
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

  if (!user) return null;

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Your Tasks, {user.username}
      </h1>
      {errors.fetch && <p className="text-red-500 mb-4 text-center">{errors.fetch}</p>}
      {errors.submit && <p className="text-red-500 mb-4 text-center">{errors.submit}</p>}

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto mb-6 p-4 bg-white rounded-lg shadow">
        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task Title"
              className={`w-full p-2 border rounded focus:outline-none focus:ring-2 ${
                errors.title ? 'border-red-500' : 'focus:ring-blue-500'
              }`}
              disabled={loading}
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Task Description"
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`w-full p-2 border rounded focus:outline-none focus:ring-2 ${
                errors.status ? 'border-red-500' : 'focus:ring-blue-500'
              }`}
              disabled={loading}
            >
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
            {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status}</p>}
          </div>
          <button
            type="submit"
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? 'Saving...' : editId ? 'Update Task' : 'Add Task'}
          </button>
        </div>
      </form>

      <div className="max-w-4xl mx-auto">
        {loading ? (
          <p className="text-gray-500 text-center">Loading your tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="text-gray-500 text-center">No tasks yet. Add one above!</p>
        ) : (
          <ul className="space-y-4">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="p-4 bg-white rounded-lg shadow flex justify-between items-center"
              >
                <div>
                  <h2 className="text-xl font-semibold">{task.title}</h2>
                  <p className="text-gray-600">{task.description || 'No description'}</p>
                  <p className="text-sm text-gray-500">
                    Status: {task.status.replace('_', ' ').toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(task.created_at).toLocaleString()}
                  </p>
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
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const login = (email, password) =>
  api.post('/api/auth/login', { email, password });

export const register = (name, email, password) =>
  api.post('/api/auth/register', { name, email, password });

// Resume
export const uploadResume = (formData) =>
  api.post('/api/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getResume = () => api.get('/api/resume');

// Jobs
export const getJobs = (params = {}) => api.get('/api/jobs', { params });

// Applications
export const getApplications = () => api.get('/api/applications');
export const createApplication = (data) =>
  api.post('/api/applications', data);

export const updateApplication = (id, data) =>
  api.patch(`/api/applications/${id}`, data);

export const deleteApplication = (id) =>
  api.delete(`/api/applications/${id}`);

// Locations
export const getNearbyLocations = (city, radius = 200) =>
  api.get('/api/locations/nearby', { params: { city, radius } });

// Assistant
export const askAssistant = (message, currentFilters) =>
  api.post('/api/assistant', { message, currentFilters });

export default api;
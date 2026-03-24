import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
  api.post('/auth/login', { email, password });

export const register = (name, email, password) =>
  api.post('/auth/register', { name, email, password });

// Resume
export const uploadResume = (formData) =>
  api.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const getResume = () => api.get('/resume');

// Jobs
export const getJobs = (params = {}) => api.get('/jobs', { params });

// Applications
export const getApplications = () => api.get('/applications');
export const createApplication = (data) => api.post('/applications', data);
export const updateApplication = (id, data) => api.patch(`/applications/${id}`, data);
export const deleteApplication = (id) => api.delete(`/applications/${id}`);

// Locations
export const getNearbyLocations = (city, radius = 200) =>
  api.get('/locations/nearby', { params: { city, radius } });

// Assistant
export const askAssistant = (message, currentFilters) =>
  api.post('/assistant', { message, currentFilters });

export default api;

import axios from 'axios';
import { getAuthToken, removeAuthToken } from './auth';

const API_URL = import.meta.env.DEV ? '/api' : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired, remove it
      removeAuthToken();
      // Don't redirect here - let the component handle it
    }
    return Promise.reject(error);
  }
);

export default api;

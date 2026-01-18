import axios from 'axios';

const API_URL = import.meta.env.DEV ? '/api' : 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL
});

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const setAuthToken = (token) => {
  localStorage.setItem('token', token);
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const removeAuthToken = () => {
  localStorage.removeItem('token');
  delete apiClient.defaults.headers.common['Authorization'];
};

export const login = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password });
  if (response.data.token) {
    setAuthToken(response.data.token);
  }
  return response.data;
};

export const getUser = async () => {
  const token = getAuthToken();
  if (!token) throw new Error('No token');
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  try {
    const response = await apiClient.get('/auth/me');
    return response.data;
  } catch (error) {
    // If token is invalid, remove it and throw error
    if (error.response?.status === 401) {
      removeAuthToken();
    }
    throw error;
  }
};

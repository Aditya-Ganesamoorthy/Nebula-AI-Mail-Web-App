import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject session_id from localStorage if stored
api.interceptors.request.use(
  (config) => {
    const sessionId = localStorage.getItem('nebula_session_id');
    if (sessionId) {
      config.headers.Authorization = `Bearer ${sessionId}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified edge-case network resilience & 401 recovery
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Offline / network failure fallback
      console.warn('Network unreachable or backend service is offline.');
      return Promise.resolve({
        data: {
          success: false,
          data: null,
          error: {
            code: 'NETWORK_ERROR',
            message: 'Unable to connect to the mail server. Please check your internet connection.',
          },
        },
      });
    }

    if (error.response.status === 401) {
      // Session expired or revoked
      const errorData = error.response.data;
      if (errorData?.error?.code === 'GMAIL_AUTH_REQUIRED' || error.response.status === 401) {
        console.info('Session expired or authentication required.');
      }
    }

    return Promise.resolve(error.response);
  }
);

export default api;

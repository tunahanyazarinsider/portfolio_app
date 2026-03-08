import axios from 'axios';

const axiosInstance = axios.create({
  timeout: 15000,
});

// Request interceptor: attach JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.access_token) {
          config.headers.Authorization = `Bearer ${user.access_token}`;
        }
      } catch (e) {
        // Ignore malformed JSON in localStorage
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 by clearing auth and redirecting
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

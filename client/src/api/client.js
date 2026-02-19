import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dispohub_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const devUserId = localStorage.getItem('dispohub_dev_user_id');
  if (devUserId) {
    config.headers['x-dev-user-id'] = devUserId;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('dispohub_token');
      localStorage.removeItem('dispohub_dev_user_id');
      window.location.href = '/dev-login';
    }
    return Promise.reject(error);
  }
);

export default api;

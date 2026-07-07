import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

// Request interceptor — attach access token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 + refresh token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return API(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`, {}, { withCredentials: true });
        const newToken = data.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        API.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ===== Auth API =====
export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  verifyKey: (data) => API.post('/auth/verify-key', data),
  logout: () => API.post('/auth/logout'),
  getProfile: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  changePassword: (data) => API.put('/auth/password', data),
};

// ===== Admin API =====
export const adminAPI = {
  getClients: (params) => API.get('/admin/clients', { params }),
  getClient: (id) => API.get(`/admin/clients/${id}`),
  deleteClient: (id) => API.delete(`/admin/clients/${id}`),
  getDashboardStats: () => API.get('/admin/dashboard/stats'),
  toggleClientStatus: (id) => API.put(`/admin/clients/${id}/status`),
};

// ===== Workouts API =====
export const workoutsAPI = {
  create: (data) => API.post('/workouts', data),
  getAll: (params) => API.get('/workouts', { params }),
  getOne: (id) => API.get(`/workouts/${id}`),
  update: (id, data) => API.put(`/workouts/${id}`, data),
  delete: (id) => API.delete(`/workouts/${id}`),
  getForClient: (clientId) => API.get(`/workouts/client/${clientId}`),
};

// ===== Diets API =====
export const dietsAPI = {
  create: (data) => API.post('/diets', data),
  getAll: (params) => API.get('/diets', { params }),
  getOne: (id) => API.get(`/diets/${id}`),
  update: (id, data) => API.put(`/diets/${id}`, data),
  delete: (id) => API.delete(`/diets/${id}`),
  getForClient: (clientId) => API.get(`/diets/client/${clientId}`),
};

// ===== Weight API =====
export const weightAPI = {
  log: (data) => API.post('/weight', data),
  getHistory: () => API.get('/weight'),
  getClientHistory: (clientId) => API.get(`/weight/client/${clientId}`),
  updateGoalWeight: (data) => API.put('/weight/goal', data),
};

// ===== Labs API =====
export const labsAPI = {
  upload: (data) => API.post('/labs', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAll: (params) => API.get('/labs', { params }),
  getClientLabs: (clientId) => API.get(`/labs/client/${clientId}`),
  getOne: (id) => API.get(`/labs/${id}`),
  addNotes: (id, data) => API.put(`/labs/${id}/notes`, data),
};

// ===== Meals API =====
export const mealsAPI = {
  log: (data) => API.post('/meals', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAll: (params) => API.get('/meals', { params }),
  getToday: () => API.get('/meals/today'),
  getClientMeals: (clientId, params) => API.get(`/meals/client/${clientId}`, { params }),
};

// ===== Tasks API =====
export const tasksAPI = {
  create: (data) => API.post('/tasks', data),
  getToday: () => API.get('/tasks/today'),
  complete: (id) => API.put(`/tasks/${id}/complete`),
  getClientTasks: (clientId, params) => API.get(`/tasks/client/${clientId}`, { params }),
  getHistory: (params) => API.get('/tasks/history', { params }),
};

// ===== Rewards API =====
export const rewardsAPI = {
  getAll: () => API.get('/rewards'),
  getLeaderboard: () => API.get('/rewards/leaderboard'),
  getClientRewards: (clientId) => API.get(`/rewards/client/${clientId}`),
};

// ===== Payments API =====
export const paymentsAPI = {
  createOrder: (data) => API.post('/payments/create-order', data),
  verify: (data) => API.post('/payments/verify', data),
  getHistory: () => API.get('/payments/history'),
  getAllAdmin: (params) => API.get('/payments/admin/all', { params }),
};

// ===== Chat API =====
export const chatAPI = {
  sendMessage: (data) => API.post('/chat', data),
};

// ===== Messages API =====
export const messagesAPI = {
  getTrainers: () => API.get('/messages/admin/trainers'),
  getConversation: (userId, params) => API.get(`/messages/${userId}`, { params }),
  sendMessage: (data) => API.post('/messages', data),
  getUnreadCount: () => API.get('/messages/unread'),
};

// ===== Meal Chat API =====
export const mealChatAPI = {
  sendMessage: (formData) => API.post('/meal-chat', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// ===== Helper =====
export const getImageUrl = (filename) => {
  if (!filename) return '';
  if (filename.startsWith('http')) return filename;
  
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    const baseUrl = apiUrl.replace(/\/api$/, '');
    return `${baseUrl}/uploads/${filename}`;
  }
  return `/uploads/${filename}`;
};

export default API;

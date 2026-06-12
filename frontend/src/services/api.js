import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken
        });

        const { token } = response.data.data;
        localStorage.setItem('token', token);
        originalRequest.headers.Authorization = `Bearer ${token}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Jobs API
export const jobsAPI = {
  getAll: (params) => api.get('/jobs', { params }),
  getById: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
  getByOrganization: (orgId) => api.get(`/jobs/organization/${orgId}`)
};

// Referrals API
export const referralsAPI = {
  createRequest: (data) => api.post('/referrals/request', data),
  getRequests: (params) => api.get('/referrals/requests', { params }),
  getMyRequests: () => api.get('/referrals/my-requests'),
  getProvided: () => api.get('/referrals/provided'),
  accept: (id, data) => api.put(`/referrals/${id}/accept`, data),
  reject: (id, data) => api.put(`/referrals/${id}/reject`, data),
  complete: (id) => api.put(`/referrals/${id}/complete`)
};

// Users API
export const usersAPI = {
  getProfile: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  search: (params) => api.get('/users/search', { params })
};

// Connections API
export const connectionsAPI = {
  follow: (userId) => api.post(`/connections/follow/${userId}`),
  unfollow: (userId) => api.delete(`/connections/unfollow/${userId}`),
  getFollowers: (userId) => api.get(`/connections/followers/${userId}`),
  getFollowing: (userId) => api.get(`/connections/following/${userId}`)
};

// Organizations API
export const organizationsAPI = {
  getAll: (params) => api.get('/organizations', { params }),
  getById: (id) => api.get(`/organizations/${id}`),
  create: (data) => api.post('/organizations', data),
  update: (id, data) => api.put(`/organizations/${id}`, data)
};

export default api;

import axiosInstance from './axiosInstance';

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => axiosInstance.post('/auth/login', data),
  logout: () => axiosInstance.post('/auth/logout'),
  getMe: () => axiosInstance.get('/auth/me'),
  changePassword: (data) => axiosInstance.post('/auth/change-password', data),
  forgotPassword: (data) => axiosInstance.post('/auth/forgot-password', data),
  verifyOTP: (data) => axiosInstance.post('/auth/verify-otp', data),
  resetPassword: (data) => axiosInstance.post('/auth/reset-password', data),
};

// ─── Users API ───────────────────────────────────────────────────────────────
export const usersAPI = {
  getAll: (params) => axiosInstance.get('/users', { params }),
  getById: (id) => axiosInstance.get(`/users/${id}`),
  create: (data) => axiosInstance.post('/users', data),
  update: (id, data) => axiosInstance.put(`/users/${id}`, data),
  delete: (id) => axiosInstance.delete(`/users/${id}`),
  getProfile: () => axiosInstance.get('/users/profile'),
  updateProfile: (data) => axiosInstance.put('/users/profile', data),
  updateAvatar: (formData) => axiosInstance.put('/users/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// ─── Teams API ───────────────────────────────────────────────────────────────
export const teamsAPI = {
  getAll: () => axiosInstance.get('/teams'),
  getById: (id) => axiosInstance.get(`/teams/${id}`),
  create: (data) => axiosInstance.post('/teams', data),
  update: (id, data) => axiosInstance.put(`/teams/${id}`, data),
  delete: (id) => axiosInstance.delete(`/teams/${id}`),
};

// ─── Projects API ─────────────────────────────────────────────────────────────
export const projectsAPI = {
  getAll: (params) => axiosInstance.get('/projects', { params }),
  getById: (id) => axiosInstance.get(`/projects/${id}`),
  create: (data) => axiosInstance.post('/projects', data),
  update: (id, data) => axiosInstance.put(`/projects/${id}`, data),
  delete: (id) => axiosInstance.delete(`/projects/${id}`),
  addMember: (id, data) => axiosInstance.post(`/projects/${id}/members`, data),
  removeMember: (id, userId) => axiosInstance.delete(`/projects/${id}/members/${userId}`),
};

// ─── Tasks API ────────────────────────────────────────────────────────────────
export const tasksAPI = {
  getAll: (params) => axiosInstance.get('/tasks', { params }),
  getById: (id) => axiosInstance.get(`/tasks/${id}`),
  create: (data) => axiosInstance.post('/tasks', data),
  update: (id, data) => axiosInstance.put(`/tasks/${id}`, data),
  delete: (id) => axiosInstance.delete(`/tasks/${id}`),
  assign: (id, data) => axiosInstance.patch(`/tasks/${id}/assign`, data),
  changeStatus: (id, data) => axiosInstance.patch(`/tasks/${id}/status`, data),
  updateProgress: (id, data) => axiosInstance.patch(`/tasks/${id}/progress`, data),
  remind: (id) => axiosInstance.post(`/tasks/${id}/remind`),
  getMyTasks: (params) => axiosInstance.get('/tasks/my-tasks', { params }),
  getOverdue: () => axiosInstance.get('/tasks/overdue'),
};

// ─── Comments API ─────────────────────────────────────────────────────────────
export const commentsAPI = {
  getByTask: (taskId) => axiosInstance.get(`/tasks/${taskId}/comments`),
  create: (taskId, data) => axiosInstance.post(`/tasks/${taskId}/comments`, data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  }),
  update: (taskId, id, data) => axiosInstance.put(`/tasks/${taskId}/comments/${id}`, data),
  delete: (taskId, id) => axiosInstance.delete(`/tasks/${taskId}/comments/${id}`),
};

// ─── Notifications API ────────────────────────────────────────────────────────
export const notificationsAPI = {
  getAll: (params) => axiosInstance.get('/notifications', { params }),
  getUnreadCount: () => axiosInstance.get('/notifications/unread-count'),
  markAsRead: (id) => axiosInstance.patch(`/notifications/${id}/read`),
  markAllAsRead: () => axiosInstance.patch('/notifications/mark-all-read'),
  delete: (id) => axiosInstance.delete(`/notifications/${id}`),
};

// ─── Stats API ────────────────────────────────────────────────────────────────
export const statsAPI = {
  getDashboard: () => axiosInstance.get('/stats/dashboard'),
  getWorkload: () => axiosInstance.get('/stats/workload'),
  getRecentTasks: () => axiosInstance.get('/stats/recent-tasks'),
  getWeeklyChart: () => axiosInstance.get('/stats/weekly-chart'),
  getUpcomingDeadlines: () => axiosInstance.get('/stats/upcoming-deadlines'),
  getProjectProgress: () => axiosInstance.get('/stats/project-progress'),
};

// ─── Logs API ─────────────────────────────────────────────────────────────────
export const logsAPI = {
  getAll: (params) => axiosInstance.get('/logs', { params }),
  getTaskHistory: (taskId) => axiosInstance.get(`/logs/task/${taskId}`),
  getProjectLogs: (projectId) => axiosInstance.get(`/logs/project/${projectId}`),
};

// ─── Global Search API ────────────────────────────────────────────────────────
export const searchAPI = {
  global: (query) => axiosInstance.get('/search', { params: { q: query } }),
};

// ─── AI API ───────────────────────────────────────────────────────────────────
export const aiAPI = {
  getSuggestions: (limit = 5) => axiosInstance.get('/ai/suggest', { params: { limit } }),
};

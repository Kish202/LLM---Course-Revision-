import axios from 'axios';

const API_BASE_URL = 'https://llm-course-revision-5xz3.vercel.app/api';
// const API_BASE_URL = 'http://localhost:4100/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth APIs
export const authAPI = {
  getUser: () => api.get('/auth/user'),
  logout: () => api.post('/auth/logout'),
  loginWithGoogle: () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  },
};

// PDF APIs
export const pdfAPI = {
  getAll: () => api.get('/pdf'),
  upload: (formData) => api.post('/pdf/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getById: (id) => api.get(`/pdf/${id}`),
  delete: (id) => api.delete(`/pdf/${id}`),
  getFileUrl: (id) => `${API_BASE_URL}/pdf/${id}/file`,
};

// Quiz APIs
export const quizAPI = {
  generate: (data) => api.post('/quiz/generate', data),
  submit: (data) => api.post('/quiz/submit', data),
  getHistory: () => api.get('/quiz/history'),
  getAttempt: (id) => api.get(`/quiz/${id}`),
};

// Chat APIs
export const chatAPI = {
  sendMessage: (data) => api.post('/chat/message', data),
  getHistory: (pdfId) => api.get(`/chat/history/${pdfId}`),
  clearHistory: (pdfId) => api.delete(`/chat/history/${pdfId}`),
};

// Progress APIs
export const progressAPI = {
  getDashboard: () => api.get('/progress/dashboard'),
  getAnalysis: () => api.get('/progress/analysis'),
};

export default api;
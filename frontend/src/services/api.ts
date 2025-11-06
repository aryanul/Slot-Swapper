import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  signup: (name: string, email: string, password: string) =>
    api.post('/auth/signup', { name, email, password }),
};

export const eventService = {
  getAll: () => api.get('/events'),
  getById: (id: string) => api.get(`/events/${id}`),
  create: (data: {
    title: string;
    startTime: string;
    endTime: string;
    status?: string;
  }) => api.post('/events', data),
  update: (id: string, data: {
    title?: string;
    startTime?: string;
    endTime?: string;
    status?: string;
  }) => api.put(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
};

export const swapService = {
  getSwappableSlots: () => api.get('/swappable-slots'),
  createSwapRequest: (mySlotId: string, theirSlotId: string) =>
    api.post('/swap-request', { mySlotId, theirSlotId }),
  respondToSwap: (requestId: string, accepted: boolean) =>
    api.post(`/swap-response/${requestId}`, { accepted }),
  getSwapRequests: () => api.get('/swap-requests'),
};

export const importService = {
  importCalendar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/import/calendar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api;


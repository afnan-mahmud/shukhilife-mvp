import { api } from './client';

export const landingApi = {
  // Admin CRUD operations
  list: () => api.get('/api/landing'),
  create: (payload) => api.post('/api/landing', payload),
  update: (id, payload) => api.put(`/api/landing/${id}`, payload),
  delete: (id) => api.delete(`/api/landing/${id}`),
  
  // Public access
  getBySlug: (slug) => api.get(`/api/landing/by-slug/${slug}`),
  
  // Legacy support
  upsert: (payload) => api.post('/api/landing', payload),
  getPublicBySlug: (slug) => api.get(`/api/landing/by-slug/${slug}`),
};

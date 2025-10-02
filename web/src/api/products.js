import { api } from './client';

export const productsApi = {
  listBasic: () => api.get('/api/products/basic?active=1'),
};

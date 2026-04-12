import apiClient from './api';

export const transactionsService = {
  getHistory: (params = {}) => {
    return apiClient.get('/transaction/history', { params });
  },

  getById: (id) => {
    return apiClient.get(`/transaction/${id}`);
  },

  export: (params = {}) => {
    return apiClient.get('/transaction/export', {
      params,
      responseType: 'blob',
    });
  },
};

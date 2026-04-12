import apiClient from './api';

export const webhooksService = {
  getAll: () => {
    return apiClient.get('/webhooks');
  },

  create: (webhookData) => {
    return apiClient.post('/webhooks', webhookData);
  },

  delete: (id) => {
    return apiClient.delete(`/webhooks/${id}`);
  },

  update: (id, webhookData) => {
    return apiClient.put(`/webhooks/${id}`, webhookData);
  },

  getDeliveries: (id, params = {}) => {
    return apiClient.get(`/webhooks/${id}/deliveries`, { params });
  },
};

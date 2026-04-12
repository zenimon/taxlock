import apiClient from './api';

export const rulesService = {
  getAll: () => {
    return apiClient.get('/rules');
  },

  getById: (id) => {
    return apiClient.get(`/rules/${id}`);
  },

  create: (ruleData) => {
    return apiClient.post('/rules', ruleData);
  },

  update: (id, ruleData) => {
    return apiClient.put(`/rules/${id}`, ruleData);
  },

  delete: (id) => {
    return apiClient.delete(`/rules/${id}`);
  },

  reorder: (ids) => {
    return apiClient.post('/rules/reorder', { ids });
  },

  test: (ruleData, sampleTransactions) => {
    return apiClient.post('/simulate/rule-test', {
      rule: ruleData,
      transactions: sampleTransactions,
    });
  },
};

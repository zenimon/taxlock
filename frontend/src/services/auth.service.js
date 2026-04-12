import apiClient from './api';

export const authService = {
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (businessName, email, password, plan = 'starter') => {
    const response = await apiClient.post('/auth/register', {
      businessName,
      email,
      password,
      plan,
    });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('apiKey');
    localStorage.removeItem('tenantId');
  },

  getApiKey: () => localStorage.getItem('apiKey'),

  setAuth: (tenantId, apiKey) => {
    localStorage.setItem('tenantId', tenantId);
    localStorage.setItem('apiKey', apiKey);
  },
};

export default authService;

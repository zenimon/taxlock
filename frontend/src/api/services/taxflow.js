import apiClient from '../client';

export const transactionService = {
    allocate: (data) => apiClient.post('/transaction/allocate', data),
    assess: (data) => apiClient.post('/transaction/assess', data),
    getHistory: (params) => apiClient.get('/transaction/history', { params }),
};

export const rulesService = {
    list: () => apiClient.get('/rules'),
    create: (data) => apiClient.post('/rules', data),
    get: (id) => apiClient.get(`/rules/${id}`),
};

export const simulationService = {
    cashflow: (data) => apiClient.post('/simulation/cashflow', data),
    runAllocation: (data) => apiClient.post('/simulation/allocation', data),
    testRule: (data) => apiClient.post('/simulation/rule-test', data),
};

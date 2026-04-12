import apiClient from './api';

export const simulateService = {
  allocation: (transactionData) => {
    return apiClient.post('/simulate/allocation', transactionData);
  },

  cashflow: (cashflowData) => {
    return apiClient.post('/simulate/cashflow', cashflowData);
  },

  ruleTest: (ruleData, sampleTransactions) => {
    return apiClient.post('/simulate/rule-test', {
      rule: ruleData,
      transactions: sampleTransactions,
    });
  },
};

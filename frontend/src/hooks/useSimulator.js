import { useMutation } from '@tanstack/react-query';
import { simulateService } from '../services/simulate.service';

export function useSimulateAllocation() {
  return useMutation({
    mutationFn: (transactionData) => simulateService.allocation(transactionData),
  });
}

export function useSimulateCashflow() {
  return useMutation({
    mutationFn: (cashflowData) => simulateService.cashflow(cashflowData),
  });
}

export function useSimulateRuleTest() {
  return useMutation({
    mutationFn: ({ ruleData, sampleTransactions }) =>
      simulateService.ruleTest(ruleData, sampleTransactions),
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsService } from '../services/transactions.service';

export function useTransactions(filters = {}) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => transactionsService.getHistory(filters).then((res) => res.data),
    staleTime: 30 * 1000,
  });
}

export function useTransactionExport() {
  return useMutation({
    mutationFn: (filters) => transactionsService.export(filters),
  });
}

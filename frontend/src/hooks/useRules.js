import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rulesService } from '../services/rules.service';

export function useRules() {
  return useQuery({
    queryKey: ['rules'],
    queryFn: () => rulesService.getAll().then((res) => res.data),
    staleTime: 60 * 1000,
  });
}

export function useCreateRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (ruleData) => rulesService.create(ruleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });
}

export function useUpdateRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ruleData }) => rulesService.update(id, ruleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });
}

export function useDeleteRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => rulesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });
}

export function useTestRule() {
  return useMutation({
    mutationFn: ({ ruleData, sampleTransactions }) =>
      rulesService.test(ruleData, sampleTransactions),
  });
}

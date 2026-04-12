import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { webhooksService } from '../services/webhooks.service';

export function useWebhooks() {
  return useQuery({
    queryKey: ['webhooks'],
    queryFn: () => webhooksService.getAll().then((res) => res.data),
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (webhookData) => webhooksService.create(webhookData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => webhooksService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
  });
}

export function useWebhookDeliveries(webhookId) {
  return useQuery({
    queryKey: ['webhooks', webhookId, 'deliveries'],
    queryFn: () => webhooksService.getDeliveries(webhookId).then((res) => res.data),
    enabled: !!webhookId,
  });
}

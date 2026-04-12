import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api';
import AppShell from '../../components/layout/AppShell';
import Card, { CardContent, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

const ApiKeyCard = () => {
  const [showKey, setShowKey] = useState(false);
  const apiKey = localStorage.getItem('apiKey') || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
  };

  const handleRegenerate = () => {
    if (confirm('Are you sure? This will invalidate your current API key.')) {
      // Would call API to regenerate
      alert('Key regeneration coming soon');
    }
  };

  return (
    <Card>
      <CardContent>
        <CardTitle>API Key</CardTitle>
        <div className="mt-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg font-mono text-sm">
            <span className="flex-1 truncate">
              {showKey ? apiKey : apiKey.slice(0, 8) + '•'.repeat(16) + apiKey.slice(-4)}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setShowKey(!showKey)}>
              {showKey ? 'Hide' : 'Show'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              Copy
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={handleRegenerate} className="mt-3">
            Regenerate Key
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const WebhookRegistrationForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    url: '',
    events: [],
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/webhooks', data);
      return response.data;
    },
    onSuccess: (data) => {
      onSuccess?.(data);
      setFormData({ url: '', events: [] });
    },
  });

  const eventTypes = [
    { id: 'allocation.completed', label: 'Allocation Completed' },
    { id: 'allocation.failed', label: 'Allocation Failed' },
    { id: 'risk.detected', label: 'Risk Detected' },
    { id: 'bucket.threshold', label: 'Bucket Threshold' },
    { id: 'rule.triggered', label: 'Rule Triggered' },
  ];

  const toggleEvent = (eventId) => {
    setFormData({
      ...formData,
      events: formData.events.includes(eventId)
        ? formData.events.filter((e) => e !== eventId)
        : [...formData.events, eventId],
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
        <input
          type="url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#534AB7]"
          placeholder="https://your-domain.com/webhook"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Events</label>
        <div className="space-y-2">
          {eventTypes.map((event) => (
            <label key={event.id} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.events.includes(event.id)}
                onChange={() => toggleEvent(event.id)}
                className="rounded border-gray-300 text-[#534AB7] focus:ring-[#534AB7]"
              />
              <span className="ml-2 text-sm text-gray-600">{event.label}</span>
            </label>
          ))}
        </div>
      </div>

      <Button type="submit" isLoading={mutation.isPending}>
        Register Webhook
      </Button>
    </form>
  );
};

const WebhookList = ({ webhooks, onDelete, onViewDeliveries }) => {
  if (!webhooks || webhooks.length === 0) {
    return <p className="text-gray-500 text-sm">No webhooks registered</p>;
  }

  return (
    <div className="space-y-3">
      {webhooks.map((webhook) => (
        <div
          key={webhook.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div>
            <p className="font-medium text-gray-900 text-sm">{webhook.url}</p>
            <p className="text-xs text-gray-500">
              {webhook.events?.join(', ') || 'All events'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onViewDeliveries(webhook)}>
              Deliveries
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(webhook.id)}>
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

const DeliveryLogTable = ({ webhook }) => {
  const { data: deliveries, isLoading } = useQuery({
    queryKey: ['webhooks', webhook.id, 'deliveries'],
    queryFn: async () => {
      const response = await apiClient.get(`/webhooks/${webhook.id}/deliveries`);
      return response.data.deliveries || [];
    },
    enabled: !!webhook,
  });

  if (!webhook) return null;

  return (
    <div className="mt-4">
      <h3 className="font-medium text-gray-900 mb-3">Delivery History</h3>
      {isLoading ? (
        <Spinner size="sm" />
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Attempts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {deliveries?.map((delivery) => (
              <tr key={delivery.id}>
                <td className="px-3 py-2 text-sm text-gray-900">
                  {new Date(delivery.timestamp).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-sm text-gray-600">{delivery.event}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      delivery.success
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {delivery.success ? 'Success' : `Failed (${delivery.statusCode})`}
                  </span>
                </td>
                <td className="px-3 py-2 text-sm text-gray-600">{delivery.attempts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const RiskThresholdSliders = () => {
  const [thresholds, setThresholds] = useState({
    medium: 0.4,
    high: 0.75,
  });

  const handleChange = (type, value) => {
    const newThresholds = { ...thresholds, [type]: parseFloat(value) };
    setThresholds(newThresholds);
    localStorage.setItem('riskThresholds', JSON.stringify(newThresholds));
  };

  return (
    <Card>
      <CardContent>
        <CardTitle>Risk Thresholds</CardTitle>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medium Risk Threshold: {thresholds.medium}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={thresholds.medium}
              onChange={(e) => handleChange('medium', e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              High Risk Threshold: {thresholds.high}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={thresholds.high}
              onChange={(e) => handleChange('high', e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Settings = () => {
  const queryClient = useQueryClient();
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [showSecret, setShowSecret] = useState(null);

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const response = await apiClient.get('/webhooks');
      return response.data.webhooks || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(`/webhooks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['webhooks']);
    },
  });

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this webhook?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleRegisterSuccess = (data) => {
    queryClient.invalidateQueries(['webhooks']);
    if (data.secret) {
      setShowSecret(data.secret);
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        <div className="space-y-6">
          <ApiKeyCard />

          <Card>
            <CardContent>
              <CardTitle>Register Webhook</CardTitle>
              <div className="mt-4">
                <WebhookRegistrationForm onSuccess={handleRegisterSuccess} />
              </div>
            </CardContent>
          </Card>

          {showSecret && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="font-medium text-yellow-800">Webhook Secret</p>
              <p className="text-sm text-yellow-700 mt-1">
                Save this secret securely. You won't be able to see it again.
              </p>
              <code className="block mt-2 bg-yellow-100 px-3 py-2 rounded font-mono text-sm">
                {showSecret}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSecret(null)}
                className="mt-2"
              >
                Dismiss
              </Button>
            </div>
          )}

          <Card>
            <CardContent>
              <CardTitle>Registered Webhooks</CardTitle>
              <div className="mt-4">
                {isLoading ? (
                  <Spinner size="sm" />
                ) : (
                  <WebhookList
                    webhooks={webhooks}
                    onDelete={handleDelete}
                    onViewDeliveries={setSelectedWebhook}
                  />
                )}
              </div>
              {selectedWebhook && (
                <DeliveryLogTable webhook={selectedWebhook} />
              )}
            </CardContent>
          </Card>

          <RiskThresholdSliders />
        </div>
      </div>
    </AppShell>
  );
};

export default Settings;

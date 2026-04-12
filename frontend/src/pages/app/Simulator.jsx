import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../../services/api';
import AppShell from '../../components/layout/AppShell';
import Card, { CardContent, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const SingleAllocationForm = ({ onResult }) => {
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'INR',
    source: 'revenue',
    metadata: '{}',
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/simulate/allocation', data);
      return response.data;
    },
    onSuccess: (data) => {
      onResult(data);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount),
      metadata: JSON.parse(formData.metadata || '{}'),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
        <input
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#534AB7]"
          placeholder="100000"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
        <select
          value={formData.currency}
          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#534AB7]"
        >
          <option value="INR">INR</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
        <select
          value={formData.source}
          onChange={(e) => setFormData({ ...formData, source: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#534AB7]"
        >
          <option value="revenue">Revenue</option>
          <option value="refund">Refund</option>
          <option value="investment">Investment</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Metadata (JSON)</label>
        <textarea
          value={formData.metadata}
          onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#534AB7] font-mono text-sm"
          rows={3}
          placeholder='{"category": "monthly"}'
        />
      </div>

      <Button type="submit" isLoading={mutation.isPending} className="w-full">
        Simulate Allocation
      </Button>
    </form>
  );
};

const AllocationResultCard = ({ result }) => {
  if (!result) return null;

  const totalAllocated = result.allocations?.reduce((sum, a) => sum + a.amount, 0) || 0;

  return (
    <Card>
      <CardContent>
        <CardTitle>Allocation Result</CardTitle>
        <div className="mt-4">
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAllocated)}</p>
          <p className="text-sm text-gray-500">Rule: {result.ruleName || 'System default'}</p>
        </div>

        <div className="mt-6 space-y-3">
          {result.allocations?.map((alloc, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor:
                      alloc.bucket === 'tax'
                        ? '#EF9F27'
                        : alloc.bucket === 'operations'
                        ? '#1D9E75'
                        : '#534AB7',
                  }}
                />
                <span className="capitalize text-gray-700">{alloc.bucket}</span>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">{formatCurrency(alloc.amount)}</p>
                <p className="text-xs text-gray-500">
                  {Math.round((alloc.amount / totalAllocated) * 100)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const CashflowInputs = () => {
  // Simplified placeholder
  return (
    <div className="text-center py-8 text-gray-500">
      Cashflow projection coming soon
    </div>
  );
};

const ScenarioComparisonChart = () => {
  return (
    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">Chart visualization coming soon</p>
    </div>
  );
};

const RiskEventList = () => {
  return null;
};

const Simulator = () => {
  const [activeTab, setActiveTab] = useState('single');
  const [result, setResult] = useState(null);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Simulator</h1>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'single'
                ? 'bg-[#534AB7] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Single Allocation
          </button>
          <button
            onClick={() => setActiveTab('cashflow')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'cashflow'
                ? 'bg-[#534AB7] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Cashflow Projection
          </button>
        </div>

        {activeTab === 'single' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent>
                <CardTitle>Input</CardTitle>
                <div className="mt-4">
                  <SingleAllocationForm onResult={setResult} />
                </div>
              </CardContent>
            </Card>

            {result && (
              <div>
                <AllocationResultCard result={result} />
              </div>
            )}
          </div>
        ) : (
          <Card>
            <CardContent>
              <CardTitle>Cashflow Projection</CardTitle>
              <CashflowInputs />
              <div className="mt-6">
                <ScenarioComparisonChart />
              </div>
              <RiskEventList />
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
};

export default Simulator;

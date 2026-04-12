import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/api';
import AppShell from '../../components/layout/AppShell';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Drawer from '../../components/ui/Drawer';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const FilterBar = ({ filters, setFilters }) => {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <input
        type="date"
        value={filters.from || ''}
        onChange={(e) => setFilters({ ...filters, from: e.target.value })}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
      />
      <input
        type="date"
        value={filters.to || ''}
        onChange={(e) => setFilters({ ...filters, to: e.target.value })}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
      />
      <select
        value={filters.bucket || ''}
        onChange={(e) => setFilters({ ...filters, bucket: e.target.value })}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
      >
        <option value="">All Buckets</option>
        <option value="tax">Tax</option>
        <option value="operations">Operations</option>
        <option value="growth">Growth</option>
      </select>
      <select
        value={filters.source || ''}
        onChange={(e) => setFilters({ ...filters, source: e.target.value })}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
      >
        <option value="">All Sources</option>
        <option value="revenue">Revenue</option>
        <option value="refund">Refund</option>
        <option value="other">Other</option>
      </select>
    </div>
  );
};

const TransactionTable = ({ transactions, onSelect }) => {
  if (!transactions || transactions.length === 0) {
    return (
      <EmptyState
        title="No transactions found"
        description="Transactions will appear here once you start allocating funds."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rule</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((tx) => (
            <tr
              key={tx.id}
              onClick={() => onSelect(tx)}
              className="cursor-pointer hover:bg-gray-50"
            >
              <td className="px-4 py-3 text-sm text-gray-900">
                {new Date(tx.timestamp).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-sm font-mono text-gray-600">{tx.id?.slice(0, 8)}</td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                {formatCurrency(tx.amount)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{tx.source}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{tx.ruleName || 'System'}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Completed
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AllocationBreakdownDrawer = ({ transaction, isOpen, onClose }) => {
  if (!transaction) return null;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Allocation Details" size="md">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500">Amount</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(transaction.amount)}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Source</p>
          <p className="text-gray-900">{transaction.source}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Rule Applied</p>
          <p className="text-gray-900">{transaction.ruleName || 'System default'}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-2">Allocation Breakdown</p>
          <div className="space-y-2">
            {transaction.allocations?.map((alloc, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="capitalize text-gray-700">{alloc.bucket}</span>
                <span className="font-medium text-gray-900">{formatCurrency(alloc.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-2">Raw Response</p>
          <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
            {JSON.stringify(transaction, null, 2)}
          </pre>
        </div>
      </div>
    </Drawer>
  );
};

const ExportButton = ({ transactions }) => {
  const handleExport = () => {
    const csv = [
      ['Date', 'ID', 'Amount', 'Source', 'Rule', 'Status'].join(','),
      ...transactions.map((tx) =>
        [
          new Date(tx.timestamp).toISOString(),
          tx.id,
          tx.amount,
          tx.source,
          tx.ruleName || 'System',
          'completed',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      Export CSV
    </Button>
  );
};

const Transactions = () => {
  const [filters, setFilters] = useState({});
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', { page, limit, ...filters }],
    queryFn: async () => {
      const params = { page, limit, ...filters };
      const response = await apiClient.get('/transaction/history', { params });
      return response.data;
    },
    staleTime: 30000,
  });

  const transactions = data?.transactions || [];

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <ExportButton transactions={transactions} />
        </div>

        <FilterBar filters={filters} setFilters={setFilters} />

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <Card>
              <CardContent className="p-0">
                <TransactionTable
                  transactions={transactions}
                  onSelect={setSelectedTransaction}
                />
              </CardContent>
            </Card>

            {/* Pagination */}
            {data?.pagination?.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-600">
                  Page {page} of {data.pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= data.pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        <AllocationBreakdownDrawer
          transaction={selectedTransaction}
          isOpen={!!selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      </div>
    </AppShell>
  );
};

export default Transactions;

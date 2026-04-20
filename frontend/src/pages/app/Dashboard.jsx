import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api';
import AppShell from '../../components/layout/AppShell';
import Card, { CardContent, CardTitle } from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const BucketBalanceCards = ({ transactions }) => {
  const balances = {
    tax: 0,
    operations: 0,
    growth: 0,
  };

  // Calculate balances from transactions
  transactions?.forEach((tx) => {
    tx.allocations?.forEach((alloc) => {
      if (alloc.bucket === 'tax') balances.tax += alloc.amount;
      if (alloc.bucket === 'operations') balances.operations += alloc.amount;
      if (alloc.bucket === 'growth') balances.growth += alloc.amount;
    });
  });

  const total = balances.tax + balances.operations + balances.growth;

  const cards = [
    { name: 'Tax Reserve', balance: balances.tax, color: '#EF9F27' },
    { name: 'Operations', balance: balances.operations, color: '#1D9E75' },
    { name: 'Growth Capital', balance: balances.growth, color: '#534AB7' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {cards.map((card) => (
        <Card key={card.name}>
          <CardContent>
            <p className="text-sm font-medium text-gray-600">{card.name}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(card.balance)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {total > 0 ? Math.round((card.balance / total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const CashflowChart = () => {
  // Simplified chart placeholder
  return (
    <Card className="mb-8">
      <CardContent>
        <CardTitle>Cashflow Trend (30 days)</CardTitle>
        <div className="mt-4 h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">Chart visualization coming soon</p>
        </div>
      </CardContent>
    </Card>
  );
};

const AllocationFeed = ({ transactions }) => {
  const recentTransactions = transactions?.slice(0, 10) || [];

  return (
    <Card>
      <CardContent>
        <CardTitle>Recent Allocations</CardTitle>
        <div className="mt-4 space-y-4">
          {recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-sm">No transactions yet</p>
          ) : (
            recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{formatCurrency(tx.amount)}</p>
                  <p className="text-sm text-gray-500">{tx.source}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(tx.timestamp).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-400">{tx.ruleName || 'System default'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const RiskAlertBanner = () => {
  // Placeholder - would check actual thresholds
  return null;
};

const Dashboard = () => {
  useAuth();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', { limit: 100 }],
    queryFn: async () => {
      const response = await apiClient.get('/transaction/history', {
        params: { limit: 100 },
      });
      return response.data.transactions || [];
    },
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <Spinner size="lg" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

        <RiskAlertBanner />
        <BucketBalanceCards transactions={transactions} />
        <CashflowChart transactions={transactions} />
        <AllocationFeed transactions={transactions} />
      </div>
    </AppShell>
  );
};

export default Dashboard;

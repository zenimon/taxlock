import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../lib/formatCurrency';

const BUCKETS = [
  { name: 'Tax Reserve', color: '#EF9F27', percentage: 30 },
  { name: 'Operations', color: '#1D9E75', percentage: 50 },
  { name: 'Growth Capital', color: '#534AB7', percentage: 20 },
];

const TOTAL_AMOUNT = 100000;

export default function HeroSection() {
  const [animatedAmounts, setAnimatedAmounts] = useState({ tax: 0, ops: 0, growth: 0 });

  useEffect(() => {
    const duration = 2000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setAnimatedAmounts({
        tax: Math.floor(TOTAL_AMOUNT * 0.3 * easeOut),
        ops: Math.floor(TOTAL_AMOUNT * 0.5 * easeOut),
        growth: Math.floor(TOTAL_AMOUNT * 0.2 * easeOut),
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, []);

  return (
    <section className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Smart Money Allocation<br />
            <span className="text-[#534AB7]">Powered by Rules</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            Automatically split incoming revenue into buckets for tax, operations, and growth.
            Set custom rules, simulate scenarios, and never worry about cash flow again.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/signup">
              <Button variant="primary" size="lg">
                Start Free
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
            <Link to="/docs">
              <Button variant="secondary" size="lg">View Docs</Button>
            </Link>
          </div>
        </div>

        {/* Live Allocation Demo */}
        <div className="bg-slate-50 rounded-2xl p-8 md:p-12 border border-slate-200">
          <div className="text-center mb-8">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Live Demo</p>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(TOTAL_AMOUNT)}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {BUCKETS.map((bucket, index) => {
              const amount = index === 0 ? animatedAmounts.tax : index === 1 ? animatedAmounts.ops : animatedAmounts.growth;
              return (
                <div key={bucket.name} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bucket.color }} />
                    <span className="font-medium text-slate-700">{bucket.name}</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mb-1">{formatCurrency(amount)}</p>
                  <p className="text-sm text-slate-500">{bucket.percentage}% allocation</p>
                  <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(amount / (TOTAL_AMOUNT * bucket.percentage / 100)) * 100}%`,
                        backgroundColor: bucket.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Real-time allocation engine active
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

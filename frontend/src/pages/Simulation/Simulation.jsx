import { useState } from 'react';
import { clsx } from 'clsx';
import { TrendingUp, Calendar, Wallet, ArrowUpRight, ArrowDownLeft, Info } from 'lucide-react';
import { simulationService } from '../../api/services/taxflow';

const Simulation = () => {
    const [params, setParams] = useState({
        periods: 12,
        periodUnit: 'month',
        initialBalances: { tax: 5000, operations: 15000, growth: 10000 },
        projectedInflows: [{ amount: 20000, frequency: 'monthly', source: 'recurring' }],
        projectedOutflows: [{ amount: 12000, frequency: 'monthly', category: 'payroll' }]
    });

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSimulate = async () => {
        setLoading(true);
        try {
            const res = await simulationService.cashflow(params);
            setResult(res);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Financial Simulation</h1>
                <p className="text-text-muted mt-2">Project your cash flow and bucket distribution across future periods.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sidebar: Inputs */}
                <div className="space-y-6">
                    <div className="premium-card">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" /> Timeline
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-text-muted uppercase mb-2 block">Duration</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range" min="1" max="60"
                                        value={params.periods}
                                        onChange={(e) => setParams({ ...params, periods: parseInt(e.target.value) })}
                                        className="flex-1 accent-primary"
                                    />
                                    <span className="font-bold w-12 text-right">{params.periods}</span>
                                    <span className="text-xs text-text-muted">{params.periodUnit}s</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="premium-card">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-primary" /> Initial Balances
                        </h3>
                        <div className="space-y-4">
                            {Object.entries(params.initialBalances).map(([bucket, val]) => (
                                <div key={bucket}>
                                    <label className="text-xs font-bold text-text-muted uppercase mb-1 block capitalize">{bucket}</label>
                                    <input
                                        type="number"
                                        value={val}
                                        onChange={(e) => setParams({
                                            ...params,
                                            initialBalances: { ...params.initialBalances, [bucket]: parseInt(e.target.value) }
                                        })}
                                        className="w-full bg-surface-bg/50 border border-surface-border rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleSimulate}
                        disabled={loading}
                        className="btn-primary w-full h-12 flex items-center justify-center gap-2"
                    >
                        {loading ? "Calculating..." : "Run Projection"}
                        <TrendingUp className="w-4 h-4" />
                    </button>
                </div>

                {/* Main Content: Projections */}
                <div className="lg:col-span-2 space-y-6">
                    {!result ? (
                        <div className="premium-card h-96 flex flex-col items-center justify-center text-center p-12 space-y-4 border-dashed bg-primary/[0.01]">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                <TrendingUp className="w-8 h-8" />
                            </div>
                            <div>
                                <h4 className="font-bold text-xl">No projection data</h4>
                                <p className="text-text-muted text-sm mt-2 max-w-xs mx-auto">Configure your timeline and balances then run the simulation to see future projections.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <StatCard label="Ending Balance" value={result.endingTotal} trend="+12.4%" />
                                <StatCard label="Burn Rate (Avg)" value={result.avgBurn} trend="-2.1%" negative />
                            </div>

                            <div className="premium-card">
                                <h3 className="font-semibold mb-6">Cash Flow Projection</h3>
                                <div className="h-64 flex items-end gap-2 px-4">
                                    {result.projections.map((p, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                                            <div
                                                className="w-full bg-primary/20 rounded-t-md hover:bg-primary transition-colors cursor-pointer"
                                                style={{ height: `${(p.total / result.maxBalance * 100)}%` }}
                                            >
                                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-text-main text-white px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                                    ${p.total.toLocaleString()}
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-text-muted font-bold">{i + 1}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    <div className="premium-card bg-surface-bg/50 border-none">
                        <div className="flex gap-4">
                            <Info className="w-5 h-5 text-primary flex-shrink-0" />
                            <div className="text-sm text-text-muted leading-relaxed">
                                Projections are based on current rules and dry-run simulation data. Real outcomes may vary based on dynamic tax laws and interest rates.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, trend, negative }) => (
    <div className="premium-card p-5">
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{label}</span>
        <div className="mt-2 flex items-end justify-between">
            <span className="text-2xl font-bold">${value.toLocaleString()}</span>
            <div className={clsx(
                "flex items-center gap-1 text-xs font-bold",
                negative ? "text-danger" : "text-success"
            )}>
                {negative ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                {trend}
            </div>
        </div>
    </div>
);

export default Simulation;

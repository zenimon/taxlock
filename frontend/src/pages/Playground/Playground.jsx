import React, { useState, useEffect } from 'react';
import { Play, Send, CheckCircle2, AlertCircle, XCircle, ArrowRight, Database, ShieldAlert, PieChart } from 'lucide-react';
import { transactionService } from '../../api/services/taxflow';
import { clsx } from 'clsx';

const ENDPOINTS = [
    { id: 'allocate', name: 'POST /transaction/allocate', description: 'Real-time fund split engine', defaultJson: { transactionId: "tx_9f2c", amount: 1250.00, currency: "USD", source: "invoice" } },
    { id: 'assess', name: 'POST /transaction/assess', description: 'Outbound risk assessment', defaultJson: { amount: 5000.00, currency: "USD", category: "payroll" } },
];

const Playground = () => {
    const [selectedEndpoint, setSelectedEndpoint] = useState(ENDPOINTS[0]);
    const [jsonInput, setJsonInput] = useState(JSON.stringify(selectedEndpoint.defaultJson, null, 2));
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleRun = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = JSON.parse(jsonInput);
            const res = await (selectedEndpoint.id === 'allocate'
                ? transactionService.allocate(data)
                : transactionService.assess(data));
            setResponse(res);
        } catch (err) {
            setError(err.message);
            setResponse(null);
        } finally {
            setLoading(false);
        }
    };

    const getBadgeType = (decision) => {
        if (!decision) return 'badge-warning';
        switch (decision.toUpperCase()) {
            case 'APPROVE': return 'badge-success';
            case 'REVIEW': return 'badge-warning';
            case 'BLOCK': return 'badge-danger';
            default: return 'badge-warning';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">API Playground</h1>
                <p className="text-text-muted mt-2">Test the Decision Engine logic by sending actual transactions to the backend.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Editor */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="premium-card">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Database className="w-4 h-4 text-primary" /> Configuration
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-text-muted uppercase mb-2 block">Endpoint</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {ENDPOINTS.map((ep) => (
                                        <button
                                            key={ep.id}
                                            onClick={() => {
                                                setSelectedEndpoint(ep);
                                                setJsonInput(JSON.stringify(ep.defaultJson, null, 2));
                                            }}
                                            className={clsx(
                                                "w-full text-left p-3 rounded-lg border transition-all",
                                                selectedEndpoint.id === ep.id
                                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                    : "border-surface-border bg-white hover:border-text-muted/30"
                                            )}
                                        >
                                            <div className="font-mono text-sm font-bold">{ep.name}</div>
                                            <div className="text-xs text-text-muted">{ep.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-text-muted uppercase mb-2 block">Request Body (JSON)</label>
                                <textarea
                                    value={jsonInput}
                                    onChange={(e) => setJsonInput(e.target.value)}
                                    className="w-full h-48 font-mono text-sm p-4 rounded-lg border border-surface-border focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-surface-bg/30"
                                    spellCheck="false"
                                />
                            </div>

                            <button
                                onClick={handleRun}
                                disabled={loading}
                                className="btn-primary w-full flex items-center justify-center gap-2 h-12"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                                Run Decision Engine
                            </button>
                        </div>
                    </div>

                    {/* Flow Visualizer Placeholder */}
                    <div className="premium-card bg-primary/[0.02] border-dashed">
                        <h3 className="font-semibold mb-6 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-primary" /> Execution Pipeline
                        </h3>
                        <div className="flex items-center justify-between px-4">
                            <PipelineNode label="Input" active={!!response} icon={Database} />
                            <ArrowRight className="text-surface-border w-4 h-4" />
                            <PipelineNode label="Rules" active={!!response} icon={ShieldAlert} />
                            <ArrowRight className="text-surface-border w-4 h-4" />
                            <PipelineNode label="Risk" active={!!response} icon={ShieldCheck} />
                            <ArrowRight className="text-surface-border w-4 h-4" />
                            <PipelineNode label="Decision" active={!!response} icon={CheckCircle2} primary />
                        </div>
                    </div>
                </div>

                {/* Right: Result */}
                <div className="lg:col-span-5">
                    <div className={clsx(
                        "premium-card h-full transition-all duration-500",
                        response ? "border-primary/20 ring-1 ring-primary/10" : "bg-surface-bg/20"
                    )}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Send className="w-4 h-4 text-primary" /> Response Viewer
                            </h3>
                            {response && (
                                <span className={clsx("badge", getBadgeType(response.decision))}>
                                    {response.decision || 'Assessed'}
                                </span>
                            )}
                        </div>

                        {error && (
                            <div className="p-4 rounded-lg bg-danger/10 border border-danger/20 flex gap-3 text-danger mb-4">
                                <XCircle className="w-5 h-5 flex-shrink-0" />
                                <div className="text-sm font-medium">{error}</div>
                            </div>
                        )}

                        {!response && !error && !loading && (
                            <div className="h-64 flex flex-col items-center justify-center text-text-muted space-y-3 opacity-50">
                                <Terminal className="w-12 h-12" />
                                <p className="text-sm font-medium">Engine output will appear here</p>
                            </div>
                        )}

                        {response && (
                            <div className="space-y-6">
                                <div className="p-4 rounded-lg bg-surface-bg font-mono text-xs overflow-auto max-h-96">
                                    <pre>{JSON.stringify(response, null, 2)}</pre>
                                </div>

                                {response.allocations && (
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Allocation Breakdown</h4>
                                        <div className="space-y-3">
                                            {Object.entries(response.allocations).map(([bucket, amount]) => (
                                                <div key={bucket} className="flex items-center gap-4">
                                                    <div className="w-24 text-sm font-medium capitalize">{bucket}</div>
                                                    <div className="flex-1 h-2 bg-surface-bg rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary"
                                                            style={{ width: `${(amount / (response.amount || response.totalAmount) * 100)}%` }}
                                                        />
                                                    </div>
                                                    <div className="w-20 text-right text-sm font-bold">
                                                        {amount.toLocaleString('en-US', { style: 'currency', currency: response.currency || 'USD' })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const PipelineNode = ({ label, active, icon: Icon, primary }) => (
    <div className="flex flex-col items-center gap-2">
        <div className={clsx(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500",
            active
                ? (primary ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" : "bg-primary/10 text-primary border border-primary/20")
                : "bg-white text-text-muted/30 border border-surface-border"
        )}>
            <Icon className="w-6 h-6" />
        </div>
        <span className={clsx(
            "text-[10px] font-bold uppercase tracking-widest",
            active ? "text-text-main" : "text-text-muted/30"
        )}>{label}</span>
    </div>
);

export default Playground;

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    BarChart3,
    Terminal,
    Settings,
    History,
    ShieldCheck,
    Zap,
    LayoutDashboard
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { name: 'Overview', icon: LayoutDashboard, path: '/' },
    { name: 'API Playground', icon: Terminal, path: '/playground' },
    { name: 'Simulation', icon: BarChart3, path: '/simulation' },
    { name: 'Rules Engine', icon: ShieldCheck, path: '/rules' },
    { name: 'History', icon: History, path: '/history' },
];

export function Sidebar() {
    return (
        <div className="w-64 border-r border-surface-border bg-white h-screen flex flex-col sticky top-0">
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Zap className="text-white w-5 h-5" />
                </div>
                <span className="font-bold text-xl tracking-tight">TaxFlow</span>
            </div>

            <nav className="flex-1 px-4 space-y-1 mt-4">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                            isActive
                                ? "bg-primary/5 text-primary"
                                : "text-text-muted hover:bg-surface-bg hover:text-text-main"
                        )}
                    >
                        <item.icon className={cn(
                            "w-5 h-5 transition-colors",
                            "group-hover:text-primary/70"
                        )} />
                        {item.name}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-surface-border">
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-bg/50">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                        DEV
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-semibold truncate">Standard Sandbox</p>
                        <p className="text-[10px] text-text-muted truncate">tax_9k2...f3m</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function Layout({ children }) {
    return (
        <div className="flex min-h-screen bg-surface-bg">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <header className="h-16 border-b border-surface-border bg-white flex items-center justify-between px-8 sticky top-0 z-10">
                    <h2 className="text-lg font-semibold">Dashboard</h2>
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1 bg-success/10 border border-success/20 rounded-full flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                            <span className="text-[10px] font-bold text-success uppercase tracking-widest">Live Engine</span>
                        </div>
                    </div>
                </header>
                <div className="p-8 max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}

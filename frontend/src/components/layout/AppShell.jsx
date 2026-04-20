import { Zap, LayoutDashboard, Receipt, Shield, Sliders, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

import logo from '../../assets/logo.png';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Transactions', icon: Receipt, path: '/transactions' },
  { name: 'Rules', icon: Shield, path: '/rules' },
  { name: 'Simulator', icon: Sliders, path: '/simulate' },
  { name: 'Settings', icon: SettingsIcon, path: '/settings' },
];

export function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="w-64 border-r border-slate-200 bg-white h-screen flex flex-col sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <img src={logo} alt="TaxFlow" className="w-8 h-8 rounded-lg" />
        <span className="font-bold text-xl text-slate-900">TaxFlow</span>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-[#534AB7]/10 text-[#534AB7]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}

export function Topbar() {
  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 sticky top-0 z-10">
      <h2 className="text-lg font-semibold text-slate-900">Overview</h2>
      <div className="flex items-center gap-4">
        <div className="px-3 py-1 bg-emerald-100 border border-emerald-200 rounded-full flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Live</span>
        </div>
      </div>
    </header>
  );
}

export default function AppShell({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Topbar />
        <div className="p-8 max-w-7xl mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}

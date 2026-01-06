import { NavLink } from 'react-router-dom';
import { Home, Users, BarChart3, Bot, Plug, Settings, X, Activity, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Logo } from '../ui/Logo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', to: '/dashboard', icon: Home },
  { name: 'Leads', to: '/leads', icon: Users },
  { name: 'Site Visits', to: '/site-visits', icon: Calendar },
  { name: 'Analytics', to: '/analytics', icon: BarChart3 },
  { name: 'Call Analytics', to: '/call-analytics', icon: Activity },
  { name: 'Agents', to: '/agents', icon: Bot },
  { name: 'Integrations', to: '/integrations', icon: Plug },
  { name: 'Settings', to: '/settings', icon: Settings },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 transition-transform lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Logo variant="icon" className="w-8 h-8" />
            <span className="text-xl font-bold text-slate-900">ORAH</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 hover:bg-slate-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              onClick={() => onClose()}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

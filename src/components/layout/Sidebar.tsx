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
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-200"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-60 bg-white border-r border-slate-200/60 transition-transform duration-200 ease-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-14 px-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Logo variant="icon" className="w-7 h-7" />
            <span className="text-base font-semibold text-slate-900">ORAH</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <nav className="p-3 space-y-0.5">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              onClick={() => onClose()}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

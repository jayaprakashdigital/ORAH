import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, LogOut, User as UserIcon, ChevronRight, Settings } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/leads': 'Leads',
  '/site-visits': 'Site Visits',
  '/analytics': 'Analytics',
  '/call-analytics': 'Call Analytics',
  '/agents': 'Agents',
  '/integrations': 'Integrations',
  '/settings': 'Settings',
};

export function Header({ onMenuClick }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/leads/') && path !== '/leads') {
      return 'Lead Details';
    }
    return routeTitles[path] || 'Dashboard';
  };

  const getBreadcrumbs = () => {
    const path = location.pathname;
    const crumbs: { label: string; path?: string }[] = [];

    if (path.startsWith('/leads/') && path !== '/leads') {
      crumbs.push({ label: 'Leads', path: '/leads' });
      crumbs.push({ label: 'Lead Details' });
    } else {
      crumbs.push({ label: getPageTitle() });
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
        <nav className="flex items-center">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <ChevronRight className="w-4 h-4 text-slate-400 mx-2" />}
              {crumb.path ? (
                <button
                  onClick={() => navigate(crumb.path!)}
                  className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                >
                  {crumb.label}
                </button>
              ) : (
                <h1 className="text-xl font-semibold text-slate-900">{crumb.label}</h1>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-slate-900">{profile?.name || 'User'}</p>
          <p className="text-xs text-slate-500">{user?.email}</p>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium hover:bg-blue-700 transition-colors"
          >
            {profile?.name?.charAt(0).toUpperCase() || 'U'}
          </button>

          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-20">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-900">{profile?.name || 'User'}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <UserIcon className="w-4 h-4" />
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                </div>
                <div className="border-t border-slate-100 py-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

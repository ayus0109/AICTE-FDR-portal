import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  CheckSquare,
  RefreshCw,
  ArrowUpRight,
  Building,
  Bell,
  BarChart3,
  Users,
  ShieldAlert,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

interface NavItem {
  to: string;
  label: string;
  icon: any;
  badge?: number;
}

export const Sidebar: React.FC = () => {
  const { role } = useAuth();
  const { unreadCount } = useNotifications();

  // Navigation items based on role
  const getNavLinks = (): NavItem[] => {
    const dashboardLink: NavItem =
      role === 'COLLEGE_USER'
        ? { to: '/college/dashboard', label: 'College Dashboard', icon: LayoutDashboard }
        : role === 'AICTE_OFFICER'
        ? { to: '/officer/dashboard', label: 'Officer Dashboard', icon: LayoutDashboard }
        : { to: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard };

    const links: NavItem[] = [
      dashboardLink,
      { to: '/fdrs', label: 'FDR Repository', icon: FileText },
    ];

    if (role === 'COLLEGE_USER' || role === 'ADMIN') {
      links.push({ to: '/fdrs/new', label: 'Submit New FDR', icon: PlusCircle });
    }

    if (role === 'AICTE_OFFICER' || role === 'ADMIN') {
      links.push({ to: '/officer/queue', label: 'Scrutiny Queue', icon: CheckSquare });
    }

    links.push(
      { to: '/renewals', label: 'Renewals & Replace', icon: RefreshCw },
      { to: '/releases', label: 'Release / Refunds', icon: ArrowUpRight },
      { to: '/institution/profile', label: 'Institution Profile', icon: Building },
      { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
      { to: '/reports', label: 'Reports & Analytics', icon: BarChart3 }
    );

    if (role === 'ADMIN') {
      links.push({ to: '/admin/users', label: 'User Management', icon: Users });
    }

    if (role === 'AICTE_OFFICER' || role === 'ADMIN') {
      links.push({ to: '/admin/audit', label: 'Audit Trail', icon: ShieldAlert });
    }

    links.push({ to: '/settings', label: 'Settings & Cloud', icon: Settings });

    return links;
  };

  const navLinks = getNavLinks();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-68px)]">
      {/* Role Context Pill in Sidebar */}
      <div className="p-4 border-b border-slate-800">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Active Environment
        </div>
        <div className="flex items-center justify-between bg-slate-800/80 p-2 rounded-md border border-slate-700/60">
          <span className="text-xs font-medium text-slate-200">
            {role === 'COLLEGE_USER' ? 'Technical Institute' : role === 'AICTE_OFFICER' ? 'AICTE Scrutiny' : 'System Governance'}
          </span>
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-aicte-navy-700 text-white font-semibold shadow-sm border-l-4 border-aicte-saffron-400 pl-2'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-white" />
                <span>{item.label}</span>
              </div>
              {item.badge && item.badge > 0 ? (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Footer Notice */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
          <HelpCircle className="h-3.5 w-3.5 text-aicte-saffron-400" />
          <span>Need Assistance?</span>
        </div>
        <p className="text-[10px] text-slate-400">
          AICTE ICT Helpdesk: fdr-support@aicte-india.org
        </p>
      </div>
    </aside>
  );
};

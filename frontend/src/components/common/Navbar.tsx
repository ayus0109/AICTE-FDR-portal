import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  Building2,
  ChevronDown,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { UserRole } from '../../types';

export const Navbar: React.FC = () => {
  const { user, role, logout, loginAsDemo } = useAuth();
  const { unreadCount, notifications, markAsRead } = useNotifications();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const navigate = useNavigate();

  const handlePersonaSwitch = async (targetRole: UserRole) => {
    setShowPersonaMenu(false);
    await loginAsDemo(targetRole);
    if (targetRole === 'COLLEGE_USER') navigate('/college/dashboard');
    else if (targetRole === 'AICTE_OFFICER') navigate('/officer/dashboard');
    else navigate('/admin/dashboard');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* Top subtle tricolor accent line */}
      <div className="h-1 w-full bg-gradient-to-r from-aicte-saffron via-white to-emerald-600" />

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Brand Identity */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-aicte-navy-900 flex items-center justify-center text-white font-bold text-lg shadow-sm border border-aicte-navy-700">
                <ShieldCheck className="h-6 w-6 text-aicte-saffron-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-aicte-navy-950 tracking-tight">AICTE FDR PORTAL</span>
                  <span className="text-[10px] font-semibold bg-aicte-saffron-100 text-aicte-saffron-700 px-1.5 py-0.5 rounded border border-aicte-saffron-200">
                    PROTOTYPE
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Security Deposit & Fixed Deposit Lifecycle System • MoE, Govt. of India
                </p>
              </div>
            </Link>
          </div>

          {/* Right Navigation & Tools */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Quick Persona Switcher for Hackathon Demonstrator */}
            <div className="relative">
              <button
                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors"
                title="Switch Demo Persona"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                <span className="hidden md:inline font-semibold">Demo Persona:</span>
                <span className="font-bold">
                  {role === 'COLLEGE_USER' ? 'College' : role === 'AICTE_OFFICER' ? 'AICTE Officer' : 'Admin'}
                </span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              {showPersonaMenu && (
                <div className="absolute right-0 mt-2 w-72 rounded-lg bg-white shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Switch Hackathon Role
                  </div>
                  <button
                    onClick={() => handlePersonaSwitch('COLLEGE_USER')}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${role === 'COLLEGE_USER' ? 'bg-amber-50/70 font-semibold text-amber-900' : 'text-slate-700'}`}
                  >
                    <div>
                      <div className="font-medium">1. College User</div>
                      <div className="text-[11px] text-slate-500">Delhi Institute of Tech</div>
                    </div>
                    {role === 'COLLEGE_USER' && <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 rounded">Active</span>}
                  </button>
                  <button
                    onClick={() => handlePersonaSwitch('AICTE_OFFICER')}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${role === 'AICTE_OFFICER' ? 'bg-amber-50/70 font-semibold text-amber-900' : 'text-slate-700'}`}
                  >
                    <div>
                      <div className="font-medium">2. AICTE Scrutiny Officer</div>
                      <div className="text-[11px] text-slate-500">Document Review & Decisions</div>
                    </div>
                    {role === 'AICTE_OFFICER' && <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 rounded">Active</span>}
                  </button>
                  <button
                    onClick={() => handlePersonaSwitch('ADMIN')}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${role === 'ADMIN' ? 'bg-amber-50/70 font-semibold text-amber-900' : 'text-slate-700'}`}
                  >
                    <div>
                      <div className="font-medium">3. System Administrator</div>
                      <div className="text-[11px] text-slate-500">Audit, Health & Reminders</div>
                    </div>
                    {role === 'ADMIN' && <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 rounded">Active</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Institution Badge if College */}
            {user?.institution_name && (
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                <Building2 className="h-3.5 w-3.5 text-slate-500" />
                <span className="font-medium max-w-[200px] truncate">{user.institution_name}</span>
              </div>
            )}

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white shadow-2xl border border-slate-200 py-2 z-50">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                    <span className="font-semibold text-sm text-slate-800">Notifications ({unreadCount} unread)</span>
                    <Link
                      to="/notifications"
                      onClick={() => setShowNotifMenu(false)}
                      className="text-xs text-aicte-navy-700 hover:underline font-medium"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">No notifications yet.</div>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markAsRead(n.id);
                            setShowNotifMenu(false);
                            if (n.fdr_id) navigate(`/fdrs/${n.fdr_id}`);
                          }}
                          className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-semibold text-slate-900">{n.subject}</span>
                            {!n.is_read && <span className="h-2 w-2 rounded-full bg-blue-600 mt-1" />}
                          </div>
                          <p className="text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.created_at).toLocaleDateString()} • {n.delivery_provider}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-700"
              >
                <div className="h-8 w-8 rounded-full bg-aicte-navy-800 text-white flex items-center justify-center font-bold text-xs">
                  {user?.name ? user.name.charAt(0) : 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">{user?.name}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{role?.replace('_', ' ')}</div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white shadow-xl border border-slate-200 py-1.5 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <Layers className="h-4 w-4 text-slate-400" />
                    <span>Settings & Cloud Status</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 text-left"
                  >
                    <LogOut className="h-4 w-4 text-red-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

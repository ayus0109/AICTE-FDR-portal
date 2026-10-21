import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { Menu, X, ChevronRight, Home } from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  // Generate breadcrumb items from path
  const pathParts = location.pathname.split('/').filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex-1 flex">
        {/* Desktop Persistent Left Sidebar */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>

        {/* Mobile Slide-over Sidebar */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full text-white"
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <Sidebar />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Bar with Mobile Toggle and Breadcrumbs */}
          <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="md:hidden text-slate-600 hover:text-slate-900 focus:outline-none"
                onClick={() => setMobileSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Breadcrumb Trail */}
              <nav className="flex items-center space-x-1.5 text-xs text-slate-500">
                <Link to="/" className="hover:text-slate-800 flex items-center gap-1">
                  <Home className="h-3.5 w-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Home</span>
                </Link>
                {pathParts.map((part, index) => {
                  const to = `/${pathParts.slice(0, index + 1).join('/')}`;
                  const isLast = index === pathParts.length - 1;
                  const formatted = part.replace(/-/g, ' ').toUpperCase();

                  return (
                    <React.Fragment key={to}>
                      <ChevronRight className="h-3 w-3 text-slate-400" />
                      {isLast ? (
                        <span className="font-semibold text-slate-800 truncate max-w-[150px]">{formatted}</span>
                      ) : (
                        <Link to={to} className="hover:text-slate-800 truncate max-w-[150px]">
                          {formatted}
                        </Link>
                      )}
                    </React.Fragment>
                  );
                })}
              </nav>
            </div>

            {/* Top right statutory info */}
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Central FDR Registry Secure Node</span>
            </div>
          </div>

          {/* Page Content Container */}
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

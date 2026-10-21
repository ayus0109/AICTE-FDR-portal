import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Building2,
  FileText,
  Filter,
  CheckCircle2,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { api, API_BASE } from '../services/api';

const COLORS = ['#0A2540', '#F58220', '#10B981', '#EF4444', '#6366F1', '#8B5CF6'];

export const ReportsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const data = await api.get('/reports/analytics');
        setAnalytics(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const handleDownloadCsv = () => {
    const token = localStorage.getItem('aicte_token');
    window.open(`${API_BASE}/reports/export/fdrs.csv?token=${token}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-4 border-aicte-navy-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-aicte-navy-700 uppercase tracking-wider mb-1">
            <BarChart3 className="h-4 w-4" />
            <span>Compliance Intelligence & Reports</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Statutory Reports & Portfolio Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregate institutional compliance charts, bank exposure, and CSV exports.
          </p>
        </div>

        <button
          onClick={handleDownloadCsv}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-aicte-navy-900 hover:bg-aicte-navy-800 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Download className="h-4 w-4" />
          <span>Export Complete FDR Register (.CSV)</span>
        </button>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Maturity Time Horizon */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            Maturity Time Horizon Analysis
          </h3>
          <p className="text-[11px] text-slate-500 mb-4">
            Security deposits segmented by upcoming maturity windows for advance notification planning.
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.maturity_timeline || []} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0A2540" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            Administrative Workflow Composition
          </h3>
          <p className="text-[11px] text-slate-500 mb-4">
            Proportion of verified vs pending scrutiny cases.
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.status_distribution || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(analytics?.status_distribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bank Exposure Analysis */}
        <div className="lg:col-span-12 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            Institutional Bank Exposure (Deposit Volume in INR)
          </h3>
          <p className="text-[11px] text-slate-500 mb-4">
            Total custody volume held across scheduled commercial and nationalized banks.
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.bank_distribution || []} margin={{ top: 10, right: 10, left: 30, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="bank" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`} />
                <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Deposit Volume']} />
                <Bar dataKey="amount" fill="#F58220" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

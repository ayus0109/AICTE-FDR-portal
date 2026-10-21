import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  AlertTriangle,
  Clock,
  Building2,
  FileText,
  Search,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  ExternalLink
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
import { api } from '../services/api';
import { OfficerDashboardStats, FDRRecord } from '../types';
import { StatusBadge } from '../components/common/Badge';

const COLORS = ['#0A2540', '#F58220', '#10B981', '#EF4444', '#6366F1', '#8B5CF6'];

export const OfficerDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<OfficerDashboardStats | null>(null);
  const [pendingQueue, setPendingQueue] = useState<FDRRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOfficerDashboard = async () => {
      try {
        setIsLoading(true);
        const [statsData, queueData] = await Promise.all([
          api.get<OfficerDashboardStats>('/dashboard/officer'),
          api.get<FDRRecord[]>('/fdrs?status=SUBMITTED&limit=6')
        ]);
        setStats(statsData);
        setPendingQueue(queueData);
      } catch (err) {
        console.error('Error loading officer dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOfficerDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 border-4 border-blue-800 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading AICTE Scrutiny Workload...</p>
        </div>
      </div>
    );
  }

  const workloadChart = stats ? [
    { name: 'Pending Scrutiny', count: stats.pending_scrutiny },
    { name: 'Discrepancy Cases', count: stats.discrepancy_cases },
    { name: 'Upcoming 30d', count: stats.upcoming_maturities },
    { name: 'Matured Overdue', count: stats.matured_unresolved },
    { name: 'Renewals Pending', count: stats.renewals_awaiting_review },
    { name: 'Release Requests', count: stats.pending_release_requests },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Officer Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span>AICTE Approval & Compliance Bureau</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Scrutiny Officer Command Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review FDR submissions, document scrutiny, discrepancy detection, and authorized releases.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/officer/queue"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <CheckSquare className="h-4 w-4" />
            <span>Open Scrutiny Queue</span>
          </Link>
          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all"
          >
            <span>Compliance Reports</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Pending Scrutiny */}
        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm bg-gradient-to-br from-white to-blue-50/40">
          <div className="flex items-center justify-between text-blue-700 text-xs font-medium">
            <span>Pending Scrutiny</span>
            <CheckSquare className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-950 mt-2">
            {stats?.pending_scrutiny || 0}
          </div>
          <div className="text-[11px] text-blue-700 mt-1">New submissions awaiting review</div>
        </div>

        {/* Discrepancy Cases */}
        <div className="bg-white p-4 rounded-xl border border-orange-200 shadow-sm bg-gradient-to-br from-white to-orange-50/30">
          <div className="flex items-center justify-between text-orange-700 text-xs font-medium">
            <span>Discrepancy Cases</span>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-orange-900 mt-2">
            {stats?.discrepancy_cases || 0}
          </div>
          <div className="text-[11px] text-orange-700 mt-1">Requires official follow-up</div>
        </div>

        {/* Matured Overdue */}
        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm bg-gradient-to-br from-white to-red-50/30">
          <div className="flex items-center justify-between text-red-700 text-xs font-medium">
            <span>Matured Overdue</span>
            <Clock className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-900 mt-2">
            {stats?.matured_unresolved || 0}
          </div>
          <div className="text-[11px] text-red-700 mt-1">Expired lien lock-in</div>
        </div>

        {/* Total Institutions */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Institutions</span>
            <Building2 className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {stats?.total_institutions || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Total ₹{(stats?.total_portfolio_amount || 0).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Upcoming Maturities</span>
          <div className="text-xl font-bold text-amber-700 mt-1">
            {stats?.upcoming_maturities || 0}
          </div>
          <span className="text-[11px] text-slate-400">Within 30 calendar days</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Renewals for Review</span>
          <div className="text-xl font-bold text-indigo-700 mt-1">
            {stats?.renewals_awaiting_review || 0}
          </div>
          <span className="text-[11px] text-slate-400">Replacement instruments</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Pending Release Requests</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {stats?.pending_release_requests || 0}
          </div>
          <span className="text-[11px] text-slate-400">Refund scrutiny queue</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Total FDR Records</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {stats?.total_fdrs || 0}
          </div>
          <span className="text-[11px] text-slate-400">Active repository instruments</span>
        </div>
      </div>

      {/* Charts & Pending Review Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Workload Bar Chart */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            Officer Scrutiny Workload
          </h3>
          <p className="text-[11px] text-slate-500 mb-4">Real-time action items requiring scrutiny</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadChart} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1E3A8A" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Scrutiny Queue Table */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Priority Scrutiny Queue
              </h3>
              <p className="text-[11px] text-slate-500">Submissions awaiting official decision</p>
            </div>
            <Link to="/officer/queue" className="text-xs font-semibold text-blue-700 hover:underline">
              View Complete Queue →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Institution</th>
                  <th className="py-2.5 px-3 font-semibold">FDR Ref #</th>
                  <th className="py-2.5 px-3 font-semibold">Amount</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Scrutiny Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingQueue.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No pending submissions in queue. All records scrutinized.
                    </td>
                  </tr>
                ) : (
                  pendingQueue.map((fdr) => (
                    <tr key={fdr.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 truncate max-w-[180px]">
                          {fdr.institution_name}
                        </div>
                        <div className="text-[10px] text-slate-400">{fdr.aicte_code}</div>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">{fdr.fdr_number}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">₹{fdr.amount.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3">
                        <StatusBadge status={fdr.administrative_status} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          to={`/officer/review/${fdr.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 transition-colors shadow-sm"
                        >
                          <CheckSquare className="h-3.5 w-3.5" />
                          <span>Scrutinize</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

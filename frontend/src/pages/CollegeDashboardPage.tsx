import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  ArrowUpRight,
  TrendingUp,
  PlusCircle,
  Eye,
  Building2,
  Calendar
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CollegeDashboardStats, FDRRecord } from '../types';
import { StatusBadge } from '../components/common/Badge';

const COLORS = ['#0A2540', '#F58220', '#10B981', '#EF4444', '#6366F1', '#F59E0B'];

export const CollegeDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<CollegeDashboardStats | null>(null);
  const [recentFdrs, setRecentFdrs] = useState<FDRRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const [statsData, fdrsData] = await Promise.all([
          api.get<CollegeDashboardStats>('/dashboard/college'),
          api.get<FDRRecord[]>('/fdrs?limit=5')
        ]);
        setStats(statsData);
        setRecentFdrs(fdrsData);
      } catch (err) {
        console.error('Error loading college dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const chartData = stats ? [
    { name: 'Active', value: stats.active_fdrs },
    { name: 'Approaching', value: stats.approaching_maturity },
    { name: 'Matured', value: stats.matured },
    { name: 'Under Review', value: stats.under_verification },
    { name: 'Clarification', value: stats.clarification_required },
  ].filter(d => d.value > 0) : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 border-4 border-aicte-navy-800 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading College Portfolio Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <Building2 className="h-4 w-4 text-aicte-navy-700" />
            <span>{user?.institution_name || 'Technical Institute'}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Institutional Security Deposit Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time compliance monitoring, FDR maturities, and scrutiny resolution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/fdrs/new"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-aicte-navy-900 hover:bg-aicte-navy-800 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Submit New FDR</span>
          </Link>
          <Link
            to="/releases"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all"
          >
            <ArrowUpRight className="h-4 w-4 text-slate-500" />
            <span>Release Requests</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Portfolio Value */}
        <div className="col-span-2 sm:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Deposit Value</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            ₹{(stats?.total_deposit_amount || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across {stats?.total_fdrs || 0} registered instruments
          </div>
        </div>

        {/* Approaching Maturity */}
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm bg-gradient-to-br from-white to-amber-50/30">
          <div className="flex items-center justify-between text-amber-700 text-xs font-medium">
            <span>Approaching Maturity</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-2">
            {stats?.approaching_maturity || 0}
          </div>
          <div className="text-[11px] text-amber-700 mt-1">Due within 30 days</div>
        </div>

        {/* Matured Records */}
        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm bg-gradient-to-br from-white to-red-50/30">
          <div className="flex items-center justify-between text-red-700 text-xs font-medium">
            <span>Matured (Overdue)</span>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-900 mt-2">
            {stats?.matured || 0}
          </div>
          <div className="text-[11px] text-red-700 mt-1">Action required immediately</div>
        </div>

        {/* Under Verification */}
        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between text-blue-700 text-xs font-medium">
            <span>Under Scrutiny</span>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-900 mt-2">
            {stats?.under_verification || 0}
          </div>
          <div className="text-[11px] text-blue-700 mt-1">With AICTE officers</div>
        </div>
      </div>

      {/* Second Row KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Clarification Required</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {stats?.clarification_required || 0}
          </div>
          <span className="text-[11px] text-slate-400">Needs revised documents</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Renewals in Progress</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {stats?.renewals_in_progress || 0}
          </div>
          <span className="text-[11px] text-slate-400">Pending officer approval</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Pending Release</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {stats?.pending_release_requests || 0}
          </div>
          <span className="text-[11px] text-slate-400">Refund workflow</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Active & Valid FDRs</span>
          <div className="text-xl font-bold text-emerald-700 mt-1">
            {stats?.active_fdrs || 0}
          </div>
          <span className="text-[11px] text-slate-400">Fully compliant</span>
        </div>
      </div>

      {/* Visual Analytics & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Status Distribution Chart */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            Portfolio Status Breakdown
          </h3>
          <p className="text-[11px] text-slate-500 mb-4">Live distribution of registered security deposits</p>
          <div className="h-64 flex items-center justify-center">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400">No active data to plot</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {chartData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span>{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Submissions Table */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Recent FDR Records
              </h3>
              <p className="text-[11px] text-slate-500">Latest deposits submitted for this institution</p>
            </div>
            <Link to="/fdrs" className="text-xs font-semibold text-aicte-navy-700 hover:underline">
              View All FDRs →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">FDR Number</th>
                  <th className="py-2.5 px-3 font-semibold">Bank</th>
                  <th className="py-2.5 px-3 font-semibold">Amount (INR)</th>
                  <th className="py-2.5 px-3 font-semibold">Maturity</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentFdrs.map((fdr) => (
                  <tr key={fdr.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-medium text-slate-900">{fdr.fdr_number}</td>
                    <td className="py-3 px-3 text-slate-600">{fdr.bank_name}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">₹{fdr.amount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3">
                      <div className="text-slate-700">{new Date(fdr.maturity_date).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">
                        {fdr.days_to_maturity !== undefined
                          ? fdr.days_to_maturity < 0
                            ? `${Math.abs(fdr.days_to_maturity)}d overdue`
                            : `${fdr.days_to_maturity}d left`
                          : ''}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={fdr.administrative_status} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/fdrs/${fdr.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-aicte-navy-800 hover:underline"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Details</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Server,
  Users,
  Building2,
  FileText,
  Activity,
  Play,
  CheckCircle2,
  Layers,
  ArrowRight
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
import { AdminDashboardStats, AuditLogItem } from '../types';

const COLORS = ['#6B21A8', '#0A2540', '#F58220', '#10B981', '#EF4444', '#3B82F6'];

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [recentAudits, setRecentAudits] = useState<AuditLogItem[]>([]);
  const [isTriggeringJob, setIsTriggeringJob] = useState(false);
  const [jobFeedback, setJobFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminDashboard = async () => {
    try {
      setIsLoading(true);
      const [statsData, auditsData] = await Promise.all([
        api.get<AdminDashboardStats>('/dashboard/admin'),
        api.get<AuditLogItem[]>('/audit?limit=6')
      ]);
      setStats(statsData);
      setRecentAudits(auditsData);
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminDashboard();
  }, []);

  const handleRunMaturityJob = async () => {
    setIsTriggeringJob(true);
    setJobFeedback(null);
    try {
      const res: any = await api.post('/jobs/maturity-check');
      setJobFeedback(
        `Job Completed: ${res.total_checked} checked, ${res.reminders_sent} reminders dispatched (0 duplicates created).`
      );
      await fetchAdminDashboard();
    } catch (e: any) {
      setJobFeedback(`Error triggering job: ${e.message}`);
    } finally {
      setIsTriggeringJob(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 border-4 border-purple-800 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading Administrative Governance Telemetry...</p>
        </div>
      </div>
    );
  }

  const statusChartData = stats?.status_distribution
    ? Object.entries(stats.status_distribution).map(([k, v]) => ({ name: k, value: v }))
    : [];

  const bankChartData = stats?.bank_distribution
    ? Object.entries(stats.bank_distribution).map(([k, v]) => ({ bank: k, count: v }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wider mb-1">
            <Server className="h-4 w-4" />
            <span>AICTE System Governance & Infrastructure Management</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Administrator Governance Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            System health, security audit monitoring, user access control, and automated scheduler telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-purple-900 hover:bg-purple-800 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Users className="h-4 w-4" />
            <span>Manage Users</span>
          </Link>
          <Link
            to="/admin/audit"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all"
          >
            <ShieldAlert className="h-4 w-4 text-slate-500" />
            <span>Audit Trail</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm bg-gradient-to-br from-white to-purple-50/30">
          <div className="flex items-center justify-between text-purple-700 text-xs font-medium">
            <span>Registered Institutions</span>
            <Building2 className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-950 mt-2">
            {stats?.total_institutions || 0}
          </div>
          <div className="text-[11px] text-purple-700 mt-1">Multi-tenant isolation active</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Authorized Users</span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {stats?.total_users || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Colleges & AICTE Officers</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total FDRs Under Custody</span>
            <FileText className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {stats?.total_fdrs || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Total ₹{(stats?.total_amount || 0).toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm bg-gradient-to-br from-white to-emerald-50/30">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-medium">
            <span>System Health</span>
            <Activity className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-sm font-bold text-emerald-900 mt-2">
            ONLINE
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">FastAPI • SQLite / Postgres • Local / S3</div>
        </div>
      </div>

      {/* Automated Scheduler Trigger Box */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                EventBridge / Lambda Scheduled Maturity Monitor
              </h3>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Evaluates upcoming maturities at configured reminder intervals (30, 15, 7, 0 days, and overdue). Guaranteed idempotent with zero duplicate notifications.
            </p>
          </div>

          <button
            onClick={handleRunMaturityJob}
            disabled={isTriggeringJob}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 shrink-0"
          >
            <Play className="h-3.5 w-3.5 fill-white" />
            <span>{isTriggeringJob ? 'Executing Job...' : 'Execute Scheduled Job Now'}</span>
          </button>
        </div>

        {jobFeedback && (
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{jobFeedback}</span>
          </div>
        )}
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            Overall Workflow Status Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            Bank Distribution of Fixed Deposits
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bankChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="bank" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#6B21A8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Audit Events */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Recent System Audit Events
            </h3>
            <p className="text-[11px] text-slate-500">Security and administrative change traceability</p>
          </div>
          <Link to="/admin/audit" className="text-xs font-semibold text-purple-700 hover:underline">
            View All Audit Logs →
          </Link>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {recentAudits.map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">{log.action}</span>
                <span className="text-slate-500 ml-2">by {log.actor_email}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {new Date(log.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

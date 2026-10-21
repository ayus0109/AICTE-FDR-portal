import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { AuditLogItem } from '../types';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (actionFilter) params.set('action', actionFilter);
      const data = await api.get<AuditLogItem[]>(`/audit?${params.toString()}`);
      setLogs(data);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            <ShieldAlert className="h-4 w-4 text-purple-700" />
            <span>Administrative Traceability & Security</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">System Audit Trail & Event Logs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable chronological record of administrative scrutiny determinations, logins, and submissions.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none"
          >
            <option value="">All Action Types</option>
            <option value="LOGIN">User Logins</option>
            <option value="CREATE_FDR">FDR Creation</option>
            <option value="VERIFY_FDR">Scrutiny Verifications</option>
            <option value="SUBMIT_RENEWAL">Renewal Filings</option>
            <option value="REQUEST_FDR_RELEASE">Release Requests</option>
            <option value="RUN_MATURITY_MONITORING_JOB">Scheduled Jobs</option>
            <option value="CREATE_USER">User Provisioning</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <ShieldAlert className="h-8 w-8 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-700">No Audit Events Recorded for this Filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Actor / User</th>
                  <th className="py-3 px-4 font-semibold">Action Performed</th>
                  <th className="py-3 px-4 font-semibold">Entity Type</th>
                  <th className="py-3 px-4 font-semibold">Entity ID</th>
                  <th className="py-3 px-4 font-semibold">Result</th>
                  <th className="py-3 px-4 font-semibold text-right">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 text-slate-500 font-sans">
                      {new Date(log.created_at).toLocaleString()}
                    </td>

                    <td className="py-2.5 px-4 text-slate-800 font-sans">
                      {log.actor_email}
                    </td>

                    <td className="py-2.5 px-4 font-bold text-slate-900 font-sans">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-2.5 px-4 text-slate-600 font-sans">{log.entity_type}</td>

                    <td className="py-2.5 px-4 text-slate-600">{log.entity_id || '—'}</td>

                    <td className="py-2.5 px-4 font-sans">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          log.result === 'SUCCESS' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
                        }`}
                      >
                        {log.result}
                      </span>
                    </td>

                    <td className="py-2.5 px-4 text-right font-sans">
                      {log.metadata_json ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-xs text-aicte-navy-700 hover:underline font-semibold"
                        >
                          View Details
                        </button>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Audit Metadata Payload</h3>
                <p className="text-xs text-slate-500">Action: {selectedLog.action} • ID: {selectedLog.id}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>

            <div className="bg-slate-900 text-emerald-400 p-4 rounded-lg font-mono text-xs overflow-x-auto max-h-72">
              <pre>{JSON.stringify(selectedLog.metadata_json, null, 2)}</pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

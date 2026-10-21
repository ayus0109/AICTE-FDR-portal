import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  PlusCircle,
  Eye,
  CheckSquare,
  FileText,
  Calendar,
  Building2,
  RefreshCw
} from 'lucide-react';
import { api, API_BASE } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FDRRecord } from '../types';
import { StatusBadge } from '../components/common/Badge';

export const FDRListPage: React.FC = () => {
  const { role } = useAuth();
  const location = useLocation();
  const isQueueMode = location.pathname.includes('/queue');

  const [fdrs, setFdrs] = useState<FDRRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(isQueueMode ? 'SUBMITTED' : 'ALL');
  const [maturityFilter, setMaturityFilter] = useState('ALL');
  const [bankFilter, setBankFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchFdrs = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (maturityFilter !== 'ALL') params.set('maturity_status', maturityFilter);
      if (bankFilter !== 'ALL') params.set('bank', bankFilter);

      const data = await api.get<FDRRecord[]>(`/fdrs?${params.toString()}`);
      setFdrs(data);
    } catch (err) {
      console.error('Error fetching FDRs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFdrs();
  }, [statusFilter, maturityFilter, bankFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFdrs();
  };

  const handleExportCsv = () => {
    const token = localStorage.getItem('aicte_token');
    window.open(`${API_BASE}/reports/export/fdrs.csv?token=${token}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-aicte-navy-700 uppercase tracking-wider mb-1">
            <FileText className="h-4 w-4" />
            <span>Central Fixed Deposit Register</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {isQueueMode ? 'AICTE Officer Scrutiny Queue' : 'Fixed Deposit Receipts (FDR) Repository'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isQueueMode
              ? 'Submissions currently awaiting officer scrutiny, document inspection and verification decision.'
              : 'Complete repository of security deposits and compliance instruments.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          {(role === 'COLLEGE_USER' || role === 'ADMIN') && (
            <Link
              to="/fdrs/new"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-aicte-navy-900 hover:bg-aicte-navy-800 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Submit New FDR</span>
            </Link>
          )}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by FDR Number, Bank, Branch, or Institution Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-aicte-navy-700"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-900 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter By:</span>
          </div>

          {/* Administrative Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-slate-300 text-slate-700 bg-white focus:outline-none"
          >
            <option value="ALL">All Administrative Statuses</option>
            <option value="SUBMITTED">Submitted (Pending Review)</option>
            <option value="UNDER_REVIEW">Under Scrutiny</option>
            <option value="VERIFIED">Verified</option>
            <option value="CLARIFICATION_REQUIRED">Clarification Required</option>
            <option value="DISCREPANCY_DETECTED">Discrepancy Detected</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Maturity Status Filter */}
          <select
            value={maturityFilter}
            onChange={(e) => setMaturityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-slate-300 text-slate-700 bg-white focus:outline-none"
          >
            <option value="ALL">All Maturity Statuses</option>
            <option value="ACTIVE">Active (Valid)</option>
            <option value="APPROACHING_MATURITY">Approaching Maturity (&lt; 30d)</option>
            <option value="MATURED">Matured (Expired Lien)</option>
          </select>

          {/* Bank Filter */}
          <select
            value={bankFilter}
            onChange={(e) => setBankFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-slate-300 text-slate-700 bg-white focus:outline-none"
          >
            <option value="ALL">All Banks</option>
            <option value="State Bank of India">State Bank of India</option>
            <option value="Punjab National Bank">Punjab National Bank</option>
            <option value="Canara Bank">Canara Bank</option>
            <option value="Bank of Baroda">Bank of Baroda</option>
            <option value="HDFC Bank">HDFC Bank</option>
            <option value="Indian Overseas Bank">Indian Overseas Bank</option>
          </select>

          {(statusFilter !== 'ALL' || maturityFilter !== 'ALL' || bankFilter !== 'ALL' || search) && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setMaturityFilter('ALL');
                setBankFilter('ALL');
                setSearch('');
              }}
              className="text-xs text-aicte-navy-700 hover:underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* FDR Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <div className="h-6 w-6 border-2 border-slate-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading FDR Repository Records...
          </div>
        ) : fdrs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <FileText className="h-8 w-8 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-700">No FDR Records Matched Your Criteria</p>
            <p className="text-slate-400">Try adjusting your search terms or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">FDR Reference</th>
                  {role !== 'COLLEGE_USER' && (
                    <th className="py-3 px-4 font-semibold">Institution</th>
                  )}
                  <th className="py-3 px-4 font-semibold">Bank & Branch</th>
                  <th className="py-3 px-4 font-semibold">Amount (INR)</th>
                  <th className="py-3 px-4 font-semibold">Maturity Date</th>
                  <th className="py-3 px-4 font-semibold">Scrutiny Status</th>
                  <th className="py-3 px-4 font-semibold">Maturity Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fdrs.map((fdr) => (
                  <tr key={fdr.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{fdr.fdr_number}</div>
                      <div className="text-[10px] text-slate-400">{fdr.deposit_type}</div>
                    </td>

                    {role !== 'COLLEGE_USER' && (
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 truncate max-w-[200px]">
                          {fdr.institution_name}
                        </div>
                        <div className="text-[10px] text-slate-400">{fdr.aicte_code}</div>
                      </td>
                    )}

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{fdr.bank_name}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[160px]">{fdr.branch_name}</div>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900">
                      ₹{fdr.amount.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">
                        {new Date(fdr.maturity_date).toLocaleDateString()}
                      </div>
                      <div className="text-[10px]">
                        {fdr.days_to_maturity !== undefined && (
                          <span className={fdr.days_to_maturity < 0 ? 'text-red-600 font-bold' : fdr.days_to_maturity <= 30 ? 'text-amber-600 font-semibold' : 'text-slate-400'}>
                            {fdr.days_to_maturity < 0 ? `${Math.abs(fdr.days_to_maturity)} days overdue` : `${fdr.days_to_maturity} days remaining`}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={fdr.administrative_status} type="admin" />
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={fdr.maturity_status} type="maturity" />
                    </td>

                    <td className="py-3 px-4 text-right space-x-2">
                      <Link
                        to={`/fdrs/${fdr.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        <span>View</span>
                      </Link>

                      {(role === 'AICTE_OFFICER' || role === 'ADMIN') && (
                        <Link
                          to={`/officer/review/${fdr.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs transition-colors shadow-sm"
                        >
                          <CheckSquare className="h-3 w-3" />
                          <span>Scrutinize</span>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  RefreshCw,
  PlusCircle,
  FileText,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Eye
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RenewalRecord, FDRRecord } from '../types';
import { StatusBadge } from '../components/common/Badge';

export const RenewalsPage: React.FC = () => {
  const { role } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedFdrId = searchParams.get('fdr_id');

  const [renewals, setRenewals] = useState<RenewalRecord[]>([]);
  const [eligibleFdrs, setEligibleFdrs] = useState<FDRRecord[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(!!preselectedFdrId);

  // Form state
  const [originalFdrId, setOriginalFdrId] = useState<string>(preselectedFdrId || '');
  const [fdrNumber, setFdrNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [issueDate, setIssueDate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRenewalsData = async () => {
    try {
      setIsLoading(true);
      const [renewalsData, fdrsData] = await Promise.all([
        api.get<RenewalRecord[]>('/renewals'),
        api.get<FDRRecord[]>('/fdrs')
      ]);
      setRenewals(renewalsData);
      setEligibleFdrs(fdrsData);

      if (preselectedFdrId) {
        const found = fdrsData.find(f => f.id === parseInt(preselectedFdrId));
        if (found) {
          setBankName(found.bank_name);
          setBranchName(found.branch_name);
          setAmount(found.amount.toString());
        }
      }
    } catch (err) {
      console.error('Error loading renewals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRenewalsData();
  }, []);

  const handleSelectOriginal = (fdrIdStr: string) => {
    setOriginalFdrId(fdrIdStr);
    const found = eligibleFdrs.find(f => f.id === parseInt(fdrIdStr));
    if (found) {
      setBankName(found.bank_name);
      setBranchName(found.branch_name);
      setAmount(found.amount.toString());
    }
  };

  const handleSubmitRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalFdrId) {
      setError('Please select the original FDR to renew');
      return;
    }
    if (new Date(maturityDate) < new Date(issueDate)) {
      setError('Maturity date cannot be earlier than Issue date');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await api.post('/renewals', {
        original_fdr_id: parseInt(originalFdrId),
        fdr_number: fdrNumber.trim(),
        bank_name: bankName.trim(),
        branch_name: branchName.trim(),
        amount: parseFloat(amount),
        issue_date: issueDate,
        maturity_date: maturityDate,
        deposit_type: 'Security Deposit Renewal',
        remarks: remarks.trim() || 'FDR Renewal instrument submitted',
      });

      setShowSubmitModal(false);
      setOriginalFdrId('');
      setFdrNumber('');
      setRemarks('');
      await fetchRenewalsData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit renewal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-1">
            <RefreshCw className="h-4 w-4" />
            <span>Lifecycle Renewal & Replacement</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Fixed Deposit Renewals & Replacement Chain</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Preserves immutable custody history of expiring deposits linked with new replacement instruments.
          </p>
        </div>

        {role === 'COLLEGE_USER' && (
          <button
            onClick={() => setShowSubmitModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Submit Renewal FDR</span>
          </button>
        )}
      </div>

      {/* Renewals Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading Renewal Records...</div>
        ) : renewals.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <RefreshCw className="h-8 w-8 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-700">No Renewal Records Found</p>
            <p className="text-slate-400">When institutions submit replacement FDRs, their audit lineage will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Original Instrument</th>
                  <th className="py-3 px-4 font-semibold">Replacement Instrument</th>
                  <th className="py-3 px-4 font-semibold">Submission Date</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Remarks</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {renewals.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{r.original_fdr_number}</div>
                      <div className="text-[10px] text-slate-400">Docket #{r.original_fdr_id}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-indigo-900">{r.replacement_fdr_number}</div>
                      <div className="text-[10px] text-slate-400">Docket #{r.replacement_fdr_id}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      {new Date(r.submission_date).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {r.remarks || 'Standard rollover replacement'}
                    </td>

                    <td className="py-3 px-4 text-right space-x-2">
                      <Link
                        to={`/fdrs/${r.replacement_fdr_id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                      >
                        <Eye className="h-3 w-3" />
                        <span>View New FDR</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Submitting Renewal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Submit Replacement / Renewal FDR</h3>
                <p className="text-xs text-slate-500">Links the new instrument with the maturing deposit record</p>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-800 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmitRenewal} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Original FDR to Replace *
                </label>
                <select
                  value={originalFdrId}
                  onChange={(e) => handleSelectOriginal(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none"
                >
                  <option value="">-- Choose Expiring / Maturing FDR --</option>
                  {eligibleFdrs.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.fdr_number} (₹{f.amount.toLocaleString('en-IN')} at {f.bank_name}) - Matures: {new Date(f.maturity_date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New FDR Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SBI-RENEW-2026-001"
                    value={fdrNumber}
                    onChange={(e) => setFdrNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (INR ₹) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bank Name *</label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branch Name *</label>
                  <input
                    type="text"
                    required
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New Issue Date *</label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New Maturity Date *</label>
                  <input
                    type="date"
                    required
                    value={maturityDate}
                    onChange={(e) => setMaturityDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Renewal Remarks / Justification</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 5-year lock-in tenure renewal with joint lien endorsement..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-900 text-white rounded-lg font-semibold hover:bg-indigo-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Link & Submit Renewal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

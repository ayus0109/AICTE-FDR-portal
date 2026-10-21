import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ArrowUpRight,
  PlusCircle,
  FileText,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CheckSquare
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ReleaseRequest, FDRRecord } from '../types';
import { StatusBadge } from '../components/common/Badge';

export const ReleasesPage: React.FC = () => {
  const { role } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedFdrId = searchParams.get('fdr_id');

  const [requests, setRequests] = useState<ReleaseRequest[]>([]);
  const [eligibleFdrs, setEligibleFdrs] = useState<FDRRecord[]>([]);
  const [showModal, setShowModal] = useState(!!preselectedFdrId);

  // Form
  const [fdrId, setFdrId] = useState<string>(preselectedFdrId || '');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Officer review modal
  const [reviewModalReq, setReviewModalReq] = useState<ReleaseRequest | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string>('APPROVED');
  const [reviewRemarks, setReviewRemarks] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchReleaseData = async () => {
    try {
      setIsLoading(true);
      const [reqData, fdrData] = await Promise.all([
        api.get<ReleaseRequest[]>('/releases'),
        api.get<FDRRecord[]>('/fdrs')
      ]);
      setRequests(reqData);
      setEligibleFdrs(fdrData);
    } catch (err) {
      console.error('Error fetching release requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReleaseData();
  }, []);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fdrId) {
      setError('Please select an FDR record to request release for.');
      return;
    }
    if (reason.trim().length < 10) {
      setError('Please provide a substantive justification (at least 10 characters).');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await api.post('/releases', {
        fdr_id: parseInt(fdrId),
        reason: reason.trim(),
      });
      setShowModal(false);
      setReason('');
      setFdrId('');
      await fetchReleaseData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit release request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalReq) return;
    if (reviewRemarks.trim().length < 5) {
      setError('Mandatory review remarks required (at least 5 characters).');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await api.put(`/releases/${reviewModalReq.id}/review`, {
        status: reviewStatus,
        remarks: reviewRemarks.trim(),
      });
      setReviewModalReq(null);
      setReviewRemarks('');
      await fetchReleaseData();
    } catch (err: any) {
      setError(err.message || 'Failed to update release request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 uppercase tracking-wider mb-1">
            <ArrowUpRight className="h-4 w-4" />
            <span>Authorized Release & Refund Workflow</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Security Deposit Release / Refund Requests</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process official administrative release upon statutory completion of mandatory program tenure.
          </p>
        </div>

        {role === 'COLLEGE_USER' && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-teal-800 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Request Deposit Release</span>
          </button>
        )}
      </div>

      {/* Statutory Disclaimer Box */}
      <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
        <ShieldCheck className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Statutory Note on Release Approvals:</span> Approval in this portal records AICTE administrative authorization to release lien. It does not execute electronic fund transfers or financial banking operations directly.
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading Release Requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <ArrowUpRight className="h-8 w-8 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-700">No Release Requests Found</p>
            <p className="text-slate-400">Applications for deposit closure or lien release will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">FDR Ref #</th>
                  {role !== 'COLLEGE_USER' && (
                    <th className="py-3 px-4 font-semibold">Institution</th>
                  )}
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Reason</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Decision Remarks</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{r.fdr_number}</div>
                      <div className="text-[10px] text-slate-400">Request #{r.id}</div>
                    </td>

                    {role !== 'COLLEGE_USER' && (
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {r.institution_name}
                      </td>
                    )}

                    <td className="py-3 px-4 font-bold text-slate-900">
                      ₹{(r.amount || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {r.reason}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={r.status} />
                    </td>

                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {r.remarks || 'Pending review'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {(role === 'AICTE_OFFICER' || role === 'ADMIN') && r.status === 'SUBMITTED' ? (
                        <button
                          onClick={() => {
                            setReviewModalReq(r);
                            setReviewStatus('APPROVED');
                            setReviewRemarks('');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-teal-800 text-white font-semibold text-xs hover:bg-teal-700 shadow-sm"
                        >
                          <CheckSquare className="h-3 w-3" />
                          <span>Review</span>
                        </button>
                      ) : (
                        <Link
                          to={`/fdrs/${r.fdr_id}`}
                          className="text-xs text-aicte-navy-700 font-semibold hover:underline"
                        >
                          View FDR
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

      {/* College Submit Release Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Submit Security Deposit Release Request</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-800 rounded-lg text-xs">{error}</div>
            )}

            <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select FDR for Release *</label>
                <select
                  value={fdrId}
                  onChange={(e) => setFdrId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none"
                >
                  <option value="">-- Choose FDR Record --</option>
                  {eligibleFdrs.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.fdr_number} (₹{f.amount.toLocaleString('en-IN')} at {f.bank_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Grounds / Reason for Release *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="State the statutory grounds: e.g. Completion of mandatory 10-year term with zero student liabilities, or voluntary program closure..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-teal-800 text-white rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Official Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Officer Decision Modal */}
      {reviewModalReq && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Review Release Request #{reviewModalReq.id}</h3>
                <p className="text-xs text-slate-500">{reviewModalReq.institution_name} • {reviewModalReq.fdr_number}</p>
              </div>
              <button onClick={() => setReviewModalReq(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-800 rounded-lg text-xs">{error}</div>}

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Decision Outcome *</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold focus:outline-none"
                >
                  <option value="APPROVED">Approve Release (Issue Administrative Authorization)</option>
                  <option value="CLARIFICATION_REQUIRED">Request Additional Compliance Proof</option>
                  <option value="REJECTED">Reject Release Request</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Scrutiny Remarks *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Record formal scrutiny basis, resolution remarks or compliance requirements..."
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalReq(null)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-teal-800 text-white rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Commit Release Determination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckSquare,
  AlertTriangle,
  FileText,
  Building2,
  Calendar,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';
import { FDRRecord } from '../types';
import { StatusBadge } from '../components/common/Badge';
import { DocumentPreviewModal } from '../components/fdr/DocumentPreviewModal';

export const FDRReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [fdr, setFdr] = useState<FDRRecord | null>(null);
  const [outcome, setOutcome] = useState<string>('VERIFIED');
  const [verificationMethod, setVerificationMethod] = useState<string>('MANUAL_SCRUTINY');
  const [observations, setObservations] = useState<string>('');
  const [supportingRef, setSupportingRef] = useState<string>('');
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFDR = async () => {
      try {
        setIsLoading(true);
        const data = await api.get<FDRRecord>(`/fdrs/${id}`);
        setFdr(data);
        if (data.scrutiny_remarks) {
          setObservations(data.scrutiny_remarks);
        }
      } catch (err: any) {
        console.error('Error fetching FDR for review:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFDR();
  }, [id]);

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observations || observations.trim().length < 5) {
      setError('Please provide mandatory scrutiny observations (at least 5 characters).');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await api.post(`/fdrs/${id}/verify`, {
        outcome,
        observations: observations.trim(),
        verification_method: verificationMethod,
        supporting_reference: supportingRef ? supportingRef.trim() : null,
      });

      navigate(`/fdrs/${id}`);
    } catch (err: any) {
      setError(err.message || 'Error recording scrutiny decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!fdr) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-slate-600 text-sm">FDR record not found.</p>
        <Link to="/officer/queue" className="text-xs text-blue-700 font-semibold hover:underline mt-2 inline-block">
          Return to Queue
        </Link>
      </div>
    );
  }

  // System Discrepancy Heuristics / Review Flags
  const flags = [];
  const issueDt = new Date(fdr.issue_date);
  const matDt = new Date(fdr.maturity_date);

  if (matDt <= issueDt) {
    flags.push('Conflict: Maturity date is on or before issue date.');
  }
  if (fdr.amount <= 0) {
    flags.push('Invalid deposit amount: value must be positive.');
  }
  if (!fdr.documents || fdr.documents.length === 0) {
    flags.push('Missing Document: No scanned FDR copy attached.');
  }

  return (
    <div className="space-y-6">
      {/* Back and Header */}
      <div className="flex items-center justify-between">
        <Link to="/officer/queue" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Scrutiny Queue</span>
        </Link>
        <div className="text-xs text-slate-500">
          Scrutiny Docket: <span className="font-mono font-semibold text-slate-800">FDR-{fdr.id}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
            <CheckSquare className="h-4 w-4" />
            <span>Official Scrutiny Inspection</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            FDR Review: {fdr.fdr_number}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submitted by {fdr.institution_name} ({fdr.aicte_code})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={fdr.administrative_status} type="admin" />
          <StatusBadge status={fdr.maturity_status} type="maturity" />
        </div>
      </div>

      {/* Split View: Left side instrument & document, Right side Scrutiny Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Instrument Overview & Document Preview */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Submitted Instrument Metadata
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500">Deposit Amount</span>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  ₹{fdr.amount.toLocaleString('en-IN')}
                </div>
              </div>

              <div>
                <span className="text-slate-500">Bank & Branch</span>
                <div className="font-semibold text-slate-800 mt-0.5">
                  {fdr.bank_name} ({fdr.branch_name})
                </div>
              </div>

              <div>
                <span className="text-slate-500">Issue Date</span>
                <div className="text-slate-700 mt-0.5">{issueDt.toLocaleDateString()}</div>
              </div>

              <div>
                <span className="text-slate-500">Maturity Date</span>
                <div className="text-slate-700 mt-0.5">{matDt.toLocaleDateString()}</div>
              </div>
            </div>

            {/* Automated System Review Flags */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <ShieldCheck className="h-4 w-4 text-blue-700" />
                <span>Automated Integrity Flags:</span>
              </div>
              {flags.length === 0 ? (
                <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>No automated date or parameter conflicts detected.</span>
                </div>
              ) : (
                <div className="space-y-1">
                  {flags.map((flag, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-xs text-amber-800">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{flag}</span>
                    </div>
                  ))}
                  <p className="text-[10px] text-slate-400 mt-1 italic">
                    Note: Automated checks are scrutiny aids rather than final determinations.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Document Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Attached FDR Scanned Documents
            </h3>

            {fdr.documents.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No document uploaded with this submission.</p>
            ) : (
              <div className="space-y-2">
                {fdr.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <FileText className="h-4 w-4 text-slate-500" />
                      <div>
                        <div className="font-semibold text-slate-800">{doc.original_filename}</div>
                        <div className="text-[10px] text-slate-400">
                          {(doc.file_size / 1024).toFixed(1)} KB • {doc.storage_provider}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedDoc(doc)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Inspect Document</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Scrutiny Decision Form */}
        <div className="lg:col-span-6 space-y-6">
          <form onSubmit={handleDecisionSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Record Scrutiny Determination
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official outcome will be signed into the audit log and notified to the institution.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-800 rounded-lg text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Decision Outcome Radio Group */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Scrutiny Outcome *
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2 transition-all ${outcome === 'VERIFIED' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input
                    type="radio"
                    name="outcome"
                    value="VERIFIED"
                    checked={outcome === 'VERIFIED'}
                    onChange={(e) => setOutcome(e.target.value)}
                    className="accent-emerald-600"
                  />
                  <span>Mark Verified</span>
                </label>

                <label className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2 transition-all ${outcome === 'CLARIFICATION_REQUIRED' ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input
                    type="radio"
                    name="outcome"
                    value="CLARIFICATION_REQUIRED"
                    checked={outcome === 'CLARIFICATION_REQUIRED'}
                    onChange={(e) => setOutcome(e.target.value)}
                    className="accent-amber-600"
                  />
                  <span>Require Clarification</span>
                </label>

                <label className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2 transition-all ${outcome === 'DISCREPANCY_DETECTED' ? 'border-orange-600 bg-orange-50 text-orange-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input
                    type="radio"
                    name="outcome"
                    value="DISCREPANCY_DETECTED"
                    checked={outcome === 'DISCREPANCY_DETECTED'}
                    onChange={(e) => setOutcome(e.target.value)}
                    className="accent-orange-600"
                  />
                  <span>Flag Discrepancy</span>
                </label>

                <label className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2 transition-all ${outcome === 'REJECTED' ? 'border-red-600 bg-red-50 text-red-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input
                    type="radio"
                    name="outcome"
                    value="REJECTED"
                    checked={outcome === 'REJECTED'}
                    onChange={(e) => setOutcome(e.target.value)}
                    className="accent-red-600"
                  />
                  <span>Reject Submission</span>
                </label>
              </div>
            </div>

            {/* Verification Method */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Verification Method *
              </label>
              <select
                value={verificationMethod}
                onChange={(e) => setVerificationMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
              >
                <option value="MANUAL_SCRUTINY">Manual Officer Scrutiny (Prescribed Format & Seals Inspection)</option>
                <option value="DEMO_BANK_SIMULATION">Simulated Bank API Verification (Demo Simulation)</option>
              </select>
              {verificationMethod === 'DEMO_BANK_SIMULATION' && (
                <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded mt-1.5 border border-amber-200">
                  Notice: Labelled explicitly as Demo/Simulated Verification per regulatory standards.
                </p>
              )}
            </div>

            {/* Supporting Reference */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Scrutiny Reference # (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. AICTE/SCRUTINY/2026/DEL-091"
                value={supportingRef}
                onChange={(e) => setSupportingRef(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800"
              />
            </div>

            {/* Observations / Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Scrutiny Remarks & Observations *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Record detailed scrutiny observations, discrepancy notes, or instructions for the college..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Mandatory official record. Visible to institution and preserved in audit log.
              </p>
            </div>

            {/* Submit */}
            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/officer/queue')}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Recording Decision...' : 'Commit Scrutiny Decision'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <DocumentPreviewModal document={selectedDoc} onClose={() => setSelectedDoc(null)} />
    </div>
  );
};

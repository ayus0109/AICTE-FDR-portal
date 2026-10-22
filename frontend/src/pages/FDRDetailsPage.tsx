import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Calendar,
  Building2,
  Download,
  Eye,
  Upload,
  Clock,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  CheckCircle,
  FileCheck
} from 'lucide-react';
import { api, getDownloadUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FDRRecord, Document } from '../types';
import { StatusBadge } from '../components/common/Badge';
import { DocumentPreviewModal } from '../components/fdr/DocumentPreviewModal';

export const FDRDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();
  const navigate = useNavigate();

  const [fdr, setFdr] = useState<FDRRecord | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFDR = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<FDRRecord>(`/fdrs/${id}`);
      setFdr(data);
    } catch (err: any) {
      console.error('Error fetching FDR details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFDR();
  }, [id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !fdr) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    setUploadError(null);
    try {
      await api.upload(`/documents/upload/${fdr.id}`, formData);
      await fetchFDR();
    } catch (err: any) {
      setUploadError(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-4 border-aicte-navy-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!fdr) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-800">FDR Record Not Found or Access Denied</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          You may not have authorization to view this institutional record.
        </p>
        <Link to="/fdrs" className="text-xs font-semibold text-aicte-navy-700 hover:underline">
          Return to FDR Repository
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <Building2 className="h-4 w-4 text-aicte-navy-700" />
            <span>{fdr.institution_name} ({fdr.aicte_code})</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>FDR Ref: {fdr.fdr_number}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submitted on {new Date(fdr.created_at).toLocaleDateString()} • {fdr.deposit_type}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {role === 'COLLEGE_USER' && (
            <>
              <Link
                to={`/renewals?fdr_id=${fdr.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold hover:bg-indigo-100 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Submit Renewal</span>
              </Link>
              <Link
                to={`/releases?fdr_id=${fdr.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold hover:bg-teal-100 transition-colors"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>Request Release</span>
              </Link>
            </>
          )}

          {(role === 'AICTE_OFFICER' || role === 'ADMIN') && (
            <Link
              to={`/officer/review/${fdr.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 transition-colors shadow-sm"
            >
              <FileCheck className="h-4 w-4" />
              <span>Perform Scrutiny</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Grid: Details & Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Key Parameters & Status */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Financial Instrument Specifications
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Deposit Amount</span>
                <div className="text-base font-black text-slate-900 mt-0.5">
                  ₹{fdr.amount.toLocaleString('en-IN')}
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Bank Name</span>
                <div className="font-semibold text-slate-800 mt-0.5">{fdr.bank_name}</div>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Branch Location</span>
                <div className="text-slate-700 mt-0.5">{fdr.branch_name}</div>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Deposit Type</span>
                <div className="text-slate-700 mt-0.5">{fdr.deposit_type}</div>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Issue Date</span>
                <div className="text-slate-800 font-medium mt-0.5">
                  {new Date(fdr.issue_date).toLocaleDateString()}
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Maturity Date</span>
                <div className="text-slate-800 font-medium mt-0.5">
                  {new Date(fdr.maturity_date).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Status Breakdown Box */}
            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-slate-500 font-semibold block mb-1">Administrative Workflow</span>
                <StatusBadge status={fdr.administrative_status} type="admin" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-semibold block mb-1">Date-derived Maturity</span>
                <StatusBadge status={fdr.maturity_status} type="maturity" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-semibold block mb-1">Days Remaining</span>
                <span className="text-xs font-bold text-slate-800">
                  {fdr.days_to_maturity !== undefined
                    ? fdr.days_to_maturity < 0
                      ? `${Math.abs(fdr.days_to_maturity)} days overdue`
                      : `${fdr.days_to_maturity} days`
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* Scrutiny Remarks */}
            {fdr.scrutiny_remarks && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
                <span className="font-bold block mb-0.5">Latest Scrutiny Observations:</span>
                <p>{fdr.scrutiny_remarks}</p>
              </div>
            )}
          </div>

          {/* Verification Decision History */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Official Scrutiny Audit Trail
            </h3>

            {fdr.verifications.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">No officer review recorded yet. Pending scrutiny queue.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {fdr.verifications.map((v) => (
                  <div key={v.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={v.outcome} size="sm" />
                        <span className="font-semibold text-slate-800">by {v.reviewer_name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(v.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1">{v.observations}</p>
                    <div className="text-[10px] text-slate-400">
                      Method: <span className="font-medium text-slate-600">{v.verification_method.replace('_', ' ')}</span>
                      {v.supporting_reference && ` • Ref: ${v.supporting_reference}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Uploaded Documents */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Custodial FDR Documents ({fdr.documents.length})
              </h3>
            </div>

            {/* Document List */}
            {fdr.documents.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No documents uploaded for this FDR yet.</p>
            ) : (
              <div className="space-y-2.5">
                {fdr.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-800 truncate">{doc.original_filename}</p>
                        <p className="text-[10px] text-slate-400">
                          {(doc.file_size / 1024).toFixed(1)} KB • {doc.storage_provider}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                        title="Preview Document"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <a
                        href={getDownloadUrl(doc.storage_key || doc.original_filename, doc.download_url)}
                        download
                        className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                        title="Download Document"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Additional Document Box */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Upload Revised or Supporting Document
              </label>
              {uploadError && (
                <div className="p-2 mb-2 bg-red-50 text-red-700 rounded text-[11px]">
                  {uploadError}
                </div>
              )}
              <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-slate-400 hover:bg-slate-50/50 transition-colors text-xs font-medium text-slate-600">
                <Upload className="h-4 w-4 text-slate-400" />
                <span>{isUploading ? 'Uploading & Encrypting...' : 'Select PDF or Scanned Receipt'}</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  disabled={isUploading}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-[10px] text-slate-400 mt-1">
                Supported: PDF, JPG, PNG up to 10 MB. Encrypted in private cloud repository.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      <DocumentPreviewModal document={selectedDoc} onClose={() => setSelectedDoc(null)} />
    </div>
  );
};

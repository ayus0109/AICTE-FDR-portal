import React from 'react';
import { X, Download, FileText, ExternalLink, ShieldCheck } from 'lucide-react';
import { Document } from '../../types';
import { getDownloadUrl } from '../../services/api';

interface DocumentPreviewModalProps {
  document: Document | null;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ document, onClose }) => {
  if (!document) return null;

  const downloadUrl = getDownloadUrl(document.storage_key || document.original_filename, document.download_url);
  const isImage = document.file_type.startsWith('image/');
  const isPdf = document.file_type.includes('pdf');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-aicte-navy-100 text-aicte-navy-900 rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 truncate max-w-md">
                {document.original_filename}
              </h3>
              <p className="text-xs text-slate-500">
                Storage: <span className="font-semibold text-slate-700">{document.storage_provider}</span> • Size: {(document.file_size / 1024).toFixed(1)} KB • Type: {document.file_type}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-aicte-navy-900 text-white hover:bg-aicte-navy-800 transition-colors shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Viewer */}
        <div className="flex-1 p-4 bg-slate-100 overflow-auto flex items-center justify-center min-h-[400px]">
          {isImage ? (
            <img
              src={downloadUrl}
              alt={document.original_filename}
              className="max-h-[65vh] object-contain rounded-md shadow-sm border border-slate-300"
            />
          ) : isPdf ? (
            <iframe
              src={downloadUrl}
              title={document.original_filename}
              className="w-full h-[65vh] rounded-md border border-slate-300 bg-white"
            />
          ) : (
            <div className="text-center p-8 bg-white rounded-lg border border-slate-200 shadow-sm max-w-md">
              <FileText className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">Preview not available inline for this format</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">You can download the original file securely.</p>
              <a
                href={downloadUrl}
                download
                className="inline-flex items-center gap-2 px-4 py-2 bg-aicte-navy-900 text-white text-xs font-semibold rounded-md"
              >
                <Download className="h-4 w-4" /> Download File
              </a>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Authorized Document Access • End-to-End Encrypted</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

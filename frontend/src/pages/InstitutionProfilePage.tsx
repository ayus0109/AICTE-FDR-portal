import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  FileText,
  Calendar,
  AlertCircle,
  ExternalLink,
  Eye
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Institution, FDRRecord } from '../types';
import { StatusBadge } from '../components/common/Badge';

export const InstitutionProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();

  const [institution, setInstitution] = useState<Institution | null>(null);
  const [fdrs, setFdrs] = useState<FDRRecord[]>([]);
  const [allInstitutions, setAllInstitutions] = useState<Institution[]>([]);
  const [selectedInstId, setSelectedInstId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (targetId?: number) => {
    try {
      setIsLoading(true);
      if (role !== 'COLLEGE_USER' && !targetId && !id) {
        const instList = await api.get<Institution[]>('/institutions');
        setAllInstitutions(instList);
        if (instList.length > 0) {
          targetId = instList[0].id;
        }
      }

      const queryId = targetId || id || user?.institution_id;
      if (!queryId) return;

      setSelectedInstId(Number(queryId));
      const [instData, fdrsData] = await Promise.all([
        api.get<Institution>(`/institutions/${queryId}`),
        api.get<FDRRecord[]>(`/fdrs?institution_id=${queryId}`)
      ]);
      setInstitution(instData);
      setFdrs(fdrsData);
    } catch (err) {
      console.error('Error fetching institution profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id, user]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <Building2 className="h-4 w-4 text-aicte-navy-700" />
            <span>Institutional Profile Dossier</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {institution?.name || 'Institution Dossier'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            AICTE Identification Code: <span className="font-mono font-bold text-slate-800">{institution?.aicte_code}</span>
          </p>
        </div>

        {/* Institution selector for Officer / Admin */}
        {role !== 'COLLEGE_USER' && allInstitutions.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Select Institution:</span>
            <select
              value={selectedInstId || ''}
              onChange={(e) => fetchProfile(parseInt(e.target.value))}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none"
            >
              {allInstitutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Synthetic Prototype Notice */}
      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-blue-700 shrink-0" />
        <span>
          Prototype Notice: Institutional data presented is fictionalized for evaluation and hackathon demonstration purposes.
        </span>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-500 text-xs">Loading Institution Profile...</div>
      ) : !institution ? (
        <div className="p-8 text-center text-slate-500 text-xs">Institution not found.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Institution Contact & Registry Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                Official Directory Details
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500">Institution Category</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{institution.institution_type}</div>
                </div>

                <div>
                  <span className="text-slate-500">Authorized Contact Officer</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{institution.contact_person}</div>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{institution.email}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{institution.phone}</span>
                </div>

                <div className="flex items-start gap-2 text-slate-700">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{institution.address}, {institution.state}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500">Registry Standing:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {institution.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Security Standing */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Security Deposit Standing
              </h3>
              <div className="text-2xl font-black text-slate-900">
                ₹{(institution.total_fdr_amount || 0).toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Total aggregate deposits lodged across {institution.fdr_count || 0} active instruments.
              </p>
            </div>
          </div>

          {/* Institutional FDR Instruments */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Custodial Instruments ({fdrs.length})
              </h3>
              <Link to="/fdrs" className="text-xs font-semibold text-aicte-navy-700 hover:underline">
                View in Repository →
              </Link>
            </div>

            {fdrs.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No FDR records filed for this institution.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {fdrs.map((fdr) => (
                  <div key={fdr.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{fdr.fdr_number}</div>
                      <div className="text-[11px] text-slate-500">
                        {fdr.bank_name} • Matures: {new Date(fdr.maturity_date).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-bold text-slate-900">₹{fdr.amount.toLocaleString('en-IN')}</div>
                        <StatusBadge status={fdr.administrative_status} size="sm" />
                      </div>
                      <Link
                        to={`/fdrs/${fdr.id}`}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

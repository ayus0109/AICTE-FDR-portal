import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Building2,
  Mail,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { User, Institution, UserRole } from '../types';
import { StatusBadge } from '../components/common/Badge';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('COLLEGE_USER');
  const [institutionId, setInstitutionId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const [usersData, instsData] = await Promise.all([
        api.get<User[]>('/users'),
        api.get<Institution[]>('/institutions')
      ]);
      setUsers(usersData);
      setInstitutions(instsData);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (id: number) => {
    try {
      await api.put(`/users/${id}/status`);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await api.post('/users', {
        name: name.trim(),
        email: email.trim(),
        password: password,
        role: role,
        institution_id: role === 'COLLEGE_USER' && institutionId ? parseInt(institutionId) : null,
      });

      setShowAddModal(false);
      setName('');
      setEmail('');
      setPassword('');
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wider mb-1">
            <Users className="h-4 w-4" />
            <span>Role-Based Identity & Access Control</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Authorized User & Access Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage institutional representatives, AICTE scrutiny officers, and system administrators.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-purple-900 hover:bg-purple-800 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Authorized User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading authorized users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">User Details</th>
                  <th className="py-3 px-4 font-semibold">Assigned Role</th>
                  <th className="py-3 px-4 font-semibold">Linked Institution</th>
                  <th className="py-3 px-4 font-semibold">Account Status</th>
                  <th className="py-3 px-4 font-semibold">Created Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-500">{u.email}</div>
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={u.role} type="role" />
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      {u.institution_name || 'AICTE Bureau / National'}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                          u.is_active
                            ? 'text-red-700 hover:bg-red-50'
                            : 'text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Provision New User Account</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-800 rounded-lg text-xs">{error}</div>}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name & Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. A. P. Singh (Principal)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. principal@college.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none"
                >
                  <option value="COLLEGE_USER">College User (Institutional Scope)</option>
                  <option value="AICTE_OFFICER">AICTE Officer (Scrutiny & Review Scope)</option>
                  <option value="ADMIN">System Administrator (Full Scope)</option>
                </select>
              </div>

              {role === 'COLLEGE_USER' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Linked Institution *</label>
                  <select
                    value={institutionId}
                    onChange={(e) => setInstitutionId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none"
                  >
                    <option value="">-- Choose Technical Institution --</option>
                    {institutions.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.aicte_code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-purple-900 text-white rounded-lg font-semibold hover:bg-purple-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

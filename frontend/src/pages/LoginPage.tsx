import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertCircle,
  Cloud
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { API_BASE } from '../services/api';

export const LoginPage: React.FC = () => {
  const { login, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError(`Unable to connect to backend (${API_BASE}). If the server was sleeping, please wait 20-30 seconds for it to wake and click again.`);
      } else {
        setError(err.message || 'Authentication failed. Please check credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (role: UserRole) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await loginAsDemo(role);
      if (role === 'COLLEGE_USER') navigate('/college/dashboard');
      else if (role === 'AICTE_OFFICER') navigate('/officer/dashboard');
      else navigate('/admin/dashboard');
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError(`Unable to connect to backend (${API_BASE}). If the server was sleeping, please wait 20-30 seconds for it to wake and click again.`);
      } else {
        setError(err.message || 'Demo login failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top National Header Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="h-1.5 w-full bg-gradient-to-r from-aicte-saffron via-white to-emerald-600" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-aicte-navy-900 flex items-center justify-center text-white font-bold shadow-sm">
              <ShieldCheck className="h-6 w-6 text-aicte-saffron-400" />
            </div>
            <div>
              <div className="font-bold text-base text-aicte-navy-950">ALL INDIA COUNCIL FOR TECHNICAL EDUCATION</div>
              <div className="text-xs text-slate-500">Ministry of Education, Government of India</div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            <Cloud className="h-3.5 w-3.5 text-blue-600" />
            <span>AWS Multi-Tenant Architecture • ap-southeast-2</span>
          </div>
        </div>
      </div>

      {/* Main Login Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Info & Official Context */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-aicte-saffron-100 text-aicte-saffron-800 border border-aicte-saffron-200">
                Problem Statement ID: 26265
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Streamline of Security Deposit / FDR Portal
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Centralized, transparent and auditable repository for managing mandatory institutional fixed deposits, renewals, compliance scrutiny, and authorized releases.
              </p>
            </div>

            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs text-slate-600">
              <div className="font-semibold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Verified Regulatory Capabilities:</span>
              </div>
              <ul className="space-y-2 pl-6 list-disc text-slate-600">
                <li>Institutional data isolation (zero cross-college leakage)</li>
                <li>Officer scrutiny, observations & discrepancy detection</li>
                <li>Automated idempotent maturity alerts (30/15/7/0 days)</li>
                <li>Linked replacement & multi-step refund approval</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Sign In Form & Demo Personas */}
          <div className="lg:col-span-7 bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Sign in to Official Portal</h2>
              <p className="text-xs text-slate-500 mt-0.5">Use your registered institutional or officer credentials</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-800">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@aicte.gov.in or college@domain.edu.in"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-aicte-navy-700 focus:border-aicte-navy-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Portal Password
                </label>
                <div className="relative">
                  <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-aicte-navy-700 focus:border-aicte-navy-700"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-aicte-navy-900 hover:bg-aicte-navy-800 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Authenticating...' : 'Sign In with Credentials'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Quick Demo Persona Section */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  1-Click Hackathon Demo Login
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Select any authorized role to test the live end-to-end workflow immediately:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* College Persona */}
                <button
                  type="button"
                  onClick={() => handleDemoLogin('COLLEGE_USER')}
                  disabled={isSubmitting}
                  className="p-3 text-left rounded-xl border border-slate-200 hover:border-aicte-navy-600 hover:bg-slate-50 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-aicte-navy-900">College User</span>
                    <Building2 className="h-3.5 w-3.5 text-slate-400 group-hover:text-aicte-navy-900" />
                  </div>
                  <div className="text-[10px] text-slate-500 line-clamp-1">Delhi Inst. of Tech</div>
                  <div className="text-[10px] font-semibold text-aicte-navy-700 mt-1">1-Click Enter →</div>
                </button>

                {/* Officer Persona */}
                <button
                  type="button"
                  onClick={() => handleDemoLogin('AICTE_OFFICER')}
                  disabled={isSubmitting}
                  className="p-3 text-left rounded-xl border border-slate-200 hover:border-blue-600 hover:bg-blue-50/50 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-blue-900">AICTE Officer</span>
                    <ShieldCheck className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-900" />
                  </div>
                  <div className="text-[10px] text-slate-500 line-clamp-1">Scrutiny & Approvals</div>
                  <div className="text-[10px] font-semibold text-blue-700 mt-1">1-Click Enter →</div>
                </button>

                {/* Admin Persona */}
                <button
                  type="button"
                  onClick={() => handleDemoLogin('ADMIN')}
                  disabled={isSubmitting}
                  className="p-3 text-left rounded-xl border border-slate-200 hover:border-purple-600 hover:bg-purple-50/50 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-purple-900">Administrator</span>
                    <Cloud className="h-3.5 w-3.5 text-slate-400 group-hover:text-purple-900" />
                  </div>
                  <div className="text-[10px] text-slate-500 line-clamp-1">Governance & Audit</div>
                  <div className="text-[10px] font-semibold text-purple-700 mt-1">1-Click Enter →</div>
                </button>
              </div>

              <div className="pt-2 text-center">
                <span className="text-[10px] text-slate-400">
                  Target API: <code className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono">{API_BASE}</code>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <footer className="bg-white border-t border-slate-200 py-3 px-4 text-center text-xs text-slate-500">
        AICTE Security Deposit / FDR Portal • Problem Statement ID: 26265 • Synthetic Demo Dataset
      </footer>
    </div>
  );
};

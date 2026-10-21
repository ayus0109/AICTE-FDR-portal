import React from 'react';

interface BadgeProps {
  status: string;
  type?: 'admin' | 'maturity' | 'role';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, type = 'admin', size = 'md' }) => {
  const s = status.toUpperCase();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  // Role badges
  if (type === 'role') {
    if (s === 'ADMIN') {
      return <span className={`inline-flex items-center rounded-md bg-purple-100 text-purple-800 ${sizeClasses}`}>Admin</span>;
    }
    if (s === 'AICTE_OFFICER') {
      return <span className={`inline-flex items-center rounded-md bg-blue-100 text-blue-800 ${sizeClasses}`}>AICTE Officer</span>;
    }
    return <span className={`inline-flex items-center rounded-md bg-emerald-100 text-emerald-800 ${sizeClasses}`}>College User</span>;
  }

  // Maturity badges
  if (type === 'maturity') {
    if (s === 'MATURED') {
      return <span className={`inline-flex items-center rounded-full bg-red-100 text-red-800 ${sizeClasses}`}>Matured (Overdue)</span>;
    }
    if (s === 'APPROACHING_MATURITY') {
      return <span className={`inline-flex items-center rounded-full bg-amber-100 text-amber-800 ${sizeClasses}`}>Approaching Maturity</span>;
    }
    return <span className={`inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 ${sizeClasses}`}>Active</span>;
  }

  // Administrative workflow badges
  switch (s) {
    case 'VERIFIED':
      return <span className={`inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 ${sizeClasses}`}>Verified</span>;
    case 'UNDER_REVIEW':
      return <span className={`inline-flex items-center rounded-full bg-blue-100 text-blue-800 ${sizeClasses}`}>Under Scrutiny</span>;
    case 'SUBMITTED':
      return <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-800 ${sizeClasses}`}>Submitted</span>;
    case 'CLARIFICATION_REQUIRED':
      return <span className={`inline-flex items-center rounded-full bg-amber-100 text-amber-800 ${sizeClasses}`}>Clarification Required</span>;
    case 'DISCREPANCY_DETECTED':
      return <span className={`inline-flex items-center rounded-full bg-orange-100 text-orange-800 ${sizeClasses}`}>Discrepancy Detected</span>;
    case 'REJECTED':
      return <span className={`inline-flex items-center rounded-full bg-red-100 text-red-800 ${sizeClasses}`}>Rejected</span>;
    case 'RENEWAL_SUBMITTED':
      return <span className={`inline-flex items-center rounded-full bg-indigo-100 text-indigo-800 ${sizeClasses}`}>Renewal in Progress</span>;
    case 'RELEASE_APPROVED':
      return <span className={`inline-flex items-center rounded-full bg-teal-100 text-teal-800 ${sizeClasses}`}>Release Approved</span>;
    case 'APPROVED':
      return <span className={`inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 ${sizeClasses}`}>Approved</span>;
    case 'COMPLETED':
      return <span className={`inline-flex items-center rounded-full bg-gray-100 text-gray-800 ${sizeClasses}`}>Completed</span>;
    default:
      return <span className={`inline-flex items-center rounded-full bg-gray-100 text-gray-800 ${sizeClasses}`}>{status}</span>;
  }
};

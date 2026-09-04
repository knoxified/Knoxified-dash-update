"use client";
import React, { useState } from "react";
import { ShieldAlert, Users, PhoneOff, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const MOCK_USERS = [
  { id: "usr_001", name: "Acme Corp", email: "admin@acme.com", status: "Active", riskScore: "Low" },
  { id: "usr_002", name: "Global Outreach", email: "marketing@go-reach.net", status: "Active", riskScore: "High (High DNC Blocks)" },
  { id: "usr_003", name: "Zenith Sales", email: "sales@zenith.io", status: "Suspended (Outbound)", riskScore: "Critical" },
];

export default function AdminPage() {
  const [users, setUsers] = useState(MOCK_USERS);

  const toggleSuspension = (userId: string) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        const isCurrentlyActive = u.status === 'Active';
        const newStatus = isCurrentlyActive ? 'Suspended (Outbound)' : 'Active';
        toast.success(`Account ${u.name} outbound calling has been ${isCurrentlyActive ? 'suspended' : 'restored'}. Action logged in Immutable Audit Logs.`);
        return { ...u, status: newStatus };
      }
      return u;
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <span className="w-9 h-9 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.25)]"><ShieldAlert size={18} /></span>
            Admin: Risk & Abuse Management
          </h1>
          <p className="text-slate-500 dark:text-[#888] text-sm max-w-2xl">
            Monitor account risk scores and enforce Acceptable Use Policy suspensions for outbound calling abuse. Suspension isolates the outbound calling capability without destroying data access.
          </p>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="p-5 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-slate-500 dark:text-[#888]" />
            <h3 className="text-slate-900 dark:text-white font-semibold">User Accounts & Risk</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-500 dark:text-[#888]">
            <thead className="bg-slate-50 dark:bg-[#020617] text-slate-400 dark:text-[#666] border-b border-slate-200 dark:border-white/5 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Account Name</th>
                <th className="px-6 py-4">Risk Flag</th>
                <th className="px-6 py-4">Outbound Status</th>
                <th className="px-6 py-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-5">
                    <p className="font-semibold text-slate-900 dark:text-white text-[14px] mb-0.5">{user.name}</p>
                    <p className="text-[12px] text-slate-400 dark:text-[#666]">{user.email}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`text-[11px] font-bold px-2 py-1 rounded tracking-wider uppercase ${
                      user.riskScore === 'Low' ? 'bg-emerald-100 text-emerald-600 dark:bg-[#10B981]/10 dark:text-[#10B981]' :
                      user.riskScore.includes('High') || user.riskScore === 'Critical' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' :
                      'bg-amber-100 text-amber-600 dark:bg-[#F59E0B]/10 dark:text-[#F59E0B]'
                    }`}>{user.riskScore}</span>
                  </td>
                  <td className="px-6 py-5">
                    {user.status === 'Active' ? (
                      <span className="text-emerald-600 dark:text-[#10B981] font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span> Active</span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1.5"><PhoneOff size={14}/> Suspended</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right">
                    {user.status === 'Active' ? (
                      <button onClick={() => toggleSuspension(user.id)} className="text-[12px] font-medium text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 px-3 py-1.5 rounded-lg transition-colors">
                        Suspend Outbound
                      </button>
                    ) : (
                      <button onClick={() => toggleSuspension(user.id)} className="text-[12px] font-medium text-emerald-600 hover:text-white hover:bg-emerald-600 border border-emerald-200 dark:border-[#10B981]/20 bg-emerald-50 dark:bg-[#10B981]/10 dark:text-[#10B981] px-3 py-1.5 rounded-lg transition-colors">
                        Restore Access
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

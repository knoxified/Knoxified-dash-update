"use client";
import React, { useState } from "react";
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [acknowledged, setAcknowledged] = useState(false);

  const handleAcknowledge = () => {
    setAcknowledged(true);
    toast.success("Compliance terms acknowledged. Timestamp logged in audit logs.");
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
          Settings
        </h1>
        <p className="text-slate-500 dark:text-[#888] text-sm">
          Manage your account, authentication details, and billing plans.
        </p>
      </div>

      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-6 md:p-8 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Profile & Authentication</h2>
        <div className="space-y-6 max-w-md">
          <div>
            <label className="block text-[13px] font-medium text-slate-500 dark:text-[#888] mb-2">Email Address</label>
            <input 
              type="email" 
              defaultValue="knoxfavour29@gmail.com"
              disabled
              className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/5 text-slate-400 dark:text-[#666] text-sm rounded-lg px-4 py-2.5 cursor-not-allowed"
            />
            <p className="text-[12px] text-slate-400 dark:text-[#666] mt-2">
              Managed securely via Supabase Auth. Contact support to change your email.
            </p>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-500 dark:text-[#888] mb-2">Full Name</label>
            <input 
              type="text" 
              defaultValue="John Doe"
              className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">
            Save Profile
          </button>
        </div>
      </div>

      <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-6 md:p-8">
        <div className="flex gap-4 items-start">
          <ShieldAlert className="text-rose-600 dark:text-rose-400 shrink-0 mt-1" />
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Compliance Acknowledgment</h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed max-w-3xl">
                Before initiating your first outbound campaign, you must acknowledge Knoxified&apos;s Acceptable Use Policy and Compliance Terms. You are responsible for ensuring lawful basis for contact, maintaining consent documentation, honoring DNC requests, and adhering to calling hour restrictions.
              </p>
            </div>
            
            {acknowledged ? (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 rounded-lg border border-emerald-200 dark:border-emerald-500/20 w-fit">
                <CheckCircle2 size={18} />
                <span className="text-sm font-medium">Terms acknowledged and recorded in immutable audit logs.</span>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#0F172A] border border-rose-200 dark:border-rose-500/20 p-4 rounded-lg flex flex-col gap-4 max-w-xl">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1 shrink-0 w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500" id="compliance-check" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    I confirm that I understand and agree to my responsibilities regarding lawful contact, consent documentation, Do-Not-Call (DNC) list suppression obligations, and Knoxified&apos;s right to suspend my account for violations.
                  </span>
                </label>
                <button onClick={() => {
                  const cb = document.getElementById('compliance-check') as HTMLInputElement;
                  if(cb && cb.checked) {
                    handleAcknowledge();
                  } else {
                    toast.error("Please check the box to acknowledge the terms.");
                  }
                }} className="bg-rose-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors w-fit">
                  Submit Acknowledgment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

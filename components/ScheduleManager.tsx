"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  getAutomationSchedules,
  getCallSchedules,
  createAutomationSchedule,
  createCallSchedule,
  cancelAutomationSchedule,
  cancelCallSchedule,
  approveAutomationSchedule,
  approveCallSchedule
} from "@/lib/actions/schedule-actions";

export default function ScheduleManager({ type, targetId }: { type: "automation" | "call", targetId: string }) {
    const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const data = type === "automation" 
        ? await getAutomationSchedules()
        : await getCallSchedules();
      
      const filtered = type === "automation" ? data.filter((s: any) => s.automation_id === targetId) : data;
      setSchedules(filtered);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [type, targetId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSchedules();
  }, [fetchSchedules]);

  const handleCreate = async () => {
    if (!date || !time || (type === "call" && !phoneNumber)) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString();
      
      if (type === "automation") {
        await createAutomationSchedule(targetId, scheduledAt);
      } else {
        await createCallSchedule(phoneNumber, scheduledAt);
      }
      
      toast.success("Schedule created successfully");
      setShowNew(false);
      setDate("");
      setTime("");
      setPhoneNumber("");
      fetchSchedules();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      if (type === "automation") {
        await cancelAutomationSchedule(id);
      } else {
        await cancelCallSchedule(id);
      }
      toast.success("Schedule canceled");
      fetchSchedules();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      if (type === "automation") {
        await approveAutomationSchedule(id);
      } else {
        await approveCallSchedule(id);
      }
      toast.success("Schedule approved");
      fetchSchedules();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) return <div className="p-4 animate-pulse bg-slate-100 dark:bg-[#020617]/50 rounded-xl h-32"></div>;

  return (
    <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden mt-8">
      <div className="p-5 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar size={18} className="text-sky-500" />
            {type === "automation" ? "Automation Schedules" : "Call Schedules"}
          </h2>
          <p className="text-sm text-slate-500">Manage when this {type} runs or requires approval.</p>
        </div>
        <button 
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> New Schedule
        </button>
      </div>

      {showNew && (
        <div className="p-5 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#020617]/30 flex flex-wrap gap-4 items-end">
          {type === "call" && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
              <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+1234567890" className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 w-48" />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 text-sm font-medium bg-[#00E5FF] text-slate-900 rounded-lg hover:bg-[#00E5FF]/90 transition-colors">
              Save
            </button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-[#888] hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="p-0">
        {schedules.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-[#888]">
            No schedules found.
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-500 dark:text-[#888]">
            <thead className="bg-slate-50 dark:bg-[#020617]/50 text-slate-400 dark:text-[#666] border-b border-slate-200 dark:border-white/5 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3">Scheduled For</th>
                {type === "call" && <th className="px-5 py-3">Phone Number</th>}
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Approval</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {schedules.map((s) => {
                const needsApproval = s.requires_approval && !s.approved_at && s.status !== 'canceled';
                return (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap text-slate-900 dark:text-white">
                      {new Date(s.scheduled_for).toLocaleString()}
                    </td>
                    {type === "call" && (
                      <td className="px-5 py-4 whitespace-nowrap">
                        {s.phone_number}
                      </td>
                    )}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        s.status === 'canceled' ? 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300' 
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {needsApproval ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-500 font-medium">
                          <Clock size={14} /> Needs your approval
                        </span>
                      ) : s.approved_at ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-500">
                          <CheckCircle2 size={14} /> Approved
                        </span>
                      ) : (
                        <span className="text-slate-400">Pre-approved</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        {needsApproval && (
                          <button 
                            onClick={() => handleApprove(s.id)}
                            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400"
                          >
                            Approve
                          </button>
                        )}
                        {s.status !== 'canceled' && (
                          <button 
                            onClick={() => handleCancel(s.id)}
                            className="text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-500 dark:hover:text-rose-400 flex items-center gap-1"
                          >
                            <XCircle size={14} /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { Megaphone, Plus, Mail, Phone, MessageSquare, FastForward, Play, Pause, MoreHorizontal, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import ScheduleManager from "@/components/ScheduleManager";

const MOCK_CAMPAIGNS = [
  { id: "C-001", name: "Q3 Real Estate Outbound", type: "Multi-Channel", status: "Active", progress: 68, sent: 1240, openRate: "42%", conversion: "3.4%", audience: "Cold Leads (NYC)" },
  { id: "C-002", name: "Dental Re-engagement", type: "Voice + SMS", status: "Active", progress: 34, sent: 850, openRate: "N/A", conversion: "8.1%", audience: "Past Patients > 6mo" },
  { id: "C-003", name: "SaaS Webinar Invite", type: "Email", status: "Completed", progress: 100, sent: 4500, openRate: "28%", conversion: "1.2%", audience: "Newsletter Subs" },
  { id: "C-004", name: "Holiday Promotion", type: "SMS", status: "Draft", progress: 0, sent: 0, openRate: "-", conversion: "-", audience: "All Customers" },
];

export default function CampaignsPage() {
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false); // In real app, check user profile
  const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    audience: "",
    type: "Email",
    consentSource: "",
    startTime: "09:00 AM",
    endTime: "05:00 PM",
  });

  const handleNewCampaignClick = () => {
    if (!hasAcknowledged) {
      setShowComplianceModal(true);
    } else {
      setShowNewCampaign(true);
    }
  };

  const handleAcknowledge = () => {
    setHasAcknowledged(true);
    setShowComplianceModal(false);
    setShowNewCampaign(true);
  };

  const handleCreateCampaign = () => {
    if (!newCampaign.name || !newCampaign.audience || !newCampaign.consentSource) {
      toast.error("Please fill out all required fields.");
      return;
    }

    const newCamp = {
      id: `C-00${campaigns.length + 1}`,
      name: newCampaign.name,
      type: newCampaign.type,
      status: "Draft",
      progress: 0,
      sent: 0,
      openRate: "-",
      conversion: "-",
      audience: newCampaign.audience,
    };

    setCampaigns([newCamp, ...campaigns]);
    setShowNewCampaign(false);
    toast.success("Campaign created successfully.");
    setNewCampaign({
      name: "",
      audience: "",
      type: "Email",
      consentSource: "",
      startTime: "09:00 AM",
      endTime: "05:00 PM",
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
            Active Campaigns
          </h1>
          <p className="text-slate-500 dark:text-[#888] text-sm">
            Monitor and coordinate multi-channel push sequences and voice broadcasts.
          </p>
        </div>
        <button 
          onClick={handleNewCampaignClick}
          className="flex items-center gap-2 bg-[color:var(--accent)] hover:opacity-90 text-slate-900 text-sm font-medium px-4 py-2 rounded-lg transition-all shadow-[0_0_20px_rgba(0,229,255,0.25)] hover:shadow-[0_0_28px_rgba(0,229,255,0.4)]"
        >
          <Plus size={18} /> New Campaign
        </button>
      </div>

      {showComplianceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0F172A] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl w-full max-w-lg shadow-2xl shadow-black/40 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 dark:border-white/5">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={24} />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Compliance Acknowledgment</h2>
              <p className="text-sm text-slate-500 dark:text-[#888]">
                Before launching your first outbound campaign, you must acknowledge Knoxified&apos;s usage policies designed to help you meet your compliance obligations.
              </p>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-[#020617]/50 space-y-4 text-sm text-slate-700 dark:text-slate-300">
              <p>By proceeding, you confirm that you understand and agree to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Maintain a <strong>lawful basis</strong> for contacting all recipients in your campaigns.</li>
                <li>Ensure you have the required <strong>consent documentation</strong> for your specific jurisdiction and campaign type.</li>
                <li>Respect and abide by all <strong>Do-Not-Call (DNC)</strong> and global suppression list obligations.</li>
                <li>Acknowledge Knoxified&apos;s right to suspend outbound calling features if abuse patterns are detected.</li>
              </ul>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-white/5 flex justify-end gap-3">
              <button 
                onClick={() => setShowComplianceModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-[#888] hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAcknowledge}
                className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                I Agree & Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0F172A] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl w-full max-w-2xl shadow-2xl shadow-black/40 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create New Campaign</h2>
              <button onClick={() => setShowNewCampaign(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Campaign Name</label>
                  <input type="text" value={newCampaign.name} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} placeholder="e.g. Q4 Outreach" className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#00E5FF]" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Audience / Leads Source</label>
                  <Select 
                    value={newCampaign.audience} 
                    onChange={(val) => setNewCampaign({ ...newCampaign, audience: val })} 
                    options={[
                      { value: "All Qualified Leads", label: "All Qualified Leads" },
                      { value: "Uploaded CSV (Marketing List)", label: "Uploaded CSV (Marketing List)" }
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Campaign Type</label>
                  <Select 
                    value={newCampaign.type} 
                    onChange={(val) => setNewCampaign({ ...newCampaign, type: val })} 
                    options={[
                      { value: "Email", label: "Email" },
                      { value: "SMS", label: "SMS" },
                      { value: "Voice + SMS", label: "Voice + SMS" },
                      { value: "Multi-Channel", label: "Multi-Channel" }
                    ]}
                  />
                </div>

                <div className="p-4 bg-slate-50 dark:bg-[#020617]/50 rounded-lg border border-slate-200 dark:border-white/5 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Compliance & Delivery Settings</h3>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Consent Source Verification <span className="text-rose-500">*</span></label>
                    <Select 
                      value={newCampaign.consentSource} 
                      onChange={(val) => setNewCampaign({ ...newCampaign, consentSource: val })} 
                      options={[
                        { value: "Existing Customers (Implied Consent)", label: "Existing Customers (Implied Consent)" },
                        { value: "Inbound Inquiry / Web Form", label: "Inbound Inquiry / Web Form" },
                        { value: "Explicit Opt-In List", label: "Explicit Opt-In List" }
                      ]}
                    />
                    <p className="text-[11px] text-slate-500 dark:text-[#888] mt-1">Required to document the lawful basis for this campaign.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Calling Window Start</label>
                      <Select 
                        value={newCampaign.startTime} 
                        onChange={(val) => setNewCampaign({ ...newCampaign, startTime: val })} 
                        options={[
                          { value: "08:00 AM (Local Time)", label: "08:00 AM (Local Time)" },
                          { value: "09:00 AM (Local Time)", label: "09:00 AM (Local Time)" },
                          { value: "10:00 AM (Local Time)", label: "10:00 AM (Local Time)" }
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Calling Window End</label>
                      <Select 
                        value={newCampaign.endTime} 
                        onChange={(val) => setNewCampaign({ ...newCampaign, endTime: val })} 
                        options={[
                          { value: "05:00 PM (Local Time)", label: "05:00 PM (Local Time)" },
                          { value: "07:00 PM (Local Time)", label: "07:00 PM (Local Time)" },
                          { value: "09:00 PM (Local Time)", label: "09:00 PM (Local Time)" },
                          { value: "10:00 PM (Restricted)", label: "10:00 PM (Restricted)" }
                        ]}
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-[#888]">System will automatically prevent dispatches outside of these hours relative to the recipient&apos;s area code.</p>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 dark:border-white/5 flex justify-end gap-3">
              <button onClick={() => setShowNewCampaign(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-[#888] hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleCreateCampaign} className="px-4 py-2 text-sm font-medium bg-[color:var(--accent)] text-slate-900 rounded-lg hover:opacity-90 transition-all shadow-[0_0_15px_rgba(0,229,255,0.25)]">
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
          <div className="flex gap-4">
            <button className="text-sm font-semibold text-slate-900 dark:text-white border-b-2 border-[color:var(--accent)] pb-1">All Campaigns</button>
            <button className="text-sm font-medium text-slate-500 dark:text-[#888] hover:text-slate-700 dark:text-[#EDEDED] transition-colors pb-1 border-b-2 border-transparent">Active & Scheduled</button>
            <button className="text-sm font-medium text-slate-500 dark:text-[#888] hover:text-slate-700 dark:text-[#EDEDED] transition-colors pb-1 border-b-2 border-transparent">Drafts</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-500 dark:text-[#888]">
            <thead className="bg-slate-50 dark:bg-[#020617]/50 text-slate-400 dark:text-[#666] border-b border-slate-200 dark:border-white/5 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Campaign Name</th>
                <th className="px-6 py-4">Status & Progress</th>
                <th className="px-6 py-4">Volume Sent</th>
                <th className="px-6 py-4">Engagement Rate</th>
                <th className="px-6 py-4">Conversion</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {campaigns.map((camp) => (
                <tr key={camp.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/5 flex items-center justify-center shrink-0">
                        {camp.type === 'Email' ? <Mail size={16} className="text-slate-500 dark:text-[#888]" /> : 
                         camp.type === 'SMS' ? <MessageSquare size={16} className="text-slate-500 dark:text-[#888]" /> : 
                         camp.type === 'Voice + SMS' ? <Phone size={16} className="text-slate-500 dark:text-[#888]" /> : 
                         <FastForward size={16} className="text-[color:var(--accent)]" />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-[14px] mb-0.5">{camp.name}</p>
                        <p className="text-[12px] text-slate-400 dark:text-[#666]">{camp.type} • {camp.audience}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3 mb-2">
                       <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wider ${
                         camp.status === 'Active' ? 'bg-emerald-100 dark:bg-[#10B981]/10 text-emerald-600 dark:text-[#10B981]' :
                         camp.status === 'Completed' ? 'bg-white/10 text-slate-900 dark:text-white' : 'bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-[#666]'
                       }`}>{camp.status}</span>
                       <span className="text-[12px] font-medium">{camp.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-50 dark:bg-[#020617] rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full ${camp.status === 'Active' ? 'bg-[color:var(--accent)] shadow-[0_0_8px_rgba(0,229,255,0.6)]' : camp.status === 'Completed' ? 'bg-white/40' : 'bg-transparent'}`} style={{ width: `${camp.progress}%` }}></div>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-medium text-slate-700 dark:text-[#EDEDED]">{camp.sent > 0 ? camp.sent.toLocaleString() : '-'}</td>
                  <td className="px-6 py-5 font-medium text-slate-700 dark:text-[#EDEDED]">{camp.openRate}</td>
                  <td className="px-6 py-5">
                    <span className="text-emerald-600 dark:text-[#10B981] font-bold">{camp.conversion}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {camp.status === 'Active' && (
                        <button className="p-1.5 rounded bg-slate-200 dark:bg-white/5 hover:bg-white/10 text-slate-900 dark:text-white transition-colors">
                          <Pause size={14} />
                        </button>
                      )}
                      {camp.status === 'Draft' && (
                        <button className="p-1.5 rounded bg-[color:var(--accent)]/10 text-[color:var(--accent)] hover:bg-[color:var(--accent)]/20 border border-[color:var(--accent)]/20 transition-colors">
                          <Play size={14} />
                        </button>
                      )}
                      <button className="p-1.5 rounded bg-slate-200 dark:bg-white/5 hover:bg-white/10 text-slate-900 dark:text-white transition-colors">
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ScheduleManager type="call" targetId="global" />
    </div>
  );
}
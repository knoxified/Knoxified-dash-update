"use client";
import { Select } from "@/components/ui/Select";
import React, { useState } from "react";
import { Download, Search, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";

const MOCK_LEADS = [
  { id: "L-9021", name: "Alex Morgan", phone: "+1 (555) 123-4567", company: "Starlight Inc.", consentSource: "Submitted Inquiry Form", date: "2026-06-17" },
  { id: "L-9022", name: "David Chen", phone: "+1 (555) 987-6543", company: "Nexus Corp", consentSource: "Existing Customer", date: "2026-06-16" },
  { id: "L-9023", name: "Sarah Jenkins", phone: "+1 (555) 456-7890", company: "Acme Co", consentSource: "Prior Call", date: "2026-06-16" }
];

export default function LeadsPage() {
  const [leads, setLeads] = useState(MOCK_LEADS);
  const [showAdd, setShowAdd] = useState(false);
  
  const [newLead, setNewLead] = useState({ name: "", phone: "", company: "", consentSource: "" });

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name || !newLead.phone || !newLead.consentSource) {
      toast.error("Name, phone, and consent source are mandatory.");
      return;
    }
    
    setLeads([
      {
        id: `L-${Math.floor(Math.random() * 10000)}`,
        name: newLead.name,
        phone: newLead.phone,
        company: newLead.company,
        consentSource: newLead.consentSource,
        date: new Date().toISOString().split('T')[0]
      },
      ...leads
    ]);
    setShowAdd(false);
    setNewLead({ name: "", phone: "", company: "", consentSource: "" });
    toast.success("Lead added with documented consent.");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
            Leads Directory
          </h1>
          <p className="text-slate-500 dark:text-[#888] text-sm max-w-2xl">
            View captured leads from all operational tools and voice agents. Consent documentation is strictly required before any outbound campaigns can be initiated.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 bg-sky-600 text-white hover:bg-sky-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <UserPlus size={16} /> Add Lead
          </button>
          <button className="flex items-center gap-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-900 dark:text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-5 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Add New Contact</h3>
          <form onSubmit={handleAddLead} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-[#888] mb-1">Full Name *</label>
              <input required value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-[#888] mb-1">Phone Number *</label>
              <input required value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-[#888] mb-1">Company</label>
              <input value={newLead.company} onChange={e => setNewLead({...newLead, company: e.target.value})} className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-[#888] mb-1">Consent Source *</label>
              <Select 
                required 
                value={newLead.consentSource} 
                onChange={(val) => setNewLead({...newLead, consentSource: val})} 
                options={[
                  { value: "Existing Customer", label: "Existing Customer" },
                  { value: "Submitted Inquiry Form", label: "Submitted Inquiry Form" },
                  { value: "Prior Call", label: "Prior Call" },
                  { value: "Uploaded List (Documented Consent)", label: "Uploaded List (Documented Consent)" }
                ]}
              />
            </div>
            <button type="submit" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors w-full">
              Save Contact
            </button>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-[#888]" size={16} />
            <input 
              type="text" 
              placeholder="Search leads..." 
              className="bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 w-[300px] transition-all"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-white/[0.02] text-xs uppercase font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/5">
              <tr>
                <th className="px-5 py-4">ID</th>
                <th className="px-5 py-4">Lead Info</th>
                <th className="px-5 py-4">Phone</th>
                <th className="px-5 py-4">Consent Source</th>
                <th className="px-5 py-4 text-right">Date Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group">
                  <td className="px-5 py-4 font-mono text-xs">{lead.id}</td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-900 dark:text-white">{lead.name}</div>
                    <div className="text-[12px] text-slate-500 dark:text-[#888]">{lead.company}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-900 dark:text-slate-300">
                    {lead.phone}
                  </td>
                  <td className="px-5 py-4">
                    <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-0.5 rounded text-[11px] font-bold">
                      {lead.consentSource}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-slate-500">
                    {lead.date}
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

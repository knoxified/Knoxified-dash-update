"use client";

import { Select } from "@/components/ui/Select";
import { useState } from "react";
import { Layers, Rocket, Server, Plus, X } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

const INITIAL_DEPLOYMENTS = [
  { id: 1, name: 'Web Voice Agent', type: 'Frontend App', status: 'Healthy', version: 'v2.4.1', date: '2d ago', url: 'voice.knoxified.com', icon: Layers },
  { id: 2, type: 'API Backend', name: 'Leads Router', status: 'Healthy', version: 'v1.12.0', date: '4d ago', url: 'api.knoxified.com/leads', icon: Server },
  { id: 3, type: 'Integration', name: 'CRM Sync Webhook', status: 'Degraded', version: 'v1.0.3', date: '1w ago', url: 'hooks.knoxified.com/crm', icon: Rocket },
];

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState(INITIAL_DEPLOYMENTS);
  const [showNewDeployment, setShowNewDeployment] = useState(false);
  const [newDeployment, setNewDeployment] = useState({
    name: "",
    type: "Frontend App",
    url: "",
  });

  const handleCreateDeployment = () => {
    if (!newDeployment.name || !newDeployment.url) {
      toast.error("Please fill out all required fields.");
      return;
    }

    const newDep = {
      id: deployments.length + 1,
      name: newDeployment.name,
      type: newDeployment.type,
      status: 'Deploying',
      version: 'v1.0.0',
      date: 'Just now',
      url: newDeployment.url,
      icon: newDeployment.type === 'Frontend App' ? Layers : newDeployment.type === 'API Backend' ? Server : Rocket,
    };

    setDeployments([newDep, ...deployments]);
    setShowNewDeployment(false);
    toast.success("Deployment started successfully.");
    setNewDeployment({
      name: "",
      type: "Frontend App",
      url: "",
    });
    
    // Simulate deployment finishing after 3 seconds
    setTimeout(() => {
      setDeployments(prev => prev.map(d => d.id === newDep.id ? { ...d, status: 'Healthy' } : d));
      toast.success(`${newDep.name} is now healthy and active.`);
    }, 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
            Deployments
          </h1>
          <p className="text-slate-500 dark:text-[#888] text-sm">
            Manage infrastructure, API endpoints, and production services.
          </p>
        </div>
        <button onClick={() => setShowNewDeployment(true)} className="flex items-center gap-2 bg-[color:var(--accent)] hover:opacity-90 text-slate-900 text-sm font-medium px-4 py-2 rounded-lg transition-all shadow-[0_0_20px_rgba(0,229,255,0.25)] hover:shadow-[0_0_28px_rgba(0,229,255,0.4)]">
          <Plus size={18} /> New Deployment
        </button>
      </div>

      {showNewDeployment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0F172A] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl w-full max-w-lg shadow-2xl shadow-black/40 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create New Deployment</h2>
              <button onClick={() => setShowNewDeployment(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Deployment Name <span className="text-rose-500">*</span></label>
                <input type="text" value={newDeployment.name} onChange={(e) => setNewDeployment({ ...newDeployment, name: e.target.value })} placeholder="e.g. Sales Voice Agent" className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[color:var(--accent)] transition-colors" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Deployment Type</label>
                <Select 
                  value={newDeployment.type} 
                  onChange={(val) => setNewDeployment({ ...newDeployment, type: val })} 
                  options={[
                    { value: "Frontend App", label: "Frontend App" },
                    { value: "API Backend", label: "API Backend" },
                    { value: "Integration", label: "Integration / Webhook" }
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Domain / URL <span className="text-rose-500">*</span></label>
                <input type="text" value={newDeployment.url} onChange={(e) => setNewDeployment({ ...newDeployment, url: e.target.value })} placeholder="e.g. agent.knoxified.com" className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[color:var(--accent)] transition-colors" />
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 dark:border-white/5 flex justify-end gap-3">
              <button onClick={() => setShowNewDeployment(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-[#888] hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleCreateDeployment} className="px-4 py-2 text-sm font-medium bg-[color:var(--accent)] text-slate-900 rounded-lg hover:opacity-90 transition-all shadow-[0_0_15px_rgba(0,229,255,0.25)]">
                Deploy Now
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deployments.map((dep, idx) => (
          <motion.div
            key={dep.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.06 }}
            className="relative overflow-hidden glass-card card-hover rounded-xl p-6 cursor-pointer group flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-[color:var(--accent)]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="w-11 h-11 rounded-full bg-[color:var(--accent)]/10 flex items-center justify-center mb-4 group-hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-shadow">
                <dep.icon size={18} className="text-[color:var(--accent)]" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                {dep.name}
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded flex items-center gap-1.5 ${
                    dep.status === 'Healthy' ? 'bg-emerald-100 dark:bg-[#10B981]/10 text-emerald-600 dark:text-[#10B981]' :
                    dep.status === 'Degraded' ? 'bg-amber-100 dark:bg-[#F59E0B]/10 text-amber-500 dark:text-[#F59E0B]' :
                    dep.status === 'Deploying' ? 'bg-[color:var(--accent)]/10 text-[color:var(--accent)]' :
                    'bg-red-100 dark:bg-[#EF4444]/10 text-red-500 dark:text-[#EF4444]'
                }`}>
                  {(dep.status === 'Healthy' || dep.status === 'Deploying') && <span className={`w-1.5 h-1.5 rounded-full ${dep.status === 'Healthy' ? 'bg-[#10B981]' : 'bg-[color:var(--accent)]'} animate-pulse`}></span>}
                  {dep.status}
                </span>
              </h3>
              <p className="text-[13px] text-slate-500 dark:text-[#888] mb-2">{dep.type}</p>
              <a href="#" className="text-[13px] text-[color:var(--accent)] hover:underline mb-6 inline-block truncate max-w-full">
                {dep.url}
              </a>
            </div>
            <div className="relative z-10 text-[12px] text-slate-400 dark:text-[#666] font-medium flex items-center justify-between border-t border-slate-200 dark:border-white/5 pt-4">
              <span>{dep.version} &bull; {dep.date}</span>
              <span className="text-[color:var(--accent)] group-hover:opacity-80 transition-colors text-sm font-semibold">Manage</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { Select } from "@/components/ui/Select";
import { useState } from "react";
import { Cpu, MoreVertical, Play, Settings2, ShieldCheck, SquareTerminal, Home, Building, HeartPulse, Users, Shield, Truck, ShoppingCart, Video, Scale, Hammer, Sun, ShoppingBag, Stethoscope, Briefcase, Droplet, Thermometer, Utensils, Dumbbell, Car, RefreshCcw, ArrowRight, Activity, DollarSign, Target, CalendarCheck, Search } from "lucide-react";
import { useSystems } from "@/lib/services/hooks";
import Link from "next/link";
import { useRouter } from "next/navigation";

const getIcon = (name?: string, defaultIcon?: React.ReactNode) => {
  switch (name) {
    case "Home": return <Home size={20} />;
    case "Building": return <Building size={20} />;
    case "HeartPulse": return <HeartPulse size={20} />;
    case "Users": return <Users size={20} />;
    case "Shield": return <Shield size={20} />;
    case "Truck": return <Truck size={20} />;
    case "ShoppingCart": return <ShoppingCart size={20} />;
    case "Video": return <Video size={20} />;
    case "Scale": return <Scale size={20} />;
    case "Hammer": return <Hammer size={20} />;
    case "Sun": return <Sun size={20} />;
    case "ShoppingBag": return <ShoppingBag size={20} />;
    case "Stethoscope": return <Stethoscope size={20} />;
    case "Briefcase": return <Briefcase size={20} />;
    case "Droplet": return <Droplet size={20} />;
    case "Thermometer": return <Thermometer size={20} />;
    case "Utensils": return <Utensils size={20} />;
    case "Dumbbell": return <Dumbbell size={20} />;
    case "Car": return <Car size={20} />;
    default: return defaultIcon || <Cpu size={20} />;
  }
};

export default function SystemsPage() {
  const { data: systems, loading, setData } = useSystems();
  const [activating, setActivating] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"revenue" | "name" | "active">("revenue");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const router = useRouter();

  if (loading) {
     return <div className="animate-pulse bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl h-64 w-full"></div>;
  }

  const toggleActivation = (e: React.MouseEvent, id: string, currentStatus: string) => {
    e.stopPropagation();
    if (currentStatus === 'Active' || currentStatus === 'Peak Performance' || currentStatus === 'Needs Review') {
      setData(prev => prev.map(s => s.id === id ? { ...s, status: 'Offline' } : s));
      return;
    }
    
    setActivating(id);
    setTimeout(() => {
      setData(prev => prev.map(s => s.id === id ? { ...s, status: 'Active' } : s));
      setActivating(null);
    }, 1500);
  };
  
  const formatCurrency = (value?: number) => {
    if (!value) return "$0";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkAction = (activate: boolean) => {
    setData(prev => prev.map(s => {
      if (selected.includes(s.id)) {
        return { ...s, status: activate ? 'Active' : 'Offline' };
      }
      return s;
    }));
    setSelected([]);
  };

  const filteredSystems = systems.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const sortedSystems = [...filteredSystems].sort((a, b) => {
    switch (sortBy) {
      case "revenue":
        return (b.revenueImpact || 0) - (a.revenueImpact || 0);
      case "name":
        return a.name.localeCompare(b.name);
      case "active":
        const aActive = a.status !== "Offline" ? 1 : 0;
        const bActive = b.status !== "Offline" ? 1 : 0;
        if (aActive !== bActive) return bActive - aActive;
        return (b.revenueImpact || 0) - (a.revenueImpact || 0);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {selected.length > 0 && (
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-md p-3 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <span className="text-slate-900 dark:text-white text-sm font-medium">{selected.length} systems selected</span>
            <button onClick={() => setSelected([])} className="text-slate-500 dark:text-[#888] text-xs hover:text-slate-900 dark:text-white transition-colors">Clear selection</button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleBulkAction(true)} className="bg-sky-100 dark:bg-[#00E5FF]/10 text-sky-600 dark:text-[#00E5FF] hover:bg-sky-200 dark:bg-[#00E5FF]/20 border border-sky-300 dark:border-[#00E5FF]/20 px-3 py-1.5 rounded text-xs font-medium transition-colors">Deploy Selected</button>
            <button onClick={() => handleBulkAction(false)} className="bg-red-100 dark:bg-[#EF4444]/10 text-red-500 dark:text-[#EF4444] hover:bg-[#EF4444]/20 border border-[#EF4444]/20 px-3 py-1.5 rounded text-xs font-medium transition-colors">Deactivate Selected</button>
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
            Systems Portfolio
          </h1>
          <p className="text-slate-500 dark:text-[#888] text-sm">
            View performance and manage your active AI workforce.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search systems..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 text-sm text-slate-900 dark:text-white rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-sky-400 dark:border-[#00E5FF]/50 transition-colors shadow-sm placeholder:text-slate-400 dark:placeholder:text-[#666]"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto z-10">
            <span className="text-slate-500 dark:text-[#888] text-xs font-medium whitespace-nowrap">Sort by:</span>
            <div className="w-40">
              <Select
                value={sortBy}
                onChange={(val) => setSortBy(val as 'revenue' | 'name' | 'active')}
                options={[
                  { value: "revenue", label: "Revenue Impact" },
                  { value: "name", label: "Name (A-Z)" },
                  { value: "active", label: "Most Active" }
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedSystems.map((sys) => {
          const isActive = sys.status !== 'Offline';
          const isActivating = activating === sys.id;
          const isSelected = selected.includes(sys.id);
          
          return (
            <div 
              key={sys.id} 
              onClick={() => router.push(`/systems/${sys.id}`)}
              className={`relative overflow-hidden bg-white dark:bg-[#0F172A] border rounded-xl p-6 flex flex-col group hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer ${isActive ? 'border-sky-300 dark:border-[#00E5FF]/20 hover:border-sky-600 dark:border-[#00E5FF]/40 shadow-[#00E5FF]/5' : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:border-white/10'} ${isSelected ? 'ring-1 ring-[#00E5FF]/50 border-sky-400 dark:border-[#00E5FF]/50' : ''}`}
            >
              <div 
                className={`absolute top-4 right-4 z-20 cursor-pointer ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                onClick={(e) => toggleSelect(e, sys.id)}
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#00E5FF] border-sky-600 dark:border-[#00E5FF]' : 'border-[#888] bg-slate-50 dark:bg-[#020617] hover:border-white'}`}>
                  {isSelected && <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 text-[#020617]"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
              </div>

              {isActive && (
                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-100 dark:bg-[#00E5FF]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-opacity duration-500 opacity-50 group-hover:opacity-100"></div>
              )}
              <div className="flex items-start justify-between mb-5 relative z-10 pr-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${
                    isActive ? "bg-slate-50 dark:bg-[#020617] text-sky-600 dark:text-[#00E5FF] border-slate-300 dark:border-white/10" : "bg-slate-50 dark:bg-[#020617] text-slate-400 dark:text-[#666] border-slate-200 dark:border-white/5"
                  }`}>
                    {getIcon(sys.iconName)}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">{sys.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#10B981]' : isActivating ? 'bg-amber-400 dark:bg-[#F59E0B] animate-pulse' : 'bg-[#444]'}`}></span>
                      <span className={`text-[12px] font-medium ${isActive ? 'text-emerald-600 dark:text-[#10B981]' : isActivating ? 'text-amber-500 dark:text-[#F59E0B]' : 'text-slate-400 dark:text-[#666]'}`}>
                        {isActive ? sys.status : isActivating ? 'Deploying...' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
                {isActive && (
                  <div className="text-right">
                    <p className="text-[12px] text-emerald-600 dark:text-[#10B981] font-medium mb-1">Revenue Impact</p>
                    <p className="text-[24px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">{formatCurrency(sys.revenueImpact)}</p>
                  </div>
                )}
              </div>
              
              <p className="text-slate-500 dark:text-[#888] text-[14px] mb-6 flex-1 pr-4 leading-relaxed">
                {sys.description}
              </p>
              
              {isActive && sys.metrics && (
                <div className="grid grid-cols-3 gap-2 mb-6 bg-slate-50 dark:bg-[#020617] rounded-lg p-4 border border-slate-200 dark:border-white/5">
                   <div>
                     <p className="text-[12px] text-slate-500 dark:text-[#888] font-medium flex items-center gap-1.5 mb-1.5"><Activity size={12}/> {sys.metrics.label1}</p>
                     <p className="text-[15px] text-slate-900 dark:text-white font-medium">{sys.metrics.value1}</p>
                   </div>
                   <div>
                     <p className="text-[12px] text-slate-500 dark:text-[#888] font-medium flex items-center gap-1.5 mb-1.5"><Target size={12}/> {sys.metrics.label2}</p>
                     <p className="text-[15px] text-slate-900 dark:text-white font-medium">{sys.metrics.value2}</p>
                   </div>
                   <div>
                     <p className="text-[12px] text-slate-500 dark:text-[#888] font-medium flex items-center gap-1.5 mb-1.5"><CalendarCheck size={12}/> {sys.metrics.label3}</p>
                     <p className="text-[15px] text-slate-900 dark:text-white font-medium">{sys.metrics.value3}</p>
                   </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-5 border-t border-slate-200 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => toggleActivation(e, sys.id, sys.status)}
                    disabled={isActivating}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md transition-all ${
                      isActive 
                        ? 'bg-transparent text-red-500 dark:text-[#EF4444] hover:bg-red-100 dark:bg-[#EF4444]/10 border border-[#EF4444]' 
                        : isActivating
                        ? 'bg-amber-100 dark:bg-[#F59E0B]/10 text-amber-500 dark:text-[#F59E0B] border border-[#F59E0B]/20 opacity-80 cursor-not-allowed'
                        : 'bg-[#00E5FF] text-slate-900 dark:text-white hover:bg-[#00E5FF]/90 shadow-sm border border-transparent'
                    }`}>
                    {isActive ? (
                      <>Deactivate System</>
                    ) : isActivating ? (
                      <><RefreshCcw size={14} className="animate-spin" /> Deploying...</>
                    ) : (
                      <><Play size={14} /> Deploy System</>
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-1 text-[13px] text-sky-600 dark:text-[#00E5FF] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  View Analytics <ArrowRight size={14} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

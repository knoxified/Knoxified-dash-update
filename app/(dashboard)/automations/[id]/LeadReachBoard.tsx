"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Play, Search, ChevronDown, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LeadReachBoard() {
  const [formData, setFormData] = useState({
    country: "united states",
    state: "california",
    seniority: "CFO",
    industry: "software development",
    leadCount: "5"
  });
  
  const [userId, setUserId] = useState<string | null>(null);
  const [results, setResults] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedLead, setExpandedLead] = useState<number | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    }
    fetchUser();
  }, [supabase.auth]);

  const handleRun = async () => {
    setIsSearching(true);
    setResults(null);

    // The structured payload including userId from session
    const payload = {
      country: formData.country,
      state: formData.state,
      seniority: formData.seniority,
      industry: formData.industry,
      userId: userId || "ad409f1e-7150-4ed1-a4d1-ab5d523ab265",
      leadCount: parseInt(formData.leadCount)
    };

    console.log("Sending Webhook Payload:", payload);

    toast.info("Sending payload to LeadReach webhook...");

    try {
      const res = await fetch("/api/leadreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      // The n8n webhook responds with a single-item array: [{ leads, leadsCount, planTier, creditsCharged }]
      // or, when credits run out, [{ message: "INSUFFICIENT CREDITS", creditsNeeded, creditsRemaining }].
      const result = Array.isArray(data) ? data[0] : data;

      if (!res.ok || !result) {
        toast.error("LeadReach didn't respond as expected. Try again.");
        setResults(null);
        return;
      }

      if (result.message === "INSUFFICIENT CREDITS") {
        toast.error(
          `Not enough credits: this search needs ${result.creditsNeeded}, you have ${result.creditsRemaining}.`
        );
        setResults(null);
        return;
      }

      if (!Array.isArray(result.leads)) {
        toast.error("LeadReach returned an unexpected response shape.");
        setResults(null);
        return;
      }

      setResults(result);
      toast.success(
        result.leadsCount > 0
          ? `Successfully enriched ${result.leadsCount} lead${result.leadsCount === 1 ? "" : "s"}!`
          : "No matching leads found for this search."
      );
    } catch (err) {
      console.error("LeadReach request failed:", err);
      toast.error("Couldn't reach LeadReach. Check your connection and try again.");
      setResults(null);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-6 text-lg">
            <Search className="w-5 h-5 text-sky-500" />
            LeadReach Configuration
          </h3>
          
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Country</label>
              <div className="relative group">
                <select 
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  className="w-full appearance-none bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white transition-all duration-300 hover:border-sky-400 dark:hover:border-sky-500/50 hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
                >
                  <option value="united states">United States</option>
                  <option value="united kingdom">United Kingdom</option>
                  <option value="canada">Canada</option>
                  <option value="australia">Australia</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500 group-hover:text-sky-500 transition-colors">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">State / Region</label>
              <div className="relative group">
                <select 
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  className="w-full appearance-none bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white transition-all duration-300 hover:border-sky-400 dark:hover:border-sky-500/50 hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
                >
                  <option value="california">California</option>
                  <option value="new york">New York</option>
                  <option value="texas">Texas</option>
                  <option value="florida">Florida</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500 group-hover:text-sky-500 transition-colors">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Target Seniority</label>
              <div className="relative group">
                <select 
                  value={formData.seniority}
                  onChange={(e) => setFormData({...formData, seniority: e.target.value})}
                  className="w-full appearance-none bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white transition-all duration-300 hover:border-sky-400 dark:hover:border-sky-500/50 hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
                >
                  <option value="CEO">CEO</option>
                  <option value="CFO">CFO</option>
                  <option value="CTO">CTO</option>
                  <option value="VP">VP Level</option>
                  <option value="Director">Director Level</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500 group-hover:text-sky-500 transition-colors">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Industry</label>
              <div className="relative group">
                <select 
                  value={formData.industry}
                  onChange={(e) => setFormData({...formData, industry: e.target.value})}
                  className="w-full appearance-none bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white transition-all duration-300 hover:border-sky-400 dark:hover:border-sky-500/50 hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
                >
                  <option value="software development">Software Development</option>
                  <option value="financial services">Financial Services</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="ecommerce">E-commerce</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500 group-hover:text-sky-500 transition-colors">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Lead Count Limit</label>
              <div className="relative group">
                <select 
                  value={formData.leadCount}
                  onChange={(e) => setFormData({...formData, leadCount: e.target.value})}
                  className="w-full appearance-none bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white transition-all duration-300 hover:border-sky-400 dark:hover:border-sky-500/50 hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
                >
                  <option value="5">5 Leads</option>
                  <option value="10">10 Leads</option>
                  <option value="15">15 Leads</option>
                  <option value="20">20 Leads</option>
                  <option value="25">25 Leads</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500 group-hover:text-sky-500 transition-colors">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleRun}
            disabled={isSearching}
            className="w-full mt-8 flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-medium px-4 py-3.5 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(14,165,233,0.39)] hover:shadow-[0_6px_20px_rgba(14,165,233,0.23)] disabled:opacity-50 disabled:shadow-none hover:-translate-y-0.5"
          >
            {isSearching ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Play size={18} fill="currentColor" />
            )}
            {isSearching ? "Running Workflow..." : "Trigger LeadReach"}
          </button>
        </div>
      </div>

      <div className="lg:col-span-2 flex flex-col h-[700px] bg-slate-50 dark:bg-[#0B1121] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm relative">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#0F172A] flex justify-between items-center z-10">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            JSON Output Console
          </h3>
          {results && (
            <div className="flex gap-4">
              <span className="text-xs font-mono bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-500/20">
                Plan: {results.planTier}
              </span>
              <span className="text-xs font-mono bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                Credits Used: {results.creditsCharged}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto bg-[#FAFAFA] dark:bg-[#090D1A] p-6 custom-scrollbar">
          {!isSearching && !results && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-[#555] max-w-sm mx-auto text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
                <Search size={28} className="text-slate-300 dark:text-[#444]" />
              </div>
              <p className="text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Ready to Enrich</p>
              <p className="text-xs">Configure the parameters on the left and trigger the webhook to view the generated JSON payload.</p>
            </div>
          )}
          
          {isSearching && (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-slate-200 dark:border-white/10 rounded-full"></div>
                <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">Awaiting Webhook Response...</p>
            </div>
          )}

          {results && !isSearching && (
            <div className="space-y-4 font-mono text-xs">
              <div className="text-slate-500 dark:text-slate-400">
                <span className="text-slate-800 dark:text-slate-200">{"["}</span>
                <div className="pl-4 border-l border-slate-200 dark:border-white/10 ml-2 py-1">
                  <span className="text-slate-800 dark:text-slate-200">{"{"}</span>
                  <div className="pl-4 border-l border-slate-200 dark:border-white/10 ml-2 py-1">
                    <div className="text-pink-600 dark:text-pink-400 mb-1">
                      &quot;leads&quot;<span className="text-slate-800 dark:text-slate-200">: [</span>
                    </div>
                    <div className="pl-4 space-y-4">
                      {results.leads.map((lead: any, idx: number) => (
                        <div key={idx} className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/5 p-4 rounded-xl shadow-sm hover:border-sky-300 dark:hover:border-sky-500/30 transition-colors">
                          <button 
                            onClick={() => setExpandedLead(expandedLead === idx ? null : idx)}
                            className="w-full flex items-center justify-between text-left group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-xs">
                                {idx + 1}
                              </div>
                              <span className="text-slate-800 dark:text-slate-200 font-semibold group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                {"{"}
                                <span className="text-emerald-600 dark:text-emerald-400 font-normal mx-2">&quot;{lead.fullName}&quot;</span>
                                {"}"}
                              </span>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expandedLead === idx ? 'rotate-90' : ''}`} />
                          </button>
                          
                          {expandedLead === idx && (
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 space-y-1.5 overflow-x-auto custom-scrollbar">
                              {Object.entries(lead).map(([key, value]) => (
                                <div key={key} className="flex flex-wrap gap-2">
                                  <span className="text-sky-700 dark:text-sky-300">&quot;{key}&quot;</span>
                                  <span className="text-slate-800 dark:text-slate-200">:</span>
                                  <span className={
                                    typeof value === 'boolean' ? "text-purple-600 dark:text-purple-400" :
                                    typeof value === 'number' ? "text-orange-600 dark:text-orange-400" :
                                    value === "" ? "text-slate-400" :
                                    Array.isArray(value) ? "text-slate-800 dark:text-slate-200" :
                                    String(value).includes('🔒') ? "text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-500/10 px-1 rounded" :
                                    "text-emerald-700 dark:text-emerald-300 break-words"
                                  }>
                                    {Array.isArray(value) 
                                      ? `[${value.map(v => `"${v}"`).join(', ')}]`
                                      : typeof value === 'string' && value !== "" ? `"${value}"`
                                      : value === "" ? '""' 
                                      : String(value)
                                    }
                                    {key !== Object.keys(lead).pop() && <span className="text-slate-800 dark:text-slate-200">,</span>}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="text-slate-800 dark:text-slate-200 mt-1">],</div>
                    
                    <div className="mt-2">
                      <span className="text-pink-600 dark:text-pink-400">&quot;leadsCount&quot;</span>
                      <span className="text-slate-800 dark:text-slate-200">: </span>
                      <span className="text-orange-600 dark:text-orange-400">{results.leadsCount}</span>
                      <span className="text-slate-800 dark:text-slate-200">,</span>
                    </div>
                    <div>
                      <span className="text-pink-600 dark:text-pink-400">&quot;planTier&quot;</span>
                      <span className="text-slate-800 dark:text-slate-200">: </span>
                      <span className="text-emerald-700 dark:text-emerald-300">&quot;{results.planTier}&quot;</span>
                      <span className="text-slate-800 dark:text-slate-200">,</span>
                    </div>
                    <div>
                      <span className="text-pink-600 dark:text-pink-400">&quot;creditsCharged&quot;</span>
                      <span className="text-slate-800 dark:text-slate-200">: </span>
                      <span className="text-orange-600 dark:text-orange-400">{results.creditsCharged}</span>
                    </div>
                  </div>
                  <span className="text-slate-800 dark:text-slate-200">{"}"}</span>
                </div>
                <span className="text-slate-800 dark:text-slate-200">{"]"}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

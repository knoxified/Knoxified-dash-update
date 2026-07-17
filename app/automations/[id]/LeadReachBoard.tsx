"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { toast } from "sonner";
import { Play, Settings, Database, Search, ArrowRight } from "lucide-react";
import { MOCK_LEADS_DATA } from "./mockData";
import { useRouter } from "next/navigation";

export default function LeadReachBoard() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    country: "united states",
    state: "california",
    seniority: "cxo",
    industry: "software development",
    size: "10"
  });

  const [results, setResults] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleRun = () => {
    setIsSearching(true);
    toast.info("Running LeadReach search...");
    setTimeout(() => {
      const sizeToFetch = parseInt(formData.size);
      const outputData = MOCK_LEADS_DATA.slice(0, sizeToFetch);
      
      setResults(outputData);
      setIsSearching(false);
      toast.success(`Found ${outputData.length} leads!`);
    }, 1500);
  };

  const handlePushToMailCraft = () => {
    if (results) {
      sessionStorage.setItem('mailcraft_leads', JSON.stringify(results));
      toast.success("Leads exported! Redirecting to MailCraft...");
      router.push('/automations/mailcraft');
    }
  };

  const filteredResults = results ? results.filter(lead => 
    lead.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    lead.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-6">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-slate-900 dark:text-white font-semibold text-base flex items-center gap-2">
                  <Settings size={18} className="text-sky-600 dark:text-[#00E5FF]" /> Query Parameters
                </h3>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">Country</label>
                  <select 
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23888\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                    className="appearance-none pr-8 cursor-pointer w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/5 text-sm text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none focus:border-sky-500"
                  >
                    <option value="united states">United States</option>
                    <option value="united kingdom">United Kingdom</option>
                    <option value="canada">Canada</option>
                    <option value="australia">Australia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">State</label>
                  <select 
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23888\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    className="appearance-none pr-8 cursor-pointer w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/5 text-sm text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none focus:border-sky-500"
                  >
                    <option value="california">California</option>
                    <option value="new york">New York</option>
                    <option value="texas">Texas</option>
                    <option value="florida">Florida</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">Seniority</label>
                  <select 
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23888\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                    value={formData.seniority}
                    onChange={(e) => setFormData({...formData, seniority: e.target.value})}
                    className="appearance-none pr-8 cursor-pointer w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/5 text-sm text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none focus:border-sky-500"
                  >
                    <option value="cxo">CXO / C-Level</option>
                    <option value="vp">Vice President</option>
                    <option value="director">Director</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">Industry</label>
                  <select 
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23888\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                    className="appearance-none pr-8 cursor-pointer w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/5 text-sm text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none focus:border-sky-500"
                  >
                    <option value="software development">Software Development</option>
                    <option value="retail">Retail</option>
                    <option value="financial services">Financial Services</option>
                    <option value="healthcare">Healthcare</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">Result Size</label>
                  <select 
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23888\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                    value={formData.size}
                    onChange={(e) => setFormData({...formData, size: e.target.value})}
                    className="appearance-none pr-8 cursor-pointer w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/5 text-sm text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none focus:border-sky-500"
                  >
                    <option value="5">5 Leads</option>
                    <option value="10">10 Leads</option>
                    <option value="15">15 Leads</option>
                    <option value="20">20 Leads</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">Consent Source <span className="text-rose-500">*</span></label>
                  <Select 
                    value=""
                    onChange={() => {}}
                    required
                    options={[
                      { value: "b2b", label: "B2B Legitimate Interest" },
                      { value: "purchased", label: "Purchased/Opt-In List" }
                    ]}
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Required for compliance tracking.</p>
                </div>
             </div>
             
             <button 
               onClick={handleRun}
               disabled={isSearching}
               className="mt-6 w-full bg-sky-600 hover:bg-sky-700 dark:bg-[#00E5FF] dark:text-[#020617] dark:hover:bg-[#00E5FF]/90 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
             >
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-slate-900/20 dark:border-white/20 border-t-slate-900 dark:border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Play size={16} />
                )}
                {isSearching ? 'Running...' : 'Execute Workflow'}
             </button>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-6 h-full min-h-[500px] flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-slate-900 dark:text-white font-semibold text-base flex items-center gap-2">
                <Database size={18} className="text-emerald-600 dark:text-[#10B981]" /> Execution Results
              </h3>
              
              <div className="flex items-center gap-4">
                {results && (
                  <>
                    <button 
                      onClick={handlePushToMailCraft}
                      className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      Push to MailCraft <ArrowRight size={14} />
                    </button>
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Filter leads..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/5 rounded-lg outline-none focus:border-sky-500 w-full sm:w-48 text-slate-900 dark:text-white"
                      />
                    </div>
                  </>
                )}
                {filteredResults && (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-[#10B981] bg-emerald-50 dark:bg-[#10B981]/10 px-2 py-1 rounded-md whitespace-nowrap">
                    {filteredResults.length} found
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex-1 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/5 rounded-lg p-4 overflow-auto">
              {!results && !isSearching && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-[#666]">
                  <Database size={32} className="mb-3 opacity-50" />
                  <p className="text-sm">Run the workflow to see enriched lead data here.</p>
                </div>
              )}
              
              {isSearching && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-[#666] space-y-4">
                  <div className="w-8 h-8 border-2 border-sky-600/20 dark:border-[#00E5FF]/20 border-t-sky-600 dark:border-t-[#00E5FF] rounded-full animate-spin"></div>
                  <p className="text-sm animate-pulse">Querying external databases...</p>
                </div>
              )}
              
              {filteredResults && !isSearching && (
                <div className="space-y-4">
                  {filteredResults.map((lead, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-lg p-4 hover:border-slate-300 dark:hover:border-white/10 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white capitalize text-lg">{lead.fullName}</h4>
                          <p className="text-sm text-sky-600 dark:text-[#00E5FF] font-medium mb-3">{lead.jobTitle} @ {lead.companyName}</p>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded whitespace-nowrap">
                          {lead.companySize} employees
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-xs mb-4">
                        <div>
                          <span className="text-slate-400 dark:text-[#666] block mb-0.5">Industry</span>
                          <span className="text-slate-700 dark:text-slate-300 capitalize">{lead.companyIndustry}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 dark:text-[#666] block mb-0.5">Location</span>
                          <span className="text-slate-700 dark:text-slate-300 capitalize truncate block" title={lead.companyLocation}>{lead.companyLocation}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 dark:text-[#666] block mb-0.5">Website</span>
                          <span className="text-slate-700 dark:text-slate-300">{lead.companyWebsite || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 dark:text-[#666] block mb-0.5">Founded</span>
                          <span className="text-slate-700 dark:text-slate-300">{lead.companyFounded || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 dark:text-[#666] block mb-0.5">Seniority</span>
                          <span className="text-slate-700 dark:text-slate-300 uppercase">{lead.seniorityLabel || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 dark:text-[#666] block mb-0.5">Tenure Start</span>
                          <span className="text-slate-700 dark:text-slate-300">{lead.jobTenureStart || 'N/A'}</span>
                        </div>
                      </div>

                      <details className="text-xs group/details border-t border-slate-200 dark:border-white/5 pt-3">
                        <summary className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer font-medium outline-none transition-colors">
                          View All Data Points
                        </summary>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 mt-4">
                           <div>
                             <span className="text-slate-400 dark:text-[#666] block mb-1.5 font-medium">Social Links</span>
                             <div className="flex flex-wrap gap-2">
                               {lead.linkedinPersonal && <a href={`https://${lead.linkedinPersonal}`} target="_blank" className="text-sky-600 dark:text-sky-400 hover:underline">LinkedIn</a>}
                               {lead.twitterUrl && <a href={`https://${lead.twitterUrl}`} target="_blank" className="text-sky-600 dark:text-sky-400 hover:underline">Twitter</a>}
                               {lead.facebookUrl && <a href={`https://${lead.facebookUrl}`} target="_blank" className="text-sky-600 dark:text-sky-400 hover:underline">Facebook</a>}
                               {lead.githubUrl && <a href={`https://${lead.githubUrl}`} target="_blank" className="text-sky-600 dark:text-sky-400 hover:underline">GitHub</a>}
                               {!lead.linkedinPersonal && !lead.twitterUrl && !lead.facebookUrl && !lead.githubUrl && <span className="text-slate-500">None</span>}
                             </div>
                           </div>
                           <div>
                             <span className="text-slate-400 dark:text-[#666] block mb-1.5 font-medium">Contact Availability</span>
                             <div className="flex flex-wrap gap-2">
                               <span className={lead.workEmailAvailable ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-400 dark:text-slate-500"}>Work Email</span>
                               <span className={lead.personalEmailAvailable ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-400 dark:text-slate-500"}>Personal Email</span>
                               <span className={lead.mobilePhoneAvailable ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-400 dark:text-slate-500"}>Mobile Phone</span>
                             </div>
                           </div>
                           <div className="md:col-span-2">
                             <span className="text-slate-400 dark:text-[#666] block mb-1.5 font-medium">Skills</span>
                             <div className="flex flex-wrap gap-1.5">
                               {lead.skills?.slice(0, 15).map((s: string) => (
                                 <span key={s} className="bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-white/5">{s}</span>
                               ))}
                               {lead.skills?.length > 15 && <span className="text-slate-500 dark:text-slate-400 px-1 py-0.5">+{lead.skills.length - 15} more</span>}
                               {(!lead.skills || lead.skills.length === 0) && <span className="text-slate-500">No skills listed</span>}
                             </div>
                           </div>
                           <div className="md:col-span-2">
                             <span className="text-slate-400 dark:text-[#666] block mb-1.5 font-medium">Interests</span>
                             <div className="flex flex-wrap gap-1.5">
                               {lead.interests?.slice(0, 15).map((i: string) => (
                                 <span key={i} className="bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-white/5">{i}</span>
                               ))}
                               {lead.interests?.length > 15 && <span className="text-slate-500 dark:text-slate-400 px-1 py-0.5">+{lead.interests.length - 15} more</span>}
                               {(!lead.interests || lead.interests.length === 0) && <span className="text-slate-500">No interests listed</span>}
                             </div>
                           </div>
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { toast } from "sonner";
import { Mail, Check, Bot, Settings, Users, ArrowLeft, RefreshCw, Send, MoveRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MailCraftBoard() {
  const router = useRouter();
  
  const [leads, setLeads] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const storedLeads = sessionStorage.getItem('mailcraft_leads');
      if (storedLeads) {
        try {
          return JSON.parse(storedLeads);
        } catch (e) {
          console.error("Failed to parse stored leads");
        }
      }
    }
    return [];
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [sequences, setSequences] = useState<any[] | null>(null);

  const handleGenerate = () => {
    if (leads.length === 0) {
      toast.error("No leads to process. Go to LeadReach to import leads.");
      return;
    }

    
    setIsGenerating(true);
    toast.info("Crafting personalized email sequences...");
    
    setTimeout(() => {
      const generated = leads.map(lead => {
        const company = lead.companyName || "your company";
        const role = lead.jobTitle || "your role";
        const firstName = lead.firstName || lead.fullName?.split(' ')[0] || 'there';
        const industry = lead.companyIndustry || 'tech';
        
        return {
          leadId: lead.id || lead.fullName,
          fullName: lead.fullName,
          companyName: company,
          emails: [
            {
              step: 1,
              subject: `Quick question about ${company}'s growth strategy`,
              body: `Hi ${firstName},\n\nI noticed the impressive work you're doing as ${role} at ${company}. We've been helping similar companies in the ${industry} space scale their operations efficiently.\n\nWould you be open to a brief chat next week to share some insights?\n\nBest,\nKnoxified Team`
            },
            {
              step: 2,
              subject: `Following up: ${company} + Knoxified`,
              body: `Hi ${firstName},\n\nJust bumping this to the top of your inbox. I know things get busy at ${company}.\n\nOur platform recently helped another company in your space increase their efficiency by 35%. I'd love to show you how we could do the same for you.\n\nAre you available for a 10-minute call this Thursday?\n\nBest,\nKnoxified Team`
            },
            {
              step: 3,
              subject: `Any thoughts on this?`,
              body: `Hi ${firstName},\n\nI wanted to share a quick case study of how a company similar to ${company} leveraged our tools to streamline their operations.\n\n[Link to Case Study]\n\nLet me know if this resonates with what you're currently prioritizing.\n\nBest,\nKnoxified Team`
            },
            {
              step: 4,
              subject: `Closing the loop`,
              body: `Hi ${firstName},\n\nI haven't heard back, so I assume improving this area isn't a top priority for ${company} right now. I'll stop reaching out for now.\n\nIf things change, feel free to get in touch!\n\nBest,\nKnoxified Team`
            }
          ]
        };
      });
      
      setSequences(generated);
      setIsGenerating(false);
      toast.success("Successfully generated email sequences!");
    }, 2500);
  };

  const clearLeads = () => {
    sessionStorage.removeItem('mailcraft_leads');
    setLeads([]);
    setSequences(null);
    toast.success("Leads cleared");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-900 dark:text-white font-semibold text-base flex items-center gap-2">
            <Users size={18} className="text-sky-600 dark:text-[#00E5FF]" /> Lead Input Table
          </h3>
          <div className="flex items-center gap-3">
            {leads.length > 0 && (
              <button onClick={clearLeads} className="text-xs text-red-500 hover:text-red-600 font-medium px-3 py-1.5 bg-red-50 dark:bg-red-500/10 rounded-lg transition-colors">
                Clear Leads
              </button>
            )}
            <button 
              onClick={() => router.push('/automations/leadreach')}
              className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-[#020617] dark:hover:bg-[#020617]/70 text-slate-700 dark:text-slate-300 font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-slate-200 dark:border-white/5"
            >
              <ArrowLeft size={14} /> Back to LeadReach
            </button>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/5 rounded-lg overflow-x-auto">
          {leads.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-[#888]">
              <Users size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">No leads loaded into the table.</p>
              <p className="text-xs mt-1 opacity-70">Go back to LeadReach to push leads here.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
              <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-100/50 dark:bg-[#0F172A]/50 border-b border-slate-200 dark:border-white/5">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Job Title</th>
                  <th className="px-4 py-3 font-semibold">Industry</th>
                  <th className="px-4 py-3 font-semibold">LinkedIn</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, idx) => (
                  <tr key={idx} className="border-b border-slate-200 dark:border-white/5 last:border-0 hover:bg-white dark:hover:bg-[#0F172A] transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white capitalize">{lead.fullName || 'N/A'}</td>
                    <td className="px-4 py-3 capitalize">{lead.companyName || 'N/A'}</td>
                    <td className="px-4 py-3 text-xs">{lead.jobTitle || 'N/A'}</td>
                    <td className="px-4 py-3 capitalize">{lead.companyIndustry || 'N/A'}</td>
                    <td className="px-4 py-3 text-xs">
                      {lead.linkedinPersonal ? (
                        <a href={`https://${lead.linkedinPersonal}`} target="_blank" className="text-sky-600 dark:text-sky-400 hover:underline">Profile</a>
                      ) : (
                        <span className="text-slate-400">Missing</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-6 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:flex-1 lg:max-w-xl">
             <div>
               <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Campaign Goal</label>
               <Select 
                 value="Book a Meeting"
                 onChange={() => {}}
                 options={[
                   { value: "Book a Meeting", label: "Book a Meeting" },
                   { value: "Share Content/Value", label: "Share Content/Value" },
                   { value: "Event Invitation", label: "Event Invitation" }
                 ]}
               />
             </div>
             <div>
               <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Tone & Voice</label>
               <Select 
                 value="Professional & Direct"
                 onChange={() => {}}
                 options={[
                   { value: "Professional & Direct", label: "Professional & Direct" },
                   { value: "Casual & Friendly", label: "Casual & Friendly" },
                   { value: "Data-Driven", label: "Data-Driven" }
                 ]}
               />
             </div>
           </div>
           
           <button 
             onClick={handleGenerate}
             disabled={isGenerating || leads.length === 0}
             className="w-full lg:w-auto bg-emerald-600 hover:bg-emerald-700 dark:bg-[#10B981] dark:text-[#020617] dark:hover:bg-[#10B981]/90 text-white font-medium px-8 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-70 disabled:pointer-events-none whitespace-nowrap"
           >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-slate-900/20 dark:border-white/20 border-t-slate-900 dark:border-t-white rounded-full animate-spin"></div>
              ) : (
                <Bot size={16} />
              )}
              {isGenerating ? 'Crafting Emails...' : 'Generate Sequences'}
           </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-6 min-h-[600px] flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-slate-900 dark:text-white font-semibold text-base flex items-center gap-2">
            <Mail size={18} className="text-indigo-600 dark:text-indigo-400" /> Generated Campaigns
          </h3>
          
          {sequences && (
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-md">
                {sequences.length} sequences ready
              </span>
              <button className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-1 transition-colors">
                <Send size={14} /> Send All to Drafts
              </button>
            </div>
          )}
        </div>
        
        <div className="flex-1 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/5 rounded-lg p-4 overflow-auto">
          {!sequences && !isGenerating && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-[#666]">
              <Bot size={40} className="mb-4 opacity-40" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Ready to write.</p>
              <p className="text-xs text-center max-w-sm mt-2 opacity-70">
                Import leads and click &quot;Generate Sequences&quot; to automatically craft personalized 4-step email campaigns based on each prospect&apos;s background.
              </p>
            </div>
          )}
          
          {isGenerating && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-[#666] space-y-4">
              <div className="w-10 h-10 border-2 border-indigo-600/20 dark:border-indigo-400/20 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
              <div className="text-center">
                <p className="text-sm font-medium animate-pulse text-indigo-600 dark:text-indigo-400">Analyzing lead profiles...</p>
                <p className="text-xs mt-1 opacity-60">Writing personalized hooks and subject lines</p>
              </div>
            </div>
          )}
          
          {sequences && !isGenerating && (
            <div className="space-y-8">
              {sequences.map((seq, sIdx) => (
                <div key={sIdx} className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-slate-100 dark:bg-[#020617]/50 border-b border-slate-200 dark:border-white/5 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm">
                        {seq.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white capitalize text-sm">{seq.fullName}</h4>
                        <p className="text-xs text-slate-500 capitalize">{seq.companyName}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-200 dark:bg-white/10 px-2 py-0.5 rounded">
                      4 Steps
                    </span>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    {seq.emails.map((email: any, eIdx: number) => (
                      <div key={eIdx} className="border border-slate-100 dark:border-white/5 rounded-lg p-4 bg-slate-50/50 dark:bg-[#020617]/30">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                            {email.step}
                          </span>
                          <h5 className="font-medium text-sm text-slate-800 dark:text-slate-200">
                            <span className="text-slate-400 dark:text-slate-500 font-normal mr-2">Subject:</span>
                            {email.subject}
                          </h5>
                        </div>
                        <div className="pl-9">
                          <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                            {email.body}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

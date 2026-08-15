"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Mail, Check, Bot, Settings, Users, ArrowLeft, RefreshCw, Send, MoveRight, ChevronDown, Sparkles, BrainCircuit } from "lucide-react";
import { useRouter } from "next/navigation";

const MOCK_LEADS = [
  {
    id: "1",
    fullName: "Chester Hurtado",
    firstName: "Chester",
    jobTitle: "CFO",
    companyName: "TradeWorks",
    companyIndustry: "Financial Services",
    linkedinPersonal: "linkedin.com/in/chesterhurtado",
  },
  {
    id: "2",
    fullName: "Sumeet Gagneja",
    firstName: "Sumeet",
    jobTitle: "CFO",
    companyName: "Rambus",
    companyIndustry: "Semiconductor",
    linkedinPersonal: "linkedin.com/in/gagneja",
  },
  {
    id: "3",
    fullName: "Shawn Livermore",
    firstName: "Shawn",
    jobTitle: "CTO",
    companyName: "Carvana",
    companyIndustry: "E-commerce",
    linkedinPersonal: "linkedin.com/in/shawnlivermore",
  }
];

export default function MailCraftBoard() {
  const router = useRouter();
  
  const [leads, setLeads] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedLeads = sessionStorage.getItem('mailcraft_leads');
        if (storedLeads) {
          return JSON.parse(storedLeads);
        }
      } catch (e) {
        console.error("Failed to parse stored leads");
      }
    }
    return [];
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [sequences, setSequences] = useState<any[] | null>(null);
  
  const [formData, setFormData] = useState({
    goal: "book_meeting",
    tone: "professional",
    model: "gemini_pro"
  });

  const loadMockLeads = () => {
    setLeads(MOCK_LEADS);
    toast.success("Loaded 3 mock leads for testing.");
  };

  const handleGenerate = () => {
    if (leads.length === 0) {
      toast.error("No leads to process. Please load leads first.");
      return;
    }
    
    setIsGenerating(true);
    setSequences(null);
    toast.info("Initializing AI generation...");
    
    setTimeout(() => {
      const generated = leads.map(lead => {
        const company = lead.companyName || "your company";
        const role = lead.jobTitle || "your role";
        const firstName = lead.firstName || lead.fullName?.split(' ')[0] || 'there';
        
        return {
          leadId: lead.id,
          fullName: lead.fullName,
          companyName: company,
          emails: [
            {
              step: 1,
              subject: `Ideas for ${company}'s growth, ${firstName}`,
              body: `Hi ${firstName},\n\nI noticed your recent transition into the ${role} role at ${company} and the impressive growth you've had in the ${lead.companyIndustry || 'tech'} space.\n\nI'm reaching out because we help similar leaders streamline their operations. I'd love to show you how our platform could save your team 20+ hours a week.\n\nAre you open to a brief chat next Tuesday?\n\nBest,\nAlex`
            },
            {
              step: 2,
              subject: `Re: Ideas for ${company}'s growth, ${firstName}`,
              body: `Hi ${firstName},\n\nJust floating this to the top of your inbox. I know as a ${role}, your time is extremely valuable.\n\nHere is a quick 2-minute video showing exactly how we helped a similar company in your industry reduce their overhead by 15% in 30 days.\n\nLet me know if you have a moment this week.\n\nBest,\nAlex`
            },
            {
              step: 3,
              subject: `Quick question regarding ${company}`,
              body: `Hi ${firstName},\n\nI haven't heard back, so I assume improving this specific workflow isn't a top priority for ${company} right now.\n\nIf anything changes, please feel free to reach out.\n\nBest,\nAlex`
            }
          ]
        };
      });
      
      setSequences(generated);
      setIsGenerating(false);
      toast.success("Personalized sequences crafted successfully!");
    }, 2500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Column: Configuration & Leads */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-6 text-lg">
            <BrainCircuit className="w-5 h-5 text-indigo-500" />
            MailCraft AI Engine
          </h3>
          
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Campaign Goal</label>
              <div className="relative group">
                <select 
                  value={formData.goal}
                  onChange={(e) => setFormData({...formData, goal: e.target.value})}
                  className="w-full appearance-none bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white transition-all duration-300 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.15)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                >
                  <option value="book_meeting">Book a Meeting</option>
                  <option value="share_value">Share Content / Value</option>
                  <option value="event_invite">Event Invitation</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500 group-hover:text-indigo-500 transition-colors">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tone & Voice</label>
              <div className="relative group">
                <select 
                  value={formData.tone}
                  onChange={(e) => setFormData({...formData, tone: e.target.value})}
                  className="w-full appearance-none bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white transition-all duration-300 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.15)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                >
                  <option value="professional">Professional & Direct</option>
                  <option value="casual">Casual & Friendly</option>
                  <option value="data_driven">Data-Driven & Analytical</option>
                  <option value="provocative">Provocative & Bold</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500 group-hover:text-indigo-500 transition-colors">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">LLM Model</label>
              <div className="relative group">
                <select 
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                  className="w-full appearance-none bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white transition-all duration-300 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.15)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                >
                  <option value="gemini_pro">Gemini 1.5 Pro</option>
                  <option value="gemini_flash">Gemini 1.5 Flash</option>
                  <option value="claude">Claude 3.5 Sonnet</option>
                  <option value="gpt4o">GPT-4o</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500 group-hover:text-indigo-500 transition-colors">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || leads.length === 0}
            className="w-full mt-8 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-medium px-4 py-3.5 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] disabled:opacity-50 disabled:shadow-none hover:-translate-y-0.5"
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Sparkles size={18} fill="currentColor" />
            )}
            {isGenerating ? "Crafting Sequences..." : "Generate AI Emails"}
          </button>
        </div>

        {/* Input Data Summary Card */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              Input Leads
            </h3>
            <span className="text-xs font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md">
              {leads.length} TOTAL
            </span>
          </div>

          {leads.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-300 dark:border-white/10 rounded-xl bg-slate-50/50 dark:bg-[#020617]/50">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">No leads loaded in session.</p>
              <button 
                onClick={loadMockLeads}
                className="text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/10 transition-colors text-slate-700 dark:text-slate-200"
              >
                Load Mock Lead Data
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
              {leads.map((lead, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#020617]">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {lead.fullName?.charAt(0) || 'U'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{lead.fullName}</p>
                    <p className="text-xs text-slate-500 truncate">{lead.jobTitle} at {lead.companyName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Results & Sequences */}
      <div className="lg:col-span-2 flex flex-col h-[800px] bg-slate-50 dark:bg-[#0B1121] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm relative">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#0F172A] flex justify-between items-center z-10">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            Generated Campaigns
          </h3>
          {sequences && (
            <button className="flex items-center gap-2 text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors">
              <Send className="w-3.5 h-3.5" />
              Deploy to Drafts
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto bg-[#FAFAFA] dark:bg-[#090D1A] p-6 custom-scrollbar">
          {!isGenerating && !sequences && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-[#555] max-w-sm mx-auto text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
                <Mail size={28} className="text-indigo-400 dark:text-indigo-500" />
              </div>
              <p className="text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Ready to Draft</p>
              <p className="text-xs leading-relaxed">Configure your prompt parameters and trigger the AI engine to generate highly personalized 3-step sequences.</p>
            </div>
          )}
          
          {isGenerating && (
            <div className="h-full flex flex-col items-center justify-center space-y-5">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-200 dark:border-white/10 rounded-full"></div>
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
                <Sparkles className="w-5 h-5 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 animate-pulse">Analyzing profiles & drafting copy...</p>
                <p className="text-xs text-slate-500">Parsing LinkedIn context, generating hooks</p>
              </div>
            </div>
          )}

          {sequences && !isGenerating && (
            <div className="space-y-6">
              {sequences.map((seq, sIdx) => (
                <div key={sIdx} className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-colors">
                  {/* Sequence Header */}
                  <div className="bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5 p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-inner">
                        {seq.fullName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{seq.fullName}</h4>
                        <p className="text-xs font-medium text-slate-500">{seq.companyName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-white/10 px-2 py-1 rounded">
                        3 Steps
                      </span>
                    </div>
                  </div>
                  
                  {/* Email Steps */}
                  <div className="p-5 space-y-5">
                    {seq.emails.map((email: any, eIdx: number) => (
                      <div key={eIdx} className="relative pl-6">
                        {/* Timeline Line */}
                        {eIdx !== seq.emails.length - 1 && (
                          <div className="absolute left-[11px] top-8 bottom-[-20px] w-0.5 bg-slate-200 dark:bg-white/10"></div>
                        )}
                        
                        {/* Step Indicator */}
                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-slate-100 dark:bg-[#1E293B] border border-slate-300 dark:border-white/20 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 z-10">
                          {email.step}
                        </div>
                        
                        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm ml-2">
                          <div className="mb-3 pb-3 border-b border-slate-100 dark:border-white/5">
                            <h5 className="font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                              <span className="text-slate-400 dark:text-slate-500 font-normal">Subject:</span>
                              {email.subject}
                            </h5>
                          </div>
                          <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                            {email.body}
                          </div>
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

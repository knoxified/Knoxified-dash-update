"use client";

import { Box, Lock, LayoutGrid, Slack, Github, Calendar, MessageSquare, Plus, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState("oauth");

  const oauthIntegrations = [
    { id: "google", name: "Google Workspace", icon: Box, status: "connected", desc: "Connect Gmail, Calendar, and Drive.", brandColor: "text-blue-500" },
    { id: "microsoft", name: "Microsoft 365", icon: LayoutGrid, status: "disconnected", desc: "Connect Outlook and Teams.", brandColor: "text-sky-500" },
    { id: "slack", name: "Slack", icon: Slack, status: "connected", desc: "Send notifications and alerts to channels.", brandColor: "text-purple-500" },
    { id: "github", name: "GitHub", icon: Github, status: "disconnected", desc: "Sync repositories and track issues.", brandColor: "text-slate-900 dark:text-white" },
    { id: "notion", name: "Notion", icon: Calendar, status: "disconnected", desc: "Sync knowledge base and documents.", brandColor: "text-slate-800 dark:text-slate-200" },
    { id: "meta", name: "Meta (Facebook/IG)", icon: MessageSquare, status: "disconnected", desc: "Connect ad accounts and pages.", brandColor: "text-blue-600" },
    { id: "linkedin", name: "LinkedIn", icon: MessageSquare, status: "disconnected", desc: "Automate outreach and post tracking.", brandColor: "text-sky-600" },
  ];

  const apiIntegrations = [
    { id: "openai", name: "OpenAI API", status: "configured", desc: "LLM powering conversational intelligence." },
    { id: "anthropic", name: "Anthropic API", status: "configured", desc: "Claude integration for advanced reasoning tasks." },
    { id: "elevenlabs", name: "ElevenLabs API", status: "missing", desc: "Text-to-speech for realistic voice agents." },
    { id: "twilio", name: "Twilio API", status: "configured", desc: "SMS and programmatic voice networking." },
    { id: "stripe", name: "Stripe API", status: "missing", desc: "Payment link generation and billing data." },
  ];

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
          Integrations & Providers
        </h1>
        <p className="text-slate-500 dark:text-[#888] text-sm">
          Connect your workspace to external platforms, AI models, and APIs to empower your automations.
        </p>
      </div>

      <div className="flex bg-slate-100 dark:bg-[#020617] p-1 rounded-lg border border-slate-200 dark:border-white/5 w-max mb-6">
        <button 
          onClick={() => setActiveTab("oauth")}
          className={`text-xs font-semibold px-4 py-2 rounded-md transition-colors ${activeTab === "oauth" ? 'bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-[#666] hover:text-slate-700 dark:hover:text-[#EDEDED]'}`}
        >
          App Connections (OAuth)
        </button>
        <button 
          onClick={() => setActiveTab("api")}
          className={`text-xs font-semibold px-4 py-2 rounded-md transition-colors ${activeTab === "api" ? 'bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-[#666] hover:text-slate-700 dark:hover:text-[#EDEDED]'}`}
        >
          Developer APIs & Keys
        </button>
      </div>

      {activeTab === "oauth" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {oauthIntegrations.map((app) => {
            const Icon = app.icon;
            return (
              <div key={app.id} className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-5 flex flex-col hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/5 flex items-center justify-center ${app.brandColor}`}>
                    <Icon size={20} />
                  </div>
                  {app.status === 'connected' ? (
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-[#10B981] bg-emerald-50 dark:bg-[#10B981]/10 px-2 py-1 rounded-md">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 dark:bg-[#10B981] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 dark:bg-[#10B981]"></span>
                      </span>
                      Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#888] bg-slate-100 dark:bg-[#020617] px-2 py-1 rounded-md">
                      Disconnected
                    </span>
                  )}
                </div>
                <h3 className="text-slate-900 dark:text-white font-semibold text-base mb-1">{app.name}</h3>
                <p className="text-slate-500 dark:text-[#888] text-xs mb-6 flex-1">{app.desc}</p>
                <button 
                onClick={() => {
                  if (app.status === 'connected') {
                    toast.info(`Managing connection to ${app.name}...`);
                  } else {
                    toast.success(`Starting OAuth flow for ${app.name}...`);
                  }
                }}
                className={`w-full py-2 rounded-lg text-sm font-semibold transition-transform active:scale-[0.98] ${
                  app.status === 'connected' 
                    ? 'bg-slate-100 dark:bg-[#020617] text-slate-700 dark:text-[#EDEDED] hover:bg-slate-200 dark:hover:bg-white/5 border border-slate-200 dark:border-white/5' 
                    : 'bg-sky-600 hover:bg-sky-700 dark:bg-[#00E5FF] dark:text-[#020617] dark:hover:bg-[#00E5FF]/90 text-white'
                }`}>
                  {app.status === 'connected' ? 'Manage Connection' : 'Connect Account'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "api" && (
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <div>
                <h3 className="text-slate-900 dark:text-white font-semibold">API Credentials map</h3>
                <p className="text-slate-500 dark:text-[#888] text-sm">Securely store API keys that your automations use.</p>
             </div>
             <button onClick={() => toast.info('Opening configuration modal...')} className="bg-sky-600 dark:bg-[#00E5FF] text-white dark:text-[#020617] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sky-700 dark:hover:bg-[#00E5FF]/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
               <Plus size={16} /> Add Custom Key
             </button>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-white/5">
            {apiIntegrations.map((api) => (
              <div key={api.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/5 flex items-center justify-center shrink-0">
                    <Lock size={16} className="text-slate-500 dark:text-[#888]" />
                  </div>
                  <div>
                    <h4 className="text-slate-900 dark:text-white font-medium text-sm mb-1">{api.name}</h4>
                    <p className="text-slate-500 dark:text-[#888] text-xs">{api.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/5 rounded-md px-3 py-1.5 min-w-[200px]">
                    <span className="text-slate-400 dark:text-[#666] text-xs font-mono">
                      {api.status === 'configured' ? 'sk_live_********************' : 'No key provided'}
                    </span>
                  </div>
                  <button onClick={() => toast.info(`Configuring ${api.name}...`)} className="text-sky-600 dark:text-[#00E5FF] text-sm font-medium hover:underline transition-transform active:scale-95">
                    {api.status === 'configured' ? 'Edit' : 'Configure'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

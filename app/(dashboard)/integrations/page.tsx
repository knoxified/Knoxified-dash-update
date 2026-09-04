"use client";
import { Box, Lock, LayoutGrid, Slack, Github, Calendar, MessageSquare, Plus, Check, Phone } from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

function IntegrationsPageInner() {
  const [activeTab, setActiveTab] = useState("oauth");
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [virtualNumber, setVirtualNumber] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  const supabase = createClient();

  // Handle the redirect back from oauth.knoxified.org after a connect
  // attempt (?provider=google&status=connected|failed|invalid_state|...).
  useEffect(() => {
    const status = searchParams.get('status');
    const provider = searchParams.get('provider');
    if (!status) return;

    const providerLabel = baseOauthIntegrations.find(a => a.id === provider)?.name || provider || 'App';

    if (status === 'connected') {
      toast.success(`${providerLabel} connected successfully.`);
    } else if (status === 'already_used') {
      toast.info('That connection link was already used — try connecting again.');
    } else {
      toast.error(`Couldn't connect ${providerLabel}. Please try again.`);
    }

    // Strip the query params so a page refresh doesn't re-show the toast.
    router.replace('/integrations');
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: userIntegrations } = await supabase
        .from('oauth_connections')
        .select('*')
        .eq('user_id', user.id);
        
      const { data: numberMappings } = await supabase
        .from('phone_number_mappings')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);
        
      if (isMounted) {
        setIntegrations(userIntegrations || []);
        if (numberMappings && numberMappings.length > 0) {
          setVirtualNumber(numberMappings[0]);
        }
        setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [supabase]);

  const initiateOAuthFlow = async (appId: string, appName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("User not authenticated.");
      return;
    }

    toast.success(`Redirecting to connect ${appName}...`);

    // knoxified-auth owns session creation and building the real provider
    // consent URL — the dashboard just kicks off the redirect and tells it
    // where to send the user back to when it's done.
    const returnTo = encodeURIComponent(window.location.pathname);
    window.location.href = `https://oauth.knoxified.org/auth/${appId}/start?user_id=${user.id}&return_to=${returnTo}`;
  };

  const baseOauthIntegrations = [
    { id: "google", name: "Google Workspace", icon: Box, desc: "Connect Gmail, Calendar, and Drive.", brandColor: "text-blue-500" },
    { id: "microsoft", name: "Microsoft 365", icon: LayoutGrid, desc: "Connect Outlook and Teams.", brandColor: "text-sky-500" },
    { id: "slack", name: "Slack", icon: Slack, desc: "Send notifications and alerts to channels.", brandColor: "text-purple-500" },
    { id: "github", name: "GitHub", icon: Github, desc: "Sync repositories and track issues.", brandColor: "text-slate-900 dark:text-white" },
    { id: "notion", name: "Notion", icon: Calendar, desc: "Sync knowledge base and documents.", brandColor: "text-slate-800 dark:text-slate-200" },
    { id: "meta", name: "Meta (Facebook/IG)", icon: MessageSquare, desc: "Connect ad accounts and pages.", brandColor: "text-blue-600" },
    { id: "linkedin", name: "LinkedIn", icon: MessageSquare, desc: "Automate outreach and post tracking.", brandColor: "text-sky-600" },
  ];

  const oauthIntegrations = baseOauthIntegrations.map(app => {
    const isConnected = integrations.some(i => i.provider === app.id && i.status === 'active');
    return { ...app, status: isConnected ? 'connected' : 'disconnected' };
  });

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
      
      {!loading && virtualNumber && (
        <div className="glass-card rounded-xl p-5 mb-8 flex items-center justify-between relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-500">
           <div className="absolute top-0 right-0 w-40 h-40 bg-[color:var(--accent)]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
           <div className="flex items-center gap-4 relative z-10">
              <div className="w-11 h-11 rounded-full bg-[color:var(--accent)]/10 flex items-center justify-center text-[color:var(--accent)] shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                <Phone size={20} />
              </div>
              <div>
                <h3 className="text-slate-900 dark:text-white font-semibold mb-1">Virtual Phone Number</h3>
                <p className="text-sm font-mono text-slate-700 dark:text-slate-300">{virtualNumber.phone_number}</p>
              </div>
           </div>
           <div className="relative z-10">
             {virtualNumber.is_active ? (
               <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-[#10B981] bg-emerald-50 dark:bg-[#10B981]/10 px-3 py-1.5 rounded-md">
                 Active
               </span>
             ) : (
               <button onClick={() => toast.success('Reactivation request sent.')} className="bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-400 text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                 Reactivate Number
               </button>
             )}
           </div>
        </div>
      )}

      <div className="flex glass-card p-1 rounded-lg w-max mb-6">
        <button 
          onClick={() => setActiveTab("oauth")}
          className={`text-xs font-semibold px-4 py-2 rounded-md transition-all ${activeTab === "oauth" ? 'bg-[color:var(--accent)]/15 text-[color:var(--accent)] shadow-[0_0_10px_rgba(0,229,255,0.15)]' : 'text-slate-500 dark:text-[#666] hover:text-slate-700 dark:hover:text-[#EDEDED]'}`}
        >
          App Connections (OAuth)
        </button>
        <button 
          onClick={() => setActiveTab("api")}
          className={`text-xs font-semibold px-4 py-2 rounded-md transition-all ${activeTab === "api" ? 'bg-[color:var(--accent)]/15 text-[color:var(--accent)] shadow-[0_0_10px_rgba(0,229,255,0.15)]' : 'text-slate-500 dark:text-[#666] hover:text-slate-700 dark:hover:text-[#EDEDED]'}`}
        >
          Developer APIs & Keys
        </button>
      </div>

      {activeTab === "oauth" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {oauthIntegrations.map((app, idx) => {
            const Icon = app.icon;
            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                className="glass-card card-hover rounded-xl p-5 flex flex-col"
              >
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
                    initiateOAuthFlow(app.id, app.name);
                  }
                }}
                className={`w-full py-2 rounded-lg text-sm font-semibold transition-all active:scale-[0.98] ${
                  app.status === 'connected' 
                    ? 'bg-slate-100 dark:bg-[#020617] text-slate-700 dark:text-[#EDEDED] hover:bg-slate-200 dark:hover:bg-white/5 border border-slate-200 dark:border-white/5'
                    : 'bg-[color:var(--accent)] hover:opacity-90 text-slate-900 shadow-[0_0_15px_rgba(0,229,255,0.25)]'
                }`}>
                  {app.status === 'connected' ? 'Manage Connection' : 'Connect Account'}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {activeTab === "api" && (
        <div className="glass-card rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="p-6 border-b border-slate-200 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <div>
                <h3 className="text-slate-900 dark:text-white font-semibold">API Credentials map</h3>
                <p className="text-slate-500 dark:text-[#888] text-sm">Securely store API keys that your automations use.</p>
             </div>
             <button onClick={() => toast.info('Opening configuration modal...')} className="bg-[color:var(--accent)] text-slate-900 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.25)]">
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
                  <button onClick={() => toast.info(`Configuring ${api.name}...`)} className="text-[color:var(--accent)] text-sm font-medium hover:underline transition-transform active:scale-95">
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

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse glass-card rounded-xl h-64 w-full max-w-5xl"></div>}>
      <IntegrationsPageInner />
    </Suspense>
  );
}


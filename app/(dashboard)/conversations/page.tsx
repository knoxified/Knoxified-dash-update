import { MessageSquare, Phone, MoreVertical, Play, Mic } from "lucide-react";

export default function ConversationsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
            Conversations Log
          </h1>
          <p className="text-slate-500 dark:text-[#888] text-sm">
            Audit and review chat transcripts and voice recordings from your AI agents.
          </p>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden flex flex-col md:flex-row shadow-sm">
        <div className="w-full md:w-80 border-r border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#020617]/50 flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-white/5">
            <input type="text" placeholder="Search logs..." className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-300 dark:border-white/10 text-sm text-slate-900 dark:text-white rounded-md px-3 py-2.5 focus:outline-none focus:border-sky-600 dark:border-[#00E5FF]" />
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {[
              { id: 1, type: 'chat', title: 'Support Chat', preview: 'I need help resetting my password...', time: '10m ago' },
              { id: 2, type: 'voice', title: 'Sales Call (Inbound)', preview: 'Voice mail transcript: Hi, calling about the...', time: '2h ago' },
              { id: 3, type: 'chat', title: 'Onboarding Agent', preview: 'Yes, let me show you how to do that.', time: '5h ago' },
              { id: 4, type: 'voice', title: 'Follow-up Call', preview: 'Call duration: 4m 32s', time: '1d ago' },
            ].map((msg) => (
              <div key={msg.id} className={`p-4 rounded-lg mb-1 cursor-pointer transition-colors ${msg.id === 2 ? 'bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10' : 'hover:bg-slate-200 dark:hover:bg-slate-200 dark:bg-white/5 border border-transparent'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {msg.type === 'chat' ? <MessageSquare size={14} className="text-emerald-600 dark:text-[#10B981]" /> : <Phone size={14} className="text-sky-600 dark:text-[#00E5FF]" />}
                    <span className="text-[13px] font-semibold text-slate-900 dark:text-white">{msg.title}</span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 dark:text-[#666]">{msg.time}</span>
                </div>
                <p className="text-[12px] text-slate-500 dark:text-[#888] truncate">{msg.preview}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-[#020617]/30 h-[600px] md:h-auto">
          {/* Mock Conversation header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#0F172A]/50">
             <div>
               <h3 className="text-slate-900 dark:text-white font-semibold text-base flex items-center gap-2">Sales Call (Inbound)</h3>
               <p className="text-sm text-slate-500 dark:text-[#888] mt-1">+1 (555) 019-2834 • 4m 32s • AI Rep: Alex</p>
             </div>
             <button className="p-2 text-slate-500 dark:text-[#888] hover:text-slate-900 dark:text-white transition-colors">
               <MoreVertical size={18} />
             </button>
          </div>
          
          {/* Transcript Panel */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* Audio snippet */}
            <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 p-4 rounded-xl flex items-center gap-4 mb-6">
              <button className="w-10 h-10 rounded-full bg-[#00E5FF] flex items-center justify-center text-slate-900 dark:text-white shrink-0 hover:bg-[#00E5FF]/90">
                <Play size={18} className="ml-1" />
              </button>
              <div className="flex-1">
                <div className="h-2 bg-white/10 rounded-full w-full overflow-hidden">
                  <div className="h-full bg-[#00E5FF] w-1/3"></div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#888] mt-2 font-medium">
                  <span>01:14</span>
                  <span>-03:18</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-white dark:bg-[#0F172A] border border-sky-600 dark:border-[#00E5FF]/30 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(79,140,255,0.2)]">
                <Mic size={14} className="text-sky-600 dark:text-[#00E5FF]" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-500 dark:text-[#888] mb-1">AI Agent - Alex</p>
                <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white/90 p-3.5 rounded-2xl rounded-tl-sm text-[14px] leading-relaxed shadow-sm">
                  Hi there! Thanks for calling Knoxified. My name is Alex, how can I help you today?
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                <Phone size={14} className="text-emerald-600 dark:text-[#10B981]" />
              </div>
              <div className="flex flex-col items-end">
                <p className="text-[12px] font-bold text-slate-500 dark:text-[#888] mb-1">Customer</p>
                <div className="bg-[#00E5FF] text-slate-900 dark:text-white p-3.5 rounded-2xl rounded-tr-sm text-[14px] leading-relaxed shadow-sm shadow-[#00E5FF]/20">
                  Yeah, hi. I&apos;m calling to understand if you guys integrate with Salesforce. I saw on your website that you do integrations but it wasn&apos;t clear.
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-white dark:bg-[#0F172A] border border-sky-600 dark:border-[#00E5FF]/30 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(79,140,255,0.2)]">
                <Mic size={14} className="text-sky-600 dark:text-[#00E5FF]" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-500 dark:text-[#888] mb-1">AI Agent - Alex</p>
                <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white/90 p-3.5 rounded-2xl rounded-tl-sm text-[14px] leading-relaxed shadow-sm">
                  I can definitely help with that. Yes, we offer a native Salesforce integration that allows our voice agents to log call transcripts, update lead statuses, and create tasks automatically. Would you like me to send you the documentation link, or schedule a quick demo with our technical team?
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

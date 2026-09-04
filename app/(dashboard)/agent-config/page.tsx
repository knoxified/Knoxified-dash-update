"use client";

import React, { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { getAgentConfig, updateAgentConfig } from "@/lib/actions/agent-config-actions";
import { Select } from "@/components/ui/Select";
import { scanWebsite } from "@/lib/actions/website-scan-actions";
import { listMyForwardingNumbers, addForwardingNumber, removeForwardingNumber } from "@/lib/actions/phone-mapping-actions";
import { VOICE_OPTIONS } from "@/lib/voice-options";
import { Save, Bot, MessageSquare, Building, Clock, Sliders, Info, List, Settings, Phone, Calendar, ArrowRight, User, CalendarPlus, X, Volume2, Brain, Globe, Loader2, Trash2, Plus, PhoneForwarded } from "lucide-react";

export default function AgentConfigPage() {
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"settings" | "conversations" | "numbers">("settings");
  
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleCaller, setScheduleCaller] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [selectedTranscripts, setSelectedTranscripts] = useState<number[]>([]);

  const [showLegalDisclaimer, setShowLegalDisclaimer] = useState(false);
  const [acceptedTermsCheckbox, setAcceptedTermsCheckbox] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasAccepted = localStorage.getItem('acceptedRecordingLaws');
      if (!hasAccepted) {
        setTimeout(() => setShowLegalDisclaimer(true), 0);
      }
    }
  }, []);

  const handleAcceptLegal = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('acceptedRecordingLaws', 'true');
    }
    setShowLegalDisclaimer(false);
  };

  const handleSelectTranscript = (index: number) => {
    setSelectedTranscripts(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleSelectAllTranscripts = () => {
    if (selectedTranscripts.length === mockTranscripts.length) {
      setSelectedTranscripts([]);
    } else {
      setSelectedTranscripts(mockTranscripts.map((_, i) => i));
    }
  };

  const [form, setForm] = useState({
    agent_persona: "",
    agent_greeting: "",
    organization_name: "",
    business_hours: "",
    temperature: "0.7",
    preferred_voice_id: VOICE_OPTIONS[0].id,
    memory_context: "",
  });

  const [scanUrl, setScanUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const [phoneNumbers, setPhoneNumbers] = useState<{ id: string; phone_number: string; is_active: boolean }[]>([]);
  const [newNumber, setNewNumber] = useState("");
  const [isNumbersLoading, setIsNumbersLoading] = useState(true);
  const [isAddingNumber, startAddingNumber] = useTransition();

  useEffect(() => {
    async function loadData() {
      const { agentConfig, voiceSettings, organizationWebsite, error } = await getAgentConfig();
      if (error && !error.includes("Row not found")) {
        toast.error("Failed to load settings: " + error);
      } else {
        setForm({
          agent_persona: voiceSettings?.agent_persona || "",
          agent_greeting: voiceSettings?.agent_greeting || "",
          organization_name: agentConfig?.organization_name || "",
          business_hours: agentConfig?.business_hours || "",
          temperature: agentConfig?.temperature?.toString() || "0.7",
          preferred_voice_id: voiceSettings?.preferred_voice_id || VOICE_OPTIONS[0].id,
          memory_context: agentConfig?.memory_context || "",
        });
        if (organizationWebsite) setScanUrl(organizationWebsite);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    async function loadNumbers() {
      const result = await listMyForwardingNumbers();
      if (result.error) {
        toast.error("Failed to load forwarding numbers: " + result.error);
      } else {
        setPhoneNumbers(result.numbers || []);
      }
      setIsNumbersLoading(false);
    }
    loadNumbers();
  }, []);

  const handleScanWebsite = () => {
    if (!scanUrl.trim()) {
      toast.error("Enter a website URL first.");
      return;
    }
    setIsScanning(true);
    scanWebsite(scanUrl).then((result) => {
      setIsScanning(false);
      if (result.error) {
        toast.error(result.error);
      } else if (result.summary) {
        setForm((f) => ({ ...f, memory_context: result.summary! }));
        toast.success("Website scanned — review the summary below and save when ready.");
      }
    });
  };

  const handleAddNumber = () => {
    if (!newNumber.trim()) return;
    startAddingNumber(async () => {
      const result = await addForwardingNumber(newNumber);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Number added.");
        setNewNumber("");
        const refreshed = await listMyForwardingNumbers();
        if (!refreshed.error) setPhoneNumbers(refreshed.numbers || []);
      }
    });
  };

  const handleRemoveNumber = (id: string) => {
    startAddingNumber(async () => {
      const result = await removeForwardingNumber(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        setPhoneNumbers((prev) => prev.filter((n) => n.id !== id));
      }
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Client-side validation
    const temp = parseFloat(formData.get("temperature") as string);
    if (isNaN(temp) || temp < 0 || temp > 1) {
      toast.error("Temperature must be between 0 and 1");
      return;
    }

    startTransition(async () => {
      const result = await updateAgentConfig(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Agent configuration saved successfully.");
      }
    });
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
            Agent Configuration
          </h1>
          <p className="text-slate-500 dark:text-[#888] text-sm">
            Customize your AI agent&apos;s persona, voice settings, and review recent activity.
          </p>
        </div>

        {/* Voice Minutes Counter with Tooltip */}
        <div className="flex flex-col items-end relative group">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-[#888] uppercase tracking-wider mb-1 cursor-help">
            <span>Voice Minutes</span>
            <Info size={14} className="text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 dark:text-white">120</span>
            <span className="text-sm font-medium text-slate-500 dark:text-[#888]">/ 500 used</span>
          </div>
          <div className="w-32 bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-sky-500 dark:bg-[#00E5FF] h-full w-[24%] rounded-full"></div>
          </div>
          
          {/* Tooltip Content */}
          <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <p className="font-semibold mb-1">Billing Cycle: Monthly</p>
            <p className="text-slate-300 dark:text-slate-600 mb-2">Renews on Sept 1st, 2026</p>
            <div className="flex justify-between border-t border-white/20 dark:border-slate-900/10 pt-2">
              <span>Current Usage:</span>
              <span className="font-bold">24%</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Remaining:</span>
              <span className="font-bold text-emerald-400 dark:text-emerald-600">380 mins</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-px">
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "settings"
              ? "border-sky-500 text-sky-600 dark:text-sky-400"
              : "border-transparent text-slate-500 dark:text-[#888] hover:text-slate-800 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
          }`}
        >
          <Settings size={16} />
          Settings
        </button>
        <button
          onClick={() => setActiveTab("conversations")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "conversations"
              ? "border-sky-500 text-sky-600 dark:text-sky-400"
              : "border-transparent text-slate-500 dark:text-[#888] hover:text-slate-800 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
          }`}
        >
          <List size={16} />
          Recent Conversations
        </button>
        <button
          onClick={() => setActiveTab("numbers")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "numbers"
              ? "border-sky-500 text-sky-600 dark:text-sky-400"
              : "border-transparent text-slate-500 dark:text-[#888] hover:text-slate-800 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
          }`}
        >
          <PhoneForwarded size={16} />
          Call Forwarding
        </button>
      </div>

      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-6 md:p-8">
        {activeTab === "settings" ? (
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Building size={16} className="text-sky-500" /> Organization Profile
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="organization_name" className="block text-[13px] font-medium text-slate-500 dark:text-[#888]">
                  Organization Name
                </label>
                <input
                  id="organization_name"
                  name="organization_name"
                  type="text"
                  value={form.organization_name}
                  onChange={(e) => setForm({ ...form, organization_name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow"
                  placeholder="e.g. Acme Corp"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="business_hours" className="block text-[13px] font-medium text-slate-500 dark:text-[#888]">
                  Business Hours
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock size={16} className="text-slate-400" />
                  </div>
                  <input
                    id="business_hours"
                    name="business_hours"
                    type="text"
                    value={form.business_hours}
                    onChange={(e) => setForm({ ...form, business_hours: e.target.value })}
                    className="w-full pl-10 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow"
                    placeholder="e.g. Mon-Fri, 9AM-5PM EST"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-200 dark:bg-white/5 w-full"></div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Bot size={16} className="text-sky-500" /> AI Behavior & Persona
            </h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="agent_persona" className="block text-[13px] font-medium text-slate-500 dark:text-[#888]">
                  Agent Persona
                </label>
                <textarea
                  id="agent_persona"
                  name="agent_persona"
                  rows={4}
                  value={form.agent_persona}
                  onChange={(e) => setForm({ ...form, agent_persona: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow resize-none"
                  placeholder="Describe how the agent should behave, its tone, and character..."
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="agent_greeting" className="block text-[13px] font-medium text-slate-500 dark:text-[#888]">
                  Initial Greeting
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <MessageSquare size={16} className="text-slate-400" />
                  </div>
                  <input
                    id="agent_greeting"
                    name="agent_greeting"
                    type="text"
                    value={form.agent_greeting}
                    onChange={(e) => setForm({ ...form, agent_greeting: e.target.value })}
                    className="w-full pl-10 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow"
                    placeholder="Hello! How can I help you today?"
                  />
                </div>
              </div>

              <div className="space-y-2 max-w-sm">
                <label className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 dark:text-[#888]">
                  <Volume2 size={14} /> Voice
                </label>
                <input type="hidden" name="preferred_voice_id" value={form.preferred_voice_id} />
                <Select
                  value={form.preferred_voice_id}
                  onChange={(val) => setForm({ ...form, preferred_voice_id: val })}
                  options={VOICE_OPTIONS.map((v) => ({ value: v.id, label: v.name }))}
                />
                <p className="text-xs text-slate-400 dark:text-[#666]">
                  {VOICE_OPTIONS.find((v) => v.id === form.preferred_voice_id)?.description}
                </p>
              </div>

              <div className="space-y-2 max-w-sm">
                <label htmlFor="temperature" className="flex items-center justify-between text-[13px] font-medium text-slate-500 dark:text-[#888]">
                  <span className="flex items-center gap-1.5"><Sliders size={14}/> Temperature (0.0 - 1.0)</span>
                  <span className="text-sky-600 dark:text-sky-400 font-semibold">{form.temperature}</span>
                </label>
                <input
                  id="temperature"
                  name="temperature"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={form.temperature}
                  onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Focused</span>
                  <span>Creative</span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-200 dark:bg-white/5 w-full"></div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Brain size={16} className="text-sky-500" /> Business Memory
            </h2>
            <p className="text-sm text-slate-500 dark:text-[#888]">
              What your agent knows about your business — services, pricing, policies, anything callers might ask about. Write it yourself, or scan your website to get a starting draft.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe size={16} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  value={scanUrl}
                  onChange={(e) => setScanUrl(e.target.value)}
                  placeholder="yourbusiness.com"
                  className="w-full pl-10 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow"
                />
              </div>
              <button
                type="button"
                onClick={handleScanWebsite}
                disabled={isScanning}
                className="flex items-center justify-center gap-2 bg-sky-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {isScanning ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
                {isScanning ? "Scanning..." : "Scan my website"}
              </button>
            </div>

            <div className="space-y-2">
              <label htmlFor="memory_context" className="block text-[13px] font-medium text-slate-500 dark:text-[#888]">
                Business Summary (what the agent should know)
              </label>
              <textarea
                id="memory_context"
                name="memory_context"
                rows={6}
                value={form.memory_context}
                onChange={(e) => setForm({ ...form, memory_context: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow resize-none"
                placeholder="e.g. We're a family dental practice open Mon-Sat, offering cleanings, whitening, and emergency visits. New patients get a free consultation..."
              />
              <p className="text-xs text-slate-400 dark:text-[#666]">A scanned draft won't save until you review it and click Save Configuration below.</p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin"></div>
              ) : (
                <Save size={16} />
              )}
              Save Configuration
            </button>
          </div>
        </form>
        ) : activeTab === "conversations" ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Phone size={16} className="text-sky-500" /> Call Transcripts
              </h2>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedTranscripts.length > 0 && selectedTranscripts.length === mockTranscripts.length}
                    onChange={handleSelectAllTranscripts}
                    className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-600 dark:border-white/20 dark:bg-[#020617]"
                  />
                  Select All
                </label>
                <button
                  disabled={selectedTranscripts.length === 0}
                  onClick={() => {
                    const callers = selectedTranscripts.map(i => mockTranscripts[i].caller).join(", ");
                    setScheduleCaller(selectedTranscripts.length > 2 ? `${selectedTranscripts.length} Selected Callers` : callers);
                    setIsScheduleOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white dark:bg-white dark:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-sm"
                >
                  <CalendarPlus size={14} /> Batch Follow-up
                </button>
              </div>
            </div>
            <div className="h-[600px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {mockTranscripts.map((transcript, i) => (
                <div key={i} className={`border rounded-lg p-5 transition-colors group ${selectedTranscripts.includes(i) ? 'border-sky-400 bg-sky-50/10 dark:border-[#00E5FF]/40' : 'border-slate-200 dark:border-white/10 hover:border-sky-300 dark:hover:border-sky-500/30'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <input 
                        type="checkbox" 
                        checked={selectedTranscripts.includes(i)}
                        onChange={() => handleSelectTranscript(i)}
                        className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-600 dark:border-white/20 dark:bg-[#020617] cursor-pointer"
                      />
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          <User size={14} className="text-slate-600 dark:text-slate-300" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          {transcript.caller}
                          <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-bold tracking-wider ${
                            transcript.sentiment === 'Positive' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                            transcript.sentiment === 'Frustrated' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {transcript.sentiment}
                          </span>
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-[#888]">{transcript.phone}</p>
                      </div>
                    </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-[#888]">
                        <Calendar size={14} />
                        {transcript.date}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-[#888]">
                        <Clock size={14} />
                        {transcript.duration}
                      </div>
                    </div>
                  </div>

                  {/* AI Summary & Action Items */}
                  <div className="mb-4 bg-sky-50/50 dark:bg-[#00E5FF]/5 border border-sky-100 dark:border-[#00E5FF]/10 rounded-lg p-4">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">AI Summary</h5>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">{transcript.summary}</p>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">Action Items</h5>
                    <ul className="space-y-1 mb-3">
                      {transcript.actionItems.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <span className="text-sky-500 mt-1">&bull;</span> {item}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => {
                        setScheduleCaller(transcript.caller);
                        setIsScheduleOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 w-fit text-xs font-medium text-sky-600 bg-sky-100 hover:bg-sky-200 dark:bg-[#00E5FF]/10 dark:text-[#00E5FF] dark:hover:bg-[#00E5FF]/20 rounded-md transition-colors"
                    >
                      <CalendarPlus size={14} /> Schedule Follow-up
                    </button>
                  </div>
                  
                  <div className="space-y-3 bg-slate-50 dark:bg-[#020617] rounded-lg p-4 border border-slate-100 dark:border-white/5">

                    {transcript.messages.map((msg, idx) => (
                      <div key={idx} className={`flex gap-3 ${msg.role === 'agent' ? '' : 'flex-row-reverse'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'agent' ? 'bg-sky-100 dark:bg-[#00E5FF]/20 text-sky-600 dark:text-[#00E5FF]' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-[#EDEDED]'}`}>
                          {msg.role === 'agent' ? <Bot size={12} /> : <User size={12} />}
                        </div>
                        <div className={`rounded-lg p-3 text-sm shadow-sm max-w-[85%] ${
                          msg.role === 'agent' 
                            ? 'bg-sky-50 dark:bg-[#00E5FF]/5 border border-sky-100 dark:border-[#00E5FF]/10 text-slate-700 dark:text-white rounded-tl-none' 
                            : 'bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 text-slate-700 dark:text-[#EDEDED] rounded-tr-none'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <PhoneForwarded size={16} className="text-sky-500" /> Call Forwarding
              </h2>
              <p className="text-sm text-slate-500 dark:text-[#888] mt-2">
                Forward calls from your existing business number to your Knoxified agent. Set up call forwarding with your phone carrier to redirect calls to the number below, then register your business number here so the agent knows it's you answering.
              </p>
            </div>

            <div className="bg-sky-50 dark:bg-sky-500/5 border border-sky-100 dark:border-sky-500/10 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 dark:text-[#888] uppercase tracking-wider mb-1">Forward calls to</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white font-mono">{process.env.NEXT_PUBLIC_VOICE_AGENT_NUMBER || "Contact support for your forwarding number"}</p>
              <p className="text-xs text-slate-400 dark:text-[#666] mt-2">
                On most carriers: dial *72 followed by this number to enable unconditional call forwarding. Steps vary by carrier and country — check with yours if unsure.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-[13px] font-medium text-slate-500 dark:text-[#888]">Your Business Number(s)</label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone size={16} className="text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    placeholder="+1 555 123 4567"
                    className="w-full pl-10 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddNumber}
                  disabled={isAddingNumber}
                  className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50 shrink-0"
                >
                  <Plus size={16} /> Add
                </button>
              </div>

              {isNumbersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-slate-400" />
                </div>
              ) : phoneNumbers.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-[#666] py-4 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-lg">
                  No numbers registered yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {phoneNumbers.map((n) => (
                    <div key={n.id} className="flex items-center justify-between bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 font-mono">
                        {n.phone_number}
                        {n.is_active && (
                          <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">Active</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveNumber(n.id)}
                        disabled={isAddingNumber}
                        className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarPlus size={18} className="text-sky-500" />
                Schedule Follow-up
              </h3>
              <button 
                onClick={() => setIsScheduleOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-[#888] mb-1.5">Caller</label>
                <input type="text" value={scheduleCaller} readOnly className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-lg px-3 py-2 opacity-70 cursor-not-allowed" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-[#888] mb-1.5">Date</label>
                  <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-[#888] mb-1.5">Time</label>
                  <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-[#888] mb-1.5">Notes</label>
                <textarea rows={3} value={scheduleNotes} onChange={(e) => setScheduleNotes(e.target.value)} placeholder="Optional meeting notes..." className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none" />
              </div>
            </div>
            <div className="px-5 py-4 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3">
              <button onClick={() => setIsScheduleOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                Cancel
              </button>
              <button 
                onClick={() => {
                  toast.success(`Follow-up scheduled for ${scheduleCaller}`);
                  setIsScheduleOpen(false);
                  setScheduleDate("");
                  setScheduleTime("");
                  setScheduleNotes("");
                  setSelectedTranscripts([]);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-sky-600 hover:bg-sky-700 dark:bg-[#00E5FF] dark:hover:bg-[#00E5FF]/90 text-white dark:text-[#020617] transition-colors"
              >
                Sync to Calendar
              </button>
            </div>
          </div>
        </div>
      )}

      {showLegalDisclaimer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Info size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                  Legal Disclaimer: Call Recording & Transcription
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Compliance and consent requirements for automated agents
                </p>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700 dark:text-slate-300 custom-scrollbar">
              <p>
                Before accessing the Agent Configuration, you must acknowledge the legal framework governing call recording and artificial intelligence interactions in the United States.
              </p>
              
              <h4 className="font-semibold text-slate-900 dark:text-white mt-4">Federal Law (One-Party Consent)</h4>
              <p>
                Under the Electronic Communications Privacy Act (ECPA) (18 U.S.C. § 2511), federal law requires that at least one party involved in a conversation consents to the recording. However, state laws may impose stricter requirements.
              </p>

              <h4 className="font-semibold text-slate-900 dark:text-white mt-4">State Laws (Two-Party / All-Party Consent)</h4>
              <p>
                Approximately 14 states (including <strong>California, Florida, Illinois, Maryland, Massachusetts, Michigan, Montana, Nevada, New Hampshire, Pennsylvania, and Washington</strong>) require <strong>all-party consent</strong>. This means that every participant on the call must be explicitly notified and consent to being recorded and transcribed.
              </p>
              <p>
                <strong>Interstate Calls:</strong> When a call crosses state lines, the general rule of thumb is that the stricter state law applies. Therefore, obtaining explicit consent from all callers is the safest and recommended approach to ensure compliance.
              </p>

              <h4 className="font-semibold text-slate-900 dark:text-white mt-4">Governing Bodies & AI Disclosure</h4>
              <p>
                The Federal Communications Commission (FCC) and the Federal Trade Commission (FTC) (via the Telemarketing Sales Rule and TCPA) monitor outbound automated communications. Additionally, many state regulations require clear disclosure that the caller is interacting with an Artificial Intelligence or automated system before the call proceeds.
              </p>

              <div className="bg-slate-50 dark:bg-[#020617] p-4 rounded-lg border border-slate-200 dark:border-white/10 mt-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={acceptedTermsCheckbox}
                    onChange={(e) => setAcceptedTermsCheckbox(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-600 dark:border-white/20 dark:bg-[#0F172A] cursor-pointer"
                  />
                  <span className="font-medium">
                    I understand the legal requirements regarding call recording and transcription. I agree to configure my agent to properly disclose its AI nature and obtain the necessary consent from all callers in accordance with applicable local, state, and federal laws.
                  </span>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-white/10 flex justify-end">
              <button 
                disabled={!acceptedTermsCheckbox}
                onClick={handleAcceptLegal}
                className="px-6 py-2.5 rounded-lg text-sm font-medium bg-sky-600 hover:bg-sky-700 dark:bg-[#00E5FF] dark:hover:bg-[#00E5FF]/90 text-white dark:text-[#020617] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                I Understand & Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const mockTranscripts = [
  {
    caller: "Sarah Jenkins",
    phone: "+1 (555) 019-2834",
    date: "Today, 10:42 AM",
    duration: "4m 12s",
    sentiment: "Neutral",
    summary: "Caller inquired about the status of order AC-88294. Agent confirmed the order is out for delivery and should arrive by 8 PM.",
    actionItems: [
      "No further action required - order is in transit."
    ],
    messages: [
      { role: "agent", text: "Hello! Thank you for calling Acme Corp. I'm your virtual assistant. How can I help you today?" },
      { role: "user", text: "Hi, I'm calling to check the status of my recent order. It was supposed to arrive yesterday." },
      { role: "agent", text: "I can certainly help you with that. Could you please provide your order number or the phone number associated with the account?" },
      { role: "user", text: "Yes, the order number is AC-88294." },
      { role: "agent", text: "Thank you. Let me pull that up... I see your order AC-88294 is currently out for delivery and should arrive by 8 PM tonight. I apologize for the slight delay." }
    ]
  },
  {
    caller: "Michael Chen",
    phone: "+1 (555) 843-1122",
    date: "Today, 09:15 AM",
    duration: "2m 45s",
    sentiment: "Positive",
    summary: "Caller needed help resetting password and wasn't receiving the recovery email. Agent directed them to check the spam folder, where it was found.",
    actionItems: [
      "Review email deliverability for password reset flow."
    ],
    messages: [
      { role: "agent", text: "Welcome to Acme Corp support. How may I assist you?" },
      { role: "user", text: "I need to reset my password, but I'm not getting the recovery email." },
      { role: "agent", text: "I understand that can be frustrating. Let's get that sorted out. First, please check your spam or junk folder as sometimes the emails get routed there." },
      { role: "user", text: "Oh, you're right! I found it in the spam folder. Thanks for your help." },
      { role: "agent", text: "You're very welcome! Is there anything else I can assist you with today?" }
    ]
  },
  {
    caller: "Elena Rodriguez",
    phone: "+1 (555) 392-8475",
    date: "Yesterday, 04:30 PM",
    duration: "6m 20s",
    sentiment: "Positive",
    summary: "Caller requested a consultation with enterprise sales. Scheduled for Tuesday at 10:00 AM EST.",
    actionItems: [
      "Send calendar invite to Elena for Tuesday 10:00 AM EST.",
      "Notify enterprise sales team of upcoming consultation."
    ],
    messages: [
      { role: "agent", text: "Hello, Acme Corp virtual assistant speaking. How can I direct your call?" },
      { role: "user", text: "I'd like to schedule a consultation with your enterprise sales team." },
      { role: "agent", text: "Excellent! I can help you schedule that right now. What days and times typically work best for you next week?" },
      { role: "user", text: "Tuesday or Wednesday morning would be ideal." },
      { role: "agent", text: "Great. I have an opening on Tuesday at 10:00 AM or Wednesday at 11:30 AM EST. Do either of those work?" }
    ]
  },
  {
    caller: "David Smith",
    phone: "+1 (555) 774-9021",
    date: "Yesterday, 01:10 PM",
    duration: "1m 55s",
    sentiment: "Neutral",
    summary: "Caller asked for weekend business hours. Agent provided standard support and technical support hours.",
    actionItems: [
      "None."
    ],
    messages: [
      { role: "agent", text: "Hi there! Acme Corp support. How can I help?" },
      { role: "user", text: "What are your business hours on weekends?" },
      { role: "agent", text: "Our general customer support team is available from 9 AM to 5 PM EST on Saturdays and Sundays. Our technical support operates 24/7." },
      { role: "user", text: "Perfect, thank you!" },
      { role: "agent", text: "You're welcome! Have a great day." }
    ]
  },
  {
    caller: "Unknown Caller",
    phone: "+1 (555) 112-9988",
    date: "Aug 11, 2026, 11:45 AM",
    duration: "3m 10s",
    sentiment: "Positive",
    summary: "Caller asked about non-profit discounts. Agent explained the 20% discount and sent an SMS application link.",
    actionItems: [
      "Track SMS link click for non-profit application."
    ],
    messages: [
      { role: "agent", text: "Hello! Thank you for calling Acme Corp. I'm your virtual assistant. How can I help you today?" },
      { role: "user", text: "Do you guys offer any discounts for non-profits?" },
      { role: "agent", text: "Yes, we do! We offer a 20% discount on all standard plans for registered 501(c)(3) non-profit organizations. Would you like me to send you the application link?" },
      { role: "user", text: "Yes please, that would be great." },
      { role: "agent", text: "I've sent an SMS with the link to the number you are calling from. Is there anything else you need?" }
    ]
  }
];

"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { getAgentConfig, updateAgentConfig, toggleCallRecording } from "@/lib/actions/agent-config-actions";
import { Select } from "@/components/ui/Select";
import { getWebcallPreviewSystem, setWebcallPreviewSystem, setPreferredVoice } from "@/lib/actions/agent-identity-actions";
import { useSystems } from "@/lib/services/hooks";
import { SystemPicker } from "@/components/ui/SystemPicker";
import Link from "next/link";
import { scanWebsite, saveWebsiteKnowledge, type Faq } from "@/lib/actions/website-scan-actions";
import { listMyForwardingNumbers, addForwardingNumber, removeForwardingNumber } from "@/lib/actions/phone-mapping-actions";
import { previewAgentVoice } from "@/lib/actions/voice-preview-actions";
import { triggerDiscountOffer } from "@/lib/actions/discount-actions";
import { VOICE_OPTIONS } from "@/lib/voice-options";
import { AVATAR_OPTIONS } from "@/lib/avatar-options";
import { AgentAvatar } from "@/components/AgentAvatar";
import { CallRoutingEditor } from "@/components/CallRoutingEditor";
import { NumberProvisioningCard } from "@/components/NumberProvisioningCard";
import { ServicesPricing } from "@/components/ServicesPricing";
import { Save, Bot, MessageSquare, Building, Clock, Sliders, Info, Volume2, Brain, Globe, Loader2, Trash2, Plus, PhoneForwarded, Play, Pause, ShieldCheck, Check } from "lucide-react";


// Timezone list for the "Business Timezone" field: every zone this browser knows, plus the saved one.
function timezoneOptions(current: string): string[] {
  let all: string[] = [];
  try {
    all = (Intl as any).supportedValuesOf ? (Intl as any).supportedValuesOf("timeZone") : [];
  } catch {
    all = [];
  }
  if (all.length === 0) {
    all = ["Africa/Lagos", "Africa/Johannesburg", "Africa/Nairobi", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Toronto", "Europe/London", "Europe/Paris", "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Australia/Sydney", "UTC"];
  }
  return current && !all.includes(current) ? [current, ...all] : all;
}

export default function AgentConfigPage() {
  const { data: catalogSystems } = useSystems();
  const [webcallPreviewSystem, setWebcallPreviewSystemState] = useState("");
  useEffect(() => {
    getWebcallPreviewSystem().then((id) => setWebcallPreviewSystemState(id));
  }, []);
  async function handleWebcallPreviewChange(id: string) {
    const previous = webcallPreviewSystem;
    setWebcallPreviewSystemState(id);
    const res = await setWebcallPreviewSystem(id);
    if (!res.ok) {
      setWebcallPreviewSystemState(previous);
      toast.error("Couldn't save your webcall preview system. Try again.");
    } else {
      toast.success("Webcall preview system saved");
    }
  }
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"agent" | "business" | "numbers">("agent");
  
  const [form, setForm] = useState({
    agent_persona: "",
    agent_greeting: "",
    organization_name: "",
    business_hours: "",
    timezone: "",
    temperature: "0.7",
    preferred_voice_id: VOICE_OPTIONS[0].id,
    memory_context: "",
    agent_nickname: "Alex",
    agent_avatar: AVATAR_OPTIONS[0].key,
  });

  // Voice picker: tap a voice's play button to hear it (nothing is saved),
  // tap the card to choose it (saved immediately).
  const [voiceLoadingId, setVoiceLoadingId] = useState<string | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const previewRequest = useRef(0);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const [scanUrl, setScanUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  // Website knowledge: saved to the account by the scan itself, editable afterwards.
  const [websiteSummary, setWebsiteSummary] = useState("");
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [scannedAt, setScannedAt] = useState<string | null>(null);
  const [knowledgeDirty, setKnowledgeDirty] = useState(false);
  const [isSavingKnowledge, setIsSavingKnowledge] = useState(false);

  const [phoneNumbers, setPhoneNumbers] = useState<{ id: string; phone_number: string; is_active: boolean }[]>([]);
  const [newNumber, setNewNumber] = useState("");
  const [isNumbersLoading, setIsNumbersLoading] = useState(true);
  const [numAccess, setNumAccess] = useState({ isPaid: true, hasProvisioned: false });
  const [isAddingNumber, startAddingNumber] = useTransition();

  const [recordingEnabled, setRecordingEnabled] = useState(false);
  const [showRecordingConsentModal, setShowRecordingConsentModal] = useState(false);
  const [acceptedTermsCheckbox, setAcceptedTermsCheckbox] = useState(false);
  const [isTogglingRecording, startRecordingTransition] = useTransition();

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
          // Nothing saved yet: pre-select the timezone this browser reports, the owner just confirms it.
          timezone: agentConfig?.timezone || (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "") || "",
          temperature: agentConfig?.temperature?.toString() || "0.7",
          preferred_voice_id: voiceSettings?.preferred_voice_id || VOICE_OPTIONS[0].id,
          memory_context: agentConfig?.memory_context || "",
          agent_nickname: agentConfig?.agent_nickname || "Alex",
          agent_avatar: agentConfig?.agent_avatar || AVATAR_OPTIONS[0].key,
        });
        setRecordingEnabled(Boolean(agentConfig?.call_recording_enabled));
        setWebsiteSummary(agentConfig?.website_summary || "");
        setFaqs(Array.isArray(agentConfig?.faqs) ? agentConfig.faqs : []);
        setScannedAt(agentConfig?.website_scanned_at || null);
        if (agentConfig?.website_url) setScanUrl(agentConfig.website_url);
        else if (organizationWebsite) setScanUrl(organizationWebsite);
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
      if (result.error !== undefined) {
        toast.error(result.error);
        return;
      }
      // The scan is already saved to the account; just show it.
      setWebsiteSummary(result.summary);
      setFaqs(result.faqs);
      setScannedAt(result.scannedAt);
      setKnowledgeDirty(false);
      toast.success(`Read ${result.pagesRead} page${result.pagesRead === 1 ? "" : "s"} and saved. Review the summary and FAQs below.`);
    });
  };

  const handleSaveKnowledge = async () => {
    setIsSavingKnowledge(true);
    const res = await saveWebsiteKnowledge(websiteSummary, faqs);
    setIsSavingKnowledge(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    // Rows left half-empty are dropped on save; reflect that on screen.
    setFaqs((list) => list.filter((f) => f.q.trim() && f.a.trim()));
    setKnowledgeDirty(false);
    toast.success("Saved. Your agent will use these on its next call.");
  };

  const editFaq = (id: string, field: "q" | "a", value: string) => {
    // An owner edit turns a scanned FAQ into the owner's own, so a rescan never overwrites it.
    setFaqs((list) => list.map((f) => (f.id === id ? { ...f, [field]: value, source: "manual" } : f)));
    setKnowledgeDirty(true);
  };
  const addFaq = () => {
    setFaqs((list) => [...list, { id: crypto.randomUUID(), q: "", a: "", source: "manual" }]);
    setKnowledgeDirty(true);
  };
  const removeFaq = (id: string) => {
    setFaqs((list) => list.filter((f) => f.id !== id));
    setKnowledgeDirty(true);
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
        // Tell the top bar (and anything else showing the agent's name/avatar) to reload it.
        window.dispatchEvent(new Event("agent-identity-updated"));
      }
    });
  };

  const handlePreviewVoice = async (voiceId: string) => {
    const request = ++previewRequest.current;
    previewAudioRef.current?.pause();
    setPlayingVoiceId(null);
    setVoiceLoadingId(voiceId);
    const result = await previewAgentVoice({ voiceId, agentName: form.agent_nickname });
    if (request !== previewRequest.current) return; // a newer tap took over
    setVoiceLoadingId(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    if (result.audioDataUrl) {
      const audio = new Audio(result.audioDataUrl);
      previewAudioRef.current = audio;
      setPlayingVoiceId(voiceId);
      audio.onended = () => setPlayingVoiceId((cur) => (cur === voiceId ? null : cur));
      audio.play();
      // First real "this actually works" moment -- the agreed trigger
      // point for the 48h Founding Rate window. No-op if already set.
      triggerDiscountOffer();
    }
  };

  const handleSelectVoice = async (voiceId: string) => {
    if (voiceId === form.preferred_voice_id) return;
    const previous = form.preferred_voice_id;
    setForm((f) => ({ ...f, preferred_voice_id: voiceId }));
    const res = await setPreferredVoice(voiceId);
    if (!res.ok) {
      setForm((f) => ({ ...f, preferred_voice_id: previous }));
      toast.error("Couldn't save that voice. Try again.");
      return;
    }
    toast.success("Voice saved");
  };

  const handleRecordingToggleClick = () => {
    if (recordingEnabled) {
      // Turning off never needs consent -- only turning on does.
      startRecordingTransition(async () => {
        const result = await toggleCallRecording(false, false);
        if (result?.error) {
          toast.error(result.error);
          return;
        }
        setRecordingEnabled(false);
        toast.success("Call recording turned off.");
      });
    } else {
      setShowRecordingConsentModal(true);
    }
  };

  const handleConfirmRecordingConsent = () => {
    startRecordingTransition(async () => {
      const result = await toggleCallRecording(true, true);
      setShowRecordingConsentModal(false);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setRecordingEnabled(true);
      toast.success("Call recording turned on. Callers will hear a disclosure at the start of every call.");
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
            Manage your agent, your business details, and your phone numbers.
          </p>
        </div>

      </div>

      {/* Sub-selection: same look as Billing & Integrations */}
      <div className="flex items-center gap-1 border-b border-slate-200/70 dark:border-white/[0.06] overflow-x-auto">
        {([
          { key: "agent", label: "Agent" },
          { key: "business", label: "Business" },
          { key: "numbers", label: "Numbers" },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px whitespace-nowrap ${
              activeTab === tab.key
                ? "text-[color:var(--accent)] border-[color:var(--accent)]"
                : "text-slate-500 dark:text-white/40 border-transparent hover:text-slate-700 dark:hover:text-white/70"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-6 md:p-8">
        <form onSubmit={handleSubmit} className={activeTab === "numbers" ? "hidden" : "space-y-8"}>

          <div className={activeTab === "agent" ? "space-y-8" : "hidden"}>
          <div className="space-y-5 pb-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Bot size={16} className="text-[color:var(--accent)]" /> Agent Identity
            </h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 glass-card rounded-xl p-5">
              <AgentAvatar avatarKey={form.agent_avatar} size="lg" />
              <div className="flex-1 w-full">
                <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {form.agent_nickname || "Your Agent"}
                </p>
                <p className="text-[13px] text-slate-500 dark:text-[#888] mb-3">
                  &ldquo;Hi, this is {form.agent_nickname || "your assistant"}{form.organization_name ? ` from ${form.organization_name}` : ""}. How can I help you today?&rdquo;
                </p>
                <input type="hidden" name="preferred_voice_id" value={form.preferred_voice_id} />
                <p className="text-[13px] font-medium text-slate-500 dark:text-[#888] mb-2 flex items-center gap-1.5">
                  <Volume2 size={14} /> Voice
                  <span className="text-xs font-normal text-slate-400 dark:text-[#666]">Tap ▶ to hear it. Tap the card to use it.</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {VOICE_OPTIONS.map((v) => {
                    const selected = form.preferred_voice_id === v.id;
                    const loading = voiceLoadingId === v.id;
                    const playing = playingVoiceId === v.id;
                    return (
                      <div
                        key={v.id}
                        onClick={() => handleSelectVoice(v.id)}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                          selected
                            ? "border-sky-500 bg-sky-500/10"
                            : "border-slate-200 dark:border-white/10 hover:border-sky-400/60"
                        }`}
                      >
                        <button
                          type="button"
                          aria-label={`Preview ${v.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewVoice(v.id);
                          }}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent)] text-slate-900 hover:opacity-90 transition-opacity"
                        >
                          {loading ? <Loader2 size={14} className="animate-spin" /> : playing ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">{v.name}</p>
                          {v.description !== "Cartesia voice." && (
                            <p className="text-xs text-slate-400 dark:text-[#666] truncate">{v.description}</p>
                          )}
                        </div>
                        {selected && <Check size={16} className="text-sky-500 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="agent_nickname" className="block text-[13px] font-medium text-slate-500 dark:text-[#888]">
                  Agent Name
                </label>
                <input
                  id="agent_nickname"
                  name="agent_nickname"
                  type="text"
                  value={form.agent_nickname}
                  onChange={(e) => setForm({ ...form, agent_nickname: e.target.value })}
                  placeholder="e.g. Alice, Calista, Richard"
                  maxLength={40}
                  className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] transition-shadow"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-slate-500 dark:text-[#888]">Avatar</label>
                <input type="hidden" name="agent_avatar" value={form.agent_avatar} />
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setForm({ ...form, agent_avatar: opt.key })}
                      title={opt.label}
                      className={`rounded-full transition-all ${form.agent_avatar === opt.key ? "ring-2 ring-[color:var(--accent)] ring-offset-2 ring-offset-white dark:ring-offset-[#0F172A]" : "opacity-60 hover:opacity-100"}`}
                    >
                      <AgentAvatar avatarKey={opt.key} size="sm" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-200 dark:bg-white/5 w-full"></div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Volume2 size={16} className="text-sky-500" /> Webcall Preview System
            </h2>
            <p className="text-[13px] text-slate-500 dark:text-[#888]">
              Choose which industry system your dashboard webcall previews use, so you can hear how a conversation would sound in that industry&apos;s tone and word choice. This only affects webcall previews. It does not change how your real calls are answered. To use a system on real inbound or outbound calls, activate it from{" "}
              <Link href="/systems" className="underline hover:opacity-80" style={{ color: 'var(--accent)' }}>Systems</Link>.
            </p>
            <div className="max-w-sm">
              <SystemPicker value={webcallPreviewSystem} onChange={handleWebcallPreviewChange} systems={catalogSystems} />
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
              <ShieldCheck size={16} className="text-sky-500" /> Call Recording
            </h2>
            <div className="flex items-start justify-between gap-4 bg-slate-50 dark:bg-[#020617] rounded-lg p-4 border border-slate-200 dark:border-white/10">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">Record calls</p>
                <p className="text-xs text-slate-500 dark:text-[#888] max-w-md">
                  Off by default. When on, every caller hears a short recording notice in the opening line, before the
                  conversation continues, and both the transcript and audio appear in Conversations afterward.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRecordingToggleClick}
                disabled={isTogglingRecording}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 disabled:opacity-50 ${recordingEnabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/10"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${recordingEnabled ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </div>
          </div>

          <div className={activeTab === "business" ? "space-y-8" : "hidden"}>
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

              <div className="space-y-2">
                <label htmlFor="timezone" className="block text-[13px] font-medium text-slate-500 dark:text-[#888]">
                  Business Timezone
                </label>
                <Select
                  value={form.timezone}
                  onChange={(v) => setForm({ ...form, timezone: v })}
                  options={timezoneOptions(form.timezone).map((tz) => ({ value: tz, label: tz.replace(/_/g, " ") }))}
                />
                <p className="text-[12px] text-slate-400 dark:text-[#666]">
                  Used only to check availability and book appointment times in your local time.
                </p>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-200 dark:bg-white/5 w-full"></div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Brain size={16} className="text-sky-500" /> Business Memory
            </h2>
            <p className="text-sm text-slate-500 dark:text-[#888]">
              What your agent knows about your business — services, pricing, policies, anything callers might ask about. Scan your website and your agent learns it, with an FAQ list you can edit.
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

            {scannedAt && (
              <p className="text-xs text-slate-400 dark:text-[#666]">
                Last scanned {new Date(scannedAt).toLocaleString()} and saved to your account. Rescanning keeps any FAQs you wrote or edited.
              </p>
            )}

            <div className="space-y-2">
              <label htmlFor="website_summary" className="block text-[13px] font-medium text-slate-500 dark:text-[#888]">
                From your website (edit anything that's wrong)
              </label>
              <textarea
                id="website_summary"
                rows={7}
                value={websiteSummary}
                onChange={(e) => {
                  setWebsiteSummary(e.target.value);
                  setKnowledgeDirty(true);
                }}
                className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow resize-y"
                placeholder="Scan your website and what your agent learned appears here. You can also write it yourself."
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-[13px] font-medium text-slate-500 dark:text-[#888]">
                  FAQs your agent can answer ({faqs.length})
                </label>
                <button
                  type="button"
                  onClick={addFaq}
                  className="flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-500"
                >
                  <Plus size={14} /> Add FAQ
                </button>
              </div>
              {faqs.length === 0 && (
                <p className="text-xs text-slate-400 dark:text-[#666]">
                  No FAQs yet. Scan your website to fill these in, or add your own.
                </p>
              )}
              {faqs.map((f) => (
                <div key={f.id} className="rounded-lg border border-slate-200 dark:border-white/10 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <input
                      type="text"
                      value={f.q}
                      onChange={(e) => editFaq(f.id, "q", e.target.value)}
                      placeholder="Question a caller might ask"
                      className="flex-1 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm font-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeFaq(f.id)}
                      aria-label="Delete FAQ"
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={f.a}
                    onChange={(e) => editFaq(f.id, "a", e.target.value)}
                    placeholder="How your agent should answer"
                    className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-y"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveKnowledge}
                disabled={isSavingKnowledge || !knowledgeDirty}
                className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSavingKnowledge ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSavingKnowledge ? "Saving..." : "Save website knowledge"}
              </button>
              {knowledgeDirty && <span className="text-xs text-amber-500">Unsaved changes</span>}
            </div>

            <div className="space-y-2 pt-2">
              <label htmlFor="memory_context" className="block text-[13px] font-medium text-slate-500 dark:text-[#888]">
                Your own notes (anything else the agent should know)
              </label>
              <textarea
                id="memory_context"
                name="memory_context"
                rows={4}
                value={form.memory_context}
                onChange={(e) => setForm({ ...form, memory_context: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow resize-none"
                placeholder="e.g. We never discuss prices over the phone. New patients get a free consultation. Closed on public holidays."
              />
              <p className="text-xs text-slate-400 dark:text-[#666]">Saved with Save Configuration below. Scanning never overwrites these notes.</p>
            </div>

            <ServicesPricing />
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

        {activeTab === "numbers" && (
        <>
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <PhoneForwarded size={16} className="text-sky-500" /> Call Forwarding
              </h2>
              <p className="text-sm text-slate-500 dark:text-[#888] mt-2">
                Get a dedicated number for your agent. Publish it directly, or forward your existing business line to it for the times you can't pick up.
              </p>
            </div>

            <NumberProvisioningCard onState={setNumAccess} />

            {!numAccess.hasProvisioned && phoneNumbers.length > 0 && (
            <>
            <div className="bg-sky-50 dark:bg-sky-500/5 border border-sky-100 dark:border-sky-500/10 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 dark:text-[#888] uppercase tracking-wider mb-1">Forward calls to</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white font-mono">{process.env.NEXT_PUBLIC_VOICE_AGENT_NUMBER || "Contact support for your forwarding number"}</p>
              <p className="text-xs text-slate-400 dark:text-[#666] mt-2">
                To have the agent answer only when you don't, set forwarding for no answer or busy: on most mobile carriers dial **61*number# (no answer) or **67*number# (busy). Steps vary by carrier and country.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-[13px] font-medium text-slate-500 dark:text-[#888]">Your existing forwarded number(s)</label>
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
            </>
            )}
          </div>
        <CallRoutingEditor />
        </>
        )}
      </div>

      {showRecordingConsentModal && (
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
                Before turning on call recording, you must acknowledge the legal framework governing call recording and artificial intelligence interactions in the United States.
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
              <p>
                When you turn this on, Knoxified automatically adds a recording notice to your agent's opening line on every call, spoken before the conversation continues -- you don't need to write this yourself.
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

            <div className="px-6 py-4 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-3">
              <button
                onClick={() => { setShowRecordingConsentModal(false); setAcceptedTermsCheckbox(false); }}
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                disabled={!acceptedTermsCheckbox || isTogglingRecording}
                onClick={() => { handleConfirmRecordingConsent(); setAcceptedTermsCheckbox(false); }}
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

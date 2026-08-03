"use client";

import React, { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { getAgentConfig, updateAgentConfig } from "@/lib/actions/agent-config-actions";
import { Save, Bot, MessageSquare, Building, Clock, Sliders } from "lucide-react";

export default function AgentConfigPage() {
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({
    agent_persona: "",
    agent_greeting: "",
    organization_name: "",
    business_hours: "",
    temperature: "0.7",
  });

  useEffect(() => {
    async function loadData() {
      const { agentConfig, voiceSettings, error } = await getAgentConfig();
      if (error && !error.includes("Row not found")) {
        toast.error("Failed to load settings: " + error);
      } else {
        setForm({
          agent_persona: voiceSettings?.agent_persona || "",
          agent_greeting: voiceSettings?.agent_greeting || "",
          organization_name: agentConfig?.organization_name || "",
          business_hours: agentConfig?.business_hours || "",
          temperature: agentConfig?.temperature?.toString() || "0.7",
        });
      }
      setLoading(false);
    }
    loadData();
  }, []);

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
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
          Agent Configuration
        </h1>
        <p className="text-slate-500 dark:text-[#888] text-sm">
          Customize your AI agent&apos;s persona, voice settings, and organizational knowledge.
        </p>
      </div>

      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-6 md:p-8">
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
      </div>
    </div>
  );
}

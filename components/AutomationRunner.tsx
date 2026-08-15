"use client";

import { useState } from "react";
import { runAutomation } from "@/lib/actions/automation-actions";
import { toast } from "sonner";
import { Automation } from "@/data/automations";
import { Select } from "@/components/ui/Select";
import { Play, Database } from "lucide-react";

export default function AutomationRunner({ automation }: { automation: Automation }) {
  const [selectedAction, setSelectedAction] = useState<string>(
    automation.actions && automation.actions.length > 0 ? automation.actions[0].key : ""
  );
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [rawJson, setRawJson] = useState<string>("{\n  \n}");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const currentSchema = automation.formSchema
    ? (Array.isArray(automation.formSchema) 
        ? automation.formSchema 
        : (selectedAction ? (automation.formSchema as Record<string, any>)[selectedAction] : null))
    : null;

  const handleRun = async () => {
    setLoading(true);
    setResults(null);
    try {
      const payload = currentSchema ? formData : (rawJson ? JSON.parse(rawJson) : {});
      const res = await runAutomation(automation.webhookKey || automation.id, selectedAction || null, payload);
      
      if (res.success) {
        setResults(res.data);
        toast.success("Automation completed");
      } else {
        toast.error(res.error || "Failed to run automation");
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid JSON payload or execution error");
    } finally {
      setLoading(false);
    }
  };

  const renderFormFields = () => {
    if (!currentSchema) {
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Payload (JSON)</label>
          <textarea 
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            className="w-full h-40 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-lg p-4 font-mono text-sm text-slate-900 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="{}"
          />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {currentSchema.map((field: any) => (
          <div key={field.key} className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{field.label}</label>
            {field.type === "textarea" ? (
              <textarea
                value={formData[field.key] || ""}
                onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                rows={3}
              />
            ) : field.type === "select" ? (
              <Select
                value={formData[field.key] || (field.options && field.options.length > 0 ? field.options[0] : "")}
                onChange={(val) => setFormData({ ...formData, [field.key]: val })}
                options={(field.options || []).map((opt: string) => ({ value: opt, label: opt }))}
              />
            ) : (
              <input
                type={field.type}
                value={formData[field.key] || ""}
                onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderResults = () => {
    if (!results) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-[#666]">
          <Database size={32} className="mb-3 opacity-50" />
          <p className="text-sm">Run the workflow to see results here.</p>
        </div>
      );
    }

    if (Array.isArray(results)) {
      if (results.length === 0) return <div className="text-sm text-slate-500">No results found.</div>;
      
      const keys = Object.keys(results[0]);
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
              <tr>
                {keys.map(k => <th key={k} className="px-4 py-3">{k}</th>)}
              </tr>
            </thead>
            <tbody>
              {results.map((row, i) => (
                <tr key={i} className="border-b border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                  {keys.map(k => <td key={k} className="px-4 py-3 text-slate-900 dark:text-slate-300">{String(row[k])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (typeof results === "object") {
      return (
        <div className="space-y-3">
          {Object.entries(results).map(([k, v]) => (
            <div key={k} className="bg-slate-50 dark:bg-white/5 p-3 rounded-lg border border-slate-200 dark:border-white/5">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase block mb-1">{k}</span>
              <span className="text-sm text-slate-900 dark:text-white font-medium">{String(v)}</span>
            </div>
          ))}
        </div>
      );
    }

    return <div className="text-sm text-slate-900 dark:text-white p-4">{String(results)}</div>;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          Run Configuration
        </h3>
        
        {automation.actions && automation.actions.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Action Type</label>
            <Select 
              value={selectedAction}
              onChange={(val) => {
                setSelectedAction(val);
                setFormData({});
                setResults(null);
              }}
              options={automation.actions.map(a => ({ value: a.key, label: a.label }))}
            />
          </div>
        )}

        {renderFormFields()}

        <button
          onClick={handleRun}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 dark:bg-[#00E5FF] dark:hover:bg-[#00E5FF]/90 text-white dark:text-[#020617] font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/20 dark:border-[#020617]/20 border-t-white dark:border-t-[#020617] rounded-full animate-spin" />
          ) : (
            <Play size={16} />
          )}
          {loading ? "Running..." : "Run Automation"}
        </button>
      </div>

      <div className="lg:col-span-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden flex flex-col h-[500px]">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-[#020617]/50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white">Execution Results</h3>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-[#666] space-y-4">
              <div className="w-8 h-8 border-2 border-sky-600/20 dark:border-[#00E5FF]/20 border-t-sky-600 dark:border-t-[#00E5FF] rounded-full animate-spin"></div>
              <p className="text-sm animate-pulse">Running {automation.name}...</p>
            </div>
          ) : (
            renderResults()
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Mail, Sparkles, BrainCircuit, Upload, FileText, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// The real MailCraft webhook contract (per the n8n workflow's "Prospect
// Variables" node) -- only email is actually required downstream ("Has
// Email?" gates everything else). Every other field is optional context
// that improves personalization but won't hard-fail without it.
type Candidate = {
  firstName: string;
  lastName: string;
  title: string;
  companyName: string;
  email: string;
  employees: string;
  industry: string;
  keywords: string;
  personLinkedinUrl: string;
  website: string;
  companyLinkedinUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  companyAddress: string;
  companyPhone: string;
  technologies: string;
};

const EMPTY_CANDIDATE: Candidate = {
  firstName: "",
  lastName: "",
  title: "",
  companyName: "",
  email: "",
  employees: "",
  industry: "",
  keywords: "",
  personLinkedinUrl: "",
  website: "",
  companyLinkedinUrl: "",
  facebookUrl: "",
  twitterUrl: "",
  companyAddress: "",
  companyPhone: "",
  technologies: "",
};

const CSV_COLUMNS = Object.keys(EMPTY_CANDIDATE) as (keyof Candidate)[];
const MAX_BULK_CANDIDATES = 30;

type MailCraftResult = {
  firstName: string;
  companyName: string;
  email: string;
  sequence: {
    sender: string;
    subjectLine1: string; emailBody1: string;
    subjectLine2: string; emailBody2: string;
    subjectLine3: string; emailBody3: string;
    subjectLine4: string; emailBody4: string;
  };
  emailsGenerated: number;
  creditsCharged: number;
  error?: string;
};

// Minimal CSV parser -- handles quoted fields (including embedded commas
// and escaped "" quotes), which covers standard Google Sheets/Excel CSV
// exports without pulling in a dependency for this one form.
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some(f => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length > 0) { row.push(field); rows.push(row); }
  if (rows.length === 0) return [];

  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).map(r => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = (r[idx] || "").trim(); });
    return obj;
  });
}

export default function MailCraftBoard() {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [single, setSingle] = useState<Candidate>({ ...EMPTY_CANDIDATE });
  const [bulkCandidates, setBulkCandidates] = useState<Candidate[]>([]);
  const [bulkFileName, setBulkFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<MailCraftResult[]>([]);
  const [expandedCell, setExpandedCell] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    }
    fetchUser();
  }, [supabase.auth]);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const parsed = parseCsv(text);
      if (parsed.length === 0) {
        toast.error("Couldn't find any rows in that file.");
        return;
      }
      const missingEmail = parsed.filter(r => !r.email || !r.email.trim()).length;
      let candidates: Candidate[] = parsed
        .filter(r => r.email && r.email.trim())
        .map(r => {
          const c = { ...EMPTY_CANDIDATE };
          CSV_COLUMNS.forEach(col => { c[col] = r[col] || ""; });
          return c;
        });

      const overflow = candidates.length - MAX_BULK_CANDIDATES;
      if (overflow > 0) {
        candidates = candidates.slice(0, MAX_BULK_CANDIDATES);
      }

      setBulkCandidates(candidates);
      setBulkFileName(file.name);
      if (overflow > 0) {
        toast.warning(`This automation handles up to ${MAX_BULK_CANDIDATES} at a time — using the first ${MAX_BULK_CANDIDATES} rows, dropped the remaining ${overflow}.`);
      } else if (missingEmail > 0) {
        toast.warning(`Loaded ${candidates.length} rows — skipped ${missingEmail} with no email (required field).`);
      } else {
        toast.success(`Loaded ${candidates.length} candidates from ${file.name}.`);
      }
    };
    reader.readAsText(file);
  };

  const runOne = async (candidate: Candidate): Promise<MailCraftResult | null> => {
    const payload = { ...candidate, userId: userId || "ad409f1e-7150-4ed1-a4d1-ab5d523ab265" };
    try {
      const res = await fetch("/api/mailcraft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const result = Array.isArray(data) ? data[0] : data;

      if (!res.ok || !result) {
        return { firstName: candidate.firstName, companyName: candidate.companyName, email: candidate.email, sequence: {} as any, emailsGenerated: 0, creditsCharged: 0, error: "No response from MailCraft" };
      }
      if (result.message === "INSUFFICIENT CREDITS") {
        return { firstName: candidate.firstName, companyName: candidate.companyName, email: candidate.email, sequence: {} as any, emailsGenerated: 0, creditsCharged: 0, error: `Insufficient credits (needs ${result.creditsNeeded}, have ${result.creditsRemaining})` };
      }
      if (result.message === "Missing required field: email") {
        return { firstName: candidate.firstName, companyName: candidate.companyName, email: candidate.email, sequence: {} as any, emailsGenerated: 0, creditsCharged: 0, error: "Missing email" };
      }
      if (!result.sequence) {
        return { firstName: candidate.firstName, companyName: candidate.companyName, email: candidate.email, sequence: {} as any, emailsGenerated: 0, creditsCharged: 0, error: "Unexpected response shape" };
      }
      return result;
    } catch (err) {
      console.error("MailCraft request failed:", err);
      return { firstName: candidate.firstName, companyName: candidate.companyName, email: candidate.email, sequence: {} as any, emailsGenerated: 0, creditsCharged: 0, error: "Request failed" };
    }
  };

  // Bulk sends the whole sheet as ONE request -- { candidates: [...], userId }
  // -- and expects ONE response back: an array with one result per candidate,
  // each shaped like the existing single-candidate response (firstName,
  // companyName, email, sequence{...}, emailsGenerated). n8n is the engine
  // here; this just sends the sheet in and renders whatever sheet comes back.
  const runBatch = async (candidates: Candidate[]): Promise<MailCraftResult[]> => {
    const payload = { candidates, userId: userId || "ad409f1e-7150-4ed1-a4d1-ab5d523ab265" };
    try {
      const res = await fetch("/api/mailcraft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(
          data?.message === "INSUFFICIENT CREDITS"
            ? `Insufficient credits (needs ${data.creditsNeeded}, have ${data.creditsRemaining})`
            : "MailCraft didn't accept this batch."
        );
        return [];
      }

      // Accept either a bare array, or { results: [...] } -- whichever shape
      // the workflow ends up responding with.
      const rows: any[] = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

      if (rows.length === 0) {
        toast.error("MailCraft returned an empty batch.");
        return [];
      }

      return rows.map((r) => ({
        firstName: r.firstName || "",
        companyName: r.companyName || "",
        email: r.email || "",
        sequence: r.sequence || ({} as any),
        emailsGenerated: r.emailsGenerated || 0,
        creditsCharged: r.creditsCharged || 0,
        error: r.error || (!r.sequence ? "Missing or failed" : undefined),
      }));
    } catch (err) {
      console.error("MailCraft batch request failed:", err);
      toast.error("Couldn't reach MailCraft. Check your connection and try again.");
      return [];
    }
  };

  const handleGenerate = async () => {
    if (mode === "single") {
      if (!single.email.trim()) {
        toast.error("Email is required.");
        return;
      }
      setIsGenerating(true);
      setResults([]);
      setProgress({ done: 0, total: 1 });
      const result = await runOne(single);
      setIsGenerating(false);
      if (result) {
        setResults([result]);
        setProgress({ done: 1, total: 1 });
        if (result.error) toast.error(result.error);
        else toast.success("Sequence generated.");
      }
      return;
    }

    if (bulkCandidates.length === 0) {
      toast.error("Upload a sheet with at least one candidate first.");
      return;
    }

    setIsGenerating(true);
    setResults([]);
    setProgress({ done: 0, total: bulkCandidates.length });

    const rows = await runBatch(bulkCandidates);

    setIsGenerating(false);
    setResults(rows);
    setProgress({ done: rows.length, total: bulkCandidates.length });

    const succeeded = rows.filter(r => !r.error).length;
    if (rows.length === 0) {
      // runBatch already toasted the specific reason
    } else if (succeeded === 0) {
      toast.error("No sequences were generated. Check the results for details.");
    } else {
      toast.success(`Generated sequences for ${succeeded} of ${bulkCandidates.length} candidate${bulkCandidates.length === 1 ? "" : "s"}.`);
    }
  };

  const updateSingleField = (field: keyof Candidate, value: string) => {
    setSingle(prev => ({ ...prev, [field]: value }));
  };

  // JSON is what n8n sends back; CSV is only ever built here, client-side,
  // from real in-memory objects -- no encode/decode round-trip through a
  // text format, which is exactly the risk we're avoiding on the n8n side.
  const downloadCsv = () => {
    const headers = ["Name", "Company", "Email", "Sender", "Subject 1", "Email 1", "Subject 2", "Email 2", "Subject 3", "Email 3", "Subject 4", "Email 4"];
    const escapeCsv = (val: string) => `"${String(val ?? "").replace(/"/g, '""')}"`;
    const rows = results.map((r) => [
      r.firstName, r.companyName, r.email, r.sequence?.sender || "",
      r.sequence?.subjectLine1 || "", r.sequence?.emailBody1 || "",
      r.sequence?.subjectLine2 || "", r.sequence?.emailBody2 || "",
      r.sequence?.subjectLine3 || "", r.sequence?.emailBody3 || "",
      r.sequence?.subjectLine4 || "", r.sequence?.emailBody4 || "",
    ].map(escapeCsv).join(","));
    const csv = [headers.map(escapeCsv).join(","), ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mailcraft-sequences-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Input */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4 text-lg">
            <BrainCircuit className="w-5 h-5 text-indigo-500" />
            MailCraft
          </h3>

          <div className="flex gap-2 mb-6 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => setMode("single")}
              className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${mode === "single" ? "bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-sm" : "text-slate-500"}`}
            >
              Single
            </button>
            <button
              onClick={() => setMode("bulk")}
              className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${mode === "bulk" ? "bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-sm" : "text-slate-500"}`}
            >
              Bulk Upload
            </button>
          </div>

          {mode === "single" ? (
            <div className="space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
              {([
                ["firstName", "First Name"], ["lastName", "Last Name"], ["title", "Title"],
                ["companyName", "Company Name"], ["email", "Email *"], ["employees", "# Employees"],
                ["industry", "Industry"], ["keywords", "Keywords"], ["personLinkedinUrl", "Personal LinkedIn URL"],
                ["website", "Website"], ["companyLinkedinUrl", "Company LinkedIn URL"],
                ["facebookUrl", "Facebook URL"], ["twitterUrl", "Twitter URL"],
                ["companyAddress", "Company Address"], ["companyPhone", "Company Phone"], ["technologies", "Technologies"],
              ] as [keyof Candidate, string][]).map(([field, label]) => (
                <div key={field} className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>
                  <input
                    value={single[field]}
                    onChange={(e) => updateSingleField(field, e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-white/10 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-colors"
              >
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Click to upload a CSV</p>
                <p className="text-xs text-slate-500 mt-1">Up to {MAX_BULK_CANDIDATES} rows at a time.</p>
                <p className="text-xs text-slate-400 mt-2">
                  Columns: {CSV_COLUMNS.join(", ")}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                  e.target.value = "";
                }}
              />
              {bulkFileName && (
                <div className="flex items-center justify-between bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{bulkFileName}</span>
                    <span className="text-xs text-slate-500 shrink-0">({bulkCandidates.length} rows)</span>
                  </div>
                  <button
                    onClick={() => { setBulkFileName(null); setBulkCandidates([]); }}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating || (mode === "bulk" && bulkCandidates.length === 0)}
            className="w-full mt-6 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-medium px-4 py-3.5 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] disabled:opacity-50 disabled:shadow-none hover:-translate-y-0.5"
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Sparkles size={18} fill="currentColor" />
            )}
            {isGenerating
              ? mode === "single" ? "Crafting..." : `Crafting sequences for ${progress.total} candidate${progress.total === 1 ? "" : "s"}...`
              : mode === "single" ? "Generate Sequence" : `Generate for ${bulkCandidates.length || 0} Candidates`}
          </button>
        </div>
      </div>

      {/* Right Column: Results table, one row per candidate, 4 emails side by side */}
      <div className="lg:col-span-2 flex flex-col h-[800px] bg-slate-50 dark:bg-[#0B1121] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm relative">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#0F172A] flex justify-between items-center z-10">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            Generated Sequences
          </h3>
          {results.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                {results.reduce((sum, r) => sum + (r.creditsCharged || 0), 0)} credits used
              </span>
              <button
                onClick={downloadCsv}
                className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 rounded-full px-3 py-1 transition-colors"
              >
                Download CSV
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          {!isGenerating && results.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-[#555] max-w-sm mx-auto text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
                <Mail size={28} className="text-indigo-400 dark:text-indigo-500" />
              </div>
              <p className="text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Ready to Draft</p>
              <p className="text-xs leading-relaxed">Fill in a candidate or upload a sheet, then generate to see the 4-email sequence here.</p>
            </div>
          )}

          {(isGenerating || results.length > 0) && (
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 bg-white dark:bg-[#0F172A] z-10">
                <tr className="border-b border-slate-200 dark:border-white/10">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 w-48">Candidate</th>
                  {[1, 2, 3, 4].map(n => (
                    <th key={n} className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Email {n}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-white/5 align-top">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-white">{r.firstName || "—"}</p>
                      <p className="text-xs text-slate-500">{r.companyName}</p>
                      <p className="text-xs text-slate-400 truncate">{r.email}</p>
                      {r.error && <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{r.error}</p>}
                    </td>
                    {([1, 2, 3, 4] as const).map(n => {
                      const subject = r.sequence?.[`subjectLine${n}` as keyof typeof r.sequence] as string | undefined;
                      const body = r.sequence?.[`emailBody${n}` as keyof typeof r.sequence] as string | undefined;
                      const cellKey = `${idx}-${n}`;
                      const isExpanded = expandedCell === cellKey;
                      if (!subject && !body) {
                        return <td key={n} className="px-4 py-3 text-slate-300 dark:text-slate-700">—</td>;
                      }
                      return (
                        <td key={n} className="px-4 py-3 max-w-xs">
                          <button
                            onClick={() => setExpandedCell(isExpanded ? null : cellKey)}
                            className="text-left w-full"
                          >
                            <p className="font-medium text-slate-800 dark:text-slate-200 text-xs mb-1">{subject}</p>
                            <p className={`text-xs text-slate-500 dark:text-slate-400 whitespace-pre-wrap ${isExpanded ? "" : "line-clamp-3"}`}>
                              {body}
                            </p>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {isGenerating && (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-center text-slate-400 text-xs">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
                        {progress.total === 1
                          ? "Crafting sequence..."
                          : `MailCraft is working through all ${progress.total} candidates in one batch — this can take a while for larger sheets.`}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Book, Database, Plus, Search, FileText, Globe, X, MessageSquareQuote } from "lucide-react";
import { toast } from "sonner";
import { Select } from "@/components/ui/Select";

const INITIAL_SOURCES = [
  { id: 1, type: 'pdf', title: 'Company Handbook 2026', size: '2.4MB', updated: '2d ago', systems: 2, icon: FileText },
  { id: 2, type: 'web', title: 'Marketing Site Crawler', size: 'knoxified.com', updated: '1h ago', systems: 4, icon: Globe },
  { id: 3, type: 'pdf', title: 'Sales Playbook v3', size: '1.8MB', updated: '4d ago', systems: 1, icon: FileText },
  { id: 4, type: 'web', title: 'Help Desk Articles', size: 'support.knoxified.com', updated: '12h ago', systems: 1, icon: Globe },
  { id: 5, type: 'pdf', title: 'Product Roadmap Q3', size: '540KB', updated: '1w ago', systems: 3, icon: FileText },
];

export default function KnowledgeBasePage() {
  const [sources, setSources] = useState(INITIAL_SOURCES);
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSource, setNewSource] = useState({
    title: "",
    type: "pdf",
    url: "",
    qa_question: "",
    qa_answer: "",
  });

  const handleAddSource = () => {
    if (!newSource.title) {
      toast.error("Please provide a title for the source.");
      return;
    }

    const newSrc = {
      id: sources.length + 1,
      title: newSource.title,
      type: newSource.type,
      size: newSource.type === 'pdf' ? '120KB' : newSource.type === 'qa' ? '1 Pair' : newSource.url || 'website.com',
      updated: 'Just now',
      systems: 0,
      icon: newSource.type === 'pdf' ? FileText : newSource.type === 'web' ? Globe : newSource.type === 'qa' ? MessageSquareQuote : Database,
    };

    setSources([newSrc, ...sources]);
    setShowAddSource(false);
    toast.success("Source added successfully.");
    setNewSource({
      title: "",
      type: "pdf",
      url: "",
      qa_question: "",
      qa_answer: "",
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
            Knowledge Base
          </h1>
          <p className="text-slate-500 dark:text-[#888] text-sm">
            Manage the data, PDFs, and links your systems use for context.
          </p>
        </div>
        <button onClick={() => setShowAddSource(true)} className="flex items-center gap-2 bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-slate-900 dark:text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={18} /> Add Source
        </button>
      </div>

      {showAddSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Add New Knowledge Source</h2>
              <button onClick={() => setShowAddSource(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Source Name <span className="text-rose-500">*</span></label>
                <input type="text" value={newSource.title} onChange={(e) => setNewSource({ ...newSource, title: e.target.value })} placeholder="e.g. Q4 Sales Playbook" className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#00E5FF]" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Source Type</label>
                <Select 
                  value={newSource.type} 
                  onChange={(val) => setNewSource({ ...newSource, type: val })} 
                  options={[
                    { value: "pdf", label: "Document Upload (PDF/Word)" },
                    { value: "web", label: "Web Crawler / URL" },
                    { value: "database", label: "Database Connection" }
                  ]}
                />
              </div>

              {newSource.type === 'web' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL to Crawl <span className="text-rose-500">*</span></label>
                  <input type="text" value={newSource.url} onChange={(e) => setNewSource({ ...newSource, url: e.target.value })} placeholder="e.g. https://docs.example.com" className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#00E5FF]" />
                </div>
              )}
              {newSource.type === 'pdf' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Upload File <span className="text-rose-500">*</span></label>
                  <div className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <FileText className="mx-auto h-8 w-8 text-slate-400 dark:text-[#666] mb-2" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-500 dark:text-[#888] mt-1">PDF, DOCX, TXT up to 10MB</p>
                  </div>
                </div>
              )}
              {newSource.type === 'qa' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Question / Prompt <span className="text-rose-500">*</span></label>
                    <input type="text" value={newSource.qa_question} onChange={(e) => setNewSource({ ...newSource, qa_question: e.target.value })} placeholder="e.g. What are the store hours?" className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#00E5FF]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Answer / Response <span className="text-rose-500">*</span></label>
                    <textarea rows={3} value={newSource.qa_answer} onChange={(e) => setNewSource({ ...newSource, qa_answer: e.target.value })} placeholder="e.g. We are open Monday to Friday from 9 AM to 5 PM." className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#00E5FF] resize-none" />
                  </div>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-slate-200 dark:border-white/5 flex justify-end gap-3">
              <button onClick={() => setShowAddSource(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-[#888] hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleAddSource} className="px-4 py-2 text-sm font-medium bg-[#00E5FF] text-slate-900 rounded-lg hover:bg-[#00E5FF]/90 transition-colors">
                Add Source
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sources.map(source => (
          <div key={source.id} className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-6 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300 cursor-pointer group flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/5 flex items-center justify-center mb-4">
                <source.icon size={18} className="text-sky-600 dark:text-[#00E5FF]" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5">{source.title}</h3>
              <p className="text-[13px] text-slate-500 dark:text-[#888] mb-6">
                {source.type === 'pdf' ? 'PDF' : source.type === 'web' ? 'Web' : source.type === 'qa' ? 'Q&A' : 'Database'} &bull; {source.size} &bull; {source.type === 'pdf' ? 'Uploaded' : 'Synced'} {source.updated}
              </p>
            </div>
            <div className="text-[12px] text-slate-400 dark:text-[#666] font-medium flex items-center justify-between border-t border-slate-200 dark:border-white/5 pt-4">
              <span>Used by {source.systems} systems</span>
              <span className="text-sky-600 dark:text-[#00E5FF] group-hover:text-sky-600 dark:text-[#00E5FF]/80 transition-colors">Manage</span>
            </div>
          </div>
        ))}

        <div onClick={() => { setNewSource({ ...newSource, type: 'database' }); setShowAddSource(true); }} className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-6 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300 cursor-pointer group flex flex-col items-center justify-center text-center opacity-70 hover:opacity-100 border-dashed min-h-[220px]">
          <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/5 text-slate-500 dark:text-[#888] flex items-center justify-center mb-4">
            <Database size={20} />
          </div>
          <h3 className="text-slate-900 dark:text-white font-semibold text-base mb-1.5">Connect Database</h3>
          <p className="text-[13px] text-slate-500 dark:text-[#888]">Sync with Postgres, MySQL, or Mongo</p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { getServices, saveServices, type ServicePrice } from "@/lib/actions/services-actions";

const inputCls =
  "bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500";

export function ServicesPricing() {
  const [rows, setRows] = useState<{ id: string; name: string; price: string }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getServices().then((r) => {
      setRows(r.services.map((s) => ({ id: s.id, name: s.name, price: String(s.price) })));
      setLoaded(true);
    });
  }, []);

  function edit(id: string, key: "name" | "price", value: string) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    const payload: ServicePrice[] = rows.map((r) => ({ id: r.id, name: r.name, price: Number(r.price) }));
    const res = await saveServices(payload);
    setSaving(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Services & prices saved");
    setDirty(false);
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <label className="block text-[13px] font-medium text-slate-500 dark:text-[#888]">
          Services &amp; prices ({rows.length})
        </label>
        <button
          type="button"
          onClick={() => {
            setRows((rs) => [...rs, { id: crypto.randomUUID(), name: "", price: "" }]);
            setDirty(true);
          }}
          className="flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-500"
        >
          <Plus size={14} /> Add service
        </button>
      </div>
      <p className="text-xs text-slate-400 dark:text-[#666]">
        Used to estimate revenue on your Overview. When an appointment&apos;s date passes without being cancelled, its type is matched to a service name here and the price is added. Name each service the way it appears on your bookings.
      </p>
      {loaded && rows.length === 0 && (
        <p className="text-xs text-slate-400 dark:text-[#666]">No services yet. Add your first one.</p>
      )}
      {rows.map((r) => (
        <div key={r.id} className="flex items-center gap-2">
          <input
            type="text"
            value={r.name}
            onChange={(e) => edit(r.id, "name", e.target.value)}
            placeholder="Service (e.g. Teeth cleaning)"
            className={`flex-1 ${inputCls}`}
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={r.price}
            onChange={(e) => edit(r.id, "price", e.target.value)}
            placeholder="Price (USD)"
            className={`w-32 ${inputCls}`}
          />
          <button
            type="button"
            onClick={() => {
              setRows((rs) => rs.filter((x) => x.id !== r.id));
              setDirty(true);
            }}
            aria-label="Delete service"
            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty}
          className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Saving..." : "Save services & prices"}
        </button>
        {dirty && <span className="text-xs text-amber-500">Unsaved changes</span>}
      </div>
    </div>
  );
}

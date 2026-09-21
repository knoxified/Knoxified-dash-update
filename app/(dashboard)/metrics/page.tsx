"use client";

import { useEffect, useState } from "react";
import { Phone, Zap, Layers, FileText } from "lucide-react";
import { getDashboardStats, getRecentActivityLogs } from "@/lib/actions/dashboard-actions";

interface Stats {
  voiceMinutes: number;
  automationRuns: number;
  activeSystemsCount: number;
}

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string | null;
  created_at: string;
  metadata?: { details?: string };
}

export default function MetricsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [statsResult, logsResult] = await Promise.all([
          getDashboardStats(),
          getRecentActivityLogs(),
        ]);
        setStats(statsResult);
        setLogs(logsResult);
      } catch (err: any) {
        setLoadError(err.message || "Failed to load metrics");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-1">
          Metrics
        </h1>
        <p className="text-slate-500 dark:text-[#888] text-sm">
          Real usage across your account, all-time.
        </p>
      </div>

      {loadError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-500 dark:text-red-400 text-sm">
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={Phone} label="Voice Minutes Used" value={stats?.voiceMinutes ?? 0} suffix="min" />
          <StatCard icon={Zap} label="Automation Runs" value={stats?.automationRuns ?? 0} />
          <StatCard icon={Layers} label="Active Systems" value={stats?.activeSystemsCount ?? 0} />
        </div>
      )}

      <div className="glass-card card-hover rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <FileText size={16} className="text-slate-500 dark:text-white/40" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
        </div>
        {!loading && logs.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-white/30">No activity recorded yet.</p>
        )}
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start justify-between gap-3 text-sm border-b border-slate-100 dark:border-white/[0.05] pb-3 last:border-0 last:pb-0">
              <div>
                <p className="text-slate-800 dark:text-slate-200">{log.action}</p>
                {log.metadata?.details && (
                  <p className="text-slate-500 dark:text-white/30 text-xs mt-0.5">{log.metadata.details}</p>
                )}
              </div>
              <span className="text-slate-400 dark:text-white/25 text-xs whitespace-nowrap">
                {new Date(log.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, suffix }: { icon: React.ElementType; label: string; value: number; suffix?: string }) {
  return (
    <div className="glass-card card-hover rounded-xl p-5 flex flex-col justify-between h-32">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-slate-500 dark:text-white/40" />
        <h3 className="text-slate-600 dark:text-white/60 font-medium text-[13px]">{label}</h3>
      </div>
      <div className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
        {value.toLocaleString()}{suffix ? <span className="text-base font-medium text-slate-400 dark:text-white/30 ml-1">{suffix}</span> : null}
      </div>
    </div>
  );
}

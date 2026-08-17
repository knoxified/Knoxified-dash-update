"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface FeedItem {
  id: string;
  type: "win" | "warning";
  system: string;
  message: string;
  timestamp: string;
}

const formatTimeAgo = (dateStr: string) => {
  if (!dateStr) return "just now";
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

export function ActivityFeed({ filter = "All" }: { filter?: string }) {
  const [feed, setFeed] = useState<FeedItem[]>([]);

  useEffect(() => {
    const supabase = createClient();
    
    const automationSub = supabase
      .channel('automation_runs_feed')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'automation_runs' 
      }, (payload: any) => {
        const newRecord = payload.new;
        const oldRecord = payload.old;
        if (newRecord.status === 'completed' && oldRecord.status !== 'completed') {
          const newItem: FeedItem = {
            id: `auto-${newRecord.id}-${Date.now()}`,
            type: 'win',
            system: newRecord.automation_key || 'System',
            message: `automation run completed successfully`,
            timestamp: newRecord.completed_at || new Date().toISOString()
          };
          setFeed(prev => [newItem, ...prev].slice(0, 50));
        }
      })
      .subscribe();

    const auditSub = supabase
      .channel('audit_logs_feed')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'audit_logs' 
      }, (payload: any) => {
        const newRecord = payload.new;
        if (newRecord.error_message) {
          const newItem: FeedItem = {
            id: `audit-${newRecord.id}-${Date.now()}`,
            type: 'warning',
            system: newRecord.action || 'System Error',
            message: newRecord.error_message,
            timestamp: newRecord.created_at || new Date().toISOString()
          };
          setFeed(prev => [newItem, ...prev].slice(0, 50));
        }
      })
      .subscribe();

    const fetchInitial = async () => {
       const { data: runs } = await supabase
         .from('automation_runs')
         .select('*')
         .eq('status', 'completed')
         .order('completed_at', { ascending: false })
         .limit(10);
         
       const { data: audits } = await supabase
         .from('audit_logs')
         .select('*')
         .not('error_message', 'is', null)
         .order('created_at', { ascending: false })
         .limit(10);

       const items: FeedItem[] = [];
       if (runs) {
         runs.forEach((r: any) => {
           items.push({
             id: `auto-${r.id}`,
             type: 'win',
             system: r.automation_key || 'System',
             message: `automation run completed successfully`,
             timestamp: r.completed_at
           });
         });
       }
       if (audits) {
         audits.forEach((a: any) => {
           items.push({
             id: `audit-${a.id}`,
             type: 'warning',
             system: a.action || 'System Error',
             message: a.error_message,
             timestamp: a.created_at
           });
         });
       }
       
       items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
       setFeed(items.slice(0, 20));
    };
    
    fetchInitial();

    return () => {
      supabase.removeChannel(automationSub);
      supabase.removeChannel(auditSub);
    };
  }, []);

  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const filteredFeed = feed.filter(item => 
    filter === 'All' || 
    item.system.toLowerCase().includes(filter.toLowerCase()) || 
    item.message.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-2 overflow-y-auto max-h-[380px]">
      {filteredFeed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-center">
            <span className="text-slate-300 dark:text-white/20 text-lg">◎</span>
          </div>
          <p className="text-[13px] text-slate-400 dark:text-white/25 font-medium">No recent activity</p>
        </div>
      ) : (
        filteredFeed.map((item, i) => (
          <div 
            key={item.id} 
            className="flex gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-all group border-b border-slate-100/80 dark:border-white/[0.04] last:border-0 animate-in slide-in-from-right-3 fade-in duration-400"
            style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
          >
            {/* Icon */}
            <div className="mt-0.5 shrink-0">
              {item.type === 'win' ? (
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)', boxShadow: '0 0 8px rgba(16,185,129,0.2)' }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)', boxShadow: '0 0 8px rgba(245,158,11,0.2)' }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 3v3M5 7.5v.5" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-slate-600 dark:text-white/60 leading-snug">
                <span className="font-semibold text-slate-800 dark:text-white/80">{item.system}</span>
                {' '}{item.message}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-white/25 mt-1 font-medium">{formatTimeAgo(item.timestamp)}</p>
            </div>

            {/* Live dot on newest items */}
            {i === 0 && (
              <div className="mt-1.5 shrink-0">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--accent)' }} />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: 'var(--accent)' }} />
                </span>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

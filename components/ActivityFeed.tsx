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
    
    // Subscribe to automation_runs updates
    const automationSub = supabase
      .channel('automation_runs_feed')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'automation_runs' 
      }, (payload: any) => {
        const newRecord = payload.new;
        const oldRecord = payload.old;
        
        // If status changes to completed
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

    // Subscribe to audit_logs inserts
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

    // Load initial data
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

  // Update time ago strings every minute
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
    <div className="p-2 overflow-y-auto max-h-[400px]">
      {filteredFeed.length === 0 ? (
        <div className="p-4 text-center text-[13px] text-slate-500">No recent activity</div>
      ) : (
        filteredFeed.map((item, i) => (
          <div 
            key={item.id} 
            className="flex gap-3 p-3 rounded-md hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group border-b border-slate-200 dark:border-white/5 last:border-0 relative animate-in slide-in-from-right-4 fade-in duration-500"
            style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
          >
            <div className="mt-0.5 opacity-80">
              {item.type === 'win' ? (
                <span className="text-emerald-600 dark:text-[#10B981] text-sm font-bold">✓</span>
              ) : (
                <span className="text-amber-500 dark:text-amber-400 text-sm font-bold">!</span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-[14px] text-slate-700 dark:text-[#EDEDED] leading-snug">
                <span className="font-semibold text-slate-900 dark:text-white">{item.system}</span> {item.message}
              </p>
              <p className="text-slate-500 dark:text-[#888] text-[12px] mt-1.5 font-medium">{formatTimeAgo(item.timestamp)}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

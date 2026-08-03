"use client";

import { Select } from "@/components/ui/Select";
import { Search, Settings, X, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function AutomationsPage() {
  const router = useRouter();
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Settings modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeAutomation, setActiveAutomation] = useState<any>(null);
  const [settingsJson, setSettingsJson] = useState<string>("");

  const supabase = createClient();

  const fetchAutomations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      // Fetch catalog
      const { data: catalog, error: catalogError } = await supabase
        .from('automation_catalog')
        .select('*')
        .eq('is_active', true);
        
      if (catalogError) throw catalogError;
      
      let userAutomationsMap = new Map();
      if (user) {
        // Fetch user automations
        const { data: userAutos, error: userAutosError } = await supabase
          .from('user_automations')
          .select('*')
          .eq('user_id', user.id);
          
        if (userAutosError) throw userAutosError;
        
        userAutos.forEach(ua => {
          userAutomationsMap.set(ua.automation_id, ua);
        });
      }
      
      // Merge
      const merged = catalog.map(cat => {
        const ua = userAutomationsMap.get(cat.id);
        return {
          ...cat,
          user_automation_id: ua?.id || null,
          enabled: ua?.is_enabled || false,
          settings: ua?.settings || {},
        };
      });
      
      setAutomations(merged);
    } catch (err: any) {
      console.error("Error fetching automations:", err);
      toast.error(err.message || "Failed to load automations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    fetchAutomations();
  }, []);

  const toggleAutomation = async (aut: any) => {
    if (!currentUser) {
      toast.error("You must be logged in to enable automations");
      return;
    }
    
    const newEnabled = !aut.enabled;
    const previousState = [...automations];
    
    // Optimistic update
    setAutomations(prev => 
      prev.map(a => a.id === aut.id ? { ...a, enabled: newEnabled } : a)
    );
    
    try {
      if (aut.user_automation_id) {
        // Update existing record
        const { error } = await supabase
          .from('user_automations')
          .update({ is_enabled: newEnabled })
          .eq('id', aut.user_automation_id);
          
        if (error) throw error;
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('user_automations')
          .insert({
            user_id: currentUser.id,
            automation_id: aut.id,
            is_enabled: newEnabled,
            settings: aut.settings
          })
          .select()
          .single();
          
        if (error) throw error;
        
        // Update with the newly created ID
        setAutomations(prev => 
          prev.map(a => a.id === aut.id ? { ...a, user_automation_id: data.id } : a)
        );
      }
      toast.success(`Automation ${newEnabled ? 'enabled' : 'disabled'}`);
    } catch (err: any) {
      console.error("Error toggling automation:", err);
      toast.error("Failed to update automation state");
      // Revert optimistic update
      setAutomations(previousState);
    }
  };

  const openSettings = (aut: any) => {
    setActiveAutomation(aut);
    setSettingsJson(JSON.stringify(aut.settings, null, 2));
    setIsSettingsOpen(true);
  };

  const saveSettings = async () => {
    if (!currentUser || !activeAutomation) return;
    
    let parsedSettings = {};
    try {
      parsedSettings = JSON.parse(settingsJson);
    } catch (err) {
      toast.error("Invalid JSON structure");
      return;
    }
    
    try {
      if (activeAutomation.user_automation_id) {
        // Update existing
        const { error } = await supabase
          .from('user_automations')
          .update({ settings: parsedSettings })
          .eq('id', activeAutomation.user_automation_id);
          
        if (error) throw error;
      } else {
        // Insert new (implicitly disabled since it hasn't been toggled, but creating record anyway)
        const { data, error } = await supabase
          .from('user_automations')
          .insert({
            user_id: currentUser.id,
            automation_id: activeAutomation.id,
            is_enabled: false,
            settings: parsedSettings
          })
          .select()
          .single();
          
        if (error) throw error;
        
        // Update ID
        setAutomations(prev => 
          prev.map(a => a.id === activeAutomation.id ? { ...a, user_automation_id: data.id } : a)
        );
      }
      
      setAutomations(prev => 
        prev.map(a => a.id === activeAutomation.id ? { ...a, settings: parsedSettings } : a)
      );
      
      toast.success("Settings saved successfully");
      setIsSettingsOpen(false);
    } catch (err: any) {
      console.error("Error saving settings:", err);
      toast.error("Failed to save settings");
    }
  };

  const filteredAutomations = automations.filter(aut => 
    aut.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (aut.description && aut.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
     return <div className="animate-pulse bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl h-64 w-full"></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
            Automations
          </h1>
          <p className="text-slate-500 dark:text-[#888] text-sm">
            Micro-services that run silently in the background of your business.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-[#888]" size={16} />
          <input 
            type="text" 
            placeholder="Search automations..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white text-sm rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-sky-600 dark:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-all placeholder:text-slate-400 dark:text-[#666]"
          />
        </div>
        <div className="w-48">
          <Select
            value="All Categories"
            onChange={() => {}}
            options={[
              { value: "All Categories", label: "All Categories" },
              { value: "Sales", label: "Sales" },
              { value: "Marketing", label: "Marketing" },
              { value: "Operations", label: "Operations" },
              { value: "Finance", label: "Finance" },
              { value: "Support", label: "Support" },
              { value: "Admin", label: "Admin" }
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredAutomations.map((aut) => {
          const nameParts = aut.name.split(" ");
          const possibleEmoji = nameParts[nameParts.length - 1];
          const hasEmojiMatch = /\p{Emoji}/u.test(possibleEmoji);
          const icon = hasEmojiMatch ? possibleEmoji : "⚡";
          const title = hasEmojiMatch ? nameParts.slice(0, -1).join(" ") : aut.name;

          return (
            <div 
              key={aut.id} 
              className={`bg-white dark:bg-[#0F172A] border rounded-xl p-6 flex flex-col hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300 ${aut.enabled ? 'border-sky-300 dark:border-[#00E5FF]/20 shadow-sm shadow-[#00E5FF]/5' : 'border-slate-200 dark:border-white/5'}`}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/5 flex items-center justify-center text-lg">
                    {icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">{title}</h3>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${aut.enabled ? 'bg-emerald-100 dark:bg-[#10B981]/10 text-emerald-600 dark:text-[#10B981] border-[#10B981]/20' : 'bg-slate-200 dark:bg-white/5 text-slate-500 dark:text-[#888] border-transparent'}`}>
                      {aut.enabled ? 'Running' : 'Paused'}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => toggleAutomation(aut)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${aut.enabled ? 'bg-[#00E5FF]' : 'bg-slate-300 dark:bg-white/10'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${aut.enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                </button>
              </div>
              
              <p className="text-[14px] text-slate-500 dark:text-[#888] leading-relaxed flex-1 mb-4">
                {aut.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/5">
                <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500 dark:text-[#888]">
                  <span>Cost: {aut.credit_cost} credits</span>
                </div>
                <button 
                  onClick={() => openSettings(aut)}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-[#00E5FF] transition-colors bg-slate-50 hover:bg-sky-50 dark:bg-[#020617] dark:hover:bg-[#00E5FF]/10 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5"
                >
                  <Settings size={14} /> Settings
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings size={18} className="text-slate-500 dark:text-[#888]" /> 
                {activeAutomation?.name} Settings
              </h3>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <p className="text-sm text-slate-500 dark:text-[#888] mb-4">
                Configure the settings for this automation. Must be valid JSON.
              </p>
              
              <textarea
                value={settingsJson}
                onChange={(e) => setSettingsJson(e.target.value)}
                className="w-full h-64 font-mono text-sm bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-lg p-4 text-slate-900 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] focus:border-[#00E5FF]"
                spellCheck={false}
              />
            </div>
            
            <div className="px-6 py-4 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveSettings}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-sky-600 hover:bg-sky-700 dark:bg-[#00E5FF] dark:hover:bg-[#00E5FF]/90 text-white dark:text-[#020617] transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

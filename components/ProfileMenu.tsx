"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, LogOut, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email || null));
  }, [supabase.auth]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initial = email ? email.charAt(0).toUpperCase() : "?";

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        data-tour="settings"
        className="flex items-center gap-1.5 p-1 pr-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all"
        aria-label="Account menu"
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold text-slate-900"
          style={{ background: "var(--accent)" }}
        >
          {initial}
        </div>
        <ChevronDown size={13} className={`text-slate-400 dark:text-white/30 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0d1117] shadow-xl overflow-hidden z-50">
          {email && (
            <div className="px-3.5 py-3 border-b border-slate-100 dark:border-white/[0.06]">
              <p className="text-[13px] font-medium text-slate-800 dark:text-white/80 truncate">{email}</p>
            </div>
          )}
          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-slate-700 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
          >
            <Settings size={14} className="text-slate-400 dark:text-white/30" />
            Settings &amp; Compliance
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors border-t border-slate-100 dark:border-white/[0.06]"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

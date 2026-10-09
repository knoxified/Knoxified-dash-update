"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Sparkles } from "lucide-react";

export interface PickerSystem {
  id: string;
  name: string;
  tier?: string;
}

// Dental is the current target market, so it is pinned right after "No system".
const PINNED_FIRST = ["dental"];

// "Custom Agent System" is the same thing as "No system (my own setup)",
// so it is not offered as a separate choice.
export function orderedPickerSystems<T extends PickerSystem>(systems: T[]): T[] {
  const rest = systems.filter((s) => s.id !== "custom");
  const pinned = PINNED_FIRST.map((id) => rest.find((s) => s.id === id)).filter(Boolean) as T[];
  const others = rest
    .filter((s) => !PINNED_FIRST.includes(s.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...pinned, ...others];
}

const tierLabel = (tier?: string) =>
  tier === "pro" ? "Pro" : tier === "enterprise" ? "Enterprise" : "";

interface SystemPickerProps {
  value: string; // "" = no system
  onChange: (id: string) => void;
  systems: PickerSystem[];
  className?: string;
}

export function SystemPicker({ value, onChange, systems, className = "" }: SystemPickerProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const list = orderedPickerSystems(systems);
  const selected = list.find((s) => s.id === value);
  // A saved value that is no longer offered (e.g. "custom") reads as "no system".
  const effectiveValue = selected ? value : "";

  // Position the panel against the viewport so no parent card can clip it.
  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const r = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom - 16;
    const spaceAbove = r.top - 16;
    const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
    setPos(
      openUp
        ? { bottom: window.innerHeight - r.top + 6, left: r.left, width: r.width, maxHeight: Math.min(340, spaceAbove) }
        : { top: r.bottom + 6, left: r.left, width: r.width, maxHeight: Math.min(340, spaceBelow) }
    );
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    // Scrolling the list itself must not close it; only page/ancestor scroll should.
    function onScroll(e: Event) {
      if (panelRef.current && e.target instanceof Node && panelRef.current.contains(e.target)) return;
      setOpen(false);
    }
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (buttonRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  function pick(id: string) {
    onChange(id);
    setOpen(false);
  }

  const itemBase =
    "flex items-center justify-between gap-3 px-3 py-2.5 text-[13px] rounded-xl cursor-pointer transition-all font-medium";

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition-all outline-none shadow-sm border"
        style={{
          background: open
            ? "linear-gradient(135deg, var(--accent-muted), transparent)"
            : "linear-gradient(135deg, var(--accent-dim), transparent)",
          borderColor: open ? "var(--accent)" : "var(--border)",
          boxShadow: open ? "0 0 0 2px var(--accent-dim)" : undefined,
        }}
      >
        <span className="flex items-center gap-2 min-w-0">
          <Sparkles size={13} style={{ color: "var(--accent)" }} className="shrink-0" />
          <span className="truncate text-[13px] font-semibold text-slate-800 dark:text-white/85">
            {selected ? selected.name : "No system (my own setup)"}
          </span>
        </span>
        <ChevronDown
          size={14}
          className={`ml-2 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          style={{ color: open ? "var(--accent)" : undefined }}
        />
      </button>

      {open && pos &&
        createPortal(
          <div
            ref={panelRef}
            className="rounded-2xl border overflow-hidden animate-in fade-in duration-150"
            style={{
              position: "fixed",
              top: pos.top,
              bottom: pos.bottom,
              left: pos.left,
              width: pos.width,
              zIndex: 9999,
              background: "linear-gradient(160deg, var(--surface-2) 55%, var(--accent-dim))",
              borderColor: "var(--border)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.18), 0 0 0 1px var(--border)",
            }}
          >
            <ul className="overflow-y-auto overscroll-contain p-1.5 space-y-0.5" style={{ maxHeight: pos.maxHeight }}>
              <li
                onClick={() => pick("")}
                className={`${itemBase} ${effectiveValue === "" ? "" : "text-slate-600 dark:text-white/55 hover:bg-slate-50 dark:hover:bg-white/[0.05]"}`}
                style={effectiveValue === "" ? { background: "linear-gradient(90deg, var(--accent-muted), transparent)", color: "var(--accent)" } : {}}
              >
                <span>No system (my own setup)</span>
                {effectiveValue === "" && <Check size={13} strokeWidth={2.5} />}
              </li>
              <li aria-hidden className="h-px mx-2 my-1" style={{ background: "var(--border)" }} />
              {list.map((s) => {
                const isSel = effectiveValue === s.id;
                return (
                  <li
                    key={s.id}
                    onClick={() => pick(s.id)}
                    className={`${itemBase} ${isSel ? "" : "text-slate-600 dark:text-white/55 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.05]"}`}
                    style={isSel ? { background: "linear-gradient(90deg, var(--accent-muted), transparent)", color: "var(--accent)" } : {}}
                  >
                    <span className="truncate">{s.name}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      {tierLabel(s.tier) && (
                        <span className="text-[9px] font-bold uppercase tracking-wider opacity-50">{tierLabel(s.tier)}</span>
                      )}
                      {isSel && <Check size={13} strokeWidth={2.5} />}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
}

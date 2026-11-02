"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export function Select({ value, onChange, options, placeholder = "Select...", className = "", required }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="hidden"
        required={required}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`glass-field ${isOpen ? 'is-open' : ''} w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none`}
      >
        <span className={`block truncate text-[13px] font-medium ${!selectedOption ? 'text-slate-400 dark:text-white/25' : 'text-slate-800 dark:text-white/80'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={14} 
          className={`text-slate-400 dark:text-white/25 transition-all duration-200 ml-2 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          style={isOpen ? { color: 'var(--accent)' } : {}}
        />
      </button>

      {isOpen && (
        <div className="glass-menu absolute z-50 w-full mt-2 rounded-2xl overflow-hidden origin-top animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150">
          <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, var(--accent), transparent)', opacity: 0.55 }} />
          <ul className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
            {options.length === 0 ? (
              <li className="px-3 py-2 text-[13px] text-slate-400 dark:text-white/25">No options</li>
            ) : (
              options.map((opt) => {
                const selected = value === opt.value;
                return (
                  <li
                    key={opt.value}
                    onClick={() => { onChange(opt.value); setIsOpen(false); }}
                    className={`glass-option flex items-center justify-between px-3 py-2 text-[13px] rounded-xl cursor-pointer font-medium ${
                      selected 
                        ? '' 
                        : 'text-slate-700 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    style={selected ? { 
                      background: 'var(--accent-muted)', 
                      color: 'var(--accent)',
                      boxShadow: 'inset 2px 0 0 var(--accent)'
                    } : {}}
                  >
                    <span>{opt.label}</span>
                    {selected && <Check size={13} style={{ color: 'var(--accent)' }} strokeWidth={2.5} />}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// Drop-in for the old plain <select> elements that kept their own value (builder mock-ups).
export function SelectField({ options, defaultValue, className = "" }: { options: string[]; defaultValue?: string; className?: string }) {
  const [value, setValue] = useState(defaultValue ?? options[0] ?? "");
  return <Select value={value} onChange={setValue} options={options.map((o) => ({ value: o, label: o }))} className={className} />;
}

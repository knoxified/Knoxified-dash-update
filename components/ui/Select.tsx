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
        className={`w-full flex items-center justify-between bg-white dark:bg-white/[0.04] border rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white transition-all outline-none shadow-sm`}
        style={isOpen ? {
          borderColor: 'var(--accent)',
          boxShadow: '0 0 0 2px var(--accent-dim)',
        } : {
          borderColor: 'var(--border)',
        }}
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
        <div className="absolute z-50 w-full mt-1.5 rounded-2xl shadow-2xl overflow-hidden origin-top animate-in fade-in slide-in-from-top-2 duration-150 border"
          style={{ 
            background: 'var(--surface-2)',
            borderColor: 'var(--border)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.15), 0 0 0 1px var(--border)'
          }}
        >
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
                    className={`flex items-center justify-between px-3 py-2 text-[13px] rounded-xl cursor-pointer transition-all font-medium ${
                      selected 
                        ? '' 
                        : 'text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                    }`}
                    style={selected ? { 
                      background: 'var(--accent-muted)', 
                      color: 'var(--accent)'
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

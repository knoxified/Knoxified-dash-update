"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

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
      {/* Hidden native select for form serialization if needed */}
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
        className={`w-full flex items-center justify-between bg-white dark:bg-[#0F172A] border ${isOpen ? 'border-[#00E5FF] ring-1 ring-[#00E5FF]/50 shadow-[0_0_15px_rgba(0,229,255,0.15)]' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'} rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white transition-all outline-none`}
      >
        <span className={`block truncate ${!selectedOption ? 'text-slate-500 dark:text-[#888]' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-slate-400 dark:text-[#888] transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#00E5FF]' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-lg shadow-xl overflow-hidden backdrop-blur-xl origin-top animate-in fade-in slide-in-from-top-2 duration-200">
          <ul className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
            {options.length === 0 ? (
              <li className="px-4 py-2 text-sm text-slate-500 dark:text-[#888]">No options available</li>
            ) : (
              options.map((opt) => (
                <li
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                    value === opt.value 
                      ? 'bg-sky-50 dark:bg-[#00E5FF]/10 text-sky-700 dark:text-[#00E5FF] font-medium' 
                      : 'text-slate-700 dark:text-[#EDEDED] hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  {opt.label}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

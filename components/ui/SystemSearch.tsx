"use client";

import { useState, useEffect, useRef } from "react";

interface SystemResult {
  name: string;
  coords?: { x: number; y: number; z: number };
}

interface SystemSearchProps {
  value: string;
  onChange: (value: string, coords?: { x: number; y: number; z: number }) => void;
  placeholder?: string;
}

export function SystemSearch({ value, onChange, placeholder }: SystemSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<SystemResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInputChange(val: string) {
    setQuery(val);
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://www.edsm.net/api-v1/systems?systemName=${encodeURIComponent(val)}&showCoordinates=1&limit=8`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setResults(data.map((s: { name: string; coords?: { x: number; y: number; z: number } }) => ({
              name: s.name,
              coords: s.coords,
            })));
            setIsOpen(true);
          }
        }
      } catch {
        // EDSM might be slow, fail silently
      }
      setLoading(false);
    }, 400);
  }

  function selectSystem(sys: SystemResult) {
    setQuery(sys.name);
    onChange(sys.name, sys.coords);
    setIsOpen(false);
    setResults([]);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        placeholder={placeholder ?? "Search system name..."}
        className="w-full bg-bg-deep border border-border px-4 py-2.5 font-system text-coord-blue text-sm focus:border-gold/50 focus:outline-none transition-colors"
      />
      {loading && (
        <span className="absolute right-3 top-3 font-system text-text-faint text-[9px]">
          searching...
        </span>
      )}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 border border-border bg-bg-card max-h-[240px] overflow-y-auto">
          {results.map((sys) => (
            <button
              key={sys.name}
              type="button"
              onClick={() => selectSystem(sys)}
              className="w-full text-left px-4 py-2.5 hover:bg-bg-hover transition-colors border-b border-border last:border-0 cursor-pointer"
            >
              <span className="font-system text-coord-blue text-sm">{sys.name}</span>
              {sys.coords && (
                <span className="font-system text-text-faint text-[9px] ml-3">
                  {sys.coords.x.toFixed(2)} / {sys.coords.y.toFixed(2)} / {sys.coords.z.toFixed(2)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

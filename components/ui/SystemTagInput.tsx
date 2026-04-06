"use client";

import { useState, useRef, useEffect } from "react";

interface SystemTagInputProps {
  values: string[];
  onChange: (values: string[]) => void;
}

export function SystemTagInput({ values, onChange }: SystemTagInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ name: string }>>([]);
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

  function handleInput(val: string) {
    setQuery(val);
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
          `https://www.edsm.net/api-v1/systems?systemName=${encodeURIComponent(val)}&limit=6`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setResults(data.map((s: { name: string }) => ({ name: s.name })));
            setIsOpen(true);
          }
        }
      } catch { /* fail silently */ }
      setLoading(false);
    }, 400);
  }

  function addSystem(name: string) {
    if (!values.includes(name)) {
      onChange([...values, name]);
    }
    setQuery("");
    setResults([]);
    setIsOpen(false);
  }

  function removeSystem(name: string) {
    onChange(values.filter((v) => v !== name));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && query.trim()) {
      e.preventDefault();
      addSystem(query.trim());
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {values.map((sys) => (
            <span key={sys} className="font-system text-coord-blue text-[10px] bg-coord-blue/10 border border-coord-blue/20 px-2 py-1 flex items-center gap-2">
              {sys}
              <button
                type="button"
                onClick={() => removeSystem(sys)}
                className="text-text-faint hover:text-status-danger cursor-pointer"
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        value={query}
        onChange={(e) => handleInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        placeholder="Type to search EDSM, press Enter to add..."
        className="w-full bg-bg-deep border border-border px-4 py-2.5 font-system text-coord-blue text-sm focus:border-gold/50 focus:outline-none transition-colors"
      />
      {loading && (
        <span className="absolute right-3 bottom-3 font-system text-text-faint text-[9px]">
          searching...
        </span>
      )}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 border border-border bg-bg-card max-h-[200px] overflow-y-auto">
          {results.map((sys) => (
            <button
              key={sys.name}
              type="button"
              onClick={() => addSystem(sys.name)}
              className="w-full text-left px-4 py-2 hover:bg-bg-hover transition-colors border-b border-border last:border-0 cursor-pointer"
            >
              <span className="font-system text-coord-blue text-sm">{sys.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

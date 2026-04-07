"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Fact {
  id: string;
  title: string;
  description: string;
  source_person: string | null;
  source_type: string;
  source_url: string | null;
  source_date: string | null;
  status: string;
  sort_order: number;
}

const STATUS_OPTIONS = [
  { value: "confirmed", label: "Confirmed" },
  { value: "unconfirmed", label: "Unconfirmed" },
  { value: "debunked", label: "Debunked" },
  { value: "rumour", label: "Rumour" },
];

const SOURCE_TYPES = [
  { value: "developer", label: "Developer Statement" },
  { value: "in_game", label: "In-Game Source" },
  { value: "novel", label: "Canonical Novel" },
  { value: "community", label: "Community Research" },
];

export default function AdminFactsPage() {
  const [supabase] = useState(() => createClient());
  const [facts, setFacts] = useState<Fact[]>([]);
  const [editing, setEditing] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sourcePerson, setSourcePerson] = useState("");
  const [sourceType, setSourceType] = useState("developer");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceDate, setSourceDate] = useState("");
  const [status, setStatus] = useState("confirmed");
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadFacts(); }, []);

  async function loadFacts() {
    const { data } = await supabase
      .from("confirmed_facts")
      .select("*")
      .order("sort_order", { ascending: true });
    setFacts(data ?? []);
  }

  function resetForm() {
    setTitle(""); setDescription(""); setSourcePerson(""); setSourceType("developer");
    setSourceUrl(""); setSourceDate(""); setStatus("confirmed"); setEditing(null);
  }

  function editFact(fact: Fact) {
    setEditing(fact.id);
    setTitle(fact.title);
    setDescription(fact.description);
    setSourcePerson(fact.source_person ?? "");
    setSourceType(fact.source_type);
    setSourceUrl(fact.source_url ?? "");
    setSourceDate(fact.source_date ?? "");
    setStatus(fact.status);
  }

  async function saveFact() {
    if (!title.trim() || !description.trim()) return;
    setSaving(true);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      source_person: sourcePerson.trim() || null,
      source_type: sourceType,
      source_url: sourceUrl.trim() || null,
      source_date: sourceDate.trim() || null,
      status,
    };

    if (editing) {
      await supabase.from("confirmed_facts").update(payload).eq("id", editing);
    } else {
      await supabase.from("confirmed_facts").insert(payload);
    }

    resetForm();
    await loadFacts();
    setSaving(false);
  }

  async function deleteFact(id: string) {
    await supabase.from("theory_fact_links").delete().eq("fact_id", id);
    await supabase.from("confirmed_facts").delete().eq("id", id);
    setFacts(prev => prev.filter(f => f.id !== id));
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-heading text-xl text-gold tracking-wide mb-2">
        Manage Confirmed Facts
      </h1>
      <p className="font-body text-text-mid text-sm mb-8">
        Add verified statements, debunked claims, and persistent rumours. These are the foundation all theories are measured against.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="border border-border bg-bg-card p-5 space-y-4">
          <h3 className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase">
            {editing ? "Edit Fact" : "Add New Fact"}
          </h3>

          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Fact title (e.g. Raxxla exists in the game)"
            className="w-full bg-bg-deep border border-border px-4 py-2.5 font-body text-text-primary text-sm focus:border-gold/50 focus:outline-none"
          />

          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Full description with context and exact quotes..."
            rows={5}
            className="w-full bg-bg-deep border border-border px-4 py-2.5 font-body text-text-primary text-sm focus:border-gold/50 focus:outline-none resize-y"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-system text-text-faint text-[9px] block mb-1">Source Person</label>
              <input
                value={sourcePerson}
                onChange={e => setSourcePerson(e.target.value)}
                placeholder="David Braben, Drew Wagar..."
                className="w-full bg-bg-deep border border-border px-3 py-2 font-system text-text-primary text-sm focus:border-gold/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-system text-text-faint text-[9px] block mb-1">Date</label>
              <input
                value={sourceDate}
                onChange={e => setSourceDate(e.target.value)}
                placeholder="2019, 2014-07-08..."
                className="w-full bg-bg-deep border border-border px-3 py-2 font-system text-text-primary text-sm focus:border-gold/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-system text-text-faint text-[9px] block mb-1">Source Type</label>
              <select
                value={sourceType}
                onChange={e => setSourceType(e.target.value)}
                className="w-full bg-bg-deep border border-border px-3 py-2 font-system text-text-primary text-sm focus:border-gold/50 focus:outline-none"
              >
                {SOURCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="font-system text-text-faint text-[9px] block mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-bg-deep border border-border px-3 py-2 font-system text-text-primary text-sm focus:border-gold/50 focus:outline-none"
              >
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <input
            value={sourceUrl}
            onChange={e => setSourceUrl(e.target.value)}
            placeholder="Source URL (optional)"
            className="w-full bg-bg-deep border border-border px-3 py-2 font-system text-coord-blue text-sm focus:border-gold/50 focus:outline-none"
          />

          <div className="flex gap-3">
            <button
              onClick={saveFact}
              disabled={saving || !title.trim() || !description.trim()}
              className="font-ui text-[9px] tracking-[0.15em] uppercase border border-gold/30 text-gold px-4 py-2 hover:bg-gold/10 cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : editing ? "Update Fact" : "Add Fact"}
            </button>
            {editing && (
              <button
                onClick={resetForm}
                className="font-ui text-[9px] tracking-[0.15em] uppercase border border-border text-text-dim px-4 py-2 hover:bg-bg-hover cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Existing facts list */}
        <div className="space-y-3">
          <h3 className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase">
            All Facts ({facts.length})
          </h3>
          <div className="max-h-[600px] overflow-y-auto space-y-2">
            {facts.map(fact => (
              <div key={fact.id} className="border border-border bg-bg-card px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-system text-[9px] tracking-wider uppercase ${
                    fact.status === "confirmed" ? "text-status-success" :
                    fact.status === "debunked" ? "text-status-danger" : "text-text-dim"
                  }`}>
                    {fact.status}
                  </span>
                  {fact.source_person && (
                    <span className="font-system text-text-faint text-[9px]">{fact.source_person}</span>
                  )}
                </div>
                <p className="font-body text-text-primary text-sm mb-2">{fact.title}</p>
                <div className="flex gap-2">
                  <button onClick={() => editFact(fact)} className="font-system text-coord-blue text-[9px] hover:underline cursor-pointer">
                    edit
                  </button>
                  <button onClick={() => deleteFact(fact.id)} className="font-system text-status-danger text-[9px] hover:underline cursor-pointer">
                    delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

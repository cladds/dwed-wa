"use client";

import { useState } from "react";

interface PipelineStatus {
  step: string;
  message: string;
  done: boolean;
}

export default function PipelinePage() {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<PipelineStatus[]>([]);
  const [error, setError] = useState<string | null>(null);

  function addLog(step: string, message: string, done = false) {
    setLogs(prev => [...prev, { step, message, done }]);
  }

  async function runPrescan() {
    addLog("prescan", "Scanning unprocessed forum posts...");
    const res = await fetch("/api/pipeline/prescan", { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Prescan failed");
    addLog("prescan", `Processed ${data.processed} posts, extracted ${data.extracted} leads`, true);
    return data;
  }

  async function runGroup() {
    addLog("group", "Grouping leads into theories...");
    const res = await fetch("/api/pipeline/group", { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Grouping failed");
    addLog("group", `Created ${data.theoriesCreated} theories from ${data.leadsGrouped} leads`, true);
    return data;
  }

  async function runPopulate() {
    addLog("populate", "Fetching system coordinates from EDSM...");
    const res = await fetch("/api/systems/populate", { method: "POST" });
    const data = await res.json();
    addLog("populate", `Populated ${data.populated} systems (${data.remaining ?? 0} remaining)`, true);
    return data;
  }

  async function runReset() {
    addLog("reset", "Resetting extracted leads and theories...");
    const res = await fetch("/api/pipeline/reset", { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Reset failed");
    addLog("reset", `Cleared ${data.leadsDeleted} leads, ${data.theoriesDeleted} theories, reset ${data.postsReset} posts`, true);
    return data;
  }

  async function runFull() {
    setRunning(true);
    setLogs([]);
    setError(null);

    try {
      await runPrescan();
      await runGroup();
      await runPopulate();
      addLog("done", "Pipeline complete!", true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setRunning(false);
  }

  async function runResetAndFull() {
    setRunning(true);
    setLogs([]);
    setError(null);

    try {
      await runReset();
      await runPrescan();
      await runGroup();
      await runPopulate();
      addLog("done", "Full reset + pipeline complete!", true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setRunning(false);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-heading text-xl text-gold tracking-wide mb-2">
        Data Pipeline
      </h1>
      <p className="font-body text-text-mid text-sm mb-8">
        Process scraped forum posts into theories. Pre-scan extracts leads, grouper clusters them into umbrella theories, then systems get mapped.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          onClick={runFull}
          disabled={running}
          className="border border-gold/30 bg-gold/10 text-gold font-ui text-[10px] tracking-[0.15em] uppercase px-6 py-4 hover:bg-gold/20 transition-colors cursor-pointer disabled:opacity-50"
        >
          {running ? "Running..." : "Run Pipeline"}
        </button>
        <button
          onClick={runResetAndFull}
          disabled={running}
          className="border border-status-danger/30 text-status-danger font-ui text-[10px] tracking-[0.15em] uppercase px-6 py-4 hover:bg-status-danger/10 transition-colors cursor-pointer disabled:opacity-50"
        >
          Reset + Re-run
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <button onClick={() => { setLogs([]); setError(null); runPrescan().catch(e => setError(String(e))); }} disabled={running}
          className="border border-border text-text-mid font-ui text-[9px] tracking-[0.15em] uppercase px-4 py-3 hover:bg-bg-hover transition-colors cursor-pointer disabled:opacity-50">
          Prescan Only
        </button>
        <button onClick={() => { setLogs([]); setError(null); runGroup().catch(e => setError(String(e))); }} disabled={running}
          className="border border-border text-text-mid font-ui text-[9px] tracking-[0.15em] uppercase px-4 py-3 hover:bg-bg-hover transition-colors cursor-pointer disabled:opacity-50">
          Group Only
        </button>
        <button onClick={() => { setLogs([]); setError(null); runPopulate().catch(e => setError(String(e))); }} disabled={running}
          className="border border-border text-text-mid font-ui text-[9px] tracking-[0.15em] uppercase px-4 py-3 hover:bg-bg-hover transition-colors cursor-pointer disabled:opacity-50">
          Map Systems
        </button>
        <button onClick={() => { setLogs([]); setError(null); runReset().catch(e => setError(String(e))); }} disabled={running}
          className="border border-status-danger/30 text-status-danger font-ui text-[9px] tracking-[0.15em] uppercase px-4 py-3 hover:bg-status-danger/10 transition-colors cursor-pointer disabled:opacity-50">
          Reset Data
        </button>
      </div>

      {error && (
        <div className="border border-status-danger/30 bg-status-danger/10 px-5 py-3 mb-4">
          <p className="font-system text-status-danger text-xs">{error}</p>
        </div>
      )}

      {logs.length > 0 && (
        <div className="border border-border bg-bg-card">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase">Pipeline Log</h3>
          </div>
          <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`font-system text-[9px] tracking-wider uppercase w-16 ${log.done ? "text-status-success" : "text-gold"}`}>
                  {log.done ? "done" : "..."}
                </span>
                <span className="font-system text-text-mid text-xs">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

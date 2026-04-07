"use client";

import { useState, useRef } from "react";

interface PipelineLog {
  step: string;
  message: string;
  done: boolean;
  timestamp: Date;
}

export default function PipelinePage() {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<PipelineLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  function addLog(step: string, message: string, done = false) {
    setLogs(prev => [...prev, { step, message, done, timestamp: new Date() }]);
  }

  async function runPrescan() {
    let totalProcessed = 0;
    let totalExtracted = 0;
    let pass = 0;

    addLog("prescan", "Starting prescan of unprocessed forum posts...");

    while (!abortRef.current) {
      pass++;
      const res = await fetch("/api/pipeline/prescan", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Prescan failed");

      totalProcessed += data.processed;
      totalExtracted += data.extracted;

      addLog("prescan", `Pass ${pass}: ${data.processed} posts -> ${data.extracted} leads (${data.remaining} remaining)`);

      if (data.remaining === 0 || data.processed === 0) break;
    }

    addLog("prescan", `Prescan complete: ${totalProcessed} posts processed, ${totalExtracted} leads extracted`, true);
    return { processed: totalProcessed, extracted: totalExtracted };
  }

  async function runGroup() {
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalGrouped = 0;
    let pass = 0;

    addLog("group", "Grouping leads into theories...");

    while (!abortRef.current) {
      pass++;
      const res = await fetch("/api/pipeline/group", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Grouping failed");

      totalCreated += data.theoriesCreated;
      totalUpdated += data.theoriesUpdated;
      totalGrouped += data.leadsGrouped;

      addLog("group", `Pass ${pass}: +${data.theoriesCreated} new, +${data.theoriesUpdated} updated, ${data.leadsGrouped} grouped (${data.remaining} remaining)`);

      if (data.remaining === 0 || data.leadsGrouped === 0) break;
    }

    addLog("group", `Grouping complete: ${totalCreated} created, ${totalUpdated} updated, ${totalGrouped} leads grouped`, true);
    return { theoriesCreated: totalCreated, theoriesUpdated: totalUpdated, leadsGrouped: totalGrouped };
  }

  async function runConsolidate() {
    addLog("consolidate", "Consolidating theories: merging duplicates, auto-prioritizing major investigations...");
    const res = await fetch("/api/pipeline/consolidate", { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Consolidation failed");

    const msg = `Merged ${data.merged} duplicate theories, auto-prioritized ${data.prioritized} major theories (${data.totalTheories} total)`;
    if (data.mergeDetails?.length > 0) {
      const details = data.mergeDetails.slice(0, 5).map((d: { kept: string; absorbed: string[] }) => `  "${d.kept}" absorbed ${d.absorbed.length} theories`).join("\n");
      addLog("consolidate", details);
    }
    addLog("consolidate", msg, true);
    return data;
  }

  async function runPopulate() {
    addLog("populate", "Fetching system coordinates from EDSM...");
    let totalPopulated = 0;
    let pass = 0;

    while (!abortRef.current) {
      pass++;
      const res = await fetch("/api/systems/populate", { method: "POST" });
      const data = await res.json();

      totalPopulated += data.populated;

      if (data.remaining === 0) break;
      addLog("populate", `Pass ${pass}: ${data.populated} found of ${data.attempted ?? 5} tried (${data.remaining} remaining)`);
    }

    addLog("populate", `Populated ${totalPopulated} system coordinates`, true);
    return { populated: totalPopulated };
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
    abortRef.current = false;

    try {
      await runPrescan();
      if (abortRef.current) { addLog("abort", "Pipeline aborted"); setRunning(false); return; }
      await runGroup();
      if (abortRef.current) { addLog("abort", "Pipeline aborted"); setRunning(false); return; }
      await runConsolidate();
      if (abortRef.current) { addLog("abort", "Pipeline aborted"); setRunning(false); return; }
      await runPopulate();
      addLog("done", "Full pipeline complete!", true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setRunning(false);
  }

  async function runResetAndFull() {
    setRunning(true);
    setLogs([]);
    setError(null);
    abortRef.current = false;

    try {
      await runReset();
      await runPrescan();
      if (abortRef.current) { addLog("abort", "Pipeline aborted"); setRunning(false); return; }
      await runGroup();
      if (abortRef.current) { addLog("abort", "Pipeline aborted"); setRunning(false); return; }
      await runConsolidate();
      if (abortRef.current) { addLog("abort", "Pipeline aborted"); setRunning(false); return; }
      await runPopulate();
      addLog("done", "Full reset + pipeline complete!", true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setRunning(false);
  }

  function abort() {
    abortRef.current = true;
    addLog("abort", "Abort requested, finishing current batch...");
  }

  async function runSingleStep(fn: () => Promise<unknown>) {
    setRunning(true);
    setLogs([]);
    setError(null);
    abortRef.current = false;
    try {
      await fn();
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
        Process scraped forum posts into theories. Prescan extracts leads, grouper clusters them, consolidator merges duplicates and ranks major theories, then systems get mapped via EDSM.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          onClick={runFull}
          disabled={running}
          className="border border-gold/30 bg-gold/10 text-gold font-ui text-[10px] tracking-[0.15em] uppercase px-6 py-4 hover:bg-gold/20 transition-colors cursor-pointer disabled:opacity-50"
        >
          {running ? "Running..." : "Run Full Pipeline"}
        </button>
        <button
          onClick={runResetAndFull}
          disabled={running}
          className="border border-status-danger/30 text-status-danger font-ui text-[10px] tracking-[0.15em] uppercase px-6 py-4 hover:bg-status-danger/10 transition-colors cursor-pointer disabled:opacity-50"
        >
          Reset + Re-run All
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        <button onClick={() => runSingleStep(runPrescan)} disabled={running}
          className="border border-border text-text-mid font-ui text-[9px] tracking-[0.15em] uppercase px-4 py-3 hover:bg-bg-hover transition-colors cursor-pointer disabled:opacity-50">
          Prescan
        </button>
        <button onClick={() => runSingleStep(runGroup)} disabled={running}
          className="border border-border text-text-mid font-ui text-[9px] tracking-[0.15em] uppercase px-4 py-3 hover:bg-bg-hover transition-colors cursor-pointer disabled:opacity-50">
          Group
        </button>
        <button onClick={() => runSingleStep(runConsolidate)} disabled={running}
          className="border border-border text-text-mid font-ui text-[9px] tracking-[0.15em] uppercase px-4 py-3 hover:bg-bg-hover transition-colors cursor-pointer disabled:opacity-50">
          Consolidate
        </button>
        <button onClick={() => runSingleStep(runPopulate)} disabled={running}
          className="border border-border text-text-mid font-ui text-[9px] tracking-[0.15em] uppercase px-4 py-3 hover:bg-bg-hover transition-colors cursor-pointer disabled:opacity-50">
          Map Systems
        </button>
        <button onClick={() => runSingleStep(runReset)} disabled={running}
          className="border border-status-danger/30 text-status-danger font-ui text-[9px] tracking-[0.15em] uppercase px-4 py-3 hover:bg-status-danger/10 transition-colors cursor-pointer disabled:opacity-50">
          Reset
        </button>
      </div>

      {running && (
        <button
          onClick={abort}
          className="border border-status-warning/30 text-status-warning font-ui text-[9px] tracking-[0.15em] uppercase px-6 py-3 hover:bg-status-warning/10 transition-colors cursor-pointer mb-4 w-full"
        >
          Abort After Current Batch
        </button>
      )}

      {error && (
        <div className="border border-status-danger/30 bg-status-danger/10 px-5 py-3 mb-4">
          <p className="font-system text-status-danger text-xs">{error}</p>
        </div>
      )}

      {logs.length > 0 && (
        <div className="border border-border bg-bg-card">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase">Pipeline Log</h3>
            <span className="font-system text-text-faint text-[9px]">{logs.length} entries</span>
          </div>
          <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`font-system text-[9px] tracking-wider uppercase w-20 shrink-0 ${
                  log.step === "abort" ? "text-status-warning" :
                  log.done ? "text-status-success" : "text-gold"
                }`}>
                  {log.step === "abort" ? "abort" : log.done ? "done" : "..."}
                </span>
                <span className="font-system text-text-mid text-xs whitespace-pre-wrap">{log.message}</span>
                <span className="font-system text-text-faint text-[8px] ml-auto shrink-0">
                  {log.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

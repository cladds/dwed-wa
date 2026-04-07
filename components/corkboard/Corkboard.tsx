"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface TheoryNode {
  id: string;
  title: string;
  status: string;
  category: string;
  slug: string;
  x: number;
  y: number;
  w: number;
  h: number;
  evidenceCount: number;
  priority: number;
}

interface TheoryLink {
  id: string;
  theoryAId: string;
  theoryBId: string;
  reason: string;
}

const STATUS_COLORS: Record<string, string> = {
  open_lead: "#ff8c00",
  under_investigation: "#a070d0",
  promising: "#4cc9f0",
  verified: "#2ecc71",
  disproven: "#e74c3c",
  dead_end: "#4a3828",
  cold: "#5a6a7a",
};

const CARD_W = 220;
const CARD_H = 80;
const FACT_W = 200;
const FACT_H = 60;
const STRING_COLOR = "#cc2222";

const FACT_STATUS_COLORS: Record<string, string> = {
  confirmed: "#2ecc71",
  debunked: "#e74c3c",
  rumour: "#5a6a7a",
  unconfirmed: "#ff8c00",
};

interface FactNode {
  id: string;
  title: string;
  status: string;
  sourcePerson: string | null;
  sourceType: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface CorkboardProps {
  theories: Array<{
    id: string;
    title: string;
    status: string;
    category: string;
    slug: string;
    evidence_count: number;
    priority: number;
  }>;
  links: Array<{
    id: string;
    theory_a_id: string;
    theory_b_id: string;
    reason: string;
  }>;
  facts: Array<{
    id: string;
    title: string;
    status: string;
    source_person: string | null;
    source_type: string;
  }>;
  canEdit: boolean;
}

export function Corkboard({ theories, links, facts, canEdit }: CorkboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [supabase] = useState(() => createClient());

  // Position nodes in a grid initially
  const [nodes, setNodes] = useState<TheoryNode[]>(() => {
    const cols = Math.ceil(Math.sqrt(theories.length));
    return theories.map((t, i) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      category: t.category,
      slug: t.slug,
      evidenceCount: t.evidence_count,
      priority: t.priority ?? 0,
      x: 80 + (i % cols) * (CARD_W + 60),
      y: 80 + Math.floor(i / cols) * (CARD_H + 80),
      w: CARD_W,
      h: CARD_H,
    }));
  });

  // Position fact nodes in a column to the right
  const [factNodes, setFactNodes] = useState<FactNode[]>(() => {
    const theoryCols = Math.ceil(Math.sqrt(theories.length));
    const offsetX = 80 + theoryCols * (CARD_W + 60) + 100;
    return facts.map((f, i) => ({
      id: f.id,
      title: f.title,
      status: f.status,
      sourcePerson: f.source_person,
      sourceType: f.source_type,
      x: offsetX,
      y: 80 + i * (FACT_H + 20),
      w: FACT_W,
      h: FACT_H,
    }));
  });

  const [theoryLinks, setTheoryLinks] = useState<TheoryLink[]>(
    links.map(l => ({ id: l.id, theoryAId: l.theory_a_id, theoryBId: l.theory_b_id, reason: l.reason }))
  );

  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [dragging, setDragging] = useState<string | null>(null);
  const [draggingFact, setDraggingFact] = useState<string | null>(null);
  const [panning, setPanning] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<TheoryLink | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const lastMouse = useRef({ x: 0, y: 0 });

  // Link creation state
  const [linking, setLinking] = useState<string | null>(null);
  const [linkReason, setLinkReason] = useState("");
  const [linkTarget, setLinkTarget] = useState<string | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  const screenToWorld = useCallback((sx: number, sy: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { wx: 0, wy: 0 };
    return {
      wx: (sx - canvas.width / 2) / camera.zoom + camera.x,
      wy: (sy - canvas.height / 2) / camera.zoom + camera.y,
    };
  }, [camera]);

  const worldToScreen = useCallback((wx: number, wy: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { sx: 0, sy: 0 };
    return {
      sx: (wx - camera.x) * camera.zoom + canvas.width / 2,
      sy: (wy - camera.y) * camera.zoom + canvas.height / 2,
    };
  }, [camera]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#080604";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cork texture dots
    ctx.fillStyle = "#0e0c0a";
    for (let x = 0; x < canvas.width; x += 20) {
      for (let y = 0; y < canvas.height; y += 20) {
        if (Math.random() > 0.7) {
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    // Draw links (red string)
    for (const link of theoryLinks) {
      const nodeA = nodes.find(n => n.id === link.theoryAId);
      const nodeB = nodes.find(n => n.id === link.theoryBId);
      if (!nodeA || !nodeB) continue;

      const a = worldToScreen(nodeA.x + nodeA.w / 2, nodeA.y + nodeA.h / 2);
      const b = worldToScreen(nodeB.x + nodeB.w / 2, nodeB.y + nodeB.h / 2);

      const isHovered = hoveredLink?.id === link.id;

      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.strokeStyle = isHovered ? "#ff4444" : STRING_COLOR;
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.setLineDash([8, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Pin dots at endpoints
      for (const pt of [a, b]) {
        ctx.beginPath();
        ctx.arc(pt.sx, pt.sy, 4, 0, Math.PI * 2);
        ctx.fillStyle = STRING_COLOR;
        ctx.fill();
      }

      // Reason label at midpoint
      if (isHovered) {
        const mx = (a.sx + b.sx) / 2;
        const my = (a.sy + b.sy) / 2;
        ctx.font = "10px 'Courier Prime', monospace";
        const tw = ctx.measureText(link.reason).width;
        ctx.fillStyle = "#0e0c08ee";
        ctx.fillRect(mx - tw / 2 - 6, my - 8, tw + 12, 18);
        ctx.strokeStyle = STRING_COLOR + "60";
        ctx.lineWidth = 1;
        ctx.strokeRect(mx - tw / 2 - 6, my - 8, tw + 12, 18);
        ctx.fillStyle = "#ff8c00";
        ctx.fillText(link.reason, mx - tw / 2, my + 4);
      }
    }

    // Draw linking line if in progress
    if (linking) {
      const source = nodes.find(n => n.id === linking);
      if (source) {
        const a = worldToScreen(source.x + source.w / 2, source.y + source.h / 2);
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(lastMouse.current.x, lastMouse.current.y);
        ctx.strokeStyle = STRING_COLOR + "80";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Draw theory cards
    for (const node of nodes) {
      const { sx, sy } = worldToScreen(node.x, node.y);
      const w = node.w * camera.zoom;
      const h = node.h * camera.zoom;
      const isHov = hoveredNode === node.id;
      const color = STATUS_COLORS[node.status] ?? "#ff8c00";

      // Card shadow
      ctx.fillStyle = "#00000040";
      ctx.fillRect(sx + 3, sy + 3, w, h);

      // Card background
      ctx.fillStyle = isHov ? "#1a1816" : "#121110";
      ctx.fillRect(sx, sy, w, h);

      // Status bar left
      ctx.fillStyle = color;
      ctx.fillRect(sx, sy, 3 * camera.zoom, h);

      // Border
      ctx.strokeStyle = isHov ? color + "80" : "#2a2420";
      ctx.lineWidth = 1;
      ctx.strokeRect(sx, sy, w, h);

      // Title
      ctx.font = `${Math.max(11 * camera.zoom, 9)}px 'EB Garamond', serif`;
      ctx.fillStyle = "#ff9d2e";
      const titleText = node.title.length > 28 ? node.title.substring(0, 26) + "..." : node.title;
      ctx.fillText(titleText, sx + 10 * camera.zoom, sy + 22 * camera.zoom);

      // Category + status
      ctx.font = `${Math.max(8 * camera.zoom, 7)}px 'Courier Prime', monospace`;
      ctx.fillStyle = "#8a5c28";
      ctx.fillText(`${node.category.toUpperCase()} | ${node.status.replace(/_/g, " ")}`, sx + 10 * camera.zoom, sy + 40 * camera.zoom);

      // Evidence count + priority
      ctx.fillStyle = "#5a3c18";
      const priorityLabel = node.priority > 0 ? ` | P${node.priority}` : "";
      ctx.fillText(`${node.evidenceCount} evidence${priorityLabel}`, sx + 10 * camera.zoom, sy + 56 * camera.zoom);

      // Pin in top-right
      ctx.beginPath();
      ctx.arc(sx + w - 10 * camera.zoom, sy + 10 * camera.zoom, 5 * camera.zoom, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    // Draw fact cards (distinct style)
    for (const fact of factNodes) {
      const { sx, sy } = worldToScreen(fact.x, fact.y);
      const w = fact.w * camera.zoom;
      const h = fact.h * camera.zoom;
      const color = FACT_STATUS_COLORS[fact.status] ?? "#2ecc71";

      // Card shadow
      ctx.fillStyle = "#00000030";
      ctx.fillRect(sx + 2, sy + 2, w, h);

      // Card background - darker, dashed border for facts
      ctx.fillStyle = "#0a0c08";
      ctx.fillRect(sx, sy, w, h);

      // Status bar top
      ctx.fillStyle = color;
      ctx.fillRect(sx, sy, w, 2 * camera.zoom);

      // Dashed border
      ctx.strokeStyle = color + "60";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(sx, sy, w, h);
      ctx.setLineDash([]);

      // Diamond icon
      const dx = sx + 8 * camera.zoom;
      const dy = sy + 14 * camera.zoom;
      const ds = 4 * camera.zoom;
      ctx.beginPath();
      ctx.moveTo(dx, dy - ds);
      ctx.lineTo(dx + ds, dy);
      ctx.lineTo(dx, dy + ds);
      ctx.lineTo(dx - ds, dy);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // Title
      ctx.font = `${Math.max(10 * camera.zoom, 8)}px 'EB Garamond', serif`;
      ctx.fillStyle = color;
      const factTitle = fact.title.length > 26 ? fact.title.substring(0, 24) + "..." : fact.title;
      ctx.fillText(factTitle, sx + 18 * camera.zoom, sy + 18 * camera.zoom);

      // Source
      ctx.font = `${Math.max(8 * camera.zoom, 7)}px 'Courier Prime', monospace`;
      ctx.fillStyle = "#5a6a5a";
      const sourceLabel = fact.sourcePerson ? `${fact.sourceType.toUpperCase()} | ${fact.sourcePerson}` : fact.sourceType.toUpperCase();
      ctx.fillText(sourceLabel, sx + 8 * camera.zoom, sy + 34 * camera.zoom);

      // Status
      ctx.fillStyle = color + "80";
      ctx.fillText(fact.status.toUpperCase(), sx + 8 * camera.zoom, sy + 48 * camera.zoom);
    }
  }, [nodes, factNodes, theoryLinks, camera, worldToScreen, hoveredLink, hoveredNode, linking]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      draw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [draw]);

  useEffect(() => { draw(); }, [draw]);

  function findNodeAt(mx: number, my: number): TheoryNode | null {
    const { wx, wy } = screenToWorld(mx, my);
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      if (wx >= n.x && wx <= n.x + n.w && wy >= n.y && wy <= n.y + n.h) return n;
    }
    return null;
  }

  function findFactAt(mx: number, my: number): FactNode | null {
    const { wx, wy } = screenToWorld(mx, my);
    for (let i = factNodes.length - 1; i >= 0; i--) {
      const n = factNodes[i];
      if (wx >= n.x && wx <= n.x + n.w && wy >= n.y && wy <= n.y + n.h) return n;
    }
    return null;
  }

  function findLinkAt(mx: number, my: number): TheoryLink | null {
    for (const link of theoryLinks) {
      const a = nodes.find(n => n.id === link.theoryAId);
      const b = nodes.find(n => n.id === link.theoryBId);
      if (!a || !b) continue;
      const as = worldToScreen(a.x + a.w / 2, a.y + a.h / 2);
      const bs = worldToScreen(b.x + b.w / 2, b.y + b.h / 2);
      // Distance from point to line segment
      const dx = bs.sx - as.sx;
      const dy = bs.sy - as.sy;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) continue;
      const t = Math.max(0, Math.min(1, ((mx - as.sx) * dx + (my - as.sy) * dy) / (len * len)));
      const px = as.sx + t * dx;
      const py = as.sy + t * dy;
      const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
      if (dist < 8) return link;
    }
    return null;
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    lastMouse.current = { x: mx, y: my };

    const node = findNodeAt(mx, my);
    const factNode = !node ? findFactAt(mx, my) : null;

    if (node) {
      if (linking) {
        if (node.id !== linking) {
          setLinkTarget(node.id);
          setShowLinkDialog(true);
        }
        return;
      }
      if (e.shiftKey && canEdit) {
        setLinking(node.id);
        return;
      }
      setDragging(node.id);
    } else if (factNode) {
      setDraggingFact(factNode.id);
    } else {
      if (linking) {
        setLinking(null);
        return;
      }
      setPanning(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (dragging) {
      const dx = (mx - lastMouse.current.x) / camera.zoom;
      const dy = (my - lastMouse.current.y) / camera.zoom;
      setNodes(prev => prev.map(n => n.id === dragging ? { ...n, x: n.x + dx, y: n.y + dy } : n));
    } else if (draggingFact) {
      const dx = (mx - lastMouse.current.x) / camera.zoom;
      const dy = (my - lastMouse.current.y) / camera.zoom;
      setFactNodes(prev => prev.map(n => n.id === draggingFact ? { ...n, x: n.x + dx, y: n.y + dy } : n));
    } else if (panning) {
      const dx = (mx - lastMouse.current.x) / camera.zoom;
      const dy = (my - lastMouse.current.y) / camera.zoom;
      setCamera(c => ({ ...c, x: c.x - dx, y: c.y - dy }));
    } else {
      const node = findNodeAt(mx, my);
      setHoveredNode(node?.id ?? null);
      setHoveredLink(node ? null : findLinkAt(mx, my));
    }

    lastMouse.current = { x: mx, y: my };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = dragging ? "grabbing" : linking ? "crosshair" : hoveredNode ? "grab" : panning ? "grabbing" : "default";
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setDraggingFact(null);
    setPanning(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const node = findNodeAt(mx, my);
    if (node) {
      window.location.href = `/theories/${node.slug}`;
      return;
    }
    const fact = findFactAt(mx, my);
    if (fact) {
      window.location.href = `/codex/facts`;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    setCamera(c => ({ ...c, zoom: Math.max(0.3, Math.min(3, c.zoom * factor)) }));
  };

  async function createLink() {
    if (!linking || !linkTarget || !linkReason.trim()) return;
    const { data } = await supabase.from("theory_links").insert({
      theory_a_id: linking,
      theory_b_id: linkTarget,
      reason: linkReason.trim(),
    }).select().single();

    if (data) {
      setTheoryLinks(prev => [...prev, { id: data.id, theoryAId: data.theory_a_id, theoryBId: data.theory_b_id, reason: data.reason }]);
    }
    setLinking(null);
    setLinkTarget(null);
    setLinkReason("");
    setShowLinkDialog(false);
  }

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
      />

      {/* Controls overlay */}
      <div className="absolute top-4 left-4 bg-bg-card/90 border border-border px-4 py-3 space-y-1">
        <p className="font-ui text-text-faint text-[9px] tracking-[0.2em] uppercase mb-2">Controls</p>
        <p className="font-system text-text-dim text-[10px]">Drag cards to rearrange</p>
        <p className="font-system text-text-dim text-[10px]">Double-click to open theory</p>
        <p className="font-system text-text-dim text-[10px]">Scroll to zoom</p>
        {canEdit && (
          <>
            <p className="font-system text-gold text-[10px]">Shift+click card to start linking</p>
            <p className="font-system text-gold text-[10px]">Then click target card</p>
          </>
        )}
        {linking && (
          <p className="font-system text-status-danger text-[10px]">Linking mode: click target theory</p>
        )}
      </div>

      {/* Zoom indicator */}
      <div className="absolute top-4 right-4 bg-bg-card/90 border border-border px-3 py-2">
        <p className="font-system text-coord-blue text-[10px]">
          {nodes.length} theories | {factNodes.length} facts | {theoryLinks.length} links | {(camera.zoom * 100).toFixed(0)}%
        </p>
      </div>

      {/* Link creation dialog */}
      {showLinkDialog && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-card border border-border p-6 w-[400px]">
            <h3 className="font-ui text-gold text-[10px] tracking-[0.25em] uppercase mb-4">
              Link Theories
            </h3>
            <p className="font-body text-text-mid text-sm mb-4">
              Why are these theories connected?
            </p>
            <input
              value={linkReason}
              onChange={e => setLinkReason(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createLink()}
              placeholder="e.g. Same system cluster, shared lore reference..."
              className="w-full bg-bg-deep border border-border px-4 py-2.5 font-body text-text-primary text-sm focus:border-gold/50 focus:outline-none mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={createLink}
                disabled={!linkReason.trim()}
                className="font-ui text-[9px] tracking-[0.15em] uppercase border border-gold/30 text-gold px-4 py-2 hover:bg-gold/10 cursor-pointer disabled:opacity-50"
              >
                Create Link
              </button>
              <button
                onClick={() => { setShowLinkDialog(false); setLinking(null); setLinkTarget(null); setLinkReason(""); }}
                className="font-ui text-[9px] tracking-[0.15em] uppercase border border-border text-text-dim px-4 py-2 hover:bg-bg-hover cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

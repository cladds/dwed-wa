"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface SystemPoint {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  status: string;
}

interface MapZone {
  id: string;
  name: string;
  centreX: number;
  centreY: number;
  centreZ: number;
  radiusLy: number;
  colour: string;
  type: string;
}

interface FactPoint {
  id: string;
  title: string;
  status: string;
  systemName: string;
  x: number;
  y: number;
  z: number;
}

interface GalaxyMapProps {
  systems: SystemPoint[];
  zones: MapZone[];
  facts?: FactPoint[];
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

const FACT_STATUS_COLORS: Record<string, string> = {
  confirmed: "#2ecc71",
  debunked: "#e74c3c",
  rumour: "#5a6a7a",
  unconfirmed: "#ff8c00",
};

export function GalaxyMap({ systems, zones, facts = [] }: GalaxyMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 0.5 });
  const [hoveredSystem, setHoveredSystem] = useState<SystemPoint | null>(null);
  const [hoveredFact, setHoveredFact] = useState<FactPoint | null>(null);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const worldToScreen = useCallback((wx: number, wz: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { sx: 0, sy: 0 };
    return {
      sx: (wx - camera.x) * camera.zoom + canvas.width / 2,
      sy: (wz - camera.y) * camera.zoom + canvas.height / 2,
    };
  }, [camera]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear
    ctx.fillStyle = "#0a0908";
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "#1a1610";
    ctx.lineWidth = 1;
    const gridSize = 100;
    const startX = Math.floor((camera.x - w / 2 / camera.zoom) / gridSize) * gridSize;
    const startY = Math.floor((camera.y - h / 2 / camera.zoom) / gridSize) * gridSize;
    const endX = camera.x + w / 2 / camera.zoom;
    const endY = camera.y + h / 2 / camera.zoom;

    for (let gx = startX; gx <= endX; gx += gridSize) {
      const { sx } = worldToScreen(gx, 0);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
      ctx.stroke();
    }
    for (let gy = startY; gy <= endY; gy += gridSize) {
      const { sy } = worldToScreen(0, gy);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
      ctx.stroke();
    }

    // Sol marker
    const sol = worldToScreen(0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(sol.sx, sol.sy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "10px 'Courier Prime', monospace";
    ctx.fillStyle = "#6a5840";
    ctx.fillText("Sol", sol.sx + 6, sol.sy + 4);

    // Zones
    zones.forEach((zone) => {
      const { sx, sy } = worldToScreen(zone.centreX, zone.centreZ);
      const radius = zone.radiusLy * camera.zoom;
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fillStyle = (zone.colour ?? "#c4923a") + "15";
      ctx.fill();
      ctx.strokeStyle = (zone.colour ?? "#c4923a") + "40";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Systems
    systems.forEach((sys) => {
      const { sx, sy } = worldToScreen(sys.x, sys.z);
      const color = STATUS_COLORS[sys.status] ?? "#c4923a";
      const isHovered = hoveredSystem?.id === sys.id;
      const size = isHovered ? 5 : 3;

      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      if (isHovered) {
        // Tooltip background
        ctx.font = "11px 'Courier Prime', monospace";
        const nameWidth = ctx.measureText(sys.name).width;
        const coordText = `${sys.x.toFixed(1)} / ${sys.y.toFixed(1)} / ${sys.z.toFixed(1)}`;
        const coordWidth = ctx.measureText(coordText).width;
        const tipWidth = Math.max(nameWidth, coordWidth) + 16;

        ctx.fillStyle = "#0e0c08ee";
        ctx.strokeStyle = color + "60";
        ctx.lineWidth = 1;
        ctx.fillRect(sx + 10, sy - 18, tipWidth, 38);
        ctx.strokeRect(sx + 10, sy - 18, tipWidth, 38);

        ctx.fillStyle = color;
        ctx.fillText(sys.name, sx + 18, sy - 2);
        ctx.fillStyle = "#4cc9f0";
        ctx.font = "9px 'Courier Prime', monospace";
        ctx.fillText(coordText, sx + 18, sy + 14);

        // Glow ring
        ctx.beginPath();
        ctx.arc(sx, sy, 8, 0, Math.PI * 2);
        ctx.strokeStyle = color + "40";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // Facts as diamond markers
    facts.forEach((fact) => {
      const { sx, sy } = worldToScreen(fact.x, fact.z);
      const color = FACT_STATUS_COLORS[fact.status] ?? "#2ecc71";
      const isHovered = hoveredFact?.id === fact.id && hoveredFact?.systemName === fact.systemName;
      const size = isHovered ? 7 : 5;

      // Diamond shape
      ctx.beginPath();
      ctx.moveTo(sx, sy - size);
      ctx.lineTo(sx + size, sy);
      ctx.lineTo(sx, sy + size);
      ctx.lineTo(sx - size, sy);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "#0a0908";
      ctx.lineWidth = 1;
      ctx.stroke();

      if (isHovered) {
        ctx.font = "11px 'Courier Prime', monospace";
        const titleText = fact.title.length > 40 ? fact.title.substring(0, 38) + "..." : fact.title;
        const nameWidth = ctx.measureText(titleText).width;
        const sysText = fact.systemName;
        const sysWidth = ctx.measureText(sysText).width;
        const statusText = fact.status.toUpperCase();
        const statusWidth = ctx.measureText(statusText).width;
        const tipWidth = Math.max(nameWidth, sysWidth, statusWidth) + 16;

        ctx.fillStyle = "#0e0c08ee";
        ctx.strokeStyle = color + "60";
        ctx.lineWidth = 1;
        ctx.fillRect(sx + 12, sy - 24, tipWidth, 52);
        ctx.strokeRect(sx + 12, sy - 24, tipWidth, 52);

        ctx.fillStyle = color;
        ctx.fillText(titleText, sx + 20, sy - 8);
        ctx.fillStyle = "#4cc9f0";
        ctx.font = "9px 'Courier Prime', monospace";
        ctx.fillText(sysText, sx + 20, sy + 6);
        ctx.fillStyle = color + "aa";
        ctx.fillText(statusText, sx + 20, sy + 20);

        // Glow ring
        ctx.beginPath();
        ctx.arc(sx, sy, 10, 0, Math.PI * 2);
        ctx.strokeStyle = color + "40";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
  }, [camera, systems, zones, facts, hoveredSystem, hoveredFact, worldToScreen]);

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

  useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging.current) {
      const dx = (e.clientX - lastMouse.current.x) / camera.zoom;
      const dy = (e.clientY - lastMouse.current.y) / camera.zoom;
      setCamera((c) => ({ ...c, x: c.x - dx, y: c.y - dy }));
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }

    // Hit test for hover
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let found: SystemPoint | null = null;
    let foundFact: FactPoint | null = null;

    // Check facts first (diamonds are more prominent)
    for (const fact of facts) {
      const { sx: fsx, sy: fsy } = worldToScreen(fact.x, fact.z);
      const dist = Math.sqrt((mx - fsx) ** 2 + (my - fsy) ** 2);
      if (dist < 10) {
        foundFact = fact;
        break;
      }
    }

    if (!foundFact) {
      for (const sys of systems) {
        const { sx, sy } = worldToScreen(sys.x, sys.z);
        const dist = Math.sqrt((mx - sx) ** 2 + (my - sy) ** 2);
        if (dist < 8) {
          found = sys;
          break;
        }
      }
    }

    setHoveredSystem(found);
    setHoveredFact(foundFact);
    canvas.style.cursor = (found || foundFact) ? "pointer" : isDragging.current ? "grabbing" : "grab";
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleClick = () => {
    if (hoveredFact) {
      window.location.href = `/codex/facts`;
    } else if (hoveredSystem) {
      window.location.href = `/theories?q=${encodeURIComponent(hoveredSystem.name)}`;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setCamera((c) => ({ ...c, zoom: Math.max(0.01, Math.min(10, c.zoom * factor)) }));
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      <div className="absolute bottom-4 left-4 bg-bg-card/90 border border-border p-3 space-y-1.5">
        <p className="font-ui text-text-faint text-[9px] tracking-[0.2em] uppercase mb-2">Theories</p>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="font-system text-text-dim text-[10px]">
              {status.replace(/_/g, " ")}
            </span>
          </div>
        ))}
        {facts.length > 0 && (
          <>
            <p className="font-ui text-text-faint text-[9px] tracking-[0.2em] uppercase mt-3 mb-1">Facts</p>
            {Object.entries(FACT_STATUS_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rotate-45" style={{ backgroundColor: color }} />
                <span className="font-system text-text-dim text-[10px]">{status}</span>
              </div>
            ))}
          </>
        )}
      </div>
      <div className="absolute top-4 right-4 bg-bg-card/90 border border-border px-3 py-2">
        <p className="font-system text-coord-blue text-[10px]">
          Zoom: {(camera.zoom * 100).toFixed(0)}% | X: {camera.x.toFixed(0)} Z: {camera.y.toFixed(0)}
        </p>
      </div>
    </div>
  );
}

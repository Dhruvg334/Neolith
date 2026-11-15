"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Panzoom, { type PanzoomObject } from "@panzoom/panzoom";
import mermaid from "mermaid";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, Move } from "lucide-react";

interface MermaidViewerProps {
  readonly chart: string;
  readonly title?: string;
}

export function MermaidViewer({ chart, title }: MermaidViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const panzoomInstance = useRef<PanzoomObject | null>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "neutral",
      fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
    });

    let isMounted = true;
    const renderDiagram = async () => {
      try {
        setRenderError(null);
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        if (isMounted) {
          // Clean up any inline fixed positioning or margins to guarantee center alignment
          const cleanedSvg = svg
            .replace(/style="max-width:[^"]*"/, 'style="max-width: 100%; height: auto; margin: 0 auto; display: block;"')
            .replace(/height="[^"]*"/, "");
          setSvgContent(cleanedSvg);
        }
      } catch (err) {
        if (isMounted) {
          setRenderError(
            err instanceof Error ? err.message : "Failed to render Mermaid diagram"
          );
        }
      }
    };

    void renderDiagram();
    return () => {
      isMounted = false;
    };
  }, [chart]);

  const initPanzoom = useCallback(() => {
    if (diagramRef.current && canvasRef.current && svgContent) {
      if (panzoomInstance.current) {
        panzoomInstance.current.destroy();
      }

      const pz = Panzoom(diagramRef.current, {
        maxScale: 6,
        minScale: 0.2,
        startScale: 1,
        canvas: true, // Enables dragging ANYWHERE on the parent canvas
        noBind: false,
      });

      panzoomInstance.current = pz;

      const canvas = canvasRef.current;
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        pz.zoomWithWheel(e);
        setScale(Math.round(pz.getScale() * 100) / 100);
      };

      const handlePanzoomChange = () => {
        setScale(Math.round(pz.getScale() * 100) / 100);
      };

      canvas.addEventListener("wheel", handleWheel, { passive: false });
      diagramRef.current.addEventListener("panzoomchange", handlePanzoomChange);

      return () => {
        canvas.removeEventListener("wheel", handleWheel);
        diagramRef.current?.removeEventListener("panzoomchange", handlePanzoomChange);
        pz.destroy();
      };
    }
  }, [svgContent]);

  useEffect(() => {
    const cleanup = initPanzoom();
    return () => cleanup?.();
  }, [initPanzoom]);

  const handleZoomIn = () => {
    if (panzoomInstance.current) {
      panzoomInstance.current.zoomIn();
      setScale(Math.round(panzoomInstance.current.getScale() * 100) / 100);
    }
  };

  const handleZoomOut = () => {
    if (panzoomInstance.current) {
      panzoomInstance.current.zoomOut();
      setScale(Math.round(panzoomInstance.current.getScale() * 100) / 100);
    }
  };

  const handleReset = () => {
    if (panzoomInstance.current) {
      panzoomInstance.current.reset();
      setScale(1);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col transition-all ${
        isFullscreen ? "p-6 h-screen w-screen fixed inset-0 z-50 bg-white" : "h-[500px]"
      }`}
    >
      {/* Viewer Header / Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 tracking-tight">
            {title || "Architecture & Decision Diagram"}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
            {Math.round(scale * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
            title="Zoom In"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm flex items-center gap-1"
            title="Center & Reset Diagram"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span>Center</span>
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Canvas Area: Perfectly centered by default with unrestricted canvas dragging */}
      <div
        ref={canvasRef}
        className="relative flex-1 cursor-grab active:cursor-grabbing overflow-hidden bg-slate-50/40 flex items-center justify-center p-6 select-none touch-none"
      >
        {renderError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 max-w-md text-center">
            <p className="font-bold">Failed to render diagram:</p>
            <p className="mt-1 font-mono text-[11px]">{renderError}</p>
          </div>
        ) : svgContent ? (
          <div
            ref={diagramRef}
            className="flex items-center justify-center w-full h-full pointer-events-auto"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="text-xs text-slate-400 animate-pulse">Rendering architectural model...</div>
        )}
      </div>

      {/* Helper Footer */}
      <div className="border-t border-slate-100 bg-white px-4 py-2 text-[10px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Move className="w-3 h-3 text-slate-400" />
          Click and drag anywhere to pan • Scroll wheel to zoom
        </span>
        <span className="font-mono text-slate-400">Centered View</span>
      </div>
    </div>
  );
}

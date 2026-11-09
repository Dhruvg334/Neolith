"use client";

import { useEffect, useRef, useState } from "react";
import Panzoom, { type PanzoomObject } from "@panzoom/panzoom";
import mermaid from "mermaid";

interface MermaidViewerProps {
  readonly chart: string;
  readonly title?: string;
}

export function MermaidViewer({ chart, title }: MermaidViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const panzoomInstance = useRef<PanzoomObject | null>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "neutral",
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
    });

    let isMounted = true;
    const renderDiagram = async () => {
      try {
        setRenderError(null);
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        if (isMounted) {
          setSvgContent(svg);
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

  useEffect(() => {
    if (diagramRef.current && svgContent) {
      if (panzoomInstance.current) {
        panzoomInstance.current.destroy();
      }
      const pz = Panzoom(diagramRef.current, {
        maxScale: 4,
        minScale: 0.4,
        contain: "outside",
      });
      panzoomInstance.current = pz;

      const element = diagramRef.current;
      const handleWheel = (e: WheelEvent) => {
        pz.zoomWithWheel(e);
      };
      element.addEventListener("wheel", handleWheel, { passive: false });

      return () => {
        element.removeEventListener("wheel", handleWheel);
        pz.destroy();
      };
    }
  }, [svgContent]);

  const handleZoomIn = () => panzoomInstance.current?.zoomIn();
  const handleZoomOut = () => panzoomInstance.current?.zoomOut();
  const handleReset = () => {
    panzoomInstance.current?.reset();
  };
  const handleFit = () => {
    panzoomInstance.current?.reset();
    panzoomInstance.current?.zoom(0.9);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col ${
        isFullscreen ? "p-6 h-screen w-screen" : "h-[480px]"
      }`}
    >
      {/* Viewer Header / Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs">
        <span className="font-semibold text-slate-700">
          {title || "Architecture & Decision Diagram"}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleZoomIn}
            className="rounded border border-slate-300 bg-white px-2 py-1 font-bold text-slate-700 hover:bg-slate-100"
            title="Zoom In"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="rounded border border-slate-300 bg-white px-2 py-1 font-bold text-slate-700 hover:bg-slate-100"
            title="Zoom Out"
          >
            -
          </button>
          <button
            type="button"
            onClick={handleFit}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-slate-700 hover:bg-slate-100"
            title="Fit to view"
          >
            Fit
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-slate-700 hover:bg-slate-100"
            title="Reset zoom & pan"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="rounded border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-100"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1 cursor-grab active:cursor-grabbing overflow-hidden bg-slate-50/50 flex items-center justify-center p-4">
        {renderError ? (
          <div className="rounded border border-red-200 bg-red-50 p-4 text-xs text-red-800">
            <p className="font-semibold">Failed to render diagram:</p>
            <p className="mt-1 font-mono">{renderError}</p>
          </div>
        ) : svgContent ? (
          <div
            ref={diagramRef}
            className="transition-transform duration-75 select-none"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="text-xs text-slate-400">Loading diagram...</div>
        )}
      </div>

      <div className="border-t border-slate-100 bg-white px-4 py-1.5 text-[10px] text-slate-400 flex items-center justify-between">
        <span>Click and drag to pan • Scroll wheel to zoom</span>
        <span className="font-mono">Security: Strict</span>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { Info, HelpCircle } from "lucide-react";

export interface InfoIconProps {
  readonly title: string;
  readonly content: string;
  readonly side?: "top" | "bottom" | "left" | "right";
  readonly badge?: string;
  readonly className?: string;
  readonly iconType?: "info" | "help";
}

export function InfoIcon({
  title,
  content,
  side = "top",
  badge,
  className = "",
  iconType = "info",
}: InfoIconProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const sideClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }[side];

  const IconComponent = iconType === "help" ? HelpCircle : Info;

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center align-middle ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="text-slate-400 hover:text-ember-500 focus:text-ember-500 transition-colors p-0.5 rounded-full hover:bg-slate-100 focus:outline-none"
        aria-label={`More info about ${title}`}
        title={title}
      >
        <IconComponent className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className={`absolute z-50 w-64 sm:w-72 p-3 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 text-xs font-normal leading-relaxed animate-fade-in pointer-events-auto ${sideClasses}`}
        >
          <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-slate-100">
            <span className="font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-ember-500" />
              {title}
            </span>
            {badge && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 uppercase tracking-wider">
                {badge}
              </span>
            )}
          </div>
          <p className="text-slate-600 m-0 leading-normal">{content}</p>
        </div>
      )}
    </div>
  );
}

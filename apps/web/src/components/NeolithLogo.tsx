import type { HTMLAttributes } from "react";

interface NeolithLogoProps extends HTMLAttributes<HTMLDivElement> {
  readonly size?: "sm" | "md" | "lg";
  readonly showSubtitle?: boolean;
  readonly lightText?: boolean;
}

export function NeolithLogo({
  size = "md",
  showSubtitle = true,
  lightText = true,
  className = "",
  ...props
}: NeolithLogoProps) {
  const iconDimensions = {
    sm: { box: 28, text: "text-base", sub: "text-[9px]" },
    md: { box: 36, text: "text-lg", sub: "text-[10px]" },
    lg: { box: 44, text: "text-2xl", sub: "text-xs" },
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`} {...props}>
      {/* Precision Geometric Monolith SVG Emblem */}
      <div
        style={{ width: iconDimensions.box, height: iconDimensions.box }}
        className="relative shrink-0 transition-transform duration-200 group-hover:scale-105"
      >
        <svg
          viewBox="0 0 128 128"
          width="100%"
          height="100%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#040711" />
              <stop offset="100%" stopColor="#0F1A30" />
            </linearGradient>

            <linearGradient id="logoEmberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF6B00" />
              <stop offset="50%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>

            <linearGradient id="logoTealGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0D9488" />
              <stop offset="100%" stopColor="#14B8A6" />
            </linearGradient>

            <linearGradient id="logoBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#334155" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Rounded Monolith Vault Background */}
          <rect width="128" height="128" rx="28" fill="url(#logoBgGrad)" />
          <rect
            x="2"
            y="2"
            width="124"
            height="124"
            rx="26"
            stroke="url(#logoBorder)"
            strokeWidth="2"
          />

          {/* Protective Shield Outline */}
          <path
            d="M64 18 L98 32 V66 C98 86 82 102 64 108 C46 102 30 86 30 66 V32 Z"
            fill="#070B16"
            stroke="#1E293B"
            strokeWidth="1.5"
          />

          {/* Left Monolith Pillar */}
          <path d="M40 38 L50 34 V90 L40 86 Z" fill="#F8FAFC" />
          <path d="M50 34 L54 36 V88 L50 90 Z" fill="#94A3B8" />

          {/* Dynamic Diagonal Crossbar (The Authority Bridge) */}
          <path d="M50 38 L88 80 V90 L50 48 Z" fill="url(#logoEmberGrad)" />

          {/* Right Monolith Pillar */}
          <path d="M78 36 L88 32 V88 L78 84 Z" fill="#F1F5F9" />
          <path d="M74 38 L78 36 V84 L74 86 Z" fill="#64748B" />

          {/* Cyan Authority Gem */}
          <polygon points="64,24 69,29 64,34 59,29" fill="url(#logoTealGrad)" />

          {/* Single-Use Permit Core Dot */}
          <circle cx="64" cy="96" r="3" fill="#F97316" />
        </svg>
      </div>

      {/* Typography */}
      <div className="flex flex-col">
        <span
          className={`font-black tracking-tight leading-tight transition-colors ${iconDimensions.text} ${
            lightText
              ? "text-white group-hover:text-ember-400"
              : "text-slate-900 group-hover:text-ember-600"
          }`}
        >
          Neolith
        </span>
        {showSubtitle && (
          <span
            className={`font-bold uppercase tracking-widest leading-none ${iconDimensions.sub} ${
              lightText ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Governance Runtime
          </span>
        )}
      </div>
    </div>
  );
}

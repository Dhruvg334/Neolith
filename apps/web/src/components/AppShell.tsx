"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

interface AppShellProps {
  readonly children: ReactNode;
}

export type ViewMode = "essentials" | "control";

const ESSENTIALS_NAV = [
  { href: "/", label: "Home" },
  { href: "/agent", label: "Financial Agent" },
  { href: "/accounts", label: "Accounts" },
  { href: "/tasks", label: "Activity" },
] as const;

const CONTROL_NAV = [
  { href: "/governance", label: "Governance" },
  { href: "/policies", label: "Policies" },
  { href: "/operator", label: "Operator" },
] as const;

const KNOWLEDGE_NAV = [
  { href: "/docs", label: "Docs" },
  { href: "/adopt", label: "Adopt" },
] as const;

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [viewMode, setViewMode] = useState<ViewMode>("essentials");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("neolith_view_mode");
    if (saved === "control" || saved === "essentials") {
      setViewMode(saved);
    }
  }, []);

  const handleModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("neolith_view_mode", mode);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Application Bar */}
      <header
        className="sticky top-0 z-40 border-b border-slate-800 text-white"
        style={{ backgroundColor: "#0B1F33" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <span
                className="w-8 h-8 rounded flex items-center justify-center font-black text-sm tracking-wider"
                style={{ backgroundColor: "#0F766E", color: "#FFFFFF" }}
              >
                N
              </span>
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight tracking-tight text-white group-hover:text-teal-300 transition-colors">
                  Neolith
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                  Governance Runtime
                </span>
              </div>
            </Link>

            {/* Quick Status Pill */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-medium">Gateway Active</span>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-800/90 p-1 rounded-lg border border-slate-700/60">
              <button
                type="button"
                onClick={() => handleModeChange("essentials")}
                className={`px-3 py-1 text-xs font-semibold rounded transition-all duration-150 ${
                  viewMode === "essentials"
                    ? "bg-teal-700 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Essentials mode: streamlined operational experience"
              >
                Essentials
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("control")}
                className={`px-3 py-1 text-xs font-semibold rounded transition-all duration-150 ${
                  viewMode === "control"
                    ? "text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                style={
                  viewMode === "control"
                    ? { backgroundColor: "#F97316" }
                    : undefined
                }
                title="Control mode: deep governance policy and trace inspection"
              >
                Control
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Body with Navigation and Workspace */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar */}
        <aside className="w-56 shrink-0 border-r border-slate-200 bg-white py-6 px-4 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Essentials Section */}
            <div>
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Essentials
              </span>
              <nav className="mt-2 space-y-1" aria-label="Essentials navigation">
                {ESSENTIALS_NAV.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-all duration-100 ${
                        isActive
                          ? "bg-teal-50 text-teal-800 font-semibold"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Control Section */}
            <div>
              <div className="flex items-center justify-between px-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Control
                </span>
                {viewMode === "control" && (
                  <span
                    className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded text-white"
                    style={{ backgroundColor: "#F97316" }}
                  >
                    Active
                  </span>
                )}
              </div>
              <nav className="mt-2 space-y-1" aria-label="Control navigation">
                {CONTROL_NAV.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-all duration-100 ${
                        isActive
                          ? "bg-amber-50 text-amber-900 font-semibold border-l-2 border-amber-600"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Knowledge Section */}
            <div>
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Knowledge
              </span>
              <nav className="mt-2 space-y-1" aria-label="Knowledge navigation">
                {KNOWLEDGE_NAV.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-all duration-100 ${
                        isActive
                          ? "bg-slate-100 text-slate-900 font-semibold"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Sidebar Footer info */}
          <div className="pt-6 border-t border-slate-200">
            <div className="px-3 py-2 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center justify-between font-semibold text-slate-700">
                <span>Mode:</span>
                <span className="capitalize">{mounted ? viewMode : "essentials"}</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Presentation view toggle. Permissions & invariants remain authoritative.
              </p>
            </div>
          </div>
        </aside>

        {/* Content View */}
        <main className="flex-1 p-6 md:p-8 min-w-0">{children}</main>
      </div>
    </div>
  );
}

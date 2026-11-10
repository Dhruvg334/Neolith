"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { checkBackendHealth } from "@/lib/financial-api";

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
  { href: "/approvals", label: "Approvals" },
  { href: "/operator", label: "Operator" },
] as const;

const KNOWLEDGE_NAV = [
  { href: "/docs", label: "Docs" },
  { href: "/adopt", label: "Adopt" },
] as const;

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [viewMode, setViewMode] = useState<ViewMode>("essentials");
  const [backendStatus, setBackendStatus] = useState<"healthy" | "starting" | "unreachable" | "checking">("checking");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("neolith_view_mode");
    if (saved === "control" || saved === "essentials") {
      setViewMode(saved);
    }
    void checkBackendHealth().then((res) => setBackendStatus(res.status));
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
              {backendStatus === "healthy" ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-slate-300 font-medium">Connected</span>
                </>
              ) : backendStatus === "starting" ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-amber-200 font-medium">Starting service</span>
                </>
              ) : backendStatus === "unreachable" ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  <span className="text-slate-300 font-medium">Connection issue</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" />
                  <span className="text-slate-400 font-medium">Checking...</span>
                </>
              )}
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

      {/* Semantic Footer (Handbook Part II Anti-Vibe-Coding Standards) */}
      <footer className="border-t border-slate-200 bg-white text-slate-600 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Col 1: Brand & Purpose */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-6 h-6 rounded flex items-center justify-center font-black text-xs text-white"
                  style={{ backgroundColor: "#0F766E" }}
                >
                  N
                </span>
                <span className="font-bold text-slate-900 tracking-tight text-sm">Neolith</span>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">
                Separating intelligent planning from governed execution authority. Deterministic OPA policy
                runtime, short-lived permits, and tamper-evident decision receipts.
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Deterministic Invariants Enforced</span>
              </div>
            </div>

            {/* Col 2: Navigation */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Platform Workspaces
              </span>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <Link href="/agent" className="hover:text-slate-900 transition-colors">
                    Financial AI Agent
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-slate-900 transition-colors">
                    Treasury Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/accounts" className="hover:text-slate-900 transition-colors">
                    Operating Accounts & Invoices
                  </Link>
                </li>
                <li>
                  <Link href="/tasks" className="hover:text-slate-900 transition-colors">
                    Activity & Plans
                  </Link>
                </li>
                <li>
                  <Link href="/approvals" className="hover:text-slate-900 transition-colors">
                    Human Approval Queue
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Control & Invariants */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Governance & Security
              </span>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <Link href="/governance" className="hover:text-slate-900 transition-colors">
                    Governance Runtime
                  </Link>
                </li>
                <li>
                  <Link href="/policies" className="hover:text-slate-900 transition-colors">
                    Policy Configuration & Packs
                  </Link>
                </li>
                <li>
                  <Link href="/operator" className="hover:text-slate-900 transition-colors">
                    Emergency Controls & Kill-Switch
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="hover:text-slate-900 transition-colors">
                    Security Architecture
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="hover:text-slate-900 transition-colors">
                    Technical Documentation Hub
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Trust & Compliance */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Trust & Compliance
              </span>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <Link href="/adopt" className="hover:text-slate-900 transition-colors">
                    Enterprise Adoption Guide
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-slate-900 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-slate-900 transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/dhruvg-04/Neolith"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-slate-900 transition-colors"
                  >
                    GitHub Source Repository &rarr;
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <p>&copy; {new Date().getFullYear()} Neolith Project. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>Maintained by Dhruv Gupta</span>
              <span>&middot;</span>
              <span>Open Policy Agent v1.22.2</span>
              <span>&middot;</span>
              <span>Apache 2.0 License</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

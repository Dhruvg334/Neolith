"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Home,
  Bot,
  Wallet,
  Activity,
  ShieldCheck,
  FileCode,
  CheckSquare,
  Cpu,
  BookOpen,
  Compass,
  X,
  ExternalLink,
  Lock,
  PanelLeft,
} from "lucide-react";
import { checkBackendHealth } from "@/lib/financial-api";
import { InfoIcon } from "@/components/ui/InfoIcon";
import { NeolithLogo } from "@/components/NeolithLogo";

interface AppShellProps {
  readonly children: ReactNode;
}

export type ViewMode = "essentials" | "control";

interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: typeof Home;
  readonly badge?: string;
}

const ESSENTIALS_NAV: readonly NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/agent", label: "Financial Agent Console", icon: Bot, badge: "AI" },
  { href: "/accounts", label: "Operating Accounts & Budgets", icon: Wallet },
  { href: "/tasks", label: "Task Activity Ledger", icon: Activity },
];

const CONTROL_NAV: readonly NavItem[] = [
  { href: "/governance", label: "Governance & EU AI Act", icon: ShieldCheck, badge: "Compliance" },
  { href: "/policies", label: "Policy Studio & Simulator", icon: FileCode, badge: "Simulator" },
  { href: "/approvals", label: "Human Approvals Queue", icon: CheckSquare, badge: "Review" },
  { href: "/operator", label: "Operator Emergency Control", icon: Cpu, badge: "Kill-Switch" },
];

const KNOWLEDGE_NAV: readonly NavItem[] = [
  { href: "/docs", label: "System Documentation Hub", icon: BookOpen },
  { href: "/adopt", label: "Organization Adoption Guide", icon: Compass },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [viewMode, setViewMode] = useState<ViewMode>("essentials");
  const [backendStatus, setBackendStatus] = useState<"healthy" | "starting" | "unreachable" | "checking">("checking");
  const [trayOpen, setTrayOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("neolith_view_mode");
    if (saved === "control" || saved === "essentials") {
      setViewMode(saved);
    }
    void checkBackendHealth().then((res) => setBackendStatus(res.status));
  }, []);

  // Close tray whenever the path changes
  useEffect(() => {
    setTrayOpen(false);
  }, [pathname]);

  // Close tray on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && trayOpen) {
        setTrayOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [trayOpen]);

  const handleModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("neolith_view_mode", mode);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-ember-500 selection:text-white">
      {/* 1. TOP APPLICATION BAR */}
      <header className="sticky top-0 z-40 bg-[#070B16] border-b border-slate-800/80 shadow-glow-obsidian text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand & Tray Toggle */}
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Openable / Closable Tray Trigger Button */}
            <button
              type="button"
              onClick={() => setTrayOpen(!trayOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-ember-500/60 text-slate-200 hover:text-white transition-all text-xs font-semibold group shadow-sm"
              title="Open or close platform navigation tray"
              aria-label={trayOpen ? "Close Workspaces Tray" : "Open Workspaces Tray"}
            >
              <PanelLeft className="w-4 h-4 text-ember-400 transition-transform group-hover:scale-110" />
              <span className="hidden sm:inline">Workspaces</span>
            </button>

            {/* Brand Logo */}
            <Link href="/" className="group flex items-center gap-2">
              <NeolithLogo size="md" lightText={true} />
            </Link>

            {/* Live Gateway Health Indicator */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs">
              {backendStatus === "healthy" ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-slate-300 font-medium">Gateway Active</span>
                </>
              ) : backendStatus === "starting" ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-amber-300 font-medium">Starting...</span>
                </>
              ) : backendStatus === "unreachable" ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  <span className="text-red-300 font-medium">Offline (Sandboxed)</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" />
                  <span className="text-slate-400 font-medium">Probing Gateway</span>
                </>
              )}
            </div>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* View Mode Switcher */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => handleModeChange("essentials")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                  viewMode === "essentials"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Essentials mode: streamlined agent and requester workflows"
              >
                Essentials
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("control")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                  viewMode === "control"
                    ? "bg-ember-500 text-white shadow-glow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Control mode: deep policy, approval, and operator governance"
              >
                <Lock className="w-3 h-3" />
                Control
              </button>
              <InfoIcon
                title="Adaptive View Mode"
                content="Essentials mode streamlines requester activity and financial summaries. Control mode reveals deep policy evaluation traces, human approval checkpoints, and the emergency kill-switch."
                side="bottom"
                badge="Dual Interface"
                className="ml-0.5"
              />
            </div>

            {/* Quick Action Button */}
            <Link
              href="/agent"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-ember-500 text-white hover:bg-ember-600 transition-all shadow-glow hover:scale-[1.02] flex items-center gap-1.5"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Agent Console</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. OPENABLE / CLOSABLE NAVIGATION TRAY (DRAWER) */}
      {trayOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setTrayOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-Out Tray Panel */}
          <div className="relative w-80 max-w-[85vw] bg-[#070B16] border-r border-slate-800 p-6 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
            {/* Tray Header */}
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-slate-800">
                <Link href="/" onClick={() => setTrayOpen(false)}>
                  <NeolithLogo size="sm" lightText={true} />
                </Link>
                <button
                  type="button"
                  onClick={() => setTrayOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 transition-colors"
                  aria-label="Close navigation tray"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mode Switcher inside Tray for Mobile/Quick access */}
              <div className="my-5 p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 px-1">
                  Presentation Mode
                </span>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => handleModeChange("essentials")}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      viewMode === "essentials"
                        ? "bg-slate-800 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Essentials
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange("control")}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                      viewMode === "control"
                        ? "bg-ember-500 text-white shadow-glow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Lock className="w-3 h-3" />
                    Control
                  </button>
                </div>
              </div>

              {/* Workspaces Navigation Groups */}
              <div className="space-y-6">
                {/* Section 1: Requester Flow */}
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block px-2 mb-1.5">
                    Requester Workspaces
                  </span>
                  <nav className="space-y-1" aria-label="Requester navigation">
                    {ESSENTIALS_NAV.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setTrayOpen(false)}
                          className={`flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                            isActive
                              ? "bg-ember-500 text-white shadow-glow"
                              : "text-slate-300 hover:bg-slate-900 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                isActive ? "bg-ember-600 text-white" : "bg-slate-800 text-slate-300"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                {/* Section 2: Governance & Control */}
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block px-2 mb-1.5">
                    Governance & Control
                  </span>
                  <nav className="space-y-1" aria-label="Control navigation">
                    {CONTROL_NAV.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setTrayOpen(false)}
                          className={`flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                            isActive
                              ? "bg-ember-500 text-white shadow-glow"
                              : "text-slate-300 hover:bg-slate-900 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                isActive ? "bg-ember-600 text-white" : "bg-slate-800 text-slate-300"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                {/* Section 3: Resources */}
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block px-2 mb-1.5">
                    Resources & Architecture
                  </span>
                  <nav className="space-y-1" aria-label="Knowledge navigation">
                    {KNOWLEDGE_NAV.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setTrayOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                            isActive
                              ? "bg-slate-800 text-white"
                              : "text-slate-300 hover:bg-slate-900 hover:text-white"
                          }`}
                        >
                          <Icon className="w-4 h-4 text-slate-400" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </div>
            </div>

            {/* Tray Bottom Status Box */}
            <div className="pt-6 border-t border-slate-800 space-y-2 mt-6">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-ember-500" />
                    <span>Zero Implicit Authority</span>
                  </span>
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    Enforced
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed m-0">
                  AI agents hold no direct banking keys or payment authority.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN APPLICATION WORKSPACE (SPACIOUS FULL-WIDTH VIEW) */}
      <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">{children}</main>
      </div>

      {/* 4. WORLD-CLASS ENTERPRISE FOOTER */}
      <footer className="border-t border-slate-200 bg-white text-slate-600 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            {/* Col 1: Brand & Purpose */}
            <div className="space-y-4">
              <Link href="/" className="inline-block group">
                <NeolithLogo size="md" lightText={false} />
              </Link>
              <p className="text-slate-500 text-xs leading-relaxed m-0">
                Separating autonomous AI reasoning from real-world financial execution authority.
                Deterministic policy verification, single-use execution permits, and immutable audit receipts.
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Deterministic Invariants Enforced</span>
              </div>
            </div>

            {/* Col 2: Platform Workspaces */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-900 block">
                Platform Workspaces
              </span>
              <ul className="space-y-2 text-xs list-none p-0 m-0">
                <li>
                  <Link href="/agent" className="hover:text-ember-600 transition-colors">
                    Financial AI Agent Console
                  </Link>
                </li>
                <li>
                  <Link href="/accounts" className="hover:text-ember-600 transition-colors">
                    Operating Accounts & Budgets
                  </Link>
                </li>
                <li>
                  <Link href="/approvals" className="hover:text-ember-600 transition-colors">
                    Human Approvals Queue
                  </Link>
                </li>
                <li>
                  <Link href="/tasks" className="hover:text-ember-600 transition-colors">
                    Task Activity Ledger
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-ember-600 transition-colors">
                    Treasury Operations
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Governance & Assurance */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-900 block">
                Governance & Control
              </span>
              <ul className="space-y-2 text-xs list-none p-0 m-0">
                <li>
                  <Link href="/governance" className="hover:text-ember-600 transition-colors">
                    Governance Runtime Gateway
                  </Link>
                </li>
                <li>
                  <Link href="/policies" className="hover:text-ember-600 transition-colors">
                    Policy Studio & Simulator
                  </Link>
                </li>
                <li>
                  <Link href="/governance" className="hover:text-ember-600 transition-colors">
                    EU AI Act Compliance Matrix
                  </Link>
                </li>
                <li>
                  <Link href="/operator" className="hover:text-ember-600 transition-colors">
                    Emergency Kill-Switch
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Trust, Architecture & Legal */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-900 block">
                Trust & Verification
              </span>
              <ul className="space-y-2 text-xs list-none p-0 m-0">
                <li>
                  <Link href="/docs" className="hover:text-ember-600 transition-colors">
                    Architecture Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/adopt" className="hover:text-ember-600 transition-colors">
                    Enterprise Adoption Guide
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="hover:text-ember-600 transition-colors">
                    Security Invariants
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-ember-600 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-ember-600 transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <div>
              © {new Date().getFullYear()} Neolith. Enterprise Agentic Governance System.
            </div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="hover:text-slate-600 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-slate-600 transition-colors">
                Terms
              </Link>
              <Link href="/security" className="hover:text-slate-600 transition-colors">
                Security
              </Link>
              <a
                href="https://github.com/Dhruvg334/Neolith"
                target="_blank"
                rel="noreferrer"
                className="hover:text-slate-600 transition-colors flex items-center gap-1 font-semibold"
              >
                GitHub
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

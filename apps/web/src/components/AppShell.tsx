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
  Menu,
  X,
  ExternalLink,
  Lock,
} from "lucide-react";
import { checkBackendHealth } from "@/lib/financial-api";
import { InfoIcon } from "@/components/ui/InfoIcon";

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
  { href: "/agent", label: "Financial Agent", icon: Bot, badge: "AI" },
  { href: "/accounts", label: "Accounts & Budgets", icon: Wallet },
  { href: "/tasks", label: "Task Trace Activity", icon: Activity },
];

const CONTROL_NAV: readonly NavItem[] = [
  { href: "/governance", label: "Governance & EU AI Act", icon: ShieldCheck, badge: "Compliance" },
  { href: "/policies", label: "Policy Studio & Playground", icon: FileCode, badge: "Simulator" },
  { href: "/approvals", label: "Human Approvals", icon: CheckSquare, badge: "Review" },
  { href: "/operator", label: "Operator Control", icon: Cpu, badge: "Kill-Switch" },
];

const KNOWLEDGE_NAV: readonly NavItem[] = [
  { href: "/docs", label: "Documentation Hub", icon: BookOpen },
  { href: "/adopt", label: "Adopt Neolith", icon: Compass },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [viewMode, setViewMode] = useState<ViewMode>("essentials");
  const [backendStatus, setBackendStatus] = useState<"healthy" | "starting" | "unreachable" | "checking">("checking");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("neolith_view_mode");
    if (saved === "control" || saved === "essentials") {
      setViewMode(saved);
    }
    void checkBackendHealth().then((res) => setBackendStatus(res.status));
  }, []);

  // Close mobile menu on path change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("neolith_view_mode", mode);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-ember-500 selection:text-white">
      {/* 1. TOP AUTHORITATIVE APPLICATION BAR */}
      <header className="sticky top-0 z-40 bg-[#070B16] border-b border-slate-800/80 shadow-glow-obsidian text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand & Status */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm tracking-wider bg-gradient-to-br from-ember-500 to-ember-600 text-white shadow-glow group-hover:scale-105 transition-all">
                N
              </span>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg leading-tight tracking-tight text-white group-hover:text-ember-400 transition-colors">
                  Neolith
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                  Governance Runtime
                </span>
              </div>
            </Link>

            {/* Live Gateway Connection Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs">
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

          {/* Desktop Right Controls: View Switcher & Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
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
                content="Essentials mode streamlines requester activity and financial summaries. Control mode reveals deep OPA evaluation traces, human approval queues, and the operator emergency kill-switch."
                side="bottom"
                badge="Dual Interface"
                className="ml-1"
              />
            </div>

            {/* Quick Action Button */}
            <Link
              href="/agent"
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-ember-500 text-white hover:bg-ember-600 transition-all shadow-glow hover:scale-[1.02] flex items-center gap-1.5"
            >
              <Bot className="w-3.5 h-3.5" />
              Agent Console
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-[#070B16] px-4 pt-3 pb-6 space-y-4 animate-slide-down">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-400">View Mode:</span>
              <div className="flex gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleModeChange("essentials")}
                  className={`px-3 py-1 text-xs font-bold rounded ${
                    viewMode === "essentials" ? "bg-slate-800 text-white" : "text-slate-400"
                  }`}
                >
                  Essentials
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("control")}
                  className={`px-3 py-1 text-xs font-bold rounded ${
                    viewMode === "control" ? "bg-ember-500 text-white" : "text-slate-400"
                  }`}
                >
                  Control
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block px-2">
                Workspaces
              </span>
              {[...ESSENTIALS_NAV, ...CONTROL_NAV, ...KNOWLEDGE_NAV].map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive ? "bg-ember-500 text-white" : "text-slate-300 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* 2. MAIN APPLICATION WORKSPACE & SIDEBAR */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar (Desktop) */}
        <aside className="hidden md:flex w-64 shrink-0 border-r border-slate-200/80 bg-white py-6 px-4 flex-col justify-between">
          <div className="space-y-6">
            {/* Essentials Section */}
            <div>
              <div className="px-3 flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Requester Flow
                </span>
                {viewMode === "essentials" && (
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    Active
                  </span>
                )}
              </div>
              <nav className="mt-2 space-y-1" aria-label="Essentials navigation">
                {ESSENTIALS_NAV.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-150 ${
                        isActive
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? "text-ember-400" : "text-slate-400"}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            isActive ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"
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

            {/* Control Section */}
            <div>
              <div className="px-3 flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Governance Control
                </span>
                {viewMode === "control" && (
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-ember-500 text-white shadow-glow">
                    Active
                  </span>
                )}
              </div>
              <nav className="mt-2 space-y-1" aria-label="Control navigation">
                {CONTROL_NAV.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-150 ${
                        isActive
                          ? "bg-ember-500 text-white shadow-glow"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            isActive ? "bg-ember-600 text-white" : "bg-amber-50 text-amber-700"
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

            {/* Knowledge Section */}
            <div>
              <span className="px-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Resources
              </span>
              <nav className="mt-2 space-y-1" aria-label="Knowledge navigation">
                {KNOWLEDGE_NAV.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-150 ${
                        isActive
                          ? "bg-slate-100 text-slate-900 border-l-2 border-slate-900"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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

          {/* Sidebar Status Pill Card */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1.5">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-ember-500" />
                  Mode: <span className="capitalize font-mono text-ember-600">{mounted ? viewMode : "essentials"}</span>
                </span>
                <span className="text-[10px] uppercase font-mono px-1 rounded bg-slate-200 text-slate-700">
                  Enforced
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal m-0">
                Zero implicit authority. Agents hold no direct payment keys.
              </p>
            </div>
          </div>
        </aside>

        {/* Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">{children}</main>
      </div>

      {/* 3. SEMANTIC ENTERPRISE FOOTER */}
      <footer className="border-t border-slate-200 bg-white text-slate-600 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Col 1: Brand & Mental Model */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white bg-ember-500 shadow-glow">
                  N
                </span>
                <span className="font-extrabold text-slate-900 tracking-tight text-base">Neolith</span>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed m-0">
                Separating intelligent planning from governed execution authority. Deterministic OPA policy runtime,
                single-use execution permits, and SHA-256 decision receipts.
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Deterministic Invariants Enforced</span>
              </div>
            </div>

            {/* Col 2: Platform Workspaces */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Workspaces
              </span>
              <ul className="space-y-1.5 text-xs list-none p-0 m-0">
                <li>
                  <Link href="/agent" className="hover:text-ember-600 transition-colors">
                    Financial AI Agent Console
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-ember-600 transition-colors">
                    Treasury Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/accounts" className="hover:text-ember-600 transition-colors">
                    Operating Accounts & Invoices
                  </Link>
                </li>
                <li>
                  <Link href="/tasks" className="hover:text-ember-600 transition-colors">
                    Task Activity Logs
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Governance & Control */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Governance & Control
              </span>
              <ul className="space-y-1.5 text-xs list-none p-0 m-0">
                <li>
                  <Link href="/governance" className="hover:text-ember-600 transition-colors">
                    Governance Runtime Gateway
                  </Link>
                </li>
                <li>
                  <Link href="/policies" className="hover:text-ember-600 transition-colors">
                    OPA Rego Policy Rules
                  </Link>
                </li>
                <li>
                  <Link href="/approvals" className="hover:text-ember-600 transition-colors">
                    Human Approvals Queue
                  </Link>
                </li>
                <li>
                  <Link href="/operator" className="hover:text-ember-600 transition-colors">
                    Operator Control & Kill-Switch
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Trust, Architecture & Legal */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Trust & Verification
              </span>
              <ul className="space-y-1.5 text-xs list-none p-0 m-0">
                <li>
                  <Link href="/docs" className="hover:text-ember-600 transition-colors">
                    System Documentation Hub
                  </Link>
                </li>
                <li>
                  <Link href="/adopt" className="hover:text-ember-600 transition-colors">
                    Organization Adoption Guide
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="hover:text-ember-600 transition-colors">
                    Security Architecture & Invariants
                  </Link>
                </li>
                <li>
                  <Link href="/llms.txt" className="hover:text-ember-600 transition-colors">
                    Machine-Readable llms.txt
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <div>
              © {new Date().getFullYear()} Neolith. Enterprise Agentic Governance System.
            </div>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-slate-600 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-slate-600 transition-colors">
                Terms of Service
              </Link>
              <Link href="/security" className="hover:text-slate-600 transition-colors">
                Security
              </Link>
              <a
                href="https://github.com/Dhruvg334/Neolith"
                target="_blank"
                rel="noreferrer"
                className="hover:text-slate-600 transition-colors flex items-center gap-1"
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

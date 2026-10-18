import Link from "next/link";
import type { ReactNode } from "react";

interface AppShellProps {
  readonly children: ReactNode;
}

const PRIMARY_NAV = [
  { href: "/", label: "Overview" },
  { href: "/tasks", label: "Tasks" },
  { href: "/approvals", label: "Approvals" },
  { href: "/operator", label: "Operator" },
] as const;

export function AppShell({ children }: AppShellProps) {
  return (
    <div>
      <header className="app-header">
        <div className="app-header-inner">
          <div className="brand-group">
            <Link href="/" className="brand-name">
              Neolith
            </Link>
            <span className="brand-subtitle">
              AI-Powered Agentic Decision and Execution System
            </span>
          </div>
          <nav className="app-nav" aria-label="Primary navigation">
            {PRIMARY_NAV.map((item) => (
              <Link key={item.href} href={item.href} className="nav-link">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}

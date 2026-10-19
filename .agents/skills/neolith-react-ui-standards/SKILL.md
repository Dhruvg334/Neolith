---
name: neolith-react-ui-standards
description: Frontend engineering standards and component guide for Neolith's Next.js 15 application (apps/web), covering reusable UI primitives, WCAG 2.1 AA accessibility, and anti-vibe-coding rules.
---

# Neolith React UI Standards Skill

Activate this runbook when building or updating pages and components inside `apps/web/`.

## 1. Reusable UI Primitives (`apps/web/src/components/ui`)

Always compose views from `@/components/ui`:
- `Card`, `CardHeader`, `CardFooter`: Standard enterprise surface containers.
- `Badge`, `DecisionBadge`, `RiskTierBadge`: Always render icon + text (`✓ ALLOW`, `✕ DENY`, `! REVIEW REQUIRED`, `R0`–`R4`) so status never relies on color alone.
- `Button`: Accessible button supporting `primary`, `secondary`, `outline`, `danger`, `ghost` variants and `aria-busy` loading state.
- `DataTable<T>`: Typed table for vendor comparisons, registries, approvals, and receipts.
- `StatusTimeline`: Visually separates `AI Agent Layer`, `Governance Control Layer`, and `Enterprise Service Layer` steps.
- `ReasonCodeList`: Maps deterministic reason codes (`BUDGET_EXCEEDED`, `PERMIT_REPLAY`, etc.) to clear human explanations.
- `BudgetMeter`: Computes budget utilization using `BigInt` minor units from decimal strings (`"6000.00"`), avoiding floating-point drift.
- `CopyableId`: Renders copyable `trace_id`, `action_id`, `task_id`, `permit_id`, and `receipt_id` badges.
- `EmptyState` & `ErrorBoundary`: Graceful empty states and runtime fault isolation.

## 2. Quality & Verification Checklist

1. No fake metrics, unbacked action buttons, or `console.log` calls in production code.
2. Single `<h1>` per route (`className="page-title"`), valid metadata in `layout.tsx`, and up-to-date `robots.ts` / `sitemap.ts`.
3. Run `pnpm lint`, `pnpm typecheck`, and `pnpm build` after every frontend change.

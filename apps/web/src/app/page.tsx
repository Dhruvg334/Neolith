import Link from "next/link";
import { CONTRACT_SCHEMA_IDS } from "@neolith/contracts";

export default function HomePage() {
  return (
    <div>
      <section className="surface-card">
        <span className="badge-tag">Phase 0 Foundation</span>
        <h1 className="page-title">Neolith</h1>
        <p className="page-lead">
          <strong>AI-Powered Agentic Decision and Execution System</strong> — an
          enterprise architecture that separates intelligent goal understanding,
          research, comparison, and planning from deterministic execution
          authority.
        </p>
      </section>

      <section className="section-grid" aria-label="Architecture layers">
        <article className="surface-card">
          <h2 className="card-title">1. AI Agent Layer</h2>
          <p className="card-copy">
            Interprets user goals, retrieves approved information, compares
            alternatives, creates structured plans, and proposes execution
            requests without holding direct execution authority.
          </p>
        </article>

        <article className="surface-card">
          <h2 className="card-title">
            2. Governance &amp; Execution Control Layer
          </h2>
          <p className="card-copy">
            Independently validates requester and agent identity, permissions,
            deterministic OPA policy, atomic budget reservations, risk tiering,
            human approvals, short-lived execution permits, and decision
            receipts.
          </p>
        </article>

        <article className="surface-card">
          <h2 className="card-title">3. Enterprise Services Layer</h2>
          <p className="card-copy">
            Executes protected operations only when presented with a valid,
            unrevoked, single-use execution permit bound to exact action
            parameters.
          </p>
        </article>
      </section>

      <section className="section-grid" aria-label="Application workspaces">
        <article className="surface-card">
          <h2 className="card-title">
            <Link href="/tasks">Task Workspace &rarr;</Link>
          </h2>
          <p className="card-copy">
            Requester workspace for submitting structured enterprise goals,
            reviewing grounded comparisons, and tracking governance states.
          </p>
        </article>

        <article className="surface-card">
          <h2 className="card-title">
            <Link href="/operator">Operator Control Plane &rarr;</Link>
          </h2>
          <p className="card-copy">
            Operator shell for agent and tool registries, permission bindings,
            policy versions, budgets, revocation controls, and audit evidence.
          </p>
        </article>
      </section>

      <section className="surface-card" aria-label="Registered contract schemas">
        <h2 className="card-title">Canonical Contract Schemas</h2>
        <p className="card-copy">
          Execution Envelope:{" "}
          <code className="inline-code">
            {CONTRACT_SCHEMA_IDS.executionRequest}
          </code>
        </p>
      </section>
    </div>
  );
}

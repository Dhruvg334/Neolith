export default function ApprovalsPage() {
  return (
    <div>
      <section className="surface-card">
        <span className="badge-tag">Approver View</span>
        <h1 className="page-title">Approval Queue</h1>
        <p className="page-lead">
          Human-in-the-loop review queue for protected actions requiring
          explicit approval bound to canonical request hashes.
        </p>
      </section>

      <section className="surface-card">
        <h2 className="card-title">Phase 0 Shell Status</h2>
        <p className="card-copy">
          Hash-bound approval workflows and LangGraph interrupt/resume controls
          are enabled in Phase 5.
        </p>
      </section>
    </div>
  );
}

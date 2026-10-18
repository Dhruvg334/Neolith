interface TaskDetailPageProps {
  readonly params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params;

  return (
    <div>
      <section className="surface-card">
        <span className="badge-tag">Task Detail</span>
        <h1 className="page-title">Task Inspection</h1>
        <p className="page-lead">
          Task Identifier: <code className="inline-code">{id}</code>
        </p>
      </section>

      <section className="surface-card">
        <h2 className="card-title">Lifecycle Stage</h2>
        <p className="card-copy">
          Detailed task state transitions, structured comparison tables, and
          governance envelope inspection attach to PostgreSQL task records in
          Phase 1 and Phase 2.
        </p>
      </section>
    </div>
  );
}

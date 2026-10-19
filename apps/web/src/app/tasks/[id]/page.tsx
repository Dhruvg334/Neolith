import { Badge, Card, CardHeader, CopyableId } from "@/components/ui";

interface TaskDetailPageProps {
  readonly params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params;

  return (
    <div>
      <Card>
        <Badge variant="info">Task Detail</Badge>
        <h1 className="page-title">Task Inspection</h1>
        <div style={{ marginTop: "0.5rem" }}>
          <CopyableId label="Task ID" value={id} />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Lifecycle Stage"
          subtitle="Task state machine and governance correlation."
        />
        <p className="card-copy">
          Detailed task state transitions, structured comparison tables, and
          governance envelope inspection attach to PostgreSQL task records in
          Phase 1 and Phase 2.
        </p>
      </Card>
    </div>
  );
}

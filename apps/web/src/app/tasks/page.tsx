import type { Metadata } from "next";
import Link from "next/link";
import { AgentTaskConsole } from "@/components/AgentTaskConsole";
import { ErrorState } from "@/components/ErrorState";
import {
  Badge,
  Card,
  CardHeader,
  CopyableId,
  DataTable,
  EmptyState,
  type DataTableColumn,
} from "@/components/ui";
import {
  fetchApiResult,
  type TaskRecordDto,
} from "@/lib/financial-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Activity & Tasks",
  description:
    "Autonomous agent plan execution tracking, live status milestones, and task runbook inspection.",
  alternates: {
    canonical: "/tasks",
  },
};

const TASK_COLUMNS: readonly DataTableColumn<TaskRecordDto>[] = [
  {
    key: "id",
    header: "Task ID",
    render: (row) => (
      <Link href={`/tasks/${row.id}`}>
        <CopyableId label="task" value={row.id} truncateLength={10} />
      </Link>
    ),
  },
  {
    key: "request",
    header: "Submitted Financial / Platform Goal",
    render: (row) => (
      <div>
        <strong>{row.original_request}</strong>
        {row.objective ? (
          <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
            Objective: {row.objective}
          </div>
        ) : null}
      </div>
    ),
  },
  {
    key: "state",
    header: "Workflow State",
    render: (row) => (
      <Badge variant={row.state === "completed" ? "allow" : "info"}>
        {row.state.toUpperCase()}
      </Badge>
    ),
  },
  {
    key: "trace",
    header: "Trace Correlation",
    render: (row) =>
      row.trace_id ? (
        <CopyableId label="trace" value={row.trace_id} truncateLength={12} />
      ) : (
        "—"
      ),
  },
  {
    key: "detail",
    header: "Inspect",
    render: (row) => (
      <Link
        href={`/tasks/${row.id}`}
        className="ui-btn ui-btn-outline ui-btn-sm"
      >
        Open Task
      </Link>
    ),
  },
];

export default async function TasksPage() {
  const tasksRes = await fetchApiResult<readonly TaskRecordDto[]>("/tasks");

  if (tasksRes.status === "error") {
    return (
      <div style={{ maxWidth: "1200px", margin: "2rem auto", padding: "0 1.5rem" }}>
        <ErrorState
          title={tasksRes.isStarting ? "Starting secure service" : "Secure service unavailable"}
          message={
            tasksRes.isStarting
              ? "Neolith is reconnecting. This can take a moment after inactivity on hosted services."
              : "We couldn't reach Neolith's secure service to retrieve registered tasks."
          }
          isStarting={tasksRes.isStarting}
          details={tasksRes.error}
        />
      </div>
    );
  }

  const tasks = tasksRes.data;

  return (
    <div>
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <Badge variant="info">Requester &amp; Treasury Task Workspace</Badge>
          <Badge variant="allow">Live Task Registry</Badge>
        </div>
        <h1 className="page-title">Task Registry &amp; Intake</h1>
        <p className="page-lead">
          Structured workspace for submitting financial and enterprise tasks,
          tracking planning state, and inspecting trace correlation IDs before
          Runtime Gateway evaluation.
        </p>
      </Card>

      <AgentTaskConsole />

      <Card>
        <CardHeader
          title={`Registered Tasks (${tasks.length})`}
          subtitle="Tasks persisted in PostgreSQL via GET /api/v1/tasks and POST /api/v1/tasks."
        />
        {tasks.length === 0 ? (
          <EmptyState
            title="No Tasks Submitted Yet"
            description="Use the form above to submit a financial task to the control plane."
          />
        ) : (
          <DataTable
            columns={TASK_COLUMNS}
            rows={tasks}
            getRowKey={(row) => row.id}
          />
        )}
      </Card>
    </div>
  );
}

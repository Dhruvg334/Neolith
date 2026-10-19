import { Badge, Card, CardHeader, EmptyState } from "@/components/ui";

export default function ApprovalsPage() {
  return (
    <div>
      <Card>
        <Badge variant="review">Approver View</Badge>
        <h1 className="page-title">Approval Queue</h1>
        <p className="page-lead">
          Human-in-the-loop review queue for protected actions requiring
          explicit approval bound to canonical request hashes.
        </p>
      </Card>

      <Card>
        <CardHeader
          title="Pending Human Approvals"
          subtitle="Approvals bind to the exact canonical SHA-256 request hash and expire automatically."
        />
        <EmptyState
          title="No Pending Approval Requests"
          description="Hash-bound approval workflows and LangGraph interrupt/resume controls connect in Phase 5."
        />
      </Card>
    </div>
  );
}

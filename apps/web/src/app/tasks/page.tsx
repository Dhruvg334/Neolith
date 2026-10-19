import {
  Badge,
  Card,
  CardHeader,
  DataTable,
  EmptyState,
  RiskTierBadge,
  type DataTableColumn,
  type RiskTier,
} from "@/components/ui";

interface SyntheticVendorRow {
  readonly id: string;
  readonly name: string;
  readonly monthlyPrice: string;
  readonly seats: number;
  readonly sso: boolean;
  readonly exportSupported: boolean;
  readonly riskTier: RiskTier;
}

const CATALOGUE_PREVIEW: readonly SyntheticVendorRow[] = [
  {
    id: "taskforge",
    name: "TaskForge",
    monthlyPrice: "INR 6,000.00",
    seats: 15,
    sso: true,
    exportSupported: true,
    riskTier: "R1",
  },
  {
    id: "plagridx",
    name: "PlanGridX",
    monthlyPrice: "INR 9,500.00",
    seats: 20,
    sso: true,
    exportSupported: true,
    riskTier: "R2",
  },
  {
    id: "sprintdesk",
    name: "SprintDesk",
    monthlyPrice: "INR 4,500.00",
    seats: 10,
    sso: false,
    exportSupported: true,
    riskTier: "R2",
  },
];

const VENDOR_COLUMNS: readonly DataTableColumn<SyntheticVendorRow>[] = [
  {
    key: "name",
    header: "Vendor",
    render: (row) => (
      <span>
        <strong>{row.name}</strong>{" "}
        <code className="inline-code">{row.id}</code>
      </span>
    ),
  },
  {
    key: "price",
    header: "Monthly Price",
    render: (row) => row.monthlyPrice,
  },
  {
    key: "seats",
    header: "Included Seats",
    render: (row) => String(row.seats),
  },
  {
    key: "sso",
    header: "SSO",
    render: (row) => (
      <Badge variant={row.sso ? "allow" : "neutral"}>
        {row.sso ? "Supported" : "No"}
      </Badge>
    ),
  },
  {
    key: "export",
    header: "Data Export",
    render: (row) => (
      <Badge variant={row.exportSupported ? "allow" : "neutral"}>
        {row.exportSupported ? "Supported" : "No"}
      </Badge>
    ),
  },
  {
    key: "risk",
    header: "Base Risk Tier",
    render: (row) => <RiskTierBadge tier={row.riskTier} />,
  },
];

export default function TasksPage() {
  return (
    <div>
      <Card>
        <Badge variant="info">Requester View</Badge>
        <h1 className="page-title">Task Workspace</h1>
        <p className="page-lead">
          Structured workspace for enterprise goal intake, grounded vendor
          research, plan inspection, and governed execution status tracking.
        </p>
      </Card>

      <Card>
        <CardHeader
          title="Active Tasks"
          subtitle="Tasks persisted in PostgreSQL will appear here once Phase 1 task registry endpoints are connected."
        />
        <EmptyState
          title="No Active Tasks Submitted"
          description="Task creation and LangGraph procurement planning connect to POST /api/v1/tasks in Phase 1 and Phase 2."
        />
      </Card>

      <Card>
        <CardHeader
          title="Approved Synthetic Vendor Catalogue Fixture (data/fixtures/vendors.json)"
          subtitle="Deterministic vendor dataset used for grounded procurement comparison."
        />
        <DataTable
          columns={VENDOR_COLUMNS}
          rows={CATALOGUE_PREVIEW}
          getRowKey={(row) => row.id}
        />
      </Card>
    </div>
  );
}

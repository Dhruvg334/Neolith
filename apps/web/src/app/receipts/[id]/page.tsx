import { Badge, Card, CardHeader, CopyableId } from "@/components/ui";

interface ReceiptDetailPageProps {
  readonly params: Promise<{ id: string }>;
}

export default async function ReceiptDetailPage({
  params,
}: ReceiptDetailPageProps) {
  const { id } = await params;

  return (
    <div>
      <Card>
        <Badge variant="info">Auditor View</Badge>
        <h1 className="page-title">Decision Receipt Explorer</h1>
        <div style={{ marginTop: "0.5rem" }}>
          <CopyableId label="Receipt ID" value={id} />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Evidence Chain Verification"
          subtitle="Tamper-evident append-only receipt chain (F13)."
        />
        <p className="card-copy">
          Append-only decision receipts and SHA-256 hash-chain verification are
          introduced in Phase 5.
        </p>
      </Card>
    </div>
  );
}

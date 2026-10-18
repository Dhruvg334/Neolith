interface ReceiptDetailPageProps {
  readonly params: Promise<{ id: string }>;
}

export default async function ReceiptDetailPage({
  params,
}: ReceiptDetailPageProps) {
  const { id } = await params;

  return (
    <div>
      <section className="surface-card">
        <span className="badge-tag">Auditor View</span>
        <h1 className="page-title">Decision Receipt Explorer</h1>
        <p className="page-lead">
          Receipt Identifier: <code className="inline-code">{id}</code>
        </p>
      </section>

      <section className="surface-card">
        <h2 className="card-title">Evidence Chain Verification</h2>
        <p className="card-copy">
          Append-only decision receipts and SHA-256 hash-chain verification are
          introduced in Phase 5.
        </p>
      </section>
    </div>
  );
}

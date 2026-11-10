import type { Metadata } from "next";
import { ReceiptDetailClient } from "@/components/ReceiptDetailClient";

interface ReceiptDetailPageProps {
  readonly params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ReceiptDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Decision Receipt ${id.slice(0, 8)} — Neolith`,
    description: `Cryptographic SHA-256 evidence block and hash-linkage verification for decision receipt ${id}.`,
    alternates: {
      canonical: `/receipts/${id}`,
    },
  };
}

export default async function ReceiptDetailPage({
  params,
}: ReceiptDetailPageProps) {
  const { id } = await params;
  return <ReceiptDetailClient receiptId={id} />;
}

import type { Metadata } from "next";
import { AccountsClient } from "@/components/AccountsClient";
import {
  fetchApiResult,
  type BeneficiaryDto,
  type FinancialAccountDto,
} from "@/lib/financial-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Corporate Accounts & Saved Bank Contacts | Neolith",
  description:
    "Corporate operating accounts used by Neolith Finance and verified bank contacts linked with enterprise CRM directory.",
  alternates: {
    canonical: "/accounts",
  },
};

export default async function AccountsPage() {
  const [accountsRes, beneficiariesRes] = await Promise.all([
    fetchApiResult<readonly FinancialAccountDto[]>("/financial/accounts"),
    fetchApiResult<readonly BeneficiaryDto[]>("/financial/beneficiaries"),
  ]);

  const initialAccounts = accountsRes.status === "success" ? accountsRes.data : [];
  const initialBeneficiaries = beneficiariesRes.status === "success" ? beneficiariesRes.data : [];

  return (
    <AccountsClient
      initialAccounts={initialAccounts}
      initialBeneficiaries={initialBeneficiaries}
    />
  );
}

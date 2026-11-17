"use client";

import { useState } from "react";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  ShieldCheck,
  Landmark,
  X,
} from "lucide-react";
import { formatInrCurrency, type FinancialAccountDto, type BeneficiaryDto } from "@/lib/financial-api";

export interface SavedBankContact {
  readonly id: string;
  readonly name: string;
  readonly category: "infrastructure" | "software" | "miscellaneous";
  readonly bankReference: string;
  readonly routingNumber: string;
  readonly isVerified: boolean;
  readonly crmProvider: "HubSpot" | "Salesforce" | "None";
  readonly crmContactId?: string;
  readonly status: "active" | "pending_review" | "blocked";
  readonly note: string;
}

const INITIAL_SAVED_CONTACTS: SavedBankContact[] = [
  {
    id: "cnt-aws-01",
    name: "AWS Cloud Services",
    category: "infrastructure",
    bankReference: "VPA-AWS-INDIA-991",
    routingNumber: "HDFC0001092",
    isVerified: true,
    crmProvider: "HubSpot",
    crmContactId: "HS-99412",
    status: "active",
    note: "Production cloud hosting, VPS compute, and S3 data retention.",
  },
  {
    id: "cnt-acme-02",
    name: "Acme Cloud Services",
    category: "software",
    bankReference: "BENE-ACME-001",
    routingNumber: "ICIC0000412",
    isVerified: true,
    crmProvider: "Salesforce",
    crmContactId: "SF-44021",
    status: "active",
    note: "Enterprise team SaaS subscriptions and API access.",
  },
  {
    id: "cnt-nova-03",
    name: "Nova Compute Systems",
    category: "infrastructure",
    bankReference: "BENE-NOVA-002",
    routingNumber: "SBIN0008419",
    isVerified: true,
    crmProvider: "HubSpot",
    crmContactId: "HS-77319",
    status: "active",
    note: "Dedicated GPU clusters, model training, and burst nodes.",
  },
  {
    id: "cnt-quantum-04",
    name: "Quantum Hosting Labs",
    category: "infrastructure",
    bankReference: "BENE-UNKN-003",
    routingNumber: "UTIB0002194",
    isVerified: false,
    crmProvider: "None",
    status: "pending_review",
    note: "Unverified contact without CRM sync. Payments trigger mandatory human review.",
  },
];

const CORPORATE_ACCOUNTS = [
  {
    id: "acc-neol-ops-01",
    name: "Primary Operations Account",
    bankName: "HDFC Commercial Bank",
    accountNumber: "•••• 8412",
    ifsc: "HDFC0001092",
    balance: "100000.00",
    currency: "INR",
    type: "Operating Liquidity",
    status: "Good Standing",
    description: "Primary working capital account used for governed vendor disbursements.",
  },
  {
    id: "acc-neol-treas-02",
    name: "Corporate Treasury Reserve",
    bankName: "State Bank Corporate",
    accountNumber: "•••• 3920",
    ifsc: "SBIN0000419",
    balance: "500000.00",
    currency: "INR",
    type: "Capital Escrow",
    status: "Restricted",
    description: "Cold treasury reserve. Direct AI agent disbursement strictly prohibited.",
  },
  {
    id: "acc-neol-pay-03",
    name: "Payroll & Tax Escrow",
    bankName: "Axis Corporate Banking",
    accountNumber: "•••• 7711",
    ifsc: "UTIB0002194",
    balance: "250000.00",
    currency: "INR",
    type: "Statutory Escrow",
    status: "Good Standing",
    description: "Dedicated account for payroll settlement and statutory obligations.",
  },
];

interface AccountsClientProps {
  readonly initialAccounts?: readonly FinancialAccountDto[];
  readonly initialBeneficiaries?: readonly BeneficiaryDto[];
}

export function AccountsClient({ initialAccounts }: AccountsClientProps) {
  const [contacts, setContacts] = useState<SavedBankContact[]>(INITIAL_SAVED_CONTACTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Contact Form State
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<"infrastructure" | "software" | "miscellaneous">("software");
  const [newBankRef, setNewBankRef] = useState("");
  const [newRouting, setNewRouting] = useState("");
  const [newCrm, setNewCrm] = useState<"HubSpot" | "Salesforce" | "None">("HubSpot");
  const [newVerified, setNewVerified] = useState(true);
  const [newNote, setNewNote] = useState("");

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.bankReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.note.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === "all" || c.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newBankRef.trim()) return;

    const newContact: SavedBankContact = {
      id: `cnt-${Date.now().toString(16)}`,
      name: newName.trim(),
      category: newCategory,
      bankReference: newBankRef.trim().toUpperCase(),
      routingNumber: newRouting.trim().toUpperCase() || "HDFC0001000",
      isVerified: newVerified,
      crmProvider: newCrm,
      crmContactId: newCrm !== "None" ? `${newCrm === "HubSpot" ? "HS" : "SF"}-${Math.floor(10000 + Math.random() * 90000)}` : undefined,
      status: newVerified ? "active" : "pending_review",
      note: newNote.trim() || "Saved enterprise bank contact.",
    };

    setContacts((prev) => [newContact, ...prev]);
    setIsAddModalOpen(false);
    setNewName("");
    setNewBankRef("");
    setNewRouting("");
    setNewNote("");
  };

  const verifiedCount = contacts.filter((c) => c.isVerified).length;
  const crmLinkedCount = contacts.filter((c) => c.crmProvider !== "None").length;

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-teal-800 mb-2">
            Enterprise Treasury Directory
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Corporate Accounts &amp; Saved Bank Contacts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            Authoritative operating accounts held by Neolith Finance and verified bank contacts linked
            with enterprise CRM systems. The Financial AI Agent can only disburse funds to saved contacts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ember-500 hover:bg-ember-600 text-white font-bold text-xs transition-all shadow-glow hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Save New Bank Contact</span>
          </button>
        </div>
      </div>

      {/* 2. Corporate Operating Accounts (Used by Company) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-ember-500" />
            <h2 className="text-base font-bold text-slate-900">Corporate Operating Accounts</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            3 Institutional Accounts · Zero Direct AI Access
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CORPORATE_ACCOUNTS.map((acc, index) => {
            const liveBal =
              index === 0 && initialAccounts && initialAccounts[0]
                ? initialAccounts[0].available_balance
                : acc.balance;

            return (
              <div
                key={acc.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                      {acc.type}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">{acc.name}</h3>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      acc.status === "Good Standing"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {acc.status}
                  </span>
                </div>

                <div className="my-3">
                  <span className="text-xs text-slate-600 block font-medium">Available Balance</span>
                  <p className="text-2xl font-black text-slate-900 font-mono tracking-tight mt-0.5">
                    {formatInrCurrency(liveBal, acc.currency)}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>Institution:</span>
                    <span className="font-semibold text-slate-700">{acc.bankName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Account Routing:</span>
                    <span className="font-mono font-medium text-slate-700">{acc.accountNumber} ({acc.ifsc})</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 mt-3 pt-2 border-t border-slate-100 leading-relaxed m-0">
                  {acc.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. CRM Integration & Article 14 Invariant Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                EU AI Act Article 14 Guardrail Active
              </span>
            </div>
            <h3 className="text-base font-bold text-white">
              Approved Beneficiary Whitelist &amp; CRM Synchronization
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed m-0">
              Transactions to contacts <strong className="text-white">not present in saved bank contacts or CRM</strong> are
              strictly intercepted and routed to the <strong className="text-amber-300">Human Approvals Queue</strong>. Users must
              explicitly register contacts or link their HubSpot / Salesforce directory before autonomous settlement is granted.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-800/80 border border-slate-700 px-3.5 py-2 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Verified Contacts</span>
              <span className="text-lg font-black text-emerald-400 font-mono">{verifiedCount} of {contacts.length}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 px-3.5 py-2 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">CRM Synced</span>
              <span className="text-lg font-black text-amber-400 font-mono">{crmLinkedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Saved Bank Contacts Directory */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-ember-500" />
            <h2 className="text-base font-bold text-slate-900">Saved Bank Contacts (Payee Directory)</h2>
          </div>

          {/* Filters & Search */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search contact or VPA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-ember-500 w-48 sm:w-60 shadow-sm"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-ember-500 shadow-sm font-medium text-slate-700"
            >
              <option value="all">All Categories</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="software">Software</option>
              <option value="miscellaneous">Miscellaneous</option>
            </select>
          </div>
        </div>

        {/* Contacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className={`bg-white border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md ${
                contact.isVerified ? "border-slate-200" : "border-amber-300 bg-amber-50/20"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{contact.name}</h3>
                    {contact.isVerified ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>VERIFIED BENEFICIARY</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-300">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>UNVERIFIED (REQUIRES REVIEW)</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 capitalize block mt-0.5">
                    Category: {contact.category}
                  </span>
                </div>

                {/* CRM Provider Badge */}
                {contact.crmProvider !== "None" ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                    {contact.crmProvider} CRM · {contact.crmContactId}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                    No CRM Link
                  </span>
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 my-3 text-xs space-y-1.5 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-sans">Bank Reference / UPI:</span>
                  <span className="font-bold text-slate-900">{contact.bankReference}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-sans">Bank Routing IFSC:</span>
                  <span className="text-slate-700">{contact.routingNumber}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed m-0">
                {contact.note}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Add Contact Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ember-600 block mb-1">
                Directory Registry
              </span>
              <h3 className="text-lg font-bold text-slate-900">Save New Bank Contact</h3>
              <p className="text-xs text-slate-500 mt-1">
                Register an approved payee so the Financial AI Agent can formulate valid proposals.
              </p>
            </div>

            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contact / Vendor Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Cloud, Cloudflare India, Stripe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-ember-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(
                        e.target.value as "infrastructure" | "software" | "miscellaneous"
                      )
                    }
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-ember-500"
                  >
                    <option value="infrastructure">Infrastructure</option>
                    <option value="software">Software</option>
                    <option value="miscellaneous">Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CRM Sync</label>
                  <select
                    value={newCrm}
                    onChange={(e) =>
                      setNewCrm(e.target.value as "HubSpot" | "Salesforce" | "None")
                    }
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-ember-500"
                  >
                    <option value="HubSpot">HubSpot CRM</option>
                    <option value="Salesforce">Salesforce CRM</option>
                    <option value="None">None (Manual)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bank Reference / VPA *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VPA-AWS-INDIA-991"
                    value={newBankRef}
                    onChange={(e) => setNewBankRef(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-ember-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bank IFSC / Routing</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC0001092"
                    value={newRouting}
                    onChange={(e) => setNewRouting(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-ember-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Note / Procurement Justification</label>
                <input
                  type="text"
                  placeholder="e.g. VPS Cloud instances and storage buckets"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-ember-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="verify-check"
                  checked={newVerified}
                  onChange={(e) => setNewVerified(e.target.checked)}
                  className="rounded text-ember-500 focus:ring-ember-500"
                />
                <label htmlFor="verify-check" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Mark as Verified Beneficiary (bypass human review for payments under threshold)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-ember-500 hover:bg-ember-600 text-white shadow-glow"
                >
                  Save to Directory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

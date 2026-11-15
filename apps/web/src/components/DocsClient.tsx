"use client";

import { useMemo, useState } from "react";
import { MermaidViewer } from "@/components/MermaidViewer";

interface DocSection {
  id: string;
  title: string;
  category: string;
  summary: string;
  mermaidChart: string;
  content: string;
}

const DOC_SECTIONS: DocSection[] = [
  {
    id: "system-architecture",
    title: "System High-Level Architecture",
    category: "Architecture",
    summary:
      "Core separation of reasoning, governance, and execution across the 3 system tiers.",
    mermaidChart: `
flowchart TD
    Client["Client Interfaces (Web / WhatsApp / Voice)"] --> Gateway["Runtime Gateway & Interaction Core"]
    Gateway --> Agent["Financial AI Agent (Reasoning & Planning)"]
    Agent --> Proposal["Action Proposal (Zero Implicit Authority)"]
    Proposal --> Gov["Authoritative Governance Runtime (OPA Rego)"]
    Gov --> DB[("Postgres Database & Audit Log")]
    Gov --> Dec{"Authoritative Decision"}
    Dec -->|ALLOW| Permit["60s Single-Use Execution Permit (F09)"]
    Dec -->|REVIEW| ApprovalQueue["Human Checkpoints Queue (/approvals F08)"]
    Dec -->|DENY| DenyLog["Logged Policy Rejection"]
    ApprovalQueue -->|Approve| Permit
    ApprovalQueue -->|Reject| RejectReceipt["Logged Rejection Receipt"]
    Permit --> Bank["Protected Banking Settlement (F10)"]
    Bank --> ReceiptsChain["Tamper-Evident Receipts Hash Chain (F13)"]

    classDef comp fill:#f8fafc,stroke:#0b1f33,stroke-width:1.5px;
    class Client,Gateway,Agent,Proposal,Gov,DB,Permit,ApprovalQueue,Bank,ReceiptsChain comp;
`,
    content: `
### Three-Layer Architecture
Neolith implements a strict three-layer architecture:
1. **AI Agent Layer (Reasoning & Planning)**: Synthesizes operator goals, evaluates invoices, reads vendor profiles, and formulates structured financial proposals. The agent holds zero payment credentials and cannot directly execute any financial transaction.
2. **Governance & Execution Control Layer (The Gateway)**: An authoritative policy gatekeeper powered by Open Policy Agent (OPA). Evaluates cryptographically verified agent manifests, capability bindings, category budget limits, and risk thresholds.
3. **Enterprise Services & Audit Layer (Operational Decision Engine)**: Evaluates and immutably records Execution Requests, Human Approvals, Execution Permits, and Decision Receipts in PostgreSQL, ensuring complete cryptographic traceability.
`,
  },
  {
    id: "governance-sequence",
    title: "Governance Decision & Settlement Sequence",
    category: "Runtime",
    summary:
      "End-to-end evaluation flow from agent proposal submission to permit-authorized banking settlement.",
    mermaidChart: `
sequenceDiagram
    autonumber
    actor Operator as Operator / Client
    participant Agent as Financial AI Agent
    participant Gov as Governance Runtime
    participant OPA as OPA Policy Engine
    participant DB as Postgres Ledger
    participant Bank as Banking Settlement

    Operator->>Agent: Request: Pay invoice INV-001
    Agent->>Agent: Inspect context & create proposal
    Agent->>Gov: POST /actions/evaluate (Action Proposal)
    Gov->>DB: Verify Agent manifest & Tool capability
    Gov->>DB: Check Category budget & balance
    Gov->>OPA: Query policy decision with input JSON
    OPA-->>Gov: Result: ALLOW / REVIEW / DENY + Reason Codes
    Gov->>DB: Persist ExecutionRequest & GovernanceDecision
    alt Decision == ALLOW
        Gov->>DB: Issue 60s Single-Use ExecutionPermit (F09)
        Gov->>Bank: Settle payment & debit balance (F10)
        Bank->>DB: Append DecisionReceipt with SHA-256 hash (F13)
        Gov-->>Agent: Decision: ALLOW (Permit Settled)
    else Decision == REVIEW
        Gov->>DB: Enqueue in Human Approvals (/approvals F08)
        Gov-->>Agent: Decision: REVIEW (Approval Queued)
    else Decision == DENY
        Gov-->>Agent: Decision: DENY (Policy Violation Logged)
    end
    Agent-->>Operator: Response with GovernanceSummary
`,
    content: `
### Decision Sequence Specifications
When an action proposal is submitted to \`POST /api/v1/actions/evaluate\`:
1. **Request Ingestion**: Derives canonical hashes of action parameters and operational context.
2. **Hard Invariant Verification**: Checks emergency kill-switch status, agent registration, version digest, and capability bindings.
3. **Authoritative Ledger Lookups**: Computes current spent balance against category budget ceilings.
4. **Beneficiary Verification**: Asserts that vendor records are flagged as verified in the database.
5. **OPA Policy Evaluation**: Evaluates compiled Rego rules matching the active Governance Profile.
6. **Permit Issuance & Settlement**: If allowed, immediately issues a 60-second single-use Execution Permit, executes atomic balance debiting, and appends a cryptographic receipt to the chain.
`,
  },
  {
    id: "policy-profiles",
    title: "Policy Profile Model & Thresholds",
    category: "Governance",
    summary:
      "Object model and threshold rules for Strict, Balanced, High Autonomy, and Custom profiles.",
    mermaidChart: `
classDiagram
    class GovernanceProfile {
        +UUID id
        +String name
        +GovernanceStyle style
        +String version
        +Boolean is_active
        +JSON configuration
    }
    class StrictControl {
        +protected_writes_review: true
        +allow_unregistered: false
    }
    class BalancedControl {
        +approval_threshold: CategoryThreshold
        +risk_tier_review: [R3, R4]
    }
    class HighAutonomy {
        +auto_allow: [R1, R2, R3]
        +critical_review: [R4]
    }
    class CustomControl {
        +Decimal max_action_amount
        +Decimal review_threshold
        +List review_operations
    }
    GovernanceProfile <|-- StrictControl
    GovernanceProfile <|-- BalancedControl
    GovernanceProfile <|-- HighAutonomy
    GovernanceProfile <|-- CustomControl
`,
    content: `
### Profile Behaviors
- **Strict Control (\`strict\`)**: All protected financial write operations mandate human operator review (\`STRICT_CONTROL_REVIEW_REQUIRED\`). Zero autonomous financial execution.
- **Balanced Control (\`balanced\`)**: Standard enterprise baseline. Auto-allows routine operations within budget and threshold; flags high-risk tiers (R3, R4) or threshold breaches for operator review.
- **High Autonomy (\`high_autonomy\`)**: Automates routine R1–R3 actions within approved budget limits; mandates operator review strictly for critical R4 operations.
- **Custom Control (\`custom\`)**: Configurable thresholds including maximum action amount (\`MAX_AMOUNT_EXCEEDED\`), operator review threshold (\`CUSTOM_THRESHOLD_REACHED\`), and specific operation review lists.
`,
  },
  {
    id: "governance-boundary",
    title: "Agent-to-Governance Security Boundary",
    category: "Security",
    summary:
      "Visual boundary delineating AI reasoning space from authoritative decision space.",
    mermaidChart: `
flowchart LR
    subgraph AgentSpace["AI Reasoning Space (Unprivileged)"]
        A1["1. Understand User Request"] --> A2["2. Analyse Invoices & Context"]
        A2 --> A3["3. Prepare FinancialActionProposal"]
    end

    subgraph Boundary["GOVERNANCE BOUNDARY (Authoritative)"]
        A3 ==> G1["4. Authenticate Identity & Manifest"]
        G1 --> G2["5. Check Capability Permissions"]
        G2 --> G3["6. Evaluate Policy Invariants"]
        G3 --> G4["7. Verify Budget Feasibility & Threshold"]
    end

    subgraph DecisionSpace["Decision Space"]
        G4 --> D1{"Outcome"}
        D1 -->|ALLOW| E1["Action Permitted & Issued 60s Permit"]
        D1 -->|REVIEW| E2["Require Human Operator Approval (/approvals)"]
        D1 -->|DENY| E3["Hard Rejection with Reason Codes"]
    end

    style Boundary fill:#fff7ed,stroke:#f97316,stroke-width:2px;
`,
    content: `
### The Governance Boundary Principle
The boundary between the agent and governance is an untrusted security perimeter:
- The agent cannot grant itself permissions or elevate privileges.
- The agent cannot modify category budgets or reset spending limits.
- The agent cannot forge or self-sign execution permits.
- All evaluation inputs are authenticated against authoritative database tables and compiled OPA policies.
`,
  },
  {
    id: "f15-assurance-lab",
    title: "F15 Security & Policy Assurance Lab",
    category: "Assurance",
    summary:
      "Automated evaluation service verifying 7 safety invariants including prompt injection defense and budget concurrency.",
    mermaidChart: `
flowchart TD
    Suite["F15 Assurance Lab Runner (/evaluation/runs)"] --> S1["001: Verified Invoice within Budget -> ALLOW"]
    Suite --> S2["002: Over-Budget & Unverified -> DENY (Dual Reasons)"]
    Suite --> S3["003: Prompt Injection Text -> DENY (No Authority Expansion)"]
    Suite --> S4["004: Replay Used Permit -> DENY (PERMIT_REPLAY)"]
    Suite --> S5["005: Mutated Parameters -> DENY (PARAMETER_HASH_MISMATCH)"]
    Suite --> S6["006: Concurrent Spend -> Joint Limit Cap (BUDGET_EXCEEDED)"]
    Suite --> S7["007: Emergency Kill-Switch -> Invalidate Permits (EPOCH_MISMATCH)"]

    classDef passed fill:#ecfdf5,stroke:#059669,stroke-width:1.5px;
    class S1,S2,S3,S4,S5,S6,S7 passed;
`,
    content: `
### The 7 Canonical Assurance Scenarios
The F15 Assurance Lab runs repeatable, deterministic test scenarios against the live Governance Runtime:
1. **001 Procurement Happy Path**: Verified invoice under category budget evaluates to ALLOW with reason code \`BASE_POLICY_ALLOW\`.
2. **002 Over-Budget & Unverified**: High-value invoice to unverified beneficiary evaluates to DENY with dual reason codes \`BUDGET_EXCEEDED\` and \`UNVERIFIED_BENEFICIARY\`.
3. **003 Prompt Injection Resistance**: Malicious prompt injection payload hidden inside invoice description cannot redefine payment authority or trigger unauthorized transfers.
4. **004 Single-Use Permit Replay**: Consuming an execution permit a second time is rejected with \`PERMIT_REPLAY\`.
5. **005 Parameter Anti-Tampering**: Modifying payment amounts or beneficiary IDs after permit issuance triggers immediate rejection with \`PARAMETER_HASH_MISMATCH\`.
6. **006 Budget Concurrency**: Multiple actions evaluated in parallel cannot jointly breach the category spend ceiling.
7. **007 Emergency Stop Invalidation**: Outstanding permits minted prior to a cluster emergency stop fail consumption with \`REVOCATION_EPOCH_MISMATCH\`.
`,
  },
  {
    id: "system-control-killswitch",
    title: "Cluster Kill-Switch & Revocation Epoch Control",
    category: "Security",
    summary:
      "Cluster-wide emergency stop and agent quarantine invalidating outstanding permits via monotonic revocation epochs.",
    mermaidChart: `
stateDiagram-v2
    [*] --> NormalOperations : Cluster Initialized (Epoch 0)
    NormalOperations --> EmergencyStop : POST /api/v1/system/emergency-stop
    note right of EmergencyStop
      - Increments revocation_epoch
      - All outstanding permits revoked
      - OPA denies with EMERGENCY_STOP_ACTIVE
      - Emits Audit Decision Receipt
    end note
    EmergencyStop --> NormalOperations : POST /api/v1/system/restore
    note left of NormalOperations
      - System restored to normal
      - Revocation epoch preserved
      - Emits Restoration Audit Receipt
    end note
`,
    content: `
### Cluster Emergency Control (F09, F13, UC8)
- **Monotonic Revocation Epoch**: Every emergency stop increments the cluster \`revocation_epoch\`. Permits minted under previous epochs fail consumption with \`REVOCATION_EPOCH_MISMATCH\`.
- **Immediate Action Halt**: While \`emergency_stop_active\` is true, OPA policies and Runtime Gateway checks reject all mutating financial operations with \`EMERGENCY_STOP_ACTIVE\`.
- **Agent Quarantine**: Operators can selectively quarantine rogue or misbehaving agents at \`POST /api/v1/agents/{id}/quarantine\`. Quarantined agents immediately receive \`AGENT_INACTIVE\` rejections without affecting the rest of the cluster.
`,
  },
  {
    id: "receipts-hash-chain",
    title: "Tamper-Evident Receipts Hash Chain",
    category: "Security",
    summary:
      "Cryptographic append-only ledger linking every decision, permit, and settlement with parent hash verification.",
    mermaidChart: `
flowchart LR
    R0["Receipt 0 (Genesis)\nHash: 0000..."] --> R1["Receipt 1 (Action)\nParent: 0000...\nPayload Hash: H1\nReceipt Hash: H(0, P0, H1)"]
    R1 --> R2["Receipt 2 (Permit)\nParent: R1 Hash\nPayload Hash: H2\nReceipt Hash: H(1, R1, H2)"]
    R2 --> R3["Receipt 3 (Settlement)\nParent: R2 Hash\nPayload Hash: H3\nReceipt Hash: H(2, R2, H3)"]

    classDef block fill:#f8fafc,stroke:#0f766e,stroke-width:1.5px;
    class R0,R1,R2,R3 block;
`,
    content: `
### Cryptographic Receipts Specification (F13)
Every governance decision, human approval, permit issuance, and banking settlement is permanently recorded in \`decision_receipts\`:
1. **Hash Formula**: \`receipt_hash = sha256:{chain_index}:{previous_receipt_hash}:{payload_hash}:{event_type}\`.
2. **Whole-Chain Verification**: The endpoint \`GET /api/v1/receipts/verify\` traverses the entire chain from genesis to head, recalculating hashes to prove zero tampering.
3. **Interactive Visual Explorer**: Operators can inspect individual receipt payloads, parent hashes, and cryptographic signatures at \`/receipts/[id]\`.
`,
  },
  {
    id: "data-model",
    title: "Financial Reference Application Data Model",
    category: "Data",
    summary:
      "Entity relationship model representing accounts, invoices, beneficiaries, budgets, permits, and receipts.",
    mermaidChart: `
erDiagram
    FinancialAccount ||--o{ FinancialTransaction : contains
    Invoice ||--o{ FinancialTransaction : triggers
    Beneficiary ||--o{ Invoice : bills
    Beneficiary ||--o{ FinancialTransaction : receives
    Budget ||--o{ FinancialTransaction : caps
    ExecutionRequest ||--|| GovernanceDecision : evaluates
    GovernanceDecision ||--o| Approval : requires
    GovernanceDecision ||--o| ExecutionPermit : issues
    ExecutionPermit ||--o| FinancialTransaction : settles
    GovernanceDecision ||--o{ DecisionReceipt : audits

    FinancialAccount {
        UUID id PK
        string name
        decimal available_balance
        string currency
    }
    Invoice {
        UUID id PK
        string invoice_number
        decimal amount
        string category
        boolean is_verified_vendor
    }
    ExecutionPermit {
        UUID id PK
        UUID action_id
        string parameter_hash
        timestamp expires_at
        integer revocation_epoch
    }
    DecisionReceipt {
        UUID id PK
        integer chain_index
        string previous_receipt_hash
        string receipt_hash
    }
`,
    content: `
### Entity Integrity
- **FinancialAccount**: Operating treasury account tracking available balance.
- **Invoice**: Vendor invoices with verification flags, categories, and due dates.
- **Beneficiary**: Synthetic vendor records holding verification status.
- **Budget**: Monthly category spending limits and operator review thresholds.
- **ExecutionPermit**: Short-lived, single-use permit token with canonical parameter hash and epoch tracking.
- **DecisionReceipt**: Tamper-evident hash-linked ledger records.
`,
  },
  {
    id: "cross-channel",
    title: "Cross-Channel Interaction Architecture",
    category: "Architecture",
    summary:
      "Transport-neutral core routing web, WhatsApp, and voice turns into unified governance.",
    mermaidChart: `
flowchart TD
    WebUser["Web Operator (Next.js)"] -->|POST /interactions/message| Core["Interaction Core Service"]
    WhatsAppUser["WhatsApp User (Twilio)"] -->|POST /integrations/twilio/whatsapp/webhook| Core
    VoiceUser["Voice Caller (ElevenLabs)"] -->|POST /integrations/elevenlabs/.../chat/completions| Core

    Core --> Normalise["Canonical InteractionTurn (UUID, Text, Trace)"]
    Normalise --> AgentClient["Agent Worker Client"]
    AgentClient --> LangGraph["Financial AI Agent (LangGraph)"]
    LangGraph --> Proposal["Proposed Action Proposal"]
    Proposal --> GovService["GovernanceRuntimeService.evaluate_action()"]
    GovService --> GovSummary["GovernanceSummary (Outcome, Reasons, Risk Tier)"]
    GovSummary --> OutboundTurn["InterfaceResponse (Message + Proposal + Governance)"]
    OutboundTurn --> AdaptReply["Channel-Specific Formatter (JSON / TwiML / OpenAI SSE)"]

    classDef node fill:#f8fafc,stroke:#0b1f33,stroke-width:1.5px;
    class WebUser,WhatsAppUser,VoiceUser,Core,Normalise,AgentClient,LangGraph,Proposal,GovService,GovSummary,OutboundTurn,AdaptReply node;
`,
    content: `
### Channel Parity Principle
Regardless of whether an operator sends a prompt from the Next.js Web workspace, sends a WhatsApp message via Twilio, or speaks over the phone via ElevenLabs Custom LLM, the exact same \`InteractionTurn\` is created, the same LangGraph agent runs, and the exact same OPA governance evaluation is executed.
`,
  },
  {
    id: "reason-codes",
    title: "Reason Code Glossary & Outcome Reference",
    category: "Governance",
    summary:
      "Complete dictionary of structured reason codes emitted by package neolith.decision and the Runtime Gateway.",
    mermaidChart: `
flowchart LR
    Outcome{"Governance Outcome"}
    Outcome -->|ALLOW| RC1["BASE_POLICY_ALLOW\nROUTINE_PAYMENT_PERMITTED"]
    Outcome -->|REVIEW| RC2["APPROVAL_REQUIRED\nAPPROVAL_THRESHOLD_REACHED\nSTRICT_CONTROL_REVIEW_REQUIRED\nHIGH_RISK_TIER_REVIEW"]
    Outcome -->|DENY| RC3["BUDGET_EXCEEDED\nUNVERIFIED_BENEFICIARY\nAGENT_INACTIVE\nEMERGENCY_STOP_ACTIVE\nPERMIT_REPLAY\nPARAMETER_HASH_MISMATCH"]

    classDef allow fill:#ecfdf5,stroke:#059669,stroke-width:1.5px;
    classDef review fill:#fffbeb,stroke:#d97706,stroke-width:1.5px;
    classDef deny fill:#fef2f2,stroke:#dc2626,stroke-width:1.5px;
    class RC1 allow;
    class RC2 review;
    class RC3 deny;
`,
    content: `
### Structured Reason Codes Glossary
Every decision emitted by Neolith attaches one or more deterministic reason codes:
- **\`BASE_POLICY_ALLOW\`**: Action satisfies all policy invariants and falls within category budget and threshold limits.
- **\`APPROVAL_REQUIRED\` / \`APPROVAL_THRESHOLD_REACHED\`**: Action is valid but exceeds the category review threshold; enqueued in \`/approvals\`.
- **\`STRICT_CONTROL_REVIEW_REQUIRED\`**: Triggered when the Strict Control profile is active, mandating operator review for all write tools.
- **\`BUDGET_EXCEEDED\`**: Proposed payment amount exceeds the remaining category spend ceiling.
- **\`UNVERIFIED_BENEFICIARY\`**: Target vendor is not listed in the verified vendor directory.
- **\`AGENT_INACTIVE\`**: The calling agent identity has been quarantined or is not marked active.
- **\`EMERGENCY_STOP_ACTIVE\`**: Cluster kill-switch is engaged; all mutating actions are prohibited.
- **\`PERMIT_REPLAY\`**: Attempted duplicate consumption of a single-use execution permit.
- **\`PERMIT_EXPIRED\`**: Permit exceeded its 60-second time-to-live window.
- **\`PARAMETER_HASH_MISMATCH\`**: Action parameters were mutated between permit issuance and settlement.
- **\`REVOCATION_EPOCH_MISMATCH\`**: Permit was minted under a previous revocation epoch.
`,
  },
];

export function DocsClient() {
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    DOC_SECTIONS[0]?.id || ""
  );
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return DOC_SECTIONS;
    const q = searchQuery.toLowerCase();
    return DOC_SECTIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const activeSection =
    DOC_SECTIONS.find((s) => s.id === selectedSectionId) || DOC_SECTIONS[0];

  return (
    <div className="space-y-6">
      {/* Docs Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-teal-800 mb-2">
          Knowledge Base • Architecture & Specifications
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Neolith Documentation Hub
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Interactive architecture diagrams, pan/zoom visualizers, protocol sequences, and data models.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Navigation Sidebar */}
        <aside className="w-full lg:w-72 shrink-0 space-y-4">
          <div>
            <label htmlFor="docs-search-input" className="sr-only">
              Search documentation
            </label>
            <input
              id="docs-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search architecture..."
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none"
            />
          </div>

          <nav className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm space-y-1">
            {filteredSections.map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => setSelectedSectionId(sec.id)}
                className={`w-full text-left rounded-lg px-3 py-2 text-xs transition-colors ${
                  activeSection?.id === sec.id
                    ? "bg-teal-50 font-bold text-teal-800 border-l-2 border-teal-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  {sec.category}
                </div>
                <div className="truncate font-semibold">{sec.title}</div>
              </button>
            ))}
            {filteredSections.length === 0 && (
              <p className="p-3 text-xs text-slate-400 text-center">
                No matching sections found.
              </p>
            )}
          </nav>
        </aside>

        {/* Right Content & Diagram Viewer */}
        <div className="flex-1 min-w-0 space-y-6">
          {activeSection && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                  {activeSection.category}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  {activeSection.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  {activeSection.summary}
                </p>
              </div>

              {/* Interactive Mermaid Diagram Viewer */}
              <MermaidViewer
                chart={activeSection.mermaidChart}
                title={activeSection.title}
              />

              {/* Explanatory Content */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <div className="prose prose-sm max-w-none text-slate-700">
                  {activeSection.content
                    .trim()
                    .split("\n\n")
                    .map((paragraph, index) => {
                      if (paragraph.startsWith("### ")) {
                        return (
                          <h3
                            key={index}
                            className="text-sm font-bold text-slate-900 mt-4 mb-2"
                          >
                            {paragraph.replace("### ", "")}
                          </h3>
                        );
                      }
                      if (paragraph.startsWith("1. ") || paragraph.startsWith("- ")) {
                        const items = paragraph.split("\n");
                        return (
                          <ul
                            key={index}
                            className="list-inside list-disc space-y-1.5 my-2"
                          >
                            {items.map((item, idx) => (
                              <li key={idx}>
                                {item.replace(/^(\d+\.\s*|-\s*)/, "")}
                              </li>
                            ))}
                          </ul>
                        );
                      }
                      return (
                        <p key={index} className="my-2">
                          {paragraph}
                        </p>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

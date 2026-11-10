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
    Agent --> Proposal["Action Proposal (Zero Authority)"]
    Proposal --> Gov["Authoritative Governance Runtime (OPA Rego)"]
    Gov --> DB[("Postgres Database & Audit Log")]
    Gov --> Dec["Authoritative Decision (Allow / Review / Deny)"]
    Dec -.-> NextPhase["Target Execution Phase (Stage 4 Signed Settlement)"]

    classDef comp fill:#f8fafc,stroke:#0b1f33,stroke-width:1.5px;
    class Client,Gateway,Agent,Proposal,Gov,DB,Dec,NextPhase comp;
`,
    content: `
### Three-Layer Architecture
Neolith implements a strict three-layer architecture:
1. **AI Agent Layer (Reasoning & Planning)**: Synthesizes operator goals, evaluates invoices, reads vendor profiles, and formulates structured financial proposals. The agent holds zero payment credentials and cannot directly execute any financial transaction.
2. **Governance & Execution Control Layer (The Gateway)**: An authoritative policy gatekeeper powered by Open Policy Agent (OPA). Evaluates cryptographically verified agent manifests, capability bindings, category budget limits, and risk thresholds.
3. **Enterprise Services & Audit Layer (Operational Decision Engine)**: Evaluates and immutably records Execution Requests and Governance Decisions in PostgreSQL, emitting comprehensive trace audit receipts.
`,
  },
  {
    id: "governance-sequence",
    title: "Governance Decision Runtime Sequence",
    category: "Runtime",
    summary:
      "End-to-end evaluation flow from agent proposal submission to authoritative outcome.",
    mermaidChart: `
sequenceDiagram
    autonumber
    actor Operator as Operator / Client
    participant Agent as Financial AI Agent
    participant Gov as Governance Runtime
    participant OPA as OPA Policy Engine
    participant DB as Postgres Ledger

    Operator->>Agent: Request: Pay invoice INV-001
    Agent->>Agent: Inspect context & create proposal
    Agent->>Gov: POST /actions/evaluate (Action Proposal)
    Gov->>DB: Verify Agent manifest & Tool capability
    Gov->>DB: Check Category budget & balance
    Gov->>OPA: Query policy decision with input JSON
    OPA-->>Gov: Result: ALLOW / REVIEW / DENY + Reason Codes
    Gov->>DB: Persist ExecutionRequest & GovernanceDecision
    Gov-->>Agent: Decision: ALLOW (BASE_POLICY_ALLOW)
    Agent-->>Operator: Response with GovernanceSummary
    Note over Gov,DB: Current runtime authoritatively gates and audits every proposal.<br/>Target Stage 4 extends Allow decisions to Ed25519 Permit settlement.
`,
    content: `
### Decision Sequence Specifications
When an action proposal is submitted to \`POST /api/v1/actions/evaluate\`:
1. **Request Ingestion**: Derives canonical hashes of action parameters and operational context.
2. **Hard Invariant Verification**: Checks emergency kill-switch, agent registration, version digest, and capability bindings.
3. **Authoritative Ledger Lookups**: Computes current spent balance against category budget ceilings.
4. **Beneficiary Verification**: Asserts that vendor records are flagged as verified.
5. **OPA Policy Evaluation**: Evaluates compiled Rego rules matching the active Governance Profile.
6. **Persistence & Auditing**: Writes an immutable \`ExecutionRequestModel\` and \`GovernanceDecisionModel\` before returning the structured outcome.
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
    title: "Agent-to-Governance Boundary Flow",
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
        D1 -->|ALLOW| E1["Action Permitted under Policy"]
        D1 -->|REVIEW| E2["Require Human Operator Approval"]
        D1 -->|DENY| E3["Hard Rejection with Reason Codes"]
    end

    style Boundary fill:#fff7ed,stroke:#f97316,stroke-width:2px;
`,
    content: `
### The Governance Boundary Principle
The boundary between the agent and governance is an untrusted security perimeter. The agent cannot grant itself permissions, modify budgets, or sign execution permits. All evaluation inputs are authenticated against authoritative ledger tables and compiled OPA policies.
`,
  },
  {
    id: "data-model",
    title: "Financial Reference Application Data Model",
    category: "Data",
    summary:
      "Entity relationship model representing accounts, invoices, beneficiaries, budgets, and decisions.",
    mermaidChart: `
erDiagram
    FinancialAccount ||--o{ FinancialTransaction : contains
    Invoice ||--o{ FinancialTransaction : triggers
    Beneficiary ||--o{ Invoice : bills
    Beneficiary ||--o{ FinancialTransaction : receives
    Budget ||--o{ FinancialTransaction : caps
    ExecutionRequest ||--|| GovernanceDecision : evaluates
    GovernanceProfile ||--o{ GovernanceDecision : configures

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
    Beneficiary {
        UUID id PK
        string name
        boolean verified
    }
    Budget {
        UUID id PK
        string category
        decimal limit_amount
        decimal approval_threshold
    }
`,
    content: `
### Entity Integrity
- **FinancialAccount**: Operating treasury account tracking available balance.
- **Invoice**: Vendor invoices with verification flags, categories, and due dates.
- **Beneficiary**: Synthetic vendor records holding verification status.
- **Budget**: Monthly category spending limits and operator review thresholds.
- **ExecutionRequest & GovernanceDecision**: 1:1 correlated audit records recording input hashes, reason codes, and policy digests.
`,
  },
  {
    id: "adoption-workflow",
    title: "Organisation Adoption Workflow",
    category: "Operations",
    summary:
      "Step-by-step phased adoption journey for enterprise rollout.",
    mermaidChart: `
flowchart TD
    Step1["Step 1: Discovery & Threat Modeling"] --> Step2["Step 2: Entity & Security Scoping"]
    Step2 --> Step3["Step 3: Tool & Permission Registry"]
    Step3 --> Step4["Step 4: Budget & Threshold Allocation"]
    Step4 --> Step5["Step 5: Policy-as-Code Formulation (OPA)"]
    Step5 --> Step6["Step 6: Multi-Channel Gateway Setup"]
    Step6 --> Step7["Step 7: Operator Approval Integration"]
    Step7 --> Step8["Step 8: Audit & Decision Receipts"]
    Step8 --> Step9["Step 9: Adversarial Test Verification"]
    Step9 --> Step10["Step 10: Production Go-Live"]

    classDef stage fill:#f8fafc,stroke:#0f766e,stroke-width:1.5px;
    class Step1,Step2,Step3,Step4,Step5,Step6,Step7,Step8,Step9,Step10 stage;
`,
    content: `
### Production Readiness
Adopting Neolith follows a disciplined 10-phase journey ensuring that zero ambient authority exists in production. Every tool invocation is governed by typed schemas and deterministic OPA invariants before deployment.
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

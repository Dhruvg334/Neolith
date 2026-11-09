# System Design Document

## 1. Design goal

Design a system in which AI can perform useful enterprise reasoning without being the authority that directly executes sensitive actions.

Neolith is domain-independent. The primary reference application is a synthetic Financial AI Agent operating against a controlled financial sandbox.

## 2. User interaction surfaces

Users may interact with the same Financial AI Agent through:

- the Neolith website;
- WhatsApp through Twilio;
- an ElevenLabs voice agent using Neolith as a custom LLM backend.

All interfaces normalise into the same interaction contract and task/agent workflow. An interface adapter does not create a separate agent or alternate governance path.

## 3. Architecture

### Interaction Layer

Responsible for:

- web task/message intake;
- Twilio webhook verification and normalisation;
- ElevenLabs custom-LLM request adaptation;
- channel-session correlation;
- transport-specific response delivery.

### AI Agent Layer

Responsible for:

- language understanding;
- financial-context retrieval;
- clarification;
- planning;
- recommendation;
- structured `FinancialActionProposal` creation.

### Governance and Execution Control Layer

Responsible for:

- runtime request validation;
- identity;
- permissions;
- organisational policy;
- budget/quota;
- risk;
- human approval;
- execution permit;
- audit evidence;
- revocation.

### Enterprise Services Layer

Responsible for business side effects.

The initial protected service is a synthetic financial sandbox containing accounts, invoices, beneficiaries, budgets and transactions.

## 4. Major design choices

- modular FastAPI backend;
- separate LangGraph agent worker;
- one channel-agnostic Interaction Core;
- PostgreSQL authoritative state;
- Redis transactional coordination;
- OPA/Rego deterministic policy;
- signed short-lived execution permit;
- protected MCP/REST adapters;
- Twilio WhatsApp as a signed/idempotent external ingress;
- ElevenLabs Voice as an OpenAI-compatible custom-LLM client of Neolith;
- OpenTelemetry observability;
- deterministic synthetic financial data for repeatable demos and tests.

## 5. Data flow

```text
Web / WhatsApp / Voice
→ Channel Adapter
→ InteractionTurn
→ Financial AI Agent
→ Financial context retrieval
→ FinancialActionProposal
→ Runtime Gateway
→ Identity
→ Permission
→ Policy
→ Risk
→ Budget reservation
→ Approval if needed
→ Execution Permit
→ Protected Financial Sandbox
→ Result
→ Decision Receipt
```

## 6. Security boundary

The model and interface providers never receive a credential that can directly invoke a protected financial side effect.

A WhatsApp sender ID or ElevenLabs integration token proves an interface-level fact only. It does not itself grant `finance.invoice.pay`, `finance.funds.transfer` or any other protected capability.

## 7. Extensibility

New user interfaces add channel adapters.

New enterprise workflows add:

- tools/service adapters;
- action schemas;
- permissions;
- policy rules;
- risk metadata;
- evaluation scenarios.

The Financial AI Agent is a reference application, not a restriction on the Neolith platform.

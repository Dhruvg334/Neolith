# F16 — Financial Reference Application

> The filename is retained for repository continuity. The implemented primary reference application is now the Financial AI Agent and synthetic Neolith Finance financial sandbox.

## Purpose

Provide one complete, high-consequence reference application that demonstrates the difference between AI reasoning and governed execution.

Neolith itself remains domain-independent.

## Synthetic domain

The reference application contains:

- Operations Account;
- vendor invoices;
- beneficiaries;
- category budgets;
- financial transactions;
- read-only planning tools;
- protected write tools.

## Financial AI Agent role

The agent may:

- understand a financial request;
- inspect account, invoice, beneficiary and budget state;
- ask clarification;
- plan;
- propose a structured financial action.

The agent may not:

- grant permissions;
- override policy;
- reserve additional authority;
- approve itself;
- mint a permit;
- call a protected write directly.

## Primary reference cases

### Normal action — INV-001

```text
Acme Cloud
INR 8,000.00
software
verified vendor
```

Target mature-system outcome: `ALLOW` and governed execution.

### Human review — INV-002

```text
Nova Compute
INR 35,000.00
infrastructure
verified vendor
```

Target mature-system outcome: `REVIEW` because it exceeds the configured approval threshold while remaining within category budget.

### Hard deny — INV-003

```text
Unknown Supplies
INR 75,000.00
miscellaneous
unverified vendor
```

Target mature-system outcome: `DENY` because the vendor is unverified and the action exceeds the miscellaneous category budget.

## Interfaces

The same Financial AI Agent will be reachable through:

- Web;
- WhatsApp via Twilio;
- Voice via ElevenLabs.

The interface does not alter governance behaviour.

## Security demonstrations

Later phases demonstrate:

- hostile invoice/prompt content;
- parameter mutation;
- permit replay;
- concurrent budget overspend;
- unverified beneficiary;
- quarantine/emergency stop;
- policy-engine failure.

## Acceptance

The final reference application is acceptable when:

1. all three interfaces can invoke the same Financial AI Agent;
2. proposals are typed and evidence-linked;
3. protected financial writes are impossible before governance approval;
4. normal, review and deny paths are reproducible;
5. replay/mutation/budget-race tests fail safely;
6. every mature protected action is traceable through Decision Receipts.

# F13 — Audit, Decision Receipts and Incident History

## Purpose

Make every protected decision reconstructable without hidden model reasoning.

## Evidence captured

- requester identity;
- task;
- agent/version;
- tool/version;
- exact action hash;
- permission result;
- policy decision and version;
- budget/quota result;
- risk signals;
- approval;
- permit;
- execution result;
- timestamps;
- trace ID.

## Decision Receipt

Append-only evidence record.

Receipt events:

- action_received;
- decision;
- approval;
- permit_issued;
- permit_rejected;
- execution;
- reconciliation;
- revocation;
- correction.

## Integrity

Receipts are hash-linked per project/tenant chain.

Modification should be detectable.

## Incident timeline

Incidents store:

- severity;
- affected agent/action;
- financial/resource exposure;
- containment;
- revocations;
- investigation;
- recovery.

## Explanations

Audience-specific:

- user: plain language;
- developer: technical reason codes;
- auditor: evidence and versions;
- operator: complete control context.

## Acceptance

- denied action has receipt;
- modified receipt fails verification;
- action detail links receipt and trace;
- correction appends rather than edits old receipt.

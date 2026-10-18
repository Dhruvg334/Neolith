# F08 — Human Approval Workflow

## Purpose

Introduce explicit human control when policy or risk requires it.

## Trigger examples

- amount above automatic procurement threshold;
- medium-confidence semantic mismatch;
- new high-risk vendor;
- irreversible operation;
- policy exception.

## Approval object

Contains:

- approval ID;
- exact action ID;
- action hash;
- requester;
- agent;
- reason codes;
- policy version;
- amount/resource impact;
- expiry;
- required role;
- status;
- decision note.

## Workflow

```text
governance decision = review
→ create approval
→ pause agent workflow
→ notify/show approver
→ approve or reject
→ verify action hash unchanged
→ resume
→ permit or denial
```

## LangGraph role

Use persisted interrupt/resume for agent workflow state.

The approval itself remains authoritative backend state.

## Security

- agent cannot approve;
- requester may be prohibited from approving own action;
- approval expires;
- material parameter change invalidates it.

## Acceptance

- exact approved action can resume;
- changed amount/tool needs new approval;
- expired approval cannot issue permit;
- rejection appears in audit log.

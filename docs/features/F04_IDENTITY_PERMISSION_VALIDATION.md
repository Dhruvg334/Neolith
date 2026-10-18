# F04 — Identity and Permission Validation

## Purpose

Determine who is acting and whether the requested capability is assigned before policy and risk evaluation.

## Identity types

- end user/requester;
- operator;
- approver;
- auditor;
- developer;
- agent workload;
- enterprise service.

## MVP authentication

User/operator:
session or OIDC-compatible auth.

Agent:
short-lived signed workload token containing:

- tenant/project scope;
- agent ID;
- agent version;
- audience;
- issue/expiry time.

## Permission model

Use a layered model:

- role-based permission for operator functions;
- attribute-based checks for action/resource context;
- relationship checks for task/request ownership;
- agent-tool allowlists.

Examples:

```text
requester can initiate procurement task
procurement-agent can call vendor search
procurement-agent can propose procure_subscription
student-user cannot publish policy
auditor can read receipts but cannot approve
```

## Principle

Authentication answers "who are you?"

Permission validation answers "are you assigned this capability?"

Policy answers "is this capability allowed under the current business conditions?"

These must remain separate.

## Failure modes

- expired token;
- agent version not active;
- role missing;
- task owner mismatch;
- tool not allowed.

## Acceptance

- unknown agent version is denied;
- quarantined agent is denied;
- protected admin endpoint returns 403 for ordinary user;
- permission reason is structured and auditable.

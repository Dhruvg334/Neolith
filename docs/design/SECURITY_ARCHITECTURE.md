# Security Architecture

## Security goals

- unauthorised protected action does not execute;
- valid approval cannot be reused for changed request;
- budget cannot be overspent through concurrency;
- model compromise does not change deterministic authority;
- revocation takes effect before later execution;
- evidence alteration is detectable.

## Trust boundaries

Untrusted/semi-trusted:

- user natural language;
- model output;
- retrieved vendor content;
- remote tools;
- remote agents;
- enterprise-service responses.

Trusted only after verification:

- server-side authenticated identity;
- active permission bindings;
- active policy bundle;
- durable budget state;
- signed permit;
- authoritative database state.

## Threats and controls

| Threat | Control |
|---|---|
| Prompt injection | untrusted-content labelling, system prompt, tool scope, deterministic policy |
| Agent impersonation | workload token, version registry |
| Permission escalation | server-side permission evaluation |
| Policy bypass | protected service permit requirement |
| Budget race | atomic reservation |
| Permit replay | consume-once nonce |
| Parameter mutation | canonical parameter hash |
| Approval replay | approval bound to action hash |
| Tool drift | schema/description version hash |
| Memory poisoning | structured authority outside semantic memory |
| Emergency-stop bypass | revocation epoch at execution |
| Audit tampering | hash-linked receipts |
| Secret leakage | server-side secrets and redaction |

## Security rule

No security-critical fallback may convert a failed deterministic dependency into model-based approval.

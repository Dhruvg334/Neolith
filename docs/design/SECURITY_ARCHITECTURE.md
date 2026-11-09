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

## External interface security

### Twilio WhatsApp

- validate `X-Twilio-Signature` using Twilio's supported SDK validator;
- validate required account/message fields after signature validation;
- use `MessageSid` for duplicate suppression;
- do not trust `From` as a Neolith permission grant;
- mask phone numbers in logs and receipts;
- keep Account SID/Auth Token server-side;
- acknowledge inbound webhooks promptly and process long-running agent work outside the provider request lifetime.

### ElevenLabs Voice

- authenticate the Custom LLM endpoint with a dedicated server-side bearer secret;
- validate OpenAI-compatible request structure and bound payload sizes;
- map conversation/user references to Neolith channel sessions without treating them as finance permissions;
- do not expose protected financial service credentials or direct write tools to ElevenLabs;
- ensure voice-generated proposals pass through the same Runtime Gateway as Web/WhatsApp.

### Channel-independent rule

A valid provider request proves only that the configured provider delivered the request. Financial authority still requires Neolith identity, permission, policy, budget, approval and permit checks.

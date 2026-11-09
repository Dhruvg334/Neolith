# Risks and Limitations

## 1. LLM non-determinism

Financial Agent outputs may vary between model versions or runs.

Response:

- structured outputs;
- deterministic financial fixtures;
- versioned prompts/models;
- deterministic/mock provider for CI;
- separate evaluation of agent quality and governance correctness.

## 2. Semantic-risk false positives

Intent-alignment or anomaly models can be wrong.

Response:

- deterministic policy remains authoritative;
- uncertain cases may require review;
- semantic output cannot broaden permissions.

## 3. Scope complexity

The project spans agentic AI, policy, security, backend, frontend, external messaging/voice interfaces and observability.

Response:

- one primary Financial AI Agent scenario set;
- phased roadmap;
- multi-agent and advanced RAG remain later extensions;
- WhatsApp/Voice reuse the same agent rather than creating separate systems.

## 4. Simulated financial service

The project does not connect to a production bank, payment processor or enterprise treasury platform.

This is an explicit prototype boundary. The simulator exists to prove controlled side-effect execution without moving real money.

## 5. External interface dependencies

WhatsApp and Voice demonstrations depend on Twilio and ElevenLabs availability/configuration.

Response:

- Web remains the primary inspectable interface;
- deterministic tests must run without Twilio/ElevenLabs credentials;
- channel adapters are isolated from core agent/governance logic.

## 6. Policy completeness

Prototype policies model selected organisational rules, not every possible enterprise financial policy.

## 7. Global/distributed consistency

The prototype is single-region/local in its transactional assumptions.

## 8. Security certification

The project demonstrates security engineering patterns but is not a certified banking, payments or enterprise security product.

## 9. Synthetic financial data

Accounts, invoices, beneficiaries and transactions are synthetic. Results demonstrate system behaviour, not real financial advice or real payment capability.

## 10. Agent memory

Long-term semantic memory is deliberately limited because stale or poisoned memory can create unsafe reasoning.

## 11. Evaluation dataset size

The semester project can demonstrate methodology and failure analysis but should not claim production-scale statistical validation without sufficient data.

# Risks and Limitations

## 1. LLM non-determinism

Agent recommendations may vary.

Response:

- structured outputs;
- deterministic vendor fixture;
- versioned prompts/models;
- separate evaluation.

## 2. Semantic-risk false positives

Intent-alignment models can be wrong.

Response:

- deterministic policy remains authoritative;
- uncertain cases may require review;
- semantic output cannot broaden permissions.

## 3. Scope complexity

The project spans agentic AI, policy, security, backend, frontend and observability.

Response:

- one primary procurement scenario;
- phased roadmap;
- multi-agent and advanced RAG are P1/P2.

## 4. Simulated enterprise service

The project does not connect to a production ERP/procurement platform.

This is an explicit prototype boundary, not a hidden limitation.

## 5. Policy completeness

Prototype policies model selected organisational rules, not every possible enterprise policy.

## 6. Global/distributed consistency

The prototype is single-region/local in its transactional assumptions.

## 7. Security certification

The project demonstrates security engineering patterns but is not a certified enterprise security product.

## 8. Live vendor data

P0 uses synthetic catalogue data to keep evaluation reproducible. Live public research can be added separately.

## 9. Agent memory

Long-term semantic memory is deliberately limited because stale or poisoned memory can create unsafe reasoning.

## 10. Evaluation dataset size

The semester project can demonstrate methodology and failure analysis but should not claim production-scale statistical validation without sufficient data.

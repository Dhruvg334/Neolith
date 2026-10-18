# Feature Description

This document provides the academic feature summary. Detailed implementation behaviour is defined in `docs/features/`.

## 1. User Task Workspace

Accepts natural-language goals and shows the task lifecycle from understanding through recommendation, governance and final execution.

## 2. Primary Agent

Uses LangGraph-based stateful orchestration to understand intent, retrieve approved information, compare alternatives and prepare structured execution proposals.

## 3. Runtime Gateway

Receives every protected execution request and normalises it into a canonical Execution Request Envelope.

## 4. Identity and Permission Validation

Verifies the requester and agent workload, then determines whether the requested capability is assigned.

## 5. Policy Engine

Uses deterministic policy-as-code to validate organisational rules independently of the LLM.

## 6. Budget and Quota Manager

Tracks limits, reservations and committed usage. Procurement actions reserve budget atomically before execution.

## 7. Risk Analyzer

Combines deterministic action risk with optional semantic or behavioural signals. Learned signals cannot create authority.

## 8. Human Approval

Pauses workflows when policy requires an authorised human decision. Approval is bound to the exact action.

## 9. Execution Permit Service

Issues a short-lived signed permit for one exact approved action. The permit is parameter-bound, time-limited and single-use.

## 10. Enterprise Service Connector

Provides controlled MCP/REST integration to downstream services and validates permits before protected side effects.

## 11. Delegation / Multi-Agent Support

Allows specialist agents to receive narrowed authority where multi-agent execution genuinely improves the workflow.

## 12. Memory and RAG

Uses task-scoped working memory, structured operational data and optional source-grounded semantic retrieval. Memory is never authority.

## 13. Audit and Decision Receipts

Stores complete evidence for protected action attempts, including policy, budget, risk, approval, permit and execution outcomes.

## 14. Observability

Correlates user task, agent run, governance decision and enterprise execution with trace IDs, structured logs and metrics.

## 15. Evaluation and Assurance

Provides reproducible scenarios for agent quality, governance correctness, security and operational metrics.

## 16. Procurement Demo

Demonstrates service selection, comparison, budget validation, controlled procurement, adversarial vendor content, replay protection and emergency revocation.

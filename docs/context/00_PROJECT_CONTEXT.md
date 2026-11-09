# Neolith — Project Context

## Project identity

**Project name:** Neolith  
**Academic title:** AI-Powered Agentic Decision and Execution System  
**Project type:** 7th-semester major group project

Neolith is a reusable enterprise agent architecture in which intelligent planning is separated from sensitive execution authority.

## Academic framing

The system is designed around these ideas:

- an AI agent understands user requests, gathers information, prepares execution plans and recommends actions;
- sensitive operations cannot be executed directly by the AI agent;
- every important action is independently checked against identity, permissions, organisational policy, budgets or quotas, risk and approval requirements;
- the Financial AI Agent is the primary reference application rather than the entire product;
- the architecture should extend to procurement, HR, scheduling and other enterprise workflows;
- the system should remain transparent, accountable, modular and extensible.

## Three-layer model

1. **AI Agent Layer**
   - intent understanding;
   - information retrieval;
   - comparison;
   - planning;
   - recommendation.

2. **Governance and Execution Control Layer**
   - Runtime Gateway;
   - Identity Service;
   - Permission Validator;
   - Policy Engine;
   - Budget / Quota Manager;
   - Risk Analyzer;
   - Approval Manager;
   - Permit Service;
   - Audit / Decision Receipt Service.

3. **Enterprise Services Layer**
   - procurement;
   - ERP;
   - CRM;
   - HR;
   - scheduling;
   - external APIs;
   - mock enterprise applications.

## Primary demonstration

The first complete demonstration is a synthetic Financial AI Agent operating against Neolith Demo Corp.

Example goals include:

> Pay INV-001 if the invoice is valid and within the software budget.

> Check whether INV-002 can be paid and request approval if required.

The same Financial AI Agent is exposed through the Web application, WhatsApp via Twilio, and a future ElevenLabs voice interface. These channels only transport user intent; all reasoning uses the same agent workflow and all protected execution uses the same Neolith governance path.

The demo proves:

- agentic understanding and financial-context retrieval;
- plan and action-proposal generation;
- channel-independent behaviour;
- governed tool usage;
- permission validation;
- policy enforcement;
- budget checks;
- risk classification;
- optional human approval;
- execution permit issuance;
- protected financial execution;
- auditability.

## Secondary extension scenarios

Architecture extensions may include:

- procurement and service selection;
- HR operations;
- scheduling and resource booking;
- IT access/software requests;
- governed CRM updates.

## Technical direction

Core stack:

- Next.js
- FastAPI
- PostgreSQL
- Redis
- LangGraph
- Open Policy Agent / Rego
- MCP
- optional A2A
- OpenTelemetry
- Docker
- Git / GitHub
- provider-pluggable LLM interface

## Critical boundary

Neolith must not rely on an LLM to make final decisions for:

- identity;
- permissions;
- policy;
- budget;
- permit validity;
- revocation;
- irreversible execution.

AI may assist with ambiguity, planning, ranking, semantic risk and explanations. Deterministic software owns authority.

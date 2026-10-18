# Project Abstract

Neolith is an AI-powered agentic decision and execution system designed to separate intelligent task planning from sensitive enterprise execution.

Users interact with an AI agent using natural language. The agent understands the request, gathers approved information, compares alternatives and prepares an execution plan. Sensitive actions are not executed directly by the AI agent. Instead, each execution request passes through an independent Governance and Execution Control Layer that validates user identity, permissions, organisational policy, budget or quota limits, risk level and approval requirements.

Approved operations receive a short-lived execution permit that is validated again by the protected enterprise service. Rejected operations are recorded with structured reason codes. Decision and execution evidence is maintained through auditable receipts and correlated traces.

The prototype uses procurement and software-service selection as the primary demonstration. A user requests suitable project-management software under a defined monthly budget. Neolith compares candidate services, recommends an option and submits the proposed procurement action for independent governance validation before the mock enterprise procurement service can execute it.

The architecture is intentionally modular so that the same governance pattern can be extended to HR, finance, scheduling and other enterprise workflows.

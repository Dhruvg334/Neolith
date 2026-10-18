# Problem Statement

Modern AI agents can plan tasks, use tools and interact with enterprise software. Authentication can determine whether a user or agent has access to a system, but access alone does not prove that an AI-generated action should be executed.

An agent may:

- select an action outside the user's actual objective;
- invoke a tool beyond its intended scope;
- violate organisational policy;
- exceed a budget or quota;
- act on malicious external instructions;
- perform a high-risk operation without human approval;
- continue after its authority has changed.

This creates a gap between intelligent decision-making and secure execution.

Neolith addresses this gap by introducing an independent Governance and Execution Control Layer between agent planning and enterprise services. The layer evaluates every protected action before execution and records the resulting decision and outcome for accountability.

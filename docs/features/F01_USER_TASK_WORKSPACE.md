# F01 — User Task Workspace

## Purpose

Provide the primary user-facing surface for submitting a goal, observing agent progress, reviewing recommendations, handling clarification and viewing final outcomes.

## User value

The user should not need to understand governance internals to use Neolith. The workspace presents the agent workflow as a transparent task with clear states.

## Core flow

1. User enters natural-language goal.
2. System creates task.
3. Agent extracts objective and constraints.
4. Missing required values trigger clarification.
5. Agent researches and prepares comparison.
6. User sees recommendation and proposed execution.
7. Governance decision is displayed.
8. Approval is requested when required.
9. Final execution outcome and receipt summary are shown.

## Task states

```text
draft
→ understanding
→ needs_clarification
→ researching
→ planning
→ awaiting_governance
→ awaiting_approval
→ ready_to_execute
→ executing
→ completed
→ failed
→ cancelled
```

## UI components

- task composer;
- constraint summary;
- agent activity timeline;
- comparison table;
- proposed action card;
- governance status;
- approval prompt;
- execution result;
- receipt link.

## Data

Task stores:

- task ID;
- requester;
- original request;
- extracted objective;
- constraints;
- current state;
- selected plan;
- timestamps;
- trace ID.

## Security

- user sees only own/authorised tasks;
- raw internal prompts are not shown;
- sensitive governance details are redacted by audience.

## Failure handling

- model unavailable: user receives retryable planning error;
- missing information: state becomes `needs_clarification`;
- governance deny: task remains readable and displays reason;
- execution unknown: state becomes `execution_pending_reconciliation`.

## Acceptance

- new task receives stable ID;
- state transitions are persisted;
- refresh does not lose task state;
- denied task does not appear as technical failure;
- user can distinguish recommendation from actual execution.

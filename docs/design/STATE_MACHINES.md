# State Machines

## Task

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
```

Terminal/alternate:

```text
failed
cancelled
denied
execution_pending_reconciliation
```

## Execution request

```text
received
→ validating
→ denied
→ awaiting_approval
→ permitted
→ executing
→ succeeded
→ failed
→ unknown
→ compensated
```

## Budget reservation

```text
pending
→ reserved
→ committed
→ released
→ expired
→ reconciliation_required
```

## Approval

```text
pending
→ approved
→ rejected
→ expired
```

## Permit

```text
issued
→ consumed
→ expired
→ revoked
→ rejected
```

## Agent

```text
inactive
→ active
→ suspended
→ quarantined
→ retired
```

## Policy version

```text
draft
→ validated
→ approved
→ active
→ rolled_back
→ retired
```

## Incident

```text
open
→ contained
→ investigating
→ resolved
→ closed
```

State transitions are validated server-side and written to audit evidence for protected objects.

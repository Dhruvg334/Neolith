# Locked Product Principles

These principles should not change without an explicit design decision.

## P1 — Separate intelligence from authority

The AI layer can understand, retrieve, compare, plan and recommend.

The governance layer independently decides whether a sensitive action may execute.

## P2 — Sensitive execution is permit-gated

Protected enterprise actions accept a short-lived execution permit rather than trusting the agent directly.

## P3 — Deterministic rules dominate authority

Permissions, policies, budgets, revocation and permit validation are deterministic.

A model cannot convert a deterministic denial into permission.

## P4 — Agent autonomy is bounded by explicit scope

Agent capabilities must be known and reviewable.

Delegation cannot expand authority.

## P5 — Every important action is traceable

The system records:

- who requested;
- which agent proposed;
- why;
- which policy applied;
- what approval occurred;
- what permit was issued;
- what service executed;
- what result occurred.

## P6 — Budget checks are transactional

Spend-bearing actions reserve budget before execution so concurrent actions cannot jointly exceed the available limit.

## P7 — External content is untrusted

Web pages, vendor descriptions, tool output and retrieved content are data, not instructions.

## P8 — Model memory cannot create authority

Agent memory may improve continuity but cannot create a new permission, budget, tool or approval.

## P9 — Evaluation is a product feature

Agent behaviour, governance correctness, security and cost must be tested through reproducible scenarios.

## P10 — Academic demo must be real enough to inspect

The demo may use mock enterprise services and synthetic data, but core governance functions must have real backing state and real enforcement logic.

## P11 — No fake metrics

Targets must be clearly labelled as targets until measured.

## P12 — Modular before distributed

Use a modular monolith for the backend MVP. Split services only when runtime or ownership boundaries justify it.

# F07 — Risk Analyzer

## Purpose

Classify execution risk and provide structured signals to governance.

## Base deterministic risk

Factors:

- read vs write;
- reversible vs compensatable vs irreversible;
- data sensitivity;
- financial amount;
- new tool/vendor;
- delegation depth;
- action frequency;
- recent denials;
- policy exceptions.

## Semantic risk

Optional model/classifier can evaluate whether proposed action matches the user's objective.

Example:

Goal:
procure project-management software.

Proposed action:
purchase gift card.

Semantic result:
objective mismatch.

## Anomaly signal

Optional ML can consider:

- unusual amount;
- tool novelty;
- time-of-day;
- high request velocity;
- unusual sequence;
- repeated denied actions.

## Authority boundary

Risk signals may:

- increase risk tier;
- require approval;
- support denial where deterministic policy defines threshold.

They may not:

- create permission;
- increase budget;
- override hard deny.

## Tiers

- R0: public read.
- R1: normal internal read.
- R2: reversible protected write.
- R3: material/sensitive action.
- R4: irreversible/systemic action.

## Acceptance

- same deterministic features yield same base tier;
- semantic model failure does not bypass policy;
- risk evidence is stored separately from policy reason.

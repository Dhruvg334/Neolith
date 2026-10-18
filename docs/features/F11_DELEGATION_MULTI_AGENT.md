# F11 — Delegation and Multi-Agent Orchestration

## Purpose

Use specialist agents only where specialization improves the workflow.

## Default design

The procurement MVP should work with one primary LangGraph agent.

A specialist research/comparison agent may be added after the single-agent flow is stable.

## Delegation model

Delegation contains:

- parent agent;
- child agent;
- task;
- allowed tools;
- action categories;
- resource/budget ceiling;
- expiry;
- maximum depth.

## Rule

Delegation can narrow authority only.

## Good multi-agent uses

- parallel vendor research;
- specialist policy explanation;
- threat simulation;
- incident investigation.

## Bad use

Do not have multiple agents debate every permission decision. Authority remains deterministic.

## A2A

A2A may be used to demonstrate cross-framework or remote specialist delegation.

It is not required for the first P0 flow.

## Acceptance

- specialist receives narrower scope;
- child cannot delegate beyond allowed depth;
- child result returns with lineage;
- child cannot call protected tool outside delegated set.

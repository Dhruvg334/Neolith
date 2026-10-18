# F10 — Enterprise Service and MCP Connector Layer

## Purpose

Expose enterprise capabilities to agents while forcing sensitive writes through governance.

## Connector types

- MCP server/tool;
- protected REST adapter;
- internal service adapter;
- optional A2A remote-agent adapter.

## Tool registration metadata

- tool ID;
- name;
- description;
- protocol;
- version;
- schema hashes;
- owner;
- risk tier;
- data classification;
- reversibility;
- financial/resource effect;
- required permission;
- protected/read-only classification.

## MCP usage

MCP is appropriate for:

- vendor catalogue search;
- policy/document retrieval;
- enterprise lookup;
- tool discovery.

Protected write tools still validate Neolith permit before side effect.

## Tool manifest drift

Change in:

- description;
- schema;
- endpoint;
- side effect;
- data classification

creates a new version and review event.

## Token safety

Do not pass upstream credentials transparently between services.

Credentials are resource-bound and server-side.

## Acceptance

- unregistered tool rejected;
- tool schema change visible;
- permitless protected write rejected;
- read-only tool can operate under named low-risk policy.

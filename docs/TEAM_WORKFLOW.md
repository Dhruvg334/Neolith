# Team Workflow

## Branching

Recommended:

- `main` — stable;
- `develop` — integration;
- feature branches — `feat/<scope>`;
- bug branches — `fix/<scope>`.

## Pull request requirements

- scope description;
- changed files;
- tests run;
- screenshots for UI;
- migration note if data changes;
- security impact;
- known limitations.

## Commit rules

- unique commit message for every change set;
- do not reuse generic messages;
- no generated/cache/secrets;
- do not commit failing code knowingly.

## Documentation rules

Update when relevant:

- public SRS/feature docs for product behaviour;
- local build-status record;
- local system-design decision log;
- test matrix.

## Phase workflow

Before implementation:

1. read current status;
2. inspect architecture and feature spec;
3. plan changed files;
4. identify tests.

After implementation:

1. run automated tests;
2. run defined manual profile;
3. inspect failure paths;
4. update status;
5. provide unique commit message.

## Engineering quality

- no fake API response for a core demo path unless clearly a simulator;
- no visual-only button for a promised governance action;
- no unsupported performance claim;
- no secret committed;
- no direct agent access to protected service.

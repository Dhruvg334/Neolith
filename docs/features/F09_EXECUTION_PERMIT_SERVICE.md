# F09 — Execution Permit Service

## Purpose

Bind governance approval to one exact protected action at execution time.

## Permit type

Short-lived signed JWS using Ed25519 for the prototype.

## Claims

- issuer;
- audience/tool;
- subject/agent version;
- permit ID/nonce;
- issue/not-before/expiry;
- requester;
- task;
- action;
- operation;
- parameter hash;
- context hash;
- budget reservation ID when relevant;
- policy digest;
- revocation epoch.

## Validation

Protected service checks:

1. signature;
2. issuer;
3. audience;
4. time;
5. permit state;
6. nonce;
7. action/tool binding;
8. parameter hash;
9. context hash;
10. revocation epoch;
11. reservation state.

## Replay protection

Nonce consumption is atomic and single-use.

## Mutation protection

Changing amount, vendor, resource or other material parameter changes canonical hash and invalidates permit.

## Expiry

Default MVP target: 60 seconds.

## Acceptance

- valid exact action executes once;
- expired permit fails;
- replay fails;
- changed parameters fail;
- old epoch fails after emergency stop.

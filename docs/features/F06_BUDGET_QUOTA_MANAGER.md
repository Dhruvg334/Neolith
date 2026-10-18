# F06 — Budget and Quota Manager

## Purpose

Control consumable authority such as money, request count, licences or other bounded resources.

## Procurement MVP

Support:

- monthly procurement budget;
- per-action maximum;
- optional category budget;
- reserved amount;
- committed amount;
- available amount.

## Why reservation is required

A simple read-then-write budget check is unsafe under concurrency.

Example:

```text
Available: INR 8,000
Action A: INR 6,000
Action B: INR 3,000
```

Both must not independently see INR 8,000 and pass.

## Reservation flow

```text
requested
→ atomic reserve
→ permit issued
→ execution
→ commit
```

Failure:

```text
reserved
→ confirmed failure
→ release
```

Unknown result:

```text
reserved
→ reconciliation_required
```

## Technology

Redis atomic script for live reservation plus PostgreSQL durable record.

## Money handling

- decimal strings at API boundary;
- `numeric`/Decimal internally;
- never binary floating point.

## Future quota types

- API call count;
- seats/licences;
- compute time;
- file storage;
- daily operation count.

## Acceptance

- controlled concurrent test cannot exceed limit;
- duplicate request cannot double-reserve;
- failed execution releases;
- unknown outcome does not silently release.

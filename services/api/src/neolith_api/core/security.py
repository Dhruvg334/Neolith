"""Canonical JSON hashing and cryptographic primitives for Neolith."""

import hashlib
import json
from typing import Any


def canonicalize_json(payload: dict[str, Any]) -> str:
    """Serialize a JSON mapping deterministically with sorted keys and compact separators."""
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def compute_sha256_prefixed(payload: dict[str, Any]) -> str:
    """Return a 'sha256:<hex>' digest of the canonicalized JSON mapping."""
    canonical_bytes = canonicalize_json(payload).encode("utf-8")
    digest = hashlib.sha256(canonical_bytes).hexdigest()
    return f"sha256:{digest}"

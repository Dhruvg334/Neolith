"""Automated tests verifying repository contracts, schemas, SQL DDL, and evaluation scenarios."""

import json
from pathlib import Path

import jsonschema

from scripts.validate_contracts import (
    ROOT,
    validate_all,
    validate_evaluation_scenarios,
    validate_json_schemas,
    validate_openapi,
    validate_sql_schema,
)


def test_all_contracts_validate_cleanly() -> None:
    """All JSON Schemas, OpenAPI spec, SQL bootstrap DDL, and evaluation fixtures validate."""
    summary = validate_all(ROOT)
    assert summary["schemas"] == 5
    assert summary["openapi_paths"] >= 14
    assert summary["sql_tables"] == 25
    assert summary["evaluation_scenarios"] == 7
    assert summary["vendors"] == 3


def test_execution_request_schema_enforces_required_fields_and_hashes() -> None:
    """execution-request.schema.json accepts valid canonical envelopes."""

    schema_path = Path(ROOT) / "specs" / "schemas" / "execution-request.schema.json"
    schema = json.loads(schema_path.read_text(encoding="utf-8"))

    valid_envelope = {
        "action_id": "11111111-1111-4111-8111-111111111111",
        "trace_id": "trace-0001-abcd",
        "task_id": "22222222-2222-4222-8222-222222222222",
        "user_id": "33333333-3333-4333-8333-333333333333",
        "agent_id": "44444444-4444-4444-8444-444444444444",
        "agent_version": "0.1.0",
        "tool_id": "55555555-5555-4555-8555-555555555555",
        "operation": "procure_subscription",
        "amount": "6000.00",
        "currency": "INR",
        "parameters": {"vendor": "taskforge", "seats": 10},
        "parameters_hash": "sha256:" + ("a" * 64),
        "context_hash": "sha256:" + ("b" * 64),
        "requested_at": "2026-10-19T00:00:00Z",
        "nonce": "nonce-1234567890abcdef",
    }
    jsonschema.validate(instance=valid_envelope, schema=schema)

    assert len(validate_json_schemas(ROOT)) == 5
    assert "paths" in validate_openapi(ROOT)
    assert "execution_requests" in validate_sql_schema(ROOT)
    assert "procurement_happy_path" in validate_evaluation_scenarios(ROOT)

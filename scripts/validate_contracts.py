"""Validate Neolith machine-readable contracts, schemas, SQL DDL, and evaluation fixtures."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

import jsonschema
import yaml

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_SCHEMAS = (
    "decision-receipt.schema.json",
    "execution-permit.schema.json",
    "execution-request.schema.json",
    "policy-input.schema.json",
    "task.schema.json",
)

REQUIRED_SQL_TABLES = (
    "users",
    "agents",
    "agent_versions",
    "tools",
    "tool_versions",
    "tasks",
    "plans",
    "permission_bindings",
    "policies",
    "policy_versions",
    "budgets",
    "execution_requests",
    "governance_decisions",
    "risk_signals",
    "budget_reservations",
    "approvals",
    "execution_permits",
    "tool_executions",
    "system_state",
    "revocations",
    "decision_receipts",
    "evaluation_suites",
    "evaluation_cases",
    "evaluation_runs",
    "evaluation_results",
)

REQUIRED_OPENAPI_PATHS = (
    "/health",
    "/ready",
    "/tasks",
    "/tasks/{task_id}",
    "/agents",
    "/tools",
    "/permissions/effective",
    "/budgets",
    "/actions/evaluate",
    "/approvals",
    "/permits/{permit_id}/consume",
    "/system/emergency-stop",
    "/receipts/{receipt_id}",
    "/evaluation/runs",
)


def validate_json_schemas(root: Path = ROOT) -> list[str]:
    """Validate all JSON Schema files in specs/schemas against Draft 2020-12."""
    schemas_dir = root / "specs" / "schemas"
    if not schemas_dir.is_dir():
        msg = f"Missing schemas directory: {schemas_dir}"
        raise ValueError(msg)

    validated: list[str] = []
    for required_name in REQUIRED_SCHEMAS:
        schema_path = schemas_dir / required_name
        if not schema_path.is_file():
            msg = f"Missing required schema file: {required_name}"
            raise ValueError(msg)

    for schema_path in sorted(schemas_dir.glob("*.schema.json")):
        raw = json.loads(schema_path.read_text(encoding="utf-8"))
        if not isinstance(raw, dict):
            msg = f"Schema {schema_path.name} root must be a JSON object"
            raise ValueError(msg)
        if raw.get("$schema") != "https://json-schema.org/draft/2020-12/schema":
            msg = f"Schema {schema_path.name} must declare Draft 2020-12 $schema"
            raise ValueError(msg)
        if not raw.get("$id") or not raw.get("title"):
            msg = f"Schema {schema_path.name} must declare $id and title"
            raise ValueError(msg)
        jsonschema.Draft202012Validator.check_schema(raw)
        validated.append(schema_path.name)

    return validated


def _collect_refs(node: Any) -> list[str]:
    refs: list[str] = []
    if isinstance(node, dict):
        for key, value in node.items():
            if key == "$ref" and isinstance(value, str):
                refs.append(value)
            else:
                refs.extend(_collect_refs(value))
    elif isinstance(node, list):
        for item in node:
            refs.extend(_collect_refs(item))
    return refs


def _resolve_json_pointer(document: dict[str, Any], pointer: str) -> Any:
    current: Any = document
    for part in pointer.lstrip("#/").split("/"):
        unescaped = part.replace("~1", "/").replace("~0", "~")
        if not isinstance(current, dict) or unescaped not in current:
            msg = f"Unresolvable internal OpenAPI $ref: {pointer}"
            raise ValueError(msg)
        current = current[unescaped]
    return current


def validate_openapi(root: Path = ROOT) -> dict[str, Any]:
    """Validate specs/openapi.yaml structure and all internal/external $ref targets."""
    openapi_path = root / "specs" / "openapi.yaml"
    if not openapi_path.is_file():
        msg = f"Missing OpenAPI specification: {openapi_path}"
        raise ValueError(msg)

    spec = yaml.safe_load(openapi_path.read_text(encoding="utf-8"))
    if not isinstance(spec, dict):
        msg = "OpenAPI document root must be a mapping"
        raise ValueError(msg)

    if spec.get("openapi") != "3.1.0":
        msg = f"Expected openapi: 3.1.0, found {spec.get('openapi')!r}"
        raise ValueError(msg)

    info = spec.get("info")
    if not isinstance(info, dict) or not info.get("title") or not info.get("version"):
        msg = "OpenAPI info section must include title and version"
        raise ValueError(msg)

    paths = spec.get("paths")
    if not isinstance(paths, dict):
        msg = "OpenAPI paths section must be a mapping"
        raise ValueError(msg)

    for required_path in REQUIRED_OPENAPI_PATHS:
        if required_path not in paths:
            msg = f"OpenAPI spec is missing required path: {required_path}"
            raise ValueError(msg)

    for ref in _collect_refs(spec):
        if ref.startswith("#/"):
            _resolve_json_pointer(spec, ref)
        else:
            ref_file = (openapi_path.parent / ref).resolve()
            if not ref_file.is_file():
                msg = f"External OpenAPI $ref does not exist: {ref}"
                raise ValueError(msg)

    return spec


def validate_sql_schema(root: Path = ROOT) -> list[str]:
    """Validate specs/sql/schema.sql contains all required authoritative tables."""
    sql_path = root / "specs" / "sql" / "schema.sql"
    if not sql_path.is_file():
        msg = f"Missing SQL schema file: {sql_path}"
        raise ValueError(msg)

    sql_text = sql_path.read_text(encoding="utf-8")
    found_tables: list[str] = []
    for table_name in REQUIRED_SQL_TABLES:
        marker = f"CREATE TABLE {table_name} ("
        if marker not in sql_text:
            msg = f"SQL bootstrap schema missing table definition: {table_name}"
            raise ValueError(msg)
        found_tables.append(table_name)

    if "numeric(18,2)" not in sql_text:
        msg = "SQL schema must use exact numeric types for monetary fields"
        raise ValueError(msg)

    return found_tables


def validate_evaluation_scenarios(root: Path = ROOT) -> list[str]:
    """Validate evaluation/scenarios/*.yaml fixtures."""
    scenarios_dir = root / "evaluation" / "scenarios"
    if not scenarios_dir.is_dir():
        msg = f"Missing evaluation scenarios directory: {scenarios_dir}"
        raise ValueError(msg)

    scenario_files = sorted(scenarios_dir.glob("*.yaml"))
    if not scenario_files:
        msg = "No evaluation scenario YAML files found"
        raise ValueError(msg)

    seen_ids: set[str] = set()
    validated_ids: list[str] = []
    for path in scenario_files:
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            msg = f"Scenario {path.name} must parse to a YAML mapping"
            raise ValueError(msg)
        scenario_id = data.get("id")
        title = data.get("title")
        expected = data.get("expected")
        if not isinstance(scenario_id, str) or not scenario_id.strip():
            msg = f"Scenario {path.name} missing non-empty string 'id'"
            raise ValueError(msg)
        if scenario_id in seen_ids:
            msg = f"Duplicate evaluation scenario id: {scenario_id}"
            raise ValueError(msg)
        if not isinstance(title, str) or not title.strip():
            msg = f"Scenario {path.name} missing non-empty string 'title'"
            raise ValueError(msg)
        if not isinstance(expected, dict) or not expected:
            msg = f"Scenario {path.name} missing non-empty mapping 'expected'"
            raise ValueError(msg)
        seen_ids.add(scenario_id)
        validated_ids.append(scenario_id)

    return validated_ids


def validate_vendor_fixtures(root: Path = ROOT) -> int:
    """Validate synthetic vendor catalogue fixture in data/fixtures/vendors.json."""
    vendors_path = root / "data" / "fixtures" / "vendors.json"
    if not vendors_path.is_file():
        msg = f"Missing vendor fixture file: {vendors_path}"
        raise ValueError(msg)

    payload = json.loads(vendors_path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        msg = "vendors.json root must be an object"
        raise ValueError(msg)
    vendors = payload.get("vendors")
    if not isinstance(vendors, list) or not vendors:
        msg = "vendors.json must contain a non-empty 'vendors' list"
        raise ValueError(msg)

    for vendor in vendors:
        if not isinstance(vendor, dict):
            msg = "Each vendor entry must be an object"
            raise ValueError(msg)
        if not isinstance(vendor.get("monthly_price"), str):
            msg = f"Vendor {vendor.get('id')!r} monthly_price must be a decimal string"
            raise ValueError(msg)

    return len(vendors)


def validate_all(root: Path = ROOT) -> dict[str, int]:
    """Run all contract and fixture validations and return summary counts."""
    schemas = validate_json_schemas(root)
    openapi = validate_openapi(root)
    tables = validate_sql_schema(root)
    scenarios = validate_evaluation_scenarios(root)
    vendors_count = validate_vendor_fixtures(root)
    return {
        "schemas": len(schemas),
        "openapi_paths": len(openapi.get("paths", {})),
        "sql_tables": len(tables),
        "evaluation_scenarios": len(scenarios),
        "vendors": vendors_count,
    }


def main() -> int:
    try:
        summary = validate_all(ROOT)
    except Exception as exc:
        print(f"Contract validation failed: {exc}", file=sys.stderr)
        return 1

    print(
        "Neolith contract validation passed: "
        f"{summary['schemas']} JSON schemas, "
        f"{summary['openapi_paths']} OpenAPI paths, "
        f"{summary['sql_tables']} SQL tables, "
        f"{summary['evaluation_scenarios']} evaluation scenarios, "
        f"{summary['vendors']} vendor fixtures."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

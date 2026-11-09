import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

required = [
    "README.md",
    ".gitignore",
    "docs/academic/SRS.md",
    "docs/features/00_FEATURE_INDEX.md",
    "docs/design/SYSTEM_ARCHITECTURE.md",
    "docs/design/INTERACTION_INTERFACE_ARCHITECTURE.md",
    "docs/features/F17_MULTICHANNEL_INTERACTION_INTERFACES.md",
    "docs/context/04_FINANCIAL_SCENARIOS.md",
    "docs/features/F16_FINANCIAL_REFERENCE_APPLICATION.md",
    "specs/openapi.yaml",
    "specs/schemas/execution-request.schema.json",
    "policy/rego/neolith.rego",
]

missing = [p for p in required if not (ROOT / p).exists()]
if missing:
    raise SystemExit(f"Missing required files: {missing}")

for path in (ROOT / "specs/schemas").glob("*.json"):
    json.loads(path.read_text(encoding="utf-8"))

# Validate README.md formatting and structure integrity
readme_text = (ROOT / "README.md").read_text(encoding="utf-8")
readme_lines = readme_text.splitlines()

code_fence_count = 0
in_code_block = False
team_section_in_code = False

for _line_idx, line in enumerate(readme_lines, start=1):
    stripped = line.strip()
    if stripped.startswith("```"):
        code_fence_count += 1
        in_code_block = not in_code_block
    if "Project Team & Academic Supervision" in line and in_code_block:
        team_section_in_code = True

if code_fence_count % 2 != 0:
    raise SystemExit(
        f"Unbalanced Markdown code fence in README.md (total code fences: {code_fence_count})."
    )

if team_section_in_code:
    raise SystemExit(
        "Project Team & Academic Supervision heading in README.md "
        "is rendered inside an unclosed code block."
    )

forbidden_patterns = [
    r"\.project-private",
    r"\.agents[/\\]",
    r"\.ci-venv",
    r"Co-authored-by",
    r"Antigravity",
    r"AI-assisted",
    r"AI-generated",
]
for pattern in forbidden_patterns:
    if re.search(pattern, readme_text, flags=re.IGNORECASE):
        raise SystemExit(
            f"README.md contains forbidden private or attribution pattern matching: {pattern}"
        )

print("Neolith documentation, schema, and formatting checks passed.")

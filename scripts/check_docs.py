from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]

required = [
    "README.md",
    ".gitignore",
    "docs/academic/SRS.md",
    "docs/features/00_FEATURE_INDEX.md",
    "docs/design/SYSTEM_ARCHITECTURE.md",
    "docs/IMPLEMENTATION_ROADMAP.md",
    "specs/openapi.yaml",
    "specs/schemas/execution-request.schema.json",
    "policy/rego/neolith.rego",
]

missing = [p for p in required if not (ROOT / p).exists()]
if missing:
    raise SystemExit(f"Missing required files: {missing}")

for path in (ROOT / "specs/schemas").glob("*.json"):
    json.loads(path.read_text(encoding="utf-8"))

print("Neolith project-start documentation checks passed.")

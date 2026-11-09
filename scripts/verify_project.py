"""Neolith unified cross-platform project verification script.

Orchestrates all mandatory CI-parity verification gates:
1. Documentation validation (scripts/check_docs.py)
2. Contract and schema validation (scripts/validate_contracts.py)
3. Ruff linter (ruff check .)
4. Ruff formatting check (ruff format --check .)
5. Strict mypy typecheck (mypy root invocation)
6. Pytest test suite (pytest)
7. OPA policy syntax validation (opa check policy/rego policy/tests)
8. OPA policy test execution (opa test policy/rego policy/tests -v)
9. Frontend ESLint (pnpm lint)
10. Frontend TypeScript typecheck (pnpm typecheck)
11. Frontend Next.js production build (pnpm build)
12. Docker Compose infrastructure configuration validation
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent


def print_banner(step_num: int, title: str) -> None:
    bar = "=" * 70
    print(f"\n{bar}\n[{step_num}/12] {title}\n{bar}")


def run_command(
    cmd: list[str],
    step_num: int,
    title: str,
    cwd: Path = ROOT_DIR,
    env: dict[str, str] | None = None,
) -> None:
    print_banner(step_num, title)
    cmd_str = " ".join(cmd)
    print(f"Running: {cmd_str} (cwd: {cwd})\n")
    merged_env = os.environ.copy()
    if env:
        merged_env.update(env)

    result = subprocess.run(cmd, cwd=cwd, env=merged_env)
    if result.returncode != 0:
        print(f"\nFAILED: {title} (exit code: {result.returncode})")
        sys.exit(result.returncode)
    print(f"\nPASSED: {title}")


def resolve_opa_cmd() -> list[str]:
    # 1. System opa executable
    system_opa = shutil.which("opa")
    if system_opa:
        return [system_opa]

    # 2. Local CI venv opa binary
    ci_venv_opa = ROOT_DIR / ".ci-venv" / "Scripts" / "opa.exe"
    if ci_venv_opa.is_file():
        return [str(ci_venv_opa)]

    # 3. Docker fallback if docker is running
    docker_exe = shutil.which("docker")
    if docker_exe:
        # Check if docker daemon is responding
        check = subprocess.run(
            [docker_exe, "info"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        if check.returncode == 0:
            return [
                docker_exe,
                "run",
                "--rm",
                "-v",
                f"{ROOT_DIR / 'policy'}:/policy",
                "openpolicyagent/opa:1.22.2",
            ]

    print("ERROR: Open Policy Agent (OPA) executable not found.")
    print("Install OPA (v1.22.2) in PATH or download to .ci-venv/Scripts/opa.exe.")
    sys.exit(1)


def resolve_pnpm_cmd() -> str:
    pnpm_exe = shutil.which("pnpm")
    if not pnpm_exe:
        # Check Windows cmd fallback
        pnpm_cmd = shutil.which("pnpm.cmd")
        if pnpm_cmd:
            return pnpm_cmd
        print("ERROR: pnpm executable not found in PATH.")
        sys.exit(1)
    return pnpm_exe


def resolve_docker_cmd() -> str:
    docker_exe = shutil.which("docker")
    if not docker_exe:
        print("ERROR: docker executable not found in PATH.")
        sys.exit(1)
    return docker_exe


def main() -> None:
    python_exe = sys.executable
    print("Neolith Unified Project Verification")
    print(f"Workspace: {ROOT_DIR}")
    print(f"Python:    {python_exe}")

    opa_base_cmd = resolve_opa_cmd()
    pnpm_exe = resolve_pnpm_cmd()
    docker_exe = resolve_docker_cmd()

    # 1. Documentation validation
    run_command(
        [python_exe, str(ROOT_DIR / "scripts" / "check_docs.py")],
        1,
        "Documentation Check",
    )

    # 2. Contract validation
    run_command(
        [python_exe, str(ROOT_DIR / "scripts" / "validate_contracts.py")],
        2,
        "Contract & Schema Validation",
    )

    # 3. Ruff lint
    run_command(
        [python_exe, "-m", "ruff", "check", "."],
        3,
        "Ruff Linter",
    )

    # 4. Ruff format
    run_command(
        [python_exe, "-m", "ruff", "format", "--check", "."],
        4,
        "Ruff Format Check",
    )

    # 5. Mypy strict
    run_command(
        [python_exe, "-m", "mypy"],
        5,
        "Strict Mypy Typecheck",
    )

    # 6. Pytest
    test_env = {"NEOLITH_FINANCIAL_DATA_MODE": "fixture"}
    run_command(
        [python_exe, "-m", "pytest"],
        6,
        "Pytest Suite",
        env=test_env,
    )

    # 7. OPA check
    if "docker" in opa_base_cmd[0]:
        run_command(
            [*opa_base_cmd, "check", "/policy/rego", "/policy/tests"],
            7,
            "OPA Policy Syntax Check (Docker)",
        )
        run_command(
            [*opa_base_cmd, "test", "/policy/rego", "/policy/tests", "-v"],
            8,
            "OPA Policy Tests (Docker)",
        )
    else:
        run_command(
            [*opa_base_cmd, "check", "policy/rego", "policy/tests"],
            7,
            "OPA Policy Syntax Check",
        )
        run_command(
            [*opa_base_cmd, "test", "policy/rego", "policy/tests", "-v"],
            8,
            "OPA Policy Tests",
        )

    # 9. Frontend lint
    run_command(
        [pnpm_exe, "lint"],
        9,
        "Frontend ESLint",
    )

    # 10. Frontend typecheck
    run_command(
        [pnpm_exe, "typecheck"],
        10,
        "Frontend TypeScript Typecheck",
    )

    # 11. Frontend build
    run_command(
        [pnpm_exe, "build"],
        11,
        "Frontend Production Build",
    )

    # 12. Docker Compose config
    run_command(
        [docker_exe, "compose", "-f", "infra/docker-compose.yml", "config"],
        12,
        "Docker Compose Configuration",
    )

    print("\n" + "=" * 70)
    print("ALL 12 NEOLITH VERIFICATION GATES PASSED SUCCESSFULLY!")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()

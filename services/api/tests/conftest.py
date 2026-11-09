"""Pytest global configuration and fixtures for Neolith API and Agent tests."""

import os
import shutil
import subprocess
import time
from collections.abc import Generator
from pathlib import Path

import httpx
import pytest


@pytest.fixture(autouse=True)
def configure_test_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    """Configure deterministic test environment defaults."""
    if "NEOLITH_FINANCIAL_DATA_MODE" not in os.environ:
        monkeypatch.setenv("NEOLITH_FINANCIAL_DATA_MODE", "fixture")
    monkeypatch.setenv("APP_ENV", "test")
    monkeypatch.setenv("OPA_URL", "http://127.0.0.1:8181")


@pytest.fixture(scope="session")
def opa_server() -> Generator[str, None, None]:
    """Ensure an authoritative OPA server is running on localhost:8181 for tests."""
    opa_url = "http://127.0.0.1:8181"
    try:
        resp = httpx.get(f"{opa_url}/health", timeout=0.5)
        if resp.status_code == 200:
            yield opa_url
            return
    except Exception:
        pass

    repo_root = Path(__file__).resolve().parents[3]
    candidate_paths = [
        shutil.which("opa"),
        repo_root / ".ci-venv" / "Scripts" / "opa.exe",
        repo_root / ".ci-venv" / "bin" / "opa",
    ]
    opa_bin = None
    for cand in candidate_paths:
        if cand and Path(cand).exists():
            opa_bin = str(cand)
            break

    if not opa_bin:
        yield opa_url
        return

    rego_path = str(repo_root / "policy" / "rego")
    proc = subprocess.Popen(
        [opa_bin, "run", "--server", "--addr", "127.0.0.1:8181", rego_path],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    for _ in range(30):
        try:
            resp = httpx.get(f"{opa_url}/health", timeout=0.2)
            if resp.status_code == 200:
                break
        except Exception:
            time.sleep(0.1)

    try:
        yield opa_url
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except Exception:
            proc.kill()

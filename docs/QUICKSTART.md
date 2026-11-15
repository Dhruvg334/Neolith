# Neolith Quickstart Guide

Get the complete Neolith Agentic Decision and Execution System running locally in under **5 minutes**.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.12+** (`python --version`)
- **Node.js 20+** (`node --version`)
- **pnpm 9+** (`pnpm --version` or install via `npm install -g pnpm`)
- **Git** (`git --version`)
- *(Optional)* **Docker Desktop** (only required if running local PostgreSQL and Redis containers; by default, Neolith runs with in-memory SQLite and mock services for instant zero-dependency testing).
- *(Optional)* **Open Policy Agent (OPA) v1.22.2** (if testing policies locally outside Docker).

---

## ⚡ 5-Step Local Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/Dhruvg334/Neolith.git
cd Neolith
```

### Step 2: Set Up Python Virtual Environment
```bash
# On Linux / macOS:
python3.12 -m venv .venv
source .venv/bin/activate
pip install -e "services/api[dev]" -e "services/agent-worker" -e "services/tool-simulator"

# On Windows (cmd / powershell):
python -m venv .venv
.venv\Scripts\activate
pip install -e "services/api[dev]" -e "services/agent-worker" -e "services/tool-simulator"
```

### Step 3: Install Frontend Dependencies
```bash
pnpm install --frozen-lockfile
```

### Step 4: Initialize the Database & Seed Reference Data
```bash
# Set your PYTHONPATH to locate service packages:
# On Linux / macOS:
export PYTHONPATH="services/api/src:services/agent-worker/src:services/tool-simulator/src"
python -m neolith_api.seed

# On Windows (Powershell):
$env:PYTHONPATH="services/api/src;services/agent-worker/src;services/tool-simulator/src"
python -m neolith_api.seed
```

This seeds:
- Organization: `Neolith Finance`
- Primary Operations Account (`INR 100,000.00` available balance)
- Categories & Budgets: `software` (`INR 25,000.00`), `infrastructure` (`INR 50,000.00`), `miscellaneous` (`INR 10,000.00`)
- Canonical Invoices: `INV-001` (Acme Cloud, `INR 8,000.00`), `INV-002` (Nova Compute, `INR 35,000.00`), `INV-003` (Unknown Supplies, `INR 75,000.00`)
- Active Governance Profile: `Balanced Control`

---

## 🚀 Running the Services Locally

### 1. Start the FastAPI Governance Control Plane
```bash
# On Linux / macOS:
python -m uvicorn neolith_api.main:app --app-dir services/api/src --host 0.0.0.0 --port 8000 --reload

# On Windows:
python -m uvicorn neolith_api.main:app --app-dir services\api\src --host 0.0.0.0 --port 8000 --reload
```
API is live at **`http://localhost:8000`** (Swagger docs at `http://localhost:8000/docs`).

### 2. Start the Financial Agent Worker (Optional for in-process mode)
```bash
# On Linux / macOS:
python -m uvicorn neolith_agent.server:app --app-dir services/agent-worker/src --host 0.0.0.0 --port 8010 --reload

# On Windows:
python -m uvicorn neolith_agent.server:app --app-dir services\agent-worker\src --host 0.0.0.0 --port 8010 --reload
```
Worker is live at **`http://localhost:8010`**.

### 3. Start the Next.js Frontend Application
In a separate terminal:
```bash
pnpm dev
```
Website is live at **`http://localhost:3000`**.

---

## 🧪 Verifying the Installation (12 Quality Gates)

Neolith provides a unified cross-platform verification script that executes all 12 mandatory CI quality gates locally:

```bash
python scripts/verify_project.py
```

Expected output:
```text
======================================================================
[1/12] Documentation Check                       -> PASSED
[2/12] Contract & Schema Validation              -> PASSED
[3/12] Ruff Linter Check                         -> PASSED
[4/12] Ruff Formatter Check                      -> PASSED
[5/12] Strict Mypy Typecheck                     -> PASSED
[6/12] Pytest Suite (88 tests)                   -> PASSED
[7/12] OPA Policy Syntax Check                   -> PASSED
[8/12] OPA Policy Tests (15 tests)               -> PASSED
[9/12] Frontend ESLint                           -> PASSED
[10/12] Frontend TypeScript Typecheck            -> PASSED
[11/12] Frontend Production Build (15 routes)    -> PASSED
[12/12] Docker Compose Configuration Validation   -> PASSED
======================================================================
ALL 12 NEOLITH VERIFICATION GATES PASSED SUCCESSFULLY!
======================================================================
```

---

## 🎯 Next Steps

- Follow the **[Demo Walkthrough Guide](DEMO_GUIDE.md)** to execute the 3 canonical financial scenarios.
- Read the **[System Architecture Guide](design/SYSTEM_ARCHITECTURE.md)** for deep technical details.
- Review the **[API Specification](design/API_SPECIFICATION.md)** to explore the 41 OpenAPI endpoints.
- Consult the **[Deployment Guide](DEPLOYMENT.md)** to deploy Neolith on Vercel and Render.

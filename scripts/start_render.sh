#!/usr/bin/env bash
set -euo pipefail

echo "=================================================="
echo " Starting Neolith Hosted Backend on Render"
echo "=================================================="

# 1. Start pinned Open Policy Agent (OPA) co-located on localhost:8181
echo "[1/4] Starting Open Policy Agent (OPA) daemon on 127.0.0.1:8181..."
opa run --server --addr 127.0.0.1:8181 policy/rego &
OPA_PID=$!

# Wait for OPA readiness
echo "[2/4] Waiting for OPA daemon readiness at http://127.0.0.1:8181/health..."
MAX_RETRIES=30
RETRY_COUNT=0
until curl -s -f http://127.0.0.1:8181/health > /dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT+1))
    if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
        echo "Error: OPA daemon failed to respond healthy within 30 seconds."
        kill "$OPA_PID" 2>/dev/null || true
        exit 1
    fi
    sleep 1
done
echo "OPA daemon is healthy and evaluating policies on 127.0.0.1:8181."

# 2. Database migrations and idempotent seed
echo "[3/4] Initializing database schema and deterministic seed..."
if [ -n "${DATABASE_URL:-}" ]; then
    echo "Running Alembic migrations..."
    (cd /app/services/api && alembic upgrade head)
    echo "Alembic migrations completed."

    echo "Running idempotent database seed..."
    python -m neolith_api.seed
    echo "Seed data verified."
else
    echo "DATABASE_URL not set; initializing local schema..."
    python -m neolith_api.seed
fi

# 3. Start FastAPI application with Uvicorn
BIND_PORT="${PORT:-10000}"
echo "[4/4] Starting Uvicorn server on 0.0.0.0:${BIND_PORT}..."
exec uvicorn neolith_api.main:app \
    --app-dir services/api/src \
    --host 0.0.0.0 \
    --port "${BIND_PORT}" \
    --workers 1 \
    --lifespan on \
    --access-log

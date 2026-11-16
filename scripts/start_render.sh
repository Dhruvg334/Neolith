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

# Start background Redis if available (improves readiness probes without external dependency)
if command -v redis-server > /dev/null 2>&1; then
    echo "Starting local Redis daemon on 127.0.0.1:6379..."
    redis-server --daemonize yes --bind 127.0.0.1 --port 6379 --dir /app/data || true
fi

# 2. Database migrations and idempotent seed
echo "[3/4] Initializing database schema and deterministic seed..."

# Determine whether to use external/Render PostgreSQL or fallback to embedded SQLite
USE_SQLITE=0
if [ -z "${DATABASE_URL:-}" ] || [[ "${DATABASE_URL}" == *"localhost"* ]] || [[ "${DATABASE_URL}" == *"127.0.0.1"* ]]; then
    USE_SQLITE=1
fi

if [ "$USE_SQLITE" -eq 1 ]; then
    if [ -n "${DATABASE_URL:-}" ]; then
        echo "Notice: DATABASE_URL points to localhost/127.0.0.1 which is unreachable inside a Render container."
    else
        echo "Notice: DATABASE_URL is not set."
    fi
    echo "Falling back to embedded SQLite database at /app/data/neolith.db..."
    mkdir -p /app/data
    export DATABASE_URL="sqlite+pysqlite:////app/data/neolith.db"

    echo "Running Alembic migrations on SQLite..."
    (cd /app/services/api && alembic upgrade head)
    echo "Alembic migrations completed on SQLite."

    echo "Running idempotent database seed on SQLite..."
    python -m neolith_api.seed
    echo "Local SQLite database verified and seeded."
else
    echo "Connecting to PostgreSQL database..."
    MAX_DB_RETRIES=15
    DB_RETRY=0
    until python -c "from neolith_api.core.database import build_engine; e = build_engine(); conn = e.connect(); conn.close()" > /dev/null 2>&1; do
        DB_RETRY=$((DB_RETRY+1))
        if [ "$DB_RETRY" -ge "$MAX_DB_RETRIES" ]; then
            echo "Warning: Could not connect to PostgreSQL after ${MAX_DB_RETRIES} attempts. Falling back to embedded SQLite database..."
            mkdir -p /app/data
            export DATABASE_URL="sqlite+pysqlite:////app/data/neolith.db"
            USE_SQLITE=1
            break
        fi
        echo "Waiting for PostgreSQL database readiness (attempt ${DB_RETRY}/${MAX_DB_RETRIES})..."
        sleep 2
    done

    if [ "$USE_SQLITE" -eq 1 ]; then
        echo "Running Alembic migrations on SQLite fallback..."
        (cd /app/services/api && alembic upgrade head)
        python -m neolith_api.seed
        echo "SQLite fallback schema initialized and seeded."
    else
        echo "PostgreSQL database connection established."
        echo "Running Alembic migrations..."
        (cd /app/services/api && alembic upgrade head)
        echo "Alembic migrations completed."

        echo "Running idempotent database seed..."
        python -m neolith_api.seed
        echo "PostgreSQL seed data verified."
    fi
fi

# 3. Start FastAPI application with Uvicorn
BIND_PORT="${PORT:-10000}"
export NEOLITH_API_BASE_URL="http://127.0.0.1:${BIND_PORT}/api/v1"
echo "[4/4] Starting Uvicorn server on 0.0.0.0:${BIND_PORT}..."
exec uvicorn neolith_api.main:app \
    --app-dir services/api/src \
    --host 0.0.0.0 \
    --port "${BIND_PORT}" \
    --workers 1 \
    --lifespan on \
    --access-log

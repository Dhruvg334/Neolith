# Production Dockerfile for Neolith API on Render Free Web Service
# Single container packaging FastAPI backend + pinned OPA 1.22.2 daemon (512 MB RAM footprint)
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=10000 \
    APP_ENV=production \
    NEOLITH_AGENT_EXECUTION_MODE=in_process \
    OPA_URL=http://127.0.0.1:8181 \
    OPA_DECISION_PATH=/v1/data/neolith/decision/result \
    PYTHONPATH="/app/services/api/src:/app/services/agent-worker/src:/app/services/tool-simulator/src"

WORKDIR /app

# Install system dependencies: curl for OPA download and healthchecks, ca-certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install pinned Open Policy Agent (OPA) 1.22.2 static binary for AMD64
RUN curl -L -s -o /usr/local/bin/opa https://openpolicyagent.org/downloads/v1.22.2/opa_linux_amd64_static \
    && chmod 755 /usr/local/bin/opa \
    && opa version

# Copy Python dependency manifest and install dependencies
COPY requirements.lock pyproject.toml ./
RUN pip install -r requirements.lock

# Copy application source code and OPA policies
COPY services/ ./services/
COPY policy/ ./policy/
COPY specs/ ./specs/
COPY scripts/ ./scripts/
COPY README.md ./

# Install local package wheels/editable without reinstalling dependencies
RUN pip install --no-deps -e services/agent-worker -e services/api -e services/tool-simulator

# Ensure startup script is executable
RUN chmod +x scripts/start_render.sh

# Create non-root user and assign ownership
RUN useradd -m -u 1000 neolith && chown -R neolith:neolith /app
USER neolith

EXPOSE 10000

ENTRYPOINT ["/bin/bash", "scripts/start_render.sh"]

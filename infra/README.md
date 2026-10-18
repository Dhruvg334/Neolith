# Local Infrastructure

This folder starts the external dependencies needed before application code exists.

## Requirements

- Docker Desktop
- Git
- Python 3.12+
- Node.js 22+
- pnpm

## Start

Windows Command Prompt:

```cmd
docker compose -f infra\docker-compose.yml up -d
```

## Check

```cmd
docker compose -f infra\docker-compose.yml ps
```

OPA:

```cmd
curl http://localhost:8181/health
```

Jaeger:

```text
http://localhost:16686
```

Before final deployment, pin exact container versions/digests instead of relying on moving tags.

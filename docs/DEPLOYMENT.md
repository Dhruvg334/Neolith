# Neolith Hosted Deployment Guide

This guide details the procedure for deploying the Neolith Governance Runtime and Financial Reference Application to production cloud infrastructure:

- **Frontend**: [Vercel](https://vercel.com) (Next.js 15 App Router)
- **Backend**: [Render Free Web Service](https://render.com) (FastAPI + Co-located Pinned OPA 1.22.2 in a single Docker container)
- **Database**: [Render PostgreSQL](https://render.com) or any external PostgreSQL instance via `DATABASE_URL`

---

## 1. Architecture Overview

```
                      ┌───────────────────────────────────────────────┐
                      │              Vercel Edge Network              │
                      │   apps/web (Next.js 15, React 19, TypeScript)  │
                      └──────────────────────┬────────────────────────┘
                                             │ HTTPS REST
                                             ▼
                      ┌───────────────────────────────────────────────┐
                      │           Render Free Web Service             │
                      │               (neolith-api)                   │
                      │  ┌──────────────────────┐  127.0.0.1:8181     │
                      │  │  FastAPI (Uvicorn)   │ ◄────────────────►  │
                      │  │   in_process mode    │   Pinned OPA 1.22.2 │
                      │  └──────────┬───────────┘    Policy Engine    │
                      └─────────────┼─────────────────────────────────┘
                                    │ TLS
                                    ▼
                      ┌───────────────────────────────────────────────┐
                      │            Render PostgreSQL                  │
                      │               (neolith-db)                    │
                      └───────────────────────────────────────────────┘
```

### Key Architectural Decisions
1. **Single Render Service Footprint**: FastAPI and pinned OPA 1.22.2 are co-located in the same lightweight Docker container (0.1 CPU, 512 MB RAM). OPA binds exclusively to `127.0.0.1:8181` and is never exposed to the public Internet.
2. **In-Process Agent Execution**: Under `NEOLITH_AGENT_EXECUTION_MODE=in_process`, the Financial AI Agent runs within the FastAPI process lifecycle, eliminating the need for a separate worker host on free hosting tiers.
3. **Multi-Channel Interfaces**: Web, WhatsApp (Twilio), and Voice (ElevenLabs) flow through the exact same Runtime Gateway and OPA policy evaluation rules.
4. **URL Normalization**: The frontend client automatically normalizes trailing slashes and prevents duplicate `/api/v1` prefixes.

---

## 2. Render Backend & Database Deployment

You can deploy the backend using the included Blueprint (`render.yaml`) or manually through the Render Dashboard.

### Option A: Deploy via Blueprint (Recommended)
1. Fork or push the repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com), navigate to **Blueprints** &rarr; **New Blueprint Instance**.
3. Connect your GitHub repository.
4. Render will parse `render.yaml` and provision:
   - Web Service: `neolith-api` (Docker runtime)
   - PostgreSQL: `neolith-db` (Free tier)
5. Fill in the required secret environment variables marked with `sync: false` (see Section 4).
6. Click **Apply**.

### Option B: Manual Setup on Render
1. **Create PostgreSQL Database**:
   - In Render Dashboard, click **New** &rarr; **PostgreSQL**.
   - Name: `neolith-db`
   - Database: `neolith`
   - User: `neolith`
   - Plan: **Free**
   - Click **Create Database**. Copy the **Internal Connection String**.
2. **Create Web Service**:
   - Click **New** &rarr; **Web Service**.
   - Connect your repository.
   - Name: `neolith-api`
   - Environment: **Docker**
   - Dockerfile Path: `./Dockerfile`
   - Docker Context: `.`
   - Plan: **Free**
   - Health Check Path: `/api/v1/health`
3. **Configure Environment Variables** on the web service (see Section 4).

---

## 3. Vercel Frontend Deployment

1. In the [Vercel Dashboard](https://vercel.com/dashboard), click **Add New...** &rarr; **Project**.
2. Import your Neolith repository.
3. Configure Project Settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click Edit, select `apps/web`.
   - **Build and Output Settings**:
     - *Build Command*: `cd ../.. && pnpm --filter @neolith/web build`
     - *Install Command*: `cd ../.. && pnpm install --frozen-lockfile`
     - *Output Directory*: Next.js default (`.next`)
4. Configure Environment Variables:
   - `NEXT_PUBLIC_API_BASE_URL`: `https://neolith-api.onrender.com/api/v1` (replace with your Render service URL)
   - `NEXT_PUBLIC_WHATSAPP_NUMBER`: (Optional) e.g., `+14155238886`
   - `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`: (Optional) Your ElevenLabs Conversational AI Agent ID
5. Click **Deploy**.

---

## 4. Environment Variables Reference

### Backend (Render Web Service)

| Variable | Description | Example / Default | Required |
| :--- | :--- | :--- | :--- |
| `APP_ENV` | Application environment | `production` | Yes |
| `PORT` | HTTP port provided dynamically by Render | `10000` | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Formatted by Render | Yes |
| `NEOLITH_AGENT_EXECUTION_MODE` | Agent worker execution mode | `in_process` | Yes |
| `NEOLITH_FINANCIAL_DATA_MODE` | Financial ledger source | `api` | Yes |
| `OPA_URL` | Local OPA daemon address | `http://127.0.0.1:8181` | Yes |
| `OPA_DECISION_PATH` | Rego decision rule path | `/v1/data/neolith/decision/result` | Yes |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed frontend origins | `https://your-neolith.vercel.app` | Yes |
| `LLM_PROVIDER` | LLM backend for planning agent | `openai` or `mock` | Yes |
| `LLM_API_KEY` | OpenAI API key (if `LLM_PROVIDER=openai`) | `sk-...` | Conditional |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID for WhatsApp | `AC...` | Optional |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token for HMAC webhook verification | `...` | Optional |
| `TWILIO_WHATSAPP_FROM` | Twilio WhatsApp sender address | `whatsapp:+14155238886` | Optional |
| `TWILIO_WHATSAPP_WEBHOOK_PUBLIC_URL` | Public webhook URL for Twilio callback verification | `https://neolith-api.onrender.com/api/v1/twilio/whatsapp/webhook` | Optional |
| `ELEVENLABS_CUSTOM_LLM_BEARER_TOKEN` | Shared secret protecting Custom LLM endpoint | `random-secure-secret` | Optional |
| `ELEVENLABS_CUSTOM_LLM_MODEL_ID` | Model identifier expected by ElevenLabs | `gpt-4o-mini` | Optional |

> [!CAUTION]
> Never set `ELEVENLABS_CUSTOM_LLM_BEARER_TOKEN` or Twilio secrets in frontend Vercel settings or code. They must remain exclusively server-side on Render.

### Frontend (Vercel)

| Variable | Description | Example | Public? |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | Render backend API endpoint | `https://neolith-api.onrender.com/api/v1` | Yes |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Contact number for WhatsApp wa.me link | `+14155238886` | Yes |
| `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` | Public ElevenLabs Conversational AI Agent ID | `agent_xyz123` | Yes |

---

## 5. Multi-Channel Configuration

### WhatsApp Integration (Twilio)
1. In the [Twilio Console](https://console.twilio.com), navigate to **Messaging** &rarr; **Try WhatsApp**.
2. Set the Sandbox / Phone Number Webhook URL:
   `https://<your-render-service>.onrender.com/api/v1/twilio/whatsapp/webhook`
3. Set HTTP method to `POST`.
4. Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, and `TWILIO_WHATSAPP_WEBHOOK_PUBLIC_URL` to Render environment variables.

### Voice Integration (ElevenLabs)
1. In the [ElevenLabs Dashboard](https://elevenlabs.io), create a new **Conversational AI Agent**.
2. Under **LLM Configuration**, select **Custom LLM**:
   - URL: `https://<your-render-service>.onrender.com/api/v1/elevenlabs/chat/completions`
   - Authorization: Bearer Token matching `ELEVENLABS_CUSTOM_LLM_BEARER_TOKEN` on Render.
3. In Agent Security settings, add your Vercel deployment domain (e.g. `https://your-neolith.vercel.app`) to allowed domains.
4. Copy the Agent ID from ElevenLabs and set it as `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` in Vercel.

---

## 6. Cold Starts & Lifecycle Behavior

Render Free web services spin down after 15 minutes of inbound HTTP inactivity.

- **Wake-up Time**: Cold starts take approximately 15 to 40 seconds.
- **Frontend Graceful Handling**: When a cold start occurs, the Neolith web interface displays a clear, polite **"Starting secure service"** indicator with an automatic retry mechanism. It never shows unformatted exceptions or false mock financial records.
- **Render PostgreSQL Expiry Note**: Render Free PostgreSQL instances currently expire 30 days after creation. For permanent deployments, attach a managed database or supply an external `DATABASE_URL` (Supabase, Neon, AWS RDS, etc.).

---

## 7. Database Migrations & Idempotent Seeding

The container entrypoint (`scripts/start_render.sh`) manages migrations automatically on startup:

```bash
# 1. Background daemon starts and health-checked
opa run --server --addr 127.0.0.1:8181 policy/rego &

# 2. Database schema upgraded to latest revision
alembic upgrade head

# 3. Deterministic initial seed verified idempotently
python -m neolith_api.seed

# 4. FastAPI bound to 0.0.0.0:$PORT
exec uvicorn neolith_api.main:app --host 0.0.0.0 --port "${PORT:-10000}"
```

If `DATABASE_URL` uses `postgres://` or `postgresql://`, Neolith automatically converts the scheme to `postgresql+psycopg://` for SQLAlchemy 2.0 compatibility.

---

## 8. Deployment Troubleshooting

| Symptom | Cause | Resolution |
| :--- | :--- | :--- |
| `CORS Error / Preflight 400` | Vercel domain not in `CORS_ALLOWED_ORIGINS` | Add your Vercel production and preview URLs to `CORS_ALLOWED_ORIGINS` on Render (comma-separated). |
| `OPA_SERVICE_UNAVAILABLE` | OPA daemon failed to start on `127.0.0.1:8181` | Check Render logs. Verify pinned binary downloaded correctly during Docker build. |
| `502 / 503 Bad Gateway` on Render | Service cold start or memory threshold exceeded | Free tier offers 512 MB. Verify workers count is set to 1. Allow 30 seconds for cold start. |
| Voice widget shows domain error | Vercel domain not whitelisted in ElevenLabs | Add Vercel production domain to allowed domains in ElevenLabs agent security settings. |
| Database driver error | URL format not recognized | Neolith normalizes `postgres://` automatically; ensure `psycopg` is installed via `requirements.lock`. |

---

## 9. Pre-Flight Deployment Checklist

- [ ] Repository working tree is clean.
- [ ] Local tests and quality gates pass (`python scripts/verify_project.py`).
- [ ] Next.js production build succeeds (`pnpm build`).
- [ ] `render.yaml` checked into repository root.
- [ ] `Dockerfile` and `scripts/start_render.sh` checked into repository.
- [ ] Vercel Root Directory set to `apps/web`.
- [ ] `CORS_ALLOWED_ORIGINS` on Render matches Vercel production URL.
- [ ] No secret tokens committed to source code or git history.
- [ ] Health check verified at `GET https://<service>.onrender.com/api/v1/health`.

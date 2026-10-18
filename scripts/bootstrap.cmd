@echo off
setlocal

echo [Neolith] Checking required tools...

where git >nul 2>&1 || (echo Git not found & exit /b 1)
where python >nul 2>&1 || (echo Python not found & exit /b 1)
where node >nul 2>&1 || (echo Node.js not found & exit /b 1)
where docker >nul 2>&1 || (echo Docker not found & exit /b 1)

echo [Neolith] Creating local secret folder...
if not exist .secrets mkdir .secrets

echo [Neolith] Copying environment template...
if not exist .env copy .env.example .env >nul

echo [Neolith] Starting infrastructure...
docker compose -f infra\docker-compose.yml up -d
if errorlevel 1 exit /b 1

echo [Neolith] Foundation dependencies started.
echo Next: initialise apps/web and services/api during Roadmap Phase 0.
endlocal

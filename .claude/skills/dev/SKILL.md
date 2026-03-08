---
name: dev
description: Start the local development environment. Builds and runs backend services (MySQL, Redis, auth, stock, watchlist) via Docker Compose, then starts the React frontend with npm start.
disable-model-invocation: true
user-invocable: true
allowed-tools: Bash
argument-hint: [optional: backend | frontend | all (default)]
---

# Local Development Environment

Start the local dev environment for the portfolio app.

## Arguments

- No argument or `all` (default): Start backend + frontend
- `backend`: Start only backend services (Docker)
- `frontend`: Start only frontend (assumes backend is already running)

## Steps

### 1. Backend (Docker Compose with backend profile)

Skip this step if `$ARGUMENTS` is `frontend`.

```bash
cd /Users/tunahan.yazar/Desktop/portfolio_app
docker-compose --profile backend up --build -d
```

This starts:
- **MySQL** (port 3306) — database
- **Redis** (port 6379) — cache
- **Auth Service** (port 8000) — authentication/JWT
- **Stock Service** (port 8001) — stock data, portfolios, financials
- **Watchlist Service** (port 8002) — watchlist management, WebSocket alerts

Wait for all containers to be healthy before proceeding. Verify with:
```bash
docker-compose --profile backend ps
```

### 2. Frontend (local React dev server)

Skip this step if `$ARGUMENTS` is `backend`.

```bash
cd /Users/tunahan.yazar/Desktop/portfolio_app/frontend
npm start
```

Run `npm start` in the background so it doesn't block. The React dev server runs on http://localhost:3000.

### 3. Health Check

After everything is up, verify services are reachable:
- Auth API: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs`
- Stock API: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/docs`
- Watchlist API: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8002/docs`

Report the status of each service to the user.

## Notes
- Backend services use `localhost` URLs when frontend runs locally (not Docker networking)
- Frontend `.env` should have `REACT_APP_*_API` pointing to `http://localhost:800X`
- If a port is already in use, report which service conflicts

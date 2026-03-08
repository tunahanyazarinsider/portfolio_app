# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Portfolio Management Application** - A full-stack fintech app for managing investment portfolios with real-time stock data, financial analytics, and portfolio tracking. This is a **read-heavy application** optimized with Redis caching.

**Tech Stack**: React 19 + FastAPI (3 microservices) + MySQL + Redis + Docker

---

## Architecture

### Microservices Layout

```
Frontend (React) :3000
    ↓
Three FastAPI Services (ports 8000, 8001, 8002):
  • Auth Service     :8000  (user authentication/JWT)
  • Stock Service    :8001  (stock data, portfolios, financial analytics)
  • Watchlist Service :8002 (watchlist management, WebSocket alerts)
    ↓
MySQL Database :3306 + Redis Cache :6379
```

### Key Architectural Patterns

**1. Microservices Communication**
- Frontend calls individual backend services directly via HTTP
- Each service has its own database schema (shared MySQL database, separate tables)
- No inter-service communication; frontend orchestrates

**2. Performance Optimization (Phase 1 Complete)**
- **Redis Cache**: 10-minute TTL for stock prices, info, and financial data
- **Cache-Aside Pattern**: Check Redis → cache hit returns data, cache miss fetches from Yahoo Finance → stores in Redis
- **Combined Endpoints**: `/api/stocks/with-prices` endpoint combines stock info + current price + pagination to eliminate N+1 queries
- **Pagination**: All stock lists paginated (10 items per page) to reduce initial load

**3. Frontend Data Fetching**
- Services layer (`frontend/src/services/`) handles all API calls
- Centralized error handling via `PrivateRoute` wrapper (JWT validation)
- Theme system uses Material-UI with custom color palette

---

## Development Setup

### Prerequisites
- Docker & Docker Compose
- Node.js 16+ (for local frontend dev)
- Python 3.11+ (for local backend dev)

### Running the Application

**Full Stack (Docker)**
```bash
docker-compose up --build
# Frontend:     http://localhost:3000
# Auth API:     http://localhost:8000/docs
# Stock API:    http://localhost:8001/docs
# Watchlist API: http://localhost:8002/docs
```

**Frontend Only (Local React Dev)**
```bash
cd frontend
npm install
npm start
# Access: http://localhost:3000
# Make sure backend services are running (either Docker or local)
```

**Single Backend Service (Local)**
```bash
cd Backend/stock_service
python3 -m venv venv
source venv/bin/activate
pip install -r ../../requirements.txt
python3 main.py
# Service runs on http://localhost:8001
```

---

## Common Development Tasks

### Building & Deployment

**Build Frontend**
```bash
cd frontend && npm run build
# Output: frontend/build/
```

**Build Docker Images**
```bash
docker-compose build
# Rebuilds all services defined in docker-compose.yml
```

### Database Management

**Access MySQL**
```bash
docker exec -it portfolio_mysql mysql -u root -proot Portfolio_Management
# Query: SELECT * FROM stocks;
# Update: UPDATE users SET role = 'admin' WHERE username = 'testuser';
```

**Check Redis Cache**
```bash
docker exec -it portfolio_redis redis-cli
# Commands: KEYS * | GET stock_price:AAPL.IS | TTL stock_price:AAPL.IS | FLUSHDB
# See REDIS_GUIDE.md for detailed cache operations
```

### Viewing Logs

**Backend Service Logs**
```bash
docker logs -f stock_service    # Real-time logs from stock service
docker logs -f auth_service     # Auth service logs
docker logs -f watchlist_service
```

**Frontend Build/Debug**
```bash
# In browser console or React DevTools
# Check network tab for API calls
# Verify JWT token: localStorage.getItem('token')
```

---

## Key Files & Modules

### Frontend Structure

**Routing** (`frontend/src/AppContent.js`)
- Route `/stocks/:symbol` → StockPage (individual stock detail)
- Route `/stocks` → AllStocksPage (stock screener with pagination)
- Route `/portfolios/:id` → PortfolioPage (portfolio details)
- All routes protected with `<PrivateRoute>` (JWT validation)

**Services Layer** (`frontend/src/services/`)
- `stockService.js`: API calls to stock service (getStocksWithPrices, getStockInfo, etc.)
- `authService.js`: Login/register/token management
- `portfolioService.js`: Portfolio CRUD operations
- `newsService.js`: News data fetching

**Components** (`frontend/src/components/`)
- `TechnicalAnalysisChart.jsx`: TradingView widget integration (updates on symbol/theme changes)
- `StockPriceSection.jsx`: Stock price display with time range selector
- `PrivateRoute.jsx`: JWT validation wrapper for protected routes
- `Navbar.jsx` & `BottomNavbar.jsx`: Navigation UI

**Pages** (`frontend/src/pages/`)
- `AllStocksPage.jsx`: Stock screener with pagination (Phase 1: uses `/with-prices` endpoint)
- `StockPage.jsx`: Detailed stock view with financial charts and TradingView widget
- `PortfolioPage.jsx`: Portfolio holdings and performance
- `LoginPage.jsx` & `RegisterPage.jsx`: Authentication

### Backend Structure (FastAPI Microservices)

**Stock Service** (`Backend/stock_service/`)
- `main.py`: FastAPI app initialization, CORS, table creation
- `controllers/stock_controller.py`: API endpoints
  - `GET /api/stocks/with-prices?page=X&limit=Y` (Phase 1: combined endpoint with pagination)
  - `GET /api/stocks/{symbol}/price` (current price, cached)
  - `GET /api/stocks/{symbol}/info` (stock info from Yahoo Finance)
  - `GET /api/stocks/financials/{symbol}` (income statements, cached)
  - etc.
- `services/stock_service.py`: Business logic, Yahoo Finance integration
- `models/models.py`: SQLAlchemy ORM models (Stock, StockPrice, Portfolio, etc.)
- `models/pydantic_models.py`: Request/response validation
  - `StockWithPriceResponse`: Stock + current price (Phase 1)
  - `PaginatedStockResponse`: Paginated wrapper with metadata
- `utils/cache.py`: Redis wrapper (get_cache, set_cache, delete_cache)
- `utils/db_context.py`: Database connection & session management

**Authentication Service** (`Backend/authentication_service/`)
- `main.py`: FastAPI initialization
- `controllers/auth_controller.py`: Login, register, token endpoints
- `services/auth_service.py`: JWT generation, password hashing
- `models/models.py`: User & Role models

**Watchlist Service** (`Backend/watchlist_service/`)
- Similar structure to Stock Service
- WebSocket support for real-time alerts

### Important Files

**Docker**
- `docker-compose.yml`: Service definitions, networking, environment variables
- `Backend/*/Dockerfile`: Service-specific builds (Python 3.11, pip install)
- `frontend/Dockerfile`: Multi-stage React build

**Environment**
- `.env`: Database URL, Redis URL, API endpoints (Docker uses these)
- `requirements.txt`: Python dependencies (consolidated at project root, shared by all services)

**Documentation**
- `README.md`: Setup, architecture, API endpoints
- `REDIS_GUIDE.md`: Redis caching strategy, key patterns, monitoring
- `CLAUDE.md` (this file): Development guidance for Claude Code

---

## Important Implementation Details

### Phase 1 Performance Optimization (Completed)

**Problem**: N+1 query issue when loading all stocks
- 6 stocks = 1 request (all stocks) + 6 requests (individual prices) + 6 redirects (307) = ~19 total requests

**Solution Implemented**:
1. **Fixed 307 Redirects** in stock_controller.py: Added dual decorators for `/prices` and `/prices/` routes
2. **Created Combined Endpoint**: `GET /api/stocks/with-prices?page=1&limit=10`
   - Location: `stock_controller.py:27-93`
   - Returns: `{ data: [...], total: N, page: N, pages: N, limit: N }`
   - Each stock includes current_price fetched from Redis cache (10-min TTL)
3. **Updated Frontend**:
   - AllStocksPage.jsx uses `getStocksWithPrices()` instead of `getAllStocksDetailed()` + individual calls
   - Pagination state manages page navigation
   - Previous/Next buttons control data loading

**Result**:
- 6 stocks: 19 requests → 1 request (19x faster)
- 100 stocks: 201 requests → ~10 requests (20x faster, 10 pages × 10 items)

### Caching Strategy

**Redis Integration** (`Backend/stock_service/utils/cache.py`)
- Global instance: `cache = RedisCache()`
- Methods: `get_cache(key)`, `set_cache(key, value, ttl=600)`, `delete_cache(key)`, `flush_all()`
- All stock prices are cached with 10-minute TTL
- Key pattern: `stock_price:{SYMBOL}`, `stock_info:{SYMBOL}`, etc.
- Gracefully handles Redis connection failures (cache disabled if Redis unavailable)

**Stock Service Usage**:
- `get_current_stock_price()`: Checks cache first → cache hit = instant return, cache miss = fetch from Yahoo Finance + store in Redis
- `get_stock_info()`: Same cache-aside pattern
- Used automatically in combined endpoint `/with-prices`

### Bug Fixes (Recent)

**1. Stock Page White Screen on Direct Navigation**
- **Cause**: Two conflicting `useEffect` hooks in StockPage.jsx
- **Fix**: Consolidated into single effect for symbol changes, separate effect for dateRange only
- **Location**: `frontend/src/pages/StockPage.jsx:178` (main data fetch), `469` (chart data on dateRange change)

**2. TradingView Chart Shows Wrong Stock**
- **Cause**: useEffect with empty dependency array `[]` - never re-ran on symbol change
- **Fix**: Added dependencies `[symbol, themeMode, chartType]`
- **Location**: `frontend/src/components/TechnicalAnalysisChart.jsx:57`

---

## Common Debugging Scenarios

**Stock not appearing after adding via API**
- Check: Was user an admin when adding? (`role = 'admin'` in users table)
- Verify: Stock symbol is uppercase and valid (BIMAS, not bimas)
- Check cache: `docker exec -it portfolio_redis redis-cli KEYS stock_*`

**"307 Temporary Redirect" errors in logs**
- This was Phase 1 fix - should no longer occur
- If seen, endpoint needs dual route decorators: `@router.get("/{symbol}/prices")` + `@router.get("/{symbol}/prices/")`

**Chart data not updating when changing date range**
- Verify: dateRange state changes trigger useEffect in StockPage
- Check: `fetchChartData()` function properly updates `chartData` state
- Ensure: Chart component re-renders when state changes

**Redis cache not working**
- Verify Redis is running: `docker ps | grep portfolio_redis`
- Check connection string in stock_service: `REDIS_URL=redis://redis:6379/0`
- Test cache: `docker exec -it portfolio_redis redis-cli ping` (should return PONG)
- Monitor: `docker logs -f stock_service | grep "Cache"`

**Frontend can't reach backend**
- In Docker: Services use container names (e.g., `http://stock-service:8001`)
- Locally: Use `localhost` (e.g., `http://localhost:8001`)
- Check `.env` file and `docker-compose.yml` REACT_APP_* variables

---

## Important Conventions

**Import Paths**
- Backend: Relative imports from service root (e.g., `from models.models import Stock`)
- Frontend: Absolute paths from `src/` (e.g., `import stockService from '../services/stockService'`)

**Module Structure**
- Each backend service has: `controllers/`, `services/`, `models/`, `utils/` directories
- Each directory has `__init__.py` to make it a Python package
- Services layer handles business logic; controllers handle HTTP/routing

**Database**
- SQLAlchemy ORM in `models.py`
- All services share same MySQL database
- Use `get_db()` dependency injection in FastAPI routes for session management

**Response Models**
- All API responses validated with Pydantic models in `pydantic_models.py`
- New endpoints should define both request and response models
- Use `response_model=ModelClass` in route decorators

---

## Future Enhancement Phases

**Phase 2**: UI pagination refinement
- Add page number selector (jump to page N)
- Display items per page dropdown
- Preserve pagination state during navigation

**Phase 3**: Lazy loading with Intersection Observer
- Load stock prices only when they become visible
- Client-side cache for already-loaded prices
- Reduce initial load further (from 10 pages to 1-2 pages)

**Phase 4+**: Advanced features
- Portfolio performance analytics
- Risk analysis (Sharpe ratio, volatility)
- Machine learning predictions
- Mobile app (React Native)

---

## Resources

- **Docker Compose**: https://docs.docker.com/compose/
- **FastAPI**: https://fastapi.tiangolo.com/
- **React**: https://react.dev/
- **Material-UI**: https://mui.com/
- **SQLAlchemy**: https://docs.sqlalchemy.org/
- **Redis**: https://redis.io/docs/ (also see REDIS_GUIDE.md)
- **yfinance**: https://yfinance.readthedocs.io/


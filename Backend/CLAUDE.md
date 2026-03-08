# Backend CLAUDE.md — Coding Agent Guide

This file gives Claude Code full context to work on the backend without needing to explore.

---

## Architecture

3 FastAPI microservices sharing one MySQL database + Redis cache. No inter-service communication.

```
Auth Service     :8000  → users, roles, JWT tokens
Stock Service    :8001  → stocks, portfolios, financials, prices (yfinance + Redis cache)
Watchlist Service :8002  → watchlists, WebSocket alerts
```

---

## Service Structure (All Services Follow This)

```
Backend/<service_name>/
├── main.py                      # FastAPI app, CORS, router include, table creation
├── Dockerfile                   # Python 3.11, pip install from local requirements.txt
├── requirements.txt             # Service-specific dependencies only
├── __init__.py
├── controllers/
│   ├── __init__.py
│   └── <name>_controller.py     # API routes (APIRouter with prefix)
├── services/
│   ├── __init__.py
│   └── <name>_service.py        # Business logic class, takes db session
├── models/
│   ├── __init__.py
│   ├── models.py                # SQLAlchemy ORM models (shared DB)
│   └── pydantic_models.py       # Request/response validation (or watchlist_schemas.py)
└── utils/
    ├── __init__.py
    ├── db_context.py            # Engine, Base, SessionLocal, get_db()
    └── ...                      # cache.py, authentication_utils.py, websocket_manager.py
```

---

## How to Add a New Endpoint (Pattern)

### 1. Pydantic model (`models/pydantic_models.py`)
```python
class MyRequest(BaseModel):
    stock_symbol: str

class MyResponse(BaseModel):
    field: Optional[Decimal]
    class Config:
        from_attributes = True
```

### 2. Service method (`services/<name>_service.py`)
```python
class StockService:
    def __init__(self, db: Session):
        self.db = db

    def my_method(self, symbol: str):
        # Business logic here
        # Use self.db for SQLAlchemy queries
        # Use yf.Ticker(symbol + ".IS") for Yahoo Finance
        # Use cache.get_cache() / cache.set_cache() for Redis
        pass
```

### 3. Controller route (`controllers/<name>_controller.py`)
```python
from models.pydantic_models import MyRequest, MyResponse

@router.get("/my-endpoint/{symbol}", response_model=MyResponse)
def my_endpoint(symbol: str, db: Session = Depends(get_db)):
    service = StockService(db)
    result = service.my_method(symbol)
    if not result:
        raise HTTPException(status_code=404, detail="Not found")
    return result
```

### 4. If new DB table needed (`models/models.py`)
```python
class MyTable(Base):
    __tablename__ = "my_table"
    id = Column(Integer, primary_key=True, autoincrement=True)
    stock_symbol = Column(String(10), ForeignKey('stocks.stock_symbol'), nullable=False)
    # ... columns
    stock = relationship("Stock", back_populates="my_relation")
```
Then add `my_relation = relationship("MyTable", back_populates="stock")` to the Stock class.

---

## Database Models (stock_service/models/models.py)

All services share the same MySQL database `Portfolio_Management`.

| Table | Primary Key | Key Columns |
|---|---|---|
| `users` | user_id (auto) | username, email, password, role (admin/user/moderator) |
| `sectors` | sector_id (auto) | name |
| `stocks` | stock_symbol (str) | name, sector_id (FK), market_cap |
| `financials` | id (auto) | stock_symbol (FK), quarter, revenue, gross_profit, operating_income, net_profit, eps, operating_margin |
| `balance_sheets` | id (auto) | stock_symbol (FK), quarter, total_assets, total_liabilities, total_equity, current_assets, current_liabilities |
| `cash_flows` | id (auto) | stock_symbol (FK), quarter, operating_cash_flow, investing_cash_flow, financing_cash_flow, free_cash_flow, capital_expenditures |
| `dividends` | id (auto) | stock_symbol (FK), payment_date, amount |
| `stock_prices` | price_id (auto) | stock_symbol (FK), date, close_price |
| `portfolios` | portfolio_id (auto) | user_id (FK), name |
| `portfolio_holdings` | holding_id (auto) | portfolio_id (FK), stock_symbol (FK), quantity, average_price |

**Relationships:** User → Portfolios → Holdings → Stock → Financials/BalanceSheets/CashFlows/Dividends/Prices. Stock → Sector.

---

## Key Patterns

### Database Access
```python
from utils.db_context import get_db
# In routes: db: Session = Depends(get_db)
# In services: self.db.query(Stock).filter(Stock.stock_symbol == symbol).first()
```

### Redis Cache (stock_service only)
```python
from utils.cache import cache

# Cache-aside pattern:
cached = cache.get_cache(f"stock_price:{symbol}")
if cached:
    return cached
result = fetch_from_yahoo()
cache.set_cache(f"stock_price:{symbol}", result, ttl=600)  # 10 min
return result
```

### Yahoo Finance
```python
import yfinance as yf
# BIST stocks need .IS suffix
stock = yf.Ticker(f"{symbol.upper()}.IS")
info = stock.info           # Dict with all stock details
history = stock.history(start="2025-01-01", end="2025-12-31")  # DataFrame with Open, High, Low, Close, Volume
financials = stock.quarterly_income_stmt    # Income statement
balance = stock.quarterly_balance_sheet     # Balance sheet
cashflow = stock.quarterly_cashflow         # Cash flow
```

### CORS Setup (main.py)
```python
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_methods=["*"], allow_headers=["*"])
```

### Authentication (stock_service)
```python
from utils.authentication_utils import verify_role
# In protected routes: username: str = Depends(verify_role)
# verify_role checks JWT token from Authorization header
```

---

## Existing Endpoints

### Auth Service (:8000) — prefix `/api/auth`
- `POST /register` — register user
- `POST /login` — login, returns JWT
- `GET /verify` — verify token

### Stock Service (:8001) — prefix `/api/stocks`
- `GET /with-prices?page=1&limit=10` — paginated stocks + current prices
- `GET /{symbol}` — stock info from DB
- `GET /{symbol}/info` — detailed info from Yahoo Finance
- `GET /{symbol}/price` — current price (cached)
- `GET /{symbol}/prices` — predefined date prices
- `POST /prices-range` — price in date range `{ stock_symbol, start_date, end_date }`
- `POST /ohlc-range` — OHLC candlestick data `{ stock_symbol, start_date, end_date }` → `[{ time, open, high, low, close, volume }]`
- `GET /financials/{symbol}` — income statement quarters
- `GET /balance-sheet/{symbol}` — balance sheet quarters
- `GET /cash-flow/{symbol}` — cash flow quarters
- `GET /search/{query}` — search stocks
- `GET /sectors-all/{symbol}` — all sectors
- `GET /sector-info/{sector_id}` — sector details + top companies
- `GET /sector/{symbol}` — sector of a stock
- `POST /` — create stock (admin only)
- Portfolio CRUD: `POST /portfolios`, `GET /portfolios/{id}`, `GET /portfolios/user/{id}`, `GET /portfolios/{id}/holdings`, `POST /portfolios/{id}/add/holdings`, `PUT /portfolios/holdings/decrease/{id}`, `DELETE /portfolios/holdings/delete/{id}`
- Data ingestion (admin): `POST /add-income-statement`, `POST /add-balance-sheet`, `POST /add-cash-flow`, `POST /add-dividend`

### Watchlist Service (:8002) — prefix `/api/watchlists`
- Watchlist CRUD + WebSocket alerts

---

## Running

```bash
# Full backend via Docker
docker-compose --profile backend up --build

# Single service locally
cd Backend/stock_service
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python3 main.py  # runs on :8001

# Access DB
docker exec -it portfolio_mysql mysql -u root -proot Portfolio_Management

# Check Redis
docker exec -it portfolio_redis redis-cli
KEYS *
GET stock_price:THYAO
```

---

## Important Notes

- Stock symbols are **uppercase** in DB (e.g., `THYAO`, `BIMAS`, `AGHOL`)
- Yahoo Finance uses `.IS` suffix for BIST stocks (e.g., `THYAO.IS`)
- All financial values stored as `DECIMAL(20, 2)` — big numbers in Turkish Lira
- Redis TTL is 600 seconds (10 minutes) for all cached data
- Each service has its own `requirements.txt` — keep them minimal
- Tables auto-create on startup via `Base.metadata.create_all()`
- Dual route decorators (`/path` and `/path/`) prevent 307 redirects

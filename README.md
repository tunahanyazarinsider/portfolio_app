# Portfolio Management Application

A modern, full-stack web application for managing investment portfolios with real-time stock data, financial analytics, and portfolio performance tracking.

## 🎯 Overview

This is a **read-heavy fintech application** designed to provide users with comprehensive portfolio management capabilities, including:
- Real-time stock prices and market data
- Portfolio creation and management
- Financial analytics (income statements, balance sheets, cash flows)
- Watchlist monitoring with price alerts
- Sector analysis and stock comparisons
- Dark/Light theme support

**Tech Stack**: React 19 + FastAPI + MySQL + Redis + Docker

---

## 🏗️ Architecture

### System Design
```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│                      Port: 3000                              │
└────────────────────┬────────────────────────────────────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
┌────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
│   Auth    │  │  Stock    │  │ Watchlist │
│ Service   │  │  Service  │  │ Service   │
│ :8000     │  │ :8001     │  │ :8002     │
└────┬─────┘  └─────┬─────┘  └─────┬─────┘
     │              │              │
     └──────────────┼──────────────┘
                    │
     ┌──────────────┴──────────────┐
     │                             │
┌────▼──────┐              ┌──────▼──────┐
│  MySQL    │              │   Redis     │
│ Database  │              │   Cache     │
│ :3306     │              │   :6379     │
└───────────┘              └─────────────┘
```

### Microservices Architecture

| Service | Port | Purpose | Tech |
|---------|------|---------|------|
| **Frontend** | 3000 | User interface | React 19, Tailwind CSS |
| **Auth Service** | 8000 | User authentication & authorization | FastAPI, JWT |
| **Stock Service** | 8001 | Stock data, portfolios, analytics | FastAPI, yfinance, pandas |
| **Watchlist Service** | 8002 | Watchlist & price alerts | FastAPI, WebSocket |
| **MySQL** | 3306 | Relational data storage | MySQL 8.0 |
| **Redis** | 6379 | Caching layer (10-min TTL) | Redis 7 |

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose installed
- Git

### Setup & Run

```bash
# 1. Clone the repository
git clone <repo-url>
cd portfolio_app

# 2. Start all services
docker-compose up --build

# 3. Access the app
# Frontend:     http://localhost:3000
# Auth API:     http://localhost:8000/docs
# Stock API:    http://localhost:8001/docs
# Watchlist API: http://localhost:8002/docs
```

### Initial Setup

1. **Create a user** at `http://localhost:3000/register`
2. **Update user role** (make admin):
   ```bash
   docker exec -it portfolio_mysql mysql -u root -proot Portfolio_Management
   UPDATE users SET role = 'admin' WHERE username = 'your_username';
   EXIT;
   ```
3. **Add stocks** using admin credentials:
   ```bash
   curl -X POST "http://localhost:8001/api/stocks/?stock_symbol=AAPL" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

---

## 📁 Project Structure

```
portfolio_app/
├── frontend/                          # React application
│   ├── public/
│   ├── src/
│   │   ├── components/               # Reusable React components
│   │   ├── pages/                    # Page components
│   │   ├── services/                 # API service classes
│   │   ├── context/                  # React Context (Auth)
│   │   └── App.js
│   ├── Dockerfile
│   └── package.json
│
├── Backend/
│   ├── authentication_service/       # User auth & login
│   │   ├── main.py
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── utils/
│   │   └── Dockerfile
│   │
│   ├── stock_service/                # Stock data & portfolios
│   │   ├── main.py
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── utils/
│   │   │   ├── cache.py             # Redis caching logic
│   │   │   └── db_context.py
│   │   └── Dockerfile
│   │
│   └── watchlist_service/            # Watchlists & alerts
│       ├── main.py
│       ├── models/
│       ├── controllers/
│       ├── services/
│       ├── utils/
│       └── Dockerfile
│
├── docker-compose.yml                # Container orchestration
├── requirements.txt                  # Python dependencies
├── .env                             # Environment variables
├── REDIS_GUIDE.md                   # Redis caching guide
├── CLAUDE_GUIDE.md                  # Claude Code guide (this file)
└── README.md                        # This file

```

---

## 🔑 Key Features

### 1. **Authentication & Authorization**
- JWT-based authentication
- Role-based access control (Admin, Moderator, User)
- Secure password hashing with passlib

### 2. **Stock Management**
- Add stocks to system (admin only)
- Real-time price fetching from Yahoo Finance
- Historical price data
- Financial analytics (quarterly data)
  - Income statements (revenue, profit, EPS)
  - Balance sheets (assets, liabilities, equity)
  - Cash flow statements

### 3. **Portfolio Management**
- Create multiple portfolios per user
- Add/remove stock holdings
- Track cost basis and quantity
- Real-time portfolio valuation
- Sector breakdown analysis

### 4. **Watchlists & Alerts**
- Create custom watchlists
- Real-time price monitoring (WebSocket)
- Set price alerts/thresholds
- Receive notifications on targets

### 5. **Caching Strategy**
- Redis in-memory cache (10-minute TTL)
- Caches: stock info, prices, historical data
- Reduces Yahoo Finance API calls by ~90%

### 6. **UI/UX**
- Dark/Light theme toggle
- Responsive design (mobile-friendly)
- Real-time data visualization
- Smooth animations

---

## 🔗 API Endpoints

### Authentication Service (Port 8000)

```bash
POST   /auth/register        # Register new user
POST   /auth/login           # Login & get JWT token
GET    /auth/user            # Get current user info
POST   /auth/refresh         # Refresh token
```

### Stock Service (Port 8001)

```bash
# Stock Management
POST   /api/stocks/                    # Add stock (admin only)
GET    /api/stocks/                    # Get all stocks
GET    /api/stocks/{symbol}            # Get stock details
GET    /api/stocks/{symbol}/info       # Get stock info (Yahoo Finance)
GET    /api/stocks/{symbol}/price      # Get current price

# Portfolio Management
POST   /api/stocks/portfolios          # Create portfolio
GET    /api/stocks/portfolios/{id}     # Get portfolio
GET    /api/stocks/portfolios/user/{id} # Get user portfolios
POST   /api/stocks/portfolios/{id}/add/holdings  # Add stock to portfolio
DELETE /api/stocks/portfolios/holdings/{id}     # Remove stock

# Financial Data
GET    /api/stocks/financials/{symbol}          # Income statement
GET    /api/stocks/balance-sheet/{symbol}       # Balance sheet
GET    /api/stocks/cash-flow/{symbol}           # Cash flow
```

### Watchlist Service (Port 8002)

```bash
POST   /api/watchlists/               # Create watchlist
GET    /api/watchlists/user/{id}      # Get user's watchlists
POST   /api/watchlists/{id}/items     # Add item to watchlist
GET    /api/watchlists/{id}/items     # Get watchlist items
WS     /ws/{user_id}                  # WebSocket for real-time alerts
```

Full API documentation available at:
- `http://localhost:8000/docs` (Swagger UI)
- `http://localhost:8001/docs`
- `http://localhost:8002/docs`

---

## 🗄️ Database Schema

### Core Tables

**users**
```sql
- user_id (PK)
- username (unique)
- email (unique)
- password (hashed)
- first_name
- last_name
- role (admin, moderator, user)
- created_at
```

**stocks**
```sql
- stock_symbol (PK)
- name
- sector_id (FK)
- market_cap
- last_updated
```

**portfolios**
```sql
- portfolio_id (PK)
- user_id (FK)
- name
- created_at
```

**portfolio_holdings**
```sql
- holding_id (PK)
- portfolio_id (FK)
- stock_symbol (FK)
- quantity
- average_price
- added_at
```

**financials**
```sql
- id (PK)
- stock_symbol (FK)
- quarter
- revenue
- gross_profit
- net_profit
- eps
- operating_margin
```

---

## 💾 Caching Strategy

### Why Redis?
- **Read-heavy app**: Stock prices queried frequently
- **Performance**: In-memory cache is ~100x faster than DB
- **API efficiency**: Reduces Yahoo Finance API calls

### Cache Structure

```
stock_info:AAPL.IS → {sector, market_cap, website, ...}
stock_price:MSFT.IS → 380.50
stock_prices:GOOGL.IS:2024-01-01:2024-12-31 → [{date, price}, ...]

TTL: 600 seconds (10 minutes)
```

### Cache Flow

```
Request → Check Redis → Hit? Return ⚡
                ↓ Miss
            Yahoo Finance API
                ↓
            Store in Redis
                ↓
            Return to Client
```

See [REDIS_GUIDE.md](REDIS_GUIDE.md) for monitoring and management.

---

## 🔐 Security

### Authentication
- **JWT Tokens**: Secure token-based auth
- **Password Hashing**: Using passlib with bcrypt
- **Token Expiration**: Automatic refresh mechanism

### Authorization
- **Role-Based Access Control**: Admin, Moderator, User roles
- **API Protection**: Critical endpoints require authentication
- **CORS**: Configured for frontend integration

### Best Practices
- Environment variables for secrets (.env file)
- No hardcoded credentials
- Password validation
- Secure database connections

---

## 📊 Database Relationships

```
┌──────────────┐
│    Users     │
└──────┬───────┘
       │ 1:N
       │
┌──────▼───────┐
│ Portfolios   │
└──────┬───────┘
       │ 1:N
       │
┌──────▼──────────────┐
│Portfolio_Holdings   │
└──────┬──────────────┘
       │ N:1
       │
┌──────▼───────┐
│   Stocks     │
└──────┬───────┘
       │ N:1
       │
┌──────▼───────┐
│  Sectors     │
└──────────────┘

Stocks also have:
- Financials (1:N)
- BalanceSheets (1:N)
- CashFlows (1:N)
- Dividends (1:N)
- StockPrices (1:N)
```

---

## 🛠️ Development

### Running Locally (Without Docker)

```bash
# Frontend
cd frontend
npm install
npm start

# Backend (Python - each service)
cd Backend/authentication_service
pip install -r ../../requirements.txt
python main.py

# Repeat for other services with different ports
```

### Making Code Changes

1. Modify code in your IDE
2. Hot reload (frontend) or restart service (backend)
3. Test via Swagger UI at respective `/docs` endpoints

### Adding New Stocks

```bash
# As admin user
curl -X POST "http://localhost:8001/api/stocks/?stock_symbol=TSLA" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

Supported symbols: Any stock listed on Yahoo Finance (use symbol alone, .IS suffix added automatically for Turkish stocks).

---

## 🐛 Troubleshooting

### Services Won't Start
```bash
# Check logs
docker-compose logs -f stock_service

# Rebuild everything
docker-compose down
docker volume rm portfolio_app_mysql_data
docker-compose up --build
```

### Database Issues
```bash
# Access MySQL
docker exec -it portfolio_mysql mysql -u root -proot Portfolio_Management

# Check tables
SHOW TABLES;
DESCRIBE users;
```

### Redis Not Caching
```bash
# Check Redis
docker exec -it portfolio_redis redis-cli
KEYS *

# Check cache logs
docker logs stock_service | grep "Cache"
```

### Port Conflicts
If ports 3000, 8000, 8001, 8002, 3306, 6379 are taken:
1. Update `docker-compose.yml` port mappings
2. Update frontend API URLs in environment variables

---

## 📈 Performance Optimization

### Current Optimizations
1. ✅ Redis caching (10-min TTL)
2. ✅ Lazy loading on frontend
3. ✅ Indexed database queries
4. ✅ Connection pooling

### Future Improvements
- [ ] Database query optimization
- [ ] Frontend code splitting
- [ ] API response pagination
- [ ] GraphQL instead of REST
- [ ] Real-time updates via WebSocket for prices
- [ ] Compression (gzip)

---

## 🚢 Deployment

### Docker Deployment Ready
This app is fully containerized and ready for deployment to:
- AWS ECS
- Google Cloud Run
- Azure Container Instances
- Kubernetes (K8s)
- Heroku with Docker

```bash
# Push to registry
docker tag stock-service:latest your-registry/stock-service:latest
docker push your-registry/stock-service:latest

# Deploy on cloud platform of choice
```

---

## 📚 Documentation

- **[REDIS_GUIDE.md](REDIS_GUIDE.md)**: Complete Redis caching guide
- **[CLAUDE_GUIDE.md](CLAUDE_GUIDE.md)**: Claude Code integration guide
- **API Docs**: Available at `http://localhost:{port}/docs` (Swagger UI)

---

## 🤝 Contributing

1. Create a branch: `git checkout -b feature/your-feature`
2. Make changes and test
3. Commit: `git commit -m "Add feature"`
4. Push: `git push origin feature/your-feature`
5. Create Pull Request

---

## 📝 Environment Variables

Create `.env` file in project root:

```env
# Database
DB_USER=root
DB_PASSWORD=root
DATABASE_URL=mysql+pymysql://root:root@mysql:3306/Portfolio_Management

# Redis
REDIS_URL=redis://redis:6379/0

# API URLs (for frontend)
REACT_APP_AUTH_API=http://localhost:8000
REACT_APP_STOCK_API=http://localhost:8001
REACT_APP_WATCHLIST_API=http://localhost:8002

# JWT
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
```

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---
---


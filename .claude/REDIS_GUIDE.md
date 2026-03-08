# Redis Cache Guide for Portfolio App

## Table of Contents
1. [What are Key-Value Pairs?](#what-are-key-value-pairs)
2. [Redis Data Structure](#redis-data-structure)
3. [Key-Value Pairs in Our Application](#key-value-pairs-in-our-application)
4. [How to Access Redis](#how-to-access-redis)
5. [Redis Commands](#redis-commands)
6. [Monitoring Cache](#monitoring-cache)
7. [Troubleshooting](#troubleshooting)

---

## What are Key-Value Pairs?

### Definition
A **key-value pair** is the fundamental data structure used to store and retrieve data. It consists of:
- **Key**: A unique identifier used to retrieve the data (like a label)
- **Value**: The actual data associated with that key (can be any type)

### Real-World Analogy
Think of it like a dictionary or phonebook:
```
Name (Key)        →  Phone Number (Value)
"Alice"           →  "555-1234"
"Bob"             →  "555-5678"
```

### Why Use Key-Value Pairs?
- ⚡ **Fast lookup**: Find data in O(1) time (milliseconds)
- 📦 **Simple structure**: Easy to understand and use
- 💾 **Efficient storage**: Minimal overhead
- 🔄 **Scalable**: Works with large datasets

---

## Redis Data Structure

### What is Redis?
**Redis** (Remote Dictionary Server) is an in-memory key-value store that:
- Stores data in RAM (very fast)
- Persists to disk (data survives restarts)
- Supports multiple data types beyond simple strings
- Used for caching, sessions, real-time data, and more

### Redis Data Types

#### 1. **String** (Most Common)
The simplest data type. Stores text or numbers as a single value.

```
Key: "stock_price:AAPL.IS"
Value: "150.25"
```

#### 2. **Hash** (Like a JSON object)
Stores multiple field-value pairs within a single key.

```
Key: "stock:AAPL"
Value: {
  "price": "150.25",
  "sector": "Technology",
  "market_cap": "2500000000000"
}
```

#### 3. **List** (Like an array)
Stores ordered collection of strings.

```
Key: "stock_alerts:user_1"
Value: ["AAPL price up", "MSFT dividend paid", "GOOGL split"]
```

#### 4. **Set** (Unique collection)
Stores unique strings (no duplicates).

```
Key: "user_1:watchlist"
Value: {"AAPL", "MSFT", "GOOGL"}
```

#### 5. **Sorted Set** (Ranked collection)
Like a set but with scores for ranking.

```
Key: "leaderboard"
Value: {
  "user_1": 95,
  "user_2": 87,
  "user_3": 72
}
```

### Redis Memory Model
```
┌─────────────────────────────────────┐
│         Redis In-Memory Store       │
├─────────────────────────────────────┤
│ Key              │ Value             │
├──────────────────┼───────────────────┤
│ stock_price:AAPL │ 150.25            │
│ stock_info:AAPL  │ {sector, cap,...} │
│ user_1:watchlist │ {AAPL, MSFT,...}  │
│ leaderboard      │ {user:score,...}  │
└─────────────────────────────────────┘
```

---

## Key-Value Pairs in Our Application

### Cache Key Structure in Portfolio App

We use a **naming convention** for keys to organize them logically:

```
{type}:{identifier}:{params}
```

#### Examples from Our Stock Service

```
stock_info:AAPL.IS
├─ Type: stock_info
├─ Identifier: AAPL.IS (stock symbol)
└─ Params: (none)

stock_price:MSFT.IS
├─ Type: stock_price
├─ Identifier: MSFT.IS
└─ Params: (none)

stock_prices:GOOGL.IS:2024-01-01:2024-12-31
├─ Type: stock_prices (multiple prices)
├─ Identifier: GOOGL.IS
└─ Params: date range (start:end)
```

### What Gets Cached in Our App?

#### 1. Stock Information
```
Key:   "stock_info:AAPL.IS"
Value: {
  "symbol": "AAPL",
  "longName": "Apple Inc.",
  "sector": "Technology",
  "marketCap": 2500000000000,
  "currentPrice": 150.25,
  "website": "https://www.apple.com",
  ...
}
TTL:   600 seconds (10 minutes)
```

#### 2. Current Stock Price
```
Key:   "stock_price:MSFT.IS"
Value: 380.50
TTL:   600 seconds (10 minutes)
```

#### 3. Historical Price Range
```
Key:   "stock_prices:GOOGL.IS:2024-01-01:2024-12-31"
Value: [
  {"date": "2024-01-01", "close_price": 140.50},
  {"date": "2024-01-02", "close_price": 142.75},
  ...
]
TTL:   600 seconds (10 minutes)
```

### Cache Flow Diagram

```
User Request (GET /api/stocks/AAPL/price)
         ↓
    ┌────────────────┐
    │ Check Redis    │
    │ Cache for key: │
    │ stock_price:   │
    │ AAPL.IS        │
    └────────────────┘
         ↓
    ┌─────────────────┐
    │ Cache Hit? ✓    │  ← Return cached value (Fast!)
    └─────────────────┘
    (If YES → Return immediately)
         ↓
    (If NO → Cache Miss)
    ┌──────────────────────┐
    │ Fetch from Yahoo     │
    │ Finance API          │
    └──────────────────────┘
         ↓
    ┌──────────────────────┐
    │ Store in Redis with  │
    │ 10-minute TTL        │
    └──────────────────────┘
         ↓
    Return to Client
```

### Why 10-Minute TTL?

- **TTL** = Time To Live (how long data stays in cache)
- **10 minutes** = optimal for stock prices because:
  - Stock prices don't change drastically in 10 minutes
  - Reduces Yahoo Finance API calls by ~90%
  - Balances freshness with performance
  - Avoids rate limiting from Yahoo Finance

```
Timeline:
00:00 → User 1 requests AAPL price
        ↳ Cache miss → Fetch from Yahoo → Store in Redis (TTL: 10min)

00:05 → User 2 requests AAPL price
        ↳ Cache hit → Return from Redis (5 min remaining)

00:10 → TTL expired, Redis deletes key automatically

00:11 → User 3 requests AAPL price
        ↳ Cache miss → Fetch from Yahoo → Store again
```

---

## How to Access Redis

### Method 1: Using Redis CLI (Recommended)

#### Step 1: Enter the Redis Container

```bash
# From your host machine
docker exec -it portfolio_redis redis-cli
```

**Output:**
```
127.0.0.1:6379>
```

You're now inside Redis! The prompt shows you're connected to Redis at port 6379.

#### Step 2: Basic Commands (See Redis Commands section below)

```bash
# Check all keys
127.0.0.1:6379> KEYS *

# Check specific pattern
127.0.0.1:6379> KEYS stock_price:*

# Get a specific key
127.0.0.1:6379> GET stock_price:AAPL.IS

# Exit Redis
127.0.0.1:6379> EXIT
```

### Method 2: Using Redis Desktop GUI

#### Option A: Using DBeaver (Recommended for Mac/Windows)
1. Download: [DBeaver Community](https://dbeaver.io)
2. Click **Database** → **New Database Connection**
3. Select **Redis**
4. Configure:
   - **Server Host**: `localhost`
   - **Port**: `6379`
   - Click **Test Connection**
5. Browse keys visually

#### Option B: Using RedisInsight (Official Redis GUI)
1. Download: [RedisInsight](https://redis.io/insight/)
2. Add Redis Database:
   - Host: `localhost`
   - Port: `6379`
3. Browse and manage keys through UI

### Method 3: Using Docker Logs

See Redis activity without entering the container:

```bash
docker logs -f portfolio_redis
```

---

## Redis Commands

### Essential Commands for Monitoring Cache

#### 1. **Check All Keys**
```bash
KEYS *
```

Returns all keys in Redis.

**Example Output:**
```
1) "stock_price:AAPL.IS"
2) "stock_info:MSFT.IS"
3) "stock_prices:GOOGL.IS:2024-01-01:2024-12-31"
```

#### 2. **Find Keys by Pattern**
```bash
KEYS stock_price:*
```

Returns all keys matching the pattern (wildcard * works).

**Patterns:**
```bash
KEYS stock_*           # All stock-related keys
KEYS *AAPL*            # Any key containing AAPL
KEYS stock_price:*     # Current prices only
```

#### 3. **Get Key Details**

Get the value of a key:
```bash
GET stock_price:AAPL.IS
```

**Example Output:**
```
"150.25"
```

Get more complex data (hashes):
```bash
HGETALL stock:AAPL
```

**Example Output:**
```
1) "price"
2) "150.25"
3) "sector"
4) "Technology"
5) "market_cap"
6) "2500000000000"
```

#### 4. **Check Key Expiration**

Check how many seconds until a key expires:
```bash
TTL stock_price:AAPL.IS
```

**Output Meanings:**
```
TTL stock_price:AAPL.IS
(integer) 425        # 425 seconds remaining (7 min)

TTL non_existing_key
(integer) -2         # Key doesn't exist

TTL persistent_key
(integer) -1         # Key exists but no expiration
```

#### 5. **Get Key Type**

Check what data type a key stores:
```bash
TYPE stock_price:AAPL.IS
```

**Output:**
```
string          # Simple text/number
hash            # JSON-like object
list            # Ordered array
set             # Unique collection
zset            # Sorted set
```

#### 6. **Get All Keys with Details**

```bash
SCAN 0
```

Returns keys in batches (useful for large datasets).

#### 7. **Get Database Statistics**

```bash
INFO
```

Shows memory usage, connected clients, and more.

**Useful Sections:**
```
INFO stats           # Keys hit/miss stats
INFO memory          # Memory usage
INFO clients         # Connected clients
```

#### 8. **Get Total Number of Keys**

```bash
DBSIZE
```

**Output:**
```
(integer) 42        # 42 keys in Redis
```

#### 9. **Delete a Key**

```bash
DEL stock_price:AAPL.IS
```

**Output:**
```
(integer) 1         # Successfully deleted
(integer) 0         # Key didn't exist
```

#### 10. **Clear All Cache** (Use Carefully!)

```bash
FLUSHDB
```

Deletes all keys in the current database.

**Warning:** This removes all cached data!

---

## Practical Walkthrough: Monitoring Your Cache

### Step-by-Step Example

#### Scenario: Check stock price cache

```bash
# 1. Enter Redis container
docker exec -it portfolio_redis redis-cli

# 2. See all keys
127.0.0.1:6379> KEYS *
# Shows all cached keys

# 3. Find stock price keys
127.0.0.1:6379> KEYS stock_price:*
1) "stock_price:AAPL.IS"
2) "stock_price:MSFT.IS"

# 4. Get a stock price
127.0.0.1:6379> GET stock_price:AAPL.IS
"150.25"

# 5. Check TTL (time remaining)
127.0.0.1:6379> TTL stock_price:AAPL.IS
(integer) 450        # 450 seconds remaining

# 6. Check total cached items
127.0.0.1:6379> DBSIZE
(integer) 15         # 15 items cached

# 7. Exit
127.0.0.1:6379> EXIT
```

---

## Monitoring Cache

### Check Cache Hit Rate

View console output when running the app:

```
✓ Cache hit for stock_price:AAPL.IS
```

If you see this, the cache is working!

### Real-Time Monitoring

```bash
# Watch Redis commands in real-time
docker exec -it portfolio_redis redis-cli MONITOR

# Output shows every command:
# 1704067200.123456 [0 192.168.65.1:54321] "GET" "stock_price:AAPL.IS"
# 1704067205.234567 [0 192.168.65.1:54322] "SETEX" "stock_price:MSFT.IS" "600" "380.50"
```

### Memory Usage

```bash
127.0.0.1:6379> INFO memory

# Output:
# used_memory: 1048576         # ~1 MB
# used_memory_human: 1.00M
# used_memory_rss: 10485760    # System RAM
```

---

## Common Use Cases in Our App

### 1. Cache Miss Detection

When app logs show fetching from Yahoo Finance:
```
No cache entry for stock_info:AAPL.IS
Fetching from Yahoo Finance...
✓ Stored in cache with TTL: 600s
```

### 2. Expired Cache

After 10 minutes, automatic cleanup:
```
127.0.0.1:6379> TTL stock_price:AAPL.IS
(integer) -2         # Key expired and removed
```

### 3. Manual Cache Invalidation

If you want to force a refresh:
```bash
# Delete specific key
127.0.0.1:6379> DEL stock_price:AAPL.IS

# Next request fetches fresh data from Yahoo Finance
```

---

## Troubleshooting

### Problem 1: Can't Connect to Redis

```bash
# Check if Redis container is running
docker ps | grep portfolio_redis

# If not running, start Docker Compose
docker-compose up redis
```

### Problem 2: "WRONGTYPE Operation against a key holding the wrong kind of value"

```bash
# Check what type the key is
TYPE problematic_key

# Delete and let it be recreated
DEL problematic_key
```

### Problem 3: Cache Not Working

Check logs:
```bash
docker logs stock_service | grep "Cache"
docker logs portfolio_redis
```

Check if Redis is connected in code:
```python
# In cache.py, look for:
# "✓ Connected to Redis cache"  # Good
# "⚠ Redis connection failed"   # Problem
```

### Problem 4: Memory Growing Too Large

```bash
# Check current memory
127.0.0.1:6379> INFO memory

# Clear old keys if needed
127.0.0.1:6379> FLUSHDB   # Clear all (careful!)

# Or set more aggressive TTL in code (e.g., 300 seconds instead of 600)
```

### Problem 5: Keys Not Expiring

Check if TTL was set:
```bash
127.0.0.1:6379> TTL stock_price:AAPL.IS
(integer) -1         # No expiration set!
```

Solution: Verify `cache.set_cache()` is being called with `ttl=600`.

---

## Summary: Key Takeaways

| Concept | Definition | Example |
|---------|-----------|---------|
| **Key-Value Pair** | Unique identifier + associated data | `"AAPL"` → `150.25` |
| **Redis** | Fast in-memory data store | Caches stock prices |
| **TTL** | Time data stays in cache | 600 seconds = 10 minutes |
| **Cache Hit** | Data found in cache | Return immediately ⚡ |
| **Cache Miss** | Data not in cache | Fetch from Yahoo, then cache |
| **Key Pattern** | Organized naming convention | `stock_price:AAPL.IS` |

---

## Quick Command Reference

```bash
# Access Redis
docker exec -it portfolio_redis redis-cli

# Most useful commands
KEYS *                          # See all keys
KEYS stock_price:*              # Find specific pattern
GET key_name                    # Get value
TTL key_name                    # Check expiration
DBSIZE                          # Count total keys
DEL key_name                    # Delete key
FLUSHDB                         # Clear all (careful!)
INFO                            # Statistics
EXIT                            # Exit Redis CLI
```

---

## Resources

- [Redis Official Docs](https://redis.io/docs/)
- [Redis Commands Reference](https://redis.io/commands/)
- [Redis Key Patterns Best Practices](https://redis.io/docs/management/optimization/key-patterns/)
- [TTL & Expiration](https://redis.io/docs/manual/data-types/expires/)

---

**Happy caching! 🚀**

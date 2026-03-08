---
name: add-stock
description: Add a stock to the database via the stock service API. Requires admin login.
disable-model-invocation: true
user-invocable: true
allowed-tools: Bash
argument-hint: [STOCK_SYMBOL or comma-separated symbols e.g. THYAO,BIMAS,ASELS]
---

# Add Stock to Database

Add the stock(s) `$ARGUMENTS` to the portfolio app database.

## Steps

1. **Login as admin** to get a JWT token:
   ```bash
   curl -s -X POST http://localhost:8000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"tunahanyazar0","password":"19482011"}'
   ```
   Extract the `access_token` from the response.

2. **Add each stock** by calling the stock service:
   ```bash
   curl -s -X POST "http://localhost:8001/api/stocks/?stock_symbol=SYMBOL" \
     -H "Authorization: Bearer <token>"
   ```
   - The backend appends `.IS` (Istanbul Stock Exchange) automatically
   - It fetches stock info from Yahoo Finance (name, sector, market cap)
   - It also fetches income statements, balance sheets, and cash flow data

3. **Handle multiple symbols**: If comma-separated symbols are provided (e.g. `THYAO,BIMAS`), split and add each one sequentially.

4. **Report results**: For each stock, print whether it was added successfully or if it already exists.

5. **Verify**: After adding, query the database to confirm:
   ```bash
   docker exec portfolio_mysql mysql -u root -proot Portfolio_Management \
     -e "SELECT stock_symbol, name FROM stocks ORDER BY stock_symbol;"
   ```

## Error Handling
- If login fails, ask the user for correct admin credentials
- If a stock already exists, report it and continue with the next one
- If Yahoo Finance fails (SSL/timeout), suggest the user check VPN/network
- Use `--max-time 120` on curl calls since Yahoo Finance fetches can be slow

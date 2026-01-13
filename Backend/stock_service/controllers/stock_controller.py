from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from decimal import Decimal
from datetime import date
from typing import List, Optional
from utils.db_context import get_db
from services.stock_service import StockService
from models.models import Stock, StockPrice, Portfolio, PortfolioHolding
from models.pydantic_models import *
from utils.authentication_utils import verify_role # this function checks the token and returns the username if the token is legit

from Backend.stock_service.models.pydantic_models import PortfolioResponse, PaginatedStockResponse, \
    StockWithPriceResponse, HoldingCreate, HoldingResponse, IncomeStatementResponse, CashFlowResponse, \
    StockPriceResponse, StockResponse, SectorResponse, StockPriceInRangeRequest, BalanceSheetResponse

router = APIRouter(
    prefix="/api/stocks",
    tags=["stocks"]
)


# ARTIK STOCK PRİCE HAKKINDA DB  ISLEMI YAPMICAZ, DB YE EKLEMEK VE ORDAN CEKMEK YERİNE YAHOO FİNANCE DEN CEKİCEZ

# ===== OPTIMIZED ENDPOINTS FOR PERFORMANCE =====

# Get all stocks with their current prices (paginated)
@router.get("/with-prices", response_model=PaginatedStockResponse)
def get_stocks_with_prices(
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get paginated stocks with their current prices and sector information.
    This endpoint combines stock data + current price in a single request.

    Results are cached for better performance.

    Query Parameters:
    - page: Page number (default: 1)
    - limit: Items per page (default: 10)

    Returns paginated response with total count and page info.
    """
    service = StockService(db)

    # Get total count
    total = db.query(Stock).count()

    # Calculate offset
    offset = (page - 1) * limit

    # Get stocks for this page
    stocks = db.query(Stock).offset(offset).limit(limit).all()

    result = []
    for stock in stocks:
        try:
            # Get current price from cache first, then Yahoo Finance
            current_price = service.get_current_stock_price(stock.stock_symbol)

            # Get sector name
            sector_name = stock.sector.name if stock.sector else "Unknown"

            result.append(StockWithPriceResponse(
                stock_symbol=stock.stock_symbol,
                name=stock.name,
                sector=sector_name,
                market_cap=stock.market_cap,
                current_price=current_price,
                last_updated=stock.last_updated
            ))
        except Exception as e:
            print(f"Error fetching price for {stock.stock_symbol}: {e}")
            # Still include stock even if price fetch fails
            result.append(StockWithPriceResponse(
                stock_symbol=stock.stock_symbol,
                name=stock.name,
                sector=stock.sector.name if stock.sector else "Unknown",
                market_cap=stock.market_cap,
                current_price=None,
                last_updated=stock.last_updated
            ))

    # Calculate total pages
    total_pages = (total + limit - 1) // limit

    return PaginatedStockResponse(
        data=result,
        total=total,
        page=page,
        pages=total_pages,
        limit=limit
    )


# ENDPOİNTS RELATED TO PORTFOLIOS

# Create a new portfolio for a user but no holding inside for now
@router.post("/portfolios", response_model=PortfolioResponse)
def create_portfolio(portfolio: PortfolioCreate, db: Session = Depends(get_db)):
    service = StockService(db)
    return service.create_portfolio(portfolio.user_id, portfolio.name)


# to return a portfolio with the given id but basic info not holdings inside
@router.get("/portfolios/{portfolio_id}", response_model=PortfolioResponse)
def get_portfolio(portfolio_id: int, db: Session = Depends(get_db)):
    service = StockService(db)
    portfolio = service.get_portfolio(portfolio_id)
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return portfolio

# to return all portfolios of a user
@router.get("/portfolios/user/{user_id}", response_model=List[PortfolioResponse])
def get_user_portfolios(user_id: int, db: Session = Depends(get_db)):
    service = StockService(db)
    return service.get_user_portfolios(user_id)

# to return holdings in a portfolio : get_portfolio_holdings
@router.get("/portfolios/{portfolio_id}/holdings", response_model=List[HoldingResponse])
def get_portfolio_holdings(portfolio_id: int, db: Session = Depends(get_db)):
    service = StockService(db)
    holdings = service.get_portfolio_holdings(portfolio_id)
    if not holdings:
        raise HTTPException(status_code=404, detail="No holdings found in this portfolio")
    return holdings

# to add a holding to a portfolio with the given id
@router.post("/portfolios/{portfolio_id}/add/holdings", response_model=HoldingResponse)
async def add_holding(
    portfolio_id: int,
    holding: HoldingCreate,
    db: Session = Depends(get_db)
):
    service = StockService(db)
    portfolio = service.get_portfolio(portfolio_id)
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    stock = service.get_stock(holding.symbol)
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")

    response = service.add_holding(portfolio_id, holding.symbol, holding.quantity, Decimal(str(holding.price)))
    return response

# to update a holding in a portfolio
@router.put("/portfolios/holdings/decrease/{holding_id}", response_model=HoldingResponse)
def decrease_holding(
    holding_id: int,
    holding: HoldingDecrease, # sadece quantity keyword u var
    db: Session = Depends(get_db)
):
    service = StockService(db)
    # holding.quantity is the quantity to decrease
    holding_obj = service.decrease_holding(holding_id, holding.quantity)
    if not holding_obj:
        raise HTTPException(status_code=404, detail="Holding not found")
    return holding_obj

# to delete a holding in a portfolio with the given holding id
@router.delete("/portfolios/holdings/delete/{holding_id}")
def delete_holding(holding_id: int, db: Session = Depends(get_db)):
    service = StockService(db)
    if not service.delete_holding(holding_id):
        raise HTTPException(status_code=404, detail="Holding not found")
    return {"message": "Holding deleted successfully"}


# only admin or moderator can add stock to the system
# it takes the stock symbol as input and returns the stock object as output if the stock is successfully added
# uses yahoo finance for additional info
@router.post("/", response_model=StockResponse)
async def create_stock(stock_symbol: str, db: Session = Depends(get_db), username: str = Depends(verify_role)):
    service = StockService(db)
    existing_stock = service.get_stock(stock_symbol)
    if existing_stock:
        raise HTTPException(status_code=400, detail="Stock already exists")
    return service.create_stock(stock_symbol)

@router.get("/{symbol}", response_model=StockResponse)
def get_stock(symbol: str, db: Session = Depends(get_db)):
    service = StockService(db)
    stock = service.get_stock(symbol)
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    return stock

@router.get("/", response_model=List[StockResponse])
def get_all_stocks(db: Session = Depends(get_db)):
    service = StockService(db)
    return service.get_all_stocks()


# To get general info about a stock using yahoo finance
"""
example input: http://localhost:8001/api/stocks/AAPL/info
example output:
{
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "sector": "Technology",
    "market_cap": 2.2e12
    ...
}
"""
@router.get("/{symbol}/info")
def get_stock_info(symbol: str, db: Session = Depends(get_db)):
    service = StockService(db)
    stock_info = service.get_stock_info(symbol)
    if not stock_info:
        raise HTTPException(status_code=404, detail="Stock info not found")
    return stock_info


# To get the recent stock price of a stock
"""
example input: http://localhost:8001/api/stocks/AAPL/price
example output:
{   
    "stock_symbol": "AAPL",
    "date": "2021-01-04",
    "close_price": 129.41
}
"""
@router.get("/{symbol}/price", response_model=StockPriceResponse)
def get_current_stock_price(symbol: str, db: Session = Depends(get_db)):
    stock_service = StockService(db)
    price = stock_service.get_current_stock_price(symbol)
    if price is None:
        raise HTTPException(status_code=404, detail="Stock price not found")
    return StockPriceResponse(
        stock_symbol=symbol.upper(),
        date=date.today().isoformat(),
        close_price=price
    )


# To get the stock prices for a given stock symbol and date range
"""
example input: 
{
    "stock_symbol": "AAPL",
    "start_date": "2021-01-01",
    "end_date": "2021-01-03"
}

example output:
[
    {
        "stock_symbol": "AAPL",
        "date": "2021-01-01",
        "close_price": 129.41
    },
    {
        "stock_symbol": "AAPL",
        "date": "2021-01-02",
        "close_price": 131.01
    }
]
"""
@router.post("/prices-range", response_model=List[StockPriceResponse])
def get_stock_prices(request: StockPriceInRangeRequest, db: Session = Depends(get_db)):
    stock_service = StockService(db)
    prices = stock_service.get_stock_price_in_range(request.stock_symbol, request.start_date, request.end_date)
    
    # Convert date to string
    response = [
        StockPriceResponse(
            stock_symbol=price.stock_symbol,
            date=price.date.isoformat(),  # Convert date to string
            close_price=price.close_price
        )
        for price in prices
    ]
    
    return response

# to get predefined dates stock prices for a given stock symbol (with or without trailing slash)
@router.get("/{symbol}/prices", response_model=List[StockPriceResponse])
@router.get("/{symbol}/prices/", response_model=List[StockPriceResponse])
def get_predefined_stock_prices(symbol: str, db: Session = Depends(get_db)):
    stock_service = StockService(db)
    prices = stock_service.get_prices_of_stock_in_predefined_dates(symbol)
    if not prices:
        raise HTTPException(status_code=404, detail="Stock prices not found")

    # Convert date to string
    response = [
        StockPriceResponse(
            stock_symbol=price.stock_symbol,
            date=price.date.isoformat(),  # Convert date to string
            close_price=price.close_price
        )
        for price in prices
    ]

    return response

# Retrieve the income statement data for a given stock symbol
# Endpoint to return all financial data for a given stock symbol
@router.get("/financials/{symbol}", response_model=List[IncomeStatementResponse])
def get_financial_data(symbol: str, db: Session = Depends(get_db)):
    stock_service = StockService(db)
    financials = stock_service.get_financial_data(symbol)
    if not financials:
        raise HTTPException(status_code=404, detail="Financial data not found")
    
    # Convert quarter to string
    response = [
        IncomeStatementResponse(
            id=financial.id,
            stock_symbol=financial.stock_symbol,
            quarter=financial.quarter.isoformat(),  # Convert date to string
            revenue=financial.revenue,
            gross_profit=financial.gross_profit,  # Added gross profit
            operating_income=financial.operating_income,  # Added operating income
            net_profit=financial.net_profit,
            eps=financial.eps,
            operating_margin=financial.operating_margin  # Added operating margin (%)
        )
        for financial in financials
    ]
    
    return response

# Endpoint to return all balance sheet data for a given stock symbol
@router.get("/balance-sheet/{symbol}", response_model=List[BalanceSheetResponse])
def get_balance_sheet_data(symbol: str, db: Session = Depends(get_db)):
    stock_service = StockService(db)
    balance_sheets = stock_service.get_balance_sheet_data(symbol)
    if not balance_sheets:
        raise HTTPException(status_code=404, detail="Balance sheet data not found")
    
    # Convert quarter to string
    response = [
        BalanceSheetResponse(
            id=balance_sheet.id,
            stock_symbol=balance_sheet.stock_symbol,
            quarter=balance_sheet.quarter.isoformat(),  # Convert date to string
            total_assets=balance_sheet.total_assets,
            total_liabilities=balance_sheet.total_liabilities,  # Added total liabilities
            total_equity=balance_sheet.total_equity,  # Added total equity
            current_assets=balance_sheet.current_assets,  # Added current assets
            current_liabilities=balance_sheet.current_liabilities  # Added current liabilities
        )
        for balance_sheet in balance_sheets
    ]
    
    return response

# Endpoint to return all cash flow data for a given stock symbol
@router.get("/cash-flow/{symbol}", response_model=List[CashFlowResponse])
def get_cash_flow_data(symbol: str, db: Session = Depends(get_db)):
    stock_service = StockService(db)
    cash_flows = stock_service.get_cash_flow_data(symbol)
    if not cash_flows:
        raise HTTPException(status_code=404, detail="Cash flow data not found")
    
    # Convert quarter to string
    response = [
        CashFlowResponse(
            id=cash_flow.id,
            stock_symbol=cash_flow.stock_symbol,
            quarter=cash_flow.quarter.isoformat(),  # Convert date to string
            operating_cash_flow=cash_flow.operating_cash_flow,
            investing_cash_flow=cash_flow.investing_cash_flow,  # Added investing cash flow
            financing_cash_flow=cash_flow.financing_cash_flow,  # Added financing cash flow
            free_cash_flow=cash_flow.free_cash_flow,  # Added free cash flow
            capital_expenditures=cash_flow.capital_expenditures  # Added capital expenditures
        )
        for cash_flow in cash_flows
    ]
    
    return response


# ENDPOINT FOR ADDING DATA TO DB
@router.post("/add-income-statement")
def add_income_statement_to_db(request: IncomeStatementRequest, db: Session = Depends(get_db)):
    stock_service = StockService(db)
    print("request.stock_symbol", request.stock_symbol)
    stock_service.add_income_statement(request.stock_symbol)
    
    # return a success message
    return {"message": "Income statement added successfully"}

# ENDPOINT FOR ADDING BALANCE SHEET DATA TO DB
@router.post("/add-balance-sheet")
def add_balance_sheet_to_db(request: BalanceSheetRequest, db: Session = Depends(get_db)):
    stock_service = StockService(db)
    stock_service.add_balance_sheet(request.stock_symbol)
    
    # return a success message
    return {"message": "Balance sheet added successfully"}

# ENDPOINT FOR ADDING CASH FLOW DATA TO DB
@router.post("/add-cash-flow")
def add_cash_flow_to_db(request: CashFlowRequest, db: Session = Depends(get_db)):
    stock_service = StockService(db)
    stock_service.add_cash_flow(request.stock_symbol)
    
    # return a success message
    return {"message": "Cash flow added successfully"}


# ENDPOINT FOR ADDING DIVIDEND DATA TO DB
@router.post("/add-dividend")
def add_dividend_to_db(request: DividendRequest, db: Session = Depends(get_db)):
    stock_service = StockService(db)
    stock_service.add_dividend(request.stock_symbol)
    
    # return a success message
    return {"message": "Dividend added successfully"}


# ENDPOINT FOR SEARCHING STOCKS
@router.get("/search/{query}", response_model=List[StockResponse])
def search_stocks(query, db: Session = Depends(get_db)):
    service = StockService(db)
    stocks = service.search_stocks(query)
    if not stocks:
        raise HTTPException(status_code=404, detail="No stocks found")
    return stocks

# ENDPOINTS RELATED TO SECTOR ANALYSIS
# symbol u koymazsak çalışmıyor çünkü doğru endpointi seçemiyor
@router.get("/sectors-all/{symbol}", response_model=List[SectorResponse])
def get_sectors(db: Session = Depends(get_db)):
    service = StockService(db)
    return service.get_all_sectors()

@router.get("/sectors/{sector}")
def get_stocks_in_sector(sector: str, db: Session = Depends(get_db)):
    service = StockService(db)
    stocks = service.get_stocks_in_sector(sector)
    if not stocks:
        raise HTTPException(status_code=404, detail="No stocks found in this sector")
    return stocks


"""
    here is an example request: http://localhost:8001/api/stocks/sector-info/1
    here is an example response:
    {
        "sector": {
            "name": "Conglomerates",
            "sector_id": 1
        },
        "number_of_companies": 3,
        "total_market_cap": 732000000000,
        "top_3_companies": [
            {
            "stock_symbol": "KCHOL",
            "market_cap": 450000000000,
            "name": "Koc Holding",
            "sector_id": 1,
            "last_updated": "2025-01-19T13:44:09"
            },
            {
            "stock_symbol": "SAHOL",
            "market_cap": 209000000000,
            "name": "Sabanci Holding",
            "sector_id": 1,
            "last_updated": "2025-01-19T15:30:37"
            },
            {
            "stock_symbol": "AGHOL",
            "market_cap": 73000000000,
            "name": "Anadolu Grubu Holding",
            "sector_id": 1,
            "last_updated": "2025-01-15T10:52:07"
            }
        ]
        }
"""
@router.get("/sector-info/{sector_id}")
def get_sector_info(sector_id: int, db: Session = Depends(get_db)):
    service = StockService(db)
    sector_info = service.get_sector_info(sector_id)
    if not sector_info:
        raise HTTPException(status_code=404, detail="Sector info not found")
    return sector_info



# GET ALL THE STOCKS IN THE DB -> DETAİLED İNFO USING YAHOO FİNANCE
@router.get("/stocks-all/{symbol}")
def get_all_stocks(db: Session = Depends(get_db)):
    service = StockService(db)
    return service.get_all_stocks_in_detail()

# to return the sector of the given stock by symbol
@router.get("/sector/{symbol}")
def get_sector_of_stock(symbol: str, db: Session = Depends(get_db)):
    service = StockService(db)
    sector = service.get_sector_of_stock(symbol)
    if not sector:
        raise HTTPException(status_code=404, detail="Stock not found")
    return sector
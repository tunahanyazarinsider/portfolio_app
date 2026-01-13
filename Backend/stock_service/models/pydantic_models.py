from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional
from decimal import Decimal

class StockCreate(BaseModel):
    symbol: str
    name: str 
    sector: str
    market_cap: float

class StockResponse(BaseModel):
    stock_symbol: str
    name: str
    sector_id: int
    market_cap: float
    last_updated: Optional[datetime]

    class Config:
        from_attributes = True

# bu stock price oluştururken ve ayrıca stock price isterken bir date range de 
class StockPriceInput(BaseModel):
    stock_symbol: str
    start_date: date
    end_date: date


# bu ikisi stock price input ve output için
class StockPriceRequest(BaseModel):
    stock_symbol: str
    date: str

class StockPriceInRangeRequest(BaseModel):
    stock_symbol: str
    start_date: str
    end_date: str

class StockPriceResponse(BaseModel):
    stock_symbol: str
    date: str
    close_price: Optional[Decimal]

class PortfolioCreate(BaseModel):
    user_id: int
    name: str

class PortfolioResponse(BaseModel):
    portfolio_id: int
    user_id: int
    name: str
    created_at: datetime

    class Config:
        from_attributes = True

class HoldingCreate(BaseModel):
    symbol: str
    quantity: int
    price: float

class HoldingResponse(BaseModel):
    holding_id: int
    portfolio_id: int
    stock_symbol: str
    quantity: int
    average_price: float
    added_at: datetime

    class Config:
        from_attributes = True

class HoldingDecrease(BaseModel):
    quantity: int


# income statement request
class IncomeStatementRequest(BaseModel):
    stock_symbol: str


# Income Statement Response
class IncomeStatementResponse(BaseModel):
    stock_symbol: str
    quarter: str
    revenue: Optional[Decimal]
    gross_profit: Optional[Decimal]  # Added gross profit
    operating_income: Optional[Decimal]  # Added operating income
    net_profit: Optional[Decimal]
    eps: Optional[float]
    operating_margin: Optional[float]  # Added operating margin (%)

    class Config:
        from_attributes = True

# Cash Flow Request
class CashFlowRequest(BaseModel):
    stock_symbol: str

# Cash Flow Response
class CashFlowResponse(BaseModel):
    stock_symbol: str
    quarter: str
    operating_cash_flow: Optional[Decimal]
    investing_cash_flow: Optional[Decimal]  # Added investing cash flow
    financing_cash_flow: Optional[Decimal]  # Added financing cash flow
    free_cash_flow: Optional[Decimal]  # Added free cash flow
    capital_expenditures: Optional[Decimal]  # Added capital expenditures

    class Config:
        from_attributes = True

# Dividend Request
class DividendRequest(BaseModel):
    stock_symbol: str

# Dividend Response
class DividendResponse(BaseModel):
    stock_symbol: str
    payment_date: str
    amount: Optional[Decimal]

    class Config:
        from_attributes = True

# Balance Sheet Request
class BalanceSheetRequest(BaseModel):
    stock_symbol: str

# Balance Sheet Response
class BalanceSheetResponse(BaseModel):
    stock_symbol: str
    quarter: str
    total_assets: Optional[Decimal]
    total_liabilities: Optional[Decimal]  # Added total liabilities
    total_equity: Optional[Decimal]  # Added total equity
    current_assets: Optional[Decimal]  # Added current assets
    current_liabilities: Optional[Decimal]  # Added current liabilities

    class Config:
        from_attributes = True  # This will allow the response model to be created from the attributes of the class


class SectorResponse(BaseModel):
    sector_id: int
    name: str

    class Config:
        from_attributes = True


class StockWithPriceResponse(BaseModel):
    """Combined response with stock info and current price"""
    stock_symbol: str
    name: str
    sector: str
    market_cap: Optional[Decimal]
    current_price: Optional[Decimal]
    last_updated: Optional[datetime]

    class Config:
        from_attributes = True


class PaginatedStockResponse(BaseModel):
    """Paginated stocks with prices"""
    data: List[StockWithPriceResponse]
    total: int
    page: int
    pages: int
    limit: int

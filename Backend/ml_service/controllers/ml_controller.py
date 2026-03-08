import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from utils.db_context import get_db
from services.risk_analytics import get_risk_metrics, get_correlation_matrix, get_portfolio_risk
from models.pydantic_models import (
    RiskMetricsResponse,
    CorrelationRequest,
    CorrelationResponse,
    PortfolioRiskResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ml", tags=["ML Analytics"])


@router.get("/risk/{symbol}", response_model=RiskMetricsResponse)
async def stock_risk_metrics(
    symbol: str,
    period: str = Query("1y", regex="^(1m|3m|6m|1y|3y|5y)$"),
):
    """
    Get risk analytics for a single stock.

    Returns Sharpe ratio, Sortino ratio, max drawdown, volatility,
    annualized return, beta (vs BIST100), and VaR (95%).
    """
    result = get_risk_metrics(symbol, period)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.post("/correlation", response_model=CorrelationResponse)
async def stock_correlation(request: CorrelationRequest):
    """
    Compute correlation matrix between multiple stocks.

    Useful for diversification analysis. Accepts 2-20 stock symbols.
    """
    result = get_correlation_matrix(request.symbols, request.period)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/portfolio/{portfolio_id}/risk")
async def portfolio_risk_analysis(
    portfolio_id: int,
    period: str = Query("1y", regex="^(1m|3m|6m|1y|3y|5y)$"),
    db: Session = Depends(get_db),
):
    """
    Compute portfolio-level risk metrics.

    Calculates portfolio Sharpe ratio, volatility, VaR, and max drawdown
    using the actual holdings and their weights.
    """
    from sqlalchemy import text

    # Fetch portfolio holdings from the database
    holdings_query = text("""
        SELECT ph.stock_symbol, ph.quantity, ph.average_price
        FROM portfolio_holdings ph
        WHERE ph.portfolio_id = :pid
    """)
    rows = db.execute(holdings_query, {"pid": portfolio_id}).fetchall()

    if not rows:
        raise HTTPException(status_code=404, detail="Portfolio not found or empty")

    # Get current prices for each holding via Yahoo Finance
    import yfinance as yf
    holdings = []
    for row in rows:
        symbol, quantity, avg_price = row[0], int(row[1]), float(row[2])
        try:
            ticker = yf.Ticker(f"{symbol.upper()}.IS")
            current_price = ticker.info.get("currentPrice", float(avg_price))
        except Exception:
            current_price = float(avg_price)  # Fallback to average price
        holdings.append((symbol, quantity, current_price))

    result = get_portfolio_risk(holdings, period)
    result["portfolio_id"] = portfolio_id
    return result

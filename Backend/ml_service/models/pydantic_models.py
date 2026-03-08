from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import date


class RiskMetricsRequest(BaseModel):
    symbol: str = Field(..., description="Stock symbol (e.g., AGHOL)")
    period: str = Field("1y", description="Analysis period: 1m, 3m, 6m, 1y, 3y, 5y")


class RiskMetricsResponse(BaseModel):
    symbol: str
    period: str
    sharpe_ratio: Optional[float] = None
    sortino_ratio: Optional[float] = None
    max_drawdown: Optional[float] = None
    volatility: Optional[float] = None
    annualized_return: Optional[float] = None
    beta: Optional[float] = None
    var_95: Optional[float] = None
    data_points: int = 0


class CorrelationRequest(BaseModel):
    symbols: List[str] = Field(..., min_length=2, max_length=20, description="List of stock symbols")
    period: str = Field("1y", description="Analysis period: 1m, 3m, 6m, 1y, 3y, 5y")


class CorrelationResponse(BaseModel):
    symbols: List[str]
    period: str
    correlation_matrix: Dict[str, Dict[str, float]]
    data_points: int = 0


class PortfolioRiskRequest(BaseModel):
    portfolio_id: int


class PortfolioHoldingRisk(BaseModel):
    symbol: str
    weight: float
    annualized_return: Optional[float] = None
    volatility: Optional[float] = None
    sharpe_ratio: Optional[float] = None


class PortfolioRiskResponse(BaseModel):
    portfolio_id: int
    total_value: float
    portfolio_sharpe: Optional[float] = None
    portfolio_volatility: Optional[float] = None
    portfolio_var_95: Optional[float] = None
    max_drawdown: Optional[float] = None
    holdings: List[PortfolioHoldingRisk]

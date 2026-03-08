import logging
import numpy as np
import pandas as pd
import yfinance as yf
from typing import Optional, Dict, List, Tuple
from utils.cache import cache

logger = logging.getLogger(__name__)

# Risk-free rate approximation (Turkish 10-year bond ~25%, adjust as needed)
RISK_FREE_RATE = 0.25
TRADING_DAYS_PER_YEAR = 252

PERIOD_MAP = {
    "1m": "1mo",
    "3m": "3mo",
    "6m": "6mo",
    "1y": "1y",
    "3y": "3y",
    "5y": "5y",
}


def _fetch_price_history(symbol: str, period: str) -> Optional[pd.DataFrame]:
    """Fetch historical price data from Yahoo Finance with caching."""
    cache_key = f"ml_prices:{symbol}:{period}"
    cached = cache.get_cache(cache_key)
    if cached is not None:
        try:
            df = pd.DataFrame(cached)
            df["Date"] = pd.to_datetime(df["Date"])
            df = df.set_index("Date")
            return df
        except Exception:
            pass

    yf_period = PERIOD_MAP.get(period, "1y")
    ticker_symbol = f"{symbol.upper()}.IS"

    try:
        ticker = yf.Ticker(ticker_symbol)
        df = ticker.history(period=yf_period)
        if df.empty:
            logger.warning(f"No price data for {ticker_symbol} over {yf_period}")
            return None

        # Cache the data (15 min TTL for ML data)
        cache_data = df.reset_index().to_dict(orient="list")
        cache.set_cache(cache_key, cache_data, ttl=900)
        return df
    except Exception as e:
        logger.error(f"Error fetching price history for {symbol}: {e}")
        return None


def _compute_daily_returns(prices: pd.DataFrame) -> pd.Series:
    """Compute daily log returns from closing prices."""
    return np.log(prices["Close"] / prices["Close"].shift(1)).dropna()


def compute_sharpe_ratio(returns: pd.Series) -> Optional[float]:
    """Annualized Sharpe Ratio = (annualized_return - risk_free_rate) / annualized_volatility."""
    if len(returns) < 2:
        return None
    annualized_return = returns.mean() * TRADING_DAYS_PER_YEAR
    annualized_vol = returns.std() * np.sqrt(TRADING_DAYS_PER_YEAR)
    if annualized_vol == 0:
        return None
    return float((annualized_return - RISK_FREE_RATE) / annualized_vol)


def compute_sortino_ratio(returns: pd.Series) -> Optional[float]:
    """Sortino Ratio uses downside deviation instead of total volatility."""
    if len(returns) < 2:
        return None
    annualized_return = returns.mean() * TRADING_DAYS_PER_YEAR
    downside_returns = returns[returns < 0]
    if len(downside_returns) == 0:
        return None
    downside_std = downside_returns.std() * np.sqrt(TRADING_DAYS_PER_YEAR)
    if downside_std == 0:
        return None
    return float((annualized_return - RISK_FREE_RATE) / downside_std)


def compute_max_drawdown(prices: pd.DataFrame) -> Optional[float]:
    """Maximum peak-to-trough decline as a percentage."""
    if len(prices) < 2:
        return None
    close = prices["Close"]
    cumulative_max = close.cummax()
    drawdown = (close - cumulative_max) / cumulative_max
    return float(drawdown.min())


def compute_var_95(returns: pd.Series) -> Optional[float]:
    """Value at Risk at 95% confidence (historical method)."""
    if len(returns) < 20:
        return None
    return float(np.percentile(returns, 5))


def compute_beta(returns: pd.Series, period: str) -> Optional[float]:
    """Beta relative to BIST 100 index (XU100.IS)."""
    cache_key = f"ml_prices:XU100:{period}"
    cached = cache.get_cache(cache_key)
    market_df = None

    if cached is not None:
        try:
            market_df = pd.DataFrame(cached)
            market_df["Date"] = pd.to_datetime(market_df["Date"])
            market_df = market_df.set_index("Date")
        except Exception:
            market_df = None

    if market_df is None:
        yf_period = PERIOD_MAP.get(period, "1y")
        try:
            market_df = yf.Ticker("XU100.IS").history(period=yf_period)
            if not market_df.empty:
                cache_data = market_df.reset_index().to_dict(orient="list")
                cache.set_cache(cache_key, cache_data, ttl=900)
        except Exception as e:
            logger.error(f"Error fetching BIST100 data: {e}")
            return None

    if market_df is None or market_df.empty:
        return None

    market_returns = _compute_daily_returns(market_df)

    # Align dates
    aligned = pd.DataFrame({"stock": returns, "market": market_returns}).dropna()
    if len(aligned) < 10:
        return None

    covariance = aligned["stock"].cov(aligned["market"])
    market_variance = aligned["market"].var()
    if market_variance == 0:
        return None
    return float(covariance / market_variance)


def get_risk_metrics(symbol: str, period: str = "1y") -> Dict:
    """Compute all risk metrics for a given stock symbol."""
    cache_key = f"ml_risk:{symbol}:{period}"
    cached = cache.get_cache(cache_key)
    if cached is not None:
        return cached

    prices = _fetch_price_history(symbol, period)
    if prices is None or len(prices) < 2:
        return {
            "symbol": symbol,
            "period": period,
            "error": "Insufficient price data",
            "data_points": 0,
        }

    returns = _compute_daily_returns(prices)
    annualized_return = float(returns.mean() * TRADING_DAYS_PER_YEAR)
    annualized_vol = float(returns.std() * np.sqrt(TRADING_DAYS_PER_YEAR))

    result = {
        "symbol": symbol,
        "period": period,
        "sharpe_ratio": compute_sharpe_ratio(returns),
        "sortino_ratio": compute_sortino_ratio(returns),
        "max_drawdown": compute_max_drawdown(prices),
        "volatility": annualized_vol,
        "annualized_return": annualized_return,
        "beta": compute_beta(returns, period),
        "var_95": compute_var_95(returns),
        "data_points": len(returns),
    }

    # Round float values
    for key, val in result.items():
        if isinstance(val, float):
            result[key] = round(val, 4)

    cache.set_cache(cache_key, result, ttl=900)
    return result


def get_correlation_matrix(symbols: List[str], period: str = "1y") -> Dict:
    """Compute correlation matrix between multiple stocks."""
    cache_key = f"ml_corr:{'_'.join(sorted(symbols))}:{period}"
    cached = cache.get_cache(cache_key)
    if cached is not None:
        return cached

    returns_dict = {}
    for symbol in symbols:
        prices = _fetch_price_history(symbol, period)
        if prices is not None and len(prices) > 1:
            returns_dict[symbol] = _compute_daily_returns(prices)

    if len(returns_dict) < 2:
        return {
            "symbols": symbols,
            "period": period,
            "error": "Need at least 2 stocks with data",
            "correlation_matrix": {},
            "data_points": 0,
        }

    returns_df = pd.DataFrame(returns_dict).dropna()
    if len(returns_df) < 10:
        return {
            "symbols": symbols,
            "period": period,
            "error": "Insufficient overlapping data",
            "correlation_matrix": {},
            "data_points": len(returns_df),
        }

    corr_matrix = returns_df.corr()

    # Convert to nested dict with rounded values
    corr_dict = {}
    for sym in corr_matrix.columns:
        corr_dict[sym] = {
            other: round(float(corr_matrix.loc[sym, other]), 4)
            for other in corr_matrix.columns
        }

    result = {
        "symbols": list(corr_matrix.columns),
        "period": period,
        "correlation_matrix": corr_dict,
        "data_points": len(returns_df),
    }

    cache.set_cache(cache_key, result, ttl=900)
    return result


def get_portfolio_risk(
    holdings: List[Tuple[str, float, float]], period: str = "1y"
) -> Dict:
    """
    Compute portfolio-level risk metrics.

    Args:
        holdings: List of (symbol, quantity, current_price) tuples
        period: Analysis period
    Returns:
        Portfolio risk metrics dict
    """
    total_value = sum(qty * price for _, qty, price in holdings)
    if total_value == 0:
        return {"error": "Portfolio has zero value"}

    weights = []
    returns_list = []
    holding_risks = []

    for symbol, qty, price in holdings:
        weight = (qty * price) / total_value
        weights.append(weight)

        prices = _fetch_price_history(symbol, period)
        if prices is not None and len(prices) > 1:
            rets = _compute_daily_returns(prices)
            returns_list.append(rets)

            ann_ret = float(rets.mean() * TRADING_DAYS_PER_YEAR)
            ann_vol = float(rets.std() * np.sqrt(TRADING_DAYS_PER_YEAR))
            sharpe = compute_sharpe_ratio(rets)

            holding_risks.append({
                "symbol": symbol,
                "weight": round(weight, 4),
                "annualized_return": round(ann_ret, 4),
                "volatility": round(ann_vol, 4),
                "sharpe_ratio": round(sharpe, 4) if sharpe else None,
            })
        else:
            holding_risks.append({
                "symbol": symbol,
                "weight": round(weight, 4),
                "annualized_return": None,
                "volatility": None,
                "sharpe_ratio": None,
            })
            returns_list.append(None)

    # Calculate portfolio-level metrics using weighted returns
    valid_returns = [
        (w, r) for w, r in zip(weights, returns_list) if r is not None
    ]
    if not valid_returns:
        return {
            "total_value": round(total_value, 2),
            "holdings": holding_risks,
            "error": "No valid price data for portfolio",
        }

    # Build aligned returns DataFrame
    returns_df = pd.DataFrame(
        {f"s{i}": r for i, (_, r) in enumerate(valid_returns)}
    ).dropna()

    if len(returns_df) < 10:
        return {
            "total_value": round(total_value, 2),
            "holdings": holding_risks,
            "error": "Insufficient overlapping data",
        }

    valid_weights = np.array([w for w, _ in valid_returns])
    valid_weights = valid_weights / valid_weights.sum()  # Renormalize

    # Weighted portfolio returns
    portfolio_returns = returns_df.values @ valid_weights

    port_ann_ret = float(np.mean(portfolio_returns) * TRADING_DAYS_PER_YEAR)
    port_ann_vol = float(np.std(portfolio_returns) * np.sqrt(TRADING_DAYS_PER_YEAR))
    port_sharpe = (
        float((port_ann_ret - RISK_FREE_RATE) / port_ann_vol)
        if port_ann_vol > 0
        else None
    )

    # Portfolio VaR
    port_var = float(np.percentile(portfolio_returns, 5)) if len(portfolio_returns) >= 20 else None

    # Portfolio max drawdown (cumulative portfolio value)
    cumulative = np.cumprod(1 + portfolio_returns)
    running_max = np.maximum.accumulate(cumulative)
    drawdowns = (cumulative - running_max) / running_max
    port_max_dd = float(np.min(drawdowns))

    return {
        "total_value": round(total_value, 2),
        "portfolio_sharpe": round(port_sharpe, 4) if port_sharpe else None,
        "portfolio_volatility": round(port_ann_vol, 4),
        "portfolio_var_95": round(port_var, 4) if port_var else None,
        "max_drawdown": round(port_max_dd, 4),
        "holdings": holding_risks,
        "data_points": len(returns_df),
    }

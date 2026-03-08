# Price Chart - Stock Page

## Status: Temporarily Removed

The TradingView embedded widget was removed because it uses TradingView's own data feed. When it can't find a BIST symbol, it falls back to showing Apple (AAPL) instead of the actual stock. The replacement using `lightweight-charts` v5 crashed due to API breaking changes.

## What Was Done

### Backend (Complete)
- New OHLC endpoint: `POST /api/stocks/ohlc-range`
- Request body: `{ "stock_symbol": "THYAO", "start_date": "2025-01-01", "end_date": "2026-03-08" }`
- Returns: `[{ time, open, high, low, close, volume }]`
- Service method: `stock_service.get_stock_ohlc_in_range()` in `Backend/stock_service/services/stock_service.py`
- Pydantic model: `OHLCResponse` in `Backend/stock_service/models/pydantic_models.py`
- Controller: `stock_controller.py` — `POST /ohlc-range`
- Frontend service: `stockService.getStockOHLC()` in `frontend/src/services/stockService.js`
- **Tested and working** — returns correct OHLC data for all BIST stocks

### Frontend (Needs Fix)
- `lightweight-charts` v5.1.0 is installed (`npm install lightweight-charts`)
- Component file: `frontend/src/components/TechnicalAnalysisChart.jsx` (written but broken)
- Removed from `StockPriceSection.jsx` to unblock the stock page

## Problem: lightweight-charts v5 API Changes

The v5 API changed how series are created:

```js
// v4 (what we wrote):
chart.addCandlestickSeries({ upColor: '#00d4aa', ... })
chart.addAreaSeries({ lineColor: '#00d4aa', ... })
chart.addHistogramSeries({ ... })

// v5 (what's needed):
import { CandlestickSeries, AreaSeries, HistogramSeries } from 'lightweight-charts';
chart.addSeries(CandlestickSeries, { upColor: '#00d4aa', ... })
chart.addSeries(AreaSeries, { lineColor: '#00d4aa', ... })
chart.addSeries(HistogramSeries, { ... })
```

## To Complete

1. **Fix TechnicalAnalysisChart.jsx** — Update to use v5 `addSeries()` API:
   - Replace `chart.addCandlestickSeries(opts)` with `chart.addSeries(CandlestickSeries, opts)`
   - Replace `chart.addAreaSeries(opts)` with `chart.addSeries(AreaSeries, opts)`
   - Replace `chart.addHistogramSeries(opts)` with `chart.addSeries(HistogramSeries, opts)`
   - Import: `import { createChart, ColorType, CrosshairMode, CandlestickSeries, AreaSeries, HistogramSeries } from 'lightweight-charts'`

2. **Re-enable in StockPriceSection.jsx**:
   - Uncomment `import TechnicalAnalysisChart from './TechnicalAnalysisChart'`
   - Uncomment `<TechnicalAnalysisChart symbol={symbol} />`

3. **Features the chart should have**:
   - Candlestick and Line/Area chart toggle
   - Time range selector: 1W, 1M, 3M, 6M, 1Y, ALL
   - Volume histogram at the bottom
   - Dark/light theme support (matches app theme)
   - Loading spinner while data fetches
   - "No data available" message for missing data
   - Responsive (fills container width)

## Alternative: Downgrade to v4

If v5 API is too painful, downgrade:
```bash
cd frontend && npm install lightweight-charts@4
```
Then the original v4 API (`addCandlestickSeries`, etc.) will work as-is.

## Files Involved

| File | Status |
|---|---|
| `Backend/stock_service/services/stock_service.py` | Done - `get_stock_ohlc_in_range()` |
| `Backend/stock_service/controllers/stock_controller.py` | Done - `POST /ohlc-range` |
| `Backend/stock_service/models/pydantic_models.py` | Done - `OHLCResponse` |
| `frontend/src/services/stockService.js` | Done - `getStockOHLC()` |
| `frontend/src/components/TechnicalAnalysisChart.jsx` | Needs v5 API fix |
| `frontend/src/components/StockPriceSection.jsx` | Chart commented out, re-enable after fix |

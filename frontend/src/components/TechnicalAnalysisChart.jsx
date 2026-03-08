import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  ButtonGroup,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  ShowChart,
  CandlestickChart,
} from '@mui/icons-material';
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';
import { useThemeMode } from '../context/ThemeContext';
import stockService from '../services/stockService';

const TIME_RANGES = [
  { label: '1W', value: '1W' },
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: '6M', value: '6M' },
  { label: '1Y', value: '1Y' },
  { label: 'ALL', value: 'ALL' },
];

const getStartDate = (range) => {
  const now = new Date();
  switch (range) {
    case '1W': return new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
    case '1M': return new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0];
    case '3M': return new Date(now.setMonth(now.getMonth() - 3)).toISOString().split('T')[0];
    case '6M': return new Date(now.setMonth(now.getMonth() - 6)).toISOString().split('T')[0];
    case '1Y': return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().split('T')[0];
    case 'ALL': return '2015-01-01';
    default: return new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0];
  }
};

const TechnicalAnalysisChart = ({ symbol }) => {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const [chartType, setChartType] = useState('candlestick');
  const [timeRange, setTimeRange] = useState('6M');
  const [ohlcData, setOhlcData] = useState([]);
  const [loading, setLoading] = useState(true);
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  // Fetch OHLC data
  const fetchData = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    try {
      const startDate = getStartDate(timeRange);
      const endDate = new Date().toISOString().split('T')[0];
      const data = await stockService.getStockOHLC({
        stock_symbol: symbol,
        start_date: startDate,
        end_date: endDate,
      });
      setOhlcData(data || []);
    } catch (err) {
      console.error('Failed to fetch OHLC data:', err);
      setOhlcData([]);
    } finally {
      setLoading(false);
    }
  }, [symbol, timeRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Create / update chart
  useEffect(() => {
    if (!chartContainerRef.current || ohlcData.length === 0) return;

    const isDark = mode === 'dark';
    const bgColor = isDark ? '#111827' : '#ffffff';
    const textColor = isDark ? '#8b95a5' : '#6b7280';
    const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const upColor = '#00d4aa';
    const downColor = '#ff5252';

    // Destroy previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: bgColor },
        textColor: textColor,
        fontFamily: '"DM Sans", sans-serif',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: isDark ? 'rgba(0,212,170,0.3)' : 'rgba(13,147,115,0.3)', width: 1, style: 2 },
        horzLine: { color: isDark ? 'rgba(0,212,170,0.3)' : 'rgba(13,147,115,0.3)', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: borderColor,
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: borderColor,
        timeVisible: false,
        rightOffset: 5,
        barSpacing: chartType === 'candlestick' ? 6 : 3,
      },
      handleScroll: { vertTouchDrag: false },
    });

    chartRef.current = chart;

    // Add main series
    if (chartType === 'candlestick') {
      const series = chart.addCandlestickSeries({
        upColor: upColor,
        downColor: downColor,
        borderUpColor: upColor,
        borderDownColor: downColor,
        wickUpColor: upColor,
        wickDownColor: downColor,
      });
      series.setData(ohlcData.map(d => ({
        time: d.time, open: d.open, high: d.high, low: d.low, close: d.close,
      })));
      seriesRef.current = series;
    } else {
      const series = chart.addAreaSeries({
        lineColor: upColor,
        topColor: isDark ? 'rgba(0,212,170,0.28)' : 'rgba(13,147,115,0.2)',
        bottomColor: isDark ? 'rgba(0,212,170,0.02)' : 'rgba(13,147,115,0.02)',
        lineWidth: 2,
      });
      series.setData(ohlcData.map(d => ({ time: d.time, value: d.close })));
      seriesRef.current = series;
    }

    // Add volume histogram
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });
    volumeSeries.setData(ohlcData.map(d => ({
      time: d.time,
      value: d.volume || 0,
      color: d.close >= d.open
        ? (isDark ? 'rgba(0,212,170,0.2)' : 'rgba(13,147,115,0.15)')
        : (isDark ? 'rgba(255,82,82,0.2)' : 'rgba(220,38,38,0.15)'),
    })));
    volumeSeriesRef.current = volumeSeries;

    chart.timeScale().fitContent();

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [ohlcData, mode, chartType]);

  return (
    <Box sx={{ mt: 2 }}>
      {/* Controls row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        {/* Chart type toggle */}
        <ButtonGroup size="small" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}>
          <Tooltip title="Candlestick">
            <IconButton
              onClick={() => setChartType('candlestick')}
              sx={{
                borderRadius: '8px 0 0 8px',
                color: chartType === 'candlestick' ? 'primary.main' : 'text.secondary',
                backgroundColor: chartType === 'candlestick'
                  ? (theme.palette.mode === 'dark' ? 'rgba(0,212,170,0.1)' : 'rgba(13,147,115,0.08)')
                  : 'transparent',
              }}
            >
              <CandlestickChart fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Line">
            <IconButton
              onClick={() => setChartType('line')}
              sx={{
                borderRadius: '0 8px 8px 0',
                color: chartType === 'line' ? 'primary.main' : 'text.secondary',
                backgroundColor: chartType === 'line'
                  ? (theme.palette.mode === 'dark' ? 'rgba(0,212,170,0.1)' : 'rgba(13,147,115,0.08)')
                  : 'transparent',
              }}
            >
              <ShowChart fontSize="small" />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        {/* Time range toggle */}
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={(e, val) => val && setTimeRange(val)}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              border: '1px solid',
              borderColor: 'divider',
              color: 'text.secondary',
              fontSize: '0.75rem',
              fontWeight: 600,
              px: 1.5,
              py: 0.5,
              fontFamily: '"DM Sans", sans-serif',
              '&.Mui-selected': {
                color: 'primary.main',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,212,170,0.1)' : 'rgba(13,147,115,0.08)',
                borderColor: 'primary.main',
              },
            },
          }}
        >
          {TIME_RANGES.map(r => (
            <ToggleButton key={r.value} value={r.value}>{r.label}</ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Chart container */}
      <Box
        sx={{
          height: '500px',
          width: '100%',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          position: 'relative',
          backgroundColor: theme.palette.mode === 'dark' ? '#111827' : '#ffffff',
        }}
      >
        {loading && (
          <Box sx={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(17,24,39,0.8)' : 'rgba(255,255,255,0.8)',
          }}>
            <CircularProgress size={32} sx={{ color: 'primary.main' }} />
          </Box>
        )}
        {!loading && ohlcData.length === 0 && (
          <Box sx={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2,
          }}>
            <Typography color="text.secondary">No chart data available for {symbol}</Typography>
          </Box>
        )}
        <Box ref={chartContainerRef} sx={{ width: '100%', height: '100%' }} />
      </Box>
    </Box>
  );
};

export default TechnicalAnalysisChart;

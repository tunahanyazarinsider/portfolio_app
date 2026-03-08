import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  ButtonGroup,
  useTheme
} from '@mui/material';
import {
  ShowChart,
  CandlestickChart,
} from '@mui/icons-material';
import { useThemeMode } from '../context/ThemeContext';

let tvScriptLoadingPromise;

const TechnicalAnalysisChart = ({ symbol }) => {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const [chartType, setChartType] = useState('candlestick');
  const widgetRef = useRef(null);
  const onLoadScriptRef = useRef();

  const handleChartTypeChange = (type) => {
    setChartType(type);
    createWidget(mode, type);
  };

  useEffect(() => {
    onLoadScriptRef.current = () => createWidget(mode, chartType);

    if (!tvScriptLoadingPromise) {
      tvScriptLoadingPromise = new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.type = 'text/javascript';
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }

    tvScriptLoadingPromise.then(() => onLoadScriptRef.current && onLoadScriptRef.current());

    return () => {
      onLoadScriptRef.current = null;
    };
  }, [symbol, mode, chartType]);

  function createWidget(themeMode = 'dark', chartStyle = 'candlestick') {
    if (document.getElementById('technical-analysis-chart') && 'TradingView' in window) {
      if (widgetRef.current) {
        document.getElementById('technical-analysis-chart').innerHTML = '';
      }

      const chartStyles = {
        candlestick: 1,
        line: 3,
      };

      const isDark = themeMode === 'dark';

      widgetRef.current = new window.TradingView.widget({
        autosize: true,
        symbol: `BIST:${symbol}`,
        interval: "D",
        timezone: "Europe/Istanbul",
        theme: isDark ? 'dark' : 'light',
        style: chartStyles[chartStyle],
        locale: "tr",
        toolbar_bg: isDark ? "#111827" : "#ffffff",
        enable_publishing: false,
        allow_symbol_change: false,
        container_id: "technical-analysis-chart",
        hide_top_toolbar: false,
        hide_side_toolbar: false,
        withdateranges: true,
        studies: [
          "MASimple@tv-basicstudies",
          "RSI@tv-basicstudies",
          "MACD@tv-basicstudies",
          "StochasticRSI@tv-basicstudies",
          "VolumeProfil@tv-basicstudies"
        ],
        disabled_features: [
          "use_localstorage_for_settings",
          "header_symbol_search",
          "symbol_search_hot_key",
          "header_compare",
        ],
        enabled_features: [
          "study_templates",
          "create_volume_indicator_by_default",
          "side_toolbar_in_fullscreen_mode",
          "show_chart_property_page",
          "hide_last_na_study_output"
        ],
        overrides: {
          "mainSeriesProperties.candleStyle.upColor": "#00d4aa",
          "mainSeriesProperties.candleStyle.downColor": "#ff5252",
          "mainSeriesProperties.candleStyle.wickUpColor": "#00d4aa",
          "mainSeriesProperties.candleStyle.wickDownColor": "#ff5252",
          "mainSeriesProperties.candleStyle.borderUpColor": "#00d4aa",
          "mainSeriesProperties.candleStyle.borderDownColor": "#ff5252",
          "scalesProperties.textColor": isDark ? "#8b95a5" : "#6b7280",
          "paneProperties.backgroundType": "solid",
          "paneProperties.background": isDark ? "#111827" : "#ffffff",
          "paneProperties.gridProperties.color": isDark ? "#1a2035" : "#f3f4f6",
          "mainSeriesProperties.showPriceLine": true,
        },
        loading_screen: {
          backgroundColor: isDark ? "#111827" : "#ffffff",
          foregroundColor: isDark ? "#00d4aa" : "#0d9373",
        },
      });
    }
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1.5, gap: 0.5 }}>
        <ButtonGroup size="small" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}>
          <Tooltip title="Candlestick">
            <IconButton
              onClick={() => handleChartTypeChange('candlestick')}
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
              onClick={() => handleChartTypeChange('line')}
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
      </Box>

      <Box
        id="technical-analysis-chart"
        sx={{
          height: '600px',
          width: '100%',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          '& iframe': { border: 'none' },
        }}
      />
    </Box>
  );
};

export default TechnicalAnalysisChart;

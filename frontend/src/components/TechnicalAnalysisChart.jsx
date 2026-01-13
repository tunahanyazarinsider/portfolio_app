// src/components/TechnicalAnalysisChart.jsx
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
  BarChart,
  LightMode,
  DarkMode
} from '@mui/icons-material';

let tvScriptLoadingPromise;

const TechnicalAnalysisChart = ({ symbol }) => {
  const theme = useTheme();
  const [chartType, setChartType] = useState('candlestick');
  const [themeMode, setThemeMode] = useState('light');
  const widgetRef = useRef(null);
  const onLoadScriptRef = useRef();

  const handleChartTypeChange = (type) => {
    setChartType(type);
    createWidget(themeMode, type);
  };

  const handleThemeChange = () => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newTheme);
    createWidget(newTheme, chartType);
  };

  useEffect(() => {
    onLoadScriptRef.current = () => createWidget(themeMode, chartType);

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
  }, [symbol, themeMode, chartType]);

  function createWidget(theme = 'light', chartStyle = 'candlestick') {
    if (document.getElementById('technical-analysis-chart') && 'TradingView' in window) {
      if (widgetRef.current) {
        document.getElementById('technical-analysis-chart').innerHTML = '';
      }

      const chartStyles = {
        candlestick: 1, // Candlestick
        line: 3,       // Line
      };    

      widgetRef.current = new window.TradingView.widget({
        autosize: true,
        symbol: `BIST:${symbol}`,
        interval: "D",
        timezone: "Europe/Istanbul",
        theme: theme,
        style: chartStyles[chartStyle],
        locale: "tr",
        toolbar_bg: theme === 'light' ? "#f1f3f6" : "#2a2e39",
        enable_publishing: false,
        allow_symbol_change: false, // user should not be able to change symbol
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
          "mainSeriesProperties.candleStyle.upColor": "#26a69a",
          "mainSeriesProperties.candleStyle.downColor": "#ef5350",
          "mainSeriesProperties.candleStyle.wickUpColor": "#26a69a",
          "mainSeriesProperties.candleStyle.wickDownColor": "#ef5350",
          "mainSeriesProperties.candleStyle.borderUpColor": "#26a69a",
          "mainSeriesProperties.candleStyle.borderDownColor": "#ef5350",
          "scalesProperties.textColor": theme === 'light' ? "#555" : "#999",
          "paneProperties.backgroundType": "solid",
          "paneProperties.background": theme === 'light' ? "#ffffff" : "#131722",
          "paneProperties.gridProperties.color": theme === 'light' ? "#F0F3FA" : "#2A2E39",
          "mainSeriesProperties.showPriceLine": true,
        },
        loading_screen: {
          backgroundColor: theme === 'light' ? "#ffffff" : "#131722",
          foregroundColor: theme === 'light' ? "#2962FF" : "#5d9cf5",
        },
      });
    }
  }

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2,
        background: themeMode === 'light' ? 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)' : 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        borderRadius: 2
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        {/* Chart Type Selector */}
        <ButtonGroup variant="outlined" size="small">
          <Tooltip title="Candlestick">
            <IconButton 
              onClick={() => handleChartTypeChange('candlestick')}
              color={chartType === 'candlestick' ? 'primary' : 'default'}
            >
              <CandlestickChart />
            </IconButton>
          </Tooltip>
          <Tooltip title="Line">
            <IconButton 
              onClick={() => handleChartTypeChange('line')}
              color={chartType === 'line' ? 'primary' : 'default'}
            >
              <ShowChart />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        {/* Theme Toggle */}
        <Tooltip title={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}>
          <IconButton onClick={handleThemeChange}>
            {themeMode === 'light' ? <DarkMode /> : <LightMode />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* TradingView Chart Container */}
      <Box
        id="technical-analysis-chart"
        sx={{
          height: '600px',
          width: '100%',
          borderRadius: 1,
          overflow: 'hidden',
          '& iframe': {
            border: 'none',
          }
        }}
      />
    </Paper>
  );
};

export default TechnicalAnalysisChart;
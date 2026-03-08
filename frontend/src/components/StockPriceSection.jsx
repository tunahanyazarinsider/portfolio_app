import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  Divider,
  useTheme
} from '@mui/material';
import {
  ArrowUpward,
  ArrowDownward,
  ShowChart,
  Schedule,
  Timeline
} from '@mui/icons-material';
import TechnicalAnalysisChart from './TechnicalAnalysisChart';
import stockService from '../services/stockService';

const StockPriceSection = ({ symbol, stockInfo, stock, price, loading }) => {
  const theme = useTheme();
  const [priceChanges, setPriceChanges] = useState({});

  useEffect(() => {
    const UpdatePriceChanges = async () => {
      const stockPricesInPredefinedDates = await stockService.getStockPriceInPredefinedDateRange(symbol);
      const currentPrice = stockInfo?.currentPrice;

      const getPriceAtIndex = (index) =>
        stockPricesInPredefinedDates[index]
          ? parseFloat(stockPricesInPredefinedDates[index].close_price)
          : null;

      const priceChangesData = {
        '1_week': currentPrice && getPriceAtIndex(1)
          ? ((currentPrice - getPriceAtIndex(1)) / getPriceAtIndex(1)) * 100 : null,
        '1_month': currentPrice && getPriceAtIndex(2)
          ? ((currentPrice - getPriceAtIndex(2)) / getPriceAtIndex(2)) * 100 : null,
        '3_month': currentPrice && getPriceAtIndex(3)
          ? ((currentPrice - getPriceAtIndex(3)) / getPriceAtIndex(3)) * 100 : null,
        '1_year': currentPrice && getPriceAtIndex(5)
          ? ((currentPrice - getPriceAtIndex(5)) / getPriceAtIndex(5)) * 100 : null,
        '5_year': currentPrice && getPriceAtIndex(6)
          ? ((currentPrice - getPriceAtIndex(6)) / getPriceAtIndex(6)) * 100 : null,
      };
      setPriceChanges(priceChangesData);
    };

    if (symbol && stockInfo?.currentPrice) {
      UpdatePriceChanges();
    }
  }, [symbol, stockInfo, price]);

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency', currency: 'TRY', minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value) => {
    if (!value) return 'N/A';
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatVolume = (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('tr-TR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  };

  const previousClose = stockInfo?.regularMarketPreviousClose;
  const dailyPriceChange = price - previousClose;
  const dailyChange = (dailyPriceChange / previousClose) * 100;

  const ReturnIndicator = ({ label, value }) => {
    const isPositive = value > 0;
    return (
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
          {isPositive
            ? <ArrowUpward sx={{ fontSize: 14, color: 'success.main' }} />
            : <ArrowDownward sx={{ fontSize: 14, color: 'error.main' }} />
          }
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              fontFamily: '"JetBrains Mono", monospace',
              color: isPositive ? 'success.main' : 'error.main',
            }}
          >
            {value ? `${isPositive ? '+' : ''}${value.toFixed(2)}%` : 'N/A'}
          </Typography>
        </Stack>
      </Box>
    );
  };

  const InfoCard = ({ title, children }) => (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: '16px',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Price Header */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                {stock?.name}
              </Typography>
              <Chip
                label={stock?.stock_symbol}
                size="small"
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,212,170,0.12)' : 'rgba(13,147,115,0.1)',
                  color: 'primary.main',
                  border: 'none',
                }}
              />
            </Stack>

            <Stack direction="row" alignItems="baseline" spacing={2}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  fontFamily: '"JetBrains Mono", monospace',
                  letterSpacing: '-0.02em',
                }}
              >
                {formatCurrency(price)}
              </Typography>
              <Chip
                icon={dailyChange >= 0 ? <ArrowUpward sx={{ fontSize: 16 }} /> : <ArrowDownward sx={{ fontSize: 16 }} />}
                label={`${formatCurrency(dailyPriceChange)} (${formatPercentage(dailyChange)})`}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.8rem',
                  backgroundColor: dailyChange >= 0
                    ? (theme.palette.mode === 'dark' ? 'rgba(0,230,118,0.12)' : 'rgba(13,147,115,0.1)')
                    : (theme.palette.mode === 'dark' ? 'rgba(255,82,82,0.12)' : 'rgba(220,38,38,0.1)'),
                  color: dailyChange >= 0 ? 'success.main' : 'error.main',
                  border: 'none',
                  '& .MuiChip-icon': { color: 'inherit' },
                }}
              />
            </Stack>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Stack direction="row" spacing={2}>
            <InfoCard title="Volume">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: '"JetBrains Mono", monospace' }}>
                  {formatVolume(stockInfo?.volume)}
                </Typography>
                <Timeline sx={{ fontSize: 16, color: 'text.secondary' }} />
              </Stack>
            </InfoCard>
            <InfoCard title="Market Time">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: '"JetBrains Mono", monospace' }}>
                  {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </Typography>
                <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
              </Stack>
            </InfoCard>
          </Stack>
        </Grid>

        <Grid item xs={12} md={6}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <InfoCard title="Today's Range">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: '"JetBrains Mono", monospace' }}>
                    {formatCurrency(stockInfo?.dayLow)}
                  </Typography>
                  <Box
                    sx={{
                      flex: 1, height: 3,
                      background: `linear-gradient(to right, ${theme.palette.error.main}, ${theme.palette.success.main})`,
                      borderRadius: 2, opacity: 0.6,
                    }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: '"JetBrains Mono", monospace' }}>
                    {formatCurrency(stockInfo?.dayHigh)}
                  </Typography>
                </Box>
              </InfoCard>
            </Grid>
            <Grid item xs={6}>
              <InfoCard title="Previous Close">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: '"JetBrains Mono", monospace' }}>
                    {formatCurrency(previousClose)}
                  </Typography>
                  <ShowChart sx={{ fontSize: 16, color: 'text.secondary' }} />
                </Stack>
              </InfoCard>
            </Grid>
            <Grid item xs={12}>
              <Card
                elevation={0}
                sx={{
                  mt: 1,
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <CardContent>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                    Performance
                  </Typography>
                  <Grid container spacing={1}>
                    {[
                      { label: 'Today', value: dailyChange },
                      { label: '1W', value: priceChanges?.['1_week'] },
                      { label: '1M', value: priceChanges?.['1_month'] },
                      { label: '3M', value: priceChanges?.['3_month'] },
                      { label: '1Y', value: priceChanges?.['1_year'] },
                      { label: '5Y', value: priceChanges?.['5_year'] },
                    ].map((item) => (
                      <Grid item xs={4} sm={2} key={item.label}>
                        <ReturnIndicator label={item.label} value={item.value} />
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <TechnicalAnalysisChart symbol={symbol} />
    </Paper>
  );
};

export default StockPriceSection;

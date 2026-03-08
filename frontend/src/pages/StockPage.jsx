import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, CircularProgress, Grid } from '@mui/material';

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useParams } from 'react-router-dom';
import stockService from '../services/stockService';
import { useRef } from 'react';
import newsService from '../services/newsService';

import NewsSection from '../components/NewsSection';
import StockOverviewCard from '../components/StockOverviewCard';
import FinancialRatiosCard from '../components/FinancialRatiosCard';
import StockPriceDetailsCard from '../components/StockPriceDetailsCard';
import FinancialChartsSection from '../components/FinancialChartsSection';
import StockPriceSection from '../components/StockPriceSection';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const StockPage = () => {
  const { symbol } = useParams();
  const [stock, setStock] = useState(null);
  const [stockInfo, setStockInfo] = useState(null);
  const [price, setPrice] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [priceData, setPriceData] = useState([]);
  const [dateRange, setDateRange] = useState('1M');

  const dateRanges = [
    { label: 'Last Week', value: '1W' },
    { label: 'Last Month', value: '1M' },
    { label: 'Year to Date', value: 'YTD' },
    { label: 'Last Year', value: '1Y' },
    { label: 'Last 5 Years', value: '5Y' },
  ];

  const getStartDate = (range) => {
    const today = new Date();
    switch (range) {
      case '1W': return new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
      case '1M': return new Date(today.setMonth(today.getMonth() - 1)).toISOString().split('T')[0];
      case 'YTD': return new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
      case '1Y': return new Date(today.setFullYear(today.getFullYear() - 1)).toISOString().split('T')[0];
      case '5Y': return new Date(today.setFullYear(today.getFullYear() - 5)).toISOString().split('T')[0];
      default: return new Date(today.setMonth(today.getMonth() - 1)).toISOString().split('T')[0];
    }
  };

  const [revenueChartData, setRevenueChartData] = useState(null);
  const [operatingIncomeChartData, setOperatingIncomeChartData] = useState(null);
  const [operatingMarginChartData, setOperatingMarginChartData] = useState(null);
  const [grossProfitChartData, setGrossProfitChartData] = useState(null);
  const [netProfitChartData, setNetProfitChartData] = useState(null);
  const [totalAssetsChartData, setTotalAssetsChartData] = useState(null);
  const [totalLiabilitiesChartData, setTotalLiabilitiesChartData] = useState(null);
  const [totalEquityChartData, setTotalEquityChartData] = useState(null);
  const [currentAssetsChartData, setCurrentAssetsChartData] = useState(null);
  const [currentLiabilitiesChartData, setCurrentLiabilitiesChartData] = useState(null);
  const [freeCashFlowChartData, setFreeCashFlowChartData] = useState(null);
  const [news, setNews] = useState(null);

  const priceInfoRef = useRef(null);
  const generalInfoRef = useRef(null);
  const ratiosRef = useRef(null);
  const priceRef = useRef(null);

  const handleTimeRangeChange = async (range) => {
    try {
      setLoading(true);
      let startDate, endDate = new Date().toISOString().split('T')[0];

      switch(range) {
        case '1D': startDate = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0]; break;
        case '1W': startDate = new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]; break;
        case '1M': startDate = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]; break;
        case '3M': startDate = new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0]; break;
        case '6M': startDate = new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0]; break;
        case '1Y': startDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0]; break;
        case 'ALL': startDate = '2020-01-01'; break;
        default: startDate = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
      }

      const priceResponse = await stockService.getStockPriceInDateRange({
        stock_symbol: symbol, start_date: startDate, end_date: endDate,
      });
      setPriceData(priceResponse);
    } catch (error) {
      console.error('Error fetching price data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const stock = await stockService.getStock(symbol);
        if (!stock) { setStock(null); setLoading(false); return; }
        setStock(stock);

        const stockInfo = await stockService.getStockInfo(symbol);
        if (!stockInfo) { setStock(null); setLoading(false); return; }
        setStockInfo(stockInfo);

        const company_name = stockInfo.shortName;
        const news = await newsService.getNewsAboutStock(company_name);
        setNews(news);

        const priceData = await stockService.getStockPrice(symbol);
        setPrice(priceData.close_price);

        await handleTimeRangeChange('1M');

        const financialData = await stockService.getFinancialData(stock.stock_symbol);
        const financialLabels = financialData.map(f => f.quarter);

        const makeChartData = (label, dataKey, color) => ({
          labels: financialLabels,
          datasets: [{
            label,
            data: financialData.map(f => f[dataKey]),
            backgroundColor: `${color}80`,
            borderColor: color,
            borderWidth: 1,
          }],
        });

        setRevenueChartData(makeChartData('Revenue', 'revenue', '#00d4aa'));
        setOperatingIncomeChartData(makeChartData('Operating Income', 'operating_income', '#7c5cfc'));
        setOperatingMarginChartData(makeChartData('Operating Margin', 'operating_margin', '#ffc107'));
        setGrossProfitChartData(makeChartData('Gross Profit', 'gross_profit', '#00b0ff'));
        setNetProfitChartData(makeChartData('Net Profit', 'net_profit', '#ff5252'));

        const balanceSheetData = await stockService.getBalanceSheetData(stock.stock_symbol);
        const bsLabels = balanceSheetData.map(b => b.quarter);

        const makeBSChartData = (label, dataKey, color) => ({
          labels: bsLabels,
          datasets: [{
            label,
            data: balanceSheetData.map(b => b[dataKey]),
            backgroundColor: `${color}80`,
            borderColor: color,
            borderWidth: 1,
          }],
        });

        setTotalAssetsChartData(makeBSChartData('Total Assets', 'total_assets', '#00d4aa'));
        setTotalLiabilitiesChartData(makeBSChartData('Total Liabilities', 'total_liabilities', '#7c5cfc'));
        setTotalEquityChartData(makeBSChartData('Total Equity', 'total_equity', '#ffc107'));
        setCurrentAssetsChartData(makeBSChartData('Current Assets', 'current_assets', '#00b0ff'));
        setCurrentLiabilitiesChartData(makeBSChartData('Current Liabilities', 'current_liabilities', '#ff5252'));

        const cashFlowData = await stockService.getCashFlowData(stock.stock_symbol);
        setFreeCashFlowChartData({
          labels: cashFlowData.map(c => c.quarter),
          datasets: [{
            label: 'Free Cash Flow',
            data: cashFlowData.map(c => c.free_cash_flow),
            backgroundColor: '#00d4aa80',
            borderColor: '#00d4aa',
            borderWidth: 1,
          }],
        });
      } catch (error) {
        console.error('Error fetching stock data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [symbol]);

  const fetchChartData = async (range) => {
    try {
      const startDate = getStartDate(range);
      const endDate = new Date().toISOString().split('T')[0];
      const priceResponse = await stockService.getStockPriceInDateRange({
        stock_symbol: symbol, start_date: startDate, end_date: endDate,
      });

      setChartData({
        labels: priceResponse.map(p => p.date),
        datasets: [{
          label: `${stock?.name || symbol} Stock Price`,
          data: priceResponse.map(p => p.close_price),
          borderColor: '#00d4aa',
          backgroundColor: 'rgba(0, 212, 170, 0.1)',
          pointRadius: 3,
          pointHoverRadius: 5,
        }],
      });
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  useEffect(() => {
    if (!stock) return;
    fetchChartData(dateRange);
  }, [dateRange, stock]);

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 8, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress sx={{ color: 'primary.main' }} />
        </Box>
      </Container>
    );
  }

  if (!stock) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 8, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Stock not found</Typography>
          <Typography color="text.secondary">The stock symbol "{symbol}" could not be found.</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, pb: { xs: 10, md: 4 } }}>
      <Box ref={priceInfoRef} sx={{ mb: 4 }}>
        <StockPriceSection symbol={symbol} stockInfo={stockInfo} stock={stock} price={price} loading={loading} />
      </Box>

      <Box ref={generalInfoRef} sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <StockOverviewCard stockInfo={stockInfo} />
          </Grid>
        </Grid>
      </Box>

      <Box ref={ratiosRef} sx={{ mb: 4 }}>
        <FinancialRatiosCard stockInfo={stockInfo} />
      </Box>

      <Box ref={priceRef} sx={{ mb: 4 }}>
        <StockPriceDetailsCard stockInfo={stockInfo} />
      </Box>

      <FinancialChartsSection
        revenueChartData={revenueChartData}
        operatingIncomeChartData={operatingIncomeChartData}
        operatingMarginChartData={operatingMarginChartData}
        grossProfitChartData={grossProfitChartData}
        netProfitChartData={netProfitChartData}
        totalAssetsChartData={totalAssetsChartData}
        totalLiabilitiesChartData={totalLiabilitiesChartData}
        totalEquityChartData={totalEquityChartData}
        currentAssetsChartData={currentAssetsChartData}
        currentLiabilitiesChartData={currentLiabilitiesChartData}
        freeCashFlowChartData={freeCashFlowChartData}
      />

      <Box sx={{ my: 4 }}>
        <NewsSection news={news} />
      </Box>
    </Container>
  );
};

export default StockPage;

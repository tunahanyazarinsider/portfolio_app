import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, CircularProgress, Grid, Paper, ListItemText, ListItem, Chip, List, IconButton, Drawer, Button, ButtonGroup } from '@mui/material';

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useParams } from 'react-router-dom';
import stockService from '../services/stockService';
import { useRef } from 'react';
import newsService from '../services/newsService';

// Import the components
import NewsSection from '../components/NewsSection';
import StockOverviewCard from '../components/StockOverviewCard';
import FinancialRatiosCard from '../components/FinancialRatiosCard';
import StockPriceDetailsCard from '../components/StockPriceDetailsCard';
import FinancialChartsSection from '../components/FinancialChartsSection';
// stock price chart
import StockPriceSection from '../components/StockPriceSection';
import { Padding } from '@mui/icons-material';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const StockPage = () => {
  const { symbol } = useParams(); // Get the stock symbol from the URL
  const [stock, setStock] = useState(null); // to store the basic info of the stock
  const [stockInfo, setStockInfo] = useState(null); // to store the general info of the stock
  const [price, setPrice] = useState(null); // to store the most recent stock price 
  const [chartData, setChartData] = useState(null); // to store the stock price data for the chart
  const [loading, setLoading] = useState(true);

  const [priceData, setPriceData] = useState([]);

  // hisse fiyat tablosundaki zaman aralığı seçimi
  const [dateRange, setDateRange] = useState('1M'); // Default date range is 1 month
  // label lerin ve value ların tanımlanması. Chart da label lar görünecek, value lar ise backend e gönderilecek
  const dateRanges = [
    { label: 'Last Week', value: '1W' },
    { label: 'Last Month', value: '1M' },
    { label: 'Year to Date', value: 'YTD' },
    { label: 'Last Year', value: '1Y' },
    { label: 'Last 5 Years', value: '5Y' },
  ];

  // hisse fiyat tablosundaki zaman aralığı değiştiğinde çalışacak fonksiyon
  const getStartDate = (range) => {
    const today = new Date();
    switch (range) {
      case '1W':
        return new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
      case '1M':
        return new Date(today.setMonth(today.getMonth() - 1)).toISOString().split('T')[0];
      case 'YTD':
        return new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
      case '1Y':
        return new Date(today.setFullYear(today.getFullYear() - 1)).toISOString().split('T')[0];
      case '5Y':
        return new Date(today.setFullYear(today.getFullYear() - 5)).toISOString().split('T')[0];
      default:
        return new Date(today.setMonth(today.getMonth() - 1)).toISOString().split('T')[0];
    }
  };

  // income statement related 
  const [revenueChartData, setRevenueChartData] = useState(null);
  const [operatingIncomeChartData, setOperatingIncomeChartData] = useState(null);
  const [operatingMarginChartData, setOperatingMarginChartData] = useState(null);
  const [grossProfitChartData, setGrossProfitChartData] = useState(null);
  const [netProfitChartData, setNetProfitChartData] = useState(null);
  
  // balance sheet related
  const [totalAssetsChartData, setTotalAssetsChartData] = useState(null);
  const [totalLiabilitiesChartData, setTotalLiabilitiesChartData] = useState(null);
  const [totalEquityChartData, setTotalEquityChartData] = useState(null);
  const [currentAssetsChartData, setCurrentAssetsChartData] = useState(null);
  const [currentLiabilitiesChartData, setCurrentLiabilitiesChartData] = useState(null);

  // cash flow statement related
  const [freeCashFlowChartData, setFreeCashFlowChartData] = useState(null);

  // news related 
  const [news, setNews] = useState(null);


  // Fields for navigation - not used anymore can be deleted ama jsx deki ref leride silmemiz gerekir.
  const fields = [
    { id: 'price-info', label: 'Price Info' },
    { id: 'general-info', label: 'General Info' },
    { id: 'ratios', label: 'Ratios' },
    { id: 'price', label: 'Price Details' },
    { id: 'debt-ratios', label: 'Debt Ratios' },
    { id: 'charts', label: 'Financial Charts' },
    { id: 'balance-sheet', label: 'Balance Sheet' },
    { id: 'cash-flow', label: 'Cash Flow' },
  ];

  // Refs for navigation
  const priceInfoRef = useRef(null);
  const generalInfoRef = useRef(null);
  const ratiosRef = useRef(null);
  const priceRef = useRef(null);
  const debtRatiosRef = useRef(null);
  const chartsRef = useRef(null);
  const balanceSheetRef = useRef(null);
  const cashFlowRef = useRef(null);

  const refs = {
    'price-info': priceInfoRef,
    'general-info': generalInfoRef,
    'ratios': ratiosRef,
    'price': priceRef,
    'debt-ratios': debtRatiosRef,
    'charts': chartsRef,
    'balance-sheet': balanceSheetRef,
    'cash-flow': cashFlowRef,
  };

  const handleNavigate = (id) => {
    const targetRef = refs[id];
    if (targetRef && targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Function to fetch price data based on time range
  const handleTimeRangeChange = async (range) => {
    try {
      setLoading(true);
      let startDate, endDate = new Date().toISOString().split('T')[0];
      
      // Calculate start date based on selected range
      switch(range) {
        case '1D':
          startDate = new Date(new Date().setDate(new Date().getDate() - 1))
            .toISOString().split('T')[0];
          break;
        case '1W':
          startDate = new Date(new Date().setDate(new Date().getDate() - 7))
            .toISOString().split('T')[0];
          break;
        case '1M':
          startDate = new Date(new Date().setMonth(new Date().getMonth() - 1))
            .toISOString().split('T')[0];
          break;
        case '3M':
          startDate = new Date(new Date().setMonth(new Date().getMonth() - 3))
            .toISOString().split('T')[0];
          break;
        case '6M':
          startDate = new Date(new Date().setMonth(new Date().getMonth() - 6))
            .toISOString().split('T')[0];
          break;
        case '1Y':
          startDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1))
            .toISOString().split('T')[0];
          break;
        case 'ALL':
          startDate = '2020-01-01'; // Or whatever date you want to start from
          break;
        default:
          startDate = new Date(new Date().setMonth(new Date().getMonth() - 1))
            .toISOString().split('T')[0];
      }

      const priceResponse = await stockService.getStockPriceInDateRange({
        stock_symbol: symbol,
        start_date: startDate,
        end_date: endDate,
      });

      setPriceData(priceResponse);
    } catch (error) {
      console.error('Error fetching price data:', error);
    } finally {
      setLoading(false);
    }
  };

  // MAIN USE EFFECT TO FETCH STOCK DATA
  useEffect(() => {
    const fetchStockData = async () => {
      try {
        // get the stock from the db
        const stock = await stockService.getStock(symbol);
        /*
        example output:
        {"stock_symbol":"AGHOL","name":"Anadolu Grubu Holding","sector_id":1,"market_cap":73000000000.0,"last_updated":"2025-01-15T10:52:07"}
        */
        
        // if stock is not in the database, set the stock to null and return the jsx below
        if (!stock) {
            setStock(null);
            setLoading(false);
            return;
          }

        setStock(stock);

        // Fetch stock general info
        const stockInfo = await stockService.getStockInfo(symbol);
        if(!stockInfo) {
          setStock(null);
          setLoading(false);
          return;
        }
        setStockInfo(stockInfo);

  
        // fetch the news for the stock
        const company_name = stockInfo.shortName;
        // we make the query the name of the company not the symbol
        const news = await newsService.getNewsAboutStock(company_name);
        setNews(news);

        // Fetch the most recent stock price
        const priceData = await stockService.getStockPrice(symbol);
        setPrice(priceData.close_price);

        // Fetch initial price data with default range (1M)
        await handleTimeRangeChange('1M');

        /*
        // Fetch price data for the chart
        const priceResponse = await stockService.getStockPriceInDateRange({
          stock_symbol: symbol,
          start_date: '2024-01-14',
          end_date: '2025-01-14',
        });

        // we need to reverse the data to make the recent one to the right
        priceResponse.reverse();

        // Prepare chart data
        const labels = priceResponse.map(price => price.date);
        const data = priceResponse.map(price => price.close_price);

        
        example priceResponse:
        [
          {"stock_symbol": "AGHOL",
          "date":"2024-06-03
            ,"close_price":null},
            {"stock_symbol": "AGHOL",
            "date":"2024-06-04
            ,"close_price":null},
            {"stock_symbol": "AGHOL",
            "date":"2024-06-05
            ,"close_price":null}
    ]
        

        // we need to reverse them to make the recent one to the right
        labels.reverse();
        data.reverse();

        setChartData({
          labels,
          datasets: [
            {
              label: `${stock.name} Stock Price`,
              data,
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              pointRadius: 3,
              pointHoverRadius: 5,
            },
          ],
        });
        */

        // Fetch financial data for the stock
        const financialData = await stockService.getFinancialData(stock.stock_symbol);

        // Prepare income statement chart data
        const financialLabels = financialData.map(financial => financial.quarter);
        setRevenueChartData({
          labels: financialLabels,
          datasets: [
            {
              label: 'Revenue',
              data: financialData.map(financial => financial.revenue),
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
            },
          ],
        });
        setOperatingIncomeChartData({
          labels: financialLabels,
          datasets: [
            {
              label: 'Operating Income',
              data: financialData.map(financial => financial.operating_income),
              backgroundColor: 'rgba(153, 102, 255, 0.5)',
              borderColor: 'rgba(153, 102, 255, 1)',
              borderWidth: 1,
            },
          ],
        });
        setOperatingMarginChartData({
          labels: financialLabels,
          datasets: [
            {
              label: 'Operating Margin',
              data: financialData.map(financial => financial.operating_margin),
              backgroundColor: 'rgba(255, 159, 64, 0.5)',
              borderColor: 'rgba(255, 159, 64, 1)',
              borderWidth: 1,
            },
          ],
        });
        setGrossProfitChartData({
          labels: financialLabels,
          datasets: [
            {
              label: 'Gross Profit',
              data: financialData.map(financial => financial.gross_profit),
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            },
          ],
        });
        setNetProfitChartData({
          labels: financialLabels,
          datasets: [
            {
              label: 'Net Profit',
              data: financialData.map(financial => financial.net_profit),
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1,
            },
          ],
        });

        // Fetch balance sheet data for the stock
        const balanceSheetData = await stockService.getBalanceSheetData(stock.stock_symbol);

        // Prepare balance sheet chart data
        const balanceSheetLabels = balanceSheetData.map(balanceSheet => balanceSheet.quarter);
        setTotalAssetsChartData({
          labels: balanceSheetLabels,
          datasets: [
            {
              label: 'Total Assets',
              data: balanceSheetData.map(balanceSheet => balanceSheet.total_assets),
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
            },
          ],
        });
        setTotalLiabilitiesChartData({
          labels: balanceSheetLabels,
          datasets: [
            {
              label: 'Total Liabilities',
              data: balanceSheetData.map(balanceSheet => balanceSheet.total_liabilities),
              backgroundColor: 'rgba(153, 102, 255, 0.5)',
              borderColor: 'rgba(153, 102, 255, 1)',
              borderWidth: 1,
            },
          ],
        });
        setTotalEquityChartData({
          labels: balanceSheetLabels,
          datasets: [
            {
              label: 'Total Equity',
              data: balanceSheetData.map(balanceSheet => balanceSheet.total_equity),
              backgroundColor: 'rgba(255, 159, 64, 0.5)',
              borderColor: 'rgba(255, 159, 64, 1)',
              borderWidth: 1,
            },
          ],
        });
        setCurrentAssetsChartData({
          labels: balanceSheetLabels,
          datasets: [
            {
              label: 'Current Assets',
              data: balanceSheetData.map(balanceSheet => balanceSheet.current_assets),
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            },
          ],
        });
        setCurrentLiabilitiesChartData({
          labels: balanceSheetLabels,
          datasets: [
            {
              label: 'Current Liabilities',
              data: balanceSheetData.map(balanceSheet => balanceSheet.current_liabilities),
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1,
            },
          ],
        });

        // Fetch cash flow data for the stock
        const cashFlowData = await stockService.getCashFlowData(stock.stock_symbol);

        // Prepare cash flow chart data
        const cashFlowLabels = cashFlowData.map(cashFlow => cashFlow.quarter);
        setFreeCashFlowChartData({
          labels: cashFlowLabels,
          datasets: [
            {
              label: 'Free Cash Flow',
              data: cashFlowData.map(cashFlow => cashFlow.free_cash_flow),
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
            },
          ],
        });

      } catch (error) {
        console.error('Error fetching stock data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [symbol]); // symbol değiştikçe çalışacak operationlar : inside the fetchStockData function


  // Stock price chart date range options 
  const fetchChartData = async (range) => {
    try {
      // range is one of the : 1W, 1M, YTD, 1Y, 5Y
      const startDate = getStartDate(range); // get the start date for the selected range
      const endDate = new Date().toISOString().split('T')[0]; // get the end date as today

      // Fetch price data for the chart by giving the suitable range
      const priceResponse = await stockService.getStockPriceInDateRange({
        stock_symbol: symbol,
        start_date: startDate,
        end_date: endDate,
      });

      // we need to reverse the data to make the recent one to the right
      const labels = priceResponse.map((price) => price.date);
      const data = priceResponse.map((price) => price.close_price);

      // chart data state variable ının güncellenmesi
      setChartData({
        labels,
        datasets: [
          {
            label: `${stock?.name || symbol} Stock Price`,
            data,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            pointRadius: 3,
            pointHoverRadius: 5,
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  // above function will be called in an use effect which will be triggered when the date range changes or stock symbol changes
  // Handle date range changes (only refresh chart data, not full page data)
  useEffect(() => {
    if (!stock) return; // Only fetch chart data if stock is already loaded
    fetchChartData(dateRange);
  }, [dateRange, stock]);

  // the case where the stock is being fetched
  if (loading) {
    return (
      <Container>
        <Box sx={{ my: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // the case where the stock is not in the database or the stock is not found
  if (!stock) {
    return (
      <Container>
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Stock not found
          </Typography>
        </Box>
      </Container>
    );
  }


  // else, render the stock page
  return (
    <Container>

        {/* Stock Price Section */} 
        <Box ref={priceInfoRef} sx = {
          {
            my: 4
          }
        }>
          <StockPriceSection
            symbol={symbol}
            stockInfo={stockInfo}
            stock={stock}
            price={price}
            loading={loading}
          />
        </Box>

        {/* General Info Section */}
        <Box ref={generalInfoRef} sx={{ my: 4 }}>
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <StockOverviewCard stockInfo={stockInfo} />
            </Grid>
          </Grid>
        </Box>

        {/* Ratios Section */}
        <Box ref={ratiosRef} sx={{ my: 4 }}>
          <FinancialRatiosCard stockInfo={stockInfo} />
        </Box>

        {/* Price Details Section */}
        <Box ref={priceRef} sx={{ my: 4 }}>
          <StockPriceDetailsCard stockInfo={stockInfo} />
        </Box>


      {/* Financial Charts Section */}
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

      {/* News Section */}
      <Box sx={{ my: 4 }}>
        <NewsSection news={news} />
      </Box> 

    </Container>
  );
};

export default StockPage;
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Grid, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  CircularProgress, 
  Alert,
  TableSortLabel,
    useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import stockService from '../services/stockService';
// search iconu eklemek için search bar a
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';


const AllStocksPage = () => {
    // all stocks are fetched from the backend and stored in the state
    const [stocks, setStocks] = useState([]);
    // filteredStocks state is used to store the stocks that meet the filter criteria
    const [filteredStocks, setFilteredStocks] = useState([]);

    // loading state is used to show a loading spinner while fetching data
    const [loading, setLoading] = useState(true);
    // error state is used to show an error message if the data fetching fails
    const [error, setError] = useState(null);

    // searchQuery state is used to store the search query entered by the user
    const [searchQuery, setSearchQuery] = useState('');
    // Add a new state to track the original filtered stocks before search
    const [preSearchFilteredStocks, setPreSearchFilteredStocks] = useState([]);

    // pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalStocks, setTotalStocks] = useState(0);
    const [itemsPerPage] = useState(10);

    // openFiltersDialog state is used to control the visibility of the filters dialog
    const [openFiltersDialog, setOpenFiltersDialog] = useState(false);
    const [sortColumn, setSortColumn] = useState('current_price');
    const [sortDirection, setSortDirection] = useState('desc');
    const navigate = useNavigate();
    const theme = useTheme();
    
    // filters state is used to store the filter criteria entered by the user
    const [filters, setFilters] = useState({
        minPrice: 0,
        maxPrice: Infinity,
        minMarketCap: 0,
        maxMarketCap: Infinity,
        minDayChange: -Infinity,
        maxDayChange: Infinity,
        minVolume: 0,
        maxVolume: Infinity,
        minPriceToEarnings: 0,
        maxPriceToEarnings: Infinity,
        minPriceToSales: -Infinity,
        maxPriceToSales: Infinity,
        minPriceToBook: -Infinity,
        maxPriceToBook: Infinity,
        minPriceToEbitda: -Infinity,
        maxPriceToEbitda: Infinity,
        minNetProfitMargin: -Infinity,
        maxNetProfitMargin: Infinity,
        minOperatingMargin: -Infinity,
        maxOperatingMargin: Infinity,
        minGrossProfitMargin: -Infinity,
        maxGrossProfitMargin: Infinity,
        minReturnOnAssets: -Infinity,
        maxReturnOnAssets: Infinity,
        minReturnOnEquity: -Infinity,
        maxReturnOnEquity: Infinity,
        minDebtToEquity: -Infinity,
        maxDebtToEquity: Infinity,
        minCurrentRatio: -Infinity,
        maxCurrentRatio: Infinity,
        minQuickRatio: -Infinity,
        maxQuickRatio: Infinity,
        minInterestCoverage: -Infinity,
        maxInterestCoverage: Infinity
    });

    // this is a state variable since columns can change when user applies some filters.
    // Note: For Phase 1, we're showing basic columns available from the combined endpoint
    // Additional metrics will be added in Phase 2/3
    const [columns, setColumns] = useState([
      { key: 'stock_symbol', label: 'Symbol', numeric: false },
      { key: 'name', label: 'Name', numeric: false },
      { key: 'sector', label: 'Sector', numeric: false },
      { key: 'current_price', label: 'Price', numeric: true },
      { key: 'market_cap', label: 'Market Cap', numeric: true },
  ]);

  // when user plays with filters, we need to update the columns. This dictionary is used to map the columns to the keys in the stock object. 
  const dynamicColumnMapping = {
    minPriceToEarnings : { key: 'trailingPE', label: 'Price to Earnings', numeric: true },
    maxPriceToEarnings : { key: 'trailingPE', label: 'Price to Earnings', numeric: true },
    minPriceToSales : { key: 'priceToSalesTrailing12Months', label: 'Price to Sales', numeric: true },
    maxPriceToSales : { key: 'priceToSalesTrailing12Months', label: 'Price to Sales', numeric: true },
    minPriceToBook : { key: 'priceToBook', label: 'Price to Book', numeric: true },
    maxPriceToBook : { key: 'priceToBook', label: 'Price to Book', numeric: true },
    minPriceToEbitda : { key: 'enterpriseToEbitda', label: 'Price to EBITDA', numeric: true },
    maxPriceToEbitda : { key: 'enterpriseToEbitda', label: 'Price to EBITDA', numeric: true },
    minNetProfitMargin : { key: 'profitMargins', label: 'Net Profit Margin', numeric: true },
    maxNetProfitMargin : { key: 'profitMargins', label: 'Net Profit Margin', numeric: true },
    minOperatingMargin : { key: 'operatingMargins', label: 'Operating Margin', numeric: true },
    maxOperatingMargin : { key: 'operatingMargins', label: 'Operating Margin', numeric: true },
    minGrossProfitMargin : { key: 'grossMargins', label: 'Gross Profit Margin', numeric: true },
    maxGrossProfitMargin : { key: 'grossMargins', label: 'Gross Profit Margin', numeric: true },
    minReturnOnAssets : { key: 'returnOnAssets', label: 'Return on Assets', numeric: true },
    maxReturnOnAssets : { key: 'returnOnAssets', label: 'Return on Assets', numeric: true },
    minReturnOnEquity : { key: 'returnOnEquity', label: 'Return on Equity', numeric: true },
    maxReturnOnEquity : { key: 'returnOnEquity', label: 'Return on Equity', numeric: true },
    minDebtToEquity : { key: 'debtToEquity', label: 'Debt to Equity', numeric: true },
    maxDebtToEquity : { key: 'debtToEquity', label: 'Debt to Equity', numeric: true },
    minCurrentRatio : { key: 'currentRatio', label: 'Current Ratio', numeric: true },
    maxCurrentRatio : { key: 'currentRatio', label: 'Current Ratio', numeric: true },
    minQuickRatio : { key: 'quickRatio', label: 'Quick Ratio', numeric: true },
    maxQuickRatio : { key: 'quickRatio', label: 'Quick Ratio', numeric: true },
    minInterestCoverage : { key: 'interestCoverage', label: 'Interest Coverage', numeric: true },
    maxInterestCoverage : { key: 'interestCoverage', label: 'Interest Coverage', numeric: true }
};

  const formatValue = (value, key) => {
      if (value === null || value === undefined) return 'N/A';

      // Check if value is a number before calling toFixed
      const numValue = Number(value);

      if (isNaN(numValue)) return value.toString();

      if (key === 'market_cap') {
          return (numValue / 1e9).toFixed(1) + 'B';
      }
      if (['current_price', 'currentPrice'].includes(key)) {
          return numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      if (key.includes('%')) {
          return numValue.toFixed(2) + '%';
      }
      return numValue.toFixed(2);
    };

    // column bazlı gezerken cell deki value nın rengini belirten fonksiyon
    // value is the value of the cell, key is the column key
    const getColorForValue = (value, key) => {
        if(key == 'regularMarketChangePercent' || key == '1_week' || key == '1_month' || key == '3_months' || key == '1_year' || key == '3_years' || key == '5_years') {
            return value > 0 ? theme.palette.success.main : theme.palette.error.main;
        }
        return 'inherit';
    };

    useEffect(() => {
        const fetchStocksData = async () => {
            try {
                setLoading(true);
                // Fetch paginated stocks with prices from the combined endpoint
                const response = await stockService.getStocksWithPrices(currentPage, itemsPerPage);

                // Update pagination info from response
                setTotalStocks(response.total);
                setTotalPages(response.pages);

                // Stock info now comes directly from the endpoint with current prices included
                setStocks(response.data);
                setFilteredStocks(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching stocks:', error);
                setError('Failed to fetch stock data. Please try again later.');
                setLoading(false);
            }
        };

        // Fetch stock data when page changes
        fetchStocksData();
    }, [currentPage, itemsPerPage]);


    // days input unu alıcak ve prices alıcak = ve percentage change hesaplayacak
    const calculatePercentageChange = (prices, days) => {
        if (!prices || prices.length < 2) return 0;

        /*
            example prices in the stocksWithDetails array:
            prices[0] = today stock price response
            prices[1] = one week before stock price response
            ...
                [
            {
                "stock_symbol": "aghol",
                "date": "2025-01-24",
                "close_price": "315.0"
            },
            {
                "stock_symbol": "aghol",
                "date": "2025-01-17",
                "close_price": "309.0"
            },
            {
                "stock_symbol": "aghol",
                "date": "2024-12-26",
                "close_price": "363.0"
            },
            {
                "stock_symbol": "aghol",
                "date": "2024-10-28",
                "close_price": "287.5"
            },
            {
                "stock_symbol": "aghol",
                "date": "2024-07-29",
                "close_price": "427.25"
            },
            {
                "stock_symbol": "aghol",
                "date": "2024-01-26",
                "close_price": "227.0554656982422"
            },
            {
                "stock_symbol": "aghol",
                "date": "2022-01-26",
                "close_price": "33.286109924316406"
            },
            {
                "stock_symbol": "aghol",
                "date": "2020-01-27",
                "close_price": "19.25945472717285"
            }
            ]
            */
        if (days == 7) return ((prices[0].close_price - prices[1].close_price) / prices[1].close_price) * 100;
        if (days == 30) return ((prices[0].close_price - prices[2].close_price) / prices[2].close_price) * 100;
        if (days == 90) return ((prices[0].close_price - prices[3].close_price) / prices[3].close_price) * 100;
        if (days == 365) return ((prices[0].close_price - prices[4].close_price) / prices[5].close_price) * 100;
        if (days == 3*365) return ((prices[0].close_price - prices[6].close_price) / prices[6].close_price) * 100;
        if (days == 5*365) return ((prices[0].close_price - prices[7].close_price) / prices[7].close_price) * 100;
        else return 0;
    };   

    // Apply the filters to the stocks array and update the columns based on the filters
    const applyFilters = () => {
      const filtered = stocks.filter(stock => {
        const meetsBasicFilters =
          (filters.minPrice === 0 || stock.current_price >= filters.minPrice) &&
          (filters.maxPrice === Infinity || stock.current_price <= filters.maxPrice) &&
          (filters.minMarketCap === 0 || stock.market_cap >= filters.minMarketCap) &&
          (filters.maxMarketCap === Infinity || stock.market_cap <= filters.maxMarketCap);
    
        const meetsProfitabilityFilters =
          (filters.minPriceToEarnings === 0 || stock.trailingPE >= filters.minPriceToEarnings) &&
          (filters.maxPriceToEarnings === Infinity || stock.trailingPE <= filters.maxPriceToEarnings) &&
          (filters.minPriceToSales === -Infinity || stock.priceToSalesTrailing12Months >= filters.minPriceToSales) &&
          (filters.maxPriceToSales === Infinity || stock.priceToSalesTrailing12Months <= filters.maxPriceToSales) &&
          (filters.minPriceToBook === -Infinity || stock.priceToBook >= filters.minPriceToBook) &&
          (filters.maxPriceToBook === Infinity || stock.priceToBook <= filters.maxPriceToBook) && 
          (filters.minPriceToEbitda === -Infinity || stock.enterpriseToEbitda >= filters.minPriceToEbitda) &&
          (filters.maxPriceToEbitda === Infinity || stock.enterpriseToEbitda <= filters.maxPriceToEbitda);
    
        const meetsMarginsFilters =
          (filters.minNetProfitMargin === -Infinity || stock.profitMargins >= filters.minNetProfitMargin) &&
          (filters.maxNetProfitMargin === Infinity || stock.profitMargins <= filters.maxNetProfitMargin) &&
          (filters.minOperatingMargin === -Infinity || stock.operatingMargins >= filters.minOperatingMargin) &&
          (filters.maxOperatingMargin === Infinity || stock.operatingMargins <= filters.maxOperatingMargin) &&
          (filters.minGrossProfitMargin === -Infinity || stock.grossMargins >= filters.minGrossProfitMargin) &&
          (filters.maxGrossProfitMargin === Infinity || stock.grossMargins <= filters.maxGrossProfitMargin);
              
        const meetsPerformanceFilters =
          (filters.minReturnOnAssets === -Infinity || stock.returnOnAssets >= filters.minReturnOnAssets) &&
          (filters.maxReturnOnAssets === Infinity || stock.returnOnAssets <= filters.maxReturnOnAssets) &&
          (filters.minReturnOnEquity === -Infinity || stock.returnOnEquity >= filters.minReturnOnEquity) &&
          (filters.maxReturnOnEquity === Infinity || stock.returnOnEquity <= filters.maxReturnOnEquity);
    
        const meetsBalanceSheetFilters =
          (filters.minDebtToEquity === -Infinity || stock.debtToEquity >= filters.minDebtToEquity) &&
          (filters.maxDebtToEquity === Infinity || stock.debtToEquity <= filters.maxDebtToEquity) &&
          (filters.minCurrentRatio === -Infinity || stock.currentRatio >= filters.minCurrentRatio) &&
          (filters.maxCurrentRatio === Infinity || stock.currentRatio <= filters.maxCurrentRatio) &&
          (filters.minQuickRatio === -Infinity || stock.quickRatio >= filters.minQuickRatio) &&
          (filters.maxQuickRatio === Infinity || stock.quickRatio <= filters.maxQuickRatio);
        
        return (
          meetsBasicFilters &&
          meetsProfitabilityFilters &&
          meetsMarginsFilters &&
          meetsPerformanceFilters &&
          meetsBalanceSheetFilters
        );
      });
    
      setFilteredStocks(filtered);

      // For Phase 1, we only support basic filters (price, market cap)
      // Advanced filters will be added in Phase 2/3 when we fetch more detailed data
      setOpenFiltersDialog(false);
  };

  // Function to have a search bar to search for stocks
  // This will filter the filteredStocks state based on the search query
  const handleSearch = (query) => {
    // If no search query exists: yani search bar a hiç tıklanmamışsa
    // set the filteredStocks state to the preSearchFilteredStocks state
    if (!query) {
        setFilteredStocks(preSearchFilteredStocks);
        setSearchQuery(query);
        return;
    } // search query silindiyse preSearchFilteredStocks state i filteredStocks state e atıyoruz

    // When first starting a search (tıklandıysa), save the current filtered stocks to the preSearchFilteredStocks state
    if (searchQuery === '') {
        setPreSearchFilteredStocks(filteredStocks);
    }

    // Filter the current filteredStocks based on the query
    const filtered = filteredStocks.filter(stock =>
        stock.stock_symbol.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredStocks(filtered); // update the filteredStocks state
    setSearchQuery(query);
};

  
    // filters dialog ı içeren jsx i döndüren fonksiyon
  const renderFiltersDialog = () => (
    <Dialog
      open={openFiltersDialog}
      onClose={() => setOpenFiltersDialog(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{
        style: {
            background: `linear-gradient(to right, ${theme.palette.primary.dark}, ${theme.palette.primary.light})`,
            borderRadius: '16px',
            boxShadow: '0 12px 24px rgba(0,0,0,0.2)'
          }
      }}
    >
      <DialogTitle style={{ 
          color: 'white', 
          fontWeight: 'bold', 
          textAlign: 'center',
          padding: '24px',
          background: 'rgba(0,0,0,0.1)'
        }}>Advanced Stock Filters</DialogTitle>
      <DialogContent 
        style={{ 
          padding: '24px', 
          background: 'rgba(255,255,255,0.1)' 
        }}
      >
        <Grid container spacing={2}>

          {/* Basic Filters */}
          {/* value:  Eğer değer girilmediyse filters.minPrice ı 0 yap. Otherwise, filters.minPrice a eşitle*/}
          <Grid item xs={12}><Typography variant="h5" color='white'>Basic Filters</Typography></Grid>
          <Grid item xs={6}>
            <TextField
              label="Min Price"
              type="number"
              fullWidth
              variant="outlined"
              value={filters.minPrice === 0 ? '' : filters.minPrice}
              onChange={(e) => setFilters({...filters, minPrice: Number(e.target.value) || 0})}
              InputProps={{
                style: {
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.5)'
                  }
                }
              }}
              InputLabelProps={{
                style: { color: 'rgba(255,255,255,0.7)' }
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Max Price"
              type="number"
              fullWidth
              variant="outlined"
              value={filters.maxPrice === Infinity ? '' : filters.maxPrice}
              onChange={(e) => setFilters({...filters, maxPrice: Number(e.target.value) || Infinity})}
              InputProps={{
                style: {
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.5)'
                  }
                }
              }}
              InputLabelProps={{
                style: { color: 'rgba(255,255,255,0.7)' }
              }}
            />
          </Grid>
            <Grid item xs={6}>
            <TextField
                label="Min Market Cap"
                type="number"
                fullWidth
                variant='outlined'
                value={filters.minMarketCap === 0 ? '' : filters.minMarketCap}
                onChange={(e) => setFilters({...filters, minMarketCap: Number(e.target.value) || 0})}
                InputProps={{
                    style: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)' }
                  }}
            />
            {/* Once a filter changes, change the filter variable's corresponding key */}
            {/* eğer değer girilmezse filters.maxMarketCap ı default value ye eşitle. */}
            </Grid>
            <Grid item xs={6}>
            <TextField
                label="Max Market Cap"
                type="number"
                fullWidth
                variant='outlined'
                value={filters.maxMarketCap === Infinity ? '' : filters.maxMarketCap}
                onChange={(e) => setFilters({...filters, maxMarketCap: Number(e.target.value) || Infinity})}
                InputProps={{
                    style: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)' }
                  }}
            />
            </Grid>
            {/* Once a filter changes, change the filter variable's corresponding key */}
            <Grid item xs={6}>
            <TextField
                label="Min Volume"
                type="number"
                fullWidth
                variant='outlined'
                value={filters.minVolume === 0 ? '' : filters.minVolume}
                onChange={(e) => setFilters({...filters, minVolume: Number(e.target.value) || 0})}
                InputProps={{
                    style: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)' }
                  }}
            />
            </Grid> 
            <Grid item xs={6}>
            <TextField
                label="Max Volume"
                type="number"
                fullWidth
                variant='outlined'
                value={filters.maxVolume === Infinity ? '' : filters.maxVolume}
                onChange={(e) => setFilters({...filters, maxVolume: Number(e.target.value) || Infinity})}
                InputProps={{
                    style: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)' }
                  }}
            />
            </Grid>

            {/* Profitability Filters */}
            <Grid item xs={12}><Typography variant="h5" color='white'>Profitability Filters</Typography></Grid>
            <Grid item xs={6}>
            <TextField
                label="Min Price to Earnings"
                type="number"
                fullWidth
                variant='outlined'
                value={filters.minPriceToEarnings === 0 ? '' : filters.minPriceToEarnings}
                onChange={(e) => setFilters({...filters, minPriceToEarnings: Number(e.target.value) || 0})}
                InputProps={{
                    style: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)' }
                  }}
            />
            </Grid> 
            <Grid item xs={6}>
            <TextField
                label="Max Price to Earnings"
                type="number"
                fullWidth
                variant='outlined'
                value={filters.maxPriceToEarnings === Infinity ? '' : filters.maxPriceToEarnings}
                onChange={(e) => setFilters({...filters, maxPriceToEarnings: Number(e.target.value) || Infinity})}
                InputProps={{
                    style: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)' }
                  }}
            />
            </Grid> 
            <Grid item xs={6}>
            <TextField
                label="Min Price to Sales"
                type="number"
                fullWidth
                variant='outlined'
                value={filters.minPriceToSales === -Infinity ? '' : filters.minPriceToSales}
                onChange={(e) => setFilters({...filters, minPriceToSales: Number(e.target.value) || -Infinity})}
                InputProps={{
                    style: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)' }
                  }}
            />
            </Grid>
            <Grid item xs={6}>
            <TextField
                label="Max Price to Sales"
                type="number"
                fullWidth
                variant='outlined'
                value={filters.maxPriceToSales === Infinity ? '' : filters.maxPriceToSales}
                onChange={(e) => setFilters({...filters, maxPriceToSales: Number(e.target.value) || Infinity})}
                InputProps={{
                    style: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)' }
                  }}
            />
            </Grid>
            <Grid item xs={6}>
            <TextField
                label="Min Price to Book"
                type="number"
                fullWidth
                variant='outlined'
                value={filters.minPriceToBook === -Infinity ? '' : filters.minPriceToBook}
                onChange={(e) => setFilters({...filters, minPriceToBook: Number(e.target.value) || -Infinity})}
                InputProps={{
                    style: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)' }
                  }}
            />
            </Grid>
            <Grid item xs={6}>
            <TextField
                label="Max Price to Book"
                type="number"
                fullWidth
                variant='outlined'
                value={filters.maxPriceToBook === Infinity ? '' : filters.maxPriceToBook}
                onChange={(e) => setFilters({...filters, maxPriceToBook: Number(e.target.value) || Infinity})}
                InputProps={{
                    style: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)' }
                  }}
            />
            </Grid>
            <Grid item xs={6}>
            <TextField
                label="Min Price to EBITDA"
                type="number"
                fullWidth
                variant='outlined'
                value={filters.minPriceToEbitda === -Infinity ? '' : filters.minPriceToEbitda}
                onChange={(e) => setFilters({...filters, minPriceToEbitda: Number(e.target.value) || -Infinity})}
                InputProps={{
                    style: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)' }
                  }}
            />
            </Grid>
            <Grid item xs={6}>
            <TextField
                label="Max Price to EBITDA"
                type="number"
                fullWidth
                variant='outlined'
                value={filters.maxPriceToEbitda === Infinity ? '' : filters.maxPriceToEbitda}
                onChange={(e) => setFilters({...filters, maxPriceToEbitda: Number(e.target.value) || Infinity})}
                InputProps={{
                    style: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)' }
                  }}
            />
            </Grid>

            {/* Margins Filters */}
            <Grid item xs={12}><Typography variant="h5" color='white'>Margins Filters</Typography></Grid>
            <Grid item xs={6}>
            <TextField
                label="Min Net Profit Margin"
                type="number"
                fullWidth
                variant='outlined'
                value={filters.minNetProfitMargin === -Infinity ? '' : filters.minNetProfitMargin}
                onChange={(e) => setFilters({...filters, minNetProfitMargin: Number(e.target.value) || -Infinity})}
                InputProps={{
                    style: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)' }
                  }}
            />
            </Grid>
            <Grid item xs={6}>
            <TextField
                label="Max Net Profit Margin"
                type="number"
                fullWidth
                variant='outlined'
                value={filters.maxNetProfitMargin === Infinity ? '' : filters.maxNetProfitMargin}
                onChange={(e) => setFilters({...filters, maxNetProfitMargin: Number(e.target.value) || Infinity})}
                InputProps={{
                    style: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)' }
                  }}
            />
            </Grid>
            <Grid item xs={6}>
            <TextField
                label="Min Operating Margin"
                type="number"
                fullWidth
                variant='outlined'
                value={filters.minOperatingMargin === -Infinity ? '' : filters.minOperatingMargin}
                onChange={(e) => setFilters({...filters, minOperatingMargin: Number(e.target.value) || -Infinity})}
                InputProps={{
                    style: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)' }
                  }}
            />
            </Grid>
            <Grid item xs={6}>
            <TextField
                label="Max Operating Margin"
                type="number"
                fullWidth
                variant='outlined'
                value={filters.maxOperatingMargin === Infinity ? '' : filters.maxOperatingMargin}
                onChange={(e) => setFilters({...filters, maxOperatingMargin: Number(e.target.value) || Infinity})}
                InputProps={{
                    style: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)' }
                  }}
            />
            </Grid>
            <Grid item xs={6}>
            <TextField
                label="Min Gross Profit Margin"
                type="number"
                fullWidth
                variant='outlined'
                value={filters.minGrossProfitMargin === -Infinity ? '' : filters.minGrossProfitMargin}
                onChange={(e) => setFilters({...filters, minGrossProfitMargin: Number(e.target.value) || -Infinity})}
                InputProps={{
                    style: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)' }
                  }}
            />
            </Grid>
            <Grid item xs={6}>
            <TextField
                label="Max Gross Profit Margin"
                type="number"
                fullWidth
                variant='outlined'
                value={filters.maxGrossProfitMargin === Infinity ? '' : filters.maxGrossProfitMargin}
                onChange={(e) => setFilters({...filters, maxGrossProfitMargin: Number(e.target.value) || Infinity})}
                InputProps={{
                    style: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)' }
                  }}
            />
            </Grid>
            
            {/* Performance Filters */}
            <Grid item xs={12}><Typography variant="h5" color='white'>Performance Filters</Typography></Grid>
            <Grid item xs={6}>
            <TextField
                label="Min Return on Assets"
                type="number"
                fullWidth
                variant='outlined'
                value={filters.minReturnOnAssets === -Infinity ? '' : filters.minReturnOnAssets}
                onChange={(e) => setFilters({...filters, minReturnOnAssets: Number(e.target.value) || -Infinity})}
                InputProps={{
                    style: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)' }
                  }}
            />
            </Grid>
            <Grid item xs={6}>
            <TextField
                label="Max Return on Assets"
                type="number"
                fullWidth
                variant='outlined'
                value={filters.maxReturnOnAssets === Infinity ? '' : filters.maxReturnOnAssets}
                onChange={(e) => setFilters({...filters, maxReturnOnAssets: Number(e.target.value) || Infinity})}
                InputProps={{
                    style: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)' }
                  }}
            />
            </Grid>
            <Grid item xs={6}>
            <TextField
                label="Min Return on Equity"
                type="number"
                fullWidth
                variant='outlined'
                value={filters.minReturnOnEquity === -Infinity ? '' : filters.minReturnOnEquity}
                onChange={(e) => setFilters({...filters, minReturnOnEquity: Number(e.target.value) || -Infinity})}
                InputProps={{
                    style: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)' }
                  }}
            />
            </Grid>
            <Grid item xs={6}>
            <TextField
                label="Max Return on Equity"
                type="number"
                fullWidth
                variant='outlined'
                value={filters.maxReturnOnEquity === Infinity ? '' : filters.maxReturnOnEquity}
                onChange={(e) => setFilters({...filters, maxReturnOnEquity: Number(e.target.value) || Infinity})}
                InputProps={{
                    style: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)' }
                  }}
            />
            </Grid>

            {/* Balance Sheet Filters */}
            <Grid item xs={12}><Typography variant="h5" color='white'>Balance Sheet Filters</Typography></Grid>
            <Grid item xs={6}>
            <TextField
                label="Min Debt to Equity"
                type="number"
                fullWidth
                variant='outlined'
                value={filters.minDebtToEquity === -Infinity ? '' : filters.minDebtToEquity}
                onChange={(e) => setFilters({...filters, minDebtToEquity: Number(e.target.value) || -Infinity})}
                InputProps={{
                    style: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)' }
                  }}
            />
            </Grid>
            <Grid item xs={6}>
            <TextField
                label="Max Debt to Equity"
                type="number"
                fullWidth
                variant='outlined'
                value={filters.maxDebtToEquity === Infinity ? '' : filters.maxDebtToEquity}
                onChange={(e) => setFilters({...filters, maxDebtToEquity: Number(e.target.value) || Infinity})}
                InputProps={{
                    style: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)' }
                  }}
            />
            </Grid>
            <Grid item xs={6}>
            <TextField
                label="Min Current Ratio"
                type="number"
                fullWidth
                variant='outlined'
                value={filters.minCurrentRatio === -Infinity ? '' : filters.minCurrentRatio}
                onChange={(e) => setFilters({...filters, minCurrentRatio: Number(e.target.value) || -Infinity})}
                InputProps={{
                    style: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)' }
                  }}
            />
            </Grid>
            <Grid item xs={6}>
            <TextField
                label="Max Current Ratio"
                type="number"
                fullWidth
                variant='outlined'  
                value={filters.maxCurrentRatio === Infinity ? '' : filters.maxCurrentRatio}
                onChange={(e) => setFilters({...filters, maxCurrentRatio: Number(e.target.value) || Infinity})}
                InputProps={{
                    style: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)' }
                  }}
            />
            </Grid>
            <Grid item xs={6}>
            <TextField
                label="Min Quick Ratio"
                type="number"
                fullWidth
                variant='outlined'
                value={filters.minQuickRatio === -Infinity ? '' : filters.minQuickRatio}
                onChange={(e) => setFilters({...filters, minQuickRatio: Number(e.target.value) || -Infinity})}
                InputProps={{
                    style: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)' }
                  }}
            />
            </Grid>
            <Grid item xs={6}>
            <TextField
                label="Max Quick Ratio"
                type="number"
                fullWidth
                variant='outlined'
                value={filters.maxQuickRatio === Infinity ? '' : filters.maxQuickRatio}
                onChange={(e) => setFilters({...filters, maxQuickRatio: Number(e.target.value) || Infinity})}
                InputProps={{
                    style: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)' }
                  }}
            />
            </Grid>
        </Grid>

      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setFilters({
              minPrice: 0,
              maxPrice: Infinity,
              minMarketCap: 0,
              maxMarketCap: Infinity,
              minDayChange: -Infinity,
              maxDayChange: Infinity,
              minVolume: 0,
              maxVolume: Infinity,
              minPriceToEarnings: 0,
                maxPriceToEarnings: Infinity,
                minPriceToSales: -Infinity,
                maxPriceToSales: Infinity,
                minPriceToBook: -Infinity,
                maxPriceToBook: Infinity,
                minPriceToEbitda: -Infinity,
                maxPriceToEbitda: Infinity,
                minNetProfitMargin: -Infinity,
                maxNetProfitMargin: Infinity,
                minOperatingMargin: -Infinity,
                maxOperatingMargin: Infinity,
                minGrossProfitMargin: -Infinity,
                maxGrossProfitMargin: Infinity,
                minReturnOnAssets: -Infinity,
                maxReturnOnAssets: Infinity,
                minReturnOnEquity: -Infinity,
                maxReturnOnEquity: Infinity,
                minDebtToEquity: -Infinity,
                maxDebtToEquity: Infinity,
                minCurrentRatio: -Infinity,
                maxCurrentRatio: Infinity,
                minQuickRatio: -Infinity,
                maxQuickRatio: Infinity,
                minInterestCoverage: -Infinity,
                maxInterestCoverage: Infinity
            });
            }
            }
            style={{ 
                color: 'white', 
                backgroundColor: 'rgba(255,255,255,0.2)',
                '&:hover': { 
                  backgroundColor: 'rgba(255,255,255,0.3)' 
                }
              }}
        >
            Clear Filters
        </Button>
        <Button 
        onClick={() => setOpenFiltersDialog(false)}
        style={{ 
            color: 'white', 
            backgroundColor: 'rgba(255,255,255,0.2)',
            '&:hover': { 
              backgroundColor: 'rgba(255,255,255,0.3)' 
            }
          }}
          >Cancel</Button>
        <Button 
        onClick={applyFilters} 
        style={{ 
            color: 'white', 
            backgroundColor: theme.palette.primary.dark,
            '&:hover': { 
              backgroundColor: theme.palette.primary.light
            }
          }}
          >Apply Filters</Button>
        </DialogActions>
    </Dialog>
  );

    // when a row in the table is clicked, navigate to the stock detail page
    const handleRowClick = (stockSymbol) => {
        navigate(`/stocks/${stockSymbol}`);
    };

    // when a column header is clicked, sort the table by that column by : sortColumn and sortDirection states
    // this function changes these states based on the column clicked
    const handleSort = (column) => {
        const isAsc = sortColumn === column && sortDirection === 'asc';
        setSortColumn(column);
        setSortDirection(isAsc ? 'desc' : 'asc');
    };

    // sort the stocks based on the sortColumn and sortDirection states every time they change
    const sortedStocks = useMemo(() => {
        if (!sortColumn) return filteredStocks;
        return [...filteredStocks].sort((a, b) => {
            if (a[sortColumn] < b[sortColumn]) return sortDirection === 'asc' ? -1 : 1;
            if (a[sortColumn] > b[sortColumn]) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredStocks, sortColumn, sortDirection]);

    // resulting jsx if the data is still loading
    if (loading) {
        return (
            <Box 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                height="60vh"
            >
                <CircularProgress size={60} thickness={4} />
            </Box>
        );
    }

    // resulting jsx if an error occurs
    if (error) {
        return (
            <Alert severity="error" sx={{ m: 4 }}>
                {error}
            </Alert>
        );
    }   


    // resulting jsx if the data is loaded
  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <Typography 
                variant="h4" 
                sx={{ 
                    p: 3, 
                    pb: 0, 
                    fontWeight: 'bold',
                    background: `linear-gradient(to right, ${theme.palette.primary.dark}, ${theme.palette.primary.light})`,
                    backgroundClip: 'text',
                    color: 'transparent',
                    marginBottom: '3px'
                }}
            >
                Stock Screener
            </Typography>

            {/* A text explaining what this page offers to the users */}
            <Typography
                variant="body1"
                sx={{ 
                    p: 3, 
                    pt: 0, 
                    fontWeight: 'bold',
                    color: 'text.secondary'
                }}
            >
                This page offers a comprehensive stock screener that allows you to filter stocks based on a variety of criteria and by search query. Click on a stock to view more details.
            </Typography>

            {/* Search bar and filters button in a box (material ui box) */}
            <Box display="flex" alignItems="center" p={0.5}>
                <TextField
                    label="Search Stocks"
                    variant="outlined"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    sx={{ flexGrow: 1, mr: 2 }}
                    InputProps={{
                      style: {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,255,255,0.5)'
                        }
                      },
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      )
                    }}
                />
                <Button 
                    variant="contained" 
                    onClick={() => setOpenFiltersDialog(true)}
                    sx={{ 
                      background: `linear-gradient(to right, ${theme.palette.primary.dark}, ${theme.palette.primary.light})`,
                        '&:hover': {
                            background: theme.palette.primary.light 
                        }
                    }}
                >
                    All Filters
                </Button>
            </Box>
            
            {/* Table Container for the table of stocks */}
            <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow
                          sx = {{
                            '& td': {
                              padding: '8px 12px', // up-down, left-right paddings for each cell
                              fontSize: '1rem', // font size for each cell
                              minHeight: '36px',   // row height
                            },
                          }}
                        >
                            {columns.map(({ key, label, numeric }) => (
                                <TableCell
                                    key={key}
                                    align={numeric ? 'right' : 'left'}
                                    sx={{ 
                                        fontWeight: 'bold', 
                                        backgroundColor: 'background.paper',
                                        color: 'text.secondary',
                                    }}
                                >
                                    <TableSortLabel
                                        active={sortColumn === key}
                                        direction={sortColumn === key ? sortDirection : 'asc'}
                                        onClick={() => handleSort(key)}
                                    >
                                        {label}
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    {/* Table Body - for each stock (row), we fill its cell => row bazlı gidiyoruz */}
                    <TableBody>
                        {sortedStocks.map((stock) => (
                            <TableRow
                                key={stock.stock_symbol}
                                hover
                                onClick={() => handleRowClick(stock.stock_symbol)}
                                sx={{ 
                                    '& td': {
                                      padding: '8px 12px', // up-down, left-right paddings for each cell
                                      fontSize: '1rem', // font size for each cell
                                      minHeight: '36px',  // row height
                                    },
                                    cursor: 'pointer',
                                    '&:hover': { 
                                        backgroundColor: 'action.hover',
                                        transform: 'scale(1.005)',
                                        transition: 'transform 0.2s'
                                    }
                                }}
                            >
                                {columns.map(({ key, numeric }) => (
                                    <TableCell
                                        key={key}
                                        align={numeric ? 'right' : 'left'}
                                        sx={{ 
                                            fontWeight: key === 'stock_symbol' ? 'bold' : 'normal',
                                            color: getColorForValue(stock[key], key),
                                        }}
                                    >
                                        {formatValue(stock[key], key)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination Controls */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              mt: 2
            }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Showing page {currentPage} of {totalPages} ({totalStocks} total stocks)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <Typography sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 2,
                  color: 'text.secondary'
                }}>
                  {currentPage} / {totalPages}
                </Typography>
                <Button
                  variant="outlined"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </Box>
            </Box>

      {renderFiltersDialog()}
    </Box>
  );
};

export default AllStocksPage;
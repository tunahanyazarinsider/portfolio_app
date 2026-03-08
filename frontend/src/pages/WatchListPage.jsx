import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Paper,
  CircularProgress,
  TextField,
  Button,
  Autocomplete,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { AlertCircle, Trash2, Bell, BellOff } from 'lucide-react';
import watchListService from '../services/watchListService';
import stockService from '../services/stockService';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

const WatchlistPage = () => {
  const { watchlistId: watchlistId } = useParams();
  const navigate = useNavigate();

  const theme = useTheme();
  
  // State for watchlist data
  const [watchlist, setWatchlist] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for stock search and add
  const [searchQuery, setSearchQuery] = useState('');
  const [stockOptions, setStockOptions] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  
  // State for alerts
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [selectedStockForAlert, setSelectedStockForAlert] = useState(null);
  const [alertPrice, setAlertPrice] = useState('');
  
  // Format currency consistently with your portfolio page
  const formatCurrency = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return 'N/A';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Fetch watchlist data
  const fetchWatchlistData = async () => {
    try {
      const watchlistData = await watchListService.getWatchlistById(watchlistId);
      setWatchlist(watchlistData);

      const stocksData = await watchListService.getWatchlistItems(watchlistId);
      
      // Enhance stocks data with current prices
      const enhancedStocks = await Promise.all(
        stocksData.map(async (stock) => {
          console.log(stock);
          const priceInfo = await stockService.getStockPrice(stock.stock_symbol);
          const sectorInfo = await stockService.getSectorOfStock(stock.stock_symbol);
          return {
            ...stock,
            currentPrice: Number(priceInfo.close_price),
            alert_price: stock.alert_price ? Number(stock.alert_price) : null, // Convert to number
            sector: sectorInfo.name
          };
        })
      );
      /* 
      not: Mysql decimal objeyi string olarak tutuyor. Bu nedenle her ne kadar decimal olarak yani bir number
      olarak backend e atıp db ye eklesek de o bize dönüşte string olarak gelicek. Bu nedenele alert_price
      değerini string olarak alıp number a çeviriyoruz.
      */
      
      setStocks(enhancedStocks);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching watchlist data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlistData();
  }, [watchlistId]);

  // Search for stocks as user types
  useEffect(() => {
    const searchStocks = async () => {
      if (searchQuery.length < 2) return;
      try {
        const response = await stockService.searchStocks(searchQuery);
        setStockOptions(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error('Error searching stocks:', error);
        setStockOptions([]);
      }
    };

    const debounceTimer = setTimeout(searchStocks, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Handle adding stock to watchlist
  const handleAddStock = async () => {
    if (!selectedStock) return;
    try {
      await watchListService.addToWatchlist(watchlistId, selectedStock.stock_symbol);
      await fetchWatchlistData();
      setSelectedStock(null);
      setSearchQuery('');
    } catch (error) {
      console.error('Error adding stock to watchlist:', error);
    }
  };

  // Handle removing stock from watchlist
  const handleRemoveStock = async (symbol) => {
    try {
        // just pass the watchlist item id. 
        // stocks = watchlist items + stock price info + stock sector info içeren array
        const watchlistItemId = stocks.find(stock => stock.stock_symbol === symbol).item_id;
        await watchListService.removeWatchlistItem(watchlistItemId);
        await fetchWatchlistData();
    } catch (error) {
        console.error('Error removing stock from watchlist:', error);
    }
  };

  // Handle setting price alert
  const handleSetAlert = async () => {
    if (!selectedStockForAlert || !alertPrice) return;
    try {
      // check alert price is valid
      if (Number(alertPrice) <= 0) {
        console.error('Alert price must be a positive number');
        return;
      }
      
      // item_id keyword will give us the watchlist_item_id of the selected stock
      const watchListItemId = stocks.find(stock => stock.stock_symbol === selectedStockForAlert.stock_symbol).item_id;
      // stock symbol is not needed
      await watchListService.setAlertPrice(
        watchListItemId,
        Number(alertPrice)
      );

      // after setting the alert, fetch the watchlist data again so that the alert price is updated
      await fetchWatchlistData();
      // close the dialog and reset the state
      setAlertDialogOpen(false);
      // reset the state
      setSelectedStockForAlert(null);
      setAlertPrice(''); 
    } catch (error) {
      console.error('Error setting alert:', error);
    }
  };

  // Handle removing price alert
  const handleRemoveAlert = async (symbol) => {
    try {
      const watchlist_item_id = stocks.find(stock => stock.stock_symbol === symbol).item_id;
      await watchListService.removeAlertPrice(watchlist_item_id);
      await fetchWatchlistData(); // then fetch the watchlist data again so that the alert price is updated
    } catch (error) {
      console.error('Error removing alert:', error);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, pb: { xs: 10, md: 4 } }}>
      {/* Watchlist Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{
          fontWeight: 800,
          mb: 2,
          letterSpacing: '-0.02em',
        }}>
          {watchlist?.name || 'Watchlist'}
        </Typography>
      </Box>

      {/* Add Stock Section */}
      <Paper elevation={0} sx={{
        p: 4,
        mb: 4,
        borderRadius: '16px',
        border: '1px solid',
        borderColor: 'divider',
      }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Autocomplete
              value={selectedStock}
              onChange={(_, newValue) => setSelectedStock(newValue)}
              options={stockOptions}
              getOptionLabel={(option) => `${option.stock_symbol} - ${option.name || ''}`}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Stock Symbol"
                  variant="outlined"
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
                fullWidth
                variant="contained"
                onClick={handleAddStock}
                disabled={!selectedStock}
                sx={{
                py: 2,
                }}
            >
                Add to Watchlist
            </Button>
            </Grid>
        </Grid>
      </Paper>

      {/* Stocks Table */}
      <TableContainer component={Paper} elevation={0} sx={{
        borderRadius: '16px',
        border: '1px solid',
        borderColor: 'divider',
      }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Symbol</TableCell>
              <TableCell>Sector</TableCell>
              <TableCell align="right">Current Price</TableCell>
              <TableCell align="right">Alert Price</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* one TableRow for each stock = watchlist item info + price info + sector info */}
            {stocks.map((stock) => (
              <TableRow
                key={stock.stock_symbol}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={(event) => {
                  // Prevent navigation when clicking action buttons
                  if (event.target.closest('button')) return;
                  navigate(`/stocks/${stock.stock_symbol}`);
                }}
              >
                <TableCell>{stock.stock_symbol}</TableCell>
                <TableCell>{stock.sector}</TableCell>
                <TableCell align="right">{formatCurrency(stock.currentPrice)}</TableCell>
                <TableCell align="right">
                  {stock.alert_price ? formatCurrency(stock.alert_price) : '-'}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      if (stock.alert_price) {
                        handleRemoveAlert(stock.stock_symbol);
                      } else {
                        setSelectedStockForAlert(stock);
                        setAlertDialogOpen(true);
                      }
                    }}
                    color={stock.alert_price ? "primary" : "default"}
                  >
                    {stock.alert_price ? <BellOff size={20} /> : <Bell size={20} />}
                  </IconButton>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveStock(stock.stock_symbol);
                    }}
                    color="error"
                  >
                    <Trash2 size={20} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Set Alert Dialog */}
      <Dialog open={alertDialogOpen} onClose={() => setAlertDialogOpen(false)}>
        <DialogTitle>Set Price Alert</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography sx={{ mb: 2 }}>
              Current Price: {selectedStockForAlert && formatCurrency(selectedStockForAlert.currentPrice)}
            </Typography>
            <TextField
              fullWidth
              label="Alert Price"
              type="number"
              value={alertPrice}
              onChange={(e) => setAlertPrice(e.target.value)}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>₺</Typography>,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSetAlert}
            variant="contained"
            disabled={!alertPrice}
            sx={{ background: 'linear-gradient(45deg, #2563eb, #7c3aed)' }}
          >
            Set Alert
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default WatchlistPage;
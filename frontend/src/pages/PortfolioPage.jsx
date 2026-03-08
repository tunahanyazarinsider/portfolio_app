import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  TextField,
  Button,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import portfolioService from '../services/portfolioService';
import stockService from '../services/stockService';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
// for news section
import NewsSection from '../components/NewsSection';
import newsService from '../services/newsService';
// theme
import { useTheme } from '@mui/material/styles';

const PortfolioPage = ({ match }) => {
    // display portfolio details 
    const { id: portfolioId } = useParams();
    const [portfolio, setPortfolio] = useState(null);
    const [holdings, setHoldings] = useState([]);
    const [sectors, setSectors] = useState([]);
    const [sectorMap, setSectorMap] = useState({});
    const [totalValue, setTotalValue] = useState(0);
    const [totalProfit, setTotalProfit] = useState(0);
    const [loading, setLoading] = useState(true);

    // theme
    const theme = useTheme();

    // New state for holdings management
    const [searchQuery, setSearchQuery] = useState('');
    const [stockOptions, setStockOptions] = useState([]);
    const [selectedStock, setSelectedStock] = useState(null);
    const [quantity, setQuantity] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedHoldingId, setSelectedHoldingId] = useState(null);
    const [averagePrice, setAveragePrice] = useState('');
    const [decreaseQuantity, setDecreaseQuantity] = useState('');
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
    const [selectedHolding, setSelectedHolding] = useState(null);

    // new state for portfolio news
    const [portfolioNews, setPortfolioNews] = useState([]);

    // for mavigation to stock pages:
    const navigate = useNavigate();

    // DISPLAY PORTFOLIO DETAILS    
    const COLORS = [
      '#00d4aa', '#7c5cfc', '#ffc107', '#ff5252',
      '#00b0ff', '#e040fb', '#00e676', '#ff9100',
      '#6366f1', '#ec4899', '#14b8a6', '#f59e0b'
    ];

    const formatNumber = (value) => {
        if (typeof value !== 'number' || isNaN(value)) return 'N/A';
        return value.toFixed(2);
    };

    const formatCurrency = (value) => {
        if (typeof value !== 'number' || isNaN(value)) return 'N/A';
        return new Intl.NumberFormat('tr-TR', { 
            style: 'currency', 
            currency: 'TRY',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
        }).format(value);
    };

    const fetchPortfolioData = async () => {
        try {
            const portfolioData = await portfolioService.getPortfolio(portfolioId);
            setPortfolio(portfolioData);

            const allSectors = await stockService.getAllSectors();
            const sectorMapping = {};
            allSectors.forEach((sector) => {
                sectorMapping[sector.sector_id] = sector.name;
            });
            setSectorMap(sectorMapping);

            const holdingsData = await portfolioService.getPortfolioHoldings(portfolioId);

            const enhancedHoldings = await Promise.all(
                holdingsData.map(async (holding) => {
                    const stockPriceInfo = await stockService.getStockPrice(holding.stock_symbol);
                    const SectorData = await stockService.getSectorOfStock(holding.stock_symbol);

                    const currentMarketPrice = Number(stockPriceInfo.close_price);
                    const marketValue = currentMarketPrice * holding.quantity;
                    const profitLoss = (currentMarketPrice - holding.average_price) * holding.quantity;
                    const profitLossPercentage = ((currentMarketPrice - holding.average_price) / holding.average_price) * 100;

                    return {
                        ...holding,
                        currentMarketPrice,
                        marketValue,
                        profitLoss,
                        profitLossPercentage,
                        sector: sectorMapping[SectorData.sector_id]
                    };
                })
            );

            const totalPortfolioValue = enhancedHoldings.reduce((sum, holding) => sum + holding.marketValue, 0);
            const totalPortfolioProfit = enhancedHoldings.reduce((sum, holding) => sum + holding.profitLoss, 0);
            
            setTotalValue(totalPortfolioValue);
            setTotalProfit(totalPortfolioProfit);
            setHoldings(enhancedHoldings);

            const uniqueSectors = [...new Set(enhancedHoldings.map((holding) => holding.sector))];
            setSectors(uniqueSectors);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching portfolio data:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPortfolioData();
    }, [portfolioId]);

    // Search for stocks as user types
    useEffect(() => {
        const searchStocks = async () => {
            if (searchQuery.length < 2) return;
            try {
                const response = await stockService.searchStocks(searchQuery);
                setStockOptions(Array.isArray(response) ? response : [response]);
            } catch (error) {
                console.error('Error searching stocks:', error);
                setStockOptions([]);
            }
        };

        const debounceTimer = setTimeout(searchStocks, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    // Fetch news about the portfolio when holdings change or page loads (sayfa yüklendiğinde veya holdingler değiştiğinde)
    useEffect(() => {
        const fetchPortfolioNews = async () => {
        if (holdings.length > 0) {
            try {
            const companyNames = [...new Set(holdings.map(holding => holding.name))];
            const news = await newsService.getNewsAboutPortfolio(companyNames);
            setPortfolioNews(news);
            } catch (error) {
            console.error('Error fetching portfolio news:', error);
            }
        }
        };
    
        fetchPortfolioNews();
    }, [holdings]);

    const handleAddHolding = async () => {
        if (!selectedStock || !quantity || !averagePrice) return;
        
        setIsLoading(true);
        /*  
            selectedStock is sth like:
            {stock_symbol: 'ORGE', name: 'Orge Enerji Elektrik Taahhüt Anonim Sirketi', sector_id: 5, market_cap: 6660152320, last_updated: '2025-01-19T15:43:58'}
        */
        try {
            // Create the payload exactly as required
            const payload = {
                symbol: String(selectedStock.stock_symbol), // Ensure it's a string
                quantity: Number(quantity),           // Ensure it's a number
                price: Number(averagePrice)          // Ensure it's a number
            };
            
            // using the portfolioService to add the holding
            const response = await portfolioService.addHolding(portfolioId, 
                payload.symbol, 
                payload.quantity,
                payload.price
            );
            
            // Log the response
            console.log('Add holding response:', response);
            
            // Fetch the updated portfolio data
            await fetchPortfolioData();
            setIsAddDialogOpen(false);
            resetForm();
        } catch (error) {
            console.error('Error details:', error.response?.data || error);
            alert(`Failed to add holding. Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteHolding = async (holdingId) => {
        setIsLoading(true);
        console.log(holdingId);
        try {
            await portfolioService.deleteHolding(holdingId);
            await fetchPortfolioData();
            setIsDeleteDialogOpen(false);
        } catch (error) {
            console.error('Error deleting holding:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateHolding = async () => {
        if (!selectedHolding || !decreaseQuantity) return;
        
        setIsLoading(true);
        try {
            const newQuantity = selectedHolding.quantity - Number(decreaseQuantity);

            // we just pass holding id and also new quantity to decreaseHolding function
            
            // if the new quantity is less than or equal to 0, we delete the holding
            if (newQuantity <= 0) {
                // If new quantity would be 0 or negative, delete the holding
                await portfolioService.deleteHolding(selectedHolding.holding_id);
            } else {
                // decrease the quantity of the holding by the given amount
                await portfolioService.decreaseHolding(selectedHolding.holding_id, Number(decreaseQuantity)); 
            }
            
            await fetchPortfolioData();
            setIsUpdateDialogOpen(false);
            setDecreaseQuantity('');
            setSelectedHolding(null);
        } catch (error) {
            console.error('Error updating holding:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedStock(null);
        setQuantity('');
        setAveragePrice('');
        setSearchQuery('');
    };

    const getSectorHoldings = (sectorName) => {
        return holdings.filter(holding => holding.sector === sectorName);
    };

    const getSectorValue = (sectorName) => {
        return holdings
            .filter(holding => holding.sector === sectorName)
            .reduce((sum, holding) => sum + holding.marketValue, 0);
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

            {/* Portfolio Details Section */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h3" sx={{
                    fontWeight: 800,
                    mb: 2,
                    letterSpacing: '-0.02em',
                }}>
                    {portfolio?.name || 'Portfolio Details'}
                </Typography>
                
                <Grid container spacing={2} justifyContent="center" sx={{ mb: 4 }}>
                    <Grid item xs={12} md={4}>
                        <Paper elevation={0} sx={{
                            p: 3,
                            textAlign: 'center',
                            borderRadius: '16px',
                            border: '1px solid',
                            borderColor: 'divider',
                        }}>
                            <Typography variant="h6" color="text.secondary">Total Value</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', fontFamily: '"JetBrains Mono", monospace' }}>
                                {formatCurrency(totalValue)}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper elevation={0} sx={{
                            p: 3,
                            textAlign: 'center',
                            borderRadius: '16px',
                            border: '1px solid',
                            borderColor: 'divider',
                        }}>
                            <Typography variant="h6" color="text.secondary">Total P/L</Typography>
                            <Typography variant="h4" sx={{ 
                                fontWeight: 'bold', 
                                color: totalProfit >= 0 ? 'success.main' : 'error.main'
                            }}>
                                {formatCurrency(totalProfit)}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>

            <Grid container spacing={4}>
                <Grid item xs={12} md={5}>
                    <Paper elevation={0} sx={{
                        p: 3,
                        height: '100%',
                        borderRadius: '16px',
                        border: '1px solid',
                        borderColor: 'divider',
                    }}>
                        <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', fontWeight: 600 }}>
                            Market Value Distribution
                        </Typography>
                        <ResponsiveContainer width="100%" height={400}>
                            <PieChart>
                                <Pie
                                    data={sectors.map(sector => ({
                                        name: sector,
                                        value: getSectorValue(sector)
                                    }))}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={150}
                                    innerRadius={80}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                >
                                    {sectors.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value) => formatCurrency(value)}
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        borderRadius: 8,
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
                
                {/* Holdings Section */}
                <Grid item xs={12} md={7}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {sectors.map((sector) => (
                            <Paper key={sector} elevation={0} sx={{
                                borderRadius: '16px',
                                overflow: 'hidden',
                                border: '1px solid',
                                borderColor: 'divider',
                            }}>
                                <Accordion>
                                    <AccordionSummary
                                        expandIcon={<Typography variant="h6">↓</Typography>}
                                        sx={{ 
                                            '& .MuiAccordionSummary-content': { 
                                                display: 'flex', 
                                                alignItems: 'center',
                                                gap: 2
                                            }
                                        }}
                                    >
                                        <Typography variant="h6" sx={{ flex: 1 }}>{sector}</Typography>
                                        <Chip 
                                            label={formatCurrency(getSectorValue(sector))}
                                            sx={{ 
                                                backgroundColor: COLORS[sectors.indexOf(sector) % COLORS.length],
                                                color: 'white',
                                                fontWeight: 'bold'
                                            }}
                                        />
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ p: 0 }}>
                                        {getSectorHoldings(sector).map((holding) => (
                                            <Box
                                                key={holding.holding_id}
                                                onClick = {() => navigate(`/stocks/${holding.stock_symbol}`)}
                                                sx={{
                                                    p: 2,
                                                    borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                                                    cursor: 'pointer', // make the box clickable 
                                                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
                                                    
                                                }}
                                            >
                                                <Grid container alignItems="center" spacing={2}>
                                                    <Grid item xs={12} sm={3}>
                                                        <Typography variant="subtitle1" fontWeight="bold">
                                                            {holding.stock_symbol}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={6} sm={2}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Quantity: {holding.quantity}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={6} sm={2}>
                                                        <Typography variant="body2">
                                                            Avg: {formatCurrency(holding.average_price)}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={6} sm={2}>
                                                        <Typography variant="body2">
                                                            Current: {formatCurrency(holding.currentMarketPrice)}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={6} sm={3}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: holding.profitLoss >= 0 ? 'success.main' : 'error.main',
                                                                    fontWeight: 'bold'
                                                                }}
                                                            >
                                                                {formatCurrency(holding.profitLoss)} ({formatNumber(holding.profitLossPercentage)}%)
                                                            </Typography>
                                                        </Box>
                                                    </Grid>
                                                </Grid>
                                            </Box>
                                        ))}
                                    </AccordionDetails>
                                </Accordion>
                            </Paper>
                        ))}
                    </Box>
                </Grid>
            </Grid>

            {/* Manage Holdings Section */}
            <Box sx={{ mt: 6, mb: 4 }}>
                <Paper elevation={0} sx={{
                    p: 4,
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: 'divider',
                }}>
                    <Typography variant="h5" sx={{
                        mb: 4,
                        fontWeight: 700,
                        textAlign: 'center',
                    }}>
                        Manage Holdings
                    </Typography>

                    <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={4}>
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
                        <Grid item xs={12} md={2}>
                            <TextField
                                fullWidth
                                label="Quantity"
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="Average Price (TRY)"
                                type="number"
                                value={averagePrice}
                                onChange={(e) => setAveragePrice(e.target.value)}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={() => setIsAddDialogOpen(true)}
                                disabled={!selectedStock || !quantity || !averagePrice}
                                sx={{
                                    backgroundColor: 'primary.main',
                                    color: 'primary.contrastText',
                                    py: 2
                                }}
                            >
                                Add Holding
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            </Box>

            {/* Update holdings list to include decrease quantity button */}
            {sectors.map((sector) => (
                <Paper key={sector} elevation={3} sx={{ 
                    borderRadius: 2,
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)'
                }}>
                    <Accordion>
                        <AccordionSummary
                            expandIcon={<Typography variant="h6">↓</Typography>}
                            sx={{ 
                                '& .MuiAccordionSummary-content': { 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    gap: 2
                                }
                            }}
                        >
                            <Typography variant="h6" sx={{ flex: 1 }}>{sector}</Typography>
                            <Chip 
                                label={formatCurrency(getSectorValue(sector))}
                                sx={{ 
                                    backgroundColor: COLORS[sectors.indexOf(sector) % COLORS.length],
                                    color: 'white',
                                    fontWeight: 'bold'
                                }}
                            />
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0 }}>
                            {getSectorHoldings(sector).map((holding) => (
                                <Box
                                    key={holding.holding_id}
                                    onClick = {() => navigate(`/stocks/${holding.stock_symbol}`)}
                                    sx={{
                                        p: 2,
                                        borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                                        cursor: 'pointer', // make the box clickable
                                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
                                    }}
                                >
                                    <Grid container alignItems="center" spacing={2}>
                                        <Grid item xs={12} sm={2}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {holding.stock_symbol}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={2}>
                                            <Typography variant="body2" color="text.secondary">
                                                Quantity: {holding.quantity}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={2}>
                                            <Typography variant="body2">
                                                Avg: {formatCurrency(holding.average_price)}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={2}>
                                            <Typography variant="body2">
                                                Current: {formatCurrency(holding.currentMarketPrice)}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={2}>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: holding.profitLoss >= 0 ? 'success.main' : 'error.main',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {formatCurrency(holding.profitLoss)} ({formatNumber(holding.profitLossPercentage)}%)
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={2} sx={{ display: 'flex', gap: 1 }}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => {
                                                    setSelectedHolding(holding);
                                                    setIsUpdateDialogOpen(true);
                                                }}
                                            >
                                                Decrease
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="error"
                                                onClick={() => {
                                                    setSelectedHoldingId(holding.holding_id);
                                                    setIsDeleteDialogOpen(true);
                                                }}
                                            >
                                                Delete
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </Box>
                            ))}
                        </AccordionDetails>
                    </Accordion>
                </Paper>
            ))}

            {/* Add Holding Dialog */}
            <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)}>
                <DialogTitle>Confirm Add Holding</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to add {quantity} shares of {selectedStock?.symbol} at {formatCurrency(averagePrice)} per share?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsAddDialogOpen(false)} color="primary">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAddHolding}
                        variant="contained"
                        disabled={isLoading}
                        sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText' }}
                    >
                        {isLoading ? <CircularProgress size={24} /> : 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Decrease Quantity Dialog */}
            <Dialog open={isUpdateDialogOpen} onClose={() => setIsUpdateDialogOpen(false)}>
                <DialogTitle>Decrease Holding Quantity</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <Typography sx={{ mb: 2 }}>
                            Current quantity: {selectedHolding?.quantity || 0}
                        </Typography>
                        <TextField
                            fullWidth
                            label="Quantity to Decrease"
                            type="number"
                            value={decreaseQuantity}
                            onChange={(e) => setDecreaseQuantity(e.target.value)}
                            inputProps={{ 
                                min: 1, 
                                max: selectedHolding?.quantity || 0 
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsUpdateDialogOpen(false)} color="primary">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpdateHolding}
                        variant="contained"
                        disabled={isLoading || !decreaseQuantity || decreaseQuantity > (selectedHolding?.quantity || 0)}
                        sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText' }}
                    >
                        {isLoading ? <CircularProgress size={24} /> : 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this holding?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDeleteDialogOpen(false)} color="primary">
                        Cancel
                    </Button>
                    <Button
                        onClick={() => handleDeleteHolding(selectedHoldingId)}
                        variant="contained"
                        color="error"
                        disabled={isLoading}
                    >
                        {isLoading ? <CircularProgress size={24} /> : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Portfolio News Section */}
            {portfolioNews.length > 0 && (
            <Box sx={{ mt: 6 }}>
                <NewsSection news={portfolioNews} />
            </Box>
            )}

        </Container>
    );
};

export default PortfolioPage;
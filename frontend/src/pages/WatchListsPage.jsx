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
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  Chip,
  Tooltip,
  Alert,
} from '@mui/material';
import { 
  Search, 
  Plus, 
  Trash2, 
  Eye, 
  TrendingUp, 
  Bell,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import watchListService from '../services/watchListService';
import stockService from '../services/stockService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles';

const WatchListsPage = () => {
    const navigate = useNavigate();
    const { userId } = useAuth();
    const theme = useTheme();
  
    // State
    const [watchlists, setWatchlists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newWatchlistName, setNewWatchlistName] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedWatchlist, setSelectedWatchlist] = useState(null);
    const [watchlistStats, setWatchlistStats] = useState({});

  // Fetch watchlists and their stats
  const fetchWatchlistsData = async () => {
    try {
      const watchlistsData = await watchListService.getAllWatchlists(userId);
      /*
        watchlistsData is sth like:
        [
          {
            "watchlist_id": 1,
            "user_id": 1,
            "name": "Bilancosu İyi Beklenenler",
            "created_at": "2025-01-27T10:23:30"
          },
          ...
        ]
      */
      
      // Fetch additional stats for each watchlist
      const statsPromises = watchlistsData.map(async (watchlist) => {
        const stocks = await watchListService.getWatchlistItems(watchlist.watchlist_id);
        
        // Get current prices for performance calculation
        const stocksWithPrices = await Promise.all(stocks.map(async (stock) => {
          const priceInfo = await stockService.getStockPrice(stock.stock_symbol);
          return {
            ...stock,
            currentPrice: Number(priceInfo.close_price)
          };
        }));

        // Calculate stats
        const stats = {
          stockCount: stocks.length,
          activeAlerts: stocks.filter(s => s.alert_price).length,
          topPerformers: stocksWithPrices
            .sort((a, b) => b.currentPrice - a.currentPrice)
            .slice(0, 3)
            .map(s => s.stock_symbol),
          lastUpdated: new Date(watchlist.last_updated).toLocaleDateString()
        };

        return [watchlist.watchlist_id, stats];
      });

      const stats = Object.fromEntries(await Promise.all(statsPromises));
      setWatchlistStats(stats);
      setWatchlists(watchlistsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching watchlists:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlistsData();
  }, []);

  // Filter watchlists based on search query
  const filteredWatchlists = watchlists.filter(watchlist =>
    watchlist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle creating new watchlist
  const handleCreateWatchlist = async () => {
    if (!newWatchlistName.trim()) return;
    try {
        // user id and name of the new watchlist
        // user id is taken from the context
        await watchListService.createWatchlist(userId, newWatchlistName);
        await fetchWatchlistsData();
        setCreateDialogOpen(false);
        setNewWatchlistName('');
    } catch (error) {
        console.error('Error creating watchlist:', error);
    }
  };

  // Handle deleting watchlist
  const handleDeleteWatchlist = async () => {
    if (!selectedWatchlist) return;
    try {
        // pass the watchlist id to the deleteWatchlist function
        await watchListService.deleteWatchlist(selectedWatchlist.watchlist_id);
        await fetchWatchlistsData();
        setDeleteDialogOpen(false);
        setSelectedWatchlist(null);
    } catch (error) {
        
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
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
          My Watchlists
        </Typography>
      </Box>

      {/* Search and Create Section */}
      <Paper elevation={0} sx={{
        p: 3,
        mb: 4,
        borderRadius: '16px',
        border: '1px solid',
        borderColor: 'divider',
      }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Search watchlists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={20} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Plus size={20} />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{
                backgroundColor: 'primary.main',
                py: 2
              }}
            >
              Create New Watchlist
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Quick Stats */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                {watchlists.length}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Total Watchlists
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: 'secondary.main', fontWeight: 'bold' }}>
                {Object.values(watchlistStats).reduce((sum, stat) => sum + stat.stockCount, 0)}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Watched Stocks
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                {Object.values(watchlistStats).reduce((sum, stat) => sum + stat.activeAlerts, 0)}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Active Alerts
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Watchlists Grid */}
      {filteredWatchlists.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No watchlists found matching your search.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredWatchlists.map((watchlist) => (
            <Grid item key={watchlist.watchlist_id} xs={12} sm={6} lg={4}>
              <Card 
                elevation={3}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                      {watchlist.name}
                    </Typography>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setSelectedWatchlist(watchlist);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Tooltip title="Number of stocks">
                        <Chip
                          icon={<Eye size={16} />}
                          label={watchlistStats[watchlist.watchlist_id]?.stockCount || 0}
                          sx={{ width: '100%' }}
                        />
                      </Tooltip>
                    </Grid>
                    <Grid item xs={6}>
                      <Tooltip title="Active price alerts">
                        <Chip
                          icon={<Bell size={16} />}
                          label={watchlistStats[watchlist.watchlist_id]?.activeAlerts || 0}
                          sx={{ width: '100%' }}
                        />
                      </Tooltip>
                    </Grid>
                  </Grid>

                  {watchlistStats[watchlist.watchlist_id]?.topPerformers?.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        <TrendingUp size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        Top Performers
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {watchlistStats[watchlist.watchlist_id].topPerformers.map((symbol) => (
                          <Chip
                            key={symbol}
                            label={symbol}
                            size="small"
                            sx={{ backgroundColor: '#e5e7eb' }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Clock size={14} style={{ marginRight: '4px' }} />
                    Created at: {watchlistStats[watchlist.watchlist_id]?.created_at}
                  </Typography>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    endIcon={<ArrowUpRight size={18} />}
                    onClick={() => navigate(`/watchlist/${watchlist.watchlist_id}`)}
                    sx={{
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                    }}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Watchlist Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Create New Watchlist</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Watchlist Name"
            fullWidth
            value={newWatchlistName}
            onChange={(e) => setNewWatchlistName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateWatchlist}
            variant="contained"
            disabled={!newWatchlistName.trim()}
            sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText' }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Watchlist</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedWatchlist?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteWatchlist}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default WatchListsPage;
import React, { useState, useEffect, useRef } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  InputBase,
  Menu,
  MenuItem,
  IconButton,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Slide,
  Popover,
  Badge,
  Divider,
  Avatar,
  Chip
} from '@mui/material';
import {
  AccountCircle,
  Search as SearchIcon,
  Close,
  Notifications as NotificationsIcon,
  LightMode,
  DarkMode,
  TrendingUp,
  Logout,
  Person,
  ShowChart,
  PieChart,
  Business
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import stockService from '../services/stockService';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();

  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);

  useEffect(() => {
    if (!user) return;

    const connectWebSocket = () => {
      socketRef.current = new WebSocket("ws://localhost:8002/ws/" + user.user_id);

      socketRef.current.onmessage = (event) => {
        setNotifications((prev) => [event.data, ...prev].slice(0, 10));
        setUnreadCount((prev) => prev + 1);
      };

      socketRef.current.onclose = () => {
        setTimeout(connectWebSocket, 3000);
      };

      socketRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        socketRef.current.close();
      };
    };

    connectWebSocket();
    return () => socketRef.current?.close();
  }, [user]);

  const handleNotifOpen = (event) => {
    setNotificationAnchorEl(event.currentTarget);
    setAnchorEl(null);
    setUnreadCount(0);
  };

  const handleNotifClose = () => setNotificationAnchorEl(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
    setNotificationAnchorEl(null);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleMenuClose = () => setAnchorEl(null);

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    setIsSearchOpen(query.trim() !== '');
  };

  const handleSearchClose = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
    if (searchInputRef.current) searchInputRef.current.blur();
  };

  const handleStockSelect = (stock) => {
    setSearchQuery('');
    setIsSearchOpen(false);
    navigate(`/stocks/${stock.stock_symbol}`);
  };

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (searchQuery.trim() === '') {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      try {
        const results = await stockService.searchStocks(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Error fetching search results:', error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSearchResults, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Hide navbar on login/register pages
  if (['/login', '/register'].includes(location.pathname)) {
    return null;
  }

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar sx={{ height: 64, px: { xs: 2, sm: 3 } }}>
        {/* Logo */}
        <Button
          onClick={() => navigate('/dashboard')}
          sx={{
            padding: 0,
            minWidth: 'auto',
            background: 'transparent',
            '&:hover': { background: 'transparent' },
          }}
          disableRipple
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp sx={{ color: 'primary.main', fontSize: 28 }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'text.primary',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              Z<Box component="span" sx={{ color: 'primary.main' }}>invest</Box>
            </Typography>
          </Box>
        </Button>

        {/* Search Bar */}
        {user && (
          <Box sx={{
            position: 'relative',
            flexGrow: 1,
            maxWidth: 480,
            mx: { xs: 2, sm: 4 },
          }}>
            <Box
              component="form"
              onSubmit={(e) => e.preventDefault()}
              sx={{
                display: 'flex',
                alignItems: 'center',
                borderRadius: '10px',
                backgroundColor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(0,0,0,0.04)',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s ease',
                '&:focus-within': {
                  borderColor: 'primary.main',
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.02)',
                  boxShadow: (theme) =>
                    `0 0 0 3px ${theme.palette.mode === 'dark' ? 'rgba(0,212,170,0.15)' : 'rgba(13,147,115,0.15)'}`,
                },
              }}
            >
              <SearchIcon sx={{ ml: 1.5, color: 'text.secondary', fontSize: 20 }} />
              <InputBase
                ref={searchInputRef}
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={handleSearchChange}
                sx={{
                  color: 'text.primary',
                  width: '100%',
                  '& .MuiInputBase-input': {
                    padding: '8px 12px',
                    fontSize: '0.875rem',
                    '&::placeholder': {
                      color: 'text.secondary',
                      opacity: 1,
                    },
                  },
                }}
              />
              {(loading || (searchQuery && isSearchOpen)) && (
                <IconButton
                  onClick={handleSearchClose}
                  size="small"
                  sx={{ mr: 0.5, color: 'text.secondary' }}
                >
                  {loading ? (
                    <CircularProgress size={18} sx={{ color: 'primary.main' }} />
                  ) : (
                    <Close fontSize="small" />
                  )}
                </IconButton>
              )}
            </Box>

            {/* Search Results Dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <Slide direction="down" in={isSearchOpen} mountOnEnter unmountOnExit>
                <Paper
                  elevation={8}
                  sx={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    mt: 1,
                    zIndex: 1300,
                    borderRadius: '12px',
                    maxHeight: '360px',
                    overflowY: 'auto',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <List sx={{ py: 0.5 }}>
                    {searchResults.map((stock) => (
                      <ListItem
                        button
                        key={stock.stock_symbol}
                        onClick={() => handleStockSelect(stock)}
                        sx={{
                          py: 1.5,
                          px: 2,
                          transition: 'background 0.15s',
                          '&:hover': {
                            backgroundColor: (theme) =>
                              theme.palette.mode === 'dark'
                                ? 'rgba(0,212,170,0.08)'
                                : 'rgba(13,147,115,0.06)',
                          },
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Chip
                                label={stock.stock_symbol}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' }}
                              />
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {stock.name}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Slide>
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
          {/* Theme Toggle */}
          <IconButton
            onClick={toggleTheme}
            size="small"
            sx={{
              color: 'text.secondary',
              transition: 'all 0.2s',
              '&:hover': { color: 'primary.main' },
            }}
          >
            {mode === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
          </IconButton>

          {/* Notifications */}
          {user && (
            <IconButton
              onClick={handleNotifOpen}
              size="small"
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
            >
              <Badge
                badgeContent={unreadCount}
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: '#ff5252',
                    color: '#fff',
                    fontSize: '0.65rem',
                    minWidth: 16,
                    height: 16,
                  },
                }}
              >
                <NotificationsIcon fontSize="small" />
              </Badge>
            </IconButton>
          )}

          {/* Notifications Popover */}
          <Popover
            open={Boolean(notificationAnchorEl)}
            anchorEl={notificationAnchorEl}
            onClose={handleNotifClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: { width: 320, maxHeight: 400, mt: 1, borderRadius: '12px' },
            }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Notifications</Typography>
            </Box>
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {notifications.length > 0 ? (
                notifications.map((notif, index) => (
                  <ListItem key={index} sx={{ py: 1.5 }}>
                    <ListItemText
                      primary={notif}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText
                    primary="No new notifications"
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary', textAlign: 'center' }}
                  />
                </ListItem>
              )}
            </List>
            {notifications.length > 0 && (
              <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button
                  fullWidth
                  size="small"
                  onClick={() => {
                    setNotifications([]);
                    setUnreadCount(0);
                  }}
                  sx={{ color: 'error.main', fontSize: '0.75rem' }}
                >
                  Clear All
                </Button>
              </Box>
            )}
          </Popover>

          {/* User Menu */}
          {user && (
            <>
              <IconButton
                onClick={handleMenuOpen}
                size="small"
                sx={{
                  ml: 0.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(0,212,170,0.08)'
                        : 'rgba(13,147,115,0.06)',
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    fontSize: '0.7rem',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    mr: { xs: 0, sm: 1 },
                  }}
                >
                  {user.username?.charAt(0).toUpperCase()}
                </Avatar>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    display: { xs: 'none', sm: 'block' },
                    color: 'text.primary',
                  }}
                >
                  {user.username}
                </Typography>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                TransitionComponent={Slide}
                TransitionProps={{ direction: 'down' }}
                PaperProps={{
                  elevation: 8,
                  sx: {
                    mt: 1.5,
                    minWidth: 200,
                    borderRadius: '12px',
                    '& .MuiMenuItem-root': {
                      px: 2,
                      py: 1.5,
                      borderRadius: '8px',
                      mx: 1,
                      my: 0.25,
                      gap: 1.5,
                      fontSize: '0.875rem',
                      transition: 'all 0.15s',
                    },
                  },
                }}
              >
                <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
                  <Person fontSize="small" sx={{ color: 'text.secondary' }} />
                  Profile
                </MenuItem>
                <MenuItem onClick={() => { handleMenuClose(); navigate('/portfolios'); }}>
                  <PieChart fontSize="small" sx={{ color: 'text.secondary' }} />
                  Portfolios
                </MenuItem>
                <MenuItem onClick={() => { handleMenuClose(); navigate('/stocks'); }}>
                  <ShowChart fontSize="small" sx={{ color: 'text.secondary' }} />
                  Stocks
                </MenuItem>
                <MenuItem onClick={() => { handleMenuClose(); navigate('/sectors'); }}>
                  <Business fontSize="small" sx={{ color: 'text.secondary' }} />
                  Sectors
                </MenuItem>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem
                  onClick={() => { handleMenuClose(); logout(); navigate('/login'); }}
                  sx={{ color: 'error.main' }}
                >
                  <Logout fontSize="small" />
                  Log Out
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;

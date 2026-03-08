import React from 'react';
import {
  Container,
  Typography,
  Box,
  Avatar,
  CircularProgress,
  Paper,
  Divider,
  Grid,
  Card,
  CardContent,
  Button,
  useTheme,
} from '@mui/material';
import {
  Email,
  Dashboard,
  ShowChart,
  PieChart,
  Business,
  WatchLater,
  LightMode,
  DarkMode,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const { user } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();
  const theme = useTheme();

  const navigationItems = [
    { title: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { title: 'All Stocks', icon: <ShowChart />, path: '/stocks' },
    { title: 'Portfolios', icon: <PieChart />, path: '/portfolios' },
    { title: 'Sectors', icon: <Business />, path: '/sectors' },
    { title: 'Watchlists', icon: <WatchLater />, path: '/watchlists' },
  ];

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, pb: { xs: 10, md: 4 } }}>
      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}
          >
            <Box
              sx={{
                height: 80,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              }}
            />
            <Box sx={{ px: 3, pb: 3, mt: -5 }}>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    border: `3px solid ${theme.palette.background.paper}`,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    mb: 2,
                  }}
                >
                  {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.25 }}>
                  {user.first_name} {user.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  @{user.username}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                  <Email sx={{ fontSize: 16 }} />
                  <Typography variant="body2">{user.email}</Typography>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Theme Toggle Card */}
          <Paper
            elevation={0}
            sx={{ borderRadius: '16px', p: 3, mt: 2, border: '1px solid', borderColor: 'divider' }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
              Appearance
            </Typography>
            <Button
              startIcon={mode === 'dark' ? <LightMode /> : <DarkMode />}
              variant="outlined"
              fullWidth
              onClick={toggleTheme}
              sx={{ borderRadius: '10px' }}
            >
              Switch to {mode === 'dark' ? 'Light' : 'Dark'} Mode
            </Button>
          </Paper>
        </Grid>

        {/* Navigation Cards */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{ borderRadius: '16px', p: 3, border: '1px solid', borderColor: 'divider' }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Quick Navigation
            </Typography>
            <Grid container spacing={2}>
              {navigationItems.map((item) => (
                <Grid item xs={6} sm={4} key={item.path}>
                  <Card
                    elevation={0}
                    sx={{
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        borderColor: 'primary.main',
                        transform: 'translateY(-2px)',
                      },
                    }}
                    onClick={() => navigate(item.path)}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Box sx={{
                        color: 'primary.main',
                        mb: 1,
                        '& .MuiSvgIcon-root': { fontSize: 28 },
                      }}>
                        {item.icon}
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.title}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfilePage;

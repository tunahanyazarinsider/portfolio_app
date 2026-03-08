import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { Dashboard, Business, ShowChart, WatchLater, PieChart, AccountBox } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Dashboard', icon: Dashboard, path: '/dashboard' },
  { label: 'Sectors', icon: Business, path: '/sectors' },
  { label: 'Stocks', icon: ShowChart, path: '/stocks' },
  { label: 'Watchlists', icon: WatchLater, path: '/watchlists' },
  { label: 'Portfolio', icon: PieChart, path: '/portfolios' },
  { label: 'Profile', icon: AccountBox, path: '/profile' },
];

const BottomNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  if (!user || ['/login', '/register'].includes(location.pathname)) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        display: { xs: 'flex', md: 'none' },
        justifyContent: 'space-around',
        alignItems: 'center',
        py: 1,
        px: 1,
        backgroundColor: (theme) =>
          theme.palette.mode === 'dark'
            ? 'rgba(17, 24, 39, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        const Icon = item.icon;

        return (
          <IconButton
            key={item.path}
            onClick={() => navigate(item.path)}
            sx={{
              flexDirection: 'column',
              borderRadius: '12px',
              px: 1.5,
              py: 0.75,
              gap: 0.25,
              color: isActive ? 'primary.main' : 'text.secondary',
              backgroundColor: isActive
                ? (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(0,212,170,0.1)'
                      : 'rgba(13,147,115,0.08)'
                : 'transparent',
              transition: 'all 0.2s',
              '&:hover': {
                color: 'primary.main',
              },
            }}
          >
            <Icon sx={{ fontSize: 20 }} />
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.6rem',
                fontWeight: isActive ? 700 : 500,
                lineHeight: 1,
              }}
            >
              {item.label}
            </Typography>
          </IconButton>
        );
      })}
    </Box>
  );
};

export default BottomNavbar;

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';

// Import your pages
import LoginPage from './pages/loginPage';
import RegisterPage from './pages/registerPage';
import Dashboard from './pages/dashboard';
import NotFound from './pages/NotFound';
import StockPage from './pages/StockPage';
import ProfilePage from './pages/ProfilePage';
import PortfoliosPage from './pages/PortfoliosPage';
import PortfolioPage from './pages/PortfolioPage';
import AllSectorsPage from './pages/AllSectorsPage';
import SectorPage from './pages/SectorPage';
import AllStocksPage from './pages/AllStocksPage';
import WatchlistPage from './pages/WatchListPage';
import WatchListsPage from './pages/WatchListsPage';

import BottomNavbar from './components/BottomNavbar';
import Navbar from './components/Navbar';
import WebSocketComponent from './components/WebSocketComponent';

function AppContent() {
  return (
    <AuthProvider>
      <Navbar />

      {/* {<WebSocketComponent/>} */}

      <ErrorBoundary>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/stocks/:symbol" element={<PrivateRoute><StockPage /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/portfolios" element={<PrivateRoute><PortfoliosPage /></PrivateRoute>} />
            <Route path="/portfolios/:id" element={<PrivateRoute><PortfolioPage /></PrivateRoute>} />
            <Route path="/sectors" element={<PrivateRoute><AllSectorsPage /></PrivateRoute>} />
            <Route path="/sectors/:sectorId" element={<PrivateRoute><SectorPage /></PrivateRoute>} />
            <Route path="/stocks" element={<PrivateRoute><AllStocksPage /></PrivateRoute>} />
            <Route path="/watchlist/:watchlistId" element={<PrivateRoute><WatchlistPage /></PrivateRoute>} />
            <Route path="/watchlists" element={<PrivateRoute><WatchListsPage /></PrivateRoute>} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Box>
      </ErrorBoundary>

      <BottomNavbar />
    </AuthProvider>
  );
}

export default AppContent;

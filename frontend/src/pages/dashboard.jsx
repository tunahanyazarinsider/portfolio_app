import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Box,
  Paper,
  Fade
} from '@mui/material';
import SectorCard from '../components/SectorCard';
import stockService from '../services/stockService';
import NewsSection from '../components/NewsSection';
import PortfolioCard from '../components/PortfolioCard';
import portfolioService from '../services/portfolioService';
import newsService from '../services/newsService';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sectorsData = await stockService.getAllSectors();
        const portfoliosData = await portfolioService.getUserPortfolios(user.user_id);
        setPortfolios(portfoliosData.slice(0, 3));
        setSectors(sectorsData.slice(0, 3));
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchNews = async () => {
      const newsData = await newsService.getNews();
      setNews(newsData);
    };

    fetchData();
    fetchNews();
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 4, pb: { xs: 10, md: 4 } }}>
      {/* Welcome Header */}
      <Fade in={true} timeout={500}>
        <Box sx={{ mb: 5 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.03em',
              mb: 0.5,
            }}
          >
            Welcome back, <Box component="span" sx={{ color: 'primary.main' }}>{user?.first_name || user?.username}</Box>
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Here's what's happening with your investments today.
          </Typography>
        </Box>
      </Fade>

      {/* Portfolios */}
      <Box sx={{ mb: 5 }}>
        <Typography
          variant="h5"
          sx={{
            mb: 3,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 4,
              height: 24,
              borderRadius: 2,
              bgcolor: 'primary.main',
            }}
          />
          Your Portfolios
        </Typography>
        <Grid container spacing={3}>
          {portfolios.map((portfolio) => (
            <Grid item xs={12} sm={6} md={4} key={portfolio.portfolio_id}>
              <PortfolioCard portfolio={portfolio} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Sectors */}
      <Box sx={{ mb: 5 }}>
        <Typography
          variant="h5"
          sx={{
            mb: 3,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 4,
              height: 24,
              borderRadius: 2,
              bgcolor: 'secondary.main',
            }}
          />
          Explore Sectors
        </Typography>
        <Grid container spacing={3}>
          {sectors.map((sector) => (
            <Grid item xs={12} sm={6} md={4} key={sector.sector_id}>
              <SectorCard sectorId={sector.sector_id} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* News */}
      <NewsSection news={news} />
    </Container>
  );
};

export default Dashboard;

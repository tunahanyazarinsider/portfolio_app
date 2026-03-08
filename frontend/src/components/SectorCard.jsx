import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Chip,
  Stack,
  useTheme,
} from '@mui/material';
import { Business, TrendingUp } from '@mui/icons-material';
import stockService from '../services/stockService';
import { useNavigate } from 'react-router-dom';

const SectorCard = ({ sectorId }) => {
  const [sectorInfo, setSectorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    const fetchSectorInfo = async () => {
      try {
        const data = await stockService.getSectorInfo(sectorId);
        setSectorInfo(data);
      } catch (err) {
        setError('Failed to fetch sector information.');
      } finally {
        setLoading(false);
      }
    };
    fetchSectorInfo();
  }, [sectorId]);

  if (loading) {
    return (
      <Card sx={{ height: 280, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={28} sx={{ color: 'primary.main' }} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ height: 280, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="body2" color="error">{error}</Typography>
      </Card>
    );
  }

  const { sector, number_of_companies, total_market_cap, top_3_companies } = sectorInfo;

  const formatMarketCap = (value) => {
    if (!value) return 'N/A';
    if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T TL`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B TL`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M TL`;
    return `${value.toLocaleString()} TL`;
  };

  return (
    <Card
      onClick={() => navigate(`/sectors/${sectorId}`)}
      sx={{
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-4px)',
        },
      }}
    >
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(0,212,170,0.1)'
                : 'rgba(13,147,115,0.08)',
            }}
          >
            <Business sx={{ color: 'primary.main', fontSize: 20 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, flex: 1, lineHeight: 1.2 }}>
            {sector?.name || 'Unknown'}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} sx={{ mb: 2.5 }}>
          <Chip
            label={`${number_of_companies ?? 0} companies`}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.7rem' }}
          />
          <Chip
            label={formatMarketCap(total_market_cap)}
            size="small"
            sx={{
              fontSize: '0.7rem',
              fontFamily: '"JetBrains Mono", monospace',
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(124,92,252,0.12)'
                : 'rgba(109,74,255,0.08)',
              color: 'secondary.main',
              border: 'none',
            }}
          />
        </Stack>

        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
            TOP COMPANIES
          </Typography>
          {top_3_companies?.length > 0 ? (
            <Stack spacing={0.75}>
              {top_3_companies.map((company) => (
                <Box
                  key={company.stock_symbol}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 0.5,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {company.name || 'Unknown'}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: '"JetBrains Mono", monospace',
                      color: 'text.secondary',
                      fontWeight: 500,
                    }}
                  >
                    {company.stock_symbol}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No companies to display.
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SectorCard;

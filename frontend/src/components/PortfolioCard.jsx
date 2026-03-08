import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { ArrowForward } from '@mui/icons-material';
import portfolioService from '../services/portfolioService';
import stockService from '../services/stockService';

const PortfolioCard = ({ portfolio }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [pieData, setPieData] = useState([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#00d4aa', '#7c5cfc', '#ffc107', '#ff5252', '#00b0ff', '#e040fb', '#00e676', '#ff9100'];

  useEffect(() => {
    const fetchHoldings = async () => {
      if (!portfolio.portfolio_id) {
        setLoading(false);
        return;
      }

      try {
        const holdings = await portfolioService.getPortfolioHoldings(portfolio.portfolio_id);
        const data = await Promise.all(
          holdings.map(async (holding) => {
            const stockPriceInfo = await stockService.getStockPrice(holding.stock_symbol);
            const marketValue = stockPriceInfo.close_price * holding.quantity;
            return {
              name: holding.stock_symbol,
              value: marketValue,
              marketValue: marketValue.toFixed(2),
            };
          })
        );
        setPieData(data);
      } catch (error) {
        console.error('Error fetching portfolio holdings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHoldings();
  }, [portfolio.portfolio_id]);

  const totalValue = pieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': { transform: 'translateY(-4px)' },
      }}
    >
      <CardContent sx={{ flex: 1, p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          {portfolio.name || 'Unnamed Portfolio'}
        </Typography>

        {totalValue > 0 && (
          <Typography
            variant="body2"
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              color: 'primary.main',
              fontWeight: 600,
              mb: 2,
            }}
          >
            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalValue)}
          </Typography>
        )}

        <Box sx={{ height: 220 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress size={28} sx={{ color: 'primary.main' }} />
            </Box>
          ) : pieData.length > 0 ? (
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  strokeWidth={0}
                  isAnimationActive
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value)
                  }
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: 8,
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    fontSize: '0.8rem',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography variant="body2" color="text.secondary">
                No holdings yet
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
      <CardActions sx={{ px: 3, pb: 2 }}>
        <Button
          size="small"
          onClick={() => navigate(`/portfolios/${portfolio.portfolio_id}`)}
          disabled={!portfolio.portfolio_id}
          endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
          sx={{ color: 'primary.main', fontWeight: 600 }}
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );
};

export default PortfolioCard;

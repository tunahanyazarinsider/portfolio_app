import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  Box,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  AssessmentOutlined as AssessmentIcon
} from '@mui/icons-material';

const StockPriceDetailsCard = ({ stockInfo }) => {
  const priceDetails = [
    { label: 'Previous Close', value: stockInfo.regularMarketPreviousClose, icon: <MoneyIcon color="primary" /> },
    { label: '52 Week Low', value: stockInfo.fiftyTwoWeekLow, icon: <TrendingUpIcon color="success" /> },
    { label: '52 Week High', value: stockInfo.fiftyTwoWeekHigh, icon: <TrendingUpIcon color="error" /> },
    { label: '50 Day Average', value: stockInfo.fiftyDayAverage, icon: <AssessmentIcon color="secondary" /> },
    { label: '200 Day Average', value: stockInfo.twoHundredDayAverage, icon: <AssessmentIcon sx={{ color: 'text.secondary' }} /> },
    { label: '52 Week Change', value: stockInfo['52WeekChange'] ? `${(stockInfo['52WeekChange'] * 100).toFixed(2)}%` : null, icon: <TrendingUpIcon color="warning" /> },
    { label: 'Target High Price', value: stockInfo.targetHighPrice, icon: <MoneyIcon color="success" /> },
    { label: 'Target Low Price', value: stockInfo.targetLowPrice ? stockInfo.targetLowPrice : null, icon: <MoneyIcon color="error" /> },
    { label: 'Mean Target Price', value: stockInfo.targetMeanPrice, icon: <MoneyIcon color="primary" /> },
    { label: 'Analyst Opinions', value: stockInfo.numberOfAnalystOpinions, icon: <AssessmentIcon color="secondary" /> },
    { label: 'Recommendation', value: stockInfo.recommendationKey, icon: <TrendingUpIcon sx={{ color: 'text.secondary' }} /> }
  ];

  return (
    <Card elevation={0} sx={{ height: '100%' }}>
      <CardContent>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', mb: 2 }}
        >
          <MoneyIcon sx={{ mr: 2 }} color="primary" />
          Stock Price Details
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          {priceDetails.map((detail, index) => (
            detail.value !== null && detail.value !== undefined ? (
              <Grid item xs={6} md={4} key={index}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {detail.icon}
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {detail.label}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, fontFamily: '"JetBrains Mono", monospace' }}>
                      {detail.value}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ) : null
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default StockPriceDetailsCard;

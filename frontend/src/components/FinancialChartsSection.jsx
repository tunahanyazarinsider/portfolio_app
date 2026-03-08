import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  Timeline as TimelineIcon,
  AccountBalance as BalanceIcon,
  AccountBalanceWallet as WalletIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import BarChart from '../components/BarChart';

// Check if chart data has any meaningful (non-zero, non-null) values
const hasValidData = (chartData) => {
  if (!chartData) return false;
  if (!chartData.datasets || !chartData.datasets[0]) return false;
  const values = chartData.datasets[0].data;
  if (!values || values.length === 0) return false;
  return values.some(v => v != null && v !== 0 && !isNaN(v));
};

const ChartCard = ({ title, chart, icon }) => (
  <Card elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2.5, '&:last-child': { pb: 2.5 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: '10px',
          bgcolor: 'action.hover',
        }}>
          {icon}
        </Box>
        <Typography variant="subtitle1" sx={{ ml: 1.5, fontWeight: 700, fontSize: '0.9rem' }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        {chart}
      </Box>
    </CardContent>
  </Card>
);

const SectionHeader = ({ icon, title, color = 'primary.main' }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, mt: 1 }}>
    <Box sx={{ width: 4, height: 24, bgcolor: color, borderRadius: 2, mr: 1.5 }} />
    {icon}
    <Typography variant="h6" sx={{ ml: 1, fontWeight: 700, fontSize: '1.05rem' }}>
      {title}
    </Typography>
  </Box>
);

const FinancialChartsSection = ({
  revenueChartData,
  operatingIncomeChartData,
  operatingMarginChartData,
  grossProfitChartData,
  netProfitChartData,
  totalAssetsChartData,
  totalLiabilitiesChartData,
  totalEquityChartData,
  currentAssetsChartData,
  currentLiabilitiesChartData,
  freeCashFlowChartData
}) => {
  // Group charts by financial statement category
  const incomeStatementCharts = [
    { title: 'Revenue', data: revenueChartData, icon: <BarChartIcon sx={{ fontSize: 20, color: 'primary.main' }} />, unit: 'TL' },
    { title: 'Gross Profit', data: grossProfitChartData, icon: <BarChartIcon sx={{ fontSize: 20, color: 'info.main' }} />, unit: 'TL' },
    { title: 'Operating Income', data: operatingIncomeChartData, icon: <LineChartIcon sx={{ fontSize: 20, color: 'secondary.main' }} />, unit: 'TL' },
    { title: 'Operating Margin', data: operatingMarginChartData, icon: <TimelineIcon sx={{ fontSize: 20, color: 'warning.main' }} />, unit: '%' },
    { title: 'Net Profit', data: netProfitChartData, icon: <LineChartIcon sx={{ fontSize: 20, color: 'error.main' }} />, unit: 'TL' },
  ].filter(c => hasValidData(c.data));

  const balanceSheetCharts = [
    { title: 'Total Assets', data: totalAssetsChartData, icon: <BalanceIcon sx={{ fontSize: 20, color: 'primary.main' }} />, unit: 'TL' },
    { title: 'Current Assets', data: currentAssetsChartData, icon: <BalanceIcon sx={{ fontSize: 20, color: 'info.main' }} />, unit: 'TL' },
    { title: 'Total Liabilities', data: totalLiabilitiesChartData, icon: <BalanceIcon sx={{ fontSize: 20, color: 'secondary.main' }} />, unit: 'TL' },
    { title: 'Current Liabilities', data: currentLiabilitiesChartData, icon: <BalanceIcon sx={{ fontSize: 20, color: 'error.main' }} />, unit: 'TL' },
    { title: 'Total Equity', data: totalEquityChartData, icon: <WalletIcon sx={{ fontSize: 20, color: 'warning.main' }} />, unit: 'TL' },
  ].filter(c => hasValidData(c.data));

  const cashFlowCharts = [
    { title: 'Free Cash Flow', data: freeCashFlowChartData, icon: <WalletIcon sx={{ fontSize: 20, color: 'primary.main' }} />, unit: 'TL' },
  ].filter(c => hasValidData(c.data));

  const hasAnyData = incomeStatementCharts.length > 0 || balanceSheetCharts.length > 0 || cashFlowCharts.length > 0;
  if (!hasAnyData) return null;

  const renderChartGrid = (charts) => (
    <Grid container spacing={2.5}>
      {charts.map((chart, index) => (
        <Grid item xs={12} md={6} lg={4} key={index}>
          <ChartCard
            title={chart.title}
            chart={<BarChart data={chart.data} unit={chart.unit} />}
            icon={chart.icon}
          />
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box sx={{ my: 4 }}>
      {incomeStatementCharts.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <SectionHeader
            icon={<ReceiptIcon sx={{ fontSize: 22, color: 'primary.main' }} />}
            title="Income Statement"
            color="primary.main"
          />
          {renderChartGrid(incomeStatementCharts)}
        </Box>
      )}

      {balanceSheetCharts.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <SectionHeader
            icon={<BalanceIcon sx={{ fontSize: 22, color: 'secondary.main' }} />}
            title="Balance Sheet"
            color="secondary.main"
          />
          {renderChartGrid(balanceSheetCharts)}
        </Box>
      )}

      {cashFlowCharts.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <SectionHeader
            icon={<WalletIcon sx={{ fontSize: 22, color: 'warning.main' }} />}
            title="Cash Flow"
            color="warning.main"
          />
          {renderChartGrid(cashFlowCharts)}
        </Box>
      )}
    </Box>
  );
};

export default FinancialChartsSection;

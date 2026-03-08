import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const formatNumber = (value, unit) => {
  if (value == null || isNaN(value)) return '';
  if (unit === '%') return `${value.toFixed(2)}%`;

  const abs = Math.abs(value);
  let formatted;
  if (abs >= 1e12) formatted = `${(value / 1e12).toFixed(2)}T`;
  else if (abs >= 1e9) formatted = `${(value / 1e9).toFixed(2)}B`;
  else if (abs >= 1e6) formatted = `${(value / 1e6).toFixed(2)}M`;
  else if (abs >= 1e3) formatted = `${(value / 1e3).toFixed(1)}K`;
  else formatted = value.toFixed(2);

  return `${formatted} ${unit}`;
};

const formatAxis = (value, unit) => {
  if (value == null || isNaN(value)) return '';
  if (unit === '%') return `${value.toFixed(1)}%`;

  const abs = Math.abs(value);
  if (abs >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return value.toFixed(0);
};

const BarChart = ({ data, unit }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? '#8b95a5' : '#6b7280';

  const enhancedData = {
    ...data,
    datasets: data.datasets.map(ds => ({
      ...ds,
      borderRadius: 6,
      borderSkipped: false,
      maxBarThickness: 48,
      hoverBackgroundColor: ds.borderColor,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? '#1a2035' : '#ffffff',
        titleColor: isDark ? '#e8eaed' : '#111827',
        bodyColor: isDark ? '#e8eaed' : '#111827',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: { family: '"DM Sans", sans-serif', weight: '600', size: 13 },
        bodyFont: { family: '"JetBrains Mono", monospace', size: 13 },
        displayColors: false,
        callbacks: {
          title: (items) => items[0]?.label || '',
          label: (ctx) => formatNumber(ctx.raw, unit),
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: textColor,
          font: { family: '"DM Sans", sans-serif', size: 11, weight: '500' },
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        grid: {
          color: gridColor,
          drawBorder: false,
        },
        border: { display: false },
        ticks: {
          color: textColor,
          font: { family: '"JetBrains Mono", monospace', size: 11 },
          padding: 8,
          maxTicksLimit: 6,
          callback: (value) => formatAxis(value, unit),
        },
      },
    },
  };

  return (
    <Box sx={{ height: 280, width: '100%' }}>
      <Bar data={enhancedData} options={options} />
    </Box>
  );
};

export default BarChart;

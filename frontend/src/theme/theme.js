import { createTheme } from '@mui/material/styles';

const shared = {
  typography: {
    fontFamily: '"DM Sans", "Helvetica Neue", sans-serif',
    h1: { fontFamily: '"Plus Jakarta Sans", "DM Sans", sans-serif', fontWeight: 800 },
    h2: { fontFamily: '"Plus Jakarta Sans", "DM Sans", sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Plus Jakarta Sans", "DM Sans", sans-serif', fontWeight: 700 },
    h4: { fontFamily: '"Plus Jakarta Sans", "DM Sans", sans-serif', fontWeight: 700 },
    h5: { fontFamily: '"Plus Jakarta Sans", "DM Sans", sans-serif', fontWeight: 600 },
    h6: { fontFamily: '"Plus Jakarta Sans", "DM Sans", sans-serif', fontWeight: 600 },
    button: { fontWeight: 600, letterSpacing: '0.02em' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          padding: '10px 24px',
          fontWeight: 600,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 4px 14px 0 rgba(0,0,0,0.2)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 16,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16 },
      },
    },
  },
};

const darkPalette = {
  mode: 'dark',
  primary: {
    main: '#00d4aa',
    light: '#33ddbb',
    dark: '#00a88a',
    contrastText: '#0a0e1a',
  },
  secondary: {
    main: '#7c5cfc',
    light: '#a78bfa',
    dark: '#5b3fd4',
  },
  background: {
    default: '#0a0e1a',
    paper: '#111827',
  },
  surface: {
    main: '#1a2035',
    light: '#1f2a42',
    dark: '#0d1320',
  },
  success: { main: '#00e676', light: '#33eb91', dark: '#00b35e' },
  error: { main: '#ff5252', light: '#ff7b7b', dark: '#cc4242' },
  warning: { main: '#ffc107', light: '#ffcd38', dark: '#c99700' },
  text: {
    primary: '#e8eaed',
    secondary: '#8b95a5',
    disabled: '#4a5568',
  },
  divider: 'rgba(255,255,255,0.06)',
  gain: '#00e676',
  loss: '#ff5252',
};

const lightPalette = {
  mode: 'light',
  primary: {
    main: '#0d9373',
    light: '#10b98e',
    dark: '#0a7a60',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#6d4aff',
    light: '#a78bfa',
    dark: '#5633e0',
  },
  background: {
    default: '#f0f2f5',
    paper: '#ffffff',
  },
  surface: {
    main: '#f8f9fb',
    light: '#ffffff',
    dark: '#ebedf0',
  },
  success: { main: '#0d9373', light: '#10b98e', dark: '#0a7a60' },
  error: { main: '#dc2626', light: '#ef4444', dark: '#b91c1c' },
  warning: { main: '#d97706', light: '#f59e0b', dark: '#b45309' },
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    disabled: '#9ca3af',
  },
  divider: 'rgba(0,0,0,0.08)',
  gain: '#0d9373',
  loss: '#dc2626',
};

export const getTheme = (mode) =>
  createTheme({
    ...shared,
    palette: mode === 'dark' ? darkPalette : lightPalette,
    components: {
      ...shared.components,
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: mode === 'dark' ? '#0a0e1a' : '#f0f2f5',
            transition: 'background-color 0.3s ease, color 0.3s ease',
          },
          '&::-webkit-scrollbar': {
            width: 8,
          },
          '&::-webkit-scrollbar-track': {
            background: mode === 'dark' ? '#111827' : '#f0f2f5',
          },
          '&::-webkit-scrollbar-thumb': {
            background: mode === 'dark' ? '#2a3550' : '#c4c9d4',
            borderRadius: 4,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? 'rgba(17, 24, 39, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)',
            color: mode === 'dark' ? '#e8eaed' : '#111827',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: mode === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: 16,
            border: mode === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
            '&:hover': {
              borderColor: mode === 'dark' ? 'rgba(0,212,170,0.3)' : 'rgba(13,147,115,0.3)',
              boxShadow: mode === 'dark'
                ? '0 8px 30px rgba(0,0,0,0.4)'
                : '0 8px 30px rgba(0,0,0,0.08)',
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          },
        },
      },
    },
  });

// Keep default export for backward compatibility
const theme = getTheme('dark');
export default theme;

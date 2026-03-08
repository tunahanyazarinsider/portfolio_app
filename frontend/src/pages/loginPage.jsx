import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Link,
  Alert,
  IconButton,
  InputAdornment,
  Fade,
  useTheme
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  TrendingUp,
  LightMode,
  DarkMode
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import authService from '../services/authService';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeMode();

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ username: false, password: false });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(formData.username, formData.password);
      login();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: theme.palette.mode === 'dark'
          ? 'radial-gradient(ellipse at 20% 50%, rgba(0,212,170,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(124,92,252,0.06) 0%, transparent 50%), #0a0e1a'
          : 'radial-gradient(ellipse at 20% 50%, rgba(13,147,115,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(109,74,255,0.04) 0%, transparent 50%), #f0f2f5',
      }}
    >
      {/* Theme toggle */}
      <IconButton
        onClick={toggleTheme}
        sx={{
          position: 'absolute',
          top: 24,
          right: 24,
          color: 'text.secondary',
          border: '1px solid',
          borderColor: 'divider',
          '&:hover': { color: 'primary.main', borderColor: 'primary.main' },
        }}
      >
        {mode === 'dark' ? <LightMode /> : <DarkMode />}
      </IconButton>

      <Container maxWidth="sm">
        <Fade in={true} timeout={600}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 5 },
              borderRadius: '20px',
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(17, 24, 39, 0.8)'
                  : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
              <TrendingUp sx={{ color: 'primary.main', fontSize: 32 }} />
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                Z<Box component="span" sx={{ color: 'primary.main' }}>invest</Box>
              </Typography>
            </Box>

            <Typography
              variant="h4"
              sx={{
                mb: 1,
                textAlign: 'center',
                fontWeight: 800,
                letterSpacing: '-0.02em',
              }}
            >
              Welcome back
            </Typography>
            <Typography
              variant="body2"
              sx={{ mb: 4, textAlign: 'center', color: 'text.secondary' }}
            >
              Sign in to access your portfolio
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={formData.username}
                onChange={handleChange}
                onBlur={() => handleBlur('username')}
                error={touched.username && !formData.username}
                helperText={touched.username && !formData.username ? 'Username is required' : ''}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                onBlur={() => handleBlur('password')}
                error={touched.password && !formData.password}
                helperText={touched.password && !formData.password ? 'Password is required' : ''}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {error && (
                <Fade in={true}>
                  <Alert severity="error" sx={{ mt: 2, borderRadius: '10px' }}>
                    {error}
                  </Alert>
                </Fade>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  fontSize: '0.95rem',
                  position: 'relative',
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      component="span"
                      sx={{
                        width: 18,
                        height: 18,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid #fff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' },
                        },
                      }}
                    />
                    Signing in...
                  </Box>
                ) : (
                  'Sign In'
                )}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link
                  href="/register"
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  Don't have an account? <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>Sign Up</Box>
                </Link>
              </Box>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default LoginPage;

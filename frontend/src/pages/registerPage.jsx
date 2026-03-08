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
  Fade,
  IconButton,
  InputAdornment,
  useTheme
} from '@mui/material';
import { TrendingUp, Visibility, VisibilityOff, LightMode, DarkMode } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import authService from '../services/authService';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeMode();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    try {
      await authService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      const loginResponse = await authService.login(formData.username, formData.password);
      login(loginResponse);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to register');
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
        py: 4,
        background: theme.palette.mode === 'dark'
          ? 'radial-gradient(ellipse at 80% 50%, rgba(0,212,170,0.08) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(124,92,252,0.06) 0%, transparent 50%), #0a0e1a'
          : 'radial-gradient(ellipse at 80% 50%, rgba(13,147,115,0.06) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(109,74,255,0.04) 0%, transparent 50%), #f0f2f5',
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
              sx={{ mb: 1, textAlign: 'center', fontWeight: 800, letterSpacing: '-0.02em' }}
            >
              Create Account
            </Typography>
            <Typography
              variant="body2"
              sx={{ mb: 4, textAlign: 'center', color: 'text.secondary' }}
            >
              Start managing your portfolio today
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
              {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>
                  {error}
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </Box>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="password"
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="confirmPassword"
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '0.95rem' }}
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Link
                  href="/login"
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    textDecoration: 'none',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  Already have an account? <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>Sign In</Box>
                </Link>
              </Box>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default RegisterPage;

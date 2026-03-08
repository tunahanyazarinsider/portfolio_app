import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PortfolioCard from '../components/PortfolioCard';
import portfolioService from '../services/portfolioService';
import authService from '../services/authService';

const CreatePortfolioDialog = ({ open, onClose, onCreatePortfolio }) => {
  const [portfolioName, setPortfolioName] = useState('');

  const handleCreate = () => {
    if (portfolioName.trim()) {
      onCreatePortfolio(portfolioName);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Create New Portfolio</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Portfolio Name"
          fullWidth
          variant="outlined"
          value={portfolioName}
          onChange={(e) => setPortfolioName(e.target.value)}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={handleCreate} variant="contained" disabled={!portfolioName.trim()}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const PortfoliosPage = () => {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const data = await portfolioService.getUserPortfolios(user.user_id);
        setPortfolios(data);
      } catch (err) {
        setError('Failed to load portfolios.');
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolios();
  }, []);

  const handleCreatePortfolio = async (portfolioName) => {
    try {
      const username = authService.getUsernameFromToken();
      const user = await authService.getUserInformationByUsername(username);
      await portfolioService.createPortfolio(user.user_id, portfolioName);
      setSnackbar({ open: true, message: 'Portfolio created successfully!', severity: 'success' });
      const data = await portfolioService.getUserPortfolios(user.user_id);
      setPortfolios(data);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to create portfolio.', severity: 'error' });
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress sx={{ color: 'primary.main' }} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error" sx={{ borderRadius: '10px' }}>{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, pb: { xs: 10, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
          My Portfolios
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Create Portfolio
        </Button>
      </Box>

      {portfolios.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            You haven't created any portfolios yet
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Create Your First Portfolio
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {portfolios.map((portfolio) => (
            <Grid item key={portfolio.portfolio_id} xs={12} sm={6} md={4}>
              <PortfolioCard portfolio={portfolio} />
            </Grid>
          ))}
        </Grid>
      )}

      <CreatePortfolioDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreatePortfolio={handleCreatePortfolio}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: '10px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PortfoliosPage;

import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Grid, 
  CircularProgress, 
  Typography, 
  TextField, 
  Button 
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';

import stockService from '../services/stockService';
import SectorCard from '../components/SectorCard';
// theme
import { useTheme } from '@mui/material/styles';

const AllSectorsPage = () => {
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  // theme
  const theme = useTheme();

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const data = await stockService.getAllSectors();
        /*
          data is sth like: we just use sector_id
          [
            {
              "sector_id": 2,
              "name": "Airlines"
            },
            {
              "sector_id": 7,
              "name": "Banks - Regional"
            },
            {
              "sector_id": 3,
              "name": "Asset Management"
            },
          ]
        */
        setSectors(data);
      } catch (err) {
        console.error('Error fetching sectors:', err);
        setError('Failed to load sectors. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSectors();
  }, []);

  if (loading) {
    return (
      <Container 
        sx={{
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '80vh',
          textAlign: 'center'
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ marginTop: 2, color: 'text.secondary' }}>
          Loading Sectors...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container 
        sx={{
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '80vh',
          textAlign: 'center'
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 80, color: 'error.main', marginBottom: 2 }} />
        <Typography variant="h6" color="error">
          {error}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          sx={{ marginTop: 2 }}
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </Container>
    );
  }

  const filteredSectors = sectors.filter(sector => 
    sector.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container 
      sx={{
        backgroundColor: '#f4f6f9',
        minHeight: '100vh',
        paddingY: 4,
        borderRadius: 2
      }}
    >
      <Typography 
        variant="h3" 
        sx={{ 
            fontWeight: 800,
            textAlign: 'center',
            letterSpacing: '-0.02em',
        }}
      >
        Explore Market Sectors
      </Typography>
      {/* Text field to say what this page offers for user */}
      <Typography
        variant="body1"
        sx={{ 
          p: 3, 
          pt: 0, 
          fontWeight: 'bold',
          color: 'text.secondary'
      }}
      >
        Explore different market sectors to find out which sectors are performing well and which are not. Click to view more details about each sector.
      </Typography>

      <TextField
        fullWidth
        variant="outlined"
        label="Search Sectors"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ marginBottom: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          )
        }}
      />

      <Grid container spacing={4} justifyContent="center">
        {filteredSectors.map((sector) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={sector.sector_id}>
            <SectorCard sectorId={sector.sector_id} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default AllSectorsPage;
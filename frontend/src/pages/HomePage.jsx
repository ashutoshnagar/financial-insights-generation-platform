import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent,
  Container,
  Grid,
  Chip
} from '@mui/material';
import { 
  ShowChart as ShowChartIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Grid Layout for Cards */}
      <Grid container spacing={3}>
        {/* Yield Analysis Card - Top Left Position */}
        <Grid item xs={12} sm={6} md={4}>
          <Card 
            sx={{ 
              height: '100%',
              minHeight: '220px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #F0F7FF 100%)',
              border: '2px solid',
              borderColor: 'transparent',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 32px rgba(0, 61, 165, 0.15)',
                borderColor: '#FF6B35',
                background: 'linear-gradient(135deg, #FFFFFF 0%, #E6F2FF 100%)',
              }
            }}
            onClick={() => navigate('/analysis')}
          >
            <CardContent sx={{ p: 2.5 }}>
              {/* Icon and Badge */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 2 
              }}>
                <Box sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #003DA5 0%, #0066CC 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShowChartIcon 
                    sx={{ 
                      fontSize: 28, 
                      color: 'white'
                    }} 
                  />
                </Box>
                <Chip 
                  label="ACTIVE" 
                  size="small" 
                  sx={{ 
                    fontSize: '0.7rem', 
                    height: 22,
                    backgroundColor: '#00A651',
                    color: 'white',
                    fontWeight: 600
                  }}
                />
              </Box>

              {/* Title */}
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 0.5,
                  fontWeight: 700,
                  color: '#003DA5'
                }}
              >
                Yield Analysis
              </Typography>

              {/* Subtitle */}
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 2.5,
                  color: '#6C757D',
                  fontSize: '0.875rem'
                }}
              >
                Previous vs Current Month
              </Typography>

              {/* Action Button */}
              <Button
                variant="contained"
                size="small"
                endIcon={<ArrowForwardIcon />}
                sx={{ 
                  fontWeight: 600,
                  background: '#FF6B35',
                  color: 'white',
                  '&:hover': {
                    background: '#E55100',
                  },
                  borderRadius: '8px',
                  px: 2
                }}
              >
                Start Analysis
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Empty Grid Slots for Future Cards */}
        {/* You can add more cards here in the same pattern */}
        {/* Example placeholder for future cards: */}
        {[...Array(5)].map((_, index) => (
          <Grid key={index} item xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                height: '100%',
                minHeight: '220px',
                border: '2px dashed',
                borderColor: '#D1D5DB',
                bgcolor: '#FAFBFC',
                opacity: 0.4
              }}
            >
              <CardContent sx={{ 
                p: 2.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                minHeight: '180px'
              }}>
                <Box sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  backgroundColor: '#E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2
                }}>
                  <Typography variant="h6" color="text.disabled">
                    +
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.disabled">
                  Coming Soon
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default HomePage;

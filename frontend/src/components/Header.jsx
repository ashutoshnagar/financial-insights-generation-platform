import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Box,
  Chip 
} from '@mui/material';
import { 
  Home as HomeIcon,
  Insights as InsightsIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{ 
        backgroundColor: '#003DA5',
        color: 'white',
        borderBottom: '2px solid #FF6B35'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', py: 0.5 }}>
        {/* Logo and Title - Compact Single Line */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer' 
          }}
          onClick={() => navigate('/')}
        >
          <InsightsIcon 
            sx={{ 
              fontSize: 32, 
              color: '#FF6B35', 
              mr: 2 
            }} 
          />
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography 
              variant="h6" 
              component="h1" 
              sx={{ 
                fontWeight: 700, 
                color: 'white'
              }}
            >
              Financial Insights Platform
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#B8D4F1',
                fontWeight: 400
              }}
            >
              | Advanced Portfolio Analytics
            </Typography>
          </Box>
        </Box>

        {/* Simplified Navigation - Only Home */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {location.pathname !== '/' && (
            <IconButton
              onClick={() => navigate('/')}
              sx={{ 
                color: 'white',
                border: '2px solid white',
                '&:hover': {
                  backgroundColor: '#FF6B35',
                  borderColor: '#FF6B35'
                }
              }}
            >
              <HomeIcon />
            </IconButton>
          )}

          {/* Status Indicator */}
          <Chip 
            label="Enterprise" 
            size="small" 
            sx={{ 
              ml: 1,
              fontWeight: 600,
              backgroundColor: '#FF6B35',
              color: 'white'
            }} 
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

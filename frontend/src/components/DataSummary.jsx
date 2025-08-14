import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Timeline as TimelineIcon,
  DataUsage as DataIcon
} from '@mui/icons-material';
import { formatNumber, formatBasisPoints, formatROIChange, formatIndianCurrency } from '../utils/helpers';

const DataSummary = ({ data }) => {
  if (!data || !data.summary) {
    return (
      <Alert severity="info">
        No summary data available
      </Alert>
    );
  }

  const { summary, distinctValues, availableColumns, cleaningStats } = data;
  const roiChangeFormatted = formatROIChange(summary.change?.roiChangeBps || 0);

  const summaryCards = [
    {
      title: 'Previous Month',
      value: formatNumber(summary.previousMonth?.recordCount || 0),
      subtitle: `Records`,
      secondaryValue: `Total: ${formatIndianCurrency(summary.previousMonth?.totalAmount || 0)}`,
      icon: <DataIcon sx={{ fontSize: 40, color: 'primary.main' }} />
    },
    {
      title: 'Current Month',
      value: formatNumber(summary.currentMonth?.recordCount || 0),
      subtitle: `Records`,
      secondaryValue: `Total: ${formatIndianCurrency(summary.currentMonth?.totalAmount || 0)}`,
      icon: <DataIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
    },
    {
      title: 'ROI Change',
      value: roiChangeFormatted.value,
      subtitle: roiChangeFormatted.isPositive ? 'ROI Increased' : roiChangeFormatted.isNegative ? 'ROI Decreased' : 'No Change',
      secondaryValue: '', // Removed confusing secondary text
      icon: roiChangeFormatted.isPositive ? 
        <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} /> :
        <TrendingDownIcon sx={{ fontSize: 40, color: 'error.main' }} />,
      valueColor: roiChangeFormatted.color
    },
    {
      title: 'Available Factors',
      value: availableColumns?.length || 0,
      subtitle: 'Analysis Factors',
      secondaryValue: `${Object.keys(distinctValues || {}).length} categorical`,
      icon: <TimelineIcon sx={{ fontSize: 40, color: 'info.main' }} />
    }
  ];

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        Data Summary
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {summaryCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                background: index === 2 ? 
                  'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(25, 118, 210, 0.05) 100%)' :
                  'white'
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ mb: 2 }}>
                  {card.icon}
                </Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700, 
                    mb: 1,
                    color: card.valueColor || 'text.primary'
                  }}
                >
                  {card.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {card.subtitle}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {card.secondaryValue}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Data Quality Summary */}
      {cleaningStats && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Data Quality Summary
            </Typography>
            
            <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'grey.50' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell align="right"><strong>Previous Month</strong></TableCell>
                    <TableCell align="right"><strong>Current Month</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Original Records</TableCell>
                    <TableCell align="right">
                      {formatNumber(cleaningStats.previous?.originalCount || 0)}
                    </TableCell>
                    <TableCell align="right">
                      {formatNumber(cleaningStats.current?.originalCount || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Empty Cells Removed</TableCell>
                    <TableCell align="right">
                      {formatNumber(cleaningStats.previous?.removedCount || 0)}
                    </TableCell>
                    <TableCell align="right">
                      {formatNumber(cleaningStats.current?.removedCount || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Values Standardized</TableCell>
                    <TableCell align="right">
                      {formatNumber(cleaningStats.previous?.standardizedCount || 0)}
                    </TableCell>
                    <TableCell align="right">
                      {formatNumber(cleaningStats.current?.standardizedCount || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Clean Records</strong></TableCell>
                    <TableCell align="right">
                      <strong>{formatNumber(cleaningStats.previous?.cleanCount || 0)}</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>{formatNumber(cleaningStats.current?.cleanCount || 0)}</strong>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Data Quality Score</strong></TableCell>
                    <TableCell align="right">
                      <strong style={{ color: '#4caf50' }}>{cleaningStats.previous?.qualityScore || '100'}%</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong style={{ color: '#4caf50' }}>{cleaningStats.current?.qualityScore || '100'}%</strong>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Detailed Metrics */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            ROI Analysis Metrics
          </Typography>
          
          <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'grey.50' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Metric</strong></TableCell>
                  <TableCell align="right"><strong>Previous Month</strong></TableCell>
                  <TableCell align="right"><strong>Current Month</strong></TableCell>
                  <TableCell align="right"><strong>Change</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Record Count</TableCell>
                  <TableCell align="right">
                    {formatNumber(summary.previousMonth?.recordCount || 0)}
                  </TableCell>
                  <TableCell align="right">
                    {formatNumber(summary.currentMonth?.recordCount || 0)}
                  </TableCell>
                  <TableCell align="right">
                    {formatNumber((summary.currentMonth?.recordCount || 0) - (summary.previousMonth?.recordCount || 0))}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Total Loan Amount</TableCell>
                  <TableCell align="right">
                    {formatIndianCurrency(summary.previousMonth?.totalAmount || 0)}
                  </TableCell>
                  <TableCell align="right">
                    {formatIndianCurrency(summary.currentMonth?.totalAmount || 0)}
                  </TableCell>
                  <TableCell align="right">
                    {formatIndianCurrency((summary.currentMonth?.totalAmount || 0) - (summary.previousMonth?.totalAmount || 0))}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Weighted ROI</strong></TableCell>
                  <TableCell align="right">
                    <strong>{(summary.previousMonth?.weightedROI || 0).toFixed(4)}%</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>{(summary.currentMonth?.weightedROI || 0).toFixed(4)}%</strong>
                  </TableCell>
                  <TableCell align="right">
                    <Box 
                      component="strong" 
                      sx={{ color: roiChangeFormatted.color }}
                    >
                      {roiChangeFormatted.value}
                    </Box>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Available Factors */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Available Analysis Factors
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {availableColumns?.map((column) => (
              <Chip 
                key={column}
                label={column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                variant="outlined"
                color="primary"
              />
            ))}
          </Box>

          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Distinct Values by Factor:
          </Typography>

          <Grid container spacing={2}>
            {Object.entries(distinctValues || {}).map(([factor, values]) => (
              <Grid item xs={12} sm={6} md={4} key={factor}>
                <Box 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'grey.50', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    {factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    {values.length} distinct values
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {values.slice(0, 3).map((value) => (
                      <Chip 
                        key={value}
                        label={value}
                        size="small"
                        variant="filled"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    ))}
                    {values.length > 3 && (
                      <Chip 
                        label={`+${values.length - 3} more`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DataSummary;

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  Description as DocIcon,
  TableChart as TableIcon,
  Image as ImageIcon,
  Assessment as ReportIcon,
  Download as ExportIcon
} from '@mui/icons-material';
import { useMutation } from 'react-query';
import toast from 'react-hot-toast';
import * as api from '../utils/api';
import { downloadBlob } from '../utils/helpers';

const ExportOptions = ({ sessionId, analysisResults }) => {
  const [exportFormat, setExportFormat] = useState('excel');
  const [exportType, setExportType] = useState('individual'); // individual or comprehensive

  // Export mutation
  const exportMutation = useMutation(api.exportAnalysis, {
    onSuccess: async (data) => {
      try {
        // Download the exported file
        const blob = await api.downloadFile(data.data.exportId);
        downloadBlob(blob, data.data.filename);
        toast.success('Export completed successfully!');
      } catch (error) {
        toast.error('Failed to download exported file');
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Export failed');
    }
  });

  // Generate comprehensive report mutation
  const reportMutation = useMutation(api.generateReport, {
    onSuccess: async (data) => {
      try {
        const blob = await api.downloadFile(data.data.exportId);
        downloadBlob(blob, data.data.filename);
        toast.success('Comprehensive report generated successfully!');
      } catch (error) {
        toast.error('Failed to download report');
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Report generation failed');
    }
  });

  const handleExportAnalysis = (analysisKey) => {
    if (!sessionId || !analysisResults[analysisKey]) {
      toast.error('No analysis data available for export');
      return;
    }

    const analysisData = analysisResults[analysisKey];
    
    exportMutation.mutate({
      sessionId,
      analysisId: `${analysisKey}-${Date.now()}`,
      format: exportFormat,
      analysisData: analysisData,
      tableData: analysisData.tableData,
      metadata: analysisData.metadata
    });
  };

  const handleGenerateComprehensiveReport = () => {
    if (!sessionId || Object.keys(analysisResults).length === 0) {
      toast.error('No analysis results available for report generation');
      return;
    }

    const analyses = Object.values(analysisResults).map(result => ({
      ...result,
      timestamp: new Date().toISOString()
    }));

    reportMutation.mutate({
      sessionId,
      analyses,
      format: exportFormat,
      includeCharts: true,
      includeComparison: true
    });
  };

  const exportOptions = [
    {
      format: 'excel',
      label: 'Excel Workbook',
      description: 'Multi-sheet Excel file with summary, tree data, and analysis details',
      icon: <TableIcon />,
      recommended: true
    },
    {
      format: 'csv',
      label: 'CSV File',
      description: 'Comma-separated values file with tabular analysis data',
      icon: <DocIcon />
    },
    {
      format: 'json',
      label: 'JSON Data',
      description: 'Machine-readable JSON format for further processing',
      icon: <ExportIcon />
    }
  ];

  const availableAnalyses = Object.keys(analysisResults).map(key => ({
    key,
    title: key === 'variant1' ? 'User-Priority Analysis' : 'Auto-Max Split Analysis',
    data: analysisResults[key]
  }));

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        Export Analysis Results
      </Typography>

      {Object.keys(analysisResults).length === 0 ? (
        <Alert severity="info">
          <Typography variant="body2">
            No analysis results available. Please run an analysis first to enable export options.
          </Typography>
        </Alert>
      ) : (
        <>
          {/* Export Format Selection */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Export Format
              </Typography>
              
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Select Export Format</InputLabel>
                <Select
                  value={exportFormat}
                  label="Select Export Format"
                  onChange={(e) => setExportFormat(e.target.value)}
                >
                  {exportOptions.map((option) => (
                    <MenuItem key={option.format} value={option.format}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {option.icon}
                        <Box>
                          <Typography variant="body2">
                            {option.label}
                            {option.recommended && (
                              <Chip 
                                label="Recommended" 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                                sx={{ ml: 1, height: 20 }}
                              />
                            )}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>{exportOptions.find(opt => opt.format === exportFormat)?.label}:</strong>{' '}
                  {exportOptions.find(opt => opt.format === exportFormat)?.description}
                </Typography>
              </Alert>
            </CardContent>
          </Card>

          {/* Individual Analysis Exports */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Export Individual Analyses
              </Typography>
              
              <List>
                {availableAnalyses.map((analysis) => (
                  <ListItem 
                    key={analysis.key}
                    sx={{ 
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: 'background.paper'
                    }}
                  >
                    <ListItemIcon>
                      <ReportIcon color="primary" />
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={analysis.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {analysis.data.metadata?.totalNodes || 0} nodes • 
                            {analysis.data.metadata?.maxDepth || 0} levels • 
                            Generated {new Date().toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                    
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleExportAnalysis(analysis.key)}
                      disabled={exportMutation.isLoading}
                    >
                      Export
                    </Button>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Comprehensive Report */}
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Comprehensive Report
              </Typography>
              
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Professional Report:</strong> Generate a complete analysis report including all variants, 
                  comparisons, visualizations, and executive summary.
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                <Chip 
                  icon={<TableIcon />} 
                  label="Analysis Summary" 
                  variant="outlined" 
                />
                <Chip 
                  icon={<ImageIcon />} 
                  label="Decision Trees" 
                  variant="outlined" 
                />
                <Chip 
                  icon={<ReportIcon />} 
                  label="Key Insights" 
                  variant="outlined" 
                />
                <Chip 
                  icon={<ExportIcon />} 
                  label="Detailed Data" 
                  variant="outlined" 
                />
              </Box>

              <Button
                variant="contained"
                size="large"
                startIcon={<ReportIcon />}
                onClick={handleGenerateComprehensiveReport}
                disabled={reportMutation.isLoading}
                fullWidth
                sx={{ py: 1.5 }}
              >
                {reportMutation.isLoading ? 'Generating Report...' : 'Generate Comprehensive Report'}
              </Button>
            </CardContent>
          </Card>

          {/* Loading Progress */}
          {(exportMutation.isLoading || reportMutation.isLoading) && (
            <Box sx={{ mt: 3 }}>
              <LinearProgress />
              <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
                {exportMutation.isLoading && 'Preparing export file...'}
                {reportMutation.isLoading && 'Generating comprehensive report...'}
              </Typography>
            </Box>
          )}

          {/* Export Tips */}
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Export Tips:
            </Typography>
            <Typography variant="body2">
              • <strong>Excel:</strong> Best for business presentations and further analysis
            </Typography>
            <Typography variant="body2">
              • <strong>CSV:</strong> For importing into other analysis tools
            </Typography>
            <Typography variant="body2">
              • <strong>JSON:</strong> For developers and API integrations
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              All exports include complete analysis data, decision tree structure, and metadata.
            </Typography>
          </Alert>
        </>
      )}
    </Box>
  );
};

export default ExportOptions;

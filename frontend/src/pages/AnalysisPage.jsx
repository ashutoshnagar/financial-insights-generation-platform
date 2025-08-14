import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  Chip,
  LinearProgress,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Upload as UploadIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  GetApp as ExportIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
  PlayArrow as PlayIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { useQuery, useMutation } from 'react-query';
import toast from 'react-hot-toast';

// Components
import FileUpload from '../components/FileUpload';
import DataSummary from '../components/DataSummary';
import FactorOrdering from '../components/FactorOrdering';
import AnalysisVariants from '../components/AnalysisVariants';
import ExportOptions from '../components/ExportOptions';

// API Services
import * as api from '../utils/api';

const steps = [
  { 
    key: 'upload', 
    title: 'Upload Data', 
    subtitle: 'Import your portfolio files',
    icon: UploadIcon 
  },
  { 
    key: 'configure', 
    title: 'Configure', 
    subtitle: 'Set analysis factors',
    icon: SettingsIcon 
  },
  { 
    key: 'analyze', 
    title: 'Analyze', 
    subtitle: 'Generate insights',
    icon: AnalyticsIcon 
  }
  // Export step temporarily disabled
];

const AnalysisPage = () => {
  const [activeStep, setActiveStep] = useState(() => {
    const saved = localStorage.getItem('roi-analysis-step');
    return saved ? parseInt(saved) : 0;
  });
  const [sessionData, setSessionData] = useState(() => {
    const saved = localStorage.getItem('roi-analysis-session');
    return saved ? JSON.parse(saved) : null;
  });
  const [analysisResults, setAnalysisResults] = useState(() => {
    const saved = localStorage.getItem('roi-analysis-results');
    return saved ? JSON.parse(saved) : {};
  });
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [factorOrder, setFactorOrder] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('roi-analysis-step', activeStep.toString());
  }, [activeStep]);

  useEffect(() => {
    if (sessionData) {
      localStorage.setItem('roi-analysis-session', JSON.stringify(sessionData));
    }
  }, [sessionData]);

  useEffect(() => {
    if (Object.keys(analysisResults).length > 0) {
      localStorage.setItem('roi-analysis-results', JSON.stringify(analysisResults));
    }
  }, [analysisResults]);

  useEffect(() => {
    if (factorOrder.length > 0) {
      localStorage.setItem('roi-analysis-factors', JSON.stringify(factorOrder));
    }
  }, [factorOrder]);

  // File upload mutation
  const uploadMutation = useMutation(api.uploadFiles, {
    onSuccess: (data) => {
      console.log('🔍 AnalysisPage Upload Success - Full Response:', data);
      console.log('📊 AnalysisPage Upload Success - Data Structure:', {
        hasData: !!data.data,
        availableColumns: data.data?.availableColumns,
        availableColumnsLength: data.data?.availableColumns?.length,
        distinctValues: data.data?.distinctValues,
        distinctValuesKeys: Object.keys(data.data?.distinctValues || {}),
        sessionId: data.sessionId
      });
      // Include sessionId in the stored data
      const dataWithSessionId = {
        ...data.data,
        sessionId: data.sessionId
      };
      setSessionData(dataWithSessionId);
      
      // Reset factor order to empty when new data is uploaded
      setFactorOrder([]);
      localStorage.removeItem('roi-analysis-factors');
      
      setActiveStep(1);
      toast.success('Files uploaded successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Upload failed');
    }
  });

  // Analysis mutations
  const variant1Mutation = useMutation(api.runVariant1Analysis, {
    onSuccess: (data) => {
      setAnalysisResults(prev => ({ ...prev, variant1: data.data }));
      toast.success('User-Priority analysis completed!');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Analysis failed';
      if (errorMessage.includes('Please upload data first') || errorMessage.includes('Invalid session')) {
        handleSessionExpired();
      } else {
        toast.error(errorMessage);
      }
    }
  });

  const variant2Mutation = useMutation(api.runVariant2Analysis, {
    onSuccess: (data) => {
      setAnalysisResults(prev => ({ ...prev, variant2: data.data }));
      toast.success('Auto-Max Split analysis completed!');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Analysis failed';
      if (errorMessage.includes('Please upload data first') || errorMessage.includes('Invalid session')) {
        handleSessionExpired();
      } else {
        toast.error(errorMessage);
      }
    }
  });

  const handleFileUpload = (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    uploadMutation.mutate(formData);
  };

  const handleSessionExpired = () => {
    toast.error('Session expired. Please re-upload your data.');
    setActiveStep(0);
    setSessionData(null);
    setFactorOrder([]);
    setAnalysisResults({});
    
    // Clear localStorage
    localStorage.removeItem('roi-analysis-session');
    localStorage.removeItem('roi-analysis-factors');
    localStorage.removeItem('roi-analysis-results');
  };

  const handleVariant1Analysis = (factorOrder, targetVariable) => {
    if (!sessionData?.sessionId) {
      toast.error('Please upload data first');
      return;
    }

    variant1Mutation.mutate({
      sessionId: sessionData.sessionId,
      factorOrder,
      targetVariable
    });
  };

  const handleVariant2Analysis = (targetVariable, availableFactors) => {
    if (!sessionData?.sessionId) {
      toast.error('Please upload data first');
      return;
    }

    variant2Mutation.mutate({
      sessionId: sessionData.sessionId,
      targetVariable,
      availableFactors: availableFactors || factorOrder
    });
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setSessionData(null);
    setAnalysisResults({});
    setFactorOrder([]);
    
    // Clear localStorage
    localStorage.removeItem('roi-analysis-step');
    localStorage.removeItem('roi-analysis-session');
    localStorage.removeItem('roi-analysis-results');
    localStorage.removeItem('roi-analysis-factors');
    
    toast.success('Analysis session reset successfully');
  };

  const renderTopRightActions = () => {
    switch (activeStep) {
      case 0:
        return (
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            disabled={!sessionData || uploadMutation.isLoading}
            onClick={() => sessionData && setActiveStep(1)}
          >
            {uploadMutation.isLoading ? 'Processing...' : 'Continue'}
          </Button>
        );
      case 1:
        return (
          <Button
            variant="contained"
            startIcon={<SettingsIcon />}
            disabled={!sessionData || factorOrder.length === 0}
            onClick={handleNext}
          >
            Start Analysis
          </Button>
        );
      case 2:
        return (
          <Button
            variant="outlined"
            startIcon={<UncheckedIcon />}
            onClick={handleReset}
          >
            Reset Analysis
          </Button>
        );
      default:
        return null;
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Card>
            <CardContent sx={{ p: 2 }}>
              <FileUpload
                onUpload={handleFileUpload}
                loading={uploadMutation.isLoading}
              />

              {sessionData && (
                <Box sx={{ mt: 2 }}>
                  <DataSummary data={sessionData} />
                </Box>
              )}
            </CardContent>
          </Card>
        );

      case 1:
        return (
          <Card>
            <CardContent sx={{ p: 2 }}>
              {sessionData && (
                <FactorOrdering
                  availableFactors={sessionData?.availableColumns || []}
                  distinctValues={sessionData?.distinctValues || {}}
                  factorOrder={factorOrder}
                  onFactorOrderChange={setFactorOrder}
                />
              )}
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardContent sx={{ p: 2 }}>
              <AnalysisVariants
                onVariant1Analysis={handleVariant1Analysis}
                onVariant2Analysis={handleVariant2Analysis}
                variant1Loading={variant1Mutation.isLoading}
                variant2Loading={variant2Mutation.isLoading}
                analysisResults={analysisResults}
                availableFactors={sessionData?.availableColumns || []}
                factorOrder={factorOrder}
              />
            </CardContent>
          </Card>
        );

      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 80px)', backgroundColor: '#f8fafc' }}>
      {/* Collapsible Sidebar - Auto-collapsed for analysis */}
      <Paper 
        elevation={0} 
        sx={{ 
          width: sidebarCollapsed ? 60 : 240,
          backgroundColor: 'white',
          borderRight: '1px solid #e2e8f0',
          p: sidebarCollapsed ? 1 : 2,
          position: 'sticky',
          top: 80,
          height: 'fit-content',
          transition: 'all 0.3s ease',
          overflow: 'hidden'
        }}
      >
        {/* Sidebar Header with Toggle */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          {!sidebarCollapsed && (
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Workflow
            </Typography>
          )}
          <Tooltip title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
            <IconButton 
              size="small" 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              sx={{ ml: sidebarCollapsed ? 0 : 'auto' }}
            >
              {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Vertical Progress Steps */}
        <Box>
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = activeStep === index;
            const isCompleted = activeStep > index;
            const isAvailable = 
              index === 0 || 
              (index === 1 && sessionData) ||
              (index === 2 && sessionData && factorOrder.length > 0) ||
              (index === 3 && Object.keys(analysisResults).length > 0);

            return (
              <Box key={step.key} sx={{ position: 'relative', mb: sidebarCollapsed ? 1 : 2.5 }}>
                {/* Connector Line - only show when expanded */}
                {!sidebarCollapsed && index < steps.length - 1 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: '17px',
                      top: '36px',
                      width: '2px',
                      height: '32px',
                      backgroundColor: isCompleted ? 'primary.main' : '#e2e8f0'
                    }}
                  />
                )}

                {/* Step Container */}
                <Tooltip title={sidebarCollapsed ? `${step.title}: ${step.subtitle}` : ""} placement="right">
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      p: sidebarCollapsed ? 0.5 : 1.5,
                      borderRadius: 2,
                      backgroundColor: isActive ? '#f0f9ff' : 'transparent',
                      border: isActive ? '1px solid #0ea5e9' : '1px solid transparent',
                      cursor: isAvailable ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                      justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                      '&:hover': isAvailable ? {
                        backgroundColor: isActive ? '#f0f9ff' : '#f8fafc'
                      } : {}
                    }}
                    onClick={() => isAvailable && setActiveStep(index)}
                  >
                    {/* Step Icon */}
                    <Box
                      sx={{
                        width: sidebarCollapsed ? 32 : 36,
                        height: sidebarCollapsed ? 32 : 36,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 
                          isCompleted ? 'success.main' : 
                          isActive ? 'primary.main' : 
                          isAvailable ? '#e2e8f0' : '#f1f5f9',
                        color: 
                          isCompleted ? 'white' : 
                          isActive ? 'white' : 
                          isAvailable ? 'text.secondary' : '#94a3b8',
                        mr: sidebarCollapsed ? 0 : 1.5,
                        flexShrink: 0
                      }}
                    >
                      {isCompleted ? <CheckIcon fontSize="small" /> : <Icon fontSize="small" />}
                    </Box>

                    {/* Step Details - only show when expanded */}
                    {!sidebarCollapsed && (
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            color: isActive ? 'primary.main' : isAvailable ? 'text.primary' : 'text.disabled'
                          }}
                        >
                          {step.title}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: isActive ? 'primary.main' : 'text.secondary',
                            display: 'block',
                            lineHeight: 1.2
                          }}
                        >
                          {step.subtitle}
                        </Typography>
                      </Box>
                    )}

                    {/* Status Indicator - only show when expanded */}
                    {!sidebarCollapsed && (
                      <>
                        {isCompleted && (
                          <CheckIcon sx={{ color: 'success.main', fontSize: 16 }} />
                        )}
                        {isActive && (
                          <PlayIcon sx={{ color: 'primary.main', fontSize: 16 }} />
                        )}
                      </>
                    )}
                  </Box>
                </Tooltip>
              </Box>
            );
          })}
        </Box>

        {/* Quick Actions - only show when expanded */}
        {!sidebarCollapsed && (
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e2e8f0' }}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={handleReset}
              startIcon={<UncheckedIcon />}
              sx={{ mb: 1.5, fontSize: '0.75rem' }}
            >
              Reset
            </Button>
            
            {sessionData && (
              <Chip 
                label={`${sessionData.sessionId.slice(0, 6)}...`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 24 }}
              />
            )}
          </Box>
        )}

        {/* Collapsed Quick Actions */}
        {sidebarCollapsed && (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Reset Analysis" placement="right">
              <IconButton size="small" onClick={handleReset}>
                <UncheckedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {sessionData && (
              <Tooltip title={`Session: ${sessionData.sessionId}`} placement="right">
                <Box 
                  sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: 'primary.main',
                    opacity: 0.8
                  }} 
                />
              </Tooltip>
            )}
          </Box>
        )}
      </Paper>

      {/* Main Content Area - Uses maximum available width */}
      <Box sx={{ flex: 1, p: 0, overflow: 'auto' }}>
        {/* Header with CTA and Sidebar Toggle */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, px: 2, pt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Mobile Sidebar Toggle */}
            <Tooltip title="Toggle Sidebar">
              <IconButton 
                size="small" 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                sx={{ 
                  display: { xs: 'flex', md: 'none' },
                  bgcolor: 'rgba(255,255,255,0.8)',
                  border: '1px solid #e2e8f0'
                }}
              >
                <MenuIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {steps[activeStep].title}
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                | {steps[activeStep].subtitle}
              </Typography>
            </Box>
          </Box>
          
          {/* Top Right CTA Area */}
          <Box sx={{ display: 'flex', gap: 2, minWidth: 'fit-content' }}>
            {/* Auto-collapse button for analysis step */}
            {activeStep === 2 && !sidebarCollapsed && (
              <Tooltip title="Maximize visualization space">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ChevronLeftIcon />}
                  onClick={() => setSidebarCollapsed(true)}
                  sx={{ fontSize: '0.75rem' }}
                >
                  Maximize
                </Button>
              </Tooltip>
            )}
            
            {renderTopRightActions()}
          </Box>
        </Box>

        {/* Step Content - Uses full available width */}
        <Box sx={{ width: '100%' }}>
          {renderStepContent(activeStep)}
        </Box>
      </Box>

      {/* Loading Overlay */}
      {(uploadMutation.isLoading || variant1Mutation.isLoading || variant2Mutation.isLoading) && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <LinearProgress sx={{ mb: 3, width: 200 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              {uploadMutation.isLoading && 'Processing Files...'}
              {variant1Mutation.isLoading && 'Running Analysis...'}
              {variant2Mutation.isLoading && 'Running Analysis...'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {uploadMutation.isLoading && 'Uploading and validating your data'}
              {variant1Mutation.isLoading && 'User-Priority analysis in progress'}
              {variant2Mutation.isLoading && 'Auto-Max Split analysis in progress'}
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default AnalysisPage;

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  FormControlLabel,
  Switch,
  Tooltip
} from '@mui/material';
import {
  Person as PersonIcon,
  SmartToy as AIIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import DecisionTreeVisualizationV2 from './DecisionTreeVisualizationV2';
import { formatROIChange, formatNumber, snakeToTitle } from '../utils/helpers';

const AnalysisVariants = ({
  onVariant1Analysis,
  onVariant2Analysis,
  variant1Loading,
  variant2Loading,
  analysisResults,
  availableFactors = [],
  factorOrder = []
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [fullScreenTree, setFullScreenTree] = useState(false);
  const [variant1Config, setVariant1Config] = useState({
    factorOrder: factorOrder,
    targetVariable: 'roi'
  });

  // Update variant1Config when factorOrder changes
  useEffect(() => {
    setVariant1Config(prev => ({
      ...prev,
      factorOrder: factorOrder
    }));
  }, [factorOrder]);

  const [variant2Config, setVariant2Config] = useState({
    targetVariable: 'roi'
  });

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleVariant1Run = () => {
    onVariant1Analysis(variant1Config.factorOrder, variant1Config.targetVariable);
  };

  const handleVariant2Run = () => {
    onVariant2Analysis(variant2Config.targetVariable, factorOrder);
  };

  const renderAnalysisResults = (results, analysisType) => {
    if (!results) return null;

    const { tree, metadata, insights, tableData } = results;

    return (
      <Box sx={{ mt: 3 }}>
        {/* Decision Tree Visualization - Moved to top for prominence */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Decision Tree Visualization
          </Typography>
          
          <DecisionTreeVisualizationV2 
            treeData={tree} 
            analysisType={analysisType}
            fullScreen={fullScreenTree}
            onFullScreenToggle={() => setFullScreenTree(!fullScreenTree)}
          />
        </Box>

        {/* Algorithm Insights (for Variant 2) */}
        {results.featureImportance && (
          <Card sx={{ mb: 3, bgcolor: '#f8fafb', border: '1px solid #e0e7ff' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AIIcon sx={{ color: 'secondary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Algorithm Insights
                </Typography>
              </Box>
              
              {/* Brief description */}
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Auto-Max Split dynamically selected the best factors at each level to maximize ROI variance. 
                Explore the sections below to understand how the algorithm built your tree.
              </Typography>

              {/* Quick Summary Stats */}
              {(() => {
                const analyzeTreeStructure = (nodes) => {
                  const levelAnalysis = {};
                  const allFactors = new Set();
                  
                  const traverse = (nodeList, level = 1, parentPath = '') => {
                    if (!nodeList) return;
                    
                    nodeList.forEach(node => {
                      if (node.factor !== 'root') {
                        allFactors.add(node.factor);
                        const path = parentPath ? `${parentPath} → ${node.value}` : 'Root';
                        
                        if (!levelAnalysis[level]) {
                          levelAnalysis[level] = [];
                        }
                        
                        const existingEntry = levelAnalysis[level].find(
                          entry => entry.factor === node.factor && entry.parentPath === path
                        );
                        
                        if (!existingEntry) {
                          const siblingNodes = nodeList.filter(n => n.factor === node.factor);
                          const impacts = siblingNodes.map(n => n.metrics?.totalImpactBps || n.metrics?.roiChangeBps || 0);
                          const range = Math.abs(Math.max(...impacts) - Math.min(...impacts));
                          
                          levelAnalysis[level].push({
                            factor: node.factor,
                            parentPath: path,
                            range: range,
                            impacts: siblingNodes.map(n => ({
                              value: n.value,
                              impact: n.metrics?.totalImpactBps || n.metrics?.roiChangeBps || 0
                            }))
                          });
                        }
                      }
                      
                      if (node.children) {
                        const nextPath = node.factor === 'root' ? '' : 
                                       (parentPath ? `${parentPath} → ${node.value}` : node.value);
                        traverse(node.children, level + 1, nextPath);
                      }
                    });
                  };
                  
                  traverse(nodes);
                  return { levelAnalysis, allFactors };
                };
                
                const { levelAnalysis, allFactors } = analyzeTreeStructure(tree);
                const levels = Object.keys(levelAnalysis).sort((a, b) => parseInt(a) - parseInt(b));
                
                return (
                  <>
                    {/* Quick Stats Bar */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: 1, textAlign: 'center' }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                            {Object.keys(results.featureImportance).length}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Factors Analyzed
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: 1, textAlign: 'center' }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                            {allFactors.size}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Factors Used
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: 1, textAlign: 'center' }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                            {levels.length}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Tree Depth
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: 1, textAlign: 'center' }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                            {metadata?.totalNodes || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Total Nodes
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Expandable Sections */}
                    <Box>
                      {/* How It Works Accordion */}
                      <Accordion sx={{ mb: 1, bgcolor: 'white' }}>
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{ '&:hover': { bgcolor: 'grey.50' } }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <InfoIcon sx={{ fontSize: 20, color: 'info.main' }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              How Auto-Max Split Works
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Alert severity="info" sx={{ border: 'none' }}>
                            <Typography variant="body2">
                              The algorithm dynamically selects the best factor at each level of the tree based on which creates 
                              the maximum variance in total impact (yield + distribution). Unlike a fixed hierarchy, it adapts 
                              its choices based on each data segment's characteristics, finding the most impactful splits for 
                              your specific patterns.
                            </Typography>
                          </Alert>
                        </AccordionDetails>
                      </Accordion>

                      {/* Factor Selection by Level Accordion */}
                      <Accordion sx={{ bgcolor: 'white' }}>
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{ '&:hover': { bgcolor: 'grey.50' } }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AnalyticsIcon sx={{ fontSize: 20, color: 'secondary.main' }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              Factor Selection by Level
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box>
                            {levels.map(level => (
                              <Accordion key={level} sx={{ mb: 1, boxShadow: 'none', border: '1px solid #e5e7eb' }}>
                                <AccordionSummary
                                  expandIcon={<ExpandMoreIcon />}
                                  sx={{ bgcolor: 'grey.50' }}
                                >
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    Level {level}
                                  </Typography>
                                  <Typography variant="caption" sx={{ ml: 2, color: 'text.secondary' }}>
                                    ({levelAnalysis[level].length} factor{levelAnalysis[level].length > 1 ? 's' : ''} selected)
                                  </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                  {levelAnalysis[level].map((entry, idx) => (
                                    <Box key={idx} sx={{ mb: 2, pb: 1, borderBottom: idx < levelAnalysis[level].length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                                      <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                                        {snakeToTitle(entry.factor)}
                                        {entry.parentPath && (
                                          <span style={{ color: '#6b7280', fontWeight: 400, fontSize: '0.85rem' }}> 
                                            {' '}(under {entry.parentPath})
                                          </span>
                                        )}
                                      </Typography>
                                      <Typography variant="caption" sx={{ display: 'block', color: 'success.main', mb: 0.5 }}>
                                        ✓ Selected for {entry.range.toFixed(1)} bps impact range
                                      </Typography>
                                      {entry.impacts.length <= 5 && (
                                        <Box sx={{ ml: 1, mt: 0.5 }}>
                                          {entry.impacts.map((imp, i) => (
                                            <Chip
                                              key={i}
                                              label={
                                                <span>
                                                  {imp.value}: <strong style={{ 
                                                    color: imp.impact > 0 ? '#16a34a' : '#dc2626'
                                                  }}>
                                                    {imp.impact > 0 ? '+' : ''}{imp.impact.toFixed(1)} bps
                                                  </strong>
                                                </span>
                                              }
                                              size="small"
                                              variant="outlined"
                                              sx={{ mr: 1, mb: 0.5, fontSize: '0.75rem' }}
                                            />
                                          ))}
                                        </Box>
                                      )}
                                    </Box>
                                  ))}
                                </AccordionDetails>
                              </Accordion>
                            ))}
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    </Box>

                    {/* Key Insight */}
                    <Alert severity="success" sx={{ mt: 3 }}>
                      <Typography variant="body2">
                        <strong>💡 Key Insight:</strong> The algorithm found that splitting by{' '}
                        <strong>{levelAnalysis[1] && snakeToTitle(levelAnalysis[1][0]?.factor)}</strong> at the root level 
                        created the highest impact variance ({levelAnalysis[1] && levelAnalysis[1][0]?.range.toFixed(1)} bps), 
                        making it the most important initial split for understanding your ROI changes.
                      </Typography>
                    </Alert>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </Box>
    );
  };

  return (
    <Box>
      {/* Analysis Method Selection with Integrated Action Button */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Tabs 
          value={selectedTab} 
          onChange={handleTabChange} 
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            minHeight: 40,
            '& .MuiTab-root': {
              minHeight: 40,
              paddingTop: 0.5,
              paddingBottom: 0.5,
              fontSize: '0.875rem'
            }
          }}
        >
          <Tab 
            icon={<PersonIcon fontSize="small" />} 
            label="User-Priority" 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 500 }}
          />
          <Tab 
            icon={<AIIcon fontSize="small" />} 
            label="Auto-Max Split" 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 500 }}
          />
        </Tabs>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Integrated Action Button */}
          <Button
          variant="contained"
          startIcon={
            selectedTab === 0 
              ? (variant1Loading ? <CircularProgress size={14} /> : <PlayIcon fontSize="small" />) 
              : (variant2Loading ? <CircularProgress size={14} /> : <AIIcon fontSize="small" />)
          }
          onClick={selectedTab === 0 ? handleVariant1Run : handleVariant2Run}
          disabled={
            selectedTab === 0 
              ? (variant1Loading || variant1Config.factorOrder.length === 0)
              : variant2Loading
          }
          size="small"
          sx={{ 
            minWidth: 80,
            fontSize: '0.8125rem',
            textTransform: 'none',
            height: 32
          }}
        >
          {(selectedTab === 0 ? variant1Loading : variant2Loading) ? 'Running...' : 'Run'}
          </Button>
        </Box>
      </Box>

      {/* Compact Analysis Configuration - Hide chips when results are displayed */}
      {selectedTab === 0 ? (
        !analysisResults.variant1 && (
          <Box sx={{ mb: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>User-Priority:</strong> Analyze ROI changes following your predefined factor sequence. 
                Perfect when you have domain expertise about factor importance. Includes yield/distribution impact decomposition.
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {variant1Config.factorOrder.map((factor, index) => (
                <Chip 
                  key={factor}
                  label={`${index + 1}. ${snakeToTitle(factor)}`}
                  variant="outlined"
                  color="primary"
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )
      ) : (
        !analysisResults.variant2 && (
          <Box sx={{ mb: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Auto-Max Split:</strong> AI-driven analysis using CART algorithm to automatically 
                select factors that provide maximum variance reduction in ROI changes. Uses total impact variance for optimal factor selection.
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {factorOrder.map((factor) => (
                <Chip 
                  key={factor}
                  label={snakeToTitle(factor)}
                  variant="outlined"
                  color="secondary"
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )
      )}

      {/* Analysis Results */}
      {selectedTab === 0 && renderAnalysisResults(analysisResults.variant1, 'user-priority')}
      {selectedTab === 1 && renderAnalysisResults(analysisResults.variant2, 'auto-max-split')}

      {/* Comparison Section */}
      {analysisResults.variant1 && analysisResults.variant2 && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Analysis Comparison
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.dark', mb: 1 }}>
                    User-Priority Results
                  </Typography>
                  <Typography variant="body2" color="primary.dark">
                    Nodes: {analysisResults.variant1.metadata?.totalNodes || 0} | 
                    Depth: {analysisResults.variant1.metadata?.maxDepth || 0}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: 'secondary.light', borderRadius: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'secondary.dark', mb: 1 }}>
                    Auto-Max Split Results
                  </Typography>
                  <Typography variant="body2" color="secondary.dark">
                    Nodes: {analysisResults.variant2.metadata?.totalNodes || 0} | 
                    Depth: {analysisResults.variant2.metadata?.maxDepth || 0}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Alert severity="success" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Recommendation:</strong> Compare both analyses to validate your assumptions. 
                Factors appearing as top drivers in both variants have the highest confidence.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AnalysisVariants;

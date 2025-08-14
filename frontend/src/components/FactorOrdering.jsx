import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Divider
} from '@mui/material';
import {
  DragHandle as DragIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  RestartAlt as ResetIcon,
  Close as RemoveIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { snakeToTitle } from '../utils/helpers';

const FactorOrdering = ({ availableFactors = [], distinctValues = {}, factorOrder = [], onFactorOrderChange }) => {
  const [targetVariable, setTargetVariable] = useState('roi');

  // Just log debug info - don't auto-populate factors
  useEffect(() => {
    console.log('🔍 FactorOrdering Debug:', {
      availableFactors,
      availableFactorsLength: availableFactors.length,
      distinctValues: Object.keys(distinctValues),
      factorOrderLength: factorOrder.length
    });
  }, [availableFactors, factorOrder.length, distinctValues]);

  const onDragEnd = (result) => {
    if (!result.destination || !onFactorOrderChange) return;

    const items = Array.from(factorOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onFactorOrderChange(items);
  };

  const resetOrder = () => {
    if (!onFactorOrderChange) return;
    const defaultOrder = availableFactors.filter(factor => 
      !['total_loan_amount', 'roi', 'v_score', 'application_id'].includes(factor.toLowerCase())
    );
    onFactorOrderChange(defaultOrder);
  };

  const removeFactor = (factorToRemove) => {
    if (!onFactorOrderChange) return;
    const newOrder = factorOrder.filter(factor => factor !== factorToRemove);
    onFactorOrderChange(newOrder);
  };

  const addFactor = (factorToAdd) => {
    if (!onFactorOrderChange || factorOrder.includes(factorToAdd)) return;
    const newOrder = [...factorOrder, factorToAdd];
    onFactorOrderChange(newOrder);
  };

  // Get factors that are available but not currently in the analysis
  const getUnusedFactors = () => {
    return availableFactors.filter(factor => 
      !factorOrder.includes(factor) &&
      !['total_loan_amount', 'roi', 'v_score'].includes(factor.toLowerCase())
    );
  };

  const getFactorDescription = (factor) => {
    const descriptions = {
      'tier': 'Credit risk tier classification',
      'v_score_band': 'V Score risk bands (Low, Mid, High)',
      'channel': 'Acquisition channel or source',
      'product': 'Loan product type',
      'tenure': 'Loan term or duration'
    };
    return descriptions[factor.toLowerCase()] || 'Analysis factor';
  };

  const getFactorIcon = (factor) => {
    const icons = {
      'tier': '🎯',
      'v_score_band': '📊',
      'channel': '🔗',
      'product': '💰',
      'tenure': '⏱️'
    };
    return icons[factor.toLowerCase()] || '📈';
  };

  return (
    <Box>
      {/* Available Factors - Show First for Easy Selection */}
      {getUnusedFactors().length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Available Factors
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Click any factor below to add it to your analysis order
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {getUnusedFactors().map((factor) => (
                <Chip
                  key={factor}
                  label={snakeToTitle(factor)}
                  variant="outlined"
                  color="primary"
                  onClick={() => addFactor(factor)}
                  icon={<AddIcon />}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { 
                      bgcolor: 'primary.light',
                      borderColor: 'primary.main',
                      color: 'white'
                    }
                  }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}


      {/* Factor Ordering */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Factor Analysis Order
            </Typography>
            <Button
              startIcon={<ResetIcon />}
              onClick={resetOrder}
              size="small"
              variant="outlined"
            >
              Reset Order
            </Button>
          </Box>
          
          {factorOrder.length > 0 && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>User-Priority Mode:</strong> Drag and drop factors to define the analysis hierarchy. 
                The system will analyze ROI changes following this exact sequence.
              </Typography>
            </Alert>
          )}

          {factorOrder.length > 0 ? (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="factors">
                {(provided, snapshot) => (
                  <List
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    sx={{
                      bgcolor: snapshot.isDraggingOver ? 'action.hover' : 'transparent',
                      borderRadius: 1,
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    {factorOrder.map((factor, index) => (
                      <Draggable key={factor} draggableId={factor} index={index}>
                        {(provided, snapshot) => (
                          <ListItem
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{
                              mb: 1,
                              bgcolor: 'background.paper',
                              border: '1px solid',
                              borderColor: snapshot.isDragging ? 'primary.main' : 'grey.300',
                              borderRadius: 1,
                              boxShadow: snapshot.isDragging ? 2 : 0,
                              cursor: snapshot.isDragging ? 'grabbing' : 'grab',
                              transform: snapshot.isDragging ? 'rotate(2deg)' : 'none',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                borderColor: 'primary.main',
                                boxShadow: 1
                              }
                            }}
                          >
                            <ListItemIcon>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip 
                                  label={index + 1} 
                                  size="small" 
                                  color="primary"
                                  sx={{ minWidth: '32px' }}
                                />
                                <Box sx={{ fontSize: '1.2rem' }}>
                                  {getFactorIcon(factor)}
                                </Box>
                              </Box>
                            </ListItemIcon>
                            
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {snakeToTitle(factor)}
                                  </Typography>
                                  {distinctValues[factor] && (
                                    <Chip 
                                      label={`${distinctValues[factor].length} values`}
                                      size="small"
                                      variant="outlined"
                                    />
                                  )}
                                </Box>
                              }
                              secondary={getFactorDescription(factor)}
                            />
                            
                            <ListItemIcon>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFactor(factor);
                                  }}
                                  sx={{ 
                                    color: 'error.main',
                                    '&:hover': { bgcolor: 'error.lighter' }
                                  }}
                                >
                                  <RemoveIcon fontSize="small" />
                                </IconButton>
                                <DragIcon color="action" />
                              </Box>
                            </ListItemIcon>
                          </ListItem>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </List>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>No factors selected for analysis.</strong> Click on factors from the "Available Factors" section above to add them to your analysis.
              </Typography>
            </Alert>
          )}

          {/* Factor Values Preview */}
          {factorOrder.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Factor Values Preview:
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {factorOrder.slice(0, 3).map((factor) => (
                  <Box key={factor} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      {snakeToTitle(factor)}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {distinctValues[factor]?.slice(0, 5).map((value) => (
                        <Chip 
                          key={value}
                          label={value}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ))}
                      {distinctValues[factor]?.length > 5 && (
                        <Chip 
                          label={`+${distinctValues[factor].length - 5} more`}
                          size="small"
                          color="primary"
                          variant="filled"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      )}
                    </Box>
                  </Box>
                ))}
                
                {factorOrder.length > 3 && (
                  <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="body2" color="info.dark">
                      +{factorOrder.length - 3} more factors will be analyzed in sequence
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}


          {/* Analysis Impact Info - Only show when factors are selected */}
          {factorOrder.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Alert severity="info">
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Analysis Impact:
                </Typography>
                <Typography variant="body2">
                  • <strong>Level 1:</strong> {factorOrder[0] ? snakeToTitle(factorOrder[0]) : 'First factor'} will be the primary split
                </Typography>
                <Typography variant="body2">
                  • <strong>Level 2:</strong> {factorOrder[1] ? snakeToTitle(factorOrder[1]) : 'Second factor'} will split within each primary group
                </Typography>
                <Typography variant="body2">
                  • <strong>Subsequent levels:</strong> Continue hierarchical analysis based on your priority
                </Typography>
              </Alert>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default FactorOrdering;

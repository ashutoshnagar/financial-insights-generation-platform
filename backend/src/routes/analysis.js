const express = require('express');
const dataProcessor = require('../services/dataProcessor');
const analysisEngine = require('../services/analysisEngine');
const sessionStorage = require('../services/sessionStorage');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

/**
 * POST /api/analysis/prepare
 * Prepare data for analysis from uploaded session
 */
router.post('/prepare', async (req, res) => {
  try {
    const { sessionId, previousData, currentData } = req.body;

    if (!previousData || !currentData) {
      return res.status(400).json({
        error: 'Missing data',
        message: 'Both previous and current month data are required'
      });
    }

    // Prepare data for analysis
    const analysisData = dataProcessor.prepareForAnalysis({
      previousMonth: previousData,
      currentMonth: currentData
    });

    // Store session data
    const analysisSessionId = sessionId || uuidv4();
    sessionStorage.createSession(analysisSessionId, analysisData);

    res.json({
      success: true,
      sessionId: analysisSessionId,
      message: 'Data prepared for analysis',
      data: {
        summary: analysisData.summary,
        distinctValues: analysisData.distinctValues,
        availableColumns: analysisData.availableColumns
      }
    });

  } catch (error) {
    console.error('Analysis preparation error:', error);
    res.status(400).json({
      error: 'Analysis preparation failed',
      message: error.message
    });
  }
});

/**
 * POST /api/analysis/variant1
 * Perform User-Priority analysis
 */
router.post('/variant1', async (req, res) => {
  try {
    console.log('🔄 Variant1 Analysis Request:', {
      body: req.body,
      sessionId: req.body?.sessionId,
      factorOrder: req.body?.factorOrder,
      targetVariable: req.body?.targetVariable,
      activeSessions: sessionStorage.getAllSessionIds()
    });

    const { sessionId, factorOrder, targetVariable = 'roi' } = req.body;

    if (!sessionId || !sessionStorage.hasSession(sessionId)) {
      console.log('❌ Session validation failed:', {
        sessionId,
        sessionExists: sessionStorage.hasSession(sessionId),
        availableSessions: sessionStorage.getAllSessionIds()
      });
      return res.status(400).json({
        error: 'Invalid session',
        message: 'Please upload data first to create a session'
      });
    }

    if (!factorOrder || !Array.isArray(factorOrder) || factorOrder.length === 0) {
      console.log('❌ Factor order validation failed:', {
        factorOrder,
        isArray: Array.isArray(factorOrder),
        length: factorOrder?.length
      });
      return res.status(400).json({
        error: 'Invalid factor order',
        message: 'Factor order must be a non-empty array'
      });
    }

    const session = sessionStorage.getSession(sessionId);
    
    // Validate that all factors exist in the data
    const availableFactors = session.data.availableColumns;
    const invalidFactors = factorOrder.filter(factor => !availableFactors.includes(factor));
    
    console.log('🔍 Factor validation:', {
      requestedFactors: factorOrder,
      availableFactors: availableFactors,
      invalidFactors: invalidFactors
    });
    
    if (invalidFactors.length > 0) {
      console.log('❌ Invalid factors found:', invalidFactors);
      return res.status(400).json({
        error: 'Invalid factors',
        message: `The following factors are not available: ${invalidFactors.join(', ')}`,
        availableFactors
      });
    }

    console.log(`🔄 Running User-Priority analysis for session ${sessionId} with factors: ${factorOrder.join(' → ')}`);

    // Perform analysis with impact decomposition
    console.log('📊 Using analysis with impact decomposition');
    const analysisResult = analysisEngine.performUserPriorityAnalysisV2(
      session.data,
      factorOrder,
      targetVariable
    );

    // Store analysis result
    const analysisId = uuidv4();
    session.analyses[analysisId] = {
      ...analysisResult,
      timestamp: new Date().toISOString()
    };

    // Generate tabular export data
    const tableData = analysisEngine.exportTreeToTable(analysisResult.tree, 'user-priority');

    res.json({
      success: true,
      analysisId,
      sessionId,
      message: 'User-Priority analysis completed successfully',
      data: {
        ...analysisResult,
        tableData
      }
    });

  } catch (error) {
    console.error('User-Priority analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/analysis/variant2
 * Perform Auto-Max Split analysis
 */
router.post('/variant2', async (req, res) => {
  try {
    const { sessionId, targetVariable = 'roi', availableFactors } = req.body;

    if (!sessionId || !sessionStorage.hasSession(sessionId)) {
      return res.status(400).json({
        error: 'Invalid session',
        message: 'Please upload data first to create a session'
      });
    }

    const session = sessionStorage.getSession(sessionId);

    // Use provided availableFactors or fall back to all available columns
    const factorsToAnalyze = availableFactors && Array.isArray(availableFactors) && availableFactors.length > 0 
      ? availableFactors 
      : session.data.availableColumns.filter(factor => 
          !['total_loan_amount', 'roi', 'v_score', 'application_id'].includes(factor.toLowerCase())
        );

    // Validate that all factors exist in the data
    const allAvailableFactors = session.data.availableColumns;
    const invalidFactors = factorsToAnalyze.filter(factor => !allAvailableFactors.includes(factor));
    
    if (invalidFactors.length > 0) {
      return res.status(400).json({
        error: 'Invalid factors',
        message: `The following factors are not available: ${invalidFactors.join(', ')}`,
        availableFactors: allAvailableFactors
      });
    }

    console.log(`🤖 Running Auto-Max Split analysis for session ${sessionId} with factors: ${factorsToAnalyze.join(', ')}`);

    // Perform analysis with impact decomposition
    console.log('📊 Using analysis with impact decomposition');
    const analysisResult = analysisEngine.performAutoMaxSplitAnalysisV2(
      session.data,
      targetVariable,
      factorsToAnalyze
    );

    // Store analysis result
    const analysisId = uuidv4();
    session.analyses[analysisId] = {
      ...analysisResult,
      timestamp: new Date().toISOString()
    };

    // Generate tabular export data
    const tableData = analysisEngine.exportTreeToTable(analysisResult.tree, 'auto-max-split');

    res.json({
      success: true,
      analysisId,
      sessionId,
      message: 'Auto-Max Split analysis completed successfully',
      data: {
        ...analysisResult,
        tableData
      }
    });

  } catch (error) {
    console.error('Auto-Max Split analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/analysis/compare
 * Compare results from both analysis variants
 */
router.post('/compare', async (req, res) => {
  try {
    const { sessionId, variant1AnalysisId, variant2AnalysisId } = req.body;

    if (!sessionId || !sessionStorage.hasSession(sessionId)) {
      return res.status(400).json({
        error: 'Invalid session',
        message: 'Session not found'
      });
    }

    const session = sessionStorage.getSession(sessionId);
    
    const analysis1 = session.analyses[variant1AnalysisId];
    const analysis2 = session.analyses[variant2AnalysisId];

    if (!analysis1 || !analysis2) {
      return res.status(400).json({
        error: 'Invalid analysis IDs',
        message: 'One or both analysis results not found'
      });
    }

    // Generate comparison insights
    const comparison = {
      summary: {
        userPriority: {
          totalNodes: analysis1.metadata.totalNodes,
          maxDepth: analysis1.metadata.maxDepth,
          factorOrder: analysis1.factorOrder
        },
        autoMaxSplit: {
          totalNodes: analysis2.metadata.totalNodes,
          maxDepth: analysis2.metadata.maxDepth,
          topFeatures: Object.keys(analysis2.featureImportance)
            .sort((a, b) => analysis2.featureImportance[b] - analysis2.featureImportance[a])
            .slice(0, 3)
        }
      },
      differences: {
        approachDifference: 'User-Priority follows predefined factor sequence, while Auto-Max Split optimizes for maximum variance reduction',
        structuralDifference: `User-Priority created ${analysis1.metadata.totalNodes} nodes vs Auto-Max Split's ${analysis2.metadata.totalNodes} nodes`
      },
      recommendations: generateComparisonRecommendations(analysis1, analysis2)
    };

    res.json({
      success: true,
      message: 'Analysis comparison completed',
      data: {
        comparison,
        variant1: {
          analysisType: analysis1.analysisType,
          metadata: analysis1.metadata
        },
        variant2: {
          analysisType: analysis2.analysisType,
          metadata: analysis2.metadata,
          featureImportance: analysis2.featureImportance
        }
      }
    });

  } catch (error) {
    console.error('Analysis comparison error:', error);
    res.status(500).json({
      error: 'Comparison failed',
      message: error.message
    });
  }
});

/**
 * GET /api/analysis/session/:sessionId
 * Get analysis session details
 */
router.get('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionStorage.hasSession(sessionId)) {
      return res.status(404).json({
        error: 'Session not found',
        message: 'The specified session does not exist'
      });
    }

    const session = sessionStorage.getSession(sessionId);
    
    res.json({
      success: true,
      sessionId,
      data: {
        timestamp: session.timestamp,
        summary: session.data.summary,
        availableColumns: session.data.availableColumns,
        analysisCount: Object.keys(session.analyses).length,
        analyses: Object.keys(session.analyses).map(analysisId => ({
          analysisId,
          analysisType: session.analyses[analysisId].analysisType,
          timestamp: session.analyses[analysisId].timestamp
        }))
      }
    });

  } catch (error) {
    console.error('Session retrieval error:', error);
    res.status(500).json({
      error: 'Session retrieval failed',
      message: error.message
    });
  }
});

/**
 * DELETE /api/analysis/session/:sessionId
 * Clean up analysis session
 */
router.delete('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionStorage.hasSession(sessionId)) {
      return res.status(404).json({
        error: 'Session not found',
        message: 'The specified session does not exist'
      });
    }

    sessionStorage.deleteSession(sessionId);

    res.json({
      success: true,
      message: 'Session cleaned up successfully'
    });

  } catch (error) {
    console.error('Session cleanup error:', error);
    res.status(500).json({
      error: 'Session cleanup failed',
      message: error.message
    });
  }
});

// Helper functions

function generateComparisonRecommendations(analysis1, analysis2) {
  return [
    'Use User-Priority analysis when you have domain expertise about factor importance',
    'Use Auto-Max Split analysis to discover unexpected patterns in your data',
    'Compare both results to validate your business assumptions',
    'Focus on drivers that appear significant in both analyses for highest confidence'
  ];
}

module.exports = router;

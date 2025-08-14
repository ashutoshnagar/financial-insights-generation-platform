const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// In-memory store for export sessions (in production, use Redis or database)
const exportSessions = new Map();

/**
 * POST /api/export/tree
 * Export decision tree data to various formats
 */
router.post('/tree', async (req, res) => {
  try {
    const { 
      sessionId, 
      analysisId, 
      format = 'excel', 
      includeTree = true, 
      includeTable = true,
      includeMetadata = true 
    } = req.body;

    if (!sessionId || !analysisId) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: 'sessionId and analysisId are required'
      });
    }

    // For this demo, we'll work with the provided data directly
    const { analysisData, tableData, metadata } = req.body;

    if (!analysisData) {
      return res.status(400).json({
        error: 'Missing analysis data',
        message: 'Analysis data is required for export'
      });
    }

    console.log(`📊 Exporting analysis data in ${format} format`);

    const exportData = {
      timestamp: new Date().toISOString(),
      sessionId,
      analysisId,
      analysisType: analysisData.analysisType || 'unknown'
    };

    let exportResult;

    switch (format.toLowerCase()) {
      case 'excel':
        exportResult = await this.exportToExcel(analysisData, tableData, metadata, exportData);
        break;
      case 'csv':
        exportResult = await this.exportToCSV(analysisData, tableData, exportData);
        break;
      case 'json':
        exportResult = await this.exportToJSON(analysisData, tableData, metadata, exportData);
        break;
      default:
        return res.status(400).json({
          error: 'Unsupported format',
          message: 'Supported formats: excel, csv, json'
        });
    }

    // Store export session for download
    const exportId = uuidv4();
    exportSessions.set(exportId, {
      ...exportResult,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour
    });

    res.json({
      success: true,
      exportId,
      message: `Analysis data exported successfully in ${format} format`,
      data: {
        filename: exportResult.filename,
        size: exportResult.size,
        format: format,
        downloadUrl: `/api/export/download/${exportId}`
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      error: 'Export failed',
      message: error.message
    });
  }
});

/**
 * GET /api/export/download/:exportId
 * Download exported file
 */
router.get('/download/:exportId', (req, res) => {
  try {
    const { exportId } = req.params;

    if (!exportSessions.has(exportId)) {
      return res.status(404).json({
        error: 'Export not found',
        message: 'The requested export does not exist or has expired'
      });
    }

    const exportSession = exportSessions.get(exportId);

    // Check if export has expired
    if (new Date() > new Date(exportSession.expiresAt)) {
      exportSessions.delete(exportId);
      return res.status(410).json({
        error: 'Export expired',
        message: 'The requested export has expired'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', exportSession.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportSession.filename}"`);
    res.setHeader('Content-Length', exportSession.size);

    // Send file buffer
    res.send(exportSession.buffer);

    // Clean up after successful download
    exportSessions.delete(exportId);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      error: 'Download failed',
      message: error.message
    });
  }
});

/**
 * POST /api/export/report
 * Generate comprehensive analysis report
 */
router.post('/report', async (req, res) => {
  try {
    const {
      sessionId,
      analyses, // Array of analysis results
      includeCharts = true,
      includeComparison = true,
      format = 'excel'
    } = req.body;

    if (!sessionId || !analyses || analyses.length === 0) {
      return res.status(400).json({
        error: 'Missing data',
        message: 'sessionId and analyses array are required'
      });
    }

    console.log(`📋 Generating comprehensive report for ${analyses.length} analyses`);

    const reportData = {
      title: 'ROI Change Driver Analysis Report',
      generatedAt: new Date().toISOString(),
      sessionId,
      analyses: analyses.map(analysis => ({
        analysisType: analysis.analysisType,
        timestamp: analysis.timestamp,
        metadata: analysis.metadata
      }))
    };

    let exportResult;

    if (format === 'excel') {
      exportResult = await this.generateExcelReport(analyses, reportData);
    } else if (format === 'json') {
      exportResult = await this.generateJSONReport(analyses, reportData);
    } else {
      return res.status(400).json({
        error: 'Unsupported format',
        message: 'Supported formats for reports: excel, json'
      });
    }

    // Store export session
    const exportId = uuidv4();
    exportSessions.set(exportId, {
      ...exportResult,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    });

    res.json({
      success: true,
      exportId,
      message: 'Comprehensive report generated successfully',
      data: {
        filename: exportResult.filename,
        size: exportResult.size,
        format: format,
        downloadUrl: `/api/export/download/${exportId}`,
        reportSummary: {
          totalAnalyses: analyses.length,
          generatedAt: reportData.generatedAt
        }
      }
    });

  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({
      error: 'Report generation failed',
      message: error.message
    });
  }
});

// Helper methods for different export formats
router.exportToExcel = async function(analysisData, tableData, metadata, exportInfo) {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ['ROI Change Driver Analysis Report'],
    [''],
    ['Export Information'],
    ['Generated At', exportInfo.timestamp],
    ['Session ID', exportInfo.sessionId],
    ['Analysis ID', exportInfo.analysisId],
    ['Analysis Type', exportInfo.analysisType],
    [''],
    ['Analysis Summary'],
  ];

  if (metadata) {
    summaryData.push(
      ['Total Nodes', metadata.totalNodes || 'N/A'],
      ['Max Depth', metadata.maxDepth || 'N/A'],
      ['Total ROI Change (bps)', metadata.totalROIChange ? (metadata.totalROIChange * 100).toFixed(2) : 'N/A']
    );
  }

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Table Data Sheet
  if (tableData && tableData.data) {
    const tableSheet = XLSX.utils.json_to_sheet(tableData.data);
    XLSX.utils.book_append_sheet(workbook, tableSheet, 'Analysis Details');
  }

  // Tree Structure Sheet (simplified)
  if (analysisData.tree) {
    const treeData = this.flattenTreeForExcel(analysisData.tree);
    const treeSheet = XLSX.utils.json_to_sheet(treeData);
    XLSX.utils.book_append_sheet(workbook, treeSheet, 'Tree Structure');
  }

  // Feature Importance (if available)
  if (analysisData.featureImportance) {
    const importanceData = Object.entries(analysisData.featureImportance).map(([feature, importance]) => ({
      Feature: feature,
      Importance: (importance * 100).toFixed(2) + '%'
    }));
    const importanceSheet = XLSX.utils.json_to_sheet(importanceData);
    XLSX.utils.book_append_sheet(workbook, importanceSheet, 'Feature Importance');
  }

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  const filename = `roi-analysis-${exportInfo.analysisType}-${Date.now()}.xlsx`;

  return {
    buffer,
    filename,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: buffer.length
  };
};

router.exportToCSV = async function(analysisData, tableData, exportInfo) {
  let csvContent = '';
  
  // Header information
  csvContent += 'ROI Change Driver Analysis Export\n';
  csvContent += `Generated At,${exportInfo.timestamp}\n`;
  csvContent += `Analysis Type,${exportInfo.analysisType}\n`;
  csvContent += '\n';

  // Table data
  if (tableData && tableData.data && tableData.data.length > 0) {
    const headers = Object.keys(tableData.data[0]);
    csvContent += headers.join(',') + '\n';
    
    tableData.data.forEach(row => {
      const values = headers.map(header => `"${row[header] || ''}"`);
      csvContent += values.join(',') + '\n';
    });
  }

  const buffer = Buffer.from(csvContent, 'utf8');
  const filename = `roi-analysis-${exportInfo.analysisType}-${Date.now()}.csv`;

  return {
    buffer,
    filename,
    contentType: 'text/csv',
    size: buffer.length
  };
};

router.exportToJSON = async function(analysisData, tableData, metadata, exportInfo) {
  const jsonData = {
    exportInfo,
    analysisData: {
      analysisType: analysisData.analysisType,
      targetVariable: analysisData.targetVariable,
      factorOrder: analysisData.factorOrder,
      tree: analysisData.tree,
      featureImportance: analysisData.featureImportance,
      metadata: metadata
    },
    tableData,
    exportedAt: new Date().toISOString()
  };

  const buffer = Buffer.from(JSON.stringify(jsonData, null, 2), 'utf8');
  const filename = `roi-analysis-${exportInfo.analysisType}-${Date.now()}.json`;

  return {
    buffer,
    filename,
    contentType: 'application/json',
    size: buffer.length
  };
};

router.generateExcelReport = async function(analyses, reportData) {
  const workbook = XLSX.utils.book_new();

  // Report Summary Sheet
  const summaryData = [
    [reportData.title],
    [''],
    ['Report Information'],
    ['Generated At', reportData.generatedAt],
    ['Session ID', reportData.sessionId],
    ['Total Analyses', analyses.length],
    ['']
  ];

  analyses.forEach((analysis, index) => {
    summaryData.push([`Analysis ${index + 1}`, analysis.analysisType]);
  });

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Report Summary');

  // Individual analysis sheets
  analyses.forEach((analysis, index) => {
    if (analysis.tableData && analysis.tableData.data) {
      const sheet = XLSX.utils.json_to_sheet(analysis.tableData.data);
      XLSX.utils.book_append_sheet(workbook, sheet, `Analysis ${index + 1}`);
    }
  });

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  const filename = `roi-analysis-comprehensive-report-${Date.now()}.xlsx`;

  return {
    buffer,
    filename,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: buffer.length
  };
};

router.generateJSONReport = async function(analyses, reportData) {
  const reportJson = {
    ...reportData,
    analyses: analyses.map(analysis => ({
      analysisType: analysis.analysisType,
      timestamp: analysis.timestamp,
      metadata: analysis.metadata,
      tree: analysis.tree,
      tableData: analysis.tableData,
      featureImportance: analysis.featureImportance
    }))
  };

  const buffer = Buffer.from(JSON.stringify(reportJson, null, 2), 'utf8');
  const filename = `roi-analysis-comprehensive-report-${Date.now()}.json`;

  return {
    buffer,
    filename,
    contentType: 'application/json',
    size: buffer.length
  };
};

router.flattenTreeForExcel = function(tree) {
  const flattened = [];
  
  const traverse = (nodes, depth = 0, parentPath = '') => {
    if (!nodes) return;
    
    nodes.forEach(node => {
      const currentPath = parentPath ? `${parentPath} → ${node.factor}:${node.value}` : `${node.factor}:${node.value}`;
      
      flattened.push({
        Depth: depth,
        Path: currentPath,
        Factor: node.factor,
        Value: node.value,
        'Previous ROI': node.metrics.previousROI?.toFixed(4) || '0.0000',
        'Current ROI': node.metrics.currentROI?.toFixed(4) || '0.0000',
        'ROI Change': node.metrics.roiChange?.toFixed(4) || '0.0000',
        'ROI Change (bps)': node.metrics.roiChangeBps?.toFixed(2) || '0.00',
        'Previous Amount': node.metrics.previousAmount?.toLocaleString() || '0',
        'Current Amount': node.metrics.currentAmount?.toLocaleString() || '0'
      });

      if (node.children) {
        traverse(node.children, depth + 1, currentPath);
      }
    });
  };

  traverse(tree);
  return flattened;
};

/**
 * DELETE /api/export/cleanup
 * Clean up expired export sessions
 */
router.delete('/cleanup', (req, res) => {
  try {
    const now = new Date();
    let cleanedCount = 0;

    for (const [exportId, session] of exportSessions.entries()) {
      if (now > new Date(session.expiresAt)) {
        exportSessions.delete(exportId);
        cleanedCount++;
      }
    }

    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} expired export sessions`,
      remainingSessions: exportSessions.size
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      error: 'Cleanup failed',
      message: error.message
    });
  }
});

module.exports = router;

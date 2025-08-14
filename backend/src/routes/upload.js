const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const dataProcessor = require('../services/dataProcessor');
const sessionStorage = require('../services/sessionStorage');

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept CSV and Excel files
  const allowedTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/csv'
  ];
  
  const allowedExtensions = ['.csv', '.xls', '.xlsx'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV and Excel files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

/**
 * POST /api/upload
 * Upload and parse CSV/Excel files
 */
router.post('/', upload.array('files', 2), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded',
        message: 'Please upload either 1 Excel file with 2 sheets or 2 CSV files'
      });
    }

    console.log(`📁 Processing ${req.files.length} file(s):`, req.files.map(f => f.originalname));

    // Parse the uploaded files
    const parsedData = await dataProcessor.parseFiles(req.files);
    
    // Prepare data for analysis
    const analysisReadyData = dataProcessor.prepareForAnalysis(parsedData);

    // Create session ID and store the session data
    const sessionId = uuidv4();
    sessionStorage.createSession(sessionId, analysisReadyData);

    console.log(`✅ Session ${sessionId} created with data:`, {
      availableColumns: analysisReadyData.availableColumns,
      previousMonthRows: analysisReadyData.previousMonth.length,
      currentMonthRows: analysisReadyData.currentMonth.length,
      totalSessions: sessionStorage.getSessionCount()
    });

    // Clean up uploaded files after processing
    await Promise.all(req.files.map(file => fs.remove(file.path)));

    res.json({
      success: true,
      message: 'Files uploaded and processed successfully',
      data: {
        summary: analysisReadyData.summary,
        distinctValues: analysisReadyData.distinctValues,
        availableColumns: analysisReadyData.availableColumns,
        metadata: parsedData.metadata,
        dataPreview: {
          previousMonth: analysisReadyData.previousMonth.slice(0, 5), // First 5 rows
          currentMonth: analysisReadyData.currentMonth.slice(0, 5)
        },
        cleaningStats: analysisReadyData.cleaningStats // Include cleaning statistics
      },
      sessionId: sessionId
    });

  } catch (error) {
    console.error('Upload processing error:', error);

    // Clean up files on error
    if (req.files) {
      await Promise.all(req.files.map(file => fs.remove(file.path).catch(() => {})));
    }

    res.status(400).json({
      error: 'File processing failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/upload/validate
 * Validate file format without processing
 */
router.post('/validate', upload.array('files', 2), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded',
        message: 'Please upload files for validation'
      });
    }

    const validationResults = [];

    for (const file of req.files) {
      const result = {
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        valid: true,
        errors: []
      };

      // Check file size
      if (file.size > 50 * 1024 * 1024) {
        result.valid = false;
        result.errors.push('File size exceeds 50MB limit');
      }

      // Check file type
      const allowedExtensions = ['.csv', '.xls', '.xlsx'];
      const fileExtension = path.extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        result.valid = false;
        result.errors.push('Invalid file type. Only CSV and Excel files are allowed');
      }

      validationResults.push(result);
    }

    // Clean up uploaded files after validation
    await Promise.all(req.files.map(file => fs.remove(file.path)));

    const allValid = validationResults.every(result => result.valid);

    res.json({
      success: allValid,
      message: allValid ? 'All files are valid' : 'Some files have validation errors',
      validationResults,
      recommendations: {
        fileCount: req.files.length === 1 ? 
          'Single Excel file detected - ensure it has 2 sheets (Previous Month & Current Month)' :
          'Two files detected - ensure they are CSV files with same column structure'
      }
    });

  } catch (error) {
    console.error('Validation error:', error);

    // Clean up files on error
    if (req.files) {
      await Promise.all(req.files.map(file => fs.remove(file.path).catch(() => {})));
    }

    res.status(400).json({
      error: 'File validation failed',
      message: error.message
    });
  }
});

/**
 * GET /api/upload/sample
 * Get sample data format
 */
router.get('/sample', (req, res) => {
  const sampleData = {
    requiredColumns: [
      'Total Loan Amount (or Amount, Loan Amount)',
      'ROI (or Rate of Interest, Interest Rate)',
      'Tier (or Credit Tier, Risk Tier)',
      'V Score (or VScore, Credit Score)',
      'Channel (or Channel Mapping, Source Channel)'
    ],
    optionalColumns: [
      'Tenure (or Loan Tenure, Term)',
      'Product (or Product Type, Loan Product)'
    ],
    sampleRows: [
      {
        'Total Loan Amount': 100000,
        'ROI': 12.5,
        'Tier': 'T1',
        'V Score': 15,
        'Channel': 'Direct',
        'Product': 'Personal Loan',
        'Tenure': 24
      },
      {
        'Total Loan Amount': 250000,
        'ROI': 11.8,
        'Tier': 'T2',
        'V Score': 12,
        'Channel': 'Partner',
        'Product': 'Business Loan',
        'Tenure': 36
      }
    ],
    fileFormats: {
      excel: {
        description: 'Single Excel file with 2 sheets',
        sheetNames: ['Previous Month', 'Current Month'],
        note: 'Each sheet should have the same column structure'
      },
      csv: {
        description: 'Two separate CSV files',
        files: ['previous_month.csv', 'current_month.csv'],
        note: 'Both files should have the same column structure'
      }
    },
    vScoreBanding: {
      'Low (≤V10)': 'V Score <= 10',
      'Mid (V11-V14)': 'V Score 11-14',
      'High (≥V15)': 'V Score >= 15'
    }
  };

  res.json({
    success: true,
    message: 'Sample data format and requirements',
    data: sampleData
  });
});

module.exports = router;

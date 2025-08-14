const XLSX = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const _ = require('lodash');

class DataProcessor {
  /**
   * Parse uploaded files (CSV or Excel)
   * @param {Array} files - Array of uploaded files
   * @returns {Object} Parsed data with previous and current month data
   */
  async parseFiles(files) {
    try {
      if (files.length === 1) {
        // Single Excel file with multiple sheets
        return await this.parseExcelFile(files[0]);
      } else if (files.length === 2) {
        // Two separate CSV files
        return await this.parseCSVFiles(files);
      } else {
        throw new Error('Please upload either 1 Excel file with 2 sheets or 2 CSV files');
      }
    } catch (error) {
      throw new Error(`File parsing failed: ${error.message}`);
    }
  }

  /**
   * Parse Excel file with multiple sheets
   * @param {Object} file - Excel file object
   * @returns {Object} Parsed data
   */
  async parseExcelFile(file) {
    try {
      console.log(`📊 Parsing Excel file: ${file.originalname}`);
      
      // Handle both file path and buffer
      const workbook = file.buffer ? 
        XLSX.read(file.buffer, { type: 'buffer' }) : 
        XLSX.readFile(file.path);
      const sheetNames = workbook.SheetNames;
      
      console.log(`📋 Found ${sheetNames.length} sheets:`, sheetNames);

      if (sheetNames.length < 2) {
        throw new Error(`Excel file must contain at least 2 sheets. Found only ${sheetNames.length} sheet(s): ${sheetNames.join(', ')}`);
      }

      const previousData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]], { 
        header: 1,
        defval: ''
      });
      const currentData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[1]], { 
        header: 1,
        defval: ''
      });

      console.log(`📊 Sheet "${sheetNames[0]}" has ${previousData.length} rows`);
      console.log(`📊 Sheet "${sheetNames[1]}" has ${currentData.length} rows`);

      // Convert header-based format to object format
      const previousObjects = this.convertToObjects(previousData);
      const currentObjects = this.convertToObjects(currentData);

      console.log(`✅ Converted to ${previousObjects.length} and ${currentObjects.length} objects`);

      if (previousObjects.length === 0 || currentObjects.length === 0) {
        throw new Error('One or both sheets appear to be empty or have no valid data rows');
      }

      // Log first row sample to debug column detection
      if (previousObjects.length > 0) {
        console.log(`🔍 Sample columns from previous month:`, Object.keys(previousObjects[0]));
      }

      return {
        previousMonth: this.normalizeData(previousObjects),
        currentMonth: this.normalizeData(currentObjects),
        metadata: {
          previousSheetName: sheetNames[0],
          currentSheetName: sheetNames[1],
          totalSheets: sheetNames.length,
          originalPreviousRows: previousData.length,
          originalCurrentRows: currentData.length
        }
      };
    } catch (error) {
      console.error(`❌ Excel parsing error for ${file.originalname}:`, error.message);
      throw new Error(`Excel file parsing failed: ${error.message}`);
    }
  }

  /**
   * Convert header-row format to objects
   * @param {Array} data - Raw data with headers in first row
   * @returns {Array} Array of objects
   */
  convertToObjects(data) {
    if (data.length < 2) return [];
    
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        if (header && header.toString().trim()) {
          obj[header.toString().trim()] = row[index] || '';
        }
      });
      return obj;
    }).filter(obj => Object.keys(obj).length > 0);
  }

  /**
   * Parse two separate CSV files
   * @param {Array} files - Array of CSV files
   * @returns {Object} Parsed data
   */
  async parseCSVFiles(files) {
    const parsedFiles = await Promise.all(
      files.map(file => this.parseCSVFile(file))
    );

    // Determine which file is previous/current based on filename or let user decide
    return {
      previousMonth: this.normalizeData(parsedFiles[0].data),
      currentMonth: this.normalizeData(parsedFiles[1].data),
      metadata: {
        previousFileName: parsedFiles[0].filename,
        currentFileName: parsedFiles[1].filename
      }
    };
  }

  /**
   * Parse single CSV file
   * @param {Object} file - CSV file object
   * @returns {Promise} Parsed CSV data
   */
  parseCSVFile(file) {
    return new Promise((resolve, reject) => {
      const results = [];
      
      // Handle both file path and buffer
      const stream = file.buffer ? 
        require('stream').Readable.from(file.buffer) :
        fs.createReadStream(file.path);
      
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          resolve({
            data: results,
            filename: file.originalname
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  /**
   * Normalize data - standardize column names and data types
   * @param {Array} data - Raw data array
   * @returns {Object} Normalized data with cleaning statistics
   */
  normalizeData(data) {
    const originalCount = data.length;
    let removedCount = 0;
    let standardizedCount = 0;
    
    // First pass: normalize and clean data
    let cleanedData = data.map(row => {
      const normalizedRow = {};
      
      // Standardize common column names
      Object.keys(row).forEach(key => {
        const normalizedKey = this.normalizeColumnName(key);
        // Skip date columns that might be incorrectly mapped to roi
        if (normalizedKey === 'roi' && key.toLowerCase().includes('date')) {
          console.log(`⚠️ Skipping date column "${key}" - not an ROI column`);
          normalizedRow[key.toLowerCase().replace(/[^a-z0-9]/g, '_')] = row[key];
        } else if (normalizedKey in normalizedRow) {
          // If the key already exists, keep the first valid ROI value
          console.log(`⚠️ Duplicate mapping to "${normalizedKey}" - keeping existing value`);
        } else {
          // Pass the original column name to normalizeValue for context-specific processing
          normalizedRow[normalizedKey] = this.normalizeValue(row[key], key);
        }
      });

      return normalizedRow;
    });

    // Second pass: remove rows with ANY empty cells
    cleanedData = cleanedData.filter(row => {
      // Check if ANY cell in the row is empty
      const hasEmptyCell = Object.values(row).some(value => 
        value === null || value === undefined || value === '' || 
        (typeof value === 'string' && value.trim() === '')
      );
      
      // Also ensure critical fields are not empty or zero
      const criticalFieldsEmpty = !row.total_loan_amount || !row.roi || row.roi === 0;
      
      if (hasEmptyCell || criticalFieldsEmpty) {
        removedCount++;
        console.log(`🗑️ Removing row with empty cells or missing critical fields`);
        return false;
      }
      return true;
    });

    // Third pass: dynamically standardize categorical values
    // Identify categorical columns (exclude numeric columns)
    const excludeColumns = ['total_loan_amount', 'roi', 'v_score', 'tenure'];
    const categoricalColumns = Object.keys(cleanedData[0] || {}).filter(col => !excludeColumns.includes(col));
    
    cleanedData = cleanedData.map(row => {
      const standardizedRow = { ...row };
      
      categoricalColumns.forEach(field => {
        if (standardizedRow[field] && typeof standardizedRow[field] === 'string') {
          const original = standardizedRow[field];
          const standardized = original.toLowerCase().trim();
          if (original !== standardized) {
            standardizedCount++;
            standardizedRow[field] = standardized;
          }
        }
      });
      
      return standardizedRow;
    });

    // Store cleaning statistics
    cleanedData._cleaningStats = {
      originalCount,
      removedCount,
      standardizedCount,
      cleanCount: cleanedData.length,
      qualityScore: ((cleanedData.length / originalCount) * 100).toFixed(1)
    };

    return cleanedData;
  }

  /**
   * Build dynamic categorical standardization map
   * @param {Array} data - Dataset
   * @returns {Object} Standardization mappings
   */
  buildCategoricalStandardization(data) {
    const standardizationMap = {};
    
    // Identify categorical columns (exclude numeric columns)
    const excludeColumns = ['total_loan_amount', 'roi', 'v_score', 'tenure'];
    const columns = Object.keys(data[0] || {}).filter(col => !excludeColumns.includes(col));
    
    columns.forEach(column => {
      // Simple standardization: map all values to lowercase trimmed version
      const columnMap = {};
      
      data.forEach(row => {
        const value = row[column];
        if (value && typeof value === 'string') {
          const standardValue = value.toLowerCase().trim();
          // Map original value to standardized (lowercase, trimmed) value
          columnMap[value] = standardValue;
        }
      });
      
      // Only include if there are values to standardize
      if (Object.keys(columnMap).length > 0) {
        standardizationMap[column] = columnMap;
      }
    });
    
    return standardizationMap;
  }

  /**
   * Normalize column names to standard format with better fuzzy matching
   * @param {string} columnName - Original column name
   * @returns {string} Normalized column name
   */
  normalizeColumnName(columnName) {
    if (!columnName) return 'unknown_column';
    
    // Only map the required columns - everything else is auto-detected
    const requiredMappings = {
      'total_loan_amount': ['total loan amount', 'loan amount', 'amount', 'total_amount', 'loan_amt', 'amt'],
      'roi': ['roi', 'rate of interest', 'interest rate', 'rate', 'yield', 'interest_rate'],
      'v_score': ['v score', 'V score', 'V Score', 'vscore', 'VScore', 'v_score', 'V_score', 'V_Score', 'score', 'v', 'V']
    };

    const original = columnName.toString().trim();
    const normalized = original.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    
    // Check if this column matches any of our required column mappings
    for (const [standard, variants] of Object.entries(requiredMappings)) {
      for (const variant of variants) {
        const variantNormalized = variant.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
        if (normalized === variantNormalized || normalized.includes(variantNormalized) || variantNormalized.includes(normalized)) {
       //   console.log(`🔄 Required column mapping: "${original}" → "${standard}"`);
          return standard;
        }
      }
    }

    // Return original normalized name - all other columns are kept as-is for dynamic detection
   // console.log(`📋 Column auto-detected: "${original}" → "${normalized}"`);
    return normalized;
  }

  /**
   * Normalize values - convert strings to appropriate types
   * @param {*} value - Raw value
   * @param {string} columnName - Column name for context-specific processing
   * @returns {*} Normalized value
   */
  normalizeValue(value, columnName = '') {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    // Convert string numbers to actual numbers
    if (typeof value === 'string') {
      // Remove commas and currency symbols
      const cleanedValue = value.replace(/[,$%]/g, '');
      
      if (!isNaN(cleanedValue) && cleanedValue !== '') {
        const numericValue = parseFloat(cleanedValue);
        
        // ROI values in Excel are stored as percentages (10.5 = 10.5%)
        // Convert to decimal for calculations (10.5% → 0.105)
        if (columnName.toLowerCase().includes('roi') || 
            columnName.toLowerCase().includes('rate') ||
            columnName.toLowerCase().includes('interest')) {
       //   console.log(`📊 ROI conversion: ${value} (${numericValue}%) → ${numericValue / 100}`);
          return numericValue / 100;
        }
        
        return numericValue;
      }
    }

    // Handle numeric values that might also be percentages for ROI columns
    if (typeof value === 'number' && (
        columnName.toLowerCase().includes('roi') || 
        columnName.toLowerCase().includes('rate') ||
        columnName.toLowerCase().includes('interest'))) {
    //  console.log(`📊 ROI conversion: ${value}% → ${value / 100}`);
      return value / 100;
    }

    return value;
  }

  /**
   * Calculate Weighted ROI for a dataset
   * @param {Array} data - Dataset
   * @returns {number} Weighted ROI
   */
  calculateWeightedROI(data) {
    const totalWeightedROI = data.reduce((sum, row) => {
      const amount = row.total_loan_amount || 0;
      const roi = row.roi || 0;
      return sum + (amount * roi);
    }, 0);

    const totalAmount = data.reduce((sum, row) => {
      return sum + (row.total_loan_amount || 0);
    }, 0);

    return totalAmount > 0 ? totalWeightedROI / totalAmount : 0;
  }

  /**
   * Get distinct values for all categorical columns (auto-detect)
   * @param {Array} data - Dataset
   * @returns {Object} Object with distinct values for each categorical column
   */
  getDistinctValues(data) {
    const distinctValues = {};

    if (data.length === 0) {
      console.log('❌ No data provided to getDistinctValues');
      return distinctValues;
    }

    console.log(`🔍 Analyzing ${data.length} rows for categorical columns`);
    console.log(`📊 Sample row columns:`, Object.keys(data[0]));

    // Auto-detect categorical columns (exclude required numeric columns)
    const excludeColumns = ['total_loan_amount', 'roi', 'v_score'];
    const allColumns = Object.keys(data[0]);
    const nonExcludedColumns = allColumns.filter(column => !excludeColumns.includes(column));
    
    console.log(`📋 All columns:`, allColumns);
    console.log(`🚫 Excluded columns:`, excludeColumns);
    console.log(`✅ Non-excluded columns:`, nonExcludedColumns);

    const categoricalColumns = nonExcludedColumns.filter(column => {
      const isCategorical = this.isCategoricalColumn(data, column);
      console.log(`🔍 Column "${column}" is categorical: ${isCategorical}`);
      return isCategorical;
    });

    console.log(`📊 Final categorical columns:`, categoricalColumns);

    categoricalColumns.forEach(column => {
      const values = [...new Set(
        data
          .map(row => row[column])
          .filter(value => value !== null && value !== undefined && value !== '')
      )].sort();
      
      distinctValues[column] = values;
      console.log(`📈 Column "${column}" has ${values.length} distinct values:`, values.slice(0, 5));
    });

    return distinctValues;
  }

  /**
   * Determine if a column is categorical based on its values
   * @param {Array} data - Dataset
   * @param {string} column - Column name
   * @returns {boolean} True if column is categorical
   */
  isCategoricalColumn(data, column) {
    const values = data.map(row => row[column]).filter(v => v !== null && v !== undefined && v !== '');
    if (values.length === 0) return false;

    const uniqueValues = [...new Set(values)];
    const uniqueRatio = uniqueValues.length / values.length;

    // Consider categorical if:
    // 1. Low unique ratio (less than 50% unique values)
    // 2. Or has less than 20 unique values
    // 3. Or contains non-numeric values
    const hasNonNumeric = values.some(v => typeof v === 'string' && isNaN(v));
    
    return uniqueRatio < 0.5 || uniqueValues.length < 20 || hasNonNumeric;
  }

  /**
   * Apply V Score banding
   * @param {Array} data - Dataset
   * @returns {Array} Data with V Score bands added
   */
  applyVScoreBanding(data) {
    console.log(`🎯 Starting V Score banding for ${data.length} records`);
    
    return data.map((row, index) => {
      const vScore = row.v_score;
      let vScoreBand = 'Unknown';
      let numericVScore = null;

      // Debug logging for first few records
      if (index < 5) {
        console.log(`🔍 Row ${index + 1}: v_score = ${vScore} (type: ${typeof vScore})`);
      }

      if (vScore !== null && vScore !== undefined && vScore !== '') {
        // Try to parse V Score values that might have "V" prefix
        if (typeof vScore === 'string') {
          // Remove "V" prefix if present and parse as number
          const cleanValue = vScore.toString().replace(/^v/i, '').trim();
          numericVScore = parseFloat(cleanValue);
          if (index < 5) {
            console.log(`🔄 String V Score: "${vScore}" → cleaned: "${cleanValue}" → numeric: ${numericVScore}`);
          }
        } else if (typeof vScore === 'number') {
          numericVScore = vScore;
          if (index < 5) {
            console.log(`🔢 Numeric V Score: ${numericVScore}`);
          }
        }

        // Apply banding based on numeric value
        if (!isNaN(numericVScore) && numericVScore !== null) {
          if (numericVScore <= 10) {
            vScoreBand = 'Low (≤V10)';
          } else if (numericVScore >= 11 && numericVScore <= 14) {
            vScoreBand = 'Mid (V11-V14)';
          } else if (numericVScore >= 15) {
            vScoreBand = 'High (≥V15)';
          }
          
          if (index < 5) {
            console.log(`✅ V Score ${numericVScore} → Band: ${vScoreBand}`);
          }
        } else {
          if (index < 5) {
            console.log(`❌ Could not parse V Score: ${vScore}`);
          }
        }
      } else {
        if (index < 5) {
          console.log(`⚠️ Missing V Score value`);
        }
      }

      return {
        ...row,
        v_score_band: vScoreBand
      };
    });
  }

  /**
   * Get summary statistics for the dataset
   * @param {Object} parsedData - Parsed data with previous and current month
   * @returns {Object} Summary statistics
   */
  getSummaryStats(parsedData) {
    const { previousMonth, currentMonth } = parsedData;

    const prevROI = this.calculateWeightedROI(previousMonth);
    const currentROI = this.calculateWeightedROI(currentMonth);
    const roiChange = currentROI - prevROI;

    return {
      previousMonth: {
        recordCount: previousMonth.length,
        totalAmount: previousMonth.reduce((sum, row) => sum + (row.total_loan_amount || 0), 0),
        weightedROI: prevROI
      },
      currentMonth: {
        recordCount: currentMonth.length,
        totalAmount: currentMonth.reduce((sum, row) => sum + (row.total_loan_amount || 0), 0),
        weightedROI: currentROI
      },
      change: {
        roiChange: roiChange,
        roiChangeBps: roiChange * 100, // Convert to basis points
        percentageChange: prevROI !== 0 ? (roiChange / prevROI) * 100 : 0
      }
    };
  }

  /**
   * Prepare data for analysis by filling missing values and aligning datasets
   * @param {Object} parsedData - Parsed data
   * @returns {Object} Analysis-ready data
   */
  prepareForAnalysis(parsedData) {
    let { previousMonth, currentMonth } = parsedData;

    // Extract cleaning statistics before further processing
    const cleaningStats = {
      previous: previousMonth._cleaningStats || {
        originalCount: previousMonth.length,
        removedCount: 0,
        standardizedCount: 0,
        cleanCount: previousMonth.length,
        qualityScore: '100.0'
      },
      current: currentMonth._cleaningStats || {
        originalCount: currentMonth.length,
        removedCount: 0,
        standardizedCount: 0,
        cleanCount: currentMonth.length,
        qualityScore: '100.0'
      }
    };

    // Remove the _cleaningStats property from the arrays
    delete previousMonth._cleaningStats;
    delete currentMonth._cleaningStats;

    console.log(`🔍 Checking for v_score column...`);
    const hasVScore = previousMonth.length > 0 && previousMonth[0].hasOwnProperty('v_score');
    console.log(`📊 Has V Score: ${hasVScore}`);
    
    if (previousMonth.length > 0) {
      const sampleColumns = Object.keys(previousMonth[0]);
      console.log(`📋 All columns in data:`, sampleColumns);
      console.log(`🔍 Looking for v_score in columns:`, sampleColumns.includes('v_score'));
      
      // Log first few v_score values
      const sampleVScores = previousMonth.slice(0, 3).map(row => row.v_score);
      console.log(`📊 Sample V Score values:`, sampleVScores);
    }

    // Apply V Score banding only if V Score column exists
    if (hasVScore) {
      console.log(`✅ Applying V Score banding...`);
      previousMonth = this.applyVScoreBanding(previousMonth);
      currentMonth = this.applyVScoreBanding(currentMonth);
    } else {
      console.log(`⚠️ No V Score column found, skipping banding`);
    }

    // Auto-detect all categorical columns across both datasets
    const combinedData = [...previousMonth, ...currentMonth];
    const distinctValues = this.getDistinctValues(combinedData);

    // If V Score banding was applied, make sure v_score_band is included in distinct values
    if (hasVScore && combinedData.length > 0 && combinedData[0].hasOwnProperty('v_score_band')) {
      console.log(`📊 Adding v_score_band to categorical columns`);
      const vScoreBandValues = [...new Set(
        combinedData
          .map(row => row.v_score_band)
          .filter(value => value !== null && value !== undefined && value !== '')
      )].sort();
      distinctValues.v_score_band = vScoreBandValues;
      console.log(`✅ V Score Band values:`, vScoreBandValues);
    }

    // Get available categorical columns for user selection
    const availableColumns = Object.keys(distinctValues);
    console.log(`📋 Final available columns for analysis:`, availableColumns);

    return {
      previousMonth,
      currentMonth,
      distinctValues,
      summary: this.getSummaryStats({ previousMonth, currentMonth }),
      availableColumns,
      hasVScore,
      cleaningStats // Include cleaning statistics
    };
  }
}

module.exports = new DataProcessor();

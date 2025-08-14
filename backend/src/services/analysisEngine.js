const _ = require('lodash');

class AnalysisEngine {


  /**
   * Helper method to filter data based on conditions
   */
  filterData(data, filter) {
    return data.filter(row => {
      return Object.entries(filter).every(([key, value]) => {
        return row[key] === value;
      });
    });
  }

  /**
   * Get distinct values for a specific factor
   */
  getDistinctValuesForFactor(data, factor) {
    console.log(`🔍 getDistinctValuesForFactor: Factor="${factor}", Data length=${data.length}`);
    
    const values = data.map(row => row[factor]);
    const filteredValues = values.filter(value => value !== null && value !== undefined);
    const uniqueValues = [...new Set(filteredValues)].sort();
    
    console.log(`  - Total values: ${values.length}`);
    console.log(`  - Non-null values: ${filteredValues.length}`);
    console.log(`  - Unique values found: ${uniqueValues.length}`);
    console.log(`  - Values: ${uniqueValues.join(', ')}`);
    
    // Sample first few raw values to understand data
    if (values.length > 0) {
      console.log(`  - Sample raw values (first 5): ${values.slice(0, 5).map(v => `"${v}"`).join(', ')}`);
    }
    
    return uniqueValues;
  }

  /**
   * Calculate weighted ROI for a dataset
   */
  calculateWeightedROI(data) {
    if (!data || data.length === 0) {
      console.log('🔍 calculateWeightedROI: No data provided, returning 0');
      return 0;
    }

    console.log(`\n🔍 === WEIGHTED ROI CALCULATION START ===`);
    console.log(`🔍 Processing ${data.length} records`);
    
    // Group data by categories to understand segments
    const segments = {};
    data.forEach(row => {
      // Try to identify segments by contract_type or other categorical fields
      const segmentKey = row.contract_type || row.tier || row.product || 'unknown';
      if (!segments[segmentKey]) {
        segments[segmentKey] = {
          count: 0,
          totalAmount: 0,
          weightedROI: 0,
          avgROI: 0
        };
      }
      segments[segmentKey].count++;
      segments[segmentKey].totalAmount += row.total_loan_amount || 0;
      segments[segmentKey].weightedROI += (row.total_loan_amount || 0) * (row.roi || 0);
    });

    // Calculate average ROI for each segment
    Object.keys(segments).forEach(key => {
      if (segments[key].totalAmount > 0) {
        segments[key].avgROI = segments[key].weightedROI / segments[key].totalAmount;
      }
    });

    console.log('🔍 Data Segments Found:');
    Object.entries(segments).forEach(([key, seg]) => {
      console.log(`  📊 ${key}: ${seg.count} records, Amount: ${seg.totalAmount.toFixed(2)}, Avg ROI: ${(seg.avgROI * 100).toFixed(4)}%`);
    });

    // Sample first few records to understand data format
    const sampleRecords = data.slice(0, 3);
    console.log('🔍 Sample records:', sampleRecords.map(row => ({
      total_loan_amount: row.total_loan_amount,
      roi: row.roi,
      roi_type: typeof row.roi,
      roi_as_percent: (row.roi * 100).toFixed(4) + '%'
    })));

    // Calculate with detailed logging
    let runningTotal = 0;
    let detailedLog = [];
    
    const totalWeightedROI = data.reduce((sum, row, index) => {
      const amount = row.total_loan_amount || 0;
      const roi = row.roi || 0;
      const weighted = amount * roi;
      runningTotal = sum + weighted;
      
      if (index < 10) { // Log first 10 calculations
        detailedLog.push({
          index,
          amount: amount.toFixed(2),
          roi: roi.toFixed(6),
          roi_percent: (roi * 100).toFixed(4) + '%',
          weighted: weighted.toFixed(2),
          runningTotal: runningTotal.toFixed(2)
        });
      }
      
      return runningTotal;
    }, 0);

    console.log('🔍 First 10 detailed calculations:');
    console.table(detailedLog);

    const totalAmount = data.reduce((sum, row) => {
      return sum + (row.total_loan_amount || 0);
    }, 0);

    const finalROI = totalAmount > 0 ? totalWeightedROI / totalAmount : 0;

    console.log(`\n🔍 === FINAL CALCULATION ===`);
    console.log(`  - Total Weighted ROI (Σ amount × roi): ${totalWeightedROI.toFixed(4)}`);
    console.log(`  - Total Amount (Σ amount): ${totalAmount.toFixed(2)}`);
    console.log(`  - Final ROI (weighted/total): ${finalROI.toFixed(6)}`);
    console.log(`  - Final ROI (as %): ${(finalROI * 100).toFixed(4)}%`);
    console.log(`  - Final ROI (as basis points): ${(finalROI * 10000).toFixed(2)} bps`);
    console.log(`🔍 === WEIGHTED ROI CALCULATION END ===\n`);

    return finalROI;
  }

  /**
   * Get total amount for a dataset
   */
  getTotalAmount(data) {
    return data.reduce((sum, row) => sum + (row.total_loan_amount || 0), 0);
  }

  /**
   * Calculate total ROI change between datasets
   */
  calculateTotalROIChange(previousData, currentData) {
    const prevROI = this.calculateWeightedROI(previousData);
    const currentROI = this.calculateWeightedROI(currentData);
    return currentROI - prevROI;
  }

  /**
   * Count total nodes in tree
   */
  countNodes(tree) {
    if (!tree) return 0;
    
    let count = 0;
    const traverse = (nodes) => {
      if (!nodes) return;
      count += nodes.length;
      nodes.forEach(node => {
        if (node.children) {
          traverse(node.children);
        }
      });
    };
    
    traverse(tree);
    return count;
  }

  /**
   * Get maximum depth of tree
   */
  getTreeDepth(tree) {
    if (!tree) return 0;
    
    const getDepth = (nodes) => {
      if (!nodes || nodes.length === 0) return 0;
      
      let maxDepth = 1;
      nodes.forEach(node => {
        if (node.children) {
          maxDepth = Math.max(maxDepth, 1 + getDepth(node.children));
        }
      });
      
      return maxDepth;
    };
    
    return getDepth(tree);
  }

  /**
   * Export tree data to tabular format
   */
  exportTreeToTable(tree, analysisType) {
    const rows = [];
    
    const traverse = (nodes, path = [], depth = 0) => {
      if (!nodes) return;
      
      nodes.forEach(node => {
        const currentPath = [...path, `${node.factor}:${node.value}`];
        
        rows.push({
          depth,
          path: currentPath.join(' → '),
          factor: node.factor,
          value: node.value,
          previousROI: node.metrics.previousROI?.toFixed(4) || '0.0000',
          currentROI: node.metrics.currentROI?.toFixed(4) || '0.0000',
          roiChange: node.metrics.roiChange?.toFixed(4) || '0.0000',
          roiChangeBps: node.metrics.roiChangeBps?.toFixed(2) || '0.00',
          previousAmount: node.metrics.previousAmount?.toLocaleString() || '0',
          currentAmount: node.metrics.currentAmount?.toLocaleString() || '0',
          previousCount: node.metrics.previousCount || 0,
          currentCount: node.metrics.currentCount || 0
        });

        if (node.children) {
          traverse(node.children, currentPath, depth + 1);
        }
      });
    };
    
    traverse(tree);
    
    return {
      analysisType,
      timestamp: new Date().toISOString(),
      data: rows
    };
  }

  // ===============================================================
  // V2 METHODS WITH IMPACT DECOMPOSITION - START
  // ===============================================================

  /**
   * Perform V2 User-Priority analysis with impact decomposition
   * @param {Object} data - Processed data
   * @param {Array} factorOrder - User-defined factor order
   * @param {string} targetVariable - Target variable for analysis
   * @returns {Object} Enhanced analysis results with yield/distribution impact
   */
  performUserPriorityAnalysisV2(data, factorOrder, targetVariable = 'roi') {
    const { previousMonth, currentMonth } = data;
    
    try {
      console.log('🚀 Starting V2 User-Priority Analysis with Impact Decomposition');
      
      // Build enhanced tree with impact decomposition
      const tree = this.buildUserPriorityTreeV2(
        previousMonth, 
        currentMonth, 
        factorOrder, 
        targetVariable
      );

      // Calculate impact summary
      const impactSummary = this.calculateImpactSummaryV2(tree);

      return {
        analysisType: 'user-priority',
        version: 'v2',
        targetVariable,
        factorOrder,
        tree,
        impactSummary,
        metadata: {
          totalNodes: this.countNodes(tree),
          maxDepth: this.getTreeDepth(tree),
          totalROIChange: this.calculateTotalROIChange(previousMonth, currentMonth) * 10000,
          algorithm: 'enhanced-impact-decomposition'
        }
      };
    } catch (error) {
      throw new Error(`V2 User-Priority analysis failed: ${error.message}`);
    }
  }

  /**
   * Perform V2 Auto-Max Split analysis with enhanced statistical factor selection
   * @param {Object} data - Processed data
   * @param {string} targetVariable - Target variable for analysis
   * @param {Array} availableFactors - Optional array of factors to restrict analysis to
   * @returns {Object} Enhanced analysis results with impact decomposition
   */
  performAutoMaxSplitAnalysisV2(data, targetVariable = 'roi', availableFactors = null) {
    const { previousMonth, currentMonth } = data;
    
    try {
      console.log('🚀 Starting V2 Auto-Max Split Analysis with Impact Decomposition');
      
      // Build enhanced tree using total impact variance for factor selection
      const tree = this.buildAutoMaxSplitTreeV2(
        previousMonth, 
        currentMonth, 
        targetVariable, 
        0, 
        {}, 
        availableFactors
      );

      // Calculate enhanced feature importance based on total impact
      const featureImportance = this.calculateTotalImpactFeatureImportance(
        previousMonth, 
        currentMonth, 
        availableFactors
      );

      // Calculate impact summary
      const impactSummary = this.calculateImpactSummaryV2(tree);

      return {
        analysisType: 'auto-max-split',
        version: 'v2',
        targetVariable,
        tree,
        featureImportance,
        impactSummary,
        metadata: {
          totalNodes: this.countNodes(tree),
          maxDepth: this.getTreeDepth(tree),
          totalROIChange: this.calculateTotalROIChange(previousMonth, currentMonth) * 10000,
          algorithm: 'total-impact-variance-maximization'
        }
      };
    } catch (error) {
      throw new Error(`V2 Auto-Max Split analysis failed: ${error.message}`);
    }
  }

  /**
   * Calculate impact decomposition for a segment
   * Yield Impact = (Current Weighted ROI - Previous Weighted ROI) × Previous Distribution Weight
   * Distribution Impact = Previous Weighted ROI × (Current Distribution Weight - Previous Distribution Weight)
   * @param {Array} prevData - Previous period data for segment
   * @param {Array} currData - Current period data for segment
   * @param {Array} totalPrevData - Total previous period data
   * @param {Array} totalCurrData - Total current period data
   * @returns {Object} Impact decomposition metrics
   */
  calculateImpactDecomposition(prevData, currData, totalPrevData, totalCurrData) {
    // Calculate weighted ROIs for the segment
    const prevSegmentROI = this.calculateWeightedROI(prevData);
    const currSegmentROI = this.calculateWeightedROI(currData);
    
    // Calculate distribution weights (proportion of total portfolio)
    const prevTotalAmount = this.getTotalAmount(totalPrevData);
    const currTotalAmount = this.getTotalAmount(totalCurrData);
    const prevSegmentAmount = this.getTotalAmount(prevData);
    const currSegmentAmount = this.getTotalAmount(currData);
    
    const prevDistWeight = prevTotalAmount > 0 ? prevSegmentAmount / prevTotalAmount : 0;
    const currDistWeight = currTotalAmount > 0 ? currSegmentAmount / currTotalAmount : 0;
    
    // Impact decomposition
    const yieldImpact = (currSegmentROI - prevSegmentROI) * prevDistWeight;
    const distributionImpact = prevSegmentROI * (currDistWeight - prevDistWeight);
    const totalImpact = yieldImpact + distributionImpact;
    
    console.log(`📊 Impact Decomposition:
      Segment Previous ROI: ${(prevSegmentROI * 100).toFixed(4)}%
      Segment Current ROI: ${(currSegmentROI * 100).toFixed(4)}%
      Previous Distribution Weight: ${(prevDistWeight * 100).toFixed(2)}%
      Current Distribution Weight: ${(currDistWeight * 100).toFixed(2)}%
      Yield Impact: ${(yieldImpact * 10000).toFixed(2)} bps
      Distribution Impact: ${(distributionImpact * 10000).toFixed(2)} bps
      Total Impact: ${(totalImpact * 10000).toFixed(2)} bps`);
    
    return {
      yieldImpact,
      distributionImpact,
      totalImpact,
      yieldImpactBps: yieldImpact * 10000,
      distributionImpactBps: distributionImpact * 10000,
      totalImpactBps: totalImpact * 10000,
      prevDistWeight,
      currDistWeight
    };
  }

  /**
   * Build V2 User-Priority tree with impact decomposition
   */
  buildUserPriorityTreeV2(previousData, currentData, factorOrder, targetVariable, depth = 0, parentFilter = {}) {
    // Create root node if at depth 0
    if (depth === 0) {
      console.log('🔍 Building V2 ROOT node with Impact Decomposition');
      
      const rootPreviousROI = this.calculateWeightedROI(previousData);
      const rootCurrentROI = this.calculateWeightedROI(currentData);
      const rootROIChange = rootCurrentROI - rootPreviousROI;
      const rootROIChangeBps = rootROIChange * 10000;
      
      // For root, total impact = ROI change (no decomposition needed)
      const rootNode = {
        factor: 'root',
        value: 'Portfolio ROI',
        filter: {},
        metrics: {
          previousROI: rootPreviousROI,
          currentROI: rootCurrentROI,
          roiChange: rootROIChange,
          roiChangeBps: rootROIChangeBps,
          // Impact decomposition for root
          yieldImpact: rootROIChange,
          distributionImpact: 0, // No distribution impact at root
          totalImpact: rootROIChange,
          yieldImpactBps: rootROIChangeBps,
          distributionImpactBps: 0,
          totalImpactBps: rootROIChangeBps,
          percentOnParent: null, // Root has no parent
          percentOnRoot: 100, // Root is 100% of itself
          // Existing metrics
          previousAmount: this.getTotalAmount(previousData),
          currentAmount: this.getTotalAmount(currentData),
          previousCount: previousData.length,
          currentCount: currentData.length
        },
        children: this.buildUserPriorityTreeLevelV2(
          previousData, 
          currentData, 
          factorOrder, 
          targetVariable, 
          0, 
          {},
          rootROIChange // Pass root impact for percentage calculations
        )
      };

      return [rootNode];
    }

    return null;
  }

  /**
   * Build V2 tree levels recursively with impact decomposition
   */
  buildUserPriorityTreeLevelV2(previousData, currentData, factorOrder, targetVariable, depth = 0, parentFilter = {}, rootImpact = 0, parentTotalImpact = null) {
    if (depth >= factorOrder.length) {
      return null;
    }

    const currentFactor = factorOrder[depth];
    
    // Filter data based on parent conditions
    const filteredPrevious = this.filterData(previousData, parentFilter);
    const filteredCurrent = this.filterData(currentData, parentFilter);

    // Calculate parent impact if not provided (for percentage calculations)
    if (parentTotalImpact === null) {
      // Calculate parent's own impact decomposition
      const parentImpacts = this.calculateImpactDecomposition(
        filteredPrevious,
        filteredCurrent,
        previousData, // Use full data for root-level distribution
        currentData
      );
      parentTotalImpact = parentImpacts.totalImpact;
    }

    // Get distinct values for current factor
    const distinctValues = this.getDistinctValuesForFactor(
      [...filteredPrevious, ...filteredCurrent], 
      currentFactor
    );

    const children = [];

    distinctValues.forEach(value => {
      const childFilter = { ...parentFilter, [currentFactor]: value };
      
      const childPrevious = this.filterData(filteredPrevious, { [currentFactor]: value });
      const childCurrent = this.filterData(filteredCurrent, { [currentFactor]: value });

      if (childPrevious.length > 0 || childCurrent.length > 0) {
        console.log(`🔍 Building V2 child node: ${currentFactor}=${value}`);
        
        // Calculate impact decomposition for this specific segment
        const impacts = this.calculateImpactDecomposition(
          childPrevious,
          childCurrent,
          previousData, // Use full portfolio data for distribution weights
          currentData
        );
        
        const prevROI = this.calculateWeightedROI(childPrevious);
        const currentROI = this.calculateWeightedROI(childCurrent);
        const roiChange = currentROI - prevROI;
        const roiChangeBps = roiChange * 10000;

        const child = {
          factor: currentFactor,
          value: value,
          filter: childFilter,
          metrics: {
            previousROI: prevROI,
            currentROI: currentROI,
            roiChange: roiChange,
            roiChangeBps: roiChangeBps,
            // Impact decomposition metrics - each node has its own independent calculation
            yieldImpact: impacts.yieldImpact,
            distributionImpact: impacts.distributionImpact,
            totalImpact: impacts.totalImpact,
            yieldImpactBps: impacts.yieldImpactBps,
            distributionImpactBps: impacts.distributionImpactBps,
            totalImpactBps: impacts.totalImpactBps,
            // Hierarchical impact percentages
            percentOnParent: parentTotalImpact !== 0 ? (impacts.totalImpact / parentTotalImpact) * 100 : 0,
            percentOnRoot: rootImpact !== 0 ? (impacts.totalImpact / rootImpact) * 100 : 0,
            // Existing metrics
            previousAmount: this.getTotalAmount(childPrevious),
            currentAmount: this.getTotalAmount(childCurrent),
            previousCount: childPrevious.length,
            currentCount: childCurrent.length
          },
          children: this.buildUserPriorityTreeLevelV2(
            previousData, 
            currentData, 
            factorOrder, 
            targetVariable, 
            depth + 1, 
            childFilter,
            rootImpact,
            impacts.totalImpact // Pass this node's impact as parent impact for its children
          )
        };

        children.push(child);
        
        console.log(`📊 Impact metrics for ${child.factor}=${child.value}:
          Total Impact: ${child.metrics.totalImpactBps.toFixed(2)} bps
          Yield Impact: ${child.metrics.yieldImpactBps.toFixed(2)} bps
          Distribution Impact: ${child.metrics.distributionImpactBps.toFixed(2)} bps
          % on Parent: ${child.metrics.percentOnParent.toFixed(2)}%
          % on Root: ${child.metrics.percentOnRoot.toFixed(2)}%`);
      }
    });

    // Sort children by absolute total impact
    children.sort((a, b) => Math.abs(b.metrics.totalImpactBps) - Math.abs(a.metrics.totalImpactBps));

    return children.length > 0 ? children : null;
  }

  /**
   * Build V2 Auto-Max Split tree using total impact variance for factor selection
   */
  buildAutoMaxSplitTreeV2(previousData, currentData, targetVariable, depth = 0, parentFilter = {}, availableFactors = null) {
    // Create root node if at depth 0
    if (depth === 0) {
      console.log('🔍 Building V2 AUTO ROOT node with Impact Decomposition');
      
      const rootPreviousROI = this.calculateWeightedROI(previousData);
      const rootCurrentROI = this.calculateWeightedROI(currentData);
      const rootROIChange = rootCurrentROI - rootPreviousROI;
      const rootROIChangeBps = rootROIChange * 10000;

      const rootNode = {
        factor: 'root',
        value: 'Portfolio ROI',
        filter: {},
        metrics: {
          previousROI: rootPreviousROI,
          currentROI: rootCurrentROI,
          roiChange: rootROIChange,
          roiChangeBps: rootROIChangeBps,
          // Impact decomposition for root
          yieldImpact: rootROIChange,
          distributionImpact: 0,
          totalImpact: rootROIChange,
          yieldImpactBps: rootROIChangeBps,
          distributionImpactBps: 0,
          totalImpactBps: rootROIChangeBps,
          percentOnParent: null,
          percentOnRoot: 100,
          // Existing metrics
          previousAmount: this.getTotalAmount(previousData),
          currentAmount: this.getTotalAmount(currentData),
          previousCount: previousData.length,
          currentCount: currentData.length
        },
        children: this.buildAutoMaxSplitTreeLevelV2(
          previousData, 
          currentData, 
          targetVariable, 
          0, 
          {}, 
          availableFactors,
          rootROIChange
        )
      };

      return [rootNode];
    }

    return null;
  }

  /**
   * Build V2 auto-max split tree levels with total impact variance selection
   */
  buildAutoMaxSplitTreeLevelV2(previousData, currentData, targetVariable, depth = 0, parentFilter = {}, availableFactors = null, rootImpact = 0, parentTotalImpact = null) {
    if (depth >= 4) return null; // Max depth limit

    // Filter data based on parent conditions
    const filteredPrevious = this.filterData(previousData, parentFilter);
    const filteredCurrent = this.filterData(currentData, parentFilter);

    if (filteredPrevious.length < 10 || filteredCurrent.length < 10) return null; // Min samples

    // Calculate parent impact if not provided (for percentage calculations)
    if (parentTotalImpact === null) {
      // Calculate parent's own impact decomposition
      const parentImpacts = this.calculateImpactDecomposition(
        filteredPrevious,
        filteredCurrent,
        previousData, // Use full data for root-level distribution
        currentData
      );
      parentTotalImpact = parentImpacts.totalImpact;
    }

    // Find best factor based on total impact variance
    const bestSplit = this.findBestSplitByTotalImpact(
      filteredPrevious, 
      filteredCurrent, 
      availableFactors
    );
    
    if (!bestSplit) return null;

    const children = [];
    const distinctValues = this.getDistinctValuesForFactor(
      [...filteredPrevious, ...filteredCurrent], 
      bestSplit.factor
    );

    distinctValues.forEach(value => {
      const childFilter = { ...parentFilter, [bestSplit.factor]: value };
      
      const childPrevious = this.filterData(filteredPrevious, { [bestSplit.factor]: value });
      const childCurrent = this.filterData(filteredCurrent, { [bestSplit.factor]: value });

      if (childPrevious.length > 0 || childCurrent.length > 0) {
        console.log(`🔍 Building V2 Auto-Max child node: ${bestSplit.factor}=${value}`);
        
        // Calculate impact decomposition for this specific segment
        // Use full portfolio data for distribution weights (same as User-Priority fix)
        const impacts = this.calculateImpactDecomposition(
          childPrevious,
          childCurrent,
          previousData, // Use full portfolio data for distribution weights
          currentData
        );
        
        const prevROI = this.calculateWeightedROI(childPrevious);
        const currentROI = this.calculateWeightedROI(childCurrent);
        const roiChange = currentROI - prevROI;
        const roiChangeBps = roiChange * 10000;

        const child = {
          factor: bestSplit.factor,
          value: value,
          filter: childFilter,
          metrics: {
            previousROI: prevROI,
            currentROI: currentROI,
            roiChange: roiChange,
            roiChangeBps: roiChangeBps,
            // Impact decomposition metrics - each node has its own independent calculation
            yieldImpact: impacts.yieldImpact,
            distributionImpact: impacts.distributionImpact,
            totalImpact: impacts.totalImpact,
            yieldImpactBps: impacts.yieldImpactBps,
            distributionImpactBps: impacts.distributionImpactBps,
            totalImpactBps: impacts.totalImpactBps,
            // Hierarchical impact percentages
            percentOnParent: parentTotalImpact !== 0 ? (impacts.totalImpact / parentTotalImpact) * 100 : 0,
            percentOnRoot: rootImpact !== 0 ? (impacts.totalImpact / rootImpact) * 100 : 0,
            // Existing metrics
            previousAmount: this.getTotalAmount(childPrevious),
            currentAmount: this.getTotalAmount(childCurrent),
            previousCount: childPrevious.length,
            currentCount: childCurrent.length
          },
          children: this.buildAutoMaxSplitTreeLevelV2(
            previousData, 
            currentData, 
            targetVariable, 
            depth + 1, 
            childFilter,
            availableFactors,
            rootImpact,
            impacts.totalImpact // Pass this node's impact as parent impact for its children
          )
        };

        children.push(child);
        
        console.log(`📊 Auto-Max impact metrics for ${child.factor}=${child.value}:
          Total Impact: ${child.metrics.totalImpactBps.toFixed(2)} bps
          Yield Impact: ${child.metrics.yieldImpactBps.toFixed(2)} bps
          Distribution Impact: ${child.metrics.distributionImpactBps.toFixed(2)} bps
          % on Parent: ${child.metrics.percentOnParent.toFixed(2)}%
          % on Root: ${child.metrics.percentOnRoot.toFixed(2)}%`);
      }
    });

    // Sort children by absolute total impact
    children.sort((a, b) => Math.abs(b.metrics.totalImpactBps) - Math.abs(a.metrics.totalImpactBps));

    return children.length > 0 ? children : null;
  }

  /**
   * Find the best split based on total impact variance
   */
  findBestSplitByTotalImpact(previousData, currentData, availableFactors = null) {
    // Auto-detect available factors if not provided
    if (!availableFactors) {
      const combinedData = [...previousData, ...currentData];
      if (combinedData.length === 0) return null;

      const excludeColumns = ['total_loan_amount', 'roi', 'v_score'];
      availableFactors = Object.keys(combinedData[0]).filter(factor => 
        !excludeColumns.includes(factor) && 
        combinedData.some(row => row[factor] !== undefined && row[factor] !== null)
      );
    }

    let bestSplit = null;
    let bestVariance = 0;

    availableFactors.forEach(factor => {
      const variance = this.calculateTotalImpactVariance(previousData, currentData, factor);
      if (variance > bestVariance) {
        bestVariance = variance;
        bestSplit = { factor, variance };
      }
    });

    return bestSplit;
  }

  /**
   * Calculate total impact variance for a factor
   */
  calculateTotalImpactVariance(previousData, currentData, factor) {
    const distinctValues = this.getDistinctValuesForFactor([...previousData, ...currentData], factor);
    const impacts = [];
    
    distinctValues.forEach(value => {
      const prevSubset = previousData.filter(row => row[factor] === value);
      const currSubset = currentData.filter(row => row[factor] === value);
      
      if (prevSubset.length > 0 || currSubset.length > 0) {
        const impactDecomp = this.calculateImpactDecomposition(
          prevSubset,
          currSubset,
          previousData,
          currentData
        );
        impacts.push(impactDecomp.totalImpact);
      }
    });
    
    if (impacts.length === 0) return 0;
    
    // Calculate variance of total impacts
    const mean = impacts.reduce((sum, impact) => sum + impact, 0) / impacts.length;
    const variance = impacts.reduce((sum, impact) => {
      const diff = impact - mean;
      return sum + diff * diff;
    }, 0) / impacts.length;
    
    return variance;
  }

  /**
   * Calculate feature importance based on total impact
   */
  calculateTotalImpactFeatureImportance(previousData, currentData, availableFactors = null) {
    // Use provided factors or auto-detect available ones
    if (!availableFactors) {
      const combinedData = [...previousData, ...currentData];
      if (combinedData.length === 0) {
        return {};
      }
      
      // Auto-detect factors from data, excluding numeric columns
      const excludeColumns = ['total_loan_amount', 'roi', 'v_score'];
      availableFactors = Object.keys(combinedData[0]).filter(factor => 
        !excludeColumns.includes(factor) && 
        combinedData.some(row => row[factor] !== undefined && row[factor] !== null)
      );
    }

    const importance = {};
    let totalImportance = 0;

    availableFactors.forEach(factor => {
      const variance = this.calculateTotalImpactVariance(previousData, currentData, factor);
      importance[factor] = Math.max(0, variance);
      totalImportance += importance[factor];
    });

    // Normalize to sum to 1
    if (totalImportance > 0) {
      Object.keys(importance).forEach(key => {
        importance[key] = importance[key] / totalImportance;
      });
    } else {
      // Fallback if no variance
      const equalWeight = 1 / availableFactors.length;
      availableFactors.forEach(factor => {
        importance[factor] = equalWeight;
      });
    }

    return importance;
  }

  /**
   * Calculate impact summary for V2 tree
   */
  calculateImpactSummaryV2(tree) {
    let totalYieldImpact = 0;
    let totalDistributionImpact = 0;
    const factorContributions = {};
    
    const traverse = (nodes) => {
      if (!nodes) return;
      
      nodes.forEach(node => {
        if (node.factor !== 'root') {
          // Sum up impacts
          totalYieldImpact += node.metrics.yieldImpact || 0;
          totalDistributionImpact += node.metrics.distributionImpact || 0;
          
          // Track factor contributions
          if (!factorContributions[node.factor]) {
            factorContributions[node.factor] = {
              yieldImpact: 0,
              distributionImpact: 0,
              totalImpact: 0
            };
          }
          
          factorContributions[node.factor].yieldImpact += node.metrics.yieldImpact || 0;
          factorContributions[node.factor].distributionImpact += node.metrics.distributionImpact || 0;
          factorContributions[node.factor].totalImpact += node.metrics.totalImpact || 0;
        }
        
        if (node.children) {
          traverse(node.children);
        }
      });
    };
    
    traverse(tree);
    
    return {
      totalYieldImpact,
      totalDistributionImpact,
      totalImpact: totalYieldImpact + totalDistributionImpact,
      totalYieldImpactBps: totalYieldImpact * 10000,
      totalDistributionImpactBps: totalDistributionImpact * 10000,
      totalImpactBps: (totalYieldImpact + totalDistributionImpact) * 10000,
      factorContributions
    };
  }

  // ===============================================================
  // V2 METHODS WITH IMPACT DECOMPOSITION - END
  // ===============================================================
}

module.exports = new AnalysisEngine();

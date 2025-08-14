// This file contains the V1 methods that have been removed from analysisEngine.js
// These methods are kept here as a backup but are no longer used in the application

/**
 * Perform User-Priority analysis with custom factor ordering (V1 - DEPRECATED)
 * @param {Object} data - Processed data
 * @param {Array} factorOrder - User-defined factor order
 * @param {string} targetVariable - Target variable for analysis
 * @returns {Object} Analysis results with decision tree
 */
function performUserPriorityAnalysis(data, factorOrder, targetVariable = 'roi') {
  const { previousMonth, currentMonth } = data;
  
  try {
    // Build hierarchical tree based on user-defined factor order
    const tree = this.buildUserPriorityTree(
      previousMonth, 
      currentMonth, 
      factorOrder, 
      targetVariable
    );

    return {
      analysisType: 'user-priority',
      targetVariable,
      factorOrder,
      tree,
      metadata: {
        totalNodes: this.countNodes(tree),
        maxDepth: this.getTreeDepth(tree),
        totalROIChange: this.calculateTotalROIChange(previousMonth, currentMonth) * 10000 // Convert to basis points
      }
    };
  } catch (error) {
    throw new Error(`User-Priority analysis failed: ${error.message}`);
  }
}

/**
 * Perform Auto-Max Split analysis using variance reduction algorithm (V1 - DEPRECATED)
 * @param {Object} data - Processed data
 * @param {string} targetVariable - Target variable for analysis
 * @param {Array} availableFactors - Optional array of factors to restrict analysis to
 * @returns {Object} Analysis results with optimized decision tree
 */
function performAutoMaxSplitAnalysis(data, targetVariable = 'roi', availableFactors = null) {
  const { previousMonth, currentMonth } = data;
  
  try {
    // Build tree using variance reduction approach
    const tree = this.buildAutoMaxSplitTree(previousMonth, currentMonth, targetVariable, 0, {}, availableFactors);

    // Calculate feature importance based on variance reduction
    const featureImportance = this.calculateVarianceFeatureImportance(previousMonth, currentMonth, availableFactors);

    return {
      analysisType: 'auto-max-split',
      targetVariable,
      tree,
      featureImportance,
      metadata: {
        totalNodes: this.countNodes(tree),
        maxDepth: this.getTreeDepth(tree),
        totalROIChange: this.calculateTotalROIChange(previousMonth, currentMonth) * 10000 // Convert to basis points
      }
    };
  } catch (error) {
    throw new Error(`Auto-Max Split analysis failed: ${error.message}`);
  }
}

/**
 * Format bytes into human readable format
 * @param {number} bytes 
 * @param {number} decimals 
 * @returns {string}
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format number with commas
 * @param {number} num 
 * @returns {string}
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString();
};

/**
 * Format percentage
 * @param {number} value 
 * @param {number} decimals 
 * @returns {string}
 */
export const formatPercentage = (value, decimals = 2) => {
  if (value === null || value === undefined) return '0%';
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Format basis points
 * @param {number} value 
 * @param {number} decimals 
 * @returns {string}
 */
export const formatBasisPoints = (value, decimals = 2) => {
  if (value === null || value === undefined) return '0 bps';
  return `${value.toFixed(decimals)} bps`;
};

/**
 * Format currency
 * @param {number} value 
 * @param {string} currency 
 * @returns {string}
 */
export const formatCurrency = (value, currency = 'USD') => {
  if (value === null || value === undefined) return '$0';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format amount in Indian currency (Crores/Lakhs)
 * @param {number} value 
 * @param {number} decimals 
 * @returns {string}
 */
export const formatIndianCurrency = (value, decimals = 2) => {
  if (value === null || value === undefined || value === 0) return '₹0';
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 10000000) { // 1 Crore = 10,000,000
    const crores = absValue / 10000000;
    return `${sign}₹${crores.toFixed(decimals)} Cr`;
  } else if (absValue >= 100000) { // 1 Lakh = 100,000
    const lakhs = absValue / 100000;
    return `${sign}₹${lakhs.toFixed(decimals)} L`;
  } else if (absValue >= 1000) {
    const thousands = absValue / 1000;
    return `${sign}₹${thousands.toFixed(decimals)} K`;
  }
  
  return `${sign}₹${absValue.toFixed(decimals)}`;
};

/**
 * Debounce function
 * @param {Function} func 
 * @param {number} wait 
 * @returns {Function}
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function
 * @param {Function} func 
 * @param {number} limit 
 * @returns {Function}
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Deep clone object
 * @param {any} obj 
 * @returns {any}
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

/**
 * Generate unique ID
 * @returns {string}
 */
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Capitalize first letter of string
 * @param {string} str 
 * @returns {string}
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Convert camelCase to Title Case
 * @param {string} str 
 * @returns {string}
 */
export const camelToTitle = (str) => {
  if (!str) return '';
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

/**
 * Convert snake_case to Title Case
 * @param {string} str 
 * @returns {string}
 */
export const snakeToTitle = (str) => {
  if (!str) return '';
  return str
    .split('_')
    .map(word => capitalize(word))
    .join(' ');
};

/**
 * Validate email format
 * @param {string} email 
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Download file from blob
 * @param {Blob} blob 
 * @param {string} filename 
 */
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Get file extension from filename
 * @param {string} filename 
 * @returns {string}
 */
export const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase();
};

/**
 * Check if value is numeric
 * @param {any} value 
 * @returns {boolean}
 */
export const isNumeric = (value) => {
  return !isNaN(value) && !isNaN(parseFloat(value));
};

/**
 * Safe JSON parse
 * @param {string} str 
 * @param {any} defaultValue 
 * @returns {any}
 */
export const safeJsonParse = (str, defaultValue = null) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return defaultValue;
  }
};

/**
 * Get color for ROI change value
 * @param {number} value 
 * @returns {string}
 */
export const getROIChangeColor = (value) => {
  if (value > 0) return '#4caf50'; // Green for positive
  if (value < 0) return '#f44336'; // Red for negative
  return '#757575'; // Gray for zero/neutral
};

/**
 * Format ROI change with appropriate color and sign
 * @param {number} value 
 * @param {boolean} showSign 
 * @returns {object}
 */
export const formatROIChange = (value, showSign = true) => {
  const color = getROIChangeColor(value);
  const sign = value > 0 ? '+' : '';
  const formattedValue = showSign ? `${sign}${formatBasisPoints(value)}` : formatBasisPoints(Math.abs(value));
  
  return {
    value: formattedValue,
    color,
    isPositive: value > 0,
    isNegative: value < 0,
    isNeutral: value === 0
  };
};

/**
 * Sort array of objects by key
 * @param {Array} array 
 * @param {string} key 
 * @param {string} order 
 * @returns {Array}
 */
export const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    const aValue = a[key];
    const bValue = b[key];
    
    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Group array by key
 * @param {Array} array 
 * @param {string} key 
 * @returns {object}
 */
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {});
};

/**
 * Calculate percentage change
 * @param {number} oldValue 
 * @param {number} newValue 
 * @returns {number}
 */
export const calculatePercentageChange = (oldValue, newValue) => {
  if (oldValue === 0) return newValue === 0 ? 0 : 100;
  return ((newValue - oldValue) / oldValue) * 100;
};

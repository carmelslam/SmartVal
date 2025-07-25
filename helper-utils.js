// 🛠️ Helper Utilities - Shared functions to prevent circular dependencies
// Contains common utilities used across helper.js, security-manager.js, and webhook.js

console.log('🛠️ Loading helper utilities...');

// 🌐 Universal solution for JSON parsing with duplicate keys
export function parseJSONWithDuplicates(jsonString) {
  if (typeof jsonString !== 'string') {
    return jsonString; // Already parsed object
  }

  try {
    // Try standard JSON parse first (faster for valid JSON)
    return JSON.parse(jsonString);
  } catch {
    // Fallback: Handle duplicate keys by creating arrays
    const result = {};
    let braceCount = 0;
    let inString = false;
    let currentKey = '';
    let currentValue = '';
    let inKey = true;
    let escapeNext = false;

    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString[i];
      
      if (escapeNext) {
        escapeNext = false;
        if (inKey) currentKey += char;
        else currentValue += char;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        if (inKey) currentKey += char;
        else currentValue += char;
        continue;
      }
      
      if (char === '"' && (i === 0 || jsonString[i-1] !== '\\')) {
        inString = !inString;
      }
      
      if (!inString) {
        if (char === '{') braceCount++;
        else if (char === '}') braceCount--;
        else if (char === ':' && braceCount === 1 && inKey) {
          inKey = false;
          currentKey = currentKey.replace(/"/g, '').trim();
          continue;
        }
        else if (char === ',' && braceCount === 1) {
          if (currentKey && currentValue) {
            try {
              const parsedValue = JSON.parse(currentValue.trim());
              if (result[currentKey]) {
                if (Array.isArray(result[currentKey])) {
                  result[currentKey].push(parsedValue);
                } else {
                  result[currentKey] = [result[currentKey], parsedValue];
                }
              } else {
                result[currentKey] = parsedValue;
              }
            } catch {
              result[currentKey] = currentValue.trim();
            }
          }
          currentKey = '';
          currentValue = '';
          inKey = true;
          continue;
        }
      }
      
      if (inKey) currentKey += char;
      else currentValue += char;
    }
    
    // Handle last key-value pair
    if (currentKey && currentValue) {
      try {
        const parsedValue = JSON.parse(currentValue.trim());
        result[currentKey.replace(/"/g, '').trim()] = parsedValue;
      } catch {
        result[currentKey.replace(/"/g, '').trim()] = currentValue.trim();
      }
    }
    
    return result;
  }
}

// 🔄 Data validation and sanitization utilities
export const DataUtils = {
  /**
   * Safely get nested object property
   */
  safeGet(obj, path, defaultValue = null) {
    if (!obj || typeof path !== 'string') return defaultValue;
    
    return path.split('.').reduce((current, key) => {
      return (current && current[key] !== undefined) ? current[key] : defaultValue;
    }, obj);
  },

  /**
   * Safely set nested object property
   */
  safeSet(obj, path, value) {
    if (!obj || typeof path !== 'string') return obj;
    
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    return obj;
  },

  /**
   * Clean and validate string input
   */
  sanitizeString(str, maxLength = 1000) {
    if (typeof str !== 'string') return '';
    return str.trim().substring(0, maxLength);
  },

  /**
   * Validate and parse numeric input
   */
  sanitizeNumber(value, defaultValue = 0) {
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  },

  /**
   * Deep clone object to prevent reference issues
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    return cloned;
  },

  /**
   * Merge objects with conflict resolution
   */
  mergeObjects(target, source, conflictStrategy = 'prefer_source') {
    const merged = this.deepClone(target);
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (merged[key] === undefined) {
          merged[key] = this.deepClone(source[key]);
        } else if (conflictStrategy === 'prefer_source') {
          merged[key] = this.deepClone(source[key]);
        } else if (conflictStrategy === 'prefer_target') {
          // Keep existing value
        } else if (conflictStrategy === 'merge' && typeof merged[key] === 'object' && typeof source[key] === 'object') {
          merged[key] = this.mergeObjects(merged[key], source[key], conflictStrategy);
        }
      }
    }
    
    return merged;
  }
};

// 🕒 Timestamp utilities
export const TimeUtils = {
  /**
   * Get current timestamp in ISO format
   */
  getCurrentTimestamp() {
    return new Date().toISOString();
  },

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp, format = 'datetime') {
    const date = new Date(timestamp);
    
    switch (format) {
      case 'date':
        return date.toLocaleDateString('he-IL');
      case 'time':
        return date.toLocaleTimeString('he-IL');
      case 'datetime':
        return date.toLocaleString('he-IL');
      default:
        return date.toISOString();
    }
  },

  /**
   * Check if timestamp is within time range
   */
  isWithinTimeRange(timestamp, minutes) {
    const now = new Date();
    const target = new Date(timestamp);
    const diffMinutes = (now - target) / (1000 * 60);
    return diffMinutes <= minutes;
  }
};

// 🔄 Session storage utilities
export const StorageUtils = {
  /**
   * Safely get from sessionStorage with JSON parsing
   */
  getSession(key, defaultValue = null) {
    try {
      const value = sessionStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error(`Error reading from sessionStorage[${key}]:`, error);
      return defaultValue;
    }
  },

  /**
   * Safely set to sessionStorage with JSON stringification
   */
  setSession(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to sessionStorage[${key}]:`, error);
      return false;
    }
  },

  /**
   * Remove from sessionStorage
   */
  removeSession(key) {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from sessionStorage[${key}]:`, error);
      return false;
    }
  },

  /**
   * Check if sessionStorage key exists
   */
  hasSession(key) {
    return sessionStorage.getItem(key) !== null;
  }
};

// 🎯 Field mapping utilities
export const MappingUtils = {
  /**
   * Map field value to helper path with fallbacks
   */
  mapFieldToHelper(fieldMapping, sourceData, fieldId, value) {
    if (!fieldMapping[fieldId]) return null;
    
    const mapping = fieldMapping[fieldId];
    const helperKey = mapping.helperKey;
    
    if (!helperKey) return null;
    
    // Support both string and object mapping
    if (typeof mapping === 'string') {
      return { path: mapping, value };
    }
    
    return { path: helperKey, value };
  },

  /**
   * Extract value from nested helper structure
   */
  extractHelperValue(helper, fieldMapping, fieldId) {
    if (!fieldMapping[fieldId]) return null;
    
    const mapping = fieldMapping[fieldId];
    const paths = Array.isArray(mapping.helperKey) ? mapping.helperKey : [mapping.helperKey];
    
    for (const path of paths) {
      const value = DataUtils.safeGet(helper, path);
      if (value !== null && value !== undefined && value !== '') {
        return value;
      }
    }
    
    return null;
  }
};

// 🧮 Calculation utilities
export const CalcUtils = {
  /**
   * Calculate percentage of a base value
   */
  calculatePercentage(value, base, precision = 2) {
    if (!base || base === 0) return 0;
    return Number(((value / base) * 100).toFixed(precision));
  },

  /**
   * Apply percentage to base value
   */
  applyPercentage(base, percentage, precision = 2) {
    const result = base * (percentage / 100);
    return Number(result.toFixed(precision));
  },

  /**
   * Sum array of numeric values
   */
  sumArray(values) {
    return values.reduce((sum, val) => sum + (DataUtils.sanitizeNumber(val)), 0);
  },

  /**
   * Calculate vehicle value with adjustments (from todo.md calculation logic)
   */
  calculateVehicleValue(basePrice, adjustments) {
    if (typeof basePrice !== 'number' || isNaN(basePrice)) {
      throw new Error('Invalid base price');
    }

    const safeAdj = (adj, current) => {
      if (!adj) return 0;
      if (adj.percent && typeof adj.percent === 'number') {
        return current * (adj.percent / 100);
      }
      if (adj.fixed && typeof adj.fixed === 'number') {
        return adj.fixed;
      }
      return 0;
    };

    // Step 1: Independent adjustments (Features + Registration) using Base Price
    const featuresAdj = safeAdj(adjustments.features, basePrice);
    const registrationAdj = safeAdj(adjustments.registration, basePrice);

    const grossValue = basePrice + featuresAdj + registrationAdj;

    // Step 2: Sequential adjustments (Ownership → Mileage → Number of Owners)
    let currentValue = grossValue;

    for (const key of ['ownershipType', 'mileage', 'numOwners']) {
      const adj = adjustments[key];
      if (!adj) continue; // skip if missing or zero
      const adjAmount = safeAdj(adj, currentValue);
      currentValue += adjAmount; // apply sequentially
    }

    return Math.round(currentValue); // round to nearest whole currency unit
  }
};

console.log('✅ Helper utilities loaded successfully');
// 🔧 WEBHOOK DATA CONCATENATION FIX
// This file contains the fix for the issue where clean JSON from Make.com
// is getting corrupted into concatenated values like "71818601 71818601"

// Problem: When Make.com sends array data with duplicate entries,
// the Object.assign in webhook.js merges them incorrectly

// Solution: Enhanced data processing that detects and prevents duplication

/**
 * Enhanced webhook data processor that prevents value concatenation
 * @param {Array|Object} data - Raw webhook data from Make.com
 * @returns {Object} Processed data without duplicates
 */
export function processWebhookDataSafely(data) {
  console.log('🔧 Processing webhook data safely to prevent concatenation');
  
  let actualData = {};
  
  // Handle array format data
  if (Array.isArray(data) && data.length > 0) {
    console.log(`📥 Processing array with ${data.length} items`);
    
    // Method 1: Check for standard Make.com format with 'value' field
    const firstItem = data[0];
    if (firstItem && firstItem.value) {
      console.log('📦 Found Make.com standard format with value field');
      
      if (typeof firstItem.value === 'string') {
        try {
          actualData = JSON.parse(firstItem.value);
          console.log('✅ Extracted nested JSON from Make.com array');
        } catch (e) {
          actualData = { Body: firstItem.value };
        }
      } else if (typeof firstItem.value === 'object') {
        actualData = firstItem.value;
      }
    }
    
    // Method 2: Enhanced direct array format with duplicate detection
    else if (firstItem && !firstItem.value && typeof firstItem === 'object') {
      console.log('📦 Processing direct array format with duplicate detection');
      
      // Create a map to track unique values for each field
      const fieldValues = new Map();
      
      // Process each item in the array
      data.forEach((item, index) => {
        if (item && typeof item === 'object') {
          Object.entries(item).forEach(([key, value]) => {
            // Skip null, undefined, or empty values
            if (value === null || value === undefined || value === '') {
              return;
            }
            
            // If this field hasn't been seen before, add it
            if (!fieldValues.has(key)) {
              fieldValues.set(key, value);
              console.log(`✅ Added field ${key}: ${value}`);
            } 
            // If we've seen this field before, check if it's the same value
            else {
              const existingValue = fieldValues.get(key);
              const valueStr = String(value).trim();
              const existingStr = String(existingValue).trim();
              
              // Only update if the new value is different and not a duplicate
              if (existingStr !== valueStr) {
                // Check if the new value contains the existing value (concatenation)
                if (valueStr.includes(existingStr) && valueStr !== existingStr) {
                  console.warn(`⚠️ Detected concatenated value for ${key}: "${valueStr}" contains "${existingStr}"`);
                  // Keep the shorter, original value
                  console.log(`🔧 Keeping original value: ${existingStr}`);
                } 
                // If values are completely different, log a warning
                else {
                  console.warn(`⚠️ Conflicting values for ${key}: "${existingStr}" vs "${valueStr}"`);
                  // In case of conflict, prefer the first non-empty value
                  if (existingStr.length === 0) {
                    fieldValues.set(key, value);
                  }
                }
              } else {
                console.log(`⏭️ Skipping duplicate value for ${key}: ${value}`);
              }
            }
          });
        }
      });
      
      // Convert map back to object
      actualData = Object.fromEntries(fieldValues);
      console.log('✅ Processed array data without duplicates:', actualData);
    }
    
    // Method 3: Body field array format
    else if (data.some(item => item && item.Body)) {
      console.log('📦 Found Body field array format');
      const bodyItem = data.find(item => item && item.Body);
      if (bodyItem) {
        actualData = bodyItem;
      }
    }
    
    // Fallback: use first item if nothing else works
    else {
      console.log('📦 Using first item from array as fallback');
      actualData = firstItem || {};
    }
  }
  
  // Handle single object
  else if (typeof data === 'object' && data !== null) {
    actualData = data;
  }
  
  // Handle string data
  else if (typeof data === 'string') {
    actualData = { Body: data };
  }
  
  return actualData;
}

/**
 * Validate webhook data for common issues
 * @param {Object} data - Processed webhook data
 * @returns {Object} Validation result
 */
export function validateWebhookData(data) {
  const issues = [];
  const warnings = [];
  
  // Check for concatenated patterns in string values
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string') {
      // Check for duplicate values pattern (e.g., "71818601 71818601")
      const words = value.split(/\s+/);
      const duplicates = words.filter((word, index) => 
        words.indexOf(word) !== index && word.length > 3
      );
      
      if (duplicates.length > 0) {
        issues.push({
          field: key,
          issue: 'duplicate_values',
          value: value,
          duplicates: [...new Set(duplicates)]
        });
      }
      
      // Check for field name contamination (e.g., "XТ4 סוג הדגם מספר דגם")
      const hebrewFieldNames = ['סוג הדגם', 'מספר דגם', 'יצרן', 'דגם', 'גימור'];
      const containsFieldName = hebrewFieldNames.some(name => value.includes(name));
      
      if (containsFieldName && value.split(' ').length > 3) {
        warnings.push({
          field: key,
          warning: 'field_name_in_value',
          value: value
        });
      }
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    summary: `Found ${issues.length} issues and ${warnings.length} warnings`
  };
}

/**
 * Clean concatenated values from webhook data
 * @param {Object} data - Raw webhook data
 * @returns {Object} Cleaned data
 */
export function cleanWebhookData(data) {
  const cleaned = {};
  
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string') {
      // Remove duplicate words/numbers
      const words = value.split(/\s+/);
      const unique = [];
      const seen = new Set();
      
      words.forEach(word => {
        const normalized = word.trim();
        if (normalized && !seen.has(normalized)) {
          seen.add(normalized);
          unique.push(word);
        }
      });
      
      // If we removed duplicates, use the cleaned version
      if (unique.length < words.length) {
        cleaned[key] = unique.join(' ');
        console.log(`🧹 Cleaned ${key}: "${value}" → "${cleaned[key]}"`);
      } else {
        cleaned[key] = value;
      }
    } else {
      cleaned[key] = value;
    }
  });
  
  return cleaned;
}

/**
 * Enhanced webhook processor to replace the problematic section in webhook.js
 * This should be integrated into the sendToWebhook function
 */
export function enhancedWebhookArrayProcessor(data) {
  // If not an array, return as-is
  if (!Array.isArray(data)) {
    return data;
  }
  
  console.log('🔧 Enhanced webhook array processing to prevent concatenation');
  
  // Process the array safely
  const processed = processWebhookDataSafely(data);
  
  // Validate the processed data
  const validation = validateWebhookData(processed);
  
  if (!validation.isValid) {
    console.warn('⚠️ Webhook data validation issues found:', validation.issues);
    // Clean the data if there are issues
    const cleaned = cleanWebhookData(processed);
    console.log('✅ Cleaned webhook data:', cleaned);
    return cleaned;
  }
  
  return processed;
}

// Export the main fix function that should be used in webhook.js
export default enhancedWebhookArrayProcessor;

// Example usage in webhook.js:
/*
// Replace lines 144-150 in webhook.js with:
else if (firstItem && !firstItem.value && typeof firstItem === 'object') {
  console.log('📦 Found Make.com direct array format');
  // Use the enhanced processor instead of Object.assign loop
  actualData = enhancedWebhookArrayProcessor(data);
  console.log('✅ Processed array data safely:', actualData);
}
*/
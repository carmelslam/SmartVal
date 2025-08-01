// 🔧 PHASE 1.3: DATA CONSISTENCY VALIDATION SERVICE
// Monitors and validates data consistency across sources
// Auto-corrects conflicts and provides debugging insights

console.log('🔍 Loading Data Validation Service - Phase 1.3');

(function() {
  'use strict';

  // Validation service configuration
  const VALIDATOR_CONFIG = {
    enableAutoCorrection: true,
    enableRealTimeMonitoring: true,
    enableDeepValidation: true,
    validationInterval: 5000, // 5 seconds
    debugMode: false,
    maxHistoryEntries: 100
  };

  // Validation history and statistics
  const validationHistory = [];
  const validationStats = {
    totalValidations: 0,
    inconsistenciesFound: 0,
    autoCorrections: 0,
    validationErrors: 0,
    lastValidation: null
  };

  // Active monitoring interval
  let monitoringInterval = null;

  // Helper availability check
  function isHelperSystemAvailable() {
    return typeof window.helper === 'object' && 
           typeof window.updateHelper === 'function' &&
           typeof window.sessionManager === 'object';
  }

  // Validation result structure
  function createValidationResult(isValid, issues = [], corrections = []) {
    return {
      timestamp: new Date().toISOString(),
      isValid,
      issues,
      corrections,
      consistency_score: isValid ? 100 : Math.max(0, 100 - (issues.length * 10)),
      helper_available: isHelperSystemAvailable()
    };
  }

  // Core validation function
  function validateDataConsistency() {
    const issues = [];
    const corrections = [];
    
    try {
      validationStats.totalValidations++;

      if (!isHelperSystemAvailable()) {
        issues.push({
          type: 'SYSTEM_ERROR',
          severity: 'HIGH',
          message: 'Helper system not available',
          location: 'window.helper'
        });
        validationStats.validationErrors++;
        return createValidationResult(false, issues);
      }

      // 1. Validate window.helper vs sessionStorage['helper']
      const sessionStorageHelper = sessionStorage.getItem('helper');
      const windowHelperString = JSON.stringify(window.helper);

      if (sessionStorageHelper !== windowHelperString) {
        issues.push({
          type: 'STORAGE_INCONSISTENCY',
          severity: 'MEDIUM',
          message: 'window.helper differs from sessionStorage.helper',
          location: 'storage_sync',
          details: {
            sessionStorage_size: sessionStorageHelper?.length || 0,
            windowHelper_size: windowHelperString?.length || 0
          }
        });

        // Auto-correction: Sync window.helper to sessionStorage (window.helper is authoritative)
        if (VALIDATOR_CONFIG.enableAutoCorrection) {
          try {
            sessionStorage.setItem('helper', windowHelperString);
            corrections.push({
              type: 'STORAGE_SYNC',
              action: 'Synced window.helper to sessionStorage',
              timestamp: new Date().toISOString()
            });
            validationStats.autoCorrections++;
          } catch (e) {
            issues.push({
              type: 'CORRECTION_FAILED',
              severity: 'HIGH',
              message: 'Failed to sync window.helper to sessionStorage',
              error: e.message
            });
          }
        }
      }

      // 2. Validate helper structure integrity
      const helperStructureIssues = validateHelperStructure(window.helper);
      issues.push(...helperStructureIssues);

      // 3. Check for competing localStorage data
      const competingStorageIssues = checkCompetingStorage();
      issues.push(...competingStorageIssues);

      // 4. Validate data types and required fields
      const dataTypeIssues = validateDataTypes(window.helper);
      issues.push(...dataTypeIssues);

      // 5. Check for data corruption
      const corruptionIssues = checkDataCorruption(window.helper);
      issues.push(...corruptionIssues);

      // Update statistics
      if (issues.length > 0) {
        validationStats.inconsistenciesFound++;
      }

      const isValid = issues.filter(issue => issue.severity === 'HIGH').length === 0;
      return createValidationResult(isValid, issues, corrections);

    } catch (error) {
      validationStats.validationErrors++;
      return createValidationResult(false, [{
        type: 'VALIDATION_ERROR',
        severity: 'HIGH',
        message: 'Validation process failed',
        error: error.message,
        stack: error.stack
      }]);
    }
  }

  // Validate helper structure
  function validateHelperStructure(helper) {
    const issues = [];
    const requiredSections = ['vehicle', 'case_info', 'stakeholders', 'damage_assessment', 'valuation', 'system'];

    for (const section of requiredSections) {
      if (!helper[section]) {
        issues.push({
          type: 'STRUCTURE_MISSING',
          severity: 'MEDIUM',
          message: `Missing required helper section: ${section}`,
          location: `helper.${section}`
        });

        // Auto-correction: Add missing sections
        if (VALIDATOR_CONFIG.enableAutoCorrection) {
          helper[section] = {};
          corrections.push({
            type: 'STRUCTURE_REPAIR',
            action: `Added missing section: helper.${section}`,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    // Validate meta section
    if (helper.system && !helper.system.version) {
      issues.push({
        type: 'METADATA_MISSING',
        severity: 'LOW',
        message: 'Helper system version not set',
        location: 'helper.system.version'
      });
    }

    return issues;
  }

  // Check for competing storage sources
  function checkCompetingStorage() {
    const issues = [];
    const competingKeys = [
      'helper_data', 'helper_backup', 'car_details', 'stakeholders',
      'damage_info', 'valuation', 'parts_search', 'lastCaseData'
    ];

    for (const key of competingKeys) {
      // Check sessionStorage
      if (sessionStorage.getItem(key)) {
        issues.push({
          type: 'COMPETING_STORAGE',
          severity: 'MEDIUM',
          message: `Found competing sessionStorage key: ${key}`,
          location: `sessionStorage.${key}`,
          recommendation: 'Remove or migrate to helper system'
        });
      }

      // Check localStorage (should not exist except emergency backup)
      if (localStorage.getItem(key)) {
        issues.push({
          type: 'COMPETING_STORAGE',
          severity: 'HIGH',
          message: `Found competing localStorage key: ${key}`,
          location: `localStorage.${key}`,
          recommendation: 'Remove immediately - use helper system only'
        });
      }
    }

    return issues;
  }

  // Validate data types
  function validateDataTypes(helper) {
    const issues = [];

    // Vehicle validation
    if (helper.vehicle) {
      if (helper.vehicle.year && isNaN(parseInt(helper.vehicle.year))) {
        issues.push({
          type: 'DATA_TYPE_ERROR',
          severity: 'MEDIUM',
          message: 'Vehicle year should be numeric',
          location: 'helper.vehicle.year',
          value: helper.vehicle.year
        });
      }

      if (helper.vehicle.km && isNaN(parseFloat(helper.vehicle.km))) {
        issues.push({
          type: 'DATA_TYPE_ERROR',
          severity: 'MEDIUM',
          message: 'Vehicle KM should be numeric',
          location: 'helper.vehicle.km',
          value: helper.vehicle.km
        });
      }
    }

    // Valuation validation
    if (helper.valuation) {
      const numericFields = ['base_price', 'final_price'];
      for (const field of numericFields) {
        if (helper.valuation[field] && isNaN(parseFloat(helper.valuation[field]))) {
          issues.push({
            type: 'DATA_TYPE_ERROR',
            severity: 'HIGH',
            message: `Valuation ${field} should be numeric`,
            location: `helper.valuation.${field}`,
            value: helper.valuation[field]
          });
        }
      }
    }

    return issues;
  }

  // Check for data corruption
  function checkDataCorruption(helper) {
    const issues = [];

    try {
      // Test serialization
      const serialized = JSON.stringify(helper);
      const deserialized = JSON.parse(serialized);
      
      // Basic corruption check
      if (typeof deserialized !== 'object') {
        issues.push({
          type: 'DATA_CORRUPTION',
          severity: 'HIGH',
          message: 'Helper data cannot be properly serialized/deserialized',
          location: 'helper'
        });
      }
    } catch (error) {
      issues.push({
        type: 'DATA_CORRUPTION',
        severity: 'HIGH',
        message: 'Helper data is corrupted - JSON parsing failed',
        location: 'helper',
        error: error.message
      });
    }

    return issues;
  }

  // Start real-time monitoring
  function startMonitoring() {
    if (monitoringInterval) {
      stopMonitoring();
    }

    if (!VALIDATOR_CONFIG.enableRealTimeMonitoring) {
      return;
    }

    console.log('🔍 PHASE 1.3: Starting real-time data validation monitoring');
    
    monitoringInterval = setInterval(() => {
      const result = validateDataConsistency();
      validationStats.lastValidation = result;

      // Add to history
      validationHistory.push(result);
      if (validationHistory.length > VALIDATOR_CONFIG.maxHistoryEntries) {
        validationHistory.shift();
      }

      // Log significant issues
      const highSeverityIssues = result.issues.filter(issue => issue.severity === 'HIGH');
      if (highSeverityIssues.length > 0) {
        console.error('🚨 PHASE 1.3: High severity data consistency issues found:', highSeverityIssues);
      }

      if (VALIDATOR_CONFIG.debugMode && result.issues.length > 0) {
        console.log('🔍 PHASE 1.3: Validation issues found:', result);
      }

    }, VALIDATOR_CONFIG.validationInterval);
  }

  // Stop monitoring
  function stopMonitoring() {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      monitoringInterval = null;
      console.log('🔍 PHASE 1.3: Real-time monitoring stopped');
    }
  }

  // Generate comprehensive validation report
  function generateValidationReport() {
    const currentValidation = validateDataConsistency();
    
    return {
      timestamp: new Date().toISOString(),
      system_status: {
        helper_available: isHelperSystemAvailable(),
        monitoring_active: monitoringInterval !== null,
        configuration: VALIDATOR_CONFIG
      },
      current_validation: currentValidation,
      statistics: validationStats,
      history_summary: {
        total_entries: validationHistory.length,
        recent_issues: validationHistory.slice(-5).filter(v => v.issues.length > 0).length,
        consistency_trend: validationHistory.slice(-10).map(v => v.consistency_score)
      },
      recommendations: generateRecommendations(currentValidation)
    };
  }

  // Generate recommendations based on validation results
  function generateRecommendations(validation) {
    const recommendations = [];

    const highSeverityIssues = validation.issues.filter(issue => issue.severity === 'HIGH');
    const mediumSeverityIssues = validation.issues.filter(issue => issue.severity === 'MEDIUM');

    if (highSeverityIssues.length > 0) {
      recommendations.push({
        priority: 'URGENT',
        action: 'Fix high severity data consistency issues immediately',
        issues: highSeverityIssues.length,
        impact: 'System stability at risk'
      });
    }

    if (mediumSeverityIssues.length > 3) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Address medium severity issues to prevent degradation',
        issues: mediumSeverityIssues.length,
        impact: 'Data quality degradation'
      });
    }

    const competingStorageIssues = validation.issues.filter(issue => issue.type === 'COMPETING_STORAGE');
    if (competingStorageIssues.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Migrate or remove competing storage sources',
        issues: competingStorageIssues.length,
        impact: 'Data conflicts and inconsistency'
      });
    }

    if (validationStats.autoCorrections > validationStats.totalValidations * 0.1) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Review auto-correction patterns - frequent corrections indicate systemic issues',
        corrections: validationStats.autoCorrections,
        impact: 'System reliability concerns'
      });
    }

    return recommendations;
  }

  // Public API
  window.dataValidator = {
    // Manual validation
    validate() {
      return validateDataConsistency();
    },

    // Start/stop monitoring
    startMonitoring,
    stopMonitoring,

    // Get reports
    getReport() {
      return generateValidationReport();
    },

    // Get statistics
    getStats() {
      return { ...validationStats };
    },

    // Get validation history
    getHistory(limit = 10) {
      return validationHistory.slice(-limit);
    },

    // Configuration management
    getConfig() {
      return { ...VALIDATOR_CONFIG };
    },

    updateConfig(newConfig) {
      Object.assign(VALIDATOR_CONFIG, newConfig);
      
      // Restart monitoring if interval changed
      if (monitoringInterval && newConfig.validationInterval) {
        stopMonitoring();
        startMonitoring();
      }
      
      console.log('✅ PHASE 1.3: Validator configuration updated');
    },

    // Cleanup and reset
    reset() {
      stopMonitoring();
      validationHistory.length = 0;
      Object.assign(validationStats, {
        totalValidations: 0,
        inconsistenciesFound: 0,
        autoCorrections: 0,
        validationErrors: 0,
        lastValidation: null
      });
      console.log('✅ PHASE 1.3: Validator reset completed');
    },

    // Emergency data repair
    emergencyRepair() {
      console.log('🚨 PHASE 1.3: Starting emergency data repair...');
      
      const result = validateDataConsistency();
      let repaired = 0;
      
      // Force auto-correction for all issues
      const originalAutoCorrection = VALIDATOR_CONFIG.enableAutoCorrection;
      VALIDATOR_CONFIG.enableAutoCorrection = true;
      
      try {
        // Run validation multiple times to catch cascading issues
        for (let i = 0; i < 3; i++) {
          const repairResult = validateDataConsistency();
          repaired += repairResult.corrections.length;
          if (repairResult.issues.filter(issue => issue.severity === 'HIGH').length === 0) {
            break;
          }
        }
        
        console.log(`✅ PHASE 1.3: Emergency repair completed - ${repaired} issues repaired`);
        return { success: true, repaired };
      } catch (error) {
        console.error('❌ PHASE 1.3: Emergency repair failed:', error);
        return { success: false, error: error.message };
      } finally {
        VALIDATOR_CONFIG.enableAutoCorrection = originalAutoCorrection;
      }
    }
  };

  // Initialize the validator
  console.log('✅ PHASE 1.3: Data Validation Service initialized');
  
  // Auto-start monitoring if helper is available
  if (isHelperSystemAvailable()) {
    startMonitoring();
    console.log('🔍 PHASE 1.3: Auto-started monitoring - helper system detected');
  } else {
    console.log('⚠️ PHASE 1.3: Waiting for helper system to be available...');
    
    // Wait for helper system to be available
    const checkInterval = setInterval(() => {
      if (isHelperSystemAvailable()) {
        clearInterval(checkInterval);
        startMonitoring();
        console.log('🔍 PHASE 1.3: Helper system available - monitoring started');
      }
    }, 1000);
  }

  console.log('📊 PHASE 1.3: Use window.dataValidator.getReport() for comprehensive validation');

})();
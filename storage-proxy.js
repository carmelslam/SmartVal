// 🔧 PHASE 1.2: STORAGE PROXY LAYER
// Intercepts legacy storage calls and routes them through helper system
// Ensures single source of truth while maintaining backward compatibility

console.log('📡 Loading Storage Proxy Layer - Phase 1.2');

(function() {
  'use strict';

  // Track if proxy is already installed
  if (window.storageProxyInstalled) {
    console.log('⚠️ Storage proxy already installed, skipping...');
    return;
  }

  // Configuration
  const PROXY_CONFIG = {
    enableWarnings: true,
    enableAutoMigration: true,
    trackDeprecatedCalls: true,
    debugMode: false
  };

  // Tracking for deprecated calls
  const deprecatedCalls = {
    sessionStorage: [],
    localStorage: []
  };

  // Helper system integration check
  function isHelperAvailable() {
    return typeof window.updateHelper === 'function' && 
           typeof window.helper === 'object';
  }

  // Storage key mappings to helper paths
  const STORAGE_MAPPINGS = {
    'helper': 'root',
    'helper_data': 'root',
    'helper_backup': 'root',
    'car_details': 'vehicle',
    'stakeholders': 'stakeholders',
    'damage_info': 'damage_assessment',
    'valuation': 'valuation',
    'parts_search': 'parts_search',
    'case_info': 'case_info'
  };

  // Get helper path for storage key
  function getHelperPath(key) {
    return STORAGE_MAPPINGS[key] || 'system.legacy_data';
  }

  // Create proxy for sessionStorage
  const originalSessionStorage = {
    getItem: sessionStorage.getItem.bind(sessionStorage),
    setItem: sessionStorage.setItem.bind(sessionStorage),
    removeItem: sessionStorage.removeItem.bind(sessionStorage),
    clear: sessionStorage.clear.bind(sessionStorage)
  };

  // Create proxy for localStorage  
  const originalLocalStorage = {
    getItem: localStorage.getItem.bind(localStorage),
    setItem: localStorage.setItem.bind(localStorage),
    removeItem: localStorage.removeItem.bind(localStorage),
    clear: localStorage.clear.bind(localStorage)
  };

  // Proxy sessionStorage.setItem
  sessionStorage.setItem = function(key, value) {
    if (PROXY_CONFIG.enableWarnings && key !== 'helper' && key !== 'helper_timestamp') {
      console.warn(`🚨 PHASE 1.2: Deprecated sessionStorage.setItem("${key}") - migrating to helper system`);
      
      if (PROXY_CONFIG.trackDeprecatedCalls) {
        deprecatedCalls.sessionStorage.push({
          key,
          action: 'setItem',
          timestamp: new Date().toISOString(),
          stack: new Error().stack
        });
      }
    }

    // For helper-related keys, allow through but also update helper
    if (key === 'helper' && isHelperAvailable()) {
      try {
        const data = JSON.parse(value);
        window.helper = data;
        console.log('✅ PHASE 1.2: sessionStorage.helper synced with window.helper');
      } catch (e) {
        console.error('❌ Failed to sync sessionStorage.helper with window.helper:', e);
      }
    }

    // Auto-migration to helper system
    if (PROXY_CONFIG.enableAutoMigration && isHelperAvailable() && key !== 'helper' && key !== 'helper_timestamp') {
      try {
        const helperPath = getHelperPath(key);
        const data = typeof value === 'string' ? JSON.parse(value) : value;
        
        if (helperPath === 'root') {
          window.helper = { ...window.helper, ...data };
        } else {
          window.updateHelper(helperPath, data, 'storage_proxy_migration');
        }
        
        console.log(`🔄 PHASE 1.2: Auto-migrated sessionStorage.${key} to helper.${helperPath}`);
      } catch (e) {
        console.warn(`⚠️ Failed to auto-migrate sessionStorage.${key}:`, e);
      }
    }

    // Call original method
    return originalSessionStorage.setItem(key, value);
  };

  // Proxy sessionStorage.getItem
  sessionStorage.getItem = function(key) {
    if (PROXY_CONFIG.enableWarnings && key !== 'helper' && key !== 'helper_timestamp' && key !== 'auth') {
      console.warn(`🚨 PHASE 1.2: Deprecated sessionStorage.getItem("${key}") - consider using helper system`);
      
      if (PROXY_CONFIG.trackDeprecatedCalls) {
        deprecatedCalls.sessionStorage.push({
          key,
          action: 'getItem', 
          timestamp: new Date().toISOString(),
          stack: new Error().stack
        });
      }
    }

    // For helper data, prioritize window.helper if available
    if (key === 'helper' && isHelperAvailable() && window.helper) {
      const helperString = JSON.stringify(window.helper);
      const storageString = originalSessionStorage.getItem(key);
      
      // Check if window.helper is more recent
      if (helperString !== storageString) {
        console.log('🔄 PHASE 1.2: Returning window.helper (more recent than sessionStorage)');
        return helperString;
      }
    }

    return originalSessionStorage.getItem(key);
  };

  // Proxy localStorage.setItem (more restrictive)
  localStorage.setItem = function(key, value) {
    // Only allow emergency backup and essential data
    const allowedKeys = ['helper_emergency_backup', 'auth_backup', 'user_preferences'];
    
    if (!allowedKeys.includes(key)) {
      console.error(`🚨 PHASE 1.2: BLOCKED localStorage.setItem("${key}") - use helper system instead`);
      
      if (PROXY_CONFIG.trackDeprecatedCalls) {
        deprecatedCalls.localStorage.push({
          key,
          action: 'setItem_BLOCKED',
          timestamp: new Date().toISOString(),
          stack: new Error().stack
        });
      }

      // Auto-migration attempt
      if (PROXY_CONFIG.enableAutoMigration && isHelperAvailable()) {
        try {
          const helperPath = getHelperPath(key);
          const data = typeof value === 'string' ? JSON.parse(value) : value;
          window.updateHelper(helperPath, data, 'storage_proxy_blocked_migration');
          console.log(`🔄 PHASE 1.2: BLOCKED call auto-migrated to helper.${helperPath}`);
          return; // Don't call original method
        } catch (e) {
          console.warn(`⚠️ Failed to auto-migrate blocked localStorage.${key}:`, e);
        }
      }
      
      return; // Block the call
    }

    console.log(`✅ PHASE 1.2: Allowed localStorage.setItem("${key}") - essential data`);
    return originalLocalStorage.setItem(key, value);
  };

  // Proxy localStorage.getItem
  localStorage.getItem = function(key) {
    // Only allow emergency backup and essential data
    const allowedKeys = ['helper_emergency_backup', 'auth_backup', 'user_preferences'];
    
    if (!allowedKeys.includes(key)) {
      console.warn(`🚨 PHASE 1.2: Deprecated localStorage.getItem("${key}") - use helper system instead`);
      
      if (PROXY_CONFIG.trackDeprecatedCalls) {
        deprecatedCalls.localStorage.push({
          key,
          action: 'getItem_DEPRECATED',
          timestamp: new Date().toISOString(),
          stack: new Error().stack
        });
      }

      // Try to provide data from helper instead
      if (isHelperAvailable()) {
        const helperPath = getHelperPath(key);
        try {
          if (helperPath === 'root') {
            return JSON.stringify(window.helper);
          } else {
            const pathParts = helperPath.split('.');
            let data = window.helper;
            for (const part of pathParts) {
              data = data?.[part];
            }
            return data ? JSON.stringify(data) : null;
          }
        } catch (e) {
          console.warn(`⚠️ Failed to provide helper data for localStorage.${key}:`, e);
        }
      }
    }

    return originalLocalStorage.getItem(key);
  };

  // Utility functions for migration and debugging
  window.storageProxy = {
    // Get deprecation report
    getDeprecationReport() {
      return {
        sessionStorage: deprecatedCalls.sessionStorage,
        localStorage: deprecatedCalls.localStorage,
        summary: {
          sessionStorageCalls: deprecatedCalls.sessionStorage.length,
          localStorageCalls: deprecatedCalls.localStorage.length,
          totalDeprecatedCalls: deprecatedCalls.sessionStorage.length + deprecatedCalls.localStorage.length
        }
      };
    },

    // Clear deprecation tracking
    clearDeprecationTracking() {
      deprecatedCalls.sessionStorage = [];
      deprecatedCalls.localStorage = [];
      console.log('✅ PHASE 1.2: Deprecation tracking cleared');
    },

    // Get configuration 
    getConfig() {
      return { ...PROXY_CONFIG };
    },

    // Update configuration
    updateConfig(newConfig) {
      Object.assign(PROXY_CONFIG, newConfig);
      console.log('✅ PHASE 1.2: Proxy configuration updated:', PROXY_CONFIG);
    },

    // Manual migration helper
    migrateStorageToHelper() {
      if (!isHelperAvailable()) {
        console.error('❌ Helper system not available for migration');
        return false;
      }

      let migrated = 0;
      const failures = [];

      // Migrate sessionStorage keys
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key !== 'helper' && key !== 'helper_timestamp' && key !== 'auth') {
          try {
            const value = originalSessionStorage.getItem(key);
            const data = JSON.parse(value);
            const helperPath = getHelperPath(key);
            
            window.updateHelper(helperPath, data, 'manual_migration');
            sessionStorage.removeItem(key);
            migrated++;
            console.log(`✅ Migrated sessionStorage.${key} to helper.${helperPath}`);
          } catch (e) {
            failures.push({ key, error: e.message });
            console.warn(`⚠️ Failed to migrate sessionStorage.${key}:`, e);
          }
        }
      }

      console.log(`✅ PHASE 1.2: Manual migration complete - ${migrated} items migrated, ${failures.length} failures`);
      return { migrated, failures };
    },

    // Restore original storage methods (for debugging)
    restoreOriginalMethods() {
      sessionStorage.setItem = originalSessionStorage.setItem;
      sessionStorage.getItem = originalSessionStorage.getItem;
      localStorage.setItem = originalLocalStorage.setItem;
      localStorage.getItem = originalLocalStorage.getItem;
      console.log('⚠️ PHASE 1.2: Original storage methods restored - proxy disabled');
    }
  };

  // Mark as installed
  window.storageProxyInstalled = true;

  console.log('✅ PHASE 1.2: Storage Proxy Layer installed successfully');
  console.log('📊 Use window.storageProxy.getDeprecationReport() to see deprecated calls');

})();
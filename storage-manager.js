// 🔧 PHASE 2 FIX: Centralized Storage Manager
// Consolidates all storage operations to prevent conflicts and key proliferation

export class StorageManager {
  constructor() {
    console.log('🔧 Initializing Centralized Storage Manager...');
    
    this.storageKeys = {
      PRIMARY: 'helper',           // Primary data storage key
      BACKUP: 'helper_backup',     // Backup in sessionStorage
      PERSISTENT: 'helper_data',   // Persistent storage in localStorage
      SESSION_ID: 'sessionId',     // Session identifier
      AUTH: 'auth',               // Authentication token
      TIMESTAMP: 'helper_timestamp' // Last update timestamp
    };
    
    this.quotaWarningThreshold = 4 * 1024 * 1024; // 4MB warning
    this.quotaLimitThreshold = 8 * 1024 * 1024;   // 8MB limit
    
    this.eventListeners = [];
    this.storageOverrides = [];
    
    this.initializeStorage();
    this.setupStorageQuotaMonitoring();
    this.registerStorageOverride();
    
    console.log('✅ Centralized Storage Manager initialized');
  }
  
  // Initialize storage with proper validation
  initializeStorage() {
    try {
      // Validate storage availability
      if (!this.isStorageAvailable('sessionStorage')) {
        console.error('❌ sessionStorage is not available');
        return false;
      }
      
      if (!this.isStorageAvailable('localStorage')) {
        console.warn('⚠️ localStorage is not available - backup storage disabled');
      }
      
      // Set up initial storage structure
      const sessionId = this.generateSessionId();
      sessionStorage.setItem(this.storageKeys.SESSION_ID, sessionId);
      
      console.log('✅ Storage initialized with session ID:', sessionId);
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize storage:', error);
      return false;
    }
  }
  
  // Generate unique session ID
  generateSessionId() {
    return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  // Check if storage is available and working
  isStorageAvailable(storageType) {
    try {
      const storage = window[storageType];
      const testKey = '__storage_test__';
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  // 🔧 CENTRALIZED STORAGE SAVE: Single method for all storage operations
  save(data, options = {}) {
    const {
      compress = true,
      backup = true,
      persist = true,
      validate = true
    } = options;
    
    console.log('💾 Saving data to centralized storage...', { compress, backup, persist, validate });
    
    try {
      // Validate data if requested
      if (validate && !this.validateData(data)) {
        console.warn('⚠️ Data validation failed, saving anyway');
      }
      
      // Prepare data for storage
      let dataString = JSON.stringify(data);
      let originalSize = dataString.length;
      
      // Compress data if requested and size exceeds threshold
      if (compress && originalSize > 100000) { // 100KB threshold
        dataString = this.compressData(dataString);
        console.log(`📦 Data compressed: ${originalSize} → ${dataString.length} bytes`);
      }
      
      // Check storage quota before saving
      if (!this.checkStorageQuota(dataString.length)) {
        console.error('❌ Storage quota exceeded - cannot save data');
        return false;
      }
      
      const timestamp = new Date().toISOString();
      
      // Save to primary storage (sessionStorage)
      sessionStorage.setItem(this.storageKeys.PRIMARY, dataString);
      sessionStorage.setItem(this.storageKeys.TIMESTAMP, timestamp);
      console.log('✅ Data saved to primary storage (sessionStorage)');
      
      // Save backup in sessionStorage if requested
      if (backup) {
        sessionStorage.setItem(this.storageKeys.BACKUP, dataString);
        console.log('✅ Data backed up in sessionStorage');
      }
      
      // Save to persistent storage (localStorage) if requested and available
      if (persist && this.isStorageAvailable('localStorage')) {
        localStorage.setItem(this.storageKeys.PERSISTENT, dataString);
        localStorage.setItem(this.storageKeys.TIMESTAMP, timestamp);
        console.log('✅ Data saved to persistent storage (localStorage)');
      }
      
      // Update window.helper to ensure live data is current
      window.helper = data;
      
      // Trigger storage event for listeners
      this.triggerStorageEvent('save', {
        data: data,
        compressed: compress && originalSize > 100000,
        originalSize: originalSize,
        finalSize: dataString.length,
        timestamp: timestamp
      });
      
      console.log(`✅ Centralized storage save completed (${dataString.length} bytes)`);
      return true;
      
    } catch (error) {
      console.error('❌ Failed to save to centralized storage:', error);
      return false;
    }
  }
  
  // 🔧 CENTRALIZED STORAGE LOAD: Single method for all data loading
  load(options = {}) {
    const {
      decompress = true,
      fallbackSources = true,
      validate = true
    } = options;
    
    console.log('📂 Loading data from centralized storage...', { decompress, fallbackSources, validate });
    
    try {
      let dataString = null;
      let dataSource = null;
      
      // Priority 1: Check if window.helper already exists (live data)
      if (window.helper && Object.keys(window.helper).length > 0) {
        console.log('✅ Using existing window.helper as data source');
        return { success: true, data: window.helper, source: 'window.helper' };
      }
      
      // Priority 2: Primary storage (sessionStorage)
      dataString = sessionStorage.getItem(this.storageKeys.PRIMARY);
      if (dataString) {
        dataSource = 'sessionStorage.primary';
      }
      
      // Priority 3: Backup storage (sessionStorage backup) if fallback enabled
      if (!dataString && fallbackSources) {
        dataString = sessionStorage.getItem(this.storageKeys.BACKUP);
        if (dataString) {
          dataSource = 'sessionStorage.backup';
        }
      }
      
      // Priority 4: Persistent storage (localStorage) if fallback enabled
      if (!dataString && fallbackSources && this.isStorageAvailable('localStorage')) {
        dataString = localStorage.getItem(this.storageKeys.PERSISTENT);
        if (dataString) {
          dataSource = 'localStorage.persistent';
        }
      }
      
      if (!dataString) {
        console.log('📭 No data found in any storage location');
        return { success: false, reason: 'no_data' };
      }
      
      console.log(`📂 Found data in ${dataSource} (${dataString.length} bytes)`);
      
      // Decompress data if needed
      if (decompress && this.isCompressed(dataString)) {
        const originalSize = dataString.length;
        dataString = this.decompressData(dataString);
        console.log(`📦 Data decompressed: ${originalSize} → ${dataString.length} bytes`);
      }
      
      // Parse data
      const data = JSON.parse(dataString);
      
      // Validate data if requested
      if (validate) {
        const validation = this.validateData(data);
        if (!validation.isValid && validation.score < 50) {
          console.warn('⚠️ Data validation failed:', validation.errors);
          return { success: false, reason: 'validation_failed', errors: validation.errors };
        }
      }
      
      // Update window.helper to ensure live data is current
      window.helper = data;
      
      // If data was loaded from fallback, sync to primary storage
      if (dataSource !== 'sessionStorage.primary') {
        sessionStorage.setItem(this.storageKeys.PRIMARY, dataString);
        console.log('🔄 Data synced back to primary storage');
      }
      
      // Trigger storage event for listeners
      this.triggerStorageEvent('load', {
        data: data,
        source: dataSource,
        size: dataString.length
      });
      
      console.log(`✅ Centralized storage load completed from ${dataSource}`);
      return { success: true, data: data, source: dataSource };
      
    } catch (error) {
      console.error('❌ Failed to load from centralized storage:', error);
      return { success: false, reason: 'error', error: error.message };
    }
  }
  
  // Basic data validation
  validateData(data) {
    if (!data || typeof data !== 'object') {
      return { isValid: false, score: 0, errors: ['Data is not an object'] };
    }
    
    let score = 0;
    const errors = [];
    
    // Check for required top-level properties
    const requiredProps = ['meta', 'vehicle', 'stakeholders', 'case_info'];
    requiredProps.forEach(prop => {
      if (data[prop]) {
        score += 25;
      } else {
        errors.push(`Missing required property: ${prop}`);
      }
    });
    
    // Check meta fields
    if (data.meta && data.meta.plate) {
      score += 10;
    }
    
    // Check vehicle fields  
    if (data.vehicle && (data.vehicle.plate || data.vehicle.manufacturer)) {
      score += 10;
    }
    
    const isValid = score >= 75;
    return { isValid, score, errors };
  }
  
  // Storage quota monitoring
  setupStorageQuotaMonitoring() {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      // Modern quota API
      this.checkQuotaModern();
    } else {
      // Fallback quota checking
      this.checkQuotaFallback();
    }
  }
  
  async checkQuotaModern() {
    try {
      const estimate = await navigator.storage.estimate();
      const usedBytes = estimate.usage || 0;
      const quotaBytes = estimate.quota || 0;
      
      console.log(`📊 Storage quota: ${usedBytes}/${quotaBytes} bytes used (${Math.round(usedBytes/quotaBytes*100)}%)`);
      
      if (usedBytes > this.quotaWarningThreshold) {
        console.warn('⚠️ Storage quota warning: Usage exceeds 4MB');
      }
      
      if (usedBytes > this.quotaLimitThreshold) {
        console.error('❌ Storage quota critical: Usage exceeds 8MB');
        this.cleanupOldData();
      }
    } catch (error) {
      console.warn('⚠️ Could not check modern storage quota:', error);
    }
  }
  
  checkQuotaFallback() {
    try {
      // Estimate usage by checking actual stored data
      let totalSize = 0;
      
      // SessionStorage size
      for (let key in sessionStorage) {
        if (sessionStorage.hasOwnProperty(key)) {
          totalSize += sessionStorage[key].length;
        }
      }
      
      console.log(`📊 Estimated sessionStorage usage: ${totalSize} bytes`);
      
      if (totalSize > this.quotaWarningThreshold) {
        console.warn('⚠️ Storage usage warning: Estimated usage exceeds 4MB');
      }
      
    } catch (error) {
      console.warn('⚠️ Could not check fallback storage quota:', error);
    }
  }
  
  checkStorageQuota(additionalBytes = 0) {
    // Simple check - try to store a test string
    try {
      const testData = 'a'.repeat(additionalBytes);
      sessionStorage.setItem('__quota_test__', testData);
      sessionStorage.removeItem('__quota_test__');
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        console.error('❌ Storage quota exceeded');
        this.cleanupOldData();
        return false;
      }
      return true; // Other errors don't mean quota exceeded
    }
  }
  
  // Clean up old data when quota is exceeded
  cleanupOldData() {
    console.log('🧹 Cleaning up old storage data...');
    
    try {
      // Remove old webhook data
      for (let key in sessionStorage) {
        if (key.startsWith('webhook_fallback_') || key.startsWith('makeCarData_old_')) {
          sessionStorage.removeItem(key);
          console.log(`🗑️ Removed old data: ${key}`);
        }
      }
      
      // Compress current helper data
      const helperData = sessionStorage.getItem(this.storageKeys.PRIMARY);
      if (helperData) {
        const compressed = this.compressData(helperData);
        if (compressed.length < helperData.length * 0.8) { // 20% compression
          sessionStorage.setItem(this.storageKeys.PRIMARY, compressed);
          console.log('📦 Helper data compressed to save space');
        }
      }
      
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }
  
  // Basic data compression (simple approach)
  compressData(dataString) {
    // Simple compression by removing unnecessary whitespace and duplicate strings
    return dataString
      .replace(/\s+/g, ' ')  // Multiple spaces to single space
      .replace(/\n\s*/g, '') // Remove newlines and following spaces
      .trim();
  }
  
  decompressData(dataString) {
    // For this simple compression, no decompression needed
    return dataString;
  }
  
  isCompressed(dataString) {
    // Simple heuristic: check if data looks compressed (no formatting)
    return !dataString.includes('\n') && !dataString.includes('  ');
  }
  
  // 🔧 CENTRALIZED STORAGE OVERRIDE: Single point for intercepting storage calls
  registerStorageOverride() {
    const originalSetItem = sessionStorage.setItem;
    const originalGetItem = sessionStorage.getItem;
    const storageManager = this;
    
    sessionStorage.setItem = function(key, value) {
      // Intercept helper-related storage calls
      if (key === 'helper' || key === storageManager.storageKeys.PRIMARY) {
        console.log('🔧 Intercepted storage call for helper data');
        
        try {
          const data = JSON.parse(value);
          return storageManager.save(data, { backup: true, persist: true });
        } catch (e) {
          // If it's not JSON, use original method
          return originalSetItem.call(this, key, value);
        }
      }
      
      // For all other keys, use original method
      return originalSetItem.call(this, key, value);
    };
    
    console.log('✅ Storage override registered');
  }
  
  // Event system for storage operations
  addEventListener(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }
  
  triggerStorageEvent(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ Error in storage event listener:', error);
        }
      });
    }
  }
  
  // Clear all storage data (for testing/reset)
  clearAll() {
    console.log('🧹 Clearing all storage data...');
    
    // Clear sessionStorage
    Object.values(this.storageKeys).forEach(key => {
      sessionStorage.removeItem(key);
    });
    
    // Clear localStorage  
    if (this.isStorageAvailable('localStorage')) {
      Object.values(this.storageKeys).forEach(key => {
        localStorage.removeItem(key);
      });
    }
    
    // Clear window.helper
    window.helper = {};
    
    console.log('✅ All storage data cleared');
  }
  
  // Get storage statistics
  getStorageStats() {
    const stats = {
      sessionStorage: {
        available: this.isStorageAvailable('sessionStorage'),
        keys: Object.keys(sessionStorage).length,
        totalSize: 0
      },
      localStorage: {
        available: this.isStorageAvailable('localStorage'),
        keys: Object.keys(localStorage).length,
        totalSize: 0
      },
      helper: {
        inMemory: window.helper && Object.keys(window.helper).length > 0,
        inSession: sessionStorage.getItem(this.storageKeys.PRIMARY) !== null,
        inLocal: localStorage.getItem(this.storageKeys.PERSISTENT) !== null
      }
    };
    
    // Calculate sizes
    try {
      for (let key in sessionStorage) {
        stats.sessionStorage.totalSize += sessionStorage[key].length;
      }
      
      if (stats.localStorage.available) {
        for (let key in localStorage) {
          stats.localStorage.totalSize += localStorage[key].length;
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not calculate storage sizes:', error);
    }
    
    return stats;
  }
}

// Create singleton instance
export const storageManager = new StorageManager();

// Legacy compatibility - expose on window
window.storageManager = storageManager;

console.log('✅ Centralized Storage Manager module loaded');
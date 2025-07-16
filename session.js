// session.js — Enhanced session management with persistence and recovery

import { errorHandler } from './error-handler.js';
import { securityManager } from './security-manager.js';

export const sessionEngine = {
  helper: {},
  sessionId: null,
  heartbeatInterval: null,
  autoSaveInterval: null,
  isRecoveryMode: false,
  lastSaveTimestamp: null,

  // Enhanced initialization with recovery mechanisms
  init() {
    console.log('🔄 SessionEngine: Initializing...');
    
    // Generate or restore session ID
    this.sessionId = sessionStorage.getItem('sessionId') || this.generateSessionId();
    sessionStorage.setItem('sessionId', this.sessionId);
    
    // Attempt to load session data with fallback
    const loadResult = this.loadSessionData();
    
    if (!loadResult.success) {
      console.warn('⚠️ Session load failed, attempting recovery...');
      this.attemptSessionRecovery();
    }
    
    // Initialize session management
    this.startHeartbeat();
    this.startAutoSave();
    this.setupEventListeners();
    
    console.log('✅ SessionEngine: Initialized successfully');
  },

  // Generate unique session ID
  generateSessionId() {
    return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  },

  // Enhanced data loading with validation and recovery
  loadSessionData() {
    try {
      // Try primary source (sessionStorage)
      let raw = sessionStorage.getItem('helper');
      let dataSource = 'sessionStorage';
      
      if (!raw) {
        // Try backup source (localStorage)
        raw = localStorage.getItem('helper_data');
        dataSource = 'localStorage';
        
        if (raw) {
          console.log('📦 Loading session data from backup storage');
        }
      }
      
      if (!raw) {
        console.log('📭 No session data found');
        return { success: false, reason: 'no_data' };
      }

      // Parse and validate data
      const parsedData = JSON.parse(raw);
      const validation = this.validateSessionData(parsedData);
      
      if (!validation.isValid) {
        console.warn('❌ Session data validation failed:', validation.errors);
        return { success: false, reason: 'validation_failed', errors: validation.errors };
      }

      // Load successful
      this.helper = parsedData;
      this.lastSaveTimestamp = Date.now();
      
      // If data was loaded from localStorage, sync to sessionStorage
      if (dataSource === 'localStorage') {
        sessionStorage.setItem('helper', raw);
        console.log('🔄 Session data synced to primary storage');
      }
      
      console.log('✅ Session data loaded successfully from', dataSource);
      return { success: true, source: dataSource };
      
    } catch (error) {
      console.error('❌ Error loading session data:', error);
      errorHandler.createError('session', 'high', 'Failed to load session data', {
        originalError: error.message
      });
      return { success: false, reason: 'parse_error', error: error.message };
    }
  },

  // Enhanced session data validation
  validateSessionData(data) {
    const errors = [];
    const warnings = [];
    
    // Basic structure validation
    if (!data || typeof data !== 'object') {
      errors.push('Invalid data structure');
      return { isValid: false, errors, warnings };
    }
    
    // Required sections validation
    if (!data.meta) {
      errors.push('Missing meta section');
    } else {
      if (!data.meta.plate) {
        errors.push('Missing plate number in meta');
      }
      
      if (!data.meta.case_id) {
        warnings.push('Missing case ID');
      }
    }
    
    // Car details validation
    if (!data.car_details) {
      warnings.push('Missing car details section');
    } else if (!data.car_details.plate) {
      warnings.push('Missing plate in car details');
    }
    
    // Cross-reference validation
    if (data.meta?.plate && data.car_details?.plate && data.meta.plate !== data.car_details.plate) {
      errors.push('Plate number mismatch between meta and car_details');
    }
    
    // Timestamp validation
    if (data.meta?.created_at) {
      const createdTime = new Date(data.meta.created_at);
      const daysSinceCreation = (Date.now() - createdTime.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceCreation > 30) {
        warnings.push('Session data is older than 30 days');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, 100 - (errors.length * 25) - (warnings.length * 5))
    };
  },

  getCurrentStage() {
    return this.helper?.meta?.report_stage || 'draft';
  },

  hasEstimate() {
    return this.helper?.meta?.estimate_overrides === true;
  },

  getDataSourceForFinal() {
    return this.hasEstimate() ? this.helper.estimate?.snapshot : this.helper;
  },

  isFinalized() {
    return this.helper?.meta?.finalized === true;
  },

  // Session recovery mechanisms
  attemptSessionRecovery() {
    console.log('🔧 Attempting session recovery...');
    this.isRecoveryMode = true;
    
    // Try to recover from backup locations
    const recoveryAttempts = [
      () => this.recoverFromLocalStorage(),
      () => this.recoverFromCookies(),
      () => this.recoverFromIndexedDB(),
      () => this.createEmptySession()
    ];
    
    for (const attempt of recoveryAttempts) {
      try {
        const result = attempt();
        if (result.success) {
          console.log('✅ Session recovered using:', result.method);
          this.isRecoveryMode = false;
          return true;
        }
      } catch (error) {
        console.warn('Recovery attempt failed:', error.message);
      }
    }
    
    console.error('❌ All recovery attempts failed');
    this.reset(true);
    return false;
  },

  recoverFromLocalStorage() {
    const backupData = localStorage.getItem('helper_data_backup');
    if (backupData) {
      const parsedData = JSON.parse(backupData);
      const validation = this.validateSessionData(parsedData);
      
      if (validation.isValid || validation.score > 50) {
        this.helper = parsedData;
        this.saveSessionData();
        return { success: true, method: 'localStorage backup' };
      }
    }
    return { success: false };
  },

  recoverFromCookies() {
    // Implementation for cookie-based recovery if needed
    return { success: false };
  },

  recoverFromIndexedDB() {
    // Implementation for IndexedDB recovery if needed
    return { success: false };
  },

  createEmptySession() {
    console.log('🔄 Creating new empty session');
    this.helper = {
      meta: {
        case_id: '',
        plate: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        report_stage: 'initial'
      },
      car_details: {},
      progress: {
        expertise: { completed: false, timestamp: null },
        depreciation: { completed: false, timestamp: null },
        estimate: { completed: false, timestamp: null },
        fees: { completed: false, timestamp: null }
      }
    };
    
    return { success: true, method: 'empty session' };
  },

  // Enhanced session saving with backup
  saveSessionData() {
    try {
      if (!this.helper.meta) {
        this.helper.meta = {};
      }
      
      // Update timestamp
      this.helper.meta.updated_at = new Date().toISOString();
      
      const dataString = JSON.stringify(this.helper);
      
      // Save to primary storage
      sessionStorage.setItem('helper', dataString);
      
      // Save to backup storage
      localStorage.setItem('helper_data', dataString);
      
      // Create additional backup
      localStorage.setItem('helper_data_backup', dataString);
      
      this.lastSaveTimestamp = Date.now();
      
      // Log save event
      securityManager.logSecurityEvent('session_saved', {
        sessionId: this.sessionId,
        dataSize: dataString.length,
        timestamp: new Date()
      });
      
      return true;
      
    } catch (error) {
      console.error('❌ Failed to save session data:', error);
      errorHandler.createError('session', 'high', 'Failed to save session data', {
        originalError: error.message
      });
      return false;
    }
  },

  // Heartbeat mechanism for session monitoring
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = setInterval(() => {
      this.performHeartbeat();
    }, 30000); // Every 30 seconds
  },

  performHeartbeat() {
    try {
      // Check session validity
      const auth = sessionStorage.getItem('auth');
      if (!auth) {
        console.warn('⚠️ Authentication expired during heartbeat');
        this.reset();
        return;
      }
      
      // Validate current session data
      if (this.helper && Object.keys(this.helper).length > 0) {
        const validation = this.validateSessionData(this.helper);
        if (!validation.isValid) {
          console.warn('⚠️ Session data corrupted during heartbeat');
          this.attemptSessionRecovery();
        }
      }
      
      // Update last activity timestamp
      sessionStorage.setItem('lastActivity', Date.now().toString());
      
    } catch (error) {
      console.error('❌ Heartbeat failed:', error);
    }
  },

  // Auto-save mechanism
  startAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    this.autoSaveInterval = setInterval(() => {
      if (this.helper && Object.keys(this.helper).length > 0) {
        this.saveSessionData();
      }
    }, 60000); // Every 60 seconds
  },

  // Event listeners for session management
  setupEventListeners() {
    // Save before page unload
    window.addEventListener('beforeunload', () => {
      this.saveSessionData();
    });
    
    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.saveSessionData();
      } else if (document.visibilityState === 'visible') {
        // Check if session is still valid when page becomes visible
        this.performHeartbeat();
      }
    });
    
    // Handle storage events from other tabs
    window.addEventListener('storage', (e) => {
      if (e.key === 'helper' || e.key === 'helper_data') {
        console.log('📡 Session data changed in another tab');
        this.loadSessionData();
      }
    });
  },

  setStage(stage) {
    if (!this.helper.meta) {
      this.helper.meta = {};
    }
    
    this.helper.meta.report_stage = stage;
    this.helper.meta.updated_at = new Date().toISOString();
    
    this.saveSessionData();
    
    console.log('📝 Stage updated to:', stage);
  },

  // Enhanced reset with recovery option
  reset(force = false) {
    // Preserve helper data before reset
    const helperData = sessionStorage.getItem('helper');
    
    if (!force && this.helper && Object.keys(this.helper).length > 0) {
      // Automatically save data - don't ask user
      this.saveSessionData();
      
      // Save to localStorage for persistence
      if (helperData) {
        localStorage.setItem('lastCaseData', helperData);
        localStorage.setItem('lastCaseTimestamp', new Date().toISOString());
      }
    }
    
    // Clear intervals
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
    
    // Clear only auth-related session data, preserve helper
    sessionStorage.removeItem('auth');
    sessionStorage.removeItem('loginTime');
    sessionStorage.removeItem('lastActivityTime');
    sessionStorage.removeItem('lastActivity');
    
    // Don't clear helper data - it should persist
    // sessionStorage.clear(); // REMOVED - this was clearing everything
    
    // Log reset event
    securityManager.logSecurityEvent('session_reset', {
      sessionId: this.sessionId,
      forced: force,
      timestamp: new Date(),
      data_preserved: !!helperData
    });
    
    console.log('🔄 Session reset - helper data preserved');
    
    // Redirect to login
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 100);
  },

  // Get session status and health
  getSessionStatus() {
    return {
      sessionId: this.sessionId,
      isValid: this.helper && Object.keys(this.helper).length > 0,
      isRecoveryMode: this.isRecoveryMode,
      lastSaveTimestamp: this.lastSaveTimestamp,
      currentStage: this.getCurrentStage(),
      hasEstimate: this.hasEstimate(),
      isFinalized: this.isFinalized(),
      dataValidation: this.helper ? this.validateSessionData(this.helper) : null
    };
  },

  // Clean up when leaving
  destroy() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
    this.saveSessionData();
  }
};

window.sessionEngine = sessionEngine;
document.addEventListener('DOMContentLoaded', () => sessionEngine.init());

console.log('✅ session.js loaded');

// 🔧 PHASE 3.1: REAL-TIME SYNC AND HELPER CHANGE BROADCASTING
// Implements real-time synchronization across all modules when helper data changes
// Ensures instant updates without page refreshes

console.log('📡 Loading Real-time Sync System - Phase 3.1');

(function() {
  'use strict';

  // Configuration
  const SYNC_CONFIG = {
    enableBroadcasting: true,
    enableAutoRefresh: true,
    debounceDelay: 300, // ms
    maxBroadcastFrequency: 1000, // ms - prevent spam
    debugMode: false
  };

  // Event listeners registry
  const eventListeners = new Map();
  
  // Broadcast throttling
  let lastBroadcast = 0;
  let pendingBroadcast = null;

  // Helper change detection
  let lastHelperSnapshot = '';
  let changeDetectionInterval = null;

  // Initialize sync system
  function initializeRealTimeSync() {
    console.log('🔄 PHASE 3.1: Initializing real-time sync system...');

    // Set up helper change detection
    startHelperChangeDetection();

    // Set up cross-window communication
    setupCrossWindowSync();

    // Set up module refresh handlers
    setupModuleRefreshHandlers();

    // Enhance updateHelper function with broadcasting
    enhanceUpdateHelperFunction();

    console.log('✅ PHASE 3.1: Real-time sync system initialized');
  }

  // Helper change detection using polling (more reliable than MutationObserver for objects)
  function startHelperChangeDetection() {
    if (changeDetectionInterval) {
      clearInterval(changeDetectionInterval);
    }

    changeDetectionInterval = setInterval(() => {
      if (typeof window.helper === 'object' && window.helper !== null) {
        try {
          const currentSnapshot = JSON.stringify(window.helper);
          
          if (currentSnapshot !== lastHelperSnapshot && lastHelperSnapshot !== '') {
            console.log('🔄 PHASE 3.1: Helper data change detected, broadcasting...');
            
            // Determine what changed
            const changes = detectHelperChanges(lastHelperSnapshot, currentSnapshot);
            
            // Broadcast the change
            broadcastHelperChange({
              type: 'helper_updated',
              timestamp: new Date().toISOString(),
              changes: changes,
              source: 'change_detection'
            });
          }
          
          lastHelperSnapshot = currentSnapshot;
        } catch (error) {
          console.error('❌ PHASE 3.1: Error in change detection:', error);
        }
      }
    }, SYNC_CONFIG.debounceDelay);
  }

  // Detect specific changes between helper snapshots
  function detectHelperChanges(oldSnapshot, newSnapshot) {
    try {
      const oldData = JSON.parse(oldSnapshot);
      const newData = JSON.parse(newSnapshot);
      
      const changes = [];
      
      // Check major sections for changes
      const sectionsToCheck = [
        'vehicle', 'case_info', 'stakeholders', 'damage_assessment', 
        'valuation', 'financials', 'parts_search', 'documents'
      ];
      
      sectionsToCheck.forEach(section => {
        const oldSection = JSON.stringify(oldData[section] || {});
        const newSection = JSON.stringify(newData[section] || {});
        
        if (oldSection !== newSection) {
          changes.push({
            section: section,
            hasChanges: true,
            oldSize: oldSection.length,
            newSize: newSection.length
          });
        }
      });
      
      return changes;
    } catch (error) {
      console.error('❌ PHASE 3.1: Error detecting changes:', error);
      return [{ section: 'unknown', hasChanges: true }];
    }
  }

  // Cross-window/tab synchronization using localStorage events
  function setupCrossWindowSync() {
    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', (e) => {
      if (e.key === 'helper_broadcast' && e.newValue) {
        try {
          const broadcastData = JSON.parse(e.newValue);
          
          if (SYNC_CONFIG.debugMode) {
            console.log('📨 PHASE 3.1: Received cross-window broadcast:', broadcastData);
          }
          
          // Handle the broadcast
          handleIncomingBroadcast(broadcastData);
        } catch (error) {
          console.error('❌ PHASE 3.1: Error handling cross-window sync:', error);
        }
      }
    });
  }

  // Set up module-specific refresh handlers
  function setupModuleRefreshHandlers() {
    // Register handlers for different module types
    registerModuleHandler('floating-screens', refreshFloatingScreens);
    registerModuleHandler('forms', refreshFormFields);
    registerModuleHandler('builders', refreshBuilderData);
    registerModuleHandler('summaries', refreshSummaryDisplays);
  }

  // Register a module refresh handler
  function registerModuleHandler(moduleType, handler) {
    if (!eventListeners.has(moduleType)) {
      eventListeners.set(moduleType, []);
    }
    eventListeners.get(moduleType).push(handler);
    
    if (SYNC_CONFIG.debugMode) {
      console.log(`📝 PHASE 3.1: Registered handler for module type: ${moduleType}`);
    }
  }

  // Enhance the global updateHelper function with broadcasting
  function enhanceUpdateHelperFunction() {
    // Store original updateHelper if it exists
    const originalUpdateHelper = window.updateHelper;
    
    window.updateHelper = function(path, data, source = 'enhanced_update_helper') {
      try {
        // Call original updateHelper if it exists
        if (typeof originalUpdateHelper === 'function') {
          const result = originalUpdateHelper(path, data, source);
          
          // Broadcast the change after successful update
          setTimeout(() => {
            broadcastHelperChange({
              type: 'helper_updated',
              timestamp: new Date().toISOString(),
              path: path,
              source: source,
              dataSize: JSON.stringify(data).length
            });
          }, 50); // Small delay to ensure update is complete
          
          return result;
        } else {
          // Fallback: Direct helper update
          if (typeof window.helper === 'object') {
            const pathParts = path.split('.');
            let current = window.helper;
            
            // Navigate to the parent object
            for (let i = 0; i < pathParts.length - 1; i++) {
              if (!current[pathParts[i]]) {
                current[pathParts[i]] = {};
              }
              current = current[pathParts[i]];
            }
            
            // Set the value
            const lastKey = pathParts[pathParts.length - 1];
            current[lastKey] = data;
            
            // Save to sessionStorage
            try {
              sessionStorage.setItem('helper', JSON.stringify(window.helper));
            } catch (e) {
              console.error('❌ PHASE 3.1: Failed to save to sessionStorage:', e);
            }
            
            // Broadcast the change
            broadcastHelperChange({
              type: 'helper_updated',
              timestamp: new Date().toISOString(),
              path: path,
              source: source + '_fallback',
              dataSize: JSON.stringify(data).length
            });
            
            console.log(`✅ PHASE 3.1: Updated helper.${path} via enhanced fallback`);
            return true;
          }
        }
      } catch (error) {
        console.error('❌ PHASE 3.1: Error in enhanced updateHelper:', error);
        return false;
      }
    };
    
    console.log('✅ PHASE 3.1: Enhanced updateHelper function with broadcasting');
  }

  // Broadcast helper changes to all listeners
  function broadcastHelperChange(changeData) {
    if (!SYNC_CONFIG.enableBroadcasting) {
      return;
    }

    // Throttle broadcasts to prevent spam
    const now = Date.now();
    if (now - lastBroadcast < SYNC_CONFIG.maxBroadcastFrequency) {
      if (pendingBroadcast) {
        clearTimeout(pendingBroadcast);
      }
      
      pendingBroadcast = setTimeout(() => {
        broadcastHelperChange(changeData);
      }, SYNC_CONFIG.maxBroadcastFrequency - (now - lastBroadcast));
      
      return;
    }
    
    lastBroadcast = now;

    try {
      // Broadcast to current window/tab
      window.dispatchEvent(new CustomEvent('helperChanged', {
        detail: changeData
      }));

      // Broadcast to other windows/tabs via localStorage
      const broadcastPayload = {
        ...changeData,
        timestamp: new Date().toISOString(),
        windowId: window.name || 'unknown'
      };
      
      localStorage.setItem('helper_broadcast', JSON.stringify(broadcastPayload));
      
      // Clean up the broadcast marker after a short delay
      setTimeout(() => {
        localStorage.removeItem('helper_broadcast');
      }, 1000);

      if (SYNC_CONFIG.debugMode) {
        console.log('📡 PHASE 3.1: Broadcasted helper change:', changeData);
      }

      // Trigger registered handlers
      triggerModuleHandlers(changeData);
    } catch (error) {
      console.error('❌ PHASE 3.1: Error broadcasting helper change:', error);
    }
  }

  // Handle incoming broadcasts from other windows/tabs
  function handleIncomingBroadcast(broadcastData) {
    // Skip broadcasts from same window
    if (broadcastData.windowId === (window.name || 'unknown')) {
      return;
    }

    // Update local helper data if needed
    if (broadcastData.type === 'helper_updated') {
      try {
        // Reload helper from sessionStorage to get latest data
        const latestHelper = sessionStorage.getItem('helper');
        if (latestHelper) {
          window.helper = JSON.parse(latestHelper);
          console.log('🔄 PHASE 3.1: Synced helper data from other window');
        }
      } catch (error) {
        console.error('❌ PHASE 3.1: Error syncing from other window:', error);
      }
    }

    // Trigger local handlers
    triggerModuleHandlers(broadcastData);
  }

  // Trigger registered module handlers
  function triggerModuleHandlers(changeData) {
    if (!SYNC_CONFIG.enableAutoRefresh) {
      return;
    }

    eventListeners.forEach((handlers, moduleType) => {
      handlers.forEach(handler => {
        try {
          handler(changeData);
        } catch (error) {
          console.error(`❌ PHASE 3.1: Error in ${moduleType} handler:`, error);
        }
      });
    });
  }

  // Refresh floating screens
  function refreshFloatingScreens(changeData) {
    if (!changeData.changes) return;

    // Refresh specific floating screens based on what changed
    changeData.changes.forEach(change => {
      switch (change.section) {
        case 'vehicle':
          if (typeof window.refreshCarDetails === 'function') {
            window.refreshCarDetails();
          }
          break;
        case 'valuation':
          if (typeof window.refreshLeviData === 'function') {
            window.refreshLeviData();
          }
          break;
        case 'documents':
          if (typeof window.refreshInvoiceData === 'function') {
            window.refreshInvoiceData();
          }
          break;
        case 'parts_search':
          if (typeof window.refreshPartsData === 'function') {
            window.refreshPartsData();
          }
          break;
      }
    });

    if (SYNC_CONFIG.debugMode) {
      console.log('🔄 PHASE 3.1: Refreshed floating screens for changes:', changeData.changes);
    }
  }

  // Refresh form fields
  function refreshFormFields(changeData) {
    // Auto-refresh form fields if helper data available
    if (typeof window.helper === 'object' && window.helper !== null) {
      // Try to call common form refresh functions
      if (typeof window.refreshAllModuleForms === 'function') {
        window.refreshAllModuleForms();
      } else if (typeof window.populateFormFields === 'function') {
        window.populateFormFields();
      }
    }
  }

  // Refresh builder data
  function refreshBuilderData(changeData) {
    // Refresh estimate and final report builders
    if (typeof window.loadDataFromHelper === 'function') {
      window.loadDataFromHelper();
    }
    
    if (typeof window.refreshBuilderData === 'function') {
      window.refreshBuilderData();
    }
  }

  // Refresh summary displays
  function refreshSummaryDisplays(changeData) {
    // Refresh summary pages and displays
    if (typeof window.updateSummaryDisplay === 'function') {
      window.updateSummaryDisplay();
    }
    
    if (typeof window.refreshSummaryData === 'function') {
      window.refreshSummaryData();
    }
  }

  // Public API
  window.realTimeSync = {
    // Configuration
    getConfig() {
      return { ...SYNC_CONFIG };
    },

    updateConfig(newConfig) {
      Object.assign(SYNC_CONFIG, newConfig);
      
      if (newConfig.debounceDelay !== undefined) {
        // Restart change detection with new delay
        startHelperChangeDetection();
      }
      
      console.log('✅ PHASE 3.1: Real-time sync configuration updated');
    },

    // Manual broadcasting
    broadcastChange(changeData) {
      broadcastHelperChange(changeData);
    },

    // Module registration
    registerHandler(moduleType, handler) {
      registerModuleHandler(moduleType, handler);
    },

    // Get registered handlers
    getHandlers() {
      const handlers = {};
      eventListeners.forEach((handlerList, moduleType) => {
        handlers[moduleType] = handlerList.length;
      });
      return handlers;
    },

    // Enable/disable features
    enableBroadcasting(enable = true) {
      SYNC_CONFIG.enableBroadcasting = enable;
      console.log(`✅ PHASE 3.1: Broadcasting ${enable ? 'enabled' : 'disabled'}`);
    },

    enableAutoRefresh(enable = true) {
      SYNC_CONFIG.enableAutoRefresh = enable;
      console.log(`✅ PHASE 3.1: Auto-refresh ${enable ? 'enabled' : 'disabled'}`);
    },

    // Debugging
    enableDebugMode(enable = true) {
      SYNC_CONFIG.debugMode = enable;
      console.log(`✅ PHASE 3.1: Debug mode ${enable ? 'enabled' : 'disabled'}`);
    },

    // Manual sync trigger
    syncNow() {
      if (typeof window.helper === 'object' && window.helper !== null) {
        broadcastHelperChange({
          type: 'manual_sync',
          timestamp: new Date().toISOString(),
          source: 'manual_trigger'
        });
        console.log('✅ PHASE 3.1: Manual sync triggered');
      }
    },

    // Cleanup
    destroy() {
      if (changeDetectionInterval) {
        clearInterval(changeDetectionInterval);
        changeDetectionInterval = null;
      }
      
      if (pendingBroadcast) {
        clearTimeout(pendingBroadcast);
        pendingBroadcast = null;
      }
      
      eventListeners.clear();
      console.log('✅ PHASE 3.1: Real-time sync system destroyed');
    }
  };

  // Auto-initialize when helper is available
  if (typeof window.helper === 'object' && window.helper !== null) {
    initializeRealTimeSync();
  } else {
    // Wait for helper to be available
    const initInterval = setInterval(() => {
      if (typeof window.helper === 'object' && window.helper !== null) {
        clearInterval(initInterval);
        initializeRealTimeSync();
      }
    }, 500);
  }

  console.log('📡 PHASE 3.1: Real-time sync system loaded - use window.realTimeSync for control');

})();
// 🔄 BIDIRECTIONAL DATA SYNC SYSTEM
// Implements real-time UI ↔ Helper synchronization using standardized field mapping

class BidirectionalSync {
  constructor() {
    this.activeListeners = new Map();
    this.syncQueue = [];
    this.isProcessingQueue = false;
    this.syncHistory = [];
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      this.initialize();
    }
  }

  initialize() {
    console.log('🔄 Initializing bidirectional sync system...');
    
    // Wait for field mapper and helper to be available
    this.waitForDependencies().then(() => {
      this.setupBidirectionalSync();
      this.startSyncLoop();
      console.log('✅ Bidirectional sync system active');
    });
  }

  async waitForDependencies() {
    const maxWait = 5000; // 5 seconds
    const checkInterval = 100; // 100ms
    let waited = 0;

    return new Promise((resolve) => {
      const checkDependencies = () => {
        if (window.fieldMapper && window.helper) {
          resolve();
        } else if (waited < maxWait) {
          waited += checkInterval;
          setTimeout(checkDependencies, checkInterval);
        } else {
          console.warn('⚠️ Timeout waiting for dependencies - proceeding anyway');
          resolve();
        }
      };
      checkDependencies();
    });
  }

  setupBidirectionalSync() {
    // Find all form elements and establish two-way sync
    const elements = this.findSyncableElements();
    
    elements.forEach(element => {
      this.setupElementSync(element);
    });

    // Set up observer for dynamically added elements
    this.setupMutationObserver();

    console.log(`🔄 Set up bidirectional sync for ${elements.length} elements`);
    
    // 🚨 ENHANCED: Set up advanced monitoring for dynamic elements
    this.setupAdvancedInputMonitoring();
  }

  // 🚨 NEW: Advanced input monitoring for dynamic elements
  setupAdvancedInputMonitoring() {
    console.log('🔍 Setting up advanced input monitoring for dynamic elements...');
    
    // Monitor floating screens, modals, and dynamic forms
    this.monitorDynamicElements();
    
    // Monitor file upload interfaces  
    this.monitorFileUploads();
    
    // Monitor calculation result fields
    this.monitorCalculationFields();
    
    // Monitor drag-and-drop interfaces
    this.monitorDragAndDrop();
  }

  monitorDynamicElements() {
    const dynamicSelectors = [
      '.floating-screen', '.modal', '.popup', '.overlay', '.dialog',
      '.floating-form', '.sidebar-form', '.panel-form', '.dynamic-form',
      '.modal-dialog', '.modal-content', '.modal-body', '.popup-modal'
    ];
    
    dynamicSelectors.forEach(selector => {
      // Monitor existing elements
      const existing = document.querySelectorAll(selector);
      existing.forEach(element => this.attachDynamicElementListeners(element));
      
      // Monitor for new elements
      this.observeSelector(selector);
    });
  }

  monitorFileUploads() {
    const uploadSelectors = [
      'input[type="file"]', '.file-upload', '.drag-drop-zone',
      '.upload-area', '.file-input-wrapper'
    ];
    
    uploadSelectors.forEach(selector => {
      const existing = document.querySelectorAll(selector);
      existing.forEach(upload => this.attachFileUploadListeners(upload));
      this.observeSelector(selector);
    });
  }

  monitorCalculationFields() {
    const calcSelectors = [
      '.calculation-result', '.computed-value', '.auto-calculated',
      '[data-calculation]', '.total-field', '.sum-field'
    ];
    
    calcSelectors.forEach(selector => {
      const existing = document.querySelectorAll(selector);
      existing.forEach(field => this.attachCalculationListener(field));
      this.observeSelector(selector);
    });
  }

  monitorDragAndDrop() {
    const dndSelectors = [
      '.drag-drop-zone', '.dropzone', '.drag-area',
      '[draggable="true"]', '.sortable-list'
    ];
    
    dndSelectors.forEach(selector => {
      const existing = document.querySelectorAll(selector);
      existing.forEach(zone => this.attachDragDropListeners(zone));
      this.observeSelector(selector);
    });
  }

  attachDynamicElementListeners(element) {
    const inputs = element.querySelectorAll('input, select, textarea');
    console.log(`🔍 Found ${inputs.length} inputs in dynamic element`);
    
    inputs.forEach(input => {
      if (input.id && !input.dataset.syncSetup) {
        this.setupElementSync(input);
      }
    });
  }

  attachFileUploadListeners(upload) {
    if (upload.tagName === 'INPUT' && upload.type === 'file') {
      upload.addEventListener('change', (e) => {
        this.handleFileUpload(e, upload);
      });
    }
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      upload.addEventListener(eventName, (e) => {
        this.handleDragDropUpload(e, upload);
      });
    });
  }

  attachCalculationListener(field) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          this.handleCalculationChange(field);
        }
      });
    });
    
    observer.observe(field, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  attachDragDropListeners(zone) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      zone.addEventListener(eventName, (e) => {
        this.handleDragDropEvent(e, zone);
      });
    });
  }

  observeSelector(selector) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.matches && node.matches(selector)) {
              this.handleNewDynamicElement(node, selector);
            }
            
            const matches = node.querySelectorAll && node.querySelectorAll(selector);
            if (matches) {
              matches.forEach(match => this.handleNewDynamicElement(match, selector));
            }
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  handleNewDynamicElement(element, selector) {
    console.log(`🆕 New dynamic element detected: ${selector}`);
    
    if (selector.includes('upload') || selector.includes('file')) {
      this.attachFileUploadListeners(element);
    } else if (selector.includes('calculation')) {
      this.attachCalculationListener(element);
    } else if (selector.includes('drag') || selector.includes('drop')) {
      this.attachDragDropListeners(element);
    } else {
      // Dynamic forms, modals, etc.
      this.attachDynamicElementListeners(element);
    }
  }

  handleFileUpload(event, upload) {
    const files = event.target.files;
    if (files.length > 0) {
      const fileData = {
        file_count: files.length,
        files: Array.from(files).map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          last_modified: file.lastModified
        })),
        upload_timestamp: new Date().toISOString(),
        upload_element_id: upload.id || 'unknown'
      };
      
      this.syncToHelper('document_metadata', fileData, 'file_upload');
      console.log(`📁 File upload detected: ${files.length} files`);
    }
  }

  handleDragDropUpload(event, zone) {
    if (event.type === 'drop') {
      event.preventDefault();
      const files = event.dataTransfer?.files;
      if (files && files.length > 0) {
        const dropData = {
          file_count: files.length,
          files: Array.from(files).map(file => ({
            name: file.name,
            size: file.size,
            type: file.type
          })),
          drop_timestamp: new Date().toISOString(),
          drop_zone_id: zone.id || 'unknown'
        };
        
        this.syncToHelper('document_metadata', dropData, 'drag_drop');
        console.log(`🎯 Drag-drop upload detected: ${files.length} files`);
      }
    }
  }

  handleCalculationChange(field) {
    const value = field.textContent || field.value;
    const fieldId = field.id || field.dataset.field || 'unknown_calculation';
    
    const numericValue = parseFloat(value.replace(/[^\d.-]/g, ''));
    
    if (!isNaN(numericValue)) {
      this.syncToHelper(fieldId, numericValue, 'calculation');
      console.log(`🧮 Calculation change detected: ${fieldId} = ${numericValue}`);
    }
  }

  handleDragDropEvent(event, zone) {
    const eventData = {
      event_type: event.type,
      timestamp: new Date().toISOString(),
      zone_id: zone.id || 'unknown',
      zone_class: zone.className
    };
    
    this.syncToHelper('drag_drop_interactions', eventData, 'drag_drop_event');
  }

  syncToHelper(fieldName, value, source) {
    if (window.updateHelperWithStandardizedFields) {
      window.updateHelperWithStandardizedFields(fieldName, value, source);
    } else if (window.updateHelper) {
      window.updateHelper(fieldName, value);
    }
  }

  findSyncableElements() {
    const selectors = [
      'input[type="text"]',
      'input[type="number"]', 
      'input[type="email"]',
      'input[type="tel"]',
      'input[type="date"]',
      'select',
      'textarea'
    ];

    const elements = [];
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        if (element.id && !element.dataset.syncSetup) {
          elements.push(element);
        }
      });
    });

    return elements;
  }

  setupElementSync(element) {
    const fieldId = element.id;
    
    if (!fieldId || element.dataset.syncSetup) {
      return;
    }

    // Get standardized field name
    const standardizedName = window.fieldStandardizer ? 
      window.fieldStandardizer.getStandardizedName(fieldId) : fieldId;

    // Check if field is in our mapping system
    if (!window.fieldMapper || !window.fieldMapper.isStandardizedField(standardizedName)) {
      console.log(`⚠️ Field "${fieldId}" (${standardizedName}) not in standardized mapping - skipping sync`);
      return;
    }

    // Initial population from helper
    this.populateElementFromHelper(element, standardizedName);

    // Set up UI → Helper sync
    this.setupUIToHelperSync(element, standardizedName);

    // Set up Helper → UI sync (for external updates)
    this.setupHelperToUISync(element, standardizedName);

    // Mark as set up
    element.dataset.syncSetup = 'true';
    element.dataset.standardizedName = standardizedName;

    // Track active listener
    this.activeListeners.set(fieldId, {
      element: element,
      standardizedName: standardizedName,
      lastValue: element.value,
      lastSync: Date.now()
    });

    console.log(`🔗 Sync established: ${fieldId} ↔ helper.${window.fieldMapper.getHelperPath(standardizedName).join('.')}`);
  }

  populateElementFromHelper(element, standardizedName) {
    if (!window.helper || !window.fieldMapper) return;

    const helperValue = window.fieldMapper.getValueFromHelper(standardizedName, window.helper);
    
    if (helperValue !== null && helperValue !== undefined && helperValue !== '') {
      // Only populate if element is empty or value is different
      if (!element.value || element.value !== String(helperValue)) {
        element.value = helperValue;
        element.style.borderLeft = '3px solid #4CAF50';
        element.title = `Synced from helper: ${standardizedName}`;
        
        console.log(`📥 Populated ${element.id} from helper: ${helperValue}`);
      }
    }
  }

  setupUIToHelperSync(element, standardizedName) {
    const syncToHelper = (event) => {
      const value = element.value?.trim();
      
      if (value !== this.activeListeners.get(element.id)?.lastValue) {
        // Update helper using standardized field mapping
        const success = window.updateHelperWithStandardizedFields(standardizedName, value, 'manual');
        
        if (success) {
          // Visual feedback
          element.style.borderLeft = '3px solid #2196F3';
          element.title = `Manually entered - synced to helper (${standardizedName})`;
          
          // Update tracking
          if (this.activeListeners.has(element.id)) {
            this.activeListeners.get(element.id).lastValue = value;
            this.activeListeners.get(element.id).lastSync = Date.now();
          }

          // Add to sync history
          this.syncHistory.push({
            direction: 'ui_to_helper',
            field: standardizedName,
            element: element.id,
            value: value,
            timestamp: Date.now(),
            event: event.type
          });

          console.log(`📤 UI→Helper sync: ${element.id} (${standardizedName}) = ${value}`);
        }
      }
    };

    // Attach event listeners
    element.addEventListener('input', syncToHelper);
    element.addEventListener('change', syncToHelper);
    element.addEventListener('blur', syncToHelper);
  }

  setupHelperToUISync(element, standardizedName) {
    // This will be triggered by helper update notifications
    // For now, we'll use a polling approach, but this could be enhanced with observers
    
    const checkForHelperUpdates = () => {
      if (!window.helper || !window.fieldMapper) return;

      const currentHelperValue = window.fieldMapper.getValueFromHelper(standardizedName, window.helper);
      const elementValue = element.value;

      if (currentHelperValue !== null && 
          currentHelperValue !== undefined && 
          String(currentHelperValue) !== elementValue) {
        
        // Only update if element doesn't have focus (avoid overriding user input)
        if (document.activeElement !== element) {
          element.value = currentHelperValue;
          element.style.borderLeft = '3px solid #FF9800';
          element.title = `Updated from helper: ${standardizedName}`;

          // Add to sync history
          this.syncHistory.push({
            direction: 'helper_to_ui',
            field: standardizedName,
            element: element.id,
            value: currentHelperValue,
            timestamp: Date.now(),
            source: 'periodic_check'
          });

          console.log(`📥 Helper→UI sync: ${element.id} (${standardizedName}) = ${currentHelperValue}`);
        }
      }
    };

    // Check periodically (could be optimized with observer pattern)
    setInterval(checkForHelperUpdates, 2000);
  }

  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const newElements = this.findSyncableElements().filter(
              el => !el.dataset.syncSetup
            );
            
            newElements.forEach(element => {
              this.setupElementSync(element);
            });

            if (newElements.length > 0) {
              console.log(`🔄 Added sync to ${newElements.length} new form elements`);
            }
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    this.mutationObserver = observer;
  }

  startSyncLoop() {
    // Process sync queue periodically
    setInterval(() => {
      this.processSyncQueue();
    }, 500);

    // Clean up old sync history
    setInterval(() => {
      this.cleanupSyncHistory();
    }, 30000);
  }

  processSyncQueue() {
    if (this.isProcessingQueue || this.syncQueue.length === 0) return;

    this.isProcessingQueue = true;

    try {
      while (this.syncQueue.length > 0) {
        const syncTask = this.syncQueue.shift();
        this.executeSyncTask(syncTask);
      }
    } catch (error) {
      console.error('❌ Error processing sync queue:', error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  executeSyncTask(task) {
    // Implementation for queued sync tasks
    console.log('🔄 Executing sync task:', task);
  }

  cleanupSyncHistory() {
    const maxAge = 5 * 60 * 1000; // 5 minutes
    const cutoff = Date.now() - maxAge;
    
    const oldLength = this.syncHistory.length;
    this.syncHistory = this.syncHistory.filter(entry => entry.timestamp > cutoff);
    
    if (oldLength !== this.syncHistory.length) {
      console.log(`🧹 Cleaned up ${oldLength - this.syncHistory.length} old sync history entries`);
    }
  }

  // Public methods for external control

  forceSyncAllElements() {
    console.log('🔄 Force syncing all elements...');
    
    this.activeListeners.forEach((listenerInfo, fieldId) => {
      this.populateElementFromHelper(listenerInfo.element, listenerInfo.standardizedName);
    });

    console.log(`✅ Force synced ${this.activeListeners.size} elements`);
  }

  syncSpecificField(fieldId, direction = 'both') {
    const listenerInfo = this.activeListeners.get(fieldId);
    if (!listenerInfo) {
      console.warn(`⚠️ No sync setup found for field: ${fieldId}`);
      return false;
    }

    if (direction === 'helper_to_ui' || direction === 'both') {
      this.populateElementFromHelper(listenerInfo.element, listenerInfo.standardizedName);
    }

    if (direction === 'ui_to_helper' || direction === 'both') {
      const value = listenerInfo.element.value?.trim();
      window.updateHelperWithStandardizedFields(listenerInfo.standardizedName, value, 'manual');
    }

    return true;
  }

  getSyncStatus() {
    return {
      activeListeners: this.activeListeners.size,
      syncHistory: this.syncHistory.length,
      recentSyncs: this.syncHistory.filter(entry => 
        Date.now() - entry.timestamp < 60000
      ).length,
      queueSize: this.syncQueue.length
    };
  }

  getSyncHistory(fieldId = null, limit = 50) {
    let history = [...this.syncHistory];
    
    if (fieldId) {
      history = history.filter(entry => entry.element === fieldId);
    }

    return history
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Cleanup method
  destroy() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    
    this.activeListeners.clear();
    this.syncQueue = [];
    this.syncHistory = [];
    
    console.log('🔄 Bidirectional sync system destroyed');
  }
}

// Global instance
window.bidirectionalSync = new BidirectionalSync();

// Helper functions for external use
window.forceSyncAllFields = function() {
  return window.bidirectionalSync.forceSyncAllElements();
};

window.syncField = function(fieldId, direction = 'both') {
  return window.bidirectionalSync.syncSpecificField(fieldId, direction);
};

window.getSyncStatus = function() {
  return window.bidirectionalSync.getSyncStatus();
};

window.getSyncHistory = function(fieldId = null, limit = 50) {
  return window.bidirectionalSync.getSyncHistory(fieldId, limit);
};

// Export for module use
export { BidirectionalSync };
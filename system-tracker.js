// Hidden system tracker - logs events to localStorage for debugging
// No UI - just event tracking
import logger from './logger.js';

const SystemTracker = {
  events: [],
  
  log(event, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      event,
      data,
      url: window.location.pathname,
      sessionId: this.getSessionId()
    };
    
    this.events.push(entry);
    
    // Keep only last 100 events
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }
    
    // Save to localStorage
    try {
      localStorage.setItem('system_tracker_events', JSON.stringify(this.events));
    } catch (e) {
      logger.warn('Could not save tracking events:', e);
    }

    // Also log to console for immediate visibility
    logger.info(`📊 TRACKER: ${event}`, data);
  },
  
  getSessionId() {
    let sessionId = sessionStorage.getItem('tracker_session_id');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36);
      sessionStorage.setItem('tracker_session_id', sessionId);
    }
    return sessionId;
  },
  
  getEvents() {
    try {
      const stored = localStorage.getItem('system_tracker_events');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },
  
  clearEvents() {
    this.events = [];
    localStorage.removeItem('system_tracker_events');
  }
};

// Track helper system events
if (typeof window !== 'undefined') {
  // Track when helper.js loads
  SystemTracker.log('helper_js_loading');
  
  // Track bridge function calls
  const originalUpdateCaseData = window.updateCaseData;
  const originalReceiveCarData = window.receiveCarData;
  
  // Override bridge functions to track calls
  setTimeout(() => {
    if (window.updateCaseData && window.updateCaseData !== originalUpdateCaseData) {
      const originalFn = window.updateCaseData;
      window.updateCaseData = function(section, data, source) {
        SystemTracker.log('bridge_updateCaseData_called', { section, source, hasData: !!data });
        return originalFn.call(this, section, data, source);
      };
      SystemTracker.log('bridge_updateCaseData_wrapped');
    } else {
      SystemTracker.log('bridge_updateCaseData_missing');
    }
    
    if (window.receiveCarData && window.receiveCarData !== originalReceiveCarData) {
      const originalFn = window.receiveCarData;
      window.receiveCarData = async function(data, source) {
        SystemTracker.log('bridge_receiveCarData_called', { source, hasData: !!data });
        return await originalFn.call(this, data, source);
      };
      SystemTracker.log('bridge_receiveCarData_wrapped');
    } else {
      SystemTracker.log('bridge_receiveCarData_missing');
    }
  }, 1000);
  
  // Track sessionStorage changes
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    if (key === 'helper') {
      try {
        const parsed = JSON.parse(value);
        SystemTracker.log('helper_storage_updated', {
          sections: Object.keys(parsed),
          plate: parsed.meta?.plate,
          manufacturer: parsed.vehicle?.manufacturer
        });
      } catch (e) {
        SystemTracker.log('helper_storage_updated_invalid', { key, valueLength: value.length });
      }
    }
    return originalSetItem.call(this, key, value);
  };
  
  // Track page loads
  window.addEventListener('load', () => {
    SystemTracker.log('page_loaded', { url: window.location.pathname });
  });
  
  // Track form submissions
  document.addEventListener('submit', (e) => {
    SystemTracker.log('form_submitted', { 
      formId: e.target.id,
      formAction: e.target.action,
      url: window.location.pathname
    });
  });
}

// Export for manual inspection
window.SystemTracker = SystemTracker;

export default SystemTracker;
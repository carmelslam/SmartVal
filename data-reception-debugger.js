// 🔍 Data Reception Debugger - Track all incoming data sources
// This module helps identify where data flow is breaking

import { updateHelper, helper, saveHelperToStorage } from './helper.js';

// Global data reception logger
class DataReceptionDebugger {
  constructor() {
    this.log = [];
    this.isActive = true;
    this.initializeDebugger();
  }

  // Initialize all possible data reception points
  initializeDebugger() {
    console.log('🔍 DataReceptionDebugger: Initializing...');
    
    // 1. URL Parameters Monitoring
    this.checkURLParameters();
    
    // 2. SessionStorage Monitoring
    this.monitorSessionStorage();
    
    // 3. PostMessage Monitoring
    this.monitorPostMessage();
    
    // 4. Global Function Monitoring
    this.setupGlobalFunctions();
    
    // 5. Helper Update Monitoring
    this.monitorHelperUpdates();
    
    // 6. Webhook Response Monitoring
    this.monitorWebhookResponses();
    
    console.log('✅ DataReceptionDebugger: All monitors active');
  }

  logEvent(source, type, data, details = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      source,
      type,
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      details,
      url: window.location.href,
      helper_state: JSON.parse(JSON.stringify(helper)) // Snapshot of helper state
    };
    
    this.log.push(logEntry);
    
    console.log(`🔍 [${source}] ${type}:`, data);
    console.log(`📊 Helper state after event:`, helper);
    
    // Keep only last 50 entries to prevent memory issues
    if (this.log.length > 50) {
      this.log = this.log.slice(-50);
    }
  }

  // Check URL parameters for incoming data
  checkURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    if (urlParams.toString() || hashParams.toString()) {
      this.logEvent('URL_PARAMS', 'DATA_RECEIVED', {
        search: Object.fromEntries(urlParams),
        hash: Object.fromEntries(hashParams)
      });
      
      // Try to process URL parameters as car data
      this.processURLParams(urlParams, hashParams);
    }
  }

  // Process URL parameters as potential car data
  processURLParams(urlParams, hashParams) {
    const allParams = { ...Object.fromEntries(urlParams), ...Object.fromEntries(hashParams) };
    
    // Check for car data patterns
    const carDataFields = ['plate', 'manufacturer', 'model', 'year', 'chassis', 'owner'];
    const foundCarData = {};
    
    Object.keys(allParams).forEach(key => {
      if (carDataFields.includes(key.toLowerCase()) || key.includes('car_') || key.includes('vehicle_')) {
        foundCarData[key] = allParams[key];
      }
    });
    
    if (Object.keys(foundCarData).length > 0) {
      this.logEvent('URL_PARAMS', 'CAR_DATA_DETECTED', foundCarData);
      
      // Try to update helper with URL data
      try {
        updateHelper('car_details', foundCarData);
        updateHelper('vehicle', foundCarData);
        this.logEvent('URL_PARAMS', 'HELPER_UPDATED', foundCarData);
      } catch (error) {
        this.logEvent('URL_PARAMS', 'HELPER_UPDATE_FAILED', { error: error.message, data: foundCarData });
      }
    }
  }

  // Monitor sessionStorage changes
  monitorSessionStorage() {
    const originalSetItem = Storage.prototype.setItem;
    const originalGetItem = Storage.prototype.getItem;
    
    Storage.prototype.setItem = function(key, value) {
      dataDebugger.logEvent('SESSION_STORAGE', 'SET_ITEM', { key, value: value.substring(0, 200) + '...' });
      
      // Check if this is car data or helper data
      if (key === 'carData' || key === 'helper' || key.includes('car_') || key.includes('vehicle_')) {
        try {
          const parsedValue = JSON.parse(value);
          dataDebugger.logEvent('SESSION_STORAGE', 'PARSED_DATA', { key, data: parsedValue });
          
          // If this is external car data, try to update helper
          if (key === 'carData' && parsedValue.plate) {
            dataDebugger.processExternalCarData(parsedValue);
          }
        } catch (e) {
          dataDebugger.logEvent('SESSION_STORAGE', 'PARSE_FAILED', { key, error: e.message });
        }
      }
      
      return originalSetItem.call(this, key, value);
    };
    
    Storage.prototype.getItem = function(key) {
      const value = originalGetItem.call(this, key);
      if (value && (key === 'carData' || key === 'helper')) {
        dataDebugger.logEvent('SESSION_STORAGE', 'GET_ITEM', { key, hasValue: !!value });
      }
      return value;
    };
  }

  // Process external car data
  processExternalCarData(carData) {
    this.logEvent('EXTERNAL_DATA', 'CAR_DATA_RECEIVED', carData);
    
    try {
      // Extract car details from the data
      const carDetails = {
        plate: carData.plate,
        owner: carData.owner,
        date: carData.date,
        location: carData.location
      };
      
      // Update helper with car data
      updateHelper('car_details', carDetails);
      updateHelper('meta', { 
        plate: carData.plate,
        owner_name: carData.owner,
        inspection_location: carData.location,
        inspection_date: carData.date
      });
      
      saveHelperToStorage();
      
      this.logEvent('EXTERNAL_DATA', 'HELPER_UPDATED_SUCCESS', carDetails);
      
      // Show floating screen notification
      this.showDataReceivedNotification(carData);
      
    } catch (error) {
      this.logEvent('EXTERNAL_DATA', 'HELPER_UPDATE_ERROR', { error: error.message, data: carData });
    }
  }

  // Monitor postMessage events
  monitorPostMessage() {
    window.addEventListener('message', (event) => {
      this.logEvent('POST_MESSAGE', 'MESSAGE_RECEIVED', {
        origin: event.origin,
        data: event.data,
        source: event.source ? 'iframe/window' : 'unknown'
      });
      
      // Try to process as car data
      if (event.data && typeof event.data === 'object') {
        if (event.data.plate || event.data.car_details || event.data.vehicle_data) {
          this.processExternalCarData(event.data);
        }
      }
    });
  }

  // Setup global functions for data reception
  setupGlobalFunctions() {
    // Global function for receiving car data from Make.com
    window.receiveCarData = (data) => {
      this.logEvent('GLOBAL_FUNCTION', 'RECEIVE_CAR_DATA', data);
      this.processExternalCarData(data);
    };
    
    // Global function for receiving Levi data
    window.receiveLeviData = (data) => {
      this.logEvent('GLOBAL_FUNCTION', 'RECEIVE_LEVI_DATA', data);
      try {
        updateHelper('levisummary', data);
        updateHelper('expertise', { levi_report: data });
        saveHelperToStorage();
        this.logEvent('GLOBAL_FUNCTION', 'LEVI_DATA_PROCESSED', data);
        this.showDataReceivedNotification(data, 'Levi Report');
      } catch (error) {
        this.logEvent('GLOBAL_FUNCTION', 'LEVI_DATA_ERROR', { error: error.message, data });
      }
    };
    
    // Global function for receiving parts data
    window.receivePartsData = (data) => {
      this.logEvent('GLOBAL_FUNCTION', 'RECEIVE_PARTS_DATA', data);
      try {
        updateHelper('parts_search', { results: data });
        saveHelperToStorage();
        this.logEvent('GLOBAL_FUNCTION', 'PARTS_DATA_PROCESSED', data);
        this.showDataReceivedNotification(data, 'Parts Search');
      } catch (error) {
        this.logEvent('GLOBAL_FUNCTION', 'PARTS_DATA_ERROR', { error: error.message, data });
      }
    };
    
    // Global function for receiving damage data
    window.receiveDamageData = (data) => {
      this.logEvent('GLOBAL_FUNCTION', 'RECEIVE_DAMAGE_DATA', data);
      try {
        updateHelper('expertise', { damage_blocks: data });
        updateHelper('damage_centers', data);
        saveHelperToStorage();
        this.logEvent('GLOBAL_FUNCTION', 'DAMAGE_DATA_PROCESSED', data);
        this.showDataReceivedNotification(data, 'Damage Assessment');
      } catch (error) {
        this.logEvent('GLOBAL_FUNCTION', 'DAMAGE_DATA_ERROR', { error: error.message, data });
      }
    };
    
    // Global function for receiving invoice data
    window.receiveInvoiceData = (data) => {
      this.logEvent('GLOBAL_FUNCTION', 'RECEIVE_INVOICE_DATA', data);
      try {
        updateHelper('invoice', data);
        saveHelperToStorage();
        this.logEvent('GLOBAL_FUNCTION', 'INVOICE_DATA_PROCESSED', data);
        this.showDataReceivedNotification(data, 'Invoice');
      } catch (error) {
        this.logEvent('GLOBAL_FUNCTION', 'INVOICE_DATA_ERROR', { error: error.message, data });
      }
    };
    
    console.log('✅ Global data reception functions registered');
  }

  // Monitor helper updates
  monitorHelperUpdates() {
    // Override updateHelper to log all updates
    const originalUpdateHelper = window.updateHelper;
    if (originalUpdateHelper) {
      window.updateHelper = (section, data) => {
        this.logEvent('HELPER_UPDATE', 'UPDATE_CALLED', { section, data });
        const result = originalUpdateHelper(section, data);
        this.logEvent('HELPER_UPDATE', 'UPDATE_RESULT', { section, success: result });
        return result;
      };
    }
  }

  // Monitor webhook responses for returning data
  monitorWebhookResponses() {
    // Override fetch to monitor webhook responses
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      // Check if this is a webhook URL
      const url = args[0];
      if (url && url.includes('hook.eu2.make.com')) {
        this.logEvent('WEBHOOK_RESPONSE', 'FETCH_CALLED', { url, status: response.status });
        
        // Clone response to avoid consuming it
        const clonedResponse = response.clone();
        try {
          const responseText = await clonedResponse.text();
          this.logEvent('WEBHOOK_RESPONSE', 'RESPONSE_RECEIVED', { 
            url, 
            status: response.status, 
            response: responseText.substring(0, 500) + '...' 
          });
          
          // Try to parse and process response data
          try {
            const responseData = JSON.parse(responseText);
            if (responseData.car_details || responseData.vehicle_data || responseData.plate) {
              this.logEvent('WEBHOOK_RESPONSE', 'CAR_DATA_IN_RESPONSE', responseData);
              this.processExternalCarData(responseData);
            }
          } catch (e) {
            // Response is not JSON, that's okay
          }
        } catch (e) {
          this.logEvent('WEBHOOK_RESPONSE', 'RESPONSE_READ_ERROR', { error: e.message });
        }
      }
      
      return response;
    };
  }

  // Show notification when data is received
  showDataReceivedNotification(data, type = 'Data') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-weight: bold;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: 300px;
    `;
    
    notification.innerHTML = `
      <div>📥 ${type} התקבל!</div>
      <div style="font-size: 12px; margin-top: 5px;">
        ${Object.keys(data).slice(0, 3).join(', ')}...
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  // Get full debug report
  getDebugReport() {
    return {
      timestamp: new Date().toISOString(),
      total_events: this.log.length,
      helper_state: JSON.parse(JSON.stringify(helper)),
      session_storage_keys: Object.keys(sessionStorage),
      url: window.location.href,
      recent_events: this.log.slice(-10), // Last 10 events
      summary: {
        url_params_checked: this.log.filter(e => e.source === 'URL_PARAMS').length,
        session_storage_events: this.log.filter(e => e.source === 'SESSION_STORAGE').length,
        post_messages: this.log.filter(e => e.source === 'POST_MESSAGE').length,
        global_function_calls: this.log.filter(e => e.source === 'GLOBAL_FUNCTION').length,
        helper_updates: this.log.filter(e => e.source === 'HELPER_UPDATE').length,
        webhook_responses: this.log.filter(e => e.source === 'WEBHOOK_RESPONSE').length
      }
    };
  }

  // Enable/disable debugging
  setActive(active) {
    this.isActive = active;
    console.log(`🔍 DataReceptionDebugger: ${active ? 'Enabled' : 'Disabled'}`);
  }

  // Clear debug log
  clearLog() {
    this.log = [];
    console.log('🔍 DataReceptionDebugger: Log cleared');
  }
}

// Create global instance
const dataDebugger = new DataReceptionDebugger();

// Make debugger globally accessible
window.dataDebugger = dataDebugger;

// Console commands for manual testing
window.testDataReception = {
  // Test car data reception
  testCarData: () => {
    const testData = {
      plate: '5785269',
      manufacturer: 'ביואיק',
      model: 'LUCERNE',
      owner: 'כרמל כיוף',
      date: new Date().toISOString(),
      location: 'UMI חיפה'
    };
    
    console.log('🧪 Testing car data reception...');
    window.receiveCarData(testData);
  },
  
  // Test URL parameters
  testURLParams: () => {
    const newURL = window.location.origin + window.location.pathname + '?plate=5785269&manufacturer=ביואיק&model=LUCERNE&owner=כרמל+כיוף';
    console.log('🧪 Testing URL parameters. Navigate to:', newURL);
    console.log('Or run: dataDebugger.processURLParams(new URLSearchParams("plate=5785269&manufacturer=ביואיק"), new URLSearchParams())');
  },
  
  // Test session storage
  testSessionStorage: () => {
    const testData = JSON.stringify({
      plate: '5785269',
      manufacturer: 'ביואיק',
      model: 'LUCERNE',
      owner: 'כרמל כיוף'
    });
    console.log('🧪 Testing session storage...');
    sessionStorage.setItem('carData', testData);
  },
  
  // Get debug report
  getReport: () => {
    console.log('📊 Debug Report:', dataDebugger.getDebugReport());
    return dataDebugger.getDebugReport();
  }
};

console.log('🔍 DataReceptionDebugger: Loaded successfully');
console.log('💡 Use window.testDataReception to test different scenarios');
console.log('📊 Use window.dataDebugger.getDebugReport() to see full debug info');

export default dataDebugger;
// 🔧 DATA CAPTURE FIXES LOADER
// Add this script to any HTML page that uses helper.js to apply the fixes
// Load this AFTER helper.js and session.js

console.log('🔧 Loading data capture fixes...');

// Load fixes asynchronously
(async function loadDataCaptureFixes() {
  try {
    // Import the integration module
    const integration = await import('./data-capture-integration.js');
    
    // Initialize all fixes
    const results = integration.initializeDataCaptureFixes();
    
    if (results) {
      console.log('✅ Data capture fixes loaded successfully');
      
      // Show notification to user (optional)
      if (typeof window.showSystemNotification === 'function') {
        window.showSystemNotification('🔧 מערכת לכידת נתונים שופרה', 'info');
      }
    } else {
      console.warn('⚠️ Some data capture fixes may not have loaded properly');
    }
    
  } catch (error) {
    console.error('❌ Failed to load data capture fixes:', error);
    
    // Fallback: At minimum, try to enhance webhook processing
    try {
      if (window.processIncomingData && typeof window.processIncomingData === 'function') {
        const originalProcessIncomingData = window.processIncomingData;
        
        window.processIncomingData = async function(data, webhookId) {
          console.log('🔧 FALLBACK: Enhanced webhook processing');
          console.log('📥 Data received:', data);
          
          try {
            // Try original first
            const result = await originalProcessIncomingData(data, webhookId);
            
            // Force immediate storage save
            if (window.helper && window.helper.constructor === Object) {
              const helperString = JSON.stringify(window.helper);
              sessionStorage.setItem('helper', helperString);
              sessionStorage.setItem('helper_backup', helperString);
              localStorage.setItem('helper_data', helperString);
            }
            
            // Force UI refresh
            setTimeout(() => {
              if (window.refreshAllModuleForms) {
                window.refreshAllModuleForms(window.helper);
              }
            }, 100);
            
            return result;
            
          } catch (error) {
            console.error('❌ Fallback processing failed:', error);
            throw error;
          }
        };
        
        console.log('✅ Fallback webhook processing enhancement applied');
      }
      
    } catch (fallbackError) {
      console.error('❌ Even fallback enhancement failed:', fallbackError);
    }
  }
})();

// Immediate helper storage enhancement (works without imports)
if (window.helper) {
  console.log('🔧 Applying immediate storage enhancement...');
  
  // Enhanced save function
  window.saveHelperEnhanced = function() {
    try {
      const helperString = JSON.stringify(window.helper);
      const timestamp = new Date().toISOString();
      
      // Multiple storage locations for reliability
      sessionStorage.setItem('helper', helperString);
      sessionStorage.setItem('helper_backup', helperString);
      sessionStorage.setItem('helper_timestamp', timestamp);
      
      localStorage.setItem('helper_data', helperString);
      localStorage.setItem('helper_last_save', timestamp);
      
      console.log('✅ Helper saved to multiple storage locations');
      return true;
      
    } catch (error) {
      console.error('❌ Enhanced save failed:', error);
      return false;
    }
  };
  
  // Auto-save helper data every 30 seconds
  setInterval(() => {
    if (window.helper && Object.keys(window.helper).length > 0) {
      window.saveHelperEnhanced();
    }
  }, 30000);
  
  console.log('✅ Immediate enhancements applied');
}

console.log('🔧 Data capture fixes loader completed');
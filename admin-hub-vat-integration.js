// admin-hub-vat-integration.js
// This file should be loaded in the admin hub portal to enable VAT communication with iframes

console.log('🏛️ Admin Hub VAT Integration loaded');

// Global VAT rate for admin hub
let adminHubVatRate = 18; // Default VAT rate

// Store references to all active iframe modules
const activeModules = new Map();

// 🏛️ ADMIN HUB VAT MANAGEMENT FUNCTIONS

/**
 * Set VAT rate from admin hub and broadcast to all modules
 */
window.setAdminVatRate = function(newVatRate) {
  if (typeof newVatRate !== 'number' || newVatRate < 0 || newVatRate > 100) {
    console.error('❌ Invalid VAT rate:', newVatRate);
    return false;
  }
  
  const oldRate = adminHubVatRate;
  adminHubVatRate = newVatRate;
  
  console.log(`🔄 Admin VAT rate changed from ${oldRate}% to ${newVatRate}%`);
  console.log('🎯 This should update helper.calculations.vat_rate in all modules');
  
  // Broadcast to all connected modules
  broadcastVatRateChange(newVatRate);
  
  // Update UI if available
  updateAdminVatUI(newVatRate);
  
  // Store in localStorage for persistence
  try {
    localStorage.setItem('adminHubVatRate', newVatRate);
  } catch (e) {
    console.warn('Could not save VAT rate to localStorage:', e);
  }
  
  return true;
};

/**
 * Get current admin hub VAT rate
 */
window.getAdminVatRate = function() {
  return adminHubVatRate;
};

/**
 * Broadcast VAT rate change to all connected modules
 */
function broadcastVatRateChange(vatRate) {
  console.log('📢 Broadcasting VAT rate change to', activeModules.size, 'modules');
  
  const message = {
    type: 'VAT_RATE_UPDATED',
    vatRate: vatRate,
    timestamp: Date.now()
  };
  
  // Send to all iframe modules
  activeModules.forEach((moduleInfo, iframe) => {
    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(message, '*');
        console.log(`📡 Sent VAT update to ${moduleInfo.name}`);
      }
    } catch (e) {
      console.warn(`Failed to send VAT update to ${moduleInfo.name}:`, e);
    }
  });
  
  // Also broadcast to direct child frames
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach(iframe => {
    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(message, '*');
      }
    } catch (e) {
      console.warn('Failed to send message to iframe:', e);
    }
  });
}

/**
 * Register an iframe module for VAT communication
 */
window.registerModule = function(iframe, moduleName) {
  if (iframe && iframe.contentWindow) {
    activeModules.set(iframe, {
      name: moduleName || 'unknown',
      registered: Date.now()
    });
    console.log(`✅ Registered module: ${moduleName}`);
  }
};

/**
 * Test connection to all registered modules
 */
window.testModuleConnections = function() {
  console.log('🔍 Testing connection to all modules...');
  
  const testMessage = {
    type: 'GET_VAT_RATE',
    test: true,
    timestamp: Date.now()
  };
  
  let responsesReceived = 0;
  const totalModules = activeModules.size;
  
  if (totalModules === 0) {
    console.log('ℹ️ No registered modules to test');
    return;
  }
  
  const timeout = setTimeout(() => {
    console.log(`⏰ Test timeout: ${responsesReceived}/${totalModules} modules responded`);
  }, 3000);
  
  activeModules.forEach((moduleInfo, iframe) => {
    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(testMessage, '*');
      }
    } catch (e) {
      console.warn(`Failed to test ${moduleInfo.name}:`, e);
    }
  });
  
  // Listen for responses
  const testResponseHandler = (event) => {
    if (event.data && event.data.type === 'VAT_RATE_RESPONSE' && event.data.test) {
      responsesReceived++;
      console.log(`✅ Response from module: VAT rate ${event.data.vatRate}%`);
      
      if (responsesReceived >= totalModules) {
        clearTimeout(timeout);
        window.removeEventListener('message', testResponseHandler);
        console.log(`🎉 All ${totalModules} modules responded successfully!`);
      }
    }
  };
  
  window.addEventListener('message', testResponseHandler);
};

/**
 * Update admin UI VAT display
 */
function updateAdminVatUI(vatRate) {
  // Update VAT rate buttons/indicators in admin UI
  const vatButtons = document.querySelectorAll('[data-vat-rate]');
  vatButtons.forEach(button => {
    const buttonRate = parseFloat(button.dataset.vatRate);
    if (buttonRate === vatRate) {
      button.classList.add('active', 'selected');
      button.style.backgroundColor = '#007bff';
      button.style.color = 'white';
    } else {
      button.classList.remove('active', 'selected');
      button.style.backgroundColor = '';
      button.style.color = '';
    }
  });
  
  // Update VAT display text
  const vatDisplays = document.querySelectorAll('.vat-rate-display');
  vatDisplays.forEach(display => {
    display.textContent = vatRate + '%';
  });
  
  console.log(`🎨 Updated admin UI for VAT rate: ${vatRate}%`);
}

// 🔄 MESSAGE HANDLER FOR IFRAME COMMUNICATION
window.addEventListener('message', function(event) {
  if (!event.data || !event.data.type) return;
  
  switch (event.data.type) {
    case 'MODULE_READY':
      console.log('📋 Module ready:', event.data.module);
      // Send current VAT rate to newly connected module
      if (event.source) {
        event.source.postMessage({
          type: 'VAT_RATE_UPDATED',
          vatRate: adminHubVatRate,
          timestamp: Date.now()
        }, event.origin);
      }
      break;
      
    case 'GET_VAT_RATE':
      console.log('📡 VAT rate requested by module');
      if (event.source) {
        event.source.postMessage({
          type: 'VAT_RATE_RESPONSE',
          vatRate: adminHubVatRate,
          test: event.data.test || false,
          timestamp: Date.now()
        }, event.origin);
      }
      break;
      
    case 'UPDATE_VAT_RATE':
      console.log('📥 VAT rate update from module:', event.data.vatRate + '%');
      // Module is informing admin of manual VAT change
      adminHubVatRate = event.data.vatRate;
      updateAdminVatUI(adminHubVatRate);
      break;
      
    case 'VAT_RATE_RESPONSE':
      if (event.data.test) {
        console.log('✅ Test response received: VAT rate', event.data.vatRate + '%');
      }
      break;
      
    default:
      console.log('📨 Unknown message from module:', event.data);
  }
});

// 🚀 INITIALIZATION
function initializeAdminHubVat() {
  console.log('🚀 Initializing Admin Hub VAT management...');
  
  // Load saved VAT rate
  try {
    const savedVat = localStorage.getItem('adminHubVatRate');
    if (savedVat) {
      adminHubVatRate = parseFloat(savedVat);
      console.log('📂 Loaded saved VAT rate:', adminHubVatRate + '%');
    }
  } catch (e) {
    console.warn('Could not load VAT rate from localStorage:', e);
  }
  
  // Auto-detect and register iframe modules
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach((iframe, index) => {
    const src = iframe.src;
    let moduleName = 'unknown';
    
    if (src.includes('final-report-builder')) moduleName = 'final-report-builder';
    else if (src.includes('estimate')) moduleName = 'estimate-builder';
    else if (src.includes('expertise')) moduleName = 'expertise';
    else moduleName = `module-${index}`;
    
    registerModule(iframe, moduleName);
  });
  
  // Set up VAT rate button click handlers
  setupVatButtonHandlers();
  
  // Update UI to reflect current VAT rate
  updateAdminVatUI(adminHubVatRate);
  
  console.log('✅ Admin Hub VAT management initialized');
}

/**
 * Set up click handlers for VAT rate buttons
 */
function setupVatButtonHandlers() {
  const vatButtons = document.querySelectorAll('[data-vat-rate]');
  vatButtons.forEach(button => {
    button.addEventListener('click', function() {
      const newVatRate = parseFloat(this.dataset.vatRate);
      console.log('🖱️ VAT button clicked:', newVatRate + '%');
      setAdminVatRate(newVatRate);
    });
  });
  
  console.log(`🎛️ Set up ${vatButtons.length} VAT button handlers`);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAdminHubVat);
} else {
  initializeAdminHubVat();
}

// 🔧 DEBUG FUNCTIONS FOR ADMIN HUB CONSOLE
window.debugAdminVat = function() {
  console.log('🔍 Admin Hub VAT Debug Info:');
  console.log('Current VAT Rate:', adminHubVatRate + '%');
  console.log('Active Modules:', activeModules.size);
  console.log('Available Functions:');
  console.log('- setAdminVatRate(rate) - Set new VAT rate');
  console.log('- getAdminVatRate() - Get current rate');
  console.log('- testModuleConnections() - Test all modules');
  console.log('- debugAdminVat() - Show this info');
  
  activeModules.forEach((info, iframe) => {
    console.log(`📄 Module: ${info.name} (registered: ${new Date(info.registered)})`);
  });
};

// Make functions available globally
window.adminHubVat = {
  setRate: window.setAdminVatRate,
  getRate: window.getAdminVatRate,
  testConnections: window.testModuleConnections,
  debug: window.debugAdminVat
};

console.log('🎯 Admin Hub VAT functions available:');
console.log('- setAdminVatRate(18) - Set VAT rate to 18%');
console.log('- testModuleConnections() - Test iframe communication');
console.log('- debugAdminVat() - Show debug info');
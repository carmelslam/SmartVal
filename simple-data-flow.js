// 🔥 SIMPLE DATA FLOW - Bypass complex helper system
// Direct data flow that actually works

console.log('🔥 Simple data flow system loading...');

// Simple global data store
window.currentCaseData = {
  meta: {},
  vehicle: {},
  stakeholders: {},
  damage: {},
  valuation: {},
  parts: {},
  invoice: {}
};

// Simple function to update data and refresh all screens
window.updateCaseData = function(section, data, source = 'unknown') {
  console.log('🔥 updateCaseData called:', { section, data, source });
  
  try {
    // Update the data store
    if (!window.currentCaseData[section]) {
      window.currentCaseData[section] = {};
    }
    
    // Merge the new data
    Object.assign(window.currentCaseData[section], data);
    
    // For car data, also update meta and vehicle sections
    if (section === 'car_details' || section === 'vehicle') {
      if (data.plate) window.currentCaseData.meta.plate = data.plate;
      if (data.owner) window.currentCaseData.stakeholders.owner_name = data.owner;
      if (data.manufacturer) window.currentCaseData.vehicle.manufacturer = data.manufacturer;
      if (data.model) window.currentCaseData.vehicle.model = data.model;
      if (data.year) window.currentCaseData.vehicle.year = data.year;
      if (data.location) window.currentCaseData.meta.location = data.location;
      if (data.date) window.currentCaseData.meta.damage_date = data.date;
    }
    
    // Save to both sessionStorage locations
    sessionStorage.setItem('currentCaseData', JSON.stringify(window.currentCaseData));
    
    // Also create legacy helper format
    const legacyHelper = {
      meta: window.currentCaseData.meta,
      vehicle: window.currentCaseData.vehicle,
      car_details: data,
      stakeholders: window.currentCaseData.stakeholders
    };
    sessionStorage.setItem('helper', JSON.stringify(legacyHelper));
    
    // Legacy carData format
    const legacyCarData = {
      plate: window.currentCaseData.meta.plate || data.plate || '',
      owner: window.currentCaseData.stakeholders.owner_name || data.owner || '',
      manufacturer: window.currentCaseData.vehicle.manufacturer || data.manufacturer || '',
      model: window.currentCaseData.vehicle.model || data.model || '',
      year: window.currentCaseData.vehicle.year || data.year || '',
      location: window.currentCaseData.meta.location || data.location || '',
      date: window.currentCaseData.meta.damage_date || data.date || ''
    };
    sessionStorage.setItem('carData', JSON.stringify(legacyCarData));
    
    console.log('✅ Data updated successfully:', window.currentCaseData);
    
    // Refresh all floating screens
    refreshAllScreens();
    
    // Show success notification
    showSimpleNotification('✅ נתונים עודכנו בהצלחה');
    
    return true;
    
  } catch (error) {
    console.error('❌ updateCaseData error:', error);
    showSimpleNotification('❌ שגיאה בעדכון נתונים');
    return false;
  }
};

// Refresh all floating screens
function refreshAllScreens() {
  console.log('🔄 Refreshing all screens...');
  
  // Car details screen
  if (typeof window.refreshCarData === 'function') {
    setTimeout(() => window.refreshCarData(), 100);
  }
  
  // Levi screen
  if (typeof window.refreshLeviData === 'function') {
    setTimeout(() => window.refreshLeviData(), 100);
  }
  
  // Parts screen
  if (typeof window.refreshPartsData === 'function') {
    setTimeout(() => window.refreshPartsData(), 100);
  }
  
  // Invoice screen
  if (typeof window.refreshInvoiceData === 'function') {
    setTimeout(() => window.refreshInvoiceData(), 100);
  }
}

// Simple notification system
function showSimpleNotification(message) {
  // Remove any existing notification
  const existing = document.getElementById('simpleNotification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.id = 'simpleNotification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #28a745;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    font-weight: bold;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-family: 'Assistant', Arial, sans-serif;
    direction: rtl;
  `;
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

// Simple data reception function
window.receiveCarData = function(data) {
  console.log('🔥 receiveCarData called with:', data);
  return window.updateCaseData('car_details', data, 'receiveCarData');
};

// Load any existing data on startup
function loadExistingData() {
  try {
    const stored = sessionStorage.getItem('currentCaseData');
    if (stored) {
      window.currentCaseData = JSON.parse(stored);
      console.log('🔥 Loaded existing data:', window.currentCaseData);
    }
  } catch (error) {
    console.warn('Could not load existing data:', error);
  }
}

// Initialize
loadExistingData();

console.log('✅ Simple data flow system ready');
console.log('💡 Use window.updateCaseData(section, data) to update data');
console.log('💡 Use window.receiveCarData(data) for car data');
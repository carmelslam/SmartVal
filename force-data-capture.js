// 🚨 FORCE DATA CAPTURE - Emergency Fix
// This script forces data capture and population when normal flow fails

(function() {
  console.log('🚨 Force Data Capture Script Loaded');
  
  // Function to force capture data from form inputs
  window.forceCaptureFormData = function() {
    console.log('🔧 Forcing data capture from current form...');
    
    const data = {};
    
    // Capture all input values
    document.querySelectorAll('input[id], select[id], textarea[id]').forEach(element => {
      if (element.value && element.value.trim()) {
        data[element.id] = element.value.trim();
        console.log(`📝 Captured ${element.id}: ${element.value}`);
      }
    });
    
    // Process the captured data
    if (Object.keys(data).length > 0) {
      console.log('💾 Captured data:', data);
      
      // Update helper directly
      if (typeof window.helper !== 'undefined') {
        // Update vehicle data
        if (data.plate) {
          if (!window.helper.vehicle) window.helper.vehicle = {};
          if (!window.helper.meta) window.helper.meta = {};
          window.helper.vehicle.plate = data.plate;
          window.helper.meta.plate = data.plate;
        }
        
        if (data.owner) {
          if (!window.helper.stakeholders) window.helper.stakeholders = { owner: {} };
          window.helper.stakeholders.owner.name = data.owner;
        }
        
        // Update all other fields
        Object.keys(data).forEach(key => {
          switch(key) {
            case 'manufacturer':
            case 'model':
            case 'year':
            case 'chassis':
              if (!window.helper.vehicle) window.helper.vehicle = {};
              window.helper.vehicle[key] = data[key];
              break;
            case 'ownerPhone':
            case 'ownerAddress':
              if (!window.helper.stakeholders) window.helper.stakeholders = { owner: {} };
              window.helper.stakeholders.owner[key.replace('owner', '').toLowerCase()] = data[key];
              break;
            case 'garageName':
            case 'garagePhone':
            case 'garageEmail':
              if (!window.helper.stakeholders) window.helper.stakeholders = { garage: {} };
              window.helper.stakeholders.garage[key.replace('garage', '').toLowerCase()] = data[key];
              break;
          }
        });
        
        // Save to storage
        sessionStorage.setItem('helper', JSON.stringify(window.helper));
        console.log('✅ Helper updated and saved');
        
        // Broadcast update
        if (typeof window.broadcastHelperUpdate === 'function') {
          window.broadcastHelperUpdate(['vehicle', 'meta', 'stakeholders'], 'force_capture');
        }
        
        // Refresh forms
        if (typeof window.refreshAllModuleForms === 'function') {
          window.refreshAllModuleForms();
        }
      }
    }
    
    return data;
  };
  
  // Function to force populate fields from helper
  window.forcePopulateFields = function() {
    console.log('🔧 Forcing field population from helper...');
    
    const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
    console.log('📊 Helper data:', helper);
    
    let populatedCount = 0;
    
    // Force populate specific fields
    const fieldMappings = {
      // Vehicle fields
      'plate': helper.vehicle?.plate || helper.meta?.plate || '',
      'manufacturer': helper.vehicle?.manufacturer || '',
      'model': helper.vehicle?.model || '',
      'year': helper.vehicle?.year || '',
      'chassis': helper.vehicle?.chassis || '',
      'odo': helper.vehicle?.km || '',
      
      // Owner fields
      'owner': helper.stakeholders?.owner?.name || '',
      'ownerPhone': helper.stakeholders?.owner?.phone || '',
      'ownerAddress': helper.stakeholders?.owner?.address || '',
      
      // Garage fields
      'garageName': helper.stakeholders?.garage?.name || '',
      'garagePhone': helper.stakeholders?.garage?.phone || '',
      'garageEmail': helper.stakeholders?.garage?.email || '',
      
      // Case fields
      'damageDate': helper.meta?.damage_date || helper.case_info?.damage_date || '',
      'location': helper.meta?.location || ''
    };
    
    Object.keys(fieldMappings).forEach(fieldId => {
      const value = fieldMappings[fieldId];
      if (value) {
        const element = document.getElementById(fieldId);
        if (element) {
          element.value = value;
          populatedCount++;
          console.log(`✅ Populated ${fieldId} with: ${value}`);
          
          // Trigger change event
          const event = new Event('change', { bubbles: true });
          element.dispatchEvent(event);
        }
      }
    });
    
    console.log(`📊 Force populated ${populatedCount} fields`);
    return populatedCount;
  };
  
  // Auto-capture on form submission
  document.addEventListener('submit', function(e) {
    console.log('📝 Form submission detected, capturing data...');
    forceCaptureFormData();
  }, true);
  
  // Auto-populate on page load
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
      console.log('🔄 Auto-populating fields after page load...');
      forcePopulateFields();
    }, 500);
  });
  
  // Add manual trigger buttons for debugging
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const debugPanel = document.createElement('div');
    debugPanel.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #333;
      color: white;
      padding: 10px;
      border-radius: 5px;
      z-index: 10000;
      font-family: monospace;
      font-size: 12px;
    `;
    debugPanel.innerHTML = `
      <div style="margin-bottom: 5px;">🚨 Force Data Capture</div>
      <button onclick="forceCaptureFormData()" style="margin-right: 5px;">Capture</button>
      <button onclick="forcePopulateFields()">Populate</button>
    `;
    document.body.appendChild(debugPanel);
  }
  
  // Expose functions globally
  window.forceCaptureFormData = forceCaptureFormData;
  window.forcePopulateFields = forcePopulateFields;
  
  console.log('💡 Force capture functions available:');
  console.log('  - forceCaptureFormData() : Capture current form data');
  console.log('  - forcePopulateFields() : Force populate fields from helper');
})();
// 🔧 Global Field Updater - Implements estimate builder pattern system-wide
// This module ensures ALL input fields update the helper in real-time, just like estimate builder

(function() {
  'use strict';
  
  console.log('🔧 Global Field Updater loaded');
  
  // Field mapping for all modules
  const FIELD_MAPPINGS = {
    // Car details fields
    'plate': { section: 'vehicle', field: 'plate' },
    'carPlate': { section: 'vehicle', field: 'plate' },
    'manufacturer': { section: 'vehicle', field: 'manufacturer' },
    'carManufacturer': { section: 'vehicle', field: 'manufacturer' },
    'model': { section: 'vehicle', field: 'model' },
    'carModel': { section: 'vehicle', field: 'model' },
    'year': { section: 'vehicle', field: 'year' },
    'carYear': { section: 'vehicle', field: 'year' },
    'model_code': { section: 'vehicle', field: 'model_code' },
    'carModelCode': { section: 'vehicle', field: 'model_code' },
    'engine_volume': { section: 'vehicle', field: 'engine_volume' },
    'fuel_type': { section: 'vehicle', field: 'fuel_type' },
    'vehicle_type': { section: 'vehicle', field: 'vehicle_type' },
    'chassis': { section: 'vehicle', field: 'chassis' },
    'trim': { section: 'vehicle', field: 'trim' },
    
    // Owner/stakeholder fields
    'owner': { section: 'stakeholders', field: 'owner.name' },
    'ownerName': { section: 'stakeholders', field: 'owner.name' },
    'ownerAddress': { section: 'stakeholders', field: 'owner.address' },
    'ownerPhone': { section: 'stakeholders', field: 'owner.phone' },
    
    // Insurance fields
    'insuranceCompany': { section: 'stakeholders', field: 'insurance.company' },
    'insuranceAgent': { section: 'stakeholders', field: 'insurance.agent.name' },
    'agentPhone': { section: 'stakeholders', field: 'insurance.agent.phone' },
    'agentEmail': { section: 'stakeholders', field: 'insurance.agent.email' },
    
    // Garage fields
    'garageName': { section: 'stakeholders', field: 'garage.name' },
    'garagePhone': { section: 'stakeholders', field: 'garage.phone' },
    'garage_name': { section: 'stakeholders', field: 'garage.name' },
    
    // Location/meta fields
    'location': { section: 'meta', field: 'location' },
    'date': { section: 'meta', field: 'damage_date' },
    'damage_date': { section: 'meta', field: 'damage_date' },
    
    // Financial fields
    'basicPrice': { section: 'calculations', field: 'basic_price' },
    'marketValue': { section: 'calculations', field: 'market_value' },
    'totalClaim': { section: 'calculations', field: 'total_claim' },
    'authorizedClaim': { section: 'calculations', field: 'authorized_claim' }
  };
  
  // Update helper when field changes
  function updateHelperFromField(fieldId, value, source = 'manual_input') {
    try {
      const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
      const mapping = FIELD_MAPPINGS[fieldId];
      
      if (!mapping) {
        console.log(`⚠️ No mapping found for field: ${fieldId}`);
        return;
      }
      
      console.log(`📝 Updating helper: ${fieldId} = "${value}" → ${mapping.section}.${mapping.field}`);
      
      // Initialize section if needed
      if (!helper[mapping.section]) {
        helper[mapping.section] = {};
      }
      
      // Handle nested fields (e.g., owner.name)
      const fieldParts = mapping.field.split('.');
      let target = helper[mapping.section];
      
      for (let i = 0; i < fieldParts.length - 1; i++) {
        if (!target[fieldParts[i]]) {
          target[fieldParts[i]] = {};
        }
        target = target[fieldParts[i]];
      }
      
      // Set the value
      const finalField = fieldParts[fieldParts.length - 1];
      target[finalField] = value;
      
      // Special handling for certain fields
      if (fieldId === 'plate' || fieldId === 'carPlate') {
        // Also update meta.plate
        helper.meta = helper.meta || {};
        helper.meta.plate = value;
      }
      
      // Update car_details for compatibility
      if (mapping.section === 'vehicle') {
        helper.car_details = helper.car_details || {};
        helper.car_details[mapping.field] = value;
      }
      
      // Save updated helper
      sessionStorage.setItem('helper', JSON.stringify(helper));
      
      // Also update currentCaseData for floating screens
      window.currentCaseData = helper;
      sessionStorage.setItem('currentCaseData', JSON.stringify(helper));
      
      console.log('✅ Helper updated:', helper);
      
      // Broadcast update
      document.dispatchEvent(new CustomEvent('helperDataUpdated', { 
        detail: { 
          fieldId, 
          value, 
          section: mapping.section,
          source 
        } 
      }));
      
      // Trigger UI updates
      if (window.refreshCarData) window.refreshCarData();
      if (window.forcePopulateFields) window.forcePopulateFields();
      
    } catch (error) {
      console.error('❌ Error updating helper from field:', error);
    }
  }
  
  // Attach listeners to all input fields
  function attachFieldListeners() {
    console.log('🔍 Attaching field listeners...');
    
    // Find all input fields with IDs that match our mappings
    const allInputs = document.querySelectorAll('input[id], select[id], textarea[id]');
    let attachedCount = 0;
    
    allInputs.forEach(input => {
      const fieldId = input.id;
      
      // Check if this field has a mapping
      if (FIELD_MAPPINGS[fieldId]) {
        // Remove existing listeners to prevent duplicates
        input.removeEventListener('change', handleFieldChange);
        input.removeEventListener('input', handleFieldInput);
        
        // Add new listeners
        input.addEventListener('change', handleFieldChange);
        input.addEventListener('input', handleFieldInput);
        
        attachedCount++;
        console.log(`✅ Attached listener to: ${fieldId}`);
      }
    });
    
    console.log(`🎯 Attached listeners to ${attachedCount} fields`);
  }
  
  // Handle field change event
  function handleFieldChange(event) {
    const fieldId = event.target.id;
    const value = event.target.value.trim();
    updateHelperFromField(fieldId, value);
  }
  
  // Handle field input event (for real-time updates)
  function handleFieldInput(event) {
    const fieldId = event.target.id;
    const value = event.target.value.trim();
    
    // Debounce input events
    clearTimeout(window.fieldUpdateTimeout);
    window.fieldUpdateTimeout = setTimeout(() => {
      updateHelperFromField(fieldId, value, 'manual_input_realtime');
    }, 500);
  }
  
  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachFieldListeners);
  } else {
    attachFieldListeners();
  }
  
  // Re-attach listeners when new content is added
  const observer = new MutationObserver(() => {
    attachFieldListeners();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Expose global functions
  window.updateHelperFromField = updateHelperFromField;
  window.attachFieldListeners = attachFieldListeners;
  
  // Test function
  window.testGlobalFieldUpdate = function() {
    console.log('🧪 Testing global field update...');
    
    // Find a field and simulate input
    const plateField = document.getElementById('plate') || document.getElementById('carPlate');
    if (plateField) {
      plateField.value = 'TEST-123';
      plateField.dispatchEvent(new Event('change'));
      console.log('✅ Test completed - check helper for plate: TEST-123');
    } else {
      console.log('❌ No plate field found on this page');
    }
  };
  
  console.log('💡 Global field updater ready. Use testGlobalFieldUpdate() to test.');
})();
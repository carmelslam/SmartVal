// Unified Data Capture - Single source of truth for all incoming data
(function() {
  console.log('🎯 Unified Data Capture Module loaded');
  
  // Create a single function that handles ALL incoming data
  window.captureIncomingData = function(data, source) {
    console.log(`📥 Capturing data from ${source}:`, data);
    
    let processedData = {};
    
    // 1. Check if it's Hebrew text in Body field
    if (data && data.Body && typeof data.Body === 'string' && data.Body.includes('רכב')) {
      console.log('📝 Processing Hebrew text from Body field');
      processedData = parseHebrewText(data.Body);
    }
    // 2. Check if it's already structured data
    else if (data && (data.plate || data.manufacturer || data.owner)) {
      console.log('📋 Processing structured data');
      processedData = data;
    }
    // 3. Check for array format
    else if (Array.isArray(data) && data.length > 0) {
      console.log('📦 Processing array format');
      const firstItem = data[0];
      if (firstItem.Body) {
        processedData = parseHebrewText(firstItem.Body);
      } else if (firstItem.value) {
        processedData = typeof firstItem.value === 'string' ? JSON.parse(firstItem.value) : firstItem.value;
      }
    }
    
    // Store processed data in sessionStorage
    if (Object.keys(processedData).length > 0) {
      console.log('✅ Processed data:', processedData);
      
      // Store in sessionStorage for all components to access
      sessionStorage.setItem('unifiedCarData', JSON.stringify(processedData));
      
      // Update helper with processed data
      updateHelperFromData(processedData);
      
      // Show notification like the simulator does
      if (processedData.manufacturer && processedData.model) {
        showDataNotification(processedData);
      }
    }
    
    return processedData;
  };
  
  // Parse Hebrew text into structured data
  function parseHebrewText(text) {
    const data = {};
    const lines = text.split('\n');
    
    // Comprehensive field mapping
    const fieldMap = {
      'פרטי רכב': 'plate',
      'מס\' רכב': 'plate',
      'מספר רכב': 'plate',
      'שם היצרן': 'manufacturer',
      'דגם': 'model',
      'סוג הדגם': 'model_type',
      'סוג הרכב': 'vehicle_type',
      'רמת גימור': 'trim',
      'מספר שילדה': 'chassis',
      'שנת ייצור': 'year',
      'שם בעל הרכב': 'owner',
      'סוג בעלות': 'ownership_type',
      'נפח מנוע': 'engine_volume',
      'סוג דלק': 'fuel_type',
      'מספר דגם הרכב': 'model_code',
      'דגם מנוע': 'engine_model',
      'הנעה': 'drive_type',
      'מוסך': 'garage_name',
      'קוד משרד התחבורה': 'office_code',
      'מיקום': 'location',
      'תאריך': 'date',
      'מאפיינים נוספים': 'features'
    };
    
    lines.forEach((line, index) => {
      if (!line.trim()) return;
      
      const parts = line.split(':');
      if (parts.length >= 2) {
        const hebrewKey = parts[0].trim();
        const value = parts.slice(1).join(':').trim();
        
        // Special handling for first line
        if (index === 0 && hebrewKey === 'פרטי רכב') {
          data.plate = value;
        } else {
          const englishKey = fieldMap[hebrewKey];
          if (englishKey && value) {
            data[englishKey] = value;
          }
        }
      }
    });
    
    // Clean up data
    if (data.year && data.year.includes('/')) {
      data.year = data.year.split('/').pop();
    }
    if (data.trim && data.trim.startsWith(':')) {
      data.trim = data.trim.substring(1).trim();
    }
    
    return data;
  }
  
  // Update helper with unified data structure
  function updateHelperFromData(data) {
    console.log('🔧 Updating helper from unified data:', data);
    
    if (!window.helper) {
      window.helper = {
        vehicle: {},
        meta: {},
        stakeholders: { owner: {}, garage: {}, insurance: { agent: {} } },
        car_details: {}
      };
    }
    
    // Update vehicle section
    if (data.plate) window.helper.vehicle.plate = data.plate;
    if (data.manufacturer) window.helper.vehicle.manufacturer = data.manufacturer;
    if (data.model) window.helper.vehicle.model = data.model;
    if (data.model_type) window.helper.vehicle.model_type = data.model_type;
    if (data.vehicle_type) window.helper.vehicle.vehicle_type = data.vehicle_type;
    if (data.trim) window.helper.vehicle.trim = data.trim;
    if (data.year) window.helper.vehicle.year = data.year;
    if (data.chassis) window.helper.vehicle.chassis = data.chassis;
    if (data.engine_volume) window.helper.vehicle.engine_volume = data.engine_volume;
    if (data.fuel_type) window.helper.vehicle.fuel_type = data.fuel_type;
    if (data.model_code) window.helper.vehicle.model_code = data.model_code;
    if (data.engine_model) window.helper.vehicle.engine_model = data.engine_model;
    if (data.drive_type) window.helper.vehicle.drive_type = data.drive_type;
    if (data.office_code) window.helper.vehicle.office_code = data.office_code;
    if (data.ownership_type) window.helper.vehicle.ownership_type = data.ownership_type;
    
    // Update meta section
    window.helper.meta.plate = data.plate || window.helper.meta.plate;
    window.helper.meta.location = data.location || data.garage_name || window.helper.meta.location;
    window.helper.meta.office_code = data.office_code || window.helper.meta.office_code;
    if (data.date) window.helper.meta.damage_date = data.date;
    
    // Update stakeholders
    if (data.owner) {
      window.helper.stakeholders.owner.name = data.owner;
    }
    if (data.garage_name) {
      window.helper.stakeholders.garage.name = data.garage_name;
    }
    
    // Update car_details with all data
    window.helper.car_details = { ...window.helper.car_details, ...data };
    
    // Save to sessionStorage
    sessionStorage.setItem('helper', JSON.stringify(window.helper));
    
    // Also update currentCaseData for floating screens
    window.currentCaseData = window.helper;
    sessionStorage.setItem('currentCaseData', JSON.stringify(window.helper));
    
    // Store in carData for old components
    sessionStorage.setItem('carData', JSON.stringify(data));
    
    console.log('✅ Helper updated:', window.helper);
    
    // Trigger UI updates
    if (window.refreshCarData) window.refreshCarData();
    if (window.forcePopulateFields) window.forcePopulateFields();
    
    // Broadcast update
    document.dispatchEvent(new CustomEvent('helperDataUpdated', { 
      detail: { data, source: 'unified-capture' } 
    }));
  }
  
  // Show notification (like the simulator does)
  function showDataNotification(data) {
    // Remove any existing notification
    const existing = document.getElementById('dataNotification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.id = 'dataNotification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #28a745, #20c997);
      color: white;
      padding: 20px;
      border-radius: 15px;
      font-weight: bold;
      z-index: 10000;
      box-shadow: 0 8px 25px rgba(0,0,0,0.3);
      font-family: 'Assistant', sans-serif;
      max-width: 600px;
      text-align: center;
    `;
    
    notification.innerHTML = `
      <div style="font-size: 18px; margin-bottom: 8px;">🚗 נתוני רכב התקבלו!</div>
      <div style="font-size: 14px; opacity: 0.9;">
        ${data.manufacturer} ${data.model} • ${data.year} • ${data.plate}
      </div>
      <button onclick="this.parentElement.remove()" style="position: absolute; top: 10px; left: 10px; background: transparent; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }
  
  // Override processIncomingData to use unified capture
  const originalProcessIncomingData = window.processIncomingData;
  window.processIncomingData = function(data, webhookId) {
    console.log('🎯 Intercepting processIncomingData');
    const processed = captureIncomingData(data, `webhook_${webhookId}`);
    
    // Call original if needed
    if (originalProcessIncomingData) {
      return originalProcessIncomingData.call(this, processed, webhookId);
    }
    
    return { success: true, data: processed };
  };
  
  // Test function
  window.testUnifiedCapture = function() {
    const testData = {
      Body: `פרטי רכב: 5785269
מס' רכב: 5785269
שם היצרן: ביואיק
דגם: LUCERNE
סוג הדגם: סדאן
רמת גימור:CXL
מספר שילדה: 1G4HD57258U196450
שנת ייצור: 05/2009
שם בעל הרכב: כרמל כיוף
נפח מנוע: 3791
סוג דלק: בנזין
מוסך: UMI חיפה`
    };
    
    captureIncomingData(testData, 'test');
  };
  
  console.log('💡 Unified capture ready. Use testUnifiedCapture() to test.');
})();
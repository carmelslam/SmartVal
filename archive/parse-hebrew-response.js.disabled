// Parse Hebrew response from Make.com
(function() {
  console.log('🔤 Hebrew Response Parser loaded');
  
  // Hebrew to English field mapping
  const hebrewFieldMap = {
    'פרטי רכב': 'plate', // First line with plate
    'מס\' רכב': 'plate',
    'מספר רכב': 'plate',
    'שם היצרן': 'manufacturer',
    'שם רכב': 'manufacturer',
    'דגם': 'model',
    'סוג הדגם': 'model_type',
    'סוג הרכב': 'vehicle_type',
    'סוג רכב': 'vehicle_type',
    'רמת גימור': 'trim',
    'מספר שילדה': 'chassis',
    'מספר שלדה': 'chassis',
    'שנת ייצור': 'year',
    'שנת יצור': 'year',
    'שם בעל הרכב': 'owner',
    'סוג בעלות': 'ownership_type',
    'נפח מנוע': 'engine_volume',
    'סוג דלק': 'fuel_type',
    'מספר דגם הרכב': 'model_code',
    'דגם מנוע': 'engine_model',
    'הנעה': 'drive_type',
    'מוסך': 'garage_name',
    'קוד משרד התחבורה': 'office_code',
    'תאריך רישוי': 'registration_date',
    'תאריך': 'timestamp',
    'שם בעלים': 'owner',
    'בעל הרכב': 'owner',
    'מיקום': 'location',
    'מקום בדיקה': 'location'
  };
  
  // Parse Hebrew text response
  window.parseHebrewCarData = function(text) {
    console.log('📥 Parsing Hebrew car data...');
    
    const result = {};
    
    // Split by lines and parse each field
    const lines = text.split('\n');
    lines.forEach(line => {
      // Try different separators
      let parts = line.split(':');
      if (parts.length < 2) {
        parts = line.split('：'); // Full-width colon
      }
      
      if (parts.length >= 2) {
        const hebrewKey = parts[0].trim();
        const value = parts.slice(1).join(':').trim();
        
        // Find English key
        const englishKey = hebrewFieldMap[hebrewKey];
        if (englishKey) {
          result[englishKey] = value;
          console.log(`  ${hebrewKey} → ${englishKey}: ${value}`);
        } else {
          // Store with Hebrew key if no mapping
          result[hebrewKey] = value;
          console.log(`  ${hebrewKey}: ${value} (no mapping)`);
        }
      }
    });
    
    // Extract year from production date if needed
    if (!result.year && result.year && result.year.includes('/')) {
      result.year = result.year.split('/')[1];
    }
    
    return result;
  };
  
  // Override webhook response handler
  const originalProcessIncomingData = window.processIncomingData;
  window.processIncomingData = function(data, webhookId) {
    console.log('🔍 Intercepting incoming data for Hebrew parsing...');
    
    // Check if data contains Hebrew text response
    if (data && data.Body && typeof data.Body === 'string' && data.Body.includes('מס\' רכב')) {
      console.log('📥 Detected Hebrew car data in Body field');
      const parsedData = parseHebrewCarData(data.Body);
      
      // Merge with existing data
      const enrichedData = {
        ...data,
        ...parsedData,
        raw_hebrew_response: data.Body
      };
      
      // Store in multiple locations
      sessionStorage.setItem('makeCarData', JSON.stringify(enrichedData));
      sessionStorage.setItem('carData', JSON.stringify(enrichedData));
      
      // Update helper
      updateHelperFromParsedData(enrichedData);
      
      // Call original if exists
      if (originalProcessIncomingData) {
        return originalProcessIncomingData.call(this, enrichedData, webhookId);
      }
      
      return { success: true, data: enrichedData };
    }
    
    // Check for array format with Body field
    if (Array.isArray(data) && data[0] && data[0].Body) {
      console.log('📥 Detected array format with Body field');
      const bodyText = data[0].Body;
      
      if (typeof bodyText === 'string' && bodyText.includes('מס\' רכב')) {
        const parsedData = parseHebrewCarData(bodyText);
        
        // Store enriched data
        sessionStorage.setItem('makeCarData', JSON.stringify(parsedData));
        sessionStorage.setItem('carData', JSON.stringify(parsedData));
        
        updateHelperFromParsedData(parsedData);
        
        return { success: true, data: parsedData };
      }
    }
    
    // Call original handler
    if (originalProcessIncomingData) {
      return originalProcessIncomingData.call(this, data, webhookId);
    }
  };
  
  function updateHelperFromParsedData(data) {
    console.log('🔧 Updating helper with parsed Hebrew data...');
    
    window.helper = window.helper || {};
    
    window.helper.vehicle = {
      plate: data.plate || '',
      manufacturer: data.manufacturer || '',
      model: data.model || '',
      model_type: data.vehicle_type || '',
      trim: data.trim || '',
      year: data.year || '',
      chassis: data.chassis || '',
      engine_volume: data.engine_volume || '',
      fuel_type: data.fuel_type || '',
      engine_model: data.engine_model || '',
      drive_type: data.drive_type || '',
      office_code: data.office_code || ''
    };
    
    window.helper.meta = {
      plate: data.plate || '',
      location: data.location || '',
      office_code: data.office_code || ''
    };
    
    window.helper.stakeholders = window.helper.stakeholders || {};
    window.helper.stakeholders.owner = {
      name: data.owner || ''
    };
    
    window.helper.car_details = data;
    
    sessionStorage.setItem('helper', JSON.stringify(window.helper));
    console.log('✅ Helper updated with Hebrew data:', window.helper);
    
    // Refresh UI
    if (window.forcePopulateFields) {
      window.forcePopulateFields();
    }
    if (window.refreshCarData) {
      window.refreshCarData();
    }
  }
  
  // Test function
  window.testHebrewParse = function() {
    const sampleText = `מס' רכב: 5785269
שם רכב: ביואיק
דגם: LUCERNE
סוג הרכב: פרטי
רמת גימור: CXL
מספר שילדה: 1G4HD57258U196450
שנת ייצור: 05/2009
נפח מנוע: 3791
סוג דלק: בנזין`;
    
    const result = parseHebrewCarData(sampleText);
    console.log('Test parse result:', result);
    return result;
  };
  
  console.log('💡 Use testHebrewParse() to test Hebrew parsing');
})();
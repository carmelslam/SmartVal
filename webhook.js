// ✅ FIXED: Use global window functions instead of imports (helper.js no longer exports)
// Functions are available as: window.updateHelper, window.updateHelperAndSession, etc.

// ✅ Centralized Webhook Handler – Clean + Unified with Enhanced Data Capture
export const WEBHOOKS = {
  PASSWORD_PAGE: 'https://hook.eu2.make.com/7yjzw6g5p0p9nx4if96khsmipch7o1dk',
  OPEN_CASE_UI: 'https://hook.eu2.make.com/zhvqbvx2yp69rikm6euv0r2du8l6sh61',
  SUBMIT_LEVI_REPORT: 'https://hook.eu2.make.com/xtvmwp6m3nxqge422clhs8v2hc74jid9',
  SAVE_LEVI_RESULTS: 'https://hook.eu2.make.com/xtvmwp6m3nxqge422clhs8v2hc74jid9',
  // SAVE_MANUAL_LEVI: 'https://hook.eu2.make.com/[MANUAL_LEVI_WEBHOOK_URL]', // Placeholder - disabled

  UPLOAD_PICTURES: 'https://hook.eu2.make.com/yksx9gtoxggvpalsjw2n1ut4kdi4jt24',
  TRANSFORM_PICTURES: 'https://hook.eu2.make.com/pum6ogmlxfe2edi8wd5i1d9oybcus76f',
  CREATE_PDF: 'https://hook.eu2.make.com/alpsl6kcdkp8pddemmloohbbd3lxv43u',

LAUNCH_EXPERTISE: 'https://hook.eu2.make.com/ysj95d4nk7igro19k0dgi4mj0p9uegf5',
EXPERTISE_HTML: 'https://hook.eu2.make.com/7e78v6idlf5j4glq7tesn4bidws2rfkh',
SAVE_EXPERTISE_SUMMARY: 'https://hook.eu2.make.com/ysj95d4nk7igro19k0dgi4mj0p9uegf5',
FINAL_REPORT_DRAFT: 'https://hook.eu2.make.com/j5qb0obvpa6maab9j4a7t71o70brqdfp',
  SUBMIT_FINAL_REPORT: 'https://hook.eu2.make.com/humgj4nyifchtnivuatdrh6u9slj8xrh',
  OCR_INVOICES: 'https://hook.eu2.make.com/w11tujdfbmq03co3vakb2jfr5vo4k6w6',
  FILL_FINAL_REPORT: 'https://hook.eu2.make.com/bd81gxcw37qavq62avte893czvgjuwr5',

  SEARCH_MODULE: 'https://hook.eu2.make.com/n3bbnj3izbymrmq6baj0vgaqhhin9fmd',
  PARTS_SEARCH: 'https://hook.eu2.make.com/xenshho1chvd955wpaum5yh51v8klo58',
  PARTS_IMAGE_SEARCH: 'https://hook.eu2.make.com/ud8wxs74pn88ktum4iilf5wm7rs3sjdf',
  INTERNAL_PARTS_OCR: 'https://hook.eu2.make.com/w11tujdfbmq03co3vakb2jfr5vo4k6w6',
 EXPORT_SELECTED_PARTS: 'https://hook.eu2.make.com/imvnclrrvmbg3vpp8synqsynedb9qit1',
 EXPORT_FULL_SEARCH_RESULTS: 'https://hook.eu2.make.com/a6lvfjq983t0feg6mjf6yrymxrf4aysk',
  DEV_HUB: 'https://hook.eu2.make.com/cg8j5gu0wyum6yrbl4rz2myd0pew3znt',
  ADMIN_HUB: 'https://hook.eu2.make.com/xwr4rxw9sp1v16ihuw4ldgyxa312hg2p',
  ADMIN_EXPORT_SEARCH_RESULTS: 'https://hook.eu2.make.com/rocp5ue661qn3597akgptja4ol9cnksy',

  // Estimate and Case Management Webhooks
  SUBMIT_ESTIMATE: 'https://hook.eu2.make.com/7dvgi7patq0vlgbd53hjbjasf6tek16l',
  SUBMIT_ESTIMATE_DRAFT: 'https://hook.eu2.make.com/g3ew34k2nunnodlp91eb1a0kpntnr5x3',
  
  // Helper export on logout - sends complete helper data with plate_helper_timestamp format
  HELPER_EXPORT: 'https://hook.eu2.make.com/thf4d1awjgx0eqt0clmr2vkj9gmxfl6p',

  // ✅ ADMIN + DEV HUB ADDITIONS — Confirmed by User
  ADMIN_FETCH_CASE: 'https://hook.eu2.make.com/diap4e9rewewyfjbwn6dypse9t16l8r9',
  ADMIN_FETCH_TRACKING_TABLE: 'https://hook.eu2.make.com/5x25yesk4fwh4mp13yku95f4xld196v9',
  ADMIN_CREATE_REMINDER: 'https://hook.eu2.make.com/9ifgnde1twem4bov64gy1vi5bfvesj0m',
  ADMIN_FETCH_REMINDERS: 'https://hook.eu2.make.com/td9fb37c83dcn9h6zxyoy0vekmglj14a',
  AUTH_VERIFY_USER: 'https://hook.eu2.make.com/mzpa0otk0oxxfznrp4mn2nhg5mj4h5xn',
  ADMIN_FETCH_FIELDS: 'https://hook.eu2.make.com/urzpd316748hb4m6c5qx4uf8trqlbyf9',
  DELETE_CASE_IN_ONEDRIVE: 'https://hook.eu2.make.com/vf1wem86lba5nmjm6ipa3ugrcx3zljbs',

  // Push notifications webhook for task management system
  ADMIN_PUSH_NOTIFICATION: 'https://hook.eu2.make.com/lzpl8fo7eef62cp642zbbtmph8ujuhlx',

  // DEPRECATED - Use ADMIN_PUSH_NOTIFICATION instead
  // PUSH_NOTIFICATION: 'https://hook.eu2.make.com/e41e2zm9f26ju5m815yfgn1ou41wwwhd',
  
  
  // Call expertise report webhook
  CALL_EXPERTISE: 'https://hook.eu2.make.com/wrl8onixkqki3dy81s865ptpdn82svux',
  
  // Call estimate report webhook
  CALL_ESTIMATE: 'https://hook.eu2.make.com/c24t8du4gye39lbgk7f4b7hc8lmojo50',
  
  // Fetch PDF webhooks - using dedicated endpoints
  FETCH_EXPERTISE_PDF: 'https://hook.eu2.make.com/lvlni0nc6dmas8mjdvd39jcbx4rlsxon', // Use LAUNCH_EXPERTISE for PDF fetching
  FETCH_ESTIMATE_PDF: 'https://hook.eu2.make.com/p1emfh80u503ourf49r2s9kxklhkz58d'


};

// Explicit export for search assistant usage
export const SEARCH_MODULE = WEBHOOKS.SEARCH_MODULE;

// General JSON payload webhook sender
export async function sendToWebhook(id, payload) {
  console.log(`🔗 Sending webhook: ${id}`, payload);
  
  const url = WEBHOOKS[id];
  if (!url) {
    console.error(`❌ Webhook [${id}] not registered`);
    throw new Error(`Webhook [${id}] not registered`);
  }

  // Check for placeholder URLs
  if (url.includes('[') && url.includes(']')) {
    console.error(`❌ Webhook [${id}] has placeholder URL: ${url}`);
    throw new Error(`Webhook [${id}] is not properly configured (placeholder URL)`);
  }

  const options = {
    method: 'POST',
    body: payload instanceof FormData ? payload : JSON.stringify(payload)
  };
  if (!(payload instanceof FormData)) {
    options.headers = { 'Content-Type': 'application/json' };
  }

  try {
    console.log(`🌐 Calling webhook URL: ${url}`);
    const res = await fetch(url, options);
    
    console.log(`📡 Response status: ${res.status} ${res.statusText}`);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ HTTP Error: ${res.status} - ${errorText}`);
      throw new Error(`HTTP ${res.status}: ${res.statusText} - ${errorText}`);
    }

    // Try to parse as JSON, but handle plain text responses like "Accepted"
    let data;
    const responseText = await res.text();
    console.log(`📥 Raw response:`, responseText);
    
    try {
      data = JSON.parse(responseText);
      console.log(`📥 Parsed JSON data:`, data);
      
      // 🔧 PHASE 3 FIX: Enhanced Make.com array format parsing
      let actualData = data;
      
      // Check if response is an array format (multiple possible structures)
      if (Array.isArray(data) && data.length > 0) {
        console.log('📥 Detected Make.com array response format');
        
        // Method 1: Standard Make.com format with 'value' field
        const firstItem = data[0];
        if (firstItem && firstItem.value) {
          console.log('📦 Found Make.com standard format with value field');
          
          // Handle nested JSON string in value field
          if (typeof firstItem.value === 'string') {
            try {
              // Try to parse as JSON
              actualData = JSON.parse(firstItem.value);
              console.log('✅ Extracted nested JSON from Make.com array:', actualData);
            } catch (e) {
              console.warn('⚠️ Value field is not JSON, using as text:', e);
              // Handle as plain text (might be Hebrew text from webhook)
              actualData = { Body: firstItem.value };
            }
          } else if (typeof firstItem.value === 'object') {
            actualData = firstItem.value;
            console.log('✅ Using object from Make.com value field:', actualData);
          }
        }
        
        // Method 2: Direct array format (each item is a data field)
        else if (firstItem && !firstItem.value && typeof firstItem === 'object') {
          console.log('📦 Found Make.com direct array format');
          // 🔧 FIX: Enhanced processing to prevent value concatenation
          actualData = {};
          const seenFields = new Map(); // Track seen fields to prevent duplicates
          
          data.forEach((item, index) => {
            if (item && typeof item === 'object') {
              Object.entries(item).forEach(([key, value]) => {
                // Skip null, undefined, or empty values
                if (value === null || value === undefined || value === '') {
                  return;
                }
                
                // If field not seen before, add it
                if (!seenFields.has(key)) {
                  actualData[key] = value;
                  seenFields.set(key, value);
                  console.log(`✅ Added field ${key}: ${value}`);
                } else {
                  // Check if it's a duplicate value
                  const existingValue = seenFields.get(key);
                  if (String(existingValue).trim() === String(value).trim()) {
                    console.log(`⏭️ Skipping duplicate value for ${key}: ${value}`);
                  } else {
                    console.warn(`⚠️ Conflicting values for ${key}: "${existingValue}" vs "${value}" - keeping first value`);
                  }
                }
              });
            }
          });
          console.log('✅ Processed array data without duplicates:', actualData);
        }
        
        // Method 3: Body field array format (common for Hebrew text)
        else if (data.some(item => item && item.Body)) {
          console.log('📦 Found Make.com Body field array format');
          const bodyItem = data.find(item => item && item.Body);
          if (bodyItem) {
            actualData = bodyItem;
            console.log('✅ Using Body field data from Make.com array:', actualData);
          }
        }
        
        // Method 4: Collection/bundle format
        else if (firstItem && (firstItem.collection || firstItem.bundle)) {
          console.log('📦 Found Make.com collection/bundle format');
          const collectionData = firstItem.collection || firstItem.bundle;
          if (Array.isArray(collectionData) && collectionData.length > 0) {
            actualData = collectionData[0];
            console.log('✅ Using first item from Make.com collection:', actualData);
          }
        }
        
        // Method 5: Fallback - use entire array as data
        else {
          console.log('📦 Using entire Make.com array as data');
          actualData = { array_data: data };
        }
      }
      
      // Handle special case: single item array with nested structure
      else if (Array.isArray(data) && data.length === 1 && typeof data[0] === 'object') {
        console.log('📥 Single item array format detected');
        actualData = data[0];
      }
      
      // 🔧 CRITICAL FIX: Ensure ALL non-error webhook responses are processed
      if (!actualData && data && typeof data === 'object') {
        console.log('📥 No actualData set, using original data directly');
        actualData = data;
      } else if (!actualData && data && typeof data === 'string') {
        console.log('📥 String response detected, wrapping for processing');
        actualData = { Body: data };
      }
      
      // ✅ ENHANCED: Universal data processing and helper integration  
      if (actualData && (typeof actualData === 'object' || typeof actualData === 'string')) {
        console.log('📥 Processing webhook response data:', actualData);
        console.log('📥 Webhook ID:', id);
        
        // Store in multiple locations for compatibility
        sessionStorage.setItem('makeCarData', JSON.stringify(actualData));
        sessionStorage.setItem('carData', JSON.stringify(actualData));
        
        // ENHANCED: Force immediate form population regardless of helper processing
        console.log('🔄 FORCE POPULATING FORMS: Attempting immediate form update');
        try {
          if (typeof window.refreshAllModuleForms === 'function') {
            console.log('🔄 Force refreshing all module forms (before helper processing)...');
            window.refreshAllModuleForms();
          }
          
          // 🔧 FEATURES TEXT PRESERVATION: Handle duplicate "מאפיינים" keys in Levi JSON
          // Extract features text before it gets overwritten by duplicate key
          let featuresText = '';
          if (typeof actualData === 'object') {
            // Check for features in the full JSON string to capture both instances
            const jsonString = JSON.stringify(actualData);
            const featuresRegex = /"מאפיינים"\s*:\s*"([^"]+(?:,[^"]+)*)"/g;
            let match;
            while ((match = featuresRegex.exec(jsonString)) !== null) {
              const value = match[1];
              // Take the longer value (likely the actual features, not just "מאפיינים")
              if (value.length > featuresText.length && value !== 'מאפיינים') {
                featuresText = value;
              }
            }
            console.log('🔧 FEATURES EXTRACTION:', { featuresText, actualDataFeatures: actualData['מאפיינים'] });
          }
          
          // Enhanced direct field population with comprehensive mappings
          const directFieldMappings = {
            // Basic vehicle fields with Hebrew alternatives
            'plate': actualData.plate || actualData.מספר_רכב || actualData['מס\' רכב'] || actualData['מס רכב'] || actualData.license_plate,
            'plateNumber': actualData.plate || actualData.מספר_רכב || actualData['מס\' רכב'] || actualData['מס רכב'] || actualData.license_plate,
            'manufacturer': actualData.manufacturer || actualData.יצרן || actualData['שם היצרן'] || actualData.make,
            'model': actualData.model || actualData.דגם || actualData['שם דגם'],
            'year': actualData.year || actualData['שנת ייצור'] || actualData['שנת יצור'] || actualData.שנת_ייצור,
            'owner': actualData.owner || actualData.בעלים || actualData['שם בעל הרכב'] || actualData.owner_name || actualData.client_name,
            'ownerName': actualData.owner || actualData.בעלים || actualData['שם בעל הרכב'] || actualData.owner_name || actualData.client_name,
            'client_name': actualData.owner || actualData.בעלים || actualData['שם בעל הרכב'] || actualData.owner_name || actualData.client_name,
            'km': actualData.km || actualData.mileage || actualData.קילומטראז || actualData['מס\' ק\"מ'] || actualData.קילומטרים,
            'odo': actualData.km || actualData.mileage || actualData.קילומטראז || actualData['מס\' ק\"מ'] || actualData.קילומטרים,
            'chassis': actualData.chassis || actualData.vin || actualData['מספר שילדה'] || actualData.שילדה,
            'vin': actualData.chassis || actualData.vin || actualData['מספר שילדה'] || actualData.שילדה,
            'engine_volume': actualData.engine_volume || actualData['נפח מנוע'] || actualData.נפח_מנוע,
            'fuel_type': actualData.fuel_type || actualData['סוג דלק'] || actualData.דלק,
            'ownership_type': actualData.ownership_type || actualData['סוג בעלות'] || actualData.בעלות,
            'trim': actualData.trim || actualData['רמת גימור'] || actualData.גימור,
            'model_type': actualData.model_type || actualData['סוג הדגם'],
            'office_code': actualData.office_code || actualData['קוד משרד התחבורה'] || actualData['קוד משרד'],
            'model_code': actualData.model_code || actualData['קוד דגם'],
            'features': actualData.features || actualData.מאפיינים || actualData['מאפייני הרכב'],
            'category': actualData.category || actualData.קטיגוריה,
            'is_automatic': actualData.is_automatic || actualData.אוטומט,
            
            // Stakeholder fields
            'garage_name': actualData.garage_name || actualData.garage || actualData.מוסך,
            'garageName': actualData.garage_name || actualData.garage || actualData.מוסך,
            'garage': actualData.garage_name || actualData.garage || actualData.מוסך,
            'insurance_company': actualData.insurance_company || actualData['חברת ביטוח'] || actualData.ביטוח,
            'insuranceCompany': actualData.insurance_company || actualData['חברת ביטוח'] || actualData.ביטוח,
            
            // Valuation fields
            'base_price': actualData.base_price || actualData['מחיר בסיס'],
            'final_price': actualData.final_price || actualData['מחיר סופי'] || actualData['מחיר סופי לרכב'],
            'market_value': actualData.market_value || actualData['שווי שוק'] || actualData.final_price,
            'report_date': actualData.report_date || actualData['תאריך דוח'] || actualData['תאריך הוצאת הדוח'],
            'registration_date': actualData.registration_date || actualData['עליה לכביש'],
            'owner_count': actualData.owner_count || actualData['מספר בעלים'],
            
            // Case info fields  
            'damage_date': actualData.damage_date || actualData['תאריך נזק'],  // Only from general info - won't exist in case opening webhook
            'damageDate': actualData.damage_date || actualData['תאריך נזק'],   // Only from general info - won't exist in case opening webhook
            'damage_type': actualData.damage_type || actualData['סוג נזק'],
            'damageType': actualData.damage_type || actualData['סוג נזק'],
            // CRITICAL FIX: Map webhook "תאריך הבדיקה" to inspection_date (not damage_date)
            'inspection_date': actualData.inspection_date || actualData['תאריך הבדיקה'] || actualData['תאריך בדיקה'],
            // CRITICAL FIX: Map webhook "מקום בדיקה" to inspection_location (not garage_name) 
            'location': actualData.location || actualData['מקום בדיקה'] || actualData.inspection_location,
            'inspection_location': actualData['מקום בדיקה'] || actualData.location || actualData.inspection_location,
            
            // 🔧 LEVI FORM FIELD MAPPINGS - Manual adjustment form fields
            'manual-registration': actualData['עליה לכביש'] || actualData['ערך עליה לכביש'],
            'manual-registration-percent': actualData['עליה לכביש %'],
            'manual-registration-value': actualData['ערך ש"ח עליה לכביש'],
            'manual-registration-total': actualData['שווי מצטבר עליה לכביש'],
            
            'manual-ownership': actualData['בעלות'] || actualData['ערך בעלות'],
            'manual-ownership-percent': actualData['בעלות %'],
            'manual-ownership-value': actualData['ערך ש"ח בעלות'],
            'manual-ownership-total': actualData['שווי מצטבר בעלות'],
            
            'manual-km': actualData['מס ק"מ'] || actualData['ערך מס ק"מ'],
            'manual-km-percent': actualData['מס ק"מ %'],
            'manual-km-value': actualData['ערך ש"ח מס ק"מ'],
            'manual-km-total': actualData['שווי מצטבר מס ק"מ'],
            
            'manual-owners': actualData['מספר בעלים'] || actualData['ערך מספר בעלים'],
            'manual-owners-percent': actualData['מספר בעלים %'],
            'manual-owners-value': actualData['ערך ש"ח מספר בעלים'],
            'manual-owners-total': actualData['שווי מצטבר מספר בעלים'],
            
            'manual-features': actualData['מאפיינים'],
            'manual-features-percent': actualData['מחיר מאפיינים %'],
            'manual-features-value': actualData['ערך ש"ח מאפיינים'],
            'manual-features-total': actualData['שווי מצטבר  מאפיינים'],
            
            'base-price': actualData['מחיר בסיס'],
            'final-price': actualData['מחיר סופי לרכב'],
            
            // 🔧 FEATURES TEXT FIX: Use preserved features text
            'features-text': featuresText
          };
          
          let populatedCount = 0;
          Object.keys(directFieldMappings).forEach(fieldId => {
            const value = directFieldMappings[fieldId];
            if (value && value !== '' && value !== '-' && value !== null) {
              // 🔧 ENHANCED FIELD DETECTION: Try multiple selectors to find the element
              let element = null;
              const selectors = [
                `#${fieldId}`,                                    // Exact ID match
                `[name="${fieldId}"]`,                           // Name attribute match
                `input[placeholder*="${fieldId}"]`,              // Placeholder contains field name
                `#${fieldId.toLowerCase()}`,                     // Lowercase ID
                `#${fieldId.replace('_', '')}`,                  // Remove underscores
                `#${fieldId.replace('_', '-')}`,                 // Replace underscore with dash
                `[data-field="${fieldId}"]`,                     // Data attribute
                `[data-helper-field="${fieldId}"]`,              // Helper data attribute
              ];
              
              // Try each selector until we find an element
              for (const selector of selectors) {
                try {
                  element = document.querySelector(selector);
                  if (element) {
                    console.log(`✅ Webhook found element for ${fieldId} using selector: ${selector}`);
                    break;
                  }
                } catch (e) {
                  // Ignore invalid selectors
                }
              }
              
              if (element) {
                // 🔧 CRITICAL FIX: Force populate from webhook data (override existing values)
                const currentValue = element.value?.trim() || '';
                const newValue = String(value).trim();
                
                // Only populate if we have a meaningful new value and it's different
                if (newValue && newValue !== '' && newValue !== '-' && newValue !== 'undefined' && newValue !== 'null') {
                  // Handle different input types
                  if (element.type === 'checkbox') {
                    const shouldBeChecked = value === true || value === 'כן' || value === 'yes' || value === 'true';
                    if (element.checked !== shouldBeChecked) {
                      element.checked = shouldBeChecked;
                      populatedCount++;
                      console.log(`✅ Direct populated checkbox ${fieldId}: ${shouldBeChecked}`);
                    }
                  } else if (currentValue !== newValue) {
                    // Force update the value
                    element.value = newValue;
                    
                    // Add visual indicator for webhook-populated fields
                    element.style.borderLeft = '4px solid #28a745';
                    element.style.backgroundColor = '#f8fff8';
                    element.title = `Auto-populated from webhook: ${newValue}`;
                    
                    // Trigger multiple events for compatibility
                    ['input', 'change', 'keyup', 'blur'].forEach(eventType => {
                      element.dispatchEvent(new Event(eventType, { bubbles: true }));
                    });
                    
                    populatedCount++;
                    console.log(`✅ Direct populated ${fieldId}: "${currentValue}" → "${newValue}"`);
                  }
                }
              } else {
                console.log(`⚠️ Element not found for field: ${fieldId}`);
              }
            }
          });
          
          if (populatedCount > 0) {
            console.log(`✅ Direct form population: ${populatedCount} fields updated`);
          }
          
        } catch (directError) {
          console.warn('⚠️ Direct form population failed:', directError);
        }
        
        try {
          // 🔧 CORE FIX: Skip webhook processing for OPEN_CASE_UI (handled by open-cases.html)
          if (id === 'OPEN_CASE_UI') {
            console.log('⏭️ Skipping webhook processing for OPEN_CASE_UI - handled by page-specific logic');
          } else if (typeof window.processIncomingData === 'function') {
            console.log('🔄 CRITICAL: Processing webhook data via processIncomingData...');
            console.log('📊 Data type:', typeof actualData, 'Webhook ID:', id);
            
            // Ensure we process the data even if it's a string
            const dataToProcess = (typeof actualData === 'string') ? { Body: actualData } : actualData;
            
            await window.processIncomingData(dataToProcess, id);
            console.log('✅ CRITICAL: Data processed via processIncomingData successfully');
          } else if (typeof window.updateHelperAndSession === 'function') {
            // Fallback for simple updates
            Object.keys(actualData).forEach(key => {
              window.updateHelperAndSession(key, actualData[key]);
            });
            console.log('✅ Data processed and helper updated (fallback)');
          } else {
            // Direct sessionStorage update as final fallback
            sessionStorage.setItem('helper', JSON.stringify(actualData));
            window.helper = actualData;
            console.log('✅ Data stored in sessionStorage and window.helper (final fallback)');
          }
        } catch (error) {
          console.error('❌ Error updating helper:', error);
          // Simple fallback
          sessionStorage.setItem('helper', JSON.stringify(actualData));
          window.helper = actualData;
        }
      }
    } catch (jsonError) {
      // Handle plain text responses
      const trimmedResponse = responseText.trim();
      console.log(`📝 Plain text response: "${trimmedResponse}"`);
      
      // Check if response is "Accepted" (processing started)
      if (trimmedResponse === 'Accepted' || trimmedResponse === 'accepted') {
        console.log(`✅ Webhook ${id} returned "Accepted" - processing started`);
        const hebrewMessage = id === 'CALL_EXPERTISE' ? 
          'הבקשה לאקספירטיזה התקבלה לעיבוד! תקבל התראה כשהקובץ יהיה מוכן.' :
          id === 'CALL_ESTIMATE' ?
          'הבקשה לאומדן התקבלה לעיבוד! תקבל התראה כשהקובץ יהיה מוכן.' :
          'הבקשה התקבלה לעיבוד!';
          
        return { 
          success: true, 
          message: hebrewMessage,
          processing: true,
          raw_response: trimmedResponse,
          webhook_id: id,
          timestamp: new Date().toISOString()
        };
      }
      
      // Check if response is a URL (potential PDF view link)
      if (trimmedResponse.startsWith('http://') || trimmedResponse.startsWith('https://')) {
        console.log(`🔗 Webhook ${id} returned URL: ${trimmedResponse}`);
        const hebrewMessage = id === 'CALL_EXPERTISE' ? 
          'קישור לאקספירטיזה התקבל!' :
          id === 'CALL_ESTIMATE' ?
          'קישור לאומדן התקבל!' :
          'קישור למסמך התקבל!';
          
        return { 
          success: true, 
          message: hebrewMessage,
          pdf_url: trimmedResponse,
          raw_response: trimmedResponse,
          webhook_id: id,
          timestamp: new Date().toISOString()
        };
      }
      
      // Handle other plain text responses (like "No files found")
      console.log(`📄 Plain text response received: ${trimmedResponse}`);
      
      // Check for common "no results" responses
      if (trimmedResponse.toLowerCase().includes('no files') || 
          trimmedResponse.toLowerCase().includes('not found') ||
          trimmedResponse.toLowerCase().includes('no results')) {
        return { 
          success: true, 
          message: 'לא נמצאו קבצים במערכת',
          no_files: true,
          raw_response: trimmedResponse,
          webhook_id: id,
          timestamp: new Date().toISOString()
        };
      }
      
      // For any other plain text response, return it as-is
      return { 
        success: true, 
        message: trimmedResponse,
        raw_response: trimmedResponse,
        webhook_id: id,
        timestamp: new Date().toISOString()
      };
    }
    
    // Enhanced validation for business logic errors
    if (data && typeof data === 'object') {
      // Check for explicit error indicators
      if (data.error === true || data.status === 'error' || data.success === false) {
        const errorMsg = data.message || data.error_message || 'Server validation failed';
        console.error(`❌ Server validation error: ${errorMsg}`);
        throw new Error(errorMsg);
      }
      
      // Check for Make.com automation failures
      if (data.make_status === 'error' || data.automation_failed === true) {
        const errorMsg = data.make_error || 'Make.com automation execution failed';
        console.error(`❌ Make.com automation error: ${errorMsg}`);
        throw new Error(errorMsg);
      }
      
      // Check for validation errors array
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        const errorMsg = `Validation errors: ${data.errors.join(', ')}`;
        console.error(`❌ Validation errors: ${errorMsg}`);
        throw new Error(errorMsg);
      }
      
      // Check for admin/permission errors
      if (data.access_denied === true || data.permission_error === true) {
        const errorMsg = data.permission_message || 'Access denied - insufficient permissions';
        console.error(`❌ Permission error: ${errorMsg}`);
        throw new Error(errorMsg);
      }
    }
    
    console.log(`✅ Webhook ${id} completed successfully`);
    
    // Check if JSON response contains PDF URL
    if (data && (data.pdf_url || data.url || data.link)) {
      const pdfUrl = data.pdf_url || data.url || data.link;
      console.log(`📄 PDF URL found in JSON response: ${pdfUrl}`);
      
      // Add Hebrew message for PDF availability
      const hebrewMessage = id === 'CALL_EXPERTISE' ? 
        'אקספירטיזה מוכנה לצפייה!' :
        id === 'CALL_ESTIMATE' ?
        'אומדן מוכן לצפייה!' :
        'המסמך מוכן לצפייה!';
      
      return {
        ...data,
        success: true,
        message: hebrewMessage,
        pdf_url: pdfUrl,
        webhook_id: id,
        timestamp: new Date().toISOString()
      };
    }
    
    return data;
  } catch (e) {
    console.error(`❌ Webhook ${id} failed:`, e);
    
    // Always return a proper response object instead of throwing
    let errorMessage = 'Unknown error occurred';
    
    if (e.message.includes('Failed to fetch')) {
      errorMessage = 'Network error: Could not connect to webhook service. Please check your internet connection.';
    } else if (e.message.includes('HTTP')) {
      errorMessage = e.message; // Use the HTTP error message
    } else if (e.message.includes('Server validation')) {
      errorMessage = e.message; // Use the server validation error
    } else if (e.message.includes('Make.com automation')) {
      errorMessage = e.message; // Use the Make.com error
    } else if (e.message.includes('not registered')) {
      errorMessage = e.message; // Use the webhook registration error
    } else if (e.message.includes('placeholder')) {
      errorMessage = e.message; // Use the placeholder error
    } else {
      errorMessage = e.message || 'Unknown error occurred';
    }
    
    return { 
      success: false, 
      error: errorMessage,
      webhook_id: id,
      timestamp: new Date().toISOString()
    };
  }
}

// 🔧 PHASE 3 FIX: Fallback notification system for better user feedback
function createFallbackNotification(message, type = 'info', duration = 5000) {
  console.log('📢 Creating fallback notification:', { message, type });
  
  try {
    // Remove any existing fallback notifications
    const existingNotification = document.getElementById('fallback-notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'fallback-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      padding: 15px 20px;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: white;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
      direction: rtl;
      text-align: right;
    `;
    
    // Set colors based on type
    const colors = {
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545',
      info: '#17a2b8'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
      notification.style.opacity = '1';
    }, 100);
    
    // Auto remove after duration
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100px)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, duration);
    
    console.log('✅ Fallback notification created and displayed');
    
  } catch (error) {
    console.error('❌ Failed to create fallback notification:', error);
    // Final fallback - just alert
    if (typeof alert !== 'undefined') {
      alert(message);
    }
  }
}

// ✅ FIXED: Enhanced part search function with proper payload structure and response capture
export function sendPartSearch(data) {
  console.log('🔍 Parts Search: Preparing structured payload for Make.com');
  
  // ✅ CREATE FLATTENED PAYLOAD for better webhook processing
  const structuredPayload = {
    // Vehicle Information
    manufacturer: data.manufacturer || "",
    model: data.model || "",
    trim: data.trim || "",
    model_code: data.engine_code || data.model_code || "",
    year: data.year || "",
    engine: data.engine_type || "",
    engine_volume: data.engine_volume || "",
    engine_model: data.engine_type || "",
    engine_type: data.engine_type || "",
    vin_number: data.vin || "",
    plate: data.plate || "",
    
    // Search Parameters
    keyword: data.free_query || "",
    part_group: data.part_group || "",
    search_type: data.search_type || "system_search",
    
    // Flatten parts information for easier processing
    parts_count: (data.selectedParts && data.selectedParts.length > 0) ? data.selectedParts.length : 0,
    parts_list: (data.selectedParts && data.selectedParts.length > 0) ? 
      data.selectedParts.map(part => `${part.group || ''}: ${part.name || ''} (${part.source || 'מקורי'})`).join('; ') : "",
    
    // Individual part fields (flattened for first 3 parts)
    ...(data.selectedParts && data.selectedParts.length > 0 && data.selectedParts[0] ? {
      part_1_group: data.selectedParts[0].group || "",
      part_1_name: data.selectedParts[0].name || "",
      part_1_quantity: data.selectedParts[0].qty || 1,
      part_1_source: data.selectedParts[0].source || "",
      part_1_price: data.selectedParts[0].price || "",
      part_1_supplier: data.selectedParts[0].supplier || ""
    } : {}),
    
    ...(data.selectedParts && data.selectedParts.length > 1 && data.selectedParts[1] ? {
      part_2_group: data.selectedParts[1].group || "",
      part_2_name: data.selectedParts[1].name || "",
      part_2_quantity: data.selectedParts[1].qty || 1,
      part_2_source: data.selectedParts[1].source || "",
      part_2_price: data.selectedParts[1].price || "",
      part_2_supplier: data.selectedParts[1].supplier || ""
    } : {}),
    
    ...(data.selectedParts && data.selectedParts.length > 2 && data.selectedParts[2] ? {
      part_3_group: data.selectedParts[2].group || "",
      part_3_name: data.selectedParts[2].name || "",
      part_3_quantity: data.selectedParts[2].qty || 1,
      part_3_source: data.selectedParts[2].source || "",
      part_3_price: data.selectedParts[2].price || "",
      part_3_supplier: data.selectedParts[2].supplier || ""
    } : {}),
    
    // Additional fields
    image_data: data.part_image_base64 || "",
    timestamp: new Date().toISOString(),
    source: "parts_search_module"
  };
  
  console.log('📤 Sending structured payload to Make.com:', structuredPayload);
  
  return fetch(WEBHOOKS.PARTS_SEARCH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(structuredPayload)
  })
    .then(res => {
      console.log(`📡 Webhook response status: ${res.status} ${res.statusText}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res.text(); // Get as text first to handle different response formats
    })
    .then(responseText => {
      console.log('📥 Raw webhook response:', responseText);
      
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
        console.log('✅ Parsed JSON response:', parsedResponse);
      } catch (parseError) {
        console.warn('⚠️ Response is not JSON, treating as text:', responseText);
        parsedResponse = { message: responseText, raw: responseText };
      }
      
      // ✅ ENHANCED RESPONSE CAPTURE: Handle Make.com response format
      let processedResults = null;
      
      if (parsedResponse) {
        // Check for direct results array
        if (parsedResponse.results && Array.isArray(parsedResponse.results)) {
          processedResults = {
            plate: parsedResponse.plate || structuredPayload.plate,
            date: parsedResponse.date || new Date().toISOString(),
            results: parsedResponse.results,
            search_context: {
              query: structuredPayload,
              timestamp: new Date().toISOString(),
              results_count: parsedResponse.results.length
            }
          };
          console.log('✅ Found results array in response:', processedResults);
        }
        
        // Check for Make.com array format
        else if (Array.isArray(parsedResponse) && parsedResponse.length > 0) {
          console.log('📦 Detected Make.com array response format');
          const firstItem = parsedResponse[0];
          
          // Try to extract nested data
          if (firstItem && firstItem.value) {
            try {
              const nestedData = typeof firstItem.value === 'string' ? 
                JSON.parse(firstItem.value) : firstItem.value;
              
              if (nestedData.results && Array.isArray(nestedData.results)) {
                processedResults = {
                  plate: nestedData.plate || structuredPayload.plate,
                  date: nestedData.date || new Date().toISOString(),
                  results: nestedData.results,
                  search_context: {
                    query: structuredPayload,
                    timestamp: new Date().toISOString(),
                    results_count: nestedData.results.length
                  }
                };
                console.log('✅ Extracted results from Make.com nested format:', processedResults);
              }
            } catch (extractError) {
              console.error('❌ Failed to extract nested data:', extractError);
            }
          }
        }
        
        // Check for parts field (alternative format)
        else if (parsedResponse.parts && Array.isArray(parsedResponse.parts)) {
          processedResults = {
            plate: structuredPayload.plate,
            date: new Date().toISOString(),
            results: parsedResponse.parts.map(part => ({
              group: "תוצאות חיפוש",
              name: part.name || part.description || "",
              search_results: [part]
            })),
            search_context: {
              query: structuredPayload,
              timestamp: new Date().toISOString(),
              results_count: parsedResponse.parts.length
            }
          };
          console.log('✅ Converted parts array to results format:', processedResults);
        }
      }
      
      // ✅ SAVE TO HELPER WITH ENHANCED STRUCTURE
      if (processedResults && processedResults.results && processedResults.results.length > 0) {
        console.log('💾 Saving search results to helper with enhanced structure');
        
        // Update helper with comprehensive parts search data
        window.updateHelperAndSession("parts_search", {
          current_session: {
            results: processedResults.results,
            search_context: processedResults.search_context,
            response_captured_at: new Date().toISOString()
          },
          all_results: processedResults.results,
          search_history: [{
            query: structuredPayload,
            results: processedResults.results,
            timestamp: new Date().toISOString(),
            results_count: processedResults.results.length
          }],
          case_summary: {
            total_searches: 1,
            total_results: processedResults.results.length,
            last_search: new Date().toISOString(),
            plate: processedResults.plate
          }
        });
        
        // ✅ CRITICAL FIX: Also save search results to current damage center if in wizard
        const activeDamageCenterId = sessionStorage.getItem('active_damage_center_id') || 
                                      (window.damageCenterData && window.damageCenterData.id);
        
        if (activeDamageCenterId && typeof window.updateDamageCenter === 'function') {
          console.log('💾 Saving search results to active damage center:', activeDamageCenterId);
          
          const damageCenter = window.getDamageCenterById(activeDamageCenterId);
          if (damageCenter) {
            // Update damage center with search results
            const searchData = {
              parts_search_results: processedResults.results,
              parts_search_meta: {
                search_timestamp: new Date().toISOString(),
                results_count: processedResults.results.length,
                search_query: structuredPayload,
                webhook_response: processedResults
              },
              last_search_session: new Date().toISOString()
            };
            
            window.updateDamageCenter(activeDamageCenterId, searchData);
            console.log('✅ Search results saved to damage center:', activeDamageCenterId);
          }
        } else {
          console.log('⚠️ No active damage center found for search results');
        }
        
        // Also store the raw response for debugging
        sessionStorage.setItem('last_parts_search_response', JSON.stringify(processedResults));
        
        console.log(`✅ Parts search completed: ${processedResults.results.length} result groups saved to helper`);
        
        return {
          success: true,
          parts: processedResults.results,
          raw_response: parsedResponse,
          search_context: processedResults.search_context
        };
      } else {
        console.log('⚠️ No structured results found in response');
        return {
          success: true,
          message: responseText,
          raw_response: parsedResponse,
          no_results: true
        };
      }
    })
    .catch(err => {
      console.error('❌ Error in parts search:', err);
      
      return {
        success: false,
        error: err.message || 'שגיאה בחיפוש חלקים',
        search_context: {
          query: structuredPayload,
          timestamp: new Date().toISOString(),
          error: err.message
        }
      };
    });
}

// File upload webhook for internal OCR flow
export function sendSearchResultFile(file, meta = {}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('meta', JSON.stringify(meta));

  fetch(WEBHOOKS.INTERNAL_PARTS_OCR, {
    method: 'POST',
    body: formData
  })
    .then(res => {
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    })
    .then(response => {
      console.log('✅ Search result uploaded:', response);
      alert('קובץ נשלח לניתוח בהצלחה');
    })
    .catch(err => {
      console.error('❌ Failed to send result file:', err);
      alert('שגיאה בשליחת קובץ החיפוש');
    });
}

export { sendToWebhook as sendExtraWebhook };

export function getWebhook(key) {
  return WEBHOOKS[key] || '';
}
window.WEBHOOKS = WEBHOOKS;

// Handle incoming webhook data from Make.com
function handleWebhookData(data) {
  Object.entries(data).forEach(([key, value]) => {
    window.updateHelperAndSession(key, value);
  });
}

// Example: receiving data from Make.com
window.addEventListener('makeWebhook', (event) => {
  handleWebhookData(event.detail); // event.detail should be the data object
});

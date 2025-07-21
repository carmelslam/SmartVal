// Removed import to prevent module errors - functions accessed via window object

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

  LAUNCH_EXPERTISE: 'https://hook.eu2.make.com/lvlni0nc6dmas8mjdvd39jcbx4rlsxon',
  SUBMIT_FINAL_REPORT: 'https://hook.eu2.make.com/humgj4nyifchtnivuatdrh6u9slj8xrh',
  OCR_INVOICES: 'https://hook.eu2.make.com/9xs0avqydq7uyq944189dyt584ccknm',
  FILL_FINAL_REPORT: 'https://hook.eu2.make.com/bd81gxcw37qavq62avte893czvgjuwr5',

  SEARCH_MODULE: 'https://hook.eu2.make.com/n3bbnj3izbymrmq6baj0vgaqhhin9fmd',
  PARTS_SEARCH: 'https://hook.eu2.make.com/xenshho1chvd955wpaum5yh51v8klo58',
  INTERNAL_PARTS_OCR: 'https://hook.eu2.make.com/w11tujdfbmq03co3vakb2jfr5vo4k6w6',
  DEV_HUB: 'https://hook.eu2.make.com/cg8j5gu0wyum6yrbl4rz2myd0pew3znt',
  ADMIN_HUB: 'https://hook.eu2.make.com/xwr4rxw9sp1v16ihuw4ldgyxa312hg2p',
  ADMIN_EXPORT_SEARCH_RESULTS: 'https://hook.eu2.make.com/rocp5ue661qn3597akgptja4ol9cnksy',

  // Estimate and Case Management Webhooks
  SUBMIT_ESTIMATE: 'https://hook.eu2.make.com/7dvgi7patq0vlgbd53hjbjasf6tek16l',
  
  // Helper export on logout - sends complete helper data with plate_helper_timestamp format
  HELPER_EXPORT: 'https://hook.eu2.make.com/thf4d1awjgx0eqt0clmr2vkj9gmxfl6p',

  // ✅ ADMIN + DEV HUB ADDITIONS — Confirmed by User
  ADMIN_FETCH_CASE: 'https://hook.eu2.make.com/diap4e9rewewyfjbwn6dypse9t16l8r9',
  ADMIN_FETCH_TRACKING_TABLE: 'https://hook.eu2.make.com/5x25yesk4fwh4mp13yku95f4xld196v9',
  ADMIN_CREATE_REMINDER: 'https://hook.eu2.make.com/9ifgnde1twem4bov64gy1vi5bfvesj0m',
  ADMIN_FETCH_REMINDERS: 'https://hook.eu2.make.com/td9fb37c83dcn9h6zxyoy0vekmglj14a',
  AUTH_VERIFY_USER: 'https://hook.eu2.make.com/mzpa0otk0oxxfznrp4mn2nhg5mj4h5xn',
  ADMIN_FETCH_FIELDS: 'https://hook.eu2.make.com/urzpd316748hb4m6c5qx4uf8trqlbyf9',
  // Used by Make automations to push notifications to user system
  PUSH_NOTIFICATION: 'https://hook.eu2.make.com/e41e2zm9f26ju5m815yfgn1ou41wwwhd',
  
  
  // Call expertise report webhook
  CALL_EXPERTISE: 'https://hook.eu2.make.com/wrl8onixkqki3dy81s865ptpdn82svux',
  
  // Call estimate report webhook
  CALL_ESTIMATE: 'https://hook.eu2.make.com/c24t8du4gye39lbgk7f4b7hc8lmojo50',
  
  // Fetch PDF webhooks - using dedicated endpoints
  FETCH_EXPERTISE_PDF: 'https://hook.eu2.make.com/lvlni0nc6dmas8mjdvd39jcbx4rlsxon', // Use LAUNCH_EXPERTISE for PDF fetching
  FETCH_ESTIMATE_PDF: 'https://hook.eu2.make.com/thf4d1awjgx0eqt0clmr2vkj9gmxfl6p'


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
          // Combine all array items into single object
          actualData = {};
          data.forEach((item, index) => {
            if (item && typeof item === 'object') {
              Object.assign(actualData, item);
            }
          });
          console.log('✅ Combined Make.com array items:', actualData);
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
      
      // ✅ ENHANCED: Universal data processing and helper integration
      if (actualData && typeof actualData === 'object') {
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
            'damage_date': actualData.damage_date || actualData['תאריך נזק'],
            'damageDate': actualData.damage_date || actualData['תאריך נזק'],
            'damage_type': actualData.damage_type || actualData['סוג נזק'],
            'damageType': actualData.damage_type || actualData['סוג נזק'],
            'inspection_date': actualData.inspection_date || actualData['תאריך בדיקה'],
            'location': actualData.location || actualData['מקום בדיקה'] || actualData.inspection_location,
            'inspection_location': actualData.location || actualData['מקום בדיקה'] || actualData.inspection_location
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
          // Simple direct helper update - restore original working method
          if (typeof window.updateHelperAndSession === 'function') {
            // Update each field directly in helper
            Object.keys(actualData).forEach(key => {
              window.updateHelperAndSession(key, actualData[key]);
            });
            console.log('✅ Data processed and helper updated');
          } else if (typeof window.processIncomingData === 'function') {
            // Use processIncomingData if available
            await window.processIncomingData(actualData, id);
            console.log('✅ Data processed via processIncomingData');
          } else {
            // Direct sessionStorage update as fallback
            sessionStorage.setItem('helper', JSON.stringify(actualData));
            window.helper = actualData;
            console.log('✅ Data stored in sessionStorage and window.helper');
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

// Specialized part search function
export function sendPartSearch(data) {
  fetch(WEBHOOKS.PARTS_SEARCH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task: 'part_search',
      payload: data
    })
  })
    .then(res => {
      if (!res.ok) throw new Error('Request failed');
      return res.json();
    })
    .then(response => {
      console.log('✅ Part search request sent:', response);
      alert('הבקשה נשלחה בהצלחה!');

      if (Array.isArray(response.results)) {
        if (typeof window.updateHelperAndSession === 'function') {
          window.updateHelperAndSession("parts_search", {
            summary: {
              total_results: response.results.length,
              recommended: response.recommended || ''
            },
            results: response.results
          });
        }
      }
    })
    .catch(err => {
      console.error('❌ Error sending part search:', err);
      alert('שגיאה בשליחת הבקשה');
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
    if (typeof window.updateHelperAndSession === 'function') {
      window.updateHelperAndSession(key, value);
    }
  });
}

// Example: receiving data from Make.com
window.addEventListener('makeWebhook', (event) => {
  handleWebhookData(event.detail); // event.detail should be the data object
});

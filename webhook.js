import { updateHelper } from './helper.js';

// ✅ Centralized Webhook Handler – Clean + Unified
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
  ESTIMATE_EXPORT: 'https://hook.eu2.make.com/thf4d1awjgx0eqt0clmr2vkj9gmxfl6p',

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
        updateHelper("parts_search", {
          summary: {
            total_results: response.results.length,
            recommended: response.recommended || ''
          },
          results: response.results
        });
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

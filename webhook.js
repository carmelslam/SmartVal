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

    const data = await res.json();
    console.log(`📥 Response data:`, data);
    
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
    return data;
  } catch (e) {
    console.error(`❌ Webhook ${id} failed:`, e);
    
    // If it's already an error we threw above, re-throw it
    if (e.message && !e.message.includes('JSON') && !e.message.includes('Failed to fetch')) {
      throw e;
    }
    
    // Network or parsing error
    if (e.message.includes('Failed to fetch')) {
      throw new Error(`Network error: Could not connect to webhook service. Please check your internet connection.`);
    }
    
    // JSON parsing error
    console.warn('Response is not valid JSON, returning undefined');
    return undefined;
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

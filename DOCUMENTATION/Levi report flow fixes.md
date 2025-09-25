# Claude Cursor Prompt: Levi Report System Improvements

## Overview
Fix critical issues with the Levi report OCR system including data preservation, proper field handling, and admin recovery tools. These changes focus on improving data integrity and user experience.

## Issue 1: Selective Levi Report Re-upload

### Problem
Re-uploading a Levi report currently clears ALL system data instead of just replacing Levi-specific data.

### Solution Implementation

```javascript
// services/LeviReportService.js

class LeviReportService {
  constructor() {
    this.leviDataKeys = [
      // Define all Levi-specific data keys
      'levi_report_data',
      'levi_ocr_results',
      'levi_extracted_fields',
      'levi_vehicle_info',
      'levi_technical_specs'
      // Add all Levi-specific keys from your system
    ];
  }

  /**
   * Replace only Levi data while preserving other system data
   * @param {File} file - New Levi report file
   * @param {boolean} preserveOtherData - If true, keep non-Levi data
   */
  async reuploadLeviReport(file, preserveOtherData = true) {
    if (preserveOtherData) {
      // Store current non-Levi data
      const preservedData = this.preserveNonLeviData();
      
      // Clear only Levi data
      this.clearLeviData();
      
      // Process new Levi report
      const ocrResults = await this.processLeviOCR(file);
      
      // Restore preserved data
      this.restorePreservedData(preservedData);
      
      // Save new Levi data
      this.saveLeviData(ocrResults);
      
      return ocrResults;
    } else {
      // Old behavior - clear everything (for backward compatibility)
      this.clearAllSystemData();
      return await this.processLeviOCR(file);
    }
  }

  /**
   * Preserve all non-Levi data
   */
  preserveNonLeviData() {
    const allData = this.getAllSystemData();
    const preserved = {};
    
    Object.keys(allData).forEach(key => {
      if (!this.leviDataKeys.includes(key)) {
        preserved[key] = allData[key];
      }
    });
    
    return preserved;
  }

  /**
   * Clear only Levi-specific data
   */
  clearLeviData() {
    this.leviDataKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      // Clear from your state management (Redux/Vuex/Context)
      // store.dispatch({ type: 'CLEAR_LEVI_DATA', key });
    });
  }

  /**
   * Get all system data (implement based on your storage method)
   */
  getAllSystemData() {
    // Adjust based on your data storage approach
    return {
      ...JSON.parse(localStorage.getItem('system_data') || '{}'),
      ...JSON.parse(sessionStorage.getItem('session_data') || '{}')
    };
  }

  /**
   * Restore preserved non-Levi data
   */
  restorePreservedData(data) {
    Object.keys(data).forEach(key => {
      // Restore to appropriate storage
      if (this.isPersistent(key)) {
        localStorage.setItem(key, JSON.stringify(data[key]));
      } else {
        sessionStorage.setItem(key, JSON.stringify(data[key]));
      }
    });
  }

  /**
   * Save new Levi data from OCR
   */
  saveLeviData(ocrResults) {
    const leviData = {
      timestamp: new Date().toISOString(),
      ocrResults: ocrResults,
      extractedFields: this.extractFields(ocrResults),
      version: Date.now()
    };
    
    localStorage.setItem('levi_report_data', JSON.stringify(leviData));
    
    // Trigger UI update
    window.dispatchEvent(new CustomEvent('levi-data-updated', { 
      detail: leviData 
    }));
  }
}

export default new LeviReportService();
```

### UI Component Update

```javascript
// components/LeviUploadPage.js

import LeviReportService from '../services/LeviReportService';

function LeviUploadComponent() {
  const [preserveData, setPreserveData] = useState(true);
  
  const handleReupload = async (file) => {
    // Show confirmation dialog
    const message = preserveData 
      ? 'החלפת דו״ח לוי - הנתונים האחרים במערכת יישמרו'
      : 'החלפת דו״ח לוי - כל הנתונים במערכת יימחקו';
    
    if (confirm(message)) {
      const results = await LeviReportService.reuploadLeviReport(file, preserveData);
      // Handle results
    }
  };
  
  return (
    <div>
      {/* Add checkbox for data preservation option */}
      <label>
        <input 
          type="checkbox" 
          checked={preserveData}
          onChange={(e) => setPreserveData(e.target.checked)}
        />
        שמור נתונים אחרים במערכת בעת העלאה מחדש
      </label>
      
      {/* File upload component */}
      <input type="file" onChange={(e) => handleReupload(e.target.files[0])} />
    </div>
  );
}
```

## Issue 2: New Case Button with Data Clearing

### Implementation

```javascript
// components/NewCasePage.js

class NewCaseManager {
  constructor() {
    this.protectedFields = ['vat_rate']; // Admin-defined fields to preserve
  }

  /**
   * Create the new case button and modal
   */
  createNewCaseButton() {
    const button = document.createElement('button');
    button.id = 'newCaseBtn';
    button.className = 'btn-primary new-case-btn';
    button.textContent = 'פתח תיק חדש';
    button.onclick = () => this.showNewCaseModal();
    return button;
  }

  /**
   * Show confirmation modal
   */
  showNewCaseModal() {
    // Create modal HTML
    const modal = document.createElement('div');
    modal.className = 'modal new-case-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>פתיחת תיק חדש</h3>
        <p class="warning-text">
          ⚠️ כל הנתונים של התיק הנוכחי יימחקו
          <br>
          (מלבד שיעור מע״מ שהוגדר על ידי המנהל)
        </p>
        <div class="modal-buttons">
          <button class="btn-confirm" onclick="newCaseManager.confirmNewCase()">
            אישור - פתח תיק חדש
          </button>
          <button class="btn-cancel" onclick="newCaseManager.closeModal()">
            ביטול
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
  }

  /**
   * Confirm and create new case
   */
  async confirmNewCase() {
    try {
      // Preserve protected data
      const preservedData = this.preserveProtectedData();
      
      // Clear all system data
      await this.clearAllData();
      
      // Restore protected data
      this.restoreProtectedData(preservedData);
      
      // Unlock all form fields
      this.unlockAllFields();
      
      // Reset form to initial state
      this.resetForms();
      
      // Close modal
      this.closeModal();
      
      // Show success message
      this.showSuccessMessage('תיק חדש נפתח בהצלחה');
      
    } catch (error) {
      console.error('Error creating new case:', error);
      this.showErrorMessage('שגיאה בפתיחת תיק חדש');
    }
  }

  /**
   * Preserve admin-defined data
   */
  preserveProtectedData() {
    const preserved = {};
    this.protectedFields.forEach(field => {
      const value = localStorage.getItem(field) || 
                   document.getElementById(field)?.value;
      if (value) {
        preserved[field] = value;
      }
    });
    return preserved;
  }

  /**
   * Clear all system data
   */
  async clearAllData() {
    // Clear localStorage
    const keysToKeep = this.protectedFields;
    Object.keys(localStorage).forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear form data
    document.querySelectorAll('input, textarea, select').forEach(field => {
      if (!this.protectedFields.includes(field.id)) {
        field.value = '';
      }
    });
    
    // Clear state management (adjust for your framework)
    // store.dispatch({ type: 'RESET_STATE' });
  }

  /**
   * Restore protected data
   */
  restoreProtectedData(data) {
    Object.keys(data).forEach(key => {
      localStorage.setItem(key, data[key]);
      const field = document.getElementById(key);
      if (field) {
        field.value = data[key];
      }
    });
  }

  /**
   * Unlock all form fields for new input
   */
  unlockAllFields() {
    document.querySelectorAll('input, textarea, select').forEach(field => {
      field.disabled = false;
      field.readOnly = false;
      field.classList.remove('locked', 'disabled');
    });
  }

  /**
   * Close modal
   */
  closeModal() {
    const modal = document.querySelector('.new-case-modal');
    if (modal) {
      modal.remove();
    }
  }

  /**
   * Show success message
   */
  showSuccessMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
}

// Initialize
const newCaseManager = new NewCaseManager();
window.newCaseManager = newCaseManager;

// Add button to page on load
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.case-actions') || 
                   document.querySelector('.page-header');
  if (container) {
    container.appendChild(newCaseManager.createNewCaseButton());
  }
});
```

### CSS for Modal and Button

```css
/* styles/new-case.css */

.new-case-btn {
  background: #2196F3;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
}

.new-case-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: none;
  z-index: 10000;
}

.modal-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 500px;
  text-align: center;
}

.warning-text {
  color: #f44336;
  margin: 20px 0;
  font-size: 16px;
}

.modal-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.btn-confirm {
  background: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-cancel {
  background: #f44336;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
```

## Issue 3: Fix Ministry Code Field (Password Autofill Issue)

### Solution

```javascript
// Fix for the קוד משרד התחבורה field

// Option 1: Update the HTML input field
function fixMinistryCodeField() {
  const field = document.querySelector('#ministry_code') || 
                document.querySelector('[name="ministry_code"]');
  
  if (field) {
    // Remove password-related attributes
    field.type = 'text';
    field.autocomplete = 'off';
    field.removeAttribute('data-form-type');
    
    // Add attributes to prevent password manager
    field.setAttribute('autocomplete', 'new-password-disable');
    field.setAttribute('data-lpignore', 'true'); // LastPass
    field.setAttribute('data-1p-ignore', 'true'); // 1Password
    
    // Alternative: wrap in div with autocomplete off
    const wrapper = document.createElement('div');
    wrapper.setAttribute('autocomplete', 'off');
    field.parentNode.insertBefore(wrapper, field);
    wrapper.appendChild(field);
  }
}

// Option 2: React/Vue component fix
const MinistryCodeInput = () => {
  return (
    <input
      type="text"
      name="ministry_code_field" // Avoid common password field names
      id="ministry_code"
      placeholder="קוד משרד התחבורה"
      autoComplete="off"
      data-lpignore="true"
      data-form-type="other"
      onPaste={(e) => e.stopPropagation()} // Prevent password manager interference
    />
  );
};

// Option 3: Add to form initialization
document.addEventListener('DOMContentLoaded', () => {
  // Prevent all password autofill on Levi page
  const leviForm = document.querySelector('#levi-upload-form');
  if (leviForm) {
    leviForm.setAttribute('autocomplete', 'off');
    
    // Specifically fix the ministry code field
    const inputs = leviForm.querySelectorAll('input');
    inputs.forEach(input => {
      if (input.id.includes('ministry') || input.name.includes('ministry')) {
        input.type = 'text';
        input.autocomplete = 'off';
        input.setAttribute('readonly', true);
        // Remove readonly on focus
        input.onfocus = () => input.removeAttribute('readonly');
      }
    });
  }
});
```

## Issue 4: Fix Save Results Button (שמור תוצאות)

### Implementation

```javascript
// services/OCRResultsService.js

class OCRResultsService {
  constructor() {
    this.storageKey = 'ocr_results';
    this.backupKey = 'ocr_results_backup';
  }

  /**
   * Initialize save button with proper functionality
   */
  initializeSaveButton() {
    const saveBtn = document.querySelector('.save-results-btn') || 
                   document.querySelector('[data-action="save-ocr"]');
    
    if (saveBtn) {
      // Remove any existing error-causing listeners
      saveBtn.replaceWith(saveBtn.cloneNode(true));
      
      const newBtn = document.querySelector('.save-results-btn') || 
                     document.querySelector('[data-action="save-ocr"]');
      
      newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.saveOCRResults();
      });
    }
  }

  /**
   * Save OCR results properly
   */
  saveOCRResults() {
    try {
      // Get OCR results from the page
      const ocrData = this.extractOCRData();
      
      if (!ocrData || Object.keys(ocrData).length === 0) {
        this.showMessage('אין תוצאות OCR לשמירה', 'warning');
        return;
      }
      
      // Save to multiple locations for redundancy
      this.saveToLocalStorage(ocrData);
      this.saveToSessionStorage(ocrData);
      this.saveToDatabase(ocrData);
      
      // Update UI to show saved state
      this.updateUIAfterSave();
      
      // Show success message
      this.showMessage('התוצאות נשמרו בהצלחה', 'success');
      
    } catch (error) {
      console.error('Error saving OCR results:', error);
      this.showMessage('שגיאה בשמירת התוצאות', 'error');
      
      // Log error for debugging
      this.logError(error);
    }
  }

  /**
   * Extract OCR data from the page
   */
  extractOCRData() {
    const data = {};
    
    // Collect all OCR result fields
    document.querySelectorAll('[data-ocr-field]').forEach(field => {
      const fieldName = field.getAttribute('data-ocr-field');
      data[fieldName] = field.value || field.textContent;
    });
    
    // Add metadata
    data.savedAt = new Date().toISOString();
    data.source = 'levi_ocr';
    
    return data;
  }

  /**
   * Save to localStorage
   */
  saveToLocalStorage(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
    // Keep backup
    localStorage.setItem(this.backupKey, JSON.stringify(data));
  }

  /**
   * Save to sessionStorage
   */
  saveToSessionStorage(data) {
    sessionStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  /**
   * Save to database (adjust for your backend)
   */
  async saveToDatabase(data) {
    try {
      const response = await fetch('/api/save-ocr-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Database save failed');
      }
    } catch (error) {
      // Fallback to local storage if database fails
      console.warn('Database save failed, data saved locally');
    }
  }

  /**
   * Update UI after successful save
   */
  updateUIAfterSave() {
    // Change button appearance
    const saveBtn = document.querySelector('.save-results-btn');
    if (saveBtn) {
      saveBtn.textContent = '✓ נשמר';
      saveBtn.classList.add('saved');
      
      // Reset after 3 seconds
      setTimeout(() => {
        saveBtn.textContent = '💾 שמור תוצאות';
        saveBtn.classList.remove('saved');
      }, 3000);
    }
    
    // Mark fields as saved
    document.querySelectorAll('[data-ocr-field]').forEach(field => {
      field.classList.add('saved');
    });
  }

  /**
   * Show user message
   */
  showMessage(message, type) {
    // Remove existing messages
    document.querySelectorAll('.ocr-message').forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `ocr-message ${type}`;
    messageDiv.textContent = message;
    
    const container = document.querySelector('.ocr-results-container') || 
                     document.body;
    container.appendChild(messageDiv);
    
    setTimeout(() => messageDiv.remove(), 5000);
  }

  /**
   * Log errors for debugging
   */
  logError(error) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      page: 'levi_upload',
      action: 'save_ocr_results'
    };
    
    // Store error log
    const errors = JSON.parse(localStorage.getItem('error_log') || '[]');
    errors.push(errorLog);
    localStorage.setItem('error_log', JSON.stringify(errors.slice(-50))); // Keep last 50 errors
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const ocrService = new OCRResultsService();
  ocrService.initializeSaveButton();
});

export default OCRResultsService;
```

## Issue 5: Admin Hub - Add Webhook Response Recovery Tools

### Implementation

```javascript
// components/AdminHub.js

class AdminWebhookRecovery {
  constructor() {
    this.webhookEndpoints = {
      levi: '/api/webhooks/levi-ocr',
      openCase: '/api/webhooks/open-case'
    };
  }

  /**
   * Create admin recovery panel
   */
  createRecoveryPanel() {
    const panel = document.createElement('div');
    panel.className = 'admin-recovery-panel';
    panel.innerHTML = `
      <h3>🔧 כלי תיקון נתונים</h3>
      
      <div class="recovery-section">
        <h4>טעינה מחדש של תגובות Webhook</h4>
        
        <div class="recovery-option">
          <label>Levi OCR Webhook Response</label>
          <button id="reloadLeviWebhook" class="btn-admin">
            🔄 טען מחדש תגובת Levi
          </button>
          <input type="text" id="leviCaseId" placeholder="מספר תיק (אופציונלי)">
        </div>
        
        <div class="recovery-option">
          <label>Open Case Webhook Response</label>
          <button id="reloadCaseWebhook" class="btn-admin">
            🔄 טען מחדש תגובת פתיחת תיק
          </button>
          <input type="text" id="caseNumber" placeholder="מספר תיק">
        </div>
      </div>
      
      <div class="recovery-section">
        <h4>תיקון נתונים חסרים/פגומים</h4>
        
        <button id="validateData" class="btn-admin">
          🔍 בדוק תקינות נתונים
        </button>
        
        <button id="restoreBackup" class="btn-admin">
          📥 שחזר מגיבוי
        </button>
        
        <button id="clearCorrupted" class="btn-admin">
          🗑️ נקה נתונים פגומים
        </button>
      </div>
      
      <div id="recoveryLog" class="recovery-log"></div>
    `;
    
    return panel;
  }

  /**
   * Initialize recovery functions
   */
  initializeRecoveryFunctions() {
    // Reload Levi Webhook
    document.getElementById('reloadLeviWebhook')?.addEventListener('click', async () => {
      const caseId = document.getElementById('leviCaseId').value || 'current';
      await this.reloadLeviWebhook(caseId);
    });
    
    // Reload Case Webhook
    document.getElementById('reloadCaseWebhook')?.addEventListener('click', async () => {
      const caseNumber = document.getElementById('caseNumber').value;
      if (!caseNumber) {
        this.logMessage('נא להזין מספר תיק', 'error');
        return;
      }
      await this.reloadCaseWebhook(caseNumber);
    });
    
    // Validate Data
    document.getElementById('validateData')?.addEventListener('click', () => {
      this.validateSystemData();
    });
    
    // Restore Backup
    document.getElementById('restoreBackup')?.addEventListener('click', () => {
      this.restoreFromBackup();
    });
    
    // Clear Corrupted
    document.getElementById('clearCorrupted')?.addEventListener('click', () => {
      this.clearCorruptedData();
    });
  }

  /**
   * Reload Levi webhook response
   */
  async reloadLeviWebhook(caseId) {
    this.logMessage(`מתחיל טעינה מחדש של Levi webhook עבור תיק ${caseId}...`);
    
    try {
      const response = await fetch(`${this.webhookEndpoints.levi}/reload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAdminToken()
        },
        body: JSON.stringify({ caseId })
      });
      
      if (!response.ok) throw new Error('Failed to reload webhook');
      
      const data = await response.json();
      
      // Update local storage with new data
      localStorage.setItem('levi_webhook_response', JSON.stringify(data));
      
      // Trigger UI update
      window.dispatchEvent(new CustomEvent('webhook-reloaded', { 
        detail: { type: 'levi', data } 
      }));
      
      this.logMessage('✅ Levi webhook נטען מחדש בהצלחה', 'success');
      
    } catch (error) {
      this.logMessage(`❌ שגיאה בטעינת Levi webhook: ${error.message}`, 'error');
    }
  }

  /**
   * Reload Open Case webhook response
   */
  async reloadCaseWebhook(caseNumber) {
    this.logMessage(`מתחיל טעינה מחדש של Open Case webhook עבור תיק ${caseNumber}...`);
    
    try {
      const response = await fetch(`${this.webhookEndpoints.openCase}/reload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAdminToken()
        },
        body: JSON.stringify({ caseNumber })
      });
      
      if (!response.ok) throw new Error('Failed to reload webhook');
      
      const data = await response.json();
      
      // Update system with new data
      this.updateSystemData(data);
      
      this.logMessage('✅ Open Case webhook נטען מחדש בהצלחה', 'success');
      
    } catch (error) {
      this.logMessage(`❌ שגיאה בטעינת Open Case webhook: ${error.message}`, 'error');
    }
  }

  /**
   * Validate system data integrity
   */
  validateSystemData() {
    this.logMessage('בודק תקינות נתונים...');
    
    const issues = [];
    const requiredFields = [
      'levi_report_data',
      'case_number',
      'vehicle_info',
      'customer_data'
    ];
    
    requiredFields.forEach(field => {
      const data = localStorage.getItem(field);
      if (!data) {
        issues.push(`חסר: ${field}`);
      } else {
        try {
          JSON.parse(data);
        } catch {
          issues.push(`פגום: ${field}`);
        }
      }
    });
    
    if (issues.length === 0) {
      this.logMessage('✅ כל הנתונים תקינים', 'success');
    } else {
      this.logMessage('⚠️ נמצאו בעיות:', 'warning');
      issues.forEach(issue => this.logMessage(`  - ${issue}`, 'warning'));
    }
    
    return issues;
  }

  /**
   * Restore from backup
   */
  restoreFromBackup() {
    const backup = localStorage.getItem('system_backup');
    
    if (!backup) {
      this.logMessage('❌ לא נמצא גיבוי', 'error');
      return;
    }
    
    try {
      const data = JSON.parse(backup);
      Object.keys(data).forEach(key => {
        localStorage.setItem(key, data[key]);
      });
      
      this.logMessage('✅ הנתונים שוחזרו מגיבוי', 'success');
      
      // Reload page to apply changes
      setTimeout(() => location.reload(), 2000);
      
    } catch (error) {
      this.logMessage('❌ שגיאה בשחזור גיבוי', 'error');
    }
  }

  /**
   * Clear corrupted data
   */
  clearCorruptedData() {
    this.logMessage('מנקה נתונים פגומים...');
    
    const allKeys = Object.keys(localStorage);
    let cleared = 0;
    
    allKeys.forEach(key => {
      const value = localStorage.getItem(key);
      try {
        // Try to parse as JSON
        if (value && value.startsWith('{') || value.startsWith('[')) {
          JSON.parse(value);
        }
      } catch {
        // Remove corrupted JSON data
        localStorage.removeItem(key);
        cleared++;
        this.logMessage(`  נוקה: ${key}`, 'info');
      }
    });
    
    if (cleared > 0) {
      this.logMessage(`✅ נוקו ${cleared} ערכים פגומים`, 'success');
    } else {
      this.logMessage('✅ לא נמצאו נתונים פגומים', 'success');
    }
  }

  /**
   * Log message to recovery log
   */
  logMessage(message, type = 'info') {
    const log = document.getElementById('recoveryLog');
    if (!log) return;
    
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
  }

  /**
   * Get admin authorization token
   */
  getAdminToken() {
    return localStorage.getItem('admin_token') || '';
  }

  /**
   * Update system data after webhook reload
   */
  updateSystemData(data) {
    Object.keys(data).forEach(key => {
      localStorage.setItem(key, JSON.stringify(data[key]));
    });
    
    // Trigger UI updates
    window.dispatchEvent(new Event('data-updated'));
  }
}

// Initialize admin recovery tools
document.addEventListener('DOMContentLoaded', () => {
  const adminHub = document.querySelector('.admin-hub');
  if (adminHub) {
    const recovery = new AdminWebhookRecovery();
    adminHub.appendChild(recovery.createRecoveryPanel());
    recovery.initializeRecoveryFunctions();
  }
});

export default AdminWebhookRecovery;
```

### CSS for Admin Recovery Panel

```css
/* styles/admin-recovery.css */

.admin-recovery-panel {
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.recovery-section {
  margin: 20px 0;
  padding: 15px;
  background: white;
  border-radius: 4px;
}

.recovery-option {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0;
}

.recovery-option label {
  width: 200px;
  font-weight: bold;
}

.btn-admin {
  background: #2196F3;
  color: white;
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-admin:hover {
  background: #1976D2;
}

.recovery-log {
  background: #1e1e1e;
  color: #fff;
  padding: 10px;
  border-radius: 4px;
  height: 200px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 12px;
  margin-top: 20px;
}

.log-entry {
  margin: 2px 0;
}

.log-entry.success { color: #4CAF50; }
.log-entry.error { color: #f44336; }
.log-entry.warning { color: #FF9800; }
.log-entry.info { color: #2196F3; }
```

## Testing Checklist

### Levi Re-upload
- [ ] Upload initial Levi report
- [ ] Fill other system data
- [ ] Re-upload Levi with "preserve data" checked
- [ ] Verify only Levi data replaced
- [ ] Verify other data intact

### New Case Button
- [ ] Click "פתח תיק חדש"
- [ ] Confirm modal appears with warning
- [ ] Click confirm
- [ ] Verify all data cleared except VAT rate
- [ ] Verify all fields unlocked

### Ministry Code Field
- [ ] Navigate to Levi upload page
- [ ] Click on ministry code field
- [ ] Verify no password save prompt
- [ ] Type text normally
- [ ] Verify browser doesn't treat as password

### Save Results Button
- [ ] Complete OCR process
- [ ] Click "שמור תוצאות"
- [ ] Verify success message
- [ ] Check localStorage for saved data
- [ ] Verify no console errors

### Admin Recovery Tools
- [ ] Access admin hub
- [ ] Test Levi webhook reload
- [ ] Test Open Case webhook reload
- [ ] Run data validation
- [ ] Test backup restore
- [ ] Clear corrupted data

## Important Notes

1. **Data Integrity**: Always backup before clearing data
2. **Webhook Security**: Ensure admin authentication for webhook reloads
3. **Error Handling**: Comprehensive logging for debugging
4. **User Feedback**: Clear messages for all operations
5. **RTL Support**: All Hebrew text properly aligned
6. **Browser Compatibility**: Test password field fix across browsers

This implementation provides robust solutions for all identified issues while maintaining system stability and data integrity.
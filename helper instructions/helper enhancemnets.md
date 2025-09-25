# Claude Cursor Prompt: Helper Naming & Versioning System

## Objective
Implement a helper identification and versioning system that automatically generates unique names, tracks versions, and manages helper lifecycle through webhooks and database storage.

## Core Requirements

### Helper Naming Convention
- Format: `{plate_number}_helper_v{version}`
- Example: `12345678_helper_v1` (initial), `12345678_helper_v2` (after changes)

### Three Core Identification Fields
1. **name**: Dynamic versioned name following the pattern above
2. **source**: Always "system"
3. **date**: ISO timestamp of current version creation

## Implementation Tasks

### Task 1: Create Helper Class/Module

Create a helper management module with the following structure:

```javascript
// helpers/HelperManager.js (or appropriate location in your project)

class HelperManager {
  constructor() {
    this.currentHelper = null;
    this.plateNumber = null;
    this.version = 1;
  }

  /**
   * Initialize a new helper for a case
   * @param {string} plateNumber - The case plate number
   * @returns {object} Helper object with name, source, and date
   */
  createHelper(plateNumber) {
    this.plateNumber = plateNumber;
    this.version = 1;
    
    this.currentHelper = {
      name: `${plateNumber}_helper_v${this.version}`,
      source: 'system',
      date: new Date().toISOString(),
      plateNumber: plateNumber,
      version: this.version,
      data: {} // Container for actual helper data
    };
    
    // Store in session/local storage
    this.saveToSession();
    
    return this.currentHelper;
  }

  /**
   * Increment version when changes are saved
   * @returns {object} Updated helper with new version
   */
  incrementVersion() {
    if (!this.currentHelper) return null;
    
    this.version++;
    this.currentHelper.name = `${this.plateNumber}_helper_v${this.version}`;
    this.currentHelper.version = this.version;
    this.currentHelper.date = new Date().toISOString();
    
    this.saveToSession();
    return this.currentHelper;
  }

  /**
   * Save helper to session storage
   */
  saveToSession() {
    if (this.currentHelper) {
      sessionStorage.setItem('current_helper', JSON.stringify(this.currentHelper));
      sessionStorage.setItem('helper_version', this.version.toString());
    }
  }

  /**
   * Load helper from session storage
   */
  loadFromSession() {
    const stored = sessionStorage.getItem('current_helper');
    if (stored) {
      this.currentHelper = JSON.parse(stored);
      this.plateNumber = this.currentHelper.plateNumber;
      this.version = this.currentHelper.version;
    }
    return this.currentHelper;
  }

  /**
   * Get current helper
   */
  getCurrentHelper() {
    return this.currentHelper;
  }
}

export default new HelperManager();
```

### Task 2: Integrate Helper Creation with Case Initialization

Find where cases are started and add helper creation:

```javascript
// In your case initialization component/function

import HelperManager from './helpers/HelperManager';

function startCase(plateNumber) {
  // Existing case initialization code...
  
  // Create helper for this case
  const helper = HelperManager.createHelper(plateNumber);
  console.log('Helper created:', helper.name);
  
  // Continue with existing logic...
}
```

### Task 3: Implement Version Increment on Save

Hook into all save operations to increment the helper version:

```javascript
// In your save handlers throughout the application

import HelperManager from './helpers/HelperManager';

function saveChanges(data) {
  // Existing save logic...
  
  // Increment helper version
  const updatedHelper = HelperManager.incrementVersion();
  console.log('Helper version updated:', updatedHelper.name);
  
  // Continue with save process...
}
```

### Task 4: Create Export Service for Webhook and Supabase

```javascript
// services/HelperExportService.js

class HelperExportService {
  constructor() {
    this.WEBHOOK_URL = process.env.EXPORT_HELPER_WEBHOOK || 'YOUR_MAKE_COM_WEBHOOK_URL';
    this.supabaseClient = null; // Initialize with your Supabase client
  }

  /**
   * Export helper on logout/session termination
   * @param {object} helper - The helper object to export
   */
  async exportHelper(helper) {
    if (!helper) return;

    try {
      // Save to Supabase
      await this.saveToSupabase(helper);
      
      // Send to Make.com webhook
      await this.sendToWebhook(helper);
      
      console.log('Helper exported successfully:', helper.name);
    } catch (error) {
      console.error('Helper export failed:', error);
      // Implement retry logic or queue for later
      this.queueForRetry(helper);
    }
  }

  /**
   * Save helper to Supabase
   */
  async saveToSupabase(helper) {
    // Adjust table name and structure to match your Supabase schema
    const { data, error } = await this.supabaseClient
      .from('helpers')
      .upsert({
        name: helper.name,
        source: helper.source,
        date: helper.date,
        plate_number: helper.plateNumber,
        version: helper.version,
        data: helper.data,
        created_at: helper.date
      }, {
        onConflict: 'name' // Upsert based on unique name
      });

    if (error) throw error;
    return data;
  }

  /**
   * Send helper to Make.com webhook
   */
  async sendToWebhook(helper) {
    const response = await fetch(this.WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        helper_name: helper.name,
        source: helper.source,
        date: helper.date,
        plate_number: helper.plateNumber,
        version: helper.version,
        data: helper.data,
        event: 'HELPER_EXPORT',
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Queue failed exports for retry
   */
  queueForRetry(helper) {
    const queue = JSON.parse(localStorage.getItem('helper_export_queue') || '[]');
    queue.push({
      helper,
      attemptedAt: new Date().toISOString()
    });
    localStorage.setItem('helper_export_queue', JSON.stringify(queue));
  }

  /**
   * Process retry queue (call periodically)
   */
  async processRetryQueue() {
    const queue = JSON.parse(localStorage.getItem('helper_export_queue') || '[]');
    const failed = [];

    for (const item of queue) {
      try {
        await this.exportHelper(item.helper);
      } catch (error) {
        failed.push(item);
      }
    }

    localStorage.setItem('helper_export_queue', JSON.stringify(failed));
  }
}

export default new HelperExportService();
```

### Task 5: Implement Session Termination Handlers

```javascript
// utils/SessionManager.js

import HelperManager from './helpers/HelperManager';
import HelperExportService from './services/HelperExportService';

class SessionManager {
  /**
   * Handle logout
   */
  async handleLogout() {
    const helper = HelperManager.getCurrentHelper();
    
    if (helper) {
      // Export helper before logout
      await HelperExportService.exportHelper(helper);
    }
    
    // Clear session data
    sessionStorage.clear();
    
    // Proceed with logout...
  }

  /**
   * Handle session timeout/termination
   */
  async handleSessionTermination() {
    const helper = HelperManager.getCurrentHelper();
    
    if (helper) {
      // Export helper before termination
      await HelperExportService.exportHelper(helper);
    }
    
    // Clear session
    sessionStorage.clear();
  }

  /**
   * Setup beforeunload listener for unexpected closures
   */
  setupUnloadListener() {
    window.addEventListener('beforeunload', (event) => {
      const helper = HelperManager.getCurrentHelper();
      
      if (helper) {
        // Try to export (note: may not complete if window closes too fast)
        HelperExportService.exportHelper(helper);
        
        // Store in localStorage as backup
        localStorage.setItem('pending_helper_export', JSON.stringify(helper));
      }
    });
  }

  /**
   * Check for pending exports on app start
   */
  checkPendingExports() {
    const pending = localStorage.getItem('pending_helper_export');
    
    if (pending) {
      const helper = JSON.parse(pending);
      HelperExportService.exportHelper(helper).then(() => {
        localStorage.removeItem('pending_helper_export');
      });
    }
    
    // Also process retry queue
    HelperExportService.processRetryQueue();
  }
}

export default new SessionManager();
```

### Task 6: Implement Helper Import/Revival

```javascript
// components/HelperImport.js

import HelperManager from './helpers/HelperManager';

class HelperImporter {
  /**
   * Import helper from Google Drive or file
   * @param {object} helperData - The imported helper data
   */
  async importHelper(helperData) {
    // Validate helper structure
    if (!this.validateHelper(helperData)) {
      throw new Error('Invalid helper format');
    }
    
    // Set as current helper
    HelperManager.currentHelper = helperData;
    HelperManager.plateNumber = helperData.plateNumber;
    HelperManager.version = helperData.version;
    HelperManager.saveToSession();
    
    // Auto-populate modules
    await this.populateModules(helperData);
    
    return helperData;
  }

  /**
   * Validate helper structure
   */
  validateHelper(helper) {
    return helper &&
           helper.name &&
           helper.source === 'system' &&
           helper.date &&
           helper.plateNumber &&
           helper.version;
  }

  /**
   * Auto-populate system modules with helper data
   */
  async populateModules(helper) {
    // Implement based on your module structure
    // This is project-specific
    
    // Example:
    // document.getElementById('plateNumber').value = helper.plateNumber;
    // FormManager.populateForm(helper.data);
    // ModuleLoader.loadModuleData(helper.data.modules);
    
    console.log('Modules populated from helper:', helper.name);
  }

  /**
   * UI Component for import button
   */
  createImportButton() {
    const button = document.createElement('button');
    button.textContent = 'Import Helper';
    button.className = 'btn-import-helper';
    button.onclick = () => this.handleImportClick();
    return button;
  }

  /**
   * Handle import button click
   */
  async handleImportClick() {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const text = await file.text();
      const helperData = JSON.parse(text);
      
      try {
        await this.importHelper(helperData);
        alert(`Helper ${helperData.name} imported successfully`);
      } catch (error) {
        alert('Failed to import helper: ' + error.message);
      }
    };
    
    input.click();
  }
}

export default new HelperImporter();
```

### Task 7: Add Initialization to App Entry Point

```javascript
// In your main app initialization file (App.js, index.js, etc.)

import SessionManager from './utils/SessionManager';
import HelperManager from './helpers/HelperManager';

// On app start
function initializeApp() {
  // Check for pending exports from previous session
  SessionManager.checkPendingExports();
  
  // Setup unload listener for unexpected closures
  SessionManager.setupUnloadListener();
  
  // Try to restore helper from session
  const existingHelper = HelperManager.loadFromSession();
  if (existingHelper) {
    console.log('Restored helper:', existingHelper.name);
  }
  
  // Continue with app initialization...
}

// Call on app mount
initializeApp();
```

## Environment Variables Required

Add to your `.env` file:
```
EXPORT_HELPER_WEBHOOK=https://hook.eu1.make.com/YOUR_WEBHOOK_ID
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing Checklist

### Helper Creation
- [ ] Start new case with plate number (e.g., "12345678")
- [ ] Verify helper created with name "12345678_helper_v1"
- [ ] Check console for creation confirmation
- [ ] Verify session storage contains helper

### Version Increment
- [ ] Make changes to case data
- [ ] Save changes
- [ ] Verify helper name changes to "12345678_helper_v2"
- [ ] Make additional changes and save
- [ ] Verify increments to v3, v4, etc.

### Export on Logout
- [ ] Log out of system
- [ ] Check Supabase for saved helper record
- [ ] Check Make.com webhook received data
- [ ] Verify helper has correct name, source, and date

### Export on Session Termination
- [ ] Let session timeout
- [ ] Verify automatic export triggered
- [ ] Check both Supabase and webhook

### Import and Revival
- [ ] Export a helper (logout)
- [ ] Start new session
- [ ] Import helper from file/drive
- [ ] Verify modules auto-populate
- [ ] Verify version continues from imported number

### Edge Cases
- [ ] Browser crash/unexpected close (check pending exports on restart)
- [ ] Network failure during export (check retry queue)
- [ ] Multiple rapid saves (verify version increments correctly)
- [ ] Import invalid helper file (verify error handling)

## Database Schema (Supabase)

```sql
CREATE TABLE helpers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  source VARCHAR(50) DEFAULT 'system',
  date TIMESTAMP NOT NULL,
  plate_number VARCHAR(50) NOT NULL,
  version INTEGER NOT NULL,
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_plate_number ON helpers(plate_number);
CREATE INDEX idx_created_at ON helpers(created_at);
```

## Webhook Payload Structure

The Make.com webhook will receive:
```json
{
  "helper_name": "12345678_helper_v2",
  "source": "system",
  "date": "2024-01-15T10:30:00Z",
  "plate_number": "12345678",
  "version": 2,
  "data": {
    // Your helper data structure
  },
  "event": "HELPER_EXPORT",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Important Notes

1. **Version Persistence**: Versions should never decrement, only increment
2. **Atomic Operations**: Ensure version increment and save are atomic
3. **Conflict Resolution**: Each helper name is unique, preventing conflicts
4. **Data Integrity**: Always validate helper structure before import
5. **Failure Handling**: Implement retry logic for failed exports
6. **Performance**: Consider debouncing frequent saves to avoid excessive versions

## Integration Points

Identify and modify these areas in your existing code:
1. Case initialization functions
2. Save/update handlers
3. Logout procedures
4. Session timeout handlers
5. Module population logic
6. Form submission handlers

This implementation ensures complete helper lifecycle management with automatic versioning and reliable export/import functionality.
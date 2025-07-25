# Legal Text Loading Logic Extraction

## Problem
User is frustrated because the wrong legal text system was implemented. Need to extract the EXACT working legal text logic from estimate-builder.html to replace the current system.

## Plan
1. ✅ Find and analyze estimate-builder.html legal text system
2. Extract the exact legal text loading functions and logic  
3. Document the complete working system components
4. Provide implementation details for replacement

## Todo Items
- [x] Locate estimate-builder.html file
- [x] Extract legal text loading functions
- [x] Identify HTML structure for legal text section
- [x] Document placeholder replacement logic
- [x] Map initialization and event handlers
- [ ] Provide complete implementation report

## Implementation Report

### Extracted Legal Text System Components

#### 1. HTML Structure
```html
<!-- LEGAL TEXT SECTION - EDITABLE -->
<div class="form-section" id="legal-text">
  <h3>טקסט משפטי לאומדן</h3>
  <div style="margin-bottom: 10px;">
    <button type="button" onclick="loadLegalTextFromVault()" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-left: 10px;">טען מהכספת</button>
    <button type="button" onclick="resetLegalText()" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">איפוס טקסט</button>
  </div>
  <textarea id="legal-text-content" style="width: 100%; min-height: 200px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 6px; background: #f8f9fa; line-height: 1.6; font-family: inherit; resize: vertical; box-sizing: border-box;" placeholder="הטקסט המשפטי יטען כאן עם הנתונים המעודכנים...">הטקסט המשפטי יטען כאן עם הנתונים המעודכנים...</textarea>
  <div style="margin-top: 8px; font-size: 14px; color: #666;">
    💡 הטקסט ניתן לעריכה לצורך התאמה לדוח הספציפי. השינויים לא ישפיעו על הכספת המקורית.
  </div>
</div>
```

#### 2. Core Functions

##### Main Legal Text Loading Function
```javascript
function loadLegalText() {
  const selectedType = document.querySelector('input[name="estimate-type"]:checked')?.value || 'אובדן_להלכה';
  const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
  
  // Legal text vault from final report legal texts vault.md - EXACT COPY
  const legalTextsVault = {
    'אובדן_להלכה': `ערך הרכב המצויין לעיל בהתאם למחירון ואינו מתייחס למקוריות הרכב בעבר וארוע תאונתי.

הצעה זו אינה סופית ויתכן שינויים במהלך תיקון הרכב.

הערכתנו מתייחסת לנזקים כפי שהוצגו בפנינו, ולנסיבות המקרה כפי שתוארו לנו ע"י בעל הרכב אשר לדבריו.

קוד דגם רישיון הרכב נבדק בהתאם לטבלת המרה של לוי יצחק ונמצא %קוד_דגם%.

אחוז הנזק ברכב הנ"ל הוא %אחוז_נזק% מערך הרכב.

הצעה זו אינה כוללת נזקים בלתי נראים מראש העלולים להתגלות במהלך פירוק ו/או תיקון.

להערכתינו ירידת ערך צפויה כ %ירידת_ערך% מערך הרכב הנ"ל מאירוע הנדון.

לטענת בעל הרכב %מוקדי_נזק% מוקדי הנזק מאירוע הנדון.

לאור היקף הנזקים אנו ממלצים לסלק את התביעה הנ"ל על בסיס "אובדן להלכה" ללא תיקון בפועל.

להערכתינו זמן השהייה במוסך לצורך תיקון %ימי_מוסך% ימי עבודה.`,
    
    'טוטלוס': `חוות דעתינו מתבצעת בטרם תיקונים בפועל ואינה כוללת נזקים סמויים.

בהתאם לבדיקה הנזק ברכב מוערך ביותר מ-60% מערך הרכב, ומשכך הרכב מסווג כטוטלוס.

ערך הרכב המחושב לפי מחירון לוי יצחק: %שווי_רכב%.

שווי השרידים: %שווי_שרידים%.

ניכוי ירידת ערך: %ירידת_ערך%

הערכת נזקים מבוססת על הנתונים שנמסרו ע״י בעל הרכב, אשר לדבריו.

הצהרה: אני החת״מ: ירון כיוף, תעודת שמאי מס' 1097. הנני נותן את חוות דעתי זו במקום עדות בשבועה בבית משפט. הדין של חוות דעת זו הוא כדין עדות בשבועה.`
  };
  
  let legalText = legalTextsVault[selectedType] || legalTextsVault['אובדן_להלכה'];
  
  // Enhanced placeholder mapping to actual field values
  const placeholders = {
    '%מספר_רכב%': document.getElementById('carPlate')?.value || helper.meta?.plate || '[מספר רכב]',
    '%תוצרת%': document.getElementById('carManufacturer')?.value || helper.car_details?.manufacturer || '[תוצרת]',
    '%דגם%': document.getElementById('carModel')?.value || helper.car_details?.model || '[דגם]',
    '%שנה%': document.getElementById('carYear')?.value || helper.car_details?.year || '[שנה]',
    '%בעל_רכב%': document.getElementById('ownerName')?.value || helper.client?.name || '[שם בעל הרכב]',
    '%קוד_דגם%': document.getElementById('carModelCode')?.value || helper.car_details?.model_code || helper.levi_report?.model_code || '[קוד דגם]',
    '%אחוז_נזק%': document.getElementById('grossPercent')?.value || helper.claims_data?.gross_percent || calculateDamagePercentage() || helper.expertise?.calculations?.damage_percent || '[אחוז נזק]',
    '%ירידת_ערך%': document.getElementById('globalDep1')?.value || helper.estimate_depreciation?.global_percent || '[ירידת ערך]',
    '%מוקדי_נזק%': helper.expertise?.damage_blocks?.length || '[מספר מוקדים]',
    '%ימי_מוסך%': document.getElementById('garageDays')?.value || helper.estimate_work_days || helper.expertise?.depreciation?.work_days || '[ימי מוסך]',
    '%שווי_רכב%': document.getElementById('carMarketValue')?.value || document.getElementById('sumMarketValue')?.value || (helper.expertise?.calculations?.market_value ? `₪${helper.expertise.calculations.market_value.toLocaleString()}` : '[שווי רכב]'),
    '%שווי_שרידים%': (() => {
      const salvageInput = document.getElementById('salvageValue')?.value;
      const helperSalvage = helper.estimate_summary?.salvage_value || helper.estimate_salvage_value;
      
      if (salvageInput && salvageInput.trim() !== '' && salvageInput !== '₪0') {
        return salvageInput;
      } else if (helperSalvage && helperSalvage !== '₪0') {
        return helperSalvage;
      } else {
        return '[שווי שרידים]';
      }
    })()
  };
  
  // Replace placeholders
  for (const [placeholder, value] of Object.entries(placeholders)) {
    legalText = legalText.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  }
  
  document.getElementById('legal-text-content').value = legalText;
}
```

##### Button Click Handler
```javascript
function loadLegalTextFromVault() {
  loadLegalText();
  
  // Save the legal text to helper for the specific estimate
  const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
  helper.estimate_legal_text = document.getElementById('legal-text-content').value;
  sessionStorage.setItem('helper', JSON.stringify(helper));
  
  console.log('Legal text loaded from vault and saved to estimate');
}
```

##### Reset Function
```javascript
function resetLegalText() {
  const selectedType = document.querySelector('input[name="estimate-type"]:checked')?.value || 'אובדן_להלכה';
  const typeText = selectedType === 'אובדן_להלכה' ? 'אובדן להלכה' : 'טוטלוס';
  
  document.getElementById('legal-text-content').value = `טקסט משפטי לאומדן ${typeText} - מוכן לעריכה`;
  
  // Clear saved legal text from helper
  const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
  delete helper.estimate_legal_text;
  sessionStorage.setItem('helper', JSON.stringify(helper));
  
  console.log('Legal text reset');
}
```

#### 3. Event Handlers and Initialization

##### Auto-save on text change
```javascript
const legalTextArea = document.getElementById('legal-text-content');
if (legalTextArea) {
  legalTextArea.addEventListener('input', function() {
    const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
    helper.estimate_legal_text = this.value;
    sessionStorage.setItem('helper', JSON.stringify(helper));
    
    // ✅ BIDIRECTIONAL INTEGRATION: Update builder state in real-time
    updateBuilderCurrentState('estimate_legal_text', this.value);
  });
}
```

##### Load on estimate type change
```javascript
document.querySelectorAll('input[name="estimate-type"]').forEach(radio => {
  radio.addEventListener('change', function() {
    updateReportType();
    loadLegalText();
  });
});
```

##### Page initialization
```javascript
setTimeout(() => {
  loadDataFromHelper();
  loadAttachmentsData();
  loadLegalText();  // Called on page load
  updateGlobalDepreciationCalculation();
}, 100);
```

##### Load from helper data
```javascript
// In loadDataFromHelper function
if (helper.estimate_legal_text) {
  const legalTextElement = document.getElementById('legal-text-content');
  if (legalTextElement) {
    legalTextElement.value = helper.estimate_legal_text;
  }
}
```

#### 4. Data Persistence

##### Save to sessionStorage
```javascript
// In saveEstimate function
const legalText = document.getElementById('legal-text-content')?.value || '';
helper.estimate_legal_text = legalText;
sessionStorage.setItem('helper', JSON.stringify(helper));
```

##### Integration with builder state
```javascript
updateBuilderCurrentState('estimate_legal_text', legalText);
```

## Key Features of This System

1. **Vault-based Templates**: Two predefined legal text templates for different estimate types
2. **Dynamic Placeholder Replacement**: 12 different placeholders that get replaced with actual form data
3. **Auto-save**: Changes are automatically saved to sessionStorage
4. **Event-driven Updates**: Legal text updates when estimate type changes
5. **Manual Controls**: Load from vault and reset buttons
6. **Data Integration**: Seamlessly integrates with the helper object and builder state
7. **Fallback Values**: Comprehensive fallback system for missing data

## Review Section

### Changes Made
- ✅ Successfully extracted complete legal text loading system from estimate-builder.html
- ✅ Documented all functions, HTML structure, and event handlers
- ✅ Identified the exact vault-based template system with placeholder replacement
- ✅ Mapped all initialization and data persistence logic

### System Architecture
The working legal text system uses:
1. **Vault-based templates** stored directly in JavaScript
2. **Placeholder replacement system** with comprehensive fallbacks
3. **Event-driven updates** tied to form changes
4. **SessionStorage persistence** for data continuity
5. **Real-time auto-save** functionality
6. **Manual control buttons** for user interaction

This is the EXACT working system that should replace any current legal text implementation.

**AUDIT 25/07/20225**
Here’s a consolidated audit report (merging all three audits: Overview, Estimate Builder, and Enhanced Depreciation) with prioritized issues, file-level references, and their fixes, focusing on functionality, integration, data flow, and system integrity:

Critical Priority (Foundational – Impacts All Modules & Data Sync)
1. Event Listener Conflicts & Race Conditions
    * Files: helper-events.js (line ~434), helper.js (line ~1534), estimate.js (line ~696), admin.js (line ~127), math-preview.js, fee-module.js, router.js, password-prefill.js
    * Problem: Multiple DOMContentLoaded listeners across modules cause unpredictable initialization, breaking the helper data flow and UI state.
    * Fix:
        * Consolidate all initialization into a single bootstrap.js.
        * Remove individual DOMContentLoaded registrations and call all setup functions in controlled sequence from bootstrap.js.
2. Circular Dependencies Breaking Helper Updates
    * Files: helper.js, security-manager.js, webhook.js, error-handler.js
    * Problem: Mutual imports (e.g., helper.js ↔ security-manager.js) cause loading order failures, leading to missed updateHelper() calls and broken cross-module sync.
    * Fix:
        * Extract shared utilities into a standalone helper-utils.js.
        * Refactor imports so no module depends circularly on another.
3. Inconsistent Helper Paths (Key Misalignment)
    * Files:
        * estimate-builder.html (gross & market sections)
        * enhanceddepreciation-module.html (legal text)
    * Problem:
        * Estimate builder loads from helper.valuation.adjustments but writes edits to helper.estimate_adjustments (causing disappearing rows on refresh).
        * Enhanced Depreciation saves legal text to helper.estimate_legal_text, but the final report expects helper.final_report.legal_text.
    * Fix:
        * Standardize keys:
            * Estimate builder: read/write to helper.valuation.adjustments.
            * Enhanced Depreciation: write legal text to helper.final_report.legal_text.
        * Update all references in updateHelper() calls and related loaders.
4. One-Way Sync in Damage Centers (No Center_ID Mapping)
    * Files: estimate-builder.html (loadDamageCentersSummary, saveDamageCenterChanges)
    * Problem: Edits overwrite helper.expertise.damage_blocks but never sync to helper.damage_centers or preserve center_id, causing other modules to lose updates.
    * Fix:
        * On load, populate from helper.damage_centers[] (by center_id).
        * On save, update both helper.expertise.damage_blocks and helper.damage_centers[] arrays.

High Priority (System Cleanup & Stability)
1. Broken Test Setup
    * Files: package.json (test script), missing tests/run-tests.js.
    * Problem: npm test fails, blocking CI pipelines.
    * Fix:
        * Implement tests/run-tests.js OR remove the test script in package.json.
2. Legacy / Backup / Duplicate Files
    * Files: car-details-floating.js.backup, helper.js.backup, levi-floating.js.backup, /old version/ folder.
    * Problem: Cluttered repo, risk of accidental inclusion.
    * Fix: Archive outside repo or delete.
3. Duplicate Documentation
    * Files: DOCUMENTATION/ (e.g., Primary Specification Document in both .md and .txt).
    * Fix: Keep a single canonical format (Markdown).
4. Verbose Console Logging
    * Files: estimate-report.js, final_report.js, others with debug logs like console.log('✅ final_report.js loaded...').
    * Fix: Replace logs with a toggleable logging utility.
5. Remote Asset Dependency
    * Files: Many HTML files (e.g., general_info.html lines 5–8).
    * Problem: Fonts/images loaded from carmelcayouf.com and Google Fonts; UI breaks if external links fail.
    * Fix: Host assets locally or add fallbacks.

Medium Priority
1. Unregistered Service Worker
    * Files: OneSignalSDKWorker.js.
    * Problem: No registration in HTML, so push notifications don’t work.
    * Fix: Register in index.html (or remove file if not needed).
2. Stale Documentation Links & Comments
    * Problem: References to non-existent modules and outdated instructions.
    * Fix: Audit and update docs.

Low Priority
1. Disabled or Redundant Files
    * Files: parse-hebrew-response.js.disabled and others.
    * Fix: Move to /archive/ or delete.
2. Inline/External Styling Issues
    * Files: Multiple HTML files.
    * Fix: Move styles to centralized CSS and self-host fonts.

Why This Matters for Data Sync (Core Issue)
* The helper synchronization system (via helper-events.js and universal-data-sync.js) relies on consistent keys and stable initialization.
* The multiple event listeners and circular dependencies cause:
    * Race conditions (fields initialized twice or skipped).
    * Data written to the wrong helper path (disappearing on reload).
    * One-way sync for damage_centers, so other modules get stale data.
* Fixing Items 1–4 (Critical Priority) stabilizes the entire system, ensuring gross price, market value, damage centers, and legal text all auto-load from and persist to the correct helper keys and propagate across modules/tabs.


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



**IMPORTANT**

THIS NOTE IS IMPORTANT AND SHOULD NOT BE DELETED :
THIS NOTE CONCERNS THE PROPER CALCULATION METHODE OF THE PRICE ADJUSTMENTS IN BOTHE ESTIMATE BUILDER AND FINAL REPORT BUILDER, ALSO IN ANY OTHER PLACE ITS NEEDED:
INITIAL DATA ARRIVES TO THE SYSTEM VIA THE LEVI UPLOAD WEBHOOK RESPONSE, THEN ITS SAVED TO THE HELPER , THE LEVI FLOATING SCREEN , THE LEVI PAGE SUMMARYand  ALL THE MODULES . ALL MODULES EXTRACT THE SAME ADJUSTMENST DATA FROM THE HEPER 

*Adjustments calculation logic :*

1. Base Price (מחיר בסיס)Anchor (e.g., ₪118,000).
2. Features Adjustment (מאפיינים)
    * Percentage or fixed.
    * Uses Base Price only (not chained).
3. Registration Adjustment (עליה לכביש)
    * Fixed (most common) or rarely percentage.
    * Also uses Base Price only (not chained).
4. Gross Value (עלות גולמית)iniCopyEditGross = Base Price + Features Adjustment + Registration Adjustment
5. 
6. Ownership Type Adjustment (סוג בעלות)
    * Percentage or fixed.
    * Sequential: starts from Gross Value.
7. Mileage Adjustment (מספר ק״מ)
    * Percentage or fixed.
    * Sequential: calculated from the result after Ownership.
8. Number of Owners Adjustment (מספר בעלים)
    * Percentage or fixed.
    * Sequential: calculated from the result after Mileage.
9. Final Appraised Value (שווי סופי)
    * The last total after all rows (in this order) are processed.
    * Any row can be 0 or not appear — but the order must always be followed.

Calculation Rules
* Features and Registration are not compounded — each references the Base Price directly.
* All rows after Gross Value are sequential: each one is applied to the previous running total.
* Adjustments can be percentages or fixed values, positive or negative.
* Row order cannot change, even if some are missing.

Pseudocode (With Correct Row Order)
javascript
CopyEdit
base_price = 118000

// Step 1: Independent adjustments (Features + Registration)
features_adj = (features_percent)
    ? base_price * (features_percent / 100)
    : (features_fixed || 0)

registration_adj = (registration_percent)
    ? base_price * (registration_percent / 100)
    : (registration_fixed || 0)

gross_value = base_price + features_adj + registration_adj

// Step 2: Sequential adjustments (Ownership → Mileage → Owners)
current_value = gross_value

for adj in [ownership_type, mileage, num_owners]:
    if (!adj) continue; // skip if 0 or missing
    adj_amount = (adj.percent)
        ? current_value * (adj.percent / 100)
        : adj.fixed
    current_value += adj_amount; // may be negative

final_value = current_value

In the market value section , we will need to give each adjustment a separate bulk like in the gross price. Each bulk will have its distinct title, in each bulk there gonna be an add field option , this will ensure that order is maintained .
This setup is for both estimate builder and final report builder also for the levi report manual option we have on the levi page 
Each field need to import the full data from the correspondent adjustment field in Levi helper.
Each field by default has the math logic inside it , when data is imported the math engine doesn’t  override the import , the math engine will work just if the value field was not properly populated or it is a manual input

Here is a suggestion fro the math engine javascript for this function : 

/**
 * Calculate the final appraised vehicle value based on adjustments.
 *
 * @param {number} basePrice - The anchor/base vehicle price.
 * @param {object} adjustments - An object with optional adjustment parameters:
 *   {
 *     features: { percent?: number, fixed?: number },
 *     registration: { percent?: number, fixed?: number },
 *     ownershipType: { percent?: number, fixed?: number },
 *     mileage: { percent?: number, fixed?: number },
 *     numOwners: { percent?: number, fixed?: number }
 *   }
 * Each field can be missing, zero, or contain either a percentage or fixed value.
 * Percentages should be expressed as numbers (e.g., 9 for 9%).
 *
 * @returns {number} - The final appraised value.
 */
function calculateVehicleValue(basePrice, adjustments) {
  if (typeof basePrice !== 'number' || isNaN(basePrice)) {
    throw new Error('Invalid base price');
  }

  const safeAdj = (adj, current) => {
    if (!adj) return 0;
    if (adj.percent && typeof adj.percent === 'number') {
      return current * (adj.percent / 100);
    }
    if (adj.fixed && typeof adj.fixed === 'number') {
      return adj.fixed;
    }
    return 0;
  };

  // Step 1: Independent adjustments (Features + Registration) using Base Price
  const featuresAdj = safeAdj(adjustments.features, basePrice);
  const registrationAdj = safeAdj(adjustments.registration, basePrice);

  const grossValue = basePrice + featuresAdj + registrationAdj;

  // Step 2: Sequential adjustments (Ownership → Mileage → Number of Owners)
  let currentValue = grossValue;

  for (const key of ['ownershipType', 'mileage', 'numOwners']) {
    const adj = adjustments[key];
    if (!adj) continue; // skip if missing or zero
    const adjAmount = safeAdj(adj, currentValue);
    currentValue += adjAmount; // apply sequentially
  }

  return Math.round(currentValue); // round to nearest whole currency unit
}

// Example usage:
const finalValue = calculateVehicleValue(118000, {
  features: { percent: 9 },        // +9% of base
  registration: { fixed: 4000 },   // +₪4000
  ownershipType: { percent: -17 }, // -17% sequentially
  mileage: { percent: -26.88 },    // -26.88% sequentially
  numOwners: { percent: -2 }       // -2% sequentially
});

console.log('Final Appraised Value:', finalValue); 
// Should output: 78877 (matches your example)



**PARSED INVOICE TEST JSON:**

{
  "מספר רכב": "698-42-003",
  "יצרן": "טויוטה (השלמת מערכת)",
  "דגם": "C-HR LOUNGE S",
  "שנת ייצור": "",
  "מד אוץ": "34,970",
  "בעל הרכב": "שרה חסון",
  "מספר תיק": "",
  "תאריך": "05/06/24",
  "מס. חשבונית": "6",
  "שם מוסך": "מוסך ש.מ קוסמטיקאר בע\"מ",
  "דוא\"ל מוסך": "sh.m_kosmtekar@walla.com",
  "טלפון מוסך": "053-2344434/04-840960",
  "כתובת מוסך": "ניו יורק 1, דאלית אל כרמל",
  "מוקד נזק": "מגן אחורי (השלמת מערכת)",
  "סהכ חלקים": "7,082.00",
  "סהכ עבודות": "אין מידע",
  "סהכ תיקונים": "אין מידע",
  "עלות כוללת ללא מע״מ": "18,724.00",
  "מע\"מ": "4,111.92",
  "עלות כוללת": "22,844.00",
  "הערות": "ט.ל.ח – טעות לעולם חוזרת",
  "לינק": "",
  "חלקים": [
    {
      "מק\"ט חלק": "1-004-52159F913",
      "שם חלק": "מגן אחורי עליון",
      "תיאור": "מגן אחורי עליון",
      "כמות": "1",
      "מקור": "מקורי",
      "עלות": "894.00"
    },
    {
      "מק\"ט חלק": "1-004-5253F4250",
      "שם חלק": "מגן אחורי תחתון",
      "תיאור": "מגן אחורי תחתון",
      "כמות": "1",
      "מקור": "מקורי",
      "עלות": "153.00"
    },
    {
      "מק\"ט חלק": "1-004-52751F4010",
      "שם חלק": "פס קישוט מרכזי במגן אחורי",
      "תיאור": "פס קישוט מרכזי במגן אחורי",
      "כמות": "1",
      "מקור": "מקורי",
      "עלות": "808.00"
    },
    {
      "מק\"ט חלק": "1-004-PW15810200L6",
      "שם חלק": "מגלש מגן אחורי",
      "תיאור": "מגלש מגן אחורי",
      "כמות": "1",
      "מקור": "מקורי",
      "עלות": "202.00"
    },
    {
      "מק\"ט חלק": "1-004-521624060",
      "שם חלק": "כיסוי וו גרירה אחורי L",
      "תיאור": "כיסוי וו גרירה אחורי L",
      "כמות": "1",
      "מקור": "מקורי",
      "עלות": "1,905.00"
    },
    {
      "מק\"ט חלק": "1-004-8934878120C2",
      "שם חלק": "תושבות לחיישני חנייה אחוריים",
      "תיאור": "תושבות לחיישני חנייה אחוריים",
      "כמות": "1",
      "מקור": "מקורי",
      "עלות": "1,320.00"
    },
    {
      "מק\"ט חלק": "1-004-5203F4050",
      "שם חלק": "מגן אחורי פנימי",
      "תיאור": "מגן אחורי פנימי",
      "כמות": "1",
      "מקור": "מקורי",
      "עלות": "1,800.00"
    }
  ],
  "עבודות": [
    {
      "סוג העבודה": "ניתוק זרם",
      "תיאור עבודות": "ניתוק זרם רכב היברידי",
      "עלות עבודות": "אין מידע"
    },
    {
      "סוג העבודה": "העברת חיישנים",
      "תיאור עבודות": "העברת חיישנים",
      "עלות עבודות": "אין מידע"
    },
    {
      "סוג העבודה": "חומרי עזר",
      "תיאור עבודות": "חומרי עזר",
      "עלות עבודות": "אין מידע"
    }
  ],
  "תיקונים": [
    {
      "סוג תיקון": "אין מידע",
      "תיאור התיקון": "אין מידע",
      "עלות תיקונים": "אין מידע"
    }
  ],
  "מפיק החשבונית": "שאדי מפלח",
  "ח.פ": "517109013",
  "מספר רישיון": "91329",
  "טלפון נייד": "054-4888830",
  "מס' כרטיס": "1028",
  "פוליסה": "30056",
  "מספר תביעה": "034088104",
  "נהג": "שרה חסון",
  "קילומטראז'": "34,970",
  "תאריך פתיחת תיק": "13/04/25",
  "תאריך קבלת רכב": "05/06/24",
  "סה\"כ עבודות": "8,239.00",
  "סה\"כ חלקים": "4,564.00"
}


**parts search JSON**

{
  "יצרן": "ביואיק",
  "דגם": "לוסרן",
  "רמת גימור": "CXL",
  "קוד דגם": "",
  "מספר דגם רכב": "HD572",
  "שנת יצור": "2009",
  "מנוע": "",
  "נפח מנוע": "3800",
  "דגם מנוע": "428",
  "סוג מנוע": "בנזין",
  "הנעה": "4X2",
  "תיבת הילוכים": "אוטומטית",
  "מספר שלדה": "1G4HD57258U196450",
  "מספר רישוי": "5785269",
  "חלק דרוש (מילת מפתח)": "מנגנון כיסא נהג",
  "סוג מקור": “”,
“free_query”: free text 
“Image”:””
}


This is a general json of the parts search :
תאריך החיפוש  2025-05-23T15:46:11.695Z 
חלק נדרש : driver seat mechanism 
תוצאות: 
### תוצאות חיפוש למספר חלק 5785269 - מנגנון מושב נהג חשמלי לביואיק לוצרן 2009 
 
#### פרטי החיפוש: 
- **מספר לוחית:** 5785269 
- **חלק מבוקש:** מנגנון מושב נהג חשמלי 
 
#### תוצאות החיפוש: 
 
1. **שם הספק:** יו.אמ.איי. חלפים (UMI) 
   - **מיקום:** ישראל 
   - **מקור החלק:** OEM (יצרן מקורי) 
   - **מצב החלק:** חדש 
   - **תיאור החלק:** מנגנון מושב נהג חשמלי מקורי לביואיק לוצרן 2009, מספר חלק 5785269 
   - **זמינות:** זמין בהזמנה 
   - **מחיר:** ₪2350 
   - **מטבע:** ILS (שקלים) 
   - **קוד OEM:** 5785269 
   - **מקט קטלוגי:** UMI-5785269-LUC09 
   - **הערות:** חלק מקורי חדש מהיבואן הרשמי של ביואיק. זמן אספקה משוער 7-14 ימי עסקים. 
 
2. **שם הספק:** אוטו-פארטס ישראל 
   - **מיקום:** ישראל 
   - **מקור החלק:** Aftermarket (תחליפי) 
   - **מצב החלק:** חדש 
   - **תיאור החלק:** מנגנון מושב נהג חשמלי תחליפי חדש לביואיק לוצרן 2009, תואם למספר חלק 5785269 
   - **זמינות:** במלאי 
   - **מחיר:** ₪1150 
   - **מטבע:** ILS (שקלים) 
   - **קוד OEM:** תואם 5785269 
   - **מקט קטלוגי:** AP-IL-BL09DSM-AFM 
   - **הערות:** חלק תחליפי חדש באיכות גבוהה, כולל אחריות לשנה מהספק. 
 
3. **שם הספק:** RockAuto Parts (משלוח בינלאומי) 
   - **מיקום:** ארה"ב (משלוח לישראל) 
   - **מקור החלק:** OEM (יצרן מקורי) 
   - **מצב החלק:** חדש 
   - **תיאור החלק:** מנגנון מושב נהג חשמלי מקורי GM לביואיק לוצרן 
   - **זמינות:** לא ידוע 
   - **מחיר:** לא ידוע 
   - **מטבע:** לא ידוע 
   - **קוד OEM:** 5785269 
   - **מקט קטלוגי:** לא ידוע 
   - **הערות:** משלוח משוער 14-21 ימי עסקים. 
 
#### המלצות: 
- אם התקציב הוא שיקול מרכזי, החלק התחליפי מ"אוטו-פארטס ישראל" מציע מחיר נמוך יותר והוא זמין במלאי, כולל אחריות לשנה. 
- עבור מי שמחפש חלק מקורי בלבד, החלק מיו.אמ.איי. חלפים (UMI) מציע תנאים טובים למרות מחירו הגבוה יותר, עם אספקה בהזמנה. 
- יש לקחת בחשבון את זמני האספקה המשוערים ואת העלויות הנוספות האפשריות במשלוח בינלאומי מ-RockAuto Parts. 

The user selects the desired part from the suggestions shown in the field based on typing the first two letters. The helper then stores the selected parts as the case parts, BUT all unselected parts that came from the search result are also saved in the helper under unselected. 
The work and repairs json is according to what the user inputs - examine the modules works.html and repairs required.html - basically it s:
Name , description and cost 
The repairs are pulled from a dropdown in the repairs module 
5. Photo upload: the only thing that it gives the helper is an accumulative number of uploaded photos for a certain plate number throughout time and not just in one session. 6. The invoice module sends back the invoice OCRed details to the helper. Those details are stored Under invoice , but the thing is that they replace the initial damage Parys analysis of work , repairs and parts , this is relevant for 2 types of the final report : private, and global . Those are the 2 types that consider the invoice in the workflow,, estimate doesn’t  consider invoice since its done before starting the work .the invoice module is crucial - the invoice JSON is also documented in the system :
{
  "מספר רכב": "698-42-003",
  "יצרן": "טויוטה (השלמת מערכת)",
  "דגם": "C-HR LOUNGE S",
  "שנת ייצור": "",
  "מד אוץ": "34,970",
  "בעל הרכב": "שרה חסון",
  "מספר תיק": "",
  "תאריך": "05/06/24",
  "מס. חשבונית": "6",
  "שם מוסך": "מוסך ש.מ קוסמטיקאר בע\"מ",
  "דוא\"ל מוסך": "sh.m_kosmtekar@walla.com",
  "טלפון מוסך": "053-2344434/04-840960",
  "כתובת מוסך": "ניו יורק 1, דאלית אל כרמל",
  "מוקד נזק": "מגן אחורי (השלמת מערכת)",
  "סהכ חלקים": "7,082.00",
  "סהכ עבודות": "אין מידע",
  "סהכ תיקונים": "אין מידע",
  "עלות כוללת ללא מע״מ": "18,724.00",
  "מע\"מ": "4,111.92",
  "עלות כוללת": "22,844.00",
  "הערות": "ט.ל.ח – טעות לעולם חוזרת",
  "לינק": "",
  "חלקים": [
    {
      "מק\"ט חלק": "1-004-52159F913",
      "שם חלק": "מגן אחורי עליון",
      "תיאור": "מגן אחורי עליון",
      "כמות": "1",
      "מקור": "מקורי",
      "עלות": "894.00"
    },
    {
      "מק\"ט חלק": "1-004-5253F4250",
      "שם חלק": "מגן אחורי תחתון",
      "תיאור": "מגן אחורי תחתון",
      "כמות": "1",
      "מקור": "מקורי",
      "עלות": "153.00"
    },
    {
      "מק\"ט חלק": "1-004-52751F4010",
      "שם חלק": "פס קישוט מרכזי במגן אחורי",
      "תיאור": "פס קישוט מרכזי במגן אחורי",
      "כמות": "1",
      "מקור": "מקורי",
      "עלות": "808.00"
    },
    {
      "מק\"ט חלק": "1-004-PW15810200L6",
      "שם חלק": "מגלש מגן אחורי",
      "תיאור": "מגלש מגן אחורי",
      "כמות": "1",
      "מקור": "מקורי",
      "עלות": "202.00"
    },
    {
      "מק\"ט חלק": "1-004-521624060",
      "שם חלק": "כיסוי וו גרירה אחורי L",
      "תיאור": "כיסוי וו גרירה אחורי L",
      "כמות": "1",
      "מקור": "מקורי",
      "עלות": "1,905.00"
    },
    {
      "מק\"ט חלק": "1-004-8934878120C2",
      "שם חלק": "תושבות לחיישני חנייה אחוריים",
      "תיאור": "תושבות לחיישני חנייה אחוריים",
      "כמות": "1",
      "מקור": "מקורי",
      "עלות": "1,320.00"
    },
    {
      "מק\"ט חלק": "1-004-5203F4050",
      "שם חלק": "מגן אחורי פנימי",
      "תיאור": "מגן אחורי פנימי",
      "כמות": "1",
      "מקור": "מקורי",
      "עלות": "1,800.00"
    }
  ],
  "עבודות": [
    {
      "סוג העבודה": "ניתוק זרם",
      "תיאור עבודות": "ניתוק זרם רכב היברידי",
      "עלות עבודות": "אין מידע"
    },
    {
      "סוג העבודה": "העברת חיישנים",
      "תיאור עבודות": "העברת חיישנים",
      "עלות עבודות": "אין מידע"
    },
    {
      "סוג העבודה": "חומרי עזר",
      "תיאור עבודות": "חומרי עזר",
      "עלות עבודות": "אין מידע"
    }
  ],
  "תיקונים": [
    {
      "סוג תיקון": "אין מידע",
      "תיאור התיקון": "אין מידע",
      "עלות תיקונים": "אין מידע"
    }
  ],
  "מפיק החשבונית": "שאדי מפלח",
  "ח.פ": "517109013",
  "מספר רישיון": "91329",
  "טלפון נייד": "054-4888830",
  "מס' כרטיס": "1028",
  "פוליסה": "30056",
  "מספר תביעה": "034088104",
  "נהג": "שרה חסון",
  "קילומטראז'": "34,970",
  "תאריך פתיחת תיק": "13/04/25",
  "תאריך קבלת רכב": "05/06/24",
  "סה\"כ עבודות": "8,239.00",
  "סה\"כ חלקים": "4,564.00"
}

7. The reports contribution : each report has its ow contribution to the helper , basically in the repot finalization flow, like the floe we made for the estimate, there are data that only can be input in the end of the process like : depreciation , garage days, differences, agreements , type of report and so on, those data need to populate the helper.
8. What we gat fro this helper in the end is a structured modular process the each step adds information and that categories information and log it in easy to assign sections. I don’t know why the helper got fucked up , I have been working on tho for long time, its the core of the system, ii provided all json structures for all the modules outputs several times , all the sons need to in the documentation / files. Todo2.md and todo.md . You need to deep read and understand the documentation and analyze all modules to understand what outputs they have and how its structured  

The initial helper structure I embedded in the system was :

Full helper structure: 

{
  "vehicle": {
    "plate": "",
    "manufacturer": "",
    "model": "",
    "model_code": "",
    "model_type": "",
    "trim": "",
    "year": "",
    "chassis": "",
    "engine_volume": "",
    "fuel_type": "",
    "transmission": "",
    "is_automatic": false,
    "drive_type": "",
    "km": "",
    "office_code": "",
    "ownership_type": "",
    "registration_date": "",
    "category": "",
    "features": "",
    "condition": "",
    "market_value": 0,
    "created_at": "",
    "updated_at": "2025-07-16T08:27:46.384Z"
  },
  "case_info": {
    "case_id": "YC-UNKNOWN-2025",
    "plate": "",
    "status": "active",
    "damage_date": "",
    "inspection_date": "",
    "submission_date": "",
    "created_at": "2025-07-16T08:27:46.384Z",
    "inspection_location": "",
    "damage_type": "",
    "report_type": "final",
    "report_type_display": "חוות דעת שמאי פרטית"
  },
  "stakeholders": {
    "owner": {
      "name": "",
      "address": "",
      "phone": "",
      "email": ""
    },
    "garage": {
      "name": "",
      "contact_person": "",
      "phone": "",
      "email": "",
      "address": ""
    },
    "insurance": {
      "company": "",
      "email": "",
      "policy_number": "",
      "claim_number": "",
      "agent": {
        "name": "",
        "phone": "",
        "email": ""
      }
    }
  },
  "damage_assessment": {
    "summary": {
      "total_damage_amount": 0,
      "damage_percentage": 0,
      "is_total_loss": false,
      "classification": "",
      "assessment_notes": ""
    },
    "centers": []
  },
  "valuation": {
    "source": "levi_yitzhak",
    "report_date": "",
    "valuation_date": "2025-07-16",
    "base_price": 0,
    "final_price": 0,
    "currency": "ILS",
    "market_conditions": "",
    "comparable_vehicles": [],
    "adjustments": {
      "registration": {
        "percent": 0,
        "amount": 0,
        "reason": ""
      },
      "mileage": {
        "percent": 0,
        "amount": 0,
        "reason": ""
      },
      "condition": {.    ***I don’t know what condition is its needs to ownership type :private/ company *****
        "percent": 0,
        "amount": 0,
        "reason": ""
      },
      "ownership_history": {
        "percent": 0,
        "amount": 0,
        "reason": ""
      },
      "features": {
        "percent": 0,
        "amount": 0,
        "reason": ""
      },
      "market_factors": {
        "percent": 0,
        "amount": 0,
        "reason": ""
      }
    },
    "depreciation": {
      "global_percentage": 0,
      "global_amount": 0,
      "work_days_impact": 0,
      "total_depreciation": 0
    }
  },
  "financials": {
    "costs": {
      "parts_total": 0,
      "repairs_total": 0,
      "works_total": 0,
      "subtotal": 0
    },
    "fees": {
      "photography": {
        "count": 0,
        "unit_price": 0,
        "total": 0
      },
      "office": {
        "fixed_fee": 0,
        "percentage": 0,
        "total": 0
      },
      "travel": {
        "count": 0,
        "unit_price": 0,
        "total": 0
      },
      "assessment": {
        "hours": 0,
        "hourly_rate": 0,
        "total": 0
      },
      "subtotal": 0
    },
    "taxes": {
      "vat_percentage": 18,
      "vat_amount": 0
    },
    "totals": {
      "before_tax": 0,
      "after_tax": 0,
      "total_compensation": 0,
      "salvage_value": 0,
      "net_settlement": 0
    },
    "calculation_date": "2025-07-16T08:27:46.384Z",
    "calculation_method": "",
    "overrides": []
  },
  "parts_search": {
    "search_history": [],
    "all_results": [],
    "results": [],
    "summary": {
      "total_searches": 0,
      "total_results": 0,
      "selected_count": 0,
      "last_search": ""
    }
  },
  "documents": {
    "images": [],
    "invoices": [],
    "reports": [],
    "pdfs": [],
    "other_files": []
  },
  "system": {
    "version": "1.0.0",
    "last_updated": "2025-07-16T08:27:46.384Z",
    "processing_history": [
      {
        "timestamp": "2025-07-16T08:27:46.384Z",
        "type": "info",
        "message": "Starting data standardization process"
      },
      {
        "timestamp": "2025-07-16T08:27:46.384Z",
        "type": "info",
        "message": "Migrating vehicle data"
      },
      {
        "timestamp": "2025-07-16T08:27:46.384Z",
        "type": "info",
        "message": "Vehicle data migrated:   "
      },
      {
        "timestamp": "2025-07-16T08:27:46.384Z",
        "type": "info",
        "message": "Migrating case information"
      },
      {
        "timestamp": "2025-07-16T08:27:46.384Z",
        "type": "info",
        "message": "Case info migrated: YC-UNKNOWN-2025"
      },
      {
        "timestamp": "2025-07-16T08:27:46.384Z",
        "type": "info",
        "message": "Migrating stakeholder data"
      },
      {
        "timestamp": "2025-07-16T08:27:46.384Z",
        "type": "info",
        "message": "Stakeholder data migrated"
      },
      {
        "timestamp": "2025-07-16T08:27:46.384Z",
        "type": "info",
        "message": "Migrating damage assessment data"
      },
      {
        "timestamp": "2025-07-16T08:27:46.384Z",
        "type": "info",
        "message": "Damage assessment migrated: 0 centers"
      },
      {
        "timestamp": "2025-07-16T08:27:46.384Z",
        "type": "info",
        "message": "Migrating valuation data"
      },
      {
        "timestamp": "2025-07-16T08:27:46.384Z",
        "type": "info",
        "message": "Valuation data migrated: 0 -> 0"
      },
      {
        "timestamp": "2025-07-16T08:27:46.384Z",
        "type": "info",
        "message": "Migrating financial data"
      },
      {
        "timestamp": "2025-07-16T08:27:46.384Z",
        "type": "info",
        "message": "Financial data migrated"
      },
      {
        "timestamp": "2025-07-16T08:27:46.384Z",
        "type": "info",
        "message": "Migrating document data"
      },
      {
        "timestamp": "2025-07-16T08:27:46.384Z",
        "type": "info",
        "message": "Documents migrated: 0 images, 0 invoices"
      },
      {
        "timestamp": "2025-07-16T08:27:46.384Z",
        "type": "info",
        "message": "Migrating parts search data"
      },
      {
        "timestamp": "2025-07-16T08:27:46.384Z",
        "type": "info",
        "message": "Parts search data migrated: 0 total results, 0 selected"
      }
    ],
    "validation_status": {
      "vehicle": false,
      "damage": false,
      "valuation": false,
      "financials": false
    },
    "integrations": {
      "levi_processed": false,
      "invoices_processed": false,
      "images_uploaded": false,
      "estimate_generated": false
    }
  }
}

EXAMAINE AND LERAN ALL THE DOCUMENTATION , SPECS AND FILES TO DETERMINE THE BEST CONFIGURATION OF THE HELPER .
THE HELPER IS THE ONLY SOURCE OF DATA FOR THE THE SYSTEM, MODULES CAN UPDATE OR ADD TO IT BUT ITS ALWAYS THE SOURCE OF TRUTH .



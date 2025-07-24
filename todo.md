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
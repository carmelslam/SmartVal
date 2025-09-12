# Legal Text and Attachments Sections Analysis

## Comparison Between Legacy and Current Implementation

### 1. **LEGAL TEXT SECTION**

#### Legacy Implementation (estimate-builder.html):
```html
<!-- LEGAL TEXT SECTION - EDITABLE (MOVED BEFORE NAVIGATION) -->
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

#### Current Implementation (estimator-builder.html):
```html
<!-- Legal Text Section -->
<div class="form-section" id="legal-text">
  <h3>טקסט משפטי לאומדן</h3>
  <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
    הטקסט המשפטי נטען אוטומטית בהתאם לסוג האומדן שנבחר למעלה
  </p>
  <textarea id="legal-text-content" rows="6" placeholder="הטקסט המשפטי יוטען כאן..." onchange="updateHelperFromField(event);"></textarea>
  <div style="display: flex; justify-content: flex-start; gap: 15px; margin-top: 15px;">
    <button type="button" class="btn save-btn" onclick="saveWithFeedback(event, 'legal-text')" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">שמור</button>
    <button type="button" class="btn btn-secondary" onclick="resetLegalText()" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">איפוס טקסט</button>
  </div>
</div>
```

**Key Differences:**
- **Missing "טען מהכספת" Button**: The legacy has `loadLegalTextFromVault()` button, current only has "שמור" and "איפוס טקסט"
- **Different Styling**: Legacy uses inline styles for textarea (min-height: 200px, specific padding, background), current uses rows="6"
- **Missing Info Text**: Legacy has the helpful emoji tip text, current has different explanatory text
- **Button Layout**: Legacy has buttons above textarea, current has them below

---

### 2. **ATTACHMENTS SECTION**

#### Legacy Implementation (estimate-builder.html):
```html
<!-- ATTACHMENTS SECTION - EDITABLE -->
<div class="form-section" id="attachments-section">
  <h3>רשימת נספחים</h3>
  <div style="margin-bottom: 10px;">
    <button type="button" onclick="loadAttachmentsFromVault()" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-left: 10px;">טען מהכספת</button>
    <button type="button" onclick="resetAttachments()" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">איפוס רשימה</button>
  </div>
  <textarea id="attachments-content" style="width: 100%; min-height: 120px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 6px; background: #f8f9fa; line-height: 1.6; font-family: inherit; resize: vertical; box-sizing: border-box;" placeholder="רשימת הנספחים תטען כאן..."><strong>לוטה</strong>
תצלומי הרכב הניזוק
חשבוניות תיקון
ערך רכב ממוחשב
צילום רישיון הרכב
חשכ"ט</textarea>
  <div style="margin-top: 8px; font-size: 14px; color: #666;">
    💡 הרשימה ניתנת לעריכה לצורך התאמה לדוח הספציפי. השינויים לא ישפיעו על הכספת המקורית.
  </div>
</div>
```

#### Current Implementation (estimator-builder.html):
```html
<!-- Attachments Section -->
<div class="form-section" id="attachments-section">
  <h3>רשימת נספחים</h3>
  <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
    רשימת הנספחים נטענת אוטומטית בהתאם לסוג האומדן שנבחר למעלה
  </p>
  <textarea id="attachments-list" rows="4" placeholder="רשימת הנספחים תוטען כאן..." onchange="updateHelperFromField(event);"></textarea>
  <div style="display: flex; justify-content: flex-start; gap: 15px; margin-top: 15px;">
    <button type="button" class="btn save-btn" onclick="saveWithFeedback(event, 'attachments')" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">שמור</button>
    <button type="button" class="btn btn-secondary" onclick="resetAttachments()" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">איפוס נספחים</button>
  </div>
</div>
```

**Key Differences:**
- **Missing "טען מהכספת" Button**: The legacy has `loadAttachmentsFromVault()` button, current only has "שמור" and "איפוס נספחים"  
- **Different Element ID**: Legacy uses `attachments-content`, current uses `attachments-list`
- **Different Styling**: Legacy uses inline styles for textarea (min-height: 120px), current uses rows="4"
- **Missing Info Text**: Legacy has the helpful emoji tip text, current has different explanatory text
- **Different Reset Text**: Legacy button says "איפוס רשימה", current says "איפוס נספחים"

---

### 3. **JAVASCRIPT FUNCTIONALITY**

#### Legacy Functions:

**Legal Text Functions:**
```javascript
// LOAD LEGAL TEXT FROM VAULT - SEPARATE FUNCTION FOR BUTTON
function loadLegalTextFromVault() {
  loadLegalText().catch(console.error);
  
  // Save the legal text to helper for the specific estimate
  const legalTextContent = document.getElementById('legal-text-content').value;
  
  if (typeof updateHelper === 'function') {
    updateHelper('estimate_legal_text', legalTextContent, 'estimate_builder_legal_text_load');
  } else {
    // Fallback for compatibility
    const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
    helper.estimate_legal_text = legalTextContent;
    sessionStorage.setItem('helper', JSON.stringify(helper));
  }
  
  console.log('Legal text loaded from vault and saved to estimate');
}

// RESET LEGAL TEXT
function resetLegalText() {
  const selectedType = document.querySelector('input[name="estimate-type"]:checked')?.value || 'אובדן_להלכה';
  const typeText = selectedType === 'אובדן_להלכה' ? 'אובדן להלכה' : 'טוטלוס';
  
  document.getElementById('legal-text-content').value = `טקסט משפטי לאומדן ${typeText} - מוכן לעריכה`;
  
  // Clear saved legal text from helper
  if (typeof updateHelper === 'function') {
    updateHelper('estimate_legal_text', null, 'estimate_builder_legal_text_reset');
  } else {
    // Fallback for compatibility
    const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
    delete helper.estimate_legal_text;
    sessionStorage.setItem('helper', JSON.stringify(helper));
  }
  
  console.log('Legal text reset');
}
```

**Attachments Functions:**
```javascript
// LOAD ATTACHMENTS FROM VAULT
function loadAttachmentsFromVault() {
  // Get selected type from page selection (same logic as legal text)
  const selectedType = document.querySelector('input[name="estimate-type"]:checked')?.value || 'אובדן_להלכה';
  
  // Attachments vault (inline, like legal text)
  const attachmentsVault = {
    'אובדן_להלכה': '**לוטה**\nתצלומי הרכב הניזוק\nערך רכב ממוחשב\nצילום רישיון הרכב',
    'טוטלוס': '**לוטה**\nתצלומי הרכב הניזוק\nערך רכב ממוחשב\nצילום רישיון הרכב'
  };
  
  // Get attachments for selected type
  const attachmentsText = attachmentsVault[selectedType] || '**לוטה**\nתצלומי הרכב הניזוק\nחשבוניות תיקון\nערך רכב ממוחשב\nצילום רישיון הרכב\nחשכ"ט';
  
  document.getElementById('attachments-content').value = attachmentsText;
  
  // Save to helper and LOCK the selection
  const attachmentsData = {
    estimate_attachments: attachmentsText,
    estimate_attachments_locked: true
  };
  
  if (typeof updateHelper === 'function') {
    updateHelper('estimate_attachments', attachmentsText, 'estimate_builder_attachments_load');
    updateHelper('estimate_attachments_locked', true, 'estimate_builder_attachments_lock');
  } else {
    // Fallback for compatibility
    const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
    helper.estimate_attachments = attachmentsText;
    helper.estimate_attachments_locked = true;
    sessionStorage.setItem('helper', JSON.stringify(helper));
  }
  
  console.log('📎 Attachments loaded from vault for type:', selectedType, 'and LOCKED');
}

// RESET ATTACHMENTS
function resetAttachments() {
  // Reset to default attachments
  const defaultAttachments = '**לוטה**\nתצלומי הרכב הניזוק\nחשבוניות תיקון\nערך רכב ממוחשב\nצילום רישיון הרכב\nחשכ"ט';
  document.getElementById('attachments-content').value = defaultAttachments;
  
  // Clear from helper
  if (typeof updateHelper === 'function') {
    updateHelper('estimate_attachments', null, 'estimate_builder_attachments_reset');
    updateHelper('estimate_attachments_locked', null, 'estimate_builder_attachments_unlock');
  } else {
    // Fallback for compatibility
    const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
    delete helper.estimate_attachments;
    delete helper.estimate_attachments_locked;
    sessionStorage.setItem('helper', JSON.stringify(helper));
  }
  
  console.log('Attachments reset');
}
```

#### Current Implementation Functions:

**Legal Text Functions:**
```javascript
function loadLegalTextFromVault() {
  console.log('📄 Load legal text manually triggered');
  loadLegalText().catch(console.error);
}

function resetLegalText() {
  document.getElementById('legal-text-content').value = '';
}
```

**Attachments Functions:**
```javascript
function loadAttachmentsFromVault() {
  console.log('📎 Load attachments manually triggered');
  loadLegalText().catch(console.error); // BUG: Should call loadEstimateAttachments
}

function resetAttachments() {
  document.getElementById('attachments-list').value = '';
}
```

---

### 4. **CRITICAL ISSUES IN CURRENT IMPLEMENTATION**

1. **Missing "טען מהכספת" buttons** in both sections
2. **Incorrect element ID reference** - attachments function references wrong ID (`attachments-content` vs `attachments-list`)  
3. **loadAttachmentsFromVault() calls wrong function** - calls `loadLegalText()` instead of `loadEstimateAttachments()`
4. **Different styling** - missing the exact textarea styling from legacy
5. **Missing helpful tip text** with emoji
6. **Functions are oversimplified** compared to legacy which had proper helper integration and locking mechanism

---

### 5. **WHAT NEEDS TO BE FIXED**

To match the legacy exactly:

1. **Add "טען מהכספת" buttons** to both sections positioned above the textareas
2. **Fix element ID consistency** - change `attachments-list` to `attachments-content` 
3. **Apply exact legacy styling** to both textareas (min-height, padding, background, etc.)
4. **Add the helpful tip text** with emoji below each textarea  
5. **Fix button functions** to match legacy functionality exactly
6. **Implement proper vault loading logic** for both legal text and attachments
7. **Add locking mechanism** for attachments when loaded from vault
8. **Use consistent button labels** ("איפוס רשימה" vs "איפוס נספחים")

The legacy implementation is much more robust with proper vault integration, helper data management, and user-friendly UI elements that are currently missing.
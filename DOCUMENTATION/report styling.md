detailed, step-by-step instructions for report pdf styling 

---

# PDF Styling Fix - Detailed Step-by-Step Instructions

## TASK: Fix PDF styling in final-report-template-builder.html

### STEP 1: Locate the First Style Block
**FIND this exact code (around line 5-15):**
```css
<style>
    /* Modern Professional PDF Styling */
    @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap');
    
    @page { size: A4; margin: 0; }
    body{ margin:0; direction:rtl; -webkit-print-color-adjust:exact; print-color-adjust:exact;
          font-family:'Heebo', 'Segoe UI', Tahoma, Arial, sans-serif;
          font-weight: 400; line-height: 1.6; color: #2c3e50; background: white }
    .bg{ position:fixed; inset:0; width:100%; height:100%; object-fit:cover; z-index:0; pointer-events:none }
    .page{ position:relative; z-index:1; padding: 30mm 15mm 25mm 15mm; }
  </style>
```

**REPLACE with EXACTLY this:**
```css
<style>
    /* Modern Professional PDF Styling - FIXED */
    @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap');
    
    @page { 
      size: A4; 
      margin: 42mm 12mm 30mm 12mm; /* CHANGED: Added margins for header/footer */
    }
    
    html, body {
      margin: 0;
      padding: 0;
      direction: rtl;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-family: 'Heebo', 'Segoe UI', Tahoma, Arial, sans-serif;
      font-weight: 400;
      line-height: 1.6;
      color: #2c3e50;
      background: white;
    }
    
    .bg {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: -1; /* CHANGED: Made negative to stay behind */
      pointer-events: none;
    }
    
    .page {
      position: relative;
      z-index: 1;
      padding: 10mm; /* CHANGED: Removed large padding that caused overlap */
      box-sizing: border-box;
    }
  </style>
```

### STEP 2: Update the Second Style Block
**FIND the second `<style>` block that starts with:**
```css
<style>
    body {
      font-family: 'Heebo', 'Segoe UI', Tahoma, Arial, sans-serif;
      direction: rtl;
```

**ADD these critical fixes to that style block:**

#### 2A: After the table styles (around line 50), ADD:
```css
/* CRITICAL TABLE FIXES */
table {
  border-collapse: separate !important; /* Changed from collapse */
  border-spacing: 0;
}

thead {
  display: table-header-group !important; /* Repeats headers on new pages */
}

tbody tr {
  break-inside: avoid;
  page-break-inside: avoid;
}

tbody tr:first-child td {
  border-top: 2px solid #003366; /* Clean top border after page break */
}
```

#### 2B: Find these classes and ADD break-inside rules:
```css
.text-box,
.legal-texts,
.credentials-box,
.car-details,
.section,
.signature-stamp {
  break-inside: avoid !important;
  page-break-inside: avoid !important;
}
```

#### 2C: In the @media print section, FIND:
```css
.page {
  /* existing styles */
}
```

**CHANGE it to:**
```css
.page {
  width: 100% !important;
  margin: 0 !important;
  padding: 8mm !important; /* Reduced from whatever was there */
  box-sizing: border-box !important;
  position: relative !important;
  z-index: 1 !important;
}
```

### STEP 3: Verify Critical Changes
Check that these specific lines were changed:

1. **Line with `@page`**: Should now have `margin: 42mm 12mm 30mm 12mm` instead of `margin: 0`
2. **Line with `.page` padding**: Should now have `padding: 10mm` instead of `padding: 30mm 15mm 25mm 15mm`
3. **Table border-collapse**: Should be `separate` not `collapse`
4. **Added `thead { display: table-header-group }`**: This must be present

### STEP 4: DO NOT CHANGE
⚠️ **LEAVE THESE UNTOUCHED:**
- Everything inside `<template id="template-html">`
- All `{{handlebars}}` expressions
- All JavaScript code
- The HTML structure
- The `<img class="bg" src="...">` tag
- Any script tags

### VERIFICATION CHECKLIST
After changes, verify:
- [ ] `@page` has margins (not 0)
- [ ] `.page` has small padding (10mm not 30mm)
- [ ] Tables have `border-collapse: separate`
- [ ] `thead { display: table-header-group }` exists
- [ ] Content boxes have `break-inside: avoid`
- [ ] No HTML was changed
- [ ] No JavaScript was changed
- [ ] Handlebars templates untouched

---

This more detailed approach:
1. Shows EXACT code to find (not just descriptions)
2. Shows EXACT replacements
3. Breaks it into smaller steps
4. Includes a verification checklist
5. Repeatedly emphasizes what NOT to change

This should work much better with Claude in Cursor as it gives very specific find/replace instructions rather than conceptual changes.
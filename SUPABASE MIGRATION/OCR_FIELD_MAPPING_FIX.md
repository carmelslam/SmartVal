# OCR Field Mapping Fix - Session 27
**Date:** 2025-10-13  
**Issue:** OCR webhook returns incorrect field names causing PiP display to show empty values

---

## Problem Identified (from screenshot)

### What Make.com OCR Currently Returns:
```json
{
  "pcode": "1908210",
  "cat_num_desc": "2020 הדרן ירוק כולל הלוגו הירוק",
  "availability": "",
  "location": "",
  "make": "",
  "model": "הדרן ירוק",
  "oem": "",
  "part_family": "קיזוע חיצוני",
  "source": "הירוקי"  ← WRONG FIELD! This is supplier name, not source
}
```

### What PiP Displays:
| Column | Expected Field | Current Value | Should Show |
|--------|---------------|---------------|-------------|
| ספק (Supplier) | `supplier_name` | Empty ❌ | "הירוקי" |
| מספר קטלוגי | `pcode` | "1908210" ✅ | ✅ |
| תיאור | `cat_num_desc` | Empty ❌ | "2020 הדרן ירוק..." |
| משפחת חלק | `part_family` | Empty ❌ | "קיזוע חיצוני" |
| דגם | `model` | "הדרן ירוק" ✅ | ✅ |
| שנה | `year_from`/`year_to` | Empty ❌ | From OCR |
| סוג | `availability` or `source` | "לא מוגדר" ❌ | "מקורי"/"תחליפי" |
| מחיר | `price` | ₪1,006.99 ✅ | ✅ |
| תאריך | `version_date` | 13.10.2025 ✅ | ✅ |

---

## Field Definitions (Corrected)

### Core Part Fields

| Field Name | Type | Purpose | Example | PiP Column |
|------------|------|---------|---------|------------|
| **pcode** | string | Catalog/part number from supplier | "1908210", "52101-0X903" | מספר קטלוגי |
| **cat_num_desc** | string | Part description (Hebrew) | "2020 הדרן ירוק כולל הלוגו הירוק" | תיאור |
| **supplier_name** | string | **Supplier company name** | "הירוקי", "חלקי רכב בע\"מ" | ספק |
| **part_family** | string | Part category (from parts.js) | "קיזוע חיצוני", "פגושים", "פנסים" | משפחת חלק |
| **price** | number | Price in ILS | 1006.99, 2850.00 | מחיר |
| **oem** | string | OEM part number | "52101-0X903" | - |

### Part Type/Status Fields

| Field Name | Type | Purpose | Example | PiP Column |
|------------|------|---------|---------|------------|
| **source** | string | **Part type/origin** | "מקורי" (original), "תחליפי" (aftermarket), "משומש" (used) | סוג |
| **availability** | string | Stock status | "במלאי", "זמין", "אזל מהמלאי" | סוג (fallback) |
| **location** | string | Geographic location | "ישראל", "גרמניה" | - |

### Vehicle Fields

| Field Name | Type | Purpose | Example | PiP Column |
|------------|------|---------|---------|------------|
| **make** | string | Vehicle manufacturer | "טויוטה", "יונדאי" | - |
| **model** | string | Vehicle model | "קורולה קרוס", "הדרן ירוק" | דגם |
| **year_from** | integer | Compatibility start year | 2020, 2018 | שנה |
| **year_to** | integer | Compatibility end year | 2024, 2023 | שנה |
| **trim** | string | Vehicle trim | "ADVENTURE" | - |
| **engine_volume** | string | Engine size | "2000" | - |
| **engine_code** | string | Engine code | "2ZR" | - |
| **engine_type** | string | Fuel type | "בנזין", "דיזל" | - |
| **vin** | string | VIN number | "JTNADACB20J001538" | - |

### Metadata Fields

| Field Name | Type | Purpose | Example |
|------------|------|---------|---------|
| **version_date** | date | Catalog update date | "2025-10-13" |
| **created_at** | timestamp | Record creation | "2025-10-13T15:41:00Z" |
| **comments** | string | Additional notes | "זמין תוך 2 ימים" |

---

## PiP Code Mapping (parts-search-results-pip.js:328-360)

```javascript
const tableRows = this.searchResults.map((item, index) => {
  // Line 330-331: Price formatting
  const price = item.price ? parseFloat(item.price) : null;
  const formattedPrice = price ? `₪${price.toLocaleString('he-IL')}` : 'לא זמין';
  
  // Line 332: Date formatting  
  const versionDate = item.version_date ? new Date(item.version_date).toLocaleDateString('he-IL') : '';
  
  // Line 335-337: Display fields
  const modelDisplay = item.model_display || item.model || 'לא מוגדר';
  const extractedYear = item.extracted_year || 'לא מוגדר';
  const partFamily = item.part_family || 'לא מוגדר';
  
  return `
    <tr class="result-row ${isSelected ? 'selected' : ''}" data-item-id="${item.id}">
      <td class="col-supplier">${item.supplier_name || 'לא זמין'}</td>          // Line 350
      <td class="col-catalog">${item.pcode || 'לא זמין'}</td>                   // Line 351
      <td class="col-description">${item.cat_num_desc || 'לא זמין'}</td>        // Line 352
      <td class="col-family">${partFamily}</td>                                  // Line 353
      <td class="col-model">${modelDisplay}</td>                                 // Line 354
      <td class="col-year">${extractedYear}</td>                                 // Line 355
      <td class="col-type">${item.availability || 'מקורי'}</td>                 // Line 356
      <td class="col-price">${formattedPrice}</td>                               // Line 357
      <td class="col-date">${versionDate}</td>                                   // Line 358
    </tr>
  `;
});
```

---

## Current OCR Webhook Issue

### Issue #1: Supplier Name in Wrong Field
```json
// ❌ WRONG - Current OCR webhook
{
  "source": "הירוקי"  // This is supplier name, not part type!
}

// ✅ CORRECT - Should be
{
  "supplier_name": "הירוקי",
  "source": "מקורי"  // or "תחליפי" or "משומש"
}
```

### Issue #2: Missing cat_num_desc
The webhook returns `cat_num_desc` but PiP shows empty. This might be:
- OCR extracting it but not including in results array
- Field being overwritten somewhere
- Field name mismatch in Make.com response structure

### Issue #3: Missing part_family
Same as above - webhook has it in helper but PiP doesn't display it.

### Issue #4: Vehicle Details Missing
OCR results should include vehicle details from the OCR'd document:
```json
{
  "make": "טויוטה",        // From OCR'd text
  "model": "קורולה קרוס",  // From OCR'd text  
  "year_from": 2022,       // From OCR'd text
  "year_to": 2024          // From OCR'd text or same as year_from
}
```

---

## Root Cause Analysis

Looking at the helper in the screenshot:
```json
results: [{
  "pcode": "1908210",
  "cat_num_desc": "2020 הדרן ירוק כולל הלוגו הירוק",
  "part_family": "קיזוע חיצוני",
  "source": "הירוקי"
}]
```

But PiP shows all these fields as empty! This means:

### Hypothesis 1: Data Structure Mismatch
The webhook returns:
```json
{
  "body": {
    "results": [{ /* parts here */ }]
  }
}
```

But the results are being extracted from a DIFFERENT level, causing fields to be lost.

### Hypothesis 2: Field Transformation Issues
The `handleWebhookResponse()` or `convertCatalogToHelperFormat()` functions might be:
- Stripping fields
- Renaming fields incorrectly
- Not handling OCR structure properly

---

## Fix Strategy

### Step 1: Fix Make.com OCR Scenario Response Structure

Ensure Make.com returns this EXACT structure:
```json
[
  {
    "body": {
      "results": [
        {
          "pcode": "1908210",
          "cat_num_desc": "2020 הדרן ירוק כולל הלוגו הירוק",
          "supplier_name": "הירוקי",                    // NOT "source"
          "source": "מקורי",                             // Part type, not supplier
          "part_family": "קיזוע חיצוני",
          "price": 1006.99,
          "make": "טויוטה",                              // From OCR
          "model": "קורולה קרוס",                        // From OCR
          "year_from": 2022,                             // From OCR
          "year_to": 2024,                               // From OCR
          "availability": "במלאי",                       // If available
          "oem": "",                                     // If available
          "location": "ישראל",                          // If available
          "version_date": "2025-10-13"                   // Today's date
        }
      ]
    },
    "plate": "221-84-003",
    "vehicle_make": "טויוטה",      // Vehicle details from form/OCR
    "vehicle_model": "קורולה קרוס",
    "vehicle_year": 2022
  }
]
```

### Step 2: Verify handleWebhookResponse() Preserves All Fields

Check `parts search.html` lines 1375-1425 to ensure OCR fields aren't being stripped during processing.

### Step 3: Add OCR-Specific Field Mapping (If Needed)

If Make.com can't be changed, add conditional logic in PiP:

```javascript
// In generateResultsTableHTML() around line 350
const supplierDisplay = this.dataSource === 'ocr' 
  ? (item.supplier_name || item.source || 'לא זמין')  // OCR: fallback to source if supplier_name missing
  : (item.supplier_name || 'לא זמין');                // Catalog/Web: only supplier_name

const sourceDisplay = this.dataSource === 'ocr'
  ? (item.availability || item.source_type || 'לא מוגדר')  // OCR: check alternative fields
  : (item.availability || item.source || 'מקורי');          // Catalog/Web: standard
```

**⚠️ WARNING:** This is a WORKAROUND. The proper fix is Step 1.

---

## Make.com OCR Scenario Configuration

### What Make.com Should Do:

1. **Receive webhook** with base64 image
2. **Call Google Vision API** to extract text
3. **Parse OCR text** to extract:
   - Part numbers (pcode)
   - Part descriptions (cat_num_desc)
   - Supplier names (supplier_name) - NOT source!
   - Part types (source) - "מקורי"/"תחליפי"/"משומש"
   - Part families (part_family)
   - Prices
   - Vehicle details (make, model, year)
4. **Structure response** in correct format
5. **Return to webhook** with proper field names

### Example Make.com Module Mapping:

```json
{
  "pcode": "{{extractedPartNumber}}",
  "cat_num_desc": "{{extractedDescription}}",
  "supplier_name": "{{extractedSupplier}}",     // ← FIX: Not "source"!
  "source": "{{extractedPartType}}",            // ← FIX: Should be "מקורי" etc
  "part_family": "{{matchedFamily}}",           // Match against parts.js families
  "price": "{{extractedPrice}}",
  "make": "{{ocrVehicleMake}}",
  "model": "{{ocrVehicleModel}}",
  "year_from": "{{ocrYear}}",
  "year_to": "{{ocrYear}}"
}
```

---

## Testing Checklist

After fixing Make.com:

### Test 1: OCR Field Display
- [ ] Supplier name appears in ספק column
- [ ] Description appears in תיאור column
- [ ] Part family appears in משפחת חלק column
- [ ] Source appears in סוג column (not supplier name!)

### Test 2: Catalog Search (Must Still Work!)
- [ ] Catalog search displays correctly
- [ ] All fields show proper values
- [ ] No regression from OCR changes

### Test 3: Web Search (Must Still Work!)
- [ ] Web search displays correctly
- [ ] All fields show proper values
- [ ] No regression from OCR changes

### Test 4: Vehicle Details in Subtitle
- [ ] OCR subtitle shows: "טויוטה קורולה קרוס • 2022"
- [ ] Catalog subtitle shows: "טויוטה A6 • 2018-2022"
- [ ] Web subtitle shows: "טויוטה Corolla • 2020"

---

## Summary

**Main Issue:** Make.com OCR is using wrong field name for supplier:
- Currently: `"source": "הירוקי"` ❌
- Should be: `"supplier_name": "הירוקי"` ✅

**Fields Definition:**
- `supplier_name` = Company/supplier name (e.g., "הירוקי", "חלקי רכב")
- `source` = Part type/origin (e.g., "מקורי", "תחליפי", "משומש")
- `availability` = Stock status (e.g., "במלאי", "אזל מהמלאי")

**Action Required:**
1. Fix Make.com OCR scenario to use correct field names
2. Ensure all fields (cat_num_desc, part_family, etc.) are properly mapped
3. Include vehicle details (make, model, year) from OCR text
4. Test all three search paths (catalog, web, OCR)

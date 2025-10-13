# OCR Webhook Response JSON Structure
**Session 27 - Complete Reference Document**  
**Date:** 2025-10-13  
**Purpose:** Define exact JSON structure that Make.com OCR webhook must return

---

## Critical Information

### Webhook URL
```
https://hook.eu2.make.com/w11tujdfbmq03co3vakb2jfr5vo4k6w6
```
**⚠️ This URL is shared with invoice OCR - ensure proper routing in Make.com**

### Data Source Value
- **UI sends:** `dataSource = 'ocr'` (English)
- **Database expects:** `data_source = 'catalog' | 'web' | 'ocr'` (English values only)
- **Legacy Hebrew values removed in Session 26**

---

## Expected JSON Structure

### Option 1: Standard Array Response (RECOMMENDED)
This is the format the system handles best:

```json
[
  {
    "body": {
      "results": [
        {
          "pcode": "52101-0X903",
          "cat_num_desc": "פגוש קדמי טויוטה קורולה קרוס 2022",
          "price": 2850.00,
          "supplier_name": "חלקי רכב בע\"מ",
          "part_family": "פגושים",
          "make": "טויוטה",
          "model": "קורולה קרוס",
          "year_from": 2022,
          "year_to": 2024,
          "oem": "52101-0X903",
          "availability": "מקורי",
          "location": "ישראל",
          "source": "מקורי",
          "comments": null
        },
        {
          "pcode": "81130-0X921",
          "cat_num_desc": "פנס קדמי ימין LED",
          "price": 3200.00,
          "supplier_name": "מרכז חלקים",
          "part_family": "פנסים",
          "make": "טויוטה",
          "model": "קורולה קרוס",
          "year_from": 2022,
          "year_to": 2024,
          "oem": "81130-0X921",
          "availability": "במלאי",
          "location": "ישראל",
          "source": "מקורי"
        }
      ]
    },
    "plate": "221-84-003",
    "search_date": "2025-10-13T15:41:00Z"
  }
]
```

### Option 2: Object with Body
```json
{
  "body": {
    "results": [
      {
        "pcode": "52101-0X903",
        "cat_num_desc": "פגוש קדמי טויוטה קורולה קרוס 2022",
        "price": 2850.00,
        "supplier_name": "חלקי רכב בע\"מ",
        "part_family": "פגושים",
        "oem": "52101-0X903",
        "availability": "מקורי"
      }
    ]
  },
  "plate": "221-84-003"
}
```

### Option 3: Direct Results Array
```json
{
  "results": [
    {
      "pcode": "52101-0X903",
      "cat_num_desc": "פגוש קדמי טויוטה קורולה קרוס 2022",
      "price": 2850.00,
      "supplier_name": "חלקי רכב בע\"מ",
      "part_family": "פגושים"
    }
  ],
  "plate": "221-84-003"
}
```

---

## Field Definitions

### Per-Part Required Fields (in results array)

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| **pcode** | string | ✅ YES | Supplier catalog number | `"52101-0X903"` |
| **cat_num_desc** | string | ✅ YES | Part description (Hebrew/English) | `"פגוש קדמי טויוטה קורולה קרוס"` |
| **price** | number | ✅ YES | Price in ILS (₪) | `2850.00` |
| **supplier_name** | string | ✅ YES | Supplier name | `"חלקי רכב בע\"מ"` |

### Per-Part Optional Fields (highly recommended)

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| **part_family** | string | 🟡 Recommended | Part category | `"פגושים"`, `"פנסים"`, `"דלתות"` |
| **make** | string | 🟡 Recommended | Vehicle manufacturer | `"טויוטה"`, `"יונדאי"` |
| **model** | string | 🟡 Recommended | Vehicle model | `"קורולה קרוס"` |
| **year_from** | integer | 🟡 Recommended | Compatibility start year | `2022` |
| **year_to** | integer | 🟡 Recommended | Compatibility end year | `2024` |
| **oem** | string | 🟡 Recommended | OEM part number | `"52101-0X903"` |
| **availability** | string | 🟡 Recommended | Part type/status | `"מקורי"`, `"תחליפי"`, `"במלאי"` |
| **location** | string | ⚪ Optional | Geographic location | `"ישראל"`, `"גרמניה"` |
| **source** | string | ⚪ Optional | Source type | `"מקורי"`, `"תחליפי"` |
| **comments** | string | ⚪ Optional | Additional notes | `"זמין תוך 2 ימים"` |
| **trim** | string | ⚪ Optional | Vehicle trim level | `"ADVENTURE"` |
| **engine_volume** | string | ⚪ Optional | Engine volume | `"2000"` |
| **engine_code** | string | ⚪ Optional | Engine code | `"2ZR"` |
| **engine_type** | string | ⚪ Optional | Fuel type | `"בנזין"`, `"דיזל"` |
| **vin** | string | ⚪ Optional | VIN number | `"JTNADACB20J001538"` |

### Webhook-Level Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| **plate** | string | ✅ YES | License plate number | `"221-84-003"` |
| **search_date** | string | ⚪ Optional | ISO 8601 timestamp | `"2025-10-13T15:41:00Z"` |

---

## Database Storage Structure

### 1. parts_search_sessions Table
Created when search is triggered (before OCR webhook is sent):

```sql
INSERT INTO parts_search_sessions (
  case_id,              -- uuid (from helper lookup)
  plate,                -- "221-84-003"
  search_context,       -- JSONB: original search params
  data_source,          -- 'ocr' (English value)
  make,                 -- "טויוטה יפן"
  model,                -- "קורולה קרוס"
  trim,                 -- "ADVENTURE"
  year,                 -- "2022"
  engine_volume,        -- "2000"
  engine_code,          -- "2ZR"
  engine_type,          -- "בנזין"
  vin,                  -- "JTNADACB20J001538"
  created_by,           -- uuid (user_id from auth)
  created_at            -- timestamptz
) VALUES (...);
```

### 2. parts_search_results Table
Created when webhook returns results:

```sql
INSERT INTO parts_search_results (
  session_id,           -- uuid (links to parts_search_sessions)
  plate,                -- "221-84-003"
  make,                 -- "טויוטה"
  model,                -- "קורולה קרוס"
  trim,                 -- "ADVENTURE"
  year,                 -- "2022"
  engine_volume,        -- "2000"
  engine_code,          -- "2ZR"
  engine_type,          -- "בנזין"
  vin,                  -- "JTNADACB20J001538"
  part_family,          -- "פגושים" (from first result)
  search_type,          -- 'simple_search' | 'advanced_search'
  data_source,          -- 'ocr' (English value)
  search_query,         -- JSONB: full search parameters
  results,              -- JSONB: complete results array
  response_time_ms,     -- integer (optional)
  created_at            -- timestamptz
) VALUES (...);
```

**CRITICAL:** `results` field stores the COMPLETE results array as JSONB:
```json
[
  {
    "pcode": "52101-0X903",
    "cat_num_desc": "פגוש קדמי טויוטה קורולה קרוס 2022",
    "price": 2850.00,
    "supplier_name": "חלקי רכב בע\"מ",
    "part_family": "פגושים",
    ...all other fields...
  },
  {...next part...}
]
```

### 3. selected_parts Table
Created when user checks checkbox in PiP to select a part:

```sql
INSERT INTO selected_parts (
  search_result_id,     -- uuid (links to parts_search_results)
  plate,                -- "221-84-003"
  part_name,            -- from cat_num_desc
  pcode,                -- "52101-0X903"
  cat_num_desc,         -- "פגוש קדמי טויוטה קורולה קרוס 2022"
  oem,                  -- "52101-0X903"
  supplier_name,        -- "חלקי רכב בע\"מ"
  price,                -- 2850.00
  source,               -- "מקורי"
  part_family,          -- "פגושים"
  availability,         -- "מקורי" | "במלאי"
  location,             -- "ישראל"
  comments,             -- optional notes
  quantity,             -- 1 (default)
  make,                 -- "טויוטה"
  model,                -- "קורולה קרוס"
  trim,                 -- "ADVENTURE"
  year,                 -- "2022"
  engine_volume,        -- "2000"
  engine_code,          -- "2ZR"
  engine_type,          -- "בנזין"
  vin,                  -- "JTNADACB20J001538"
  status,               -- 'selected'
  data_source,          -- 'ocr' (English value)
  raw_data,             -- JSONB: complete original part data
  selected_at           -- timestamptz
) VALUES (...);
```

---

## Helper Structure (window.helper)

The webhook response is stored in multiple locations in the helper object:

### 1. Raw Webhook Data
```javascript
helper.parts_search.raw_webhook_data = [
  {
    id: "webhook_1697123456789",
    timestamp: "2025-10-13T15:41:00Z",
    data_source: "ocr",
    plate: "221-84-003",
    webhook: {
      // Complete webhook response
      body: {
        results: [...]
      },
      plate: "221-84-003"
    }
  }
];
```

### 2. OCR-Specific Results Array
```javascript
helper.parts_search.ocr_results = [
  {
    timestamp: "2025-10-13T15:41:00Z",
    plate: "221-84-003",
    results: [
      {
        pcode: "52101-0X903",
        cat_num_desc: "פגוש קדמי טויוטה קורולה קרוס 2022",
        price: 2850.00,
        supplier_name: "חלקי רכב בע\"מ",
        ...
      }
    ]
  }
];
```

### 3. Generic Results Array (backward compatibility)
```javascript
helper.parts_search.results = [
  {
    pcode: "52101-0X903",
    cat_num_desc: "פגוש קדמי טויוטה קורולה קרוס 2022",
    price: 2850.00,
    supplier_name: "חלקי רכב בע\"מ",
    ...
  }
];
```

### 4. Selected Parts List
```javascript
helper.parts_search.selected_parts = [
  {
    id: "uuid-xxx",
    pcode: "52101-0X903",
    name: "פגוש קדמי טויוטה קורולה קרוס 2022",
    price: 2850.00,
    supplier: "חלקי רכב בע\"מ",
    source: "ocr",
    selected_at: "2025-10-13T15:42:00Z"
  }
];
```

---

## PiP Display Mapping

The PiP (Picture-in-Picture) results window displays parts in a table with these columns:

| Column Header (Hebrew) | Source Field | Formatting |
|------------------------|--------------|------------|
| ✓ (Checkbox) | - | Selects part |
| ספק | `supplier_name` | Plain text |
| מספר קטלוגי | `pcode` | Plain text |
| תיאור | `cat_num_desc` | Plain text, truncated if long |
| משפחת חלק | `part_family` | Plain text |
| דגם | `model` or `model_display` | Plain text |
| שנה | `year_from` - `year_to` or `extracted_year` | Range format |
| סוג | `availability` or `source` | Plain text |
| מחיר | `price` | `₪X,XXX.XX` format |
| תאריך | `version_date` or `created_at` | Date only |

### PiP Display Code Reference
**File:** `parts-search-results-pip.js`
- Lines 286-373: `generateResultsTableHTML()` method
- Lines 634-678: `convertCatalogToHelperFormat()` method

---

## Code Processing Flow

### 1. OCR Search Triggered (parts search.html:1808-2005)
```javascript
async function searchOCR() {
  // 1. Validate file
  // 2. Create session in Supabase
  window.currentSearchSessionId = await partsSearchSupabaseService.createSearchSession(
    plate,
    { searchParams: { plate }, dataSource: 'ocr' }
  );
  
  // 3. Compress image
  // 4. Send to webhook
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plate,
      make,
      model,
      year,
      file_name,
      file_type,
      file_data: base64Data
    })
  });
  
  // 5. Process response
  const webhookData = await response.json();
  await handleWebhookResponse(webhookData, 'ocr');
}
```

### 2. Webhook Response Handling (parts search.html:1375-1425)
```javascript
async function handleWebhookResponse(webhookData, dataSource) {
  // Extract results from multiple possible structures
  let flatResults = [];
  
  if (Array.isArray(webhookData)) {
    flatResults = webhookData[0]?.body?.results || 
                  webhookData[0]?.results || [];
  } else if (webhookData.body?.results) {
    flatResults = webhookData.body.results;
  } else if (webhookData.results) {
    flatResults = webhookData.results;
  }
  
  // Store in helper.parts_search.ocr_results array
  if (dataSource === 'ocr') {
    if (!helper.parts_search.ocr_results) {
      helper.parts_search.ocr_results = [];
    }
    helper.parts_search.ocr_results.push({
      timestamp: new Date().toISOString(),
      plate: plate,
      results: flatResults
    });
  }
  
  // Save to Supabase
  await partsSearchSupabaseService.saveSearchResults(
    window.currentSearchSessionId,
    flatResults,
    { searchParams: { plate }, dataSource: 'ocr' }
  );
  
  // Display in PiP
  window.showPartsSearchPip(flatResults, {
    plate: plate,
    sessionId: window.currentSearchSessionId,
    searchType: 'ocr_search',
    dataSource: 'ocr'
  });
}
```

### 3. Supabase Storage (partsSearchSupabaseService.js:196-284)
```javascript
async saveSearchResults(sessionId, results = [], query = {}) {
  const insertData = {
    session_id: sessionId,
    plate: query.plate,
    make: searchParams.make,
    model: searchParams.model,
    // ...other vehicle fields...
    part_family: results[0]?.part_family || null,
    search_type: 'simple_search', // or 'advanced_search'
    data_source: 'ocr', // English value
    search_query: searchParams, // Full params as JSONB
    results: results, // Complete results array as JSONB
    response_time_ms: query.searchTime || null,
    created_at: new Date().toISOString()
  };
  
  await supabase
    .from('parts_search_results')
    .insert(insertData);
}
```

---

## Make.com Vision API Configuration Fix

### Current Problem (from screenshots):
```json
{
  "requests": [{
    "image": {
      "content": "{{1.file.data}}"  ❌ WRONG - field doesn't exist
    },
    "features": [
      { "type": "DOCUMENT_TEXT_DETECTION" }
    ]
  }]
}
```

### Required Fix:
```json
{
  "requests": [{
    "image": {
      "content": "{{1.file_data}}"  ✅ CORRECT - matches webhook payload
    },
    "features": [
      { "type": "DOCUMENT_TEXT_DETECTION" }
    ],
    "imageContext": {
      "languageHints": ["he"]
    }
  }]
}
```

**Action Required:**
1. Open Make.com scenario: "OCR car-parts results"
2. Click on "Vision API OCR" module
3. In "Request content" mapping:
   - Find: `"content": "{{1.file.data}}"`
   - Change to: `"content": "{{1.file_data}}"`
4. Save scenario
5. Test with new image upload

---

## Testing the Webhook

### Test Data for Make.com Development
```json
{
  "plate": "221-84-003",
  "make": "טויוטה יפן",
  "model": "קורולה קרוס",
  "year": "2022",
  "file_name": "parts.jpg",
  "file_type": "image/jpeg",
  "file_data": "iVBORw0KGgoAAAANSUhEUgAAAAUA..."
}
```

### Expected Response from Make.com
```json
[
  {
    "body": {
      "results": [
        {
          "pcode": "52101-0X903",
          "cat_num_desc": "פגוש קדמי טויוטה קורולה קרוס 2022",
          "price": 2850.00,
          "supplier_name": "חלקי רכב בע\"מ",
          "part_family": "פגושים",
          "make": "טויוטה",
          "model": "קורולה קרוס",
          "year_from": 2022,
          "year_to": 2024,
          "oem": "52101-0X903",
          "availability": "מקורי",
          "location": "ישראל"
        }
      ]
    },
    "plate": "221-84-003",
    "search_date": "2025-10-13T15:41:00Z"
  }
]
```

### Browser Console Test
```javascript
// Simulate OCR webhook response
const testOCRResponse = [
  {
    "body": {
      "results": [
        {
          "pcode": "TEST-001",
          "cat_num_desc": "בדיקה פנס קדמי",
          "price": 1200,
          "supplier_name": "חלקים בע\"מ",
          "part_family": "פנסים",
          "availability": "במלאי"
        }
      ]
    },
    "plate": "221-84-003"
  }
];

// Process the test response
await window.handleWebhookResponse(testOCRResponse, 'ocr');

// Verify storage
console.log('OCR Results:', window.helper.parts_search.ocr_results);
console.log('Raw Webhook Data:', window.helper.parts_search.raw_webhook_data);
```

---

## Error Handling

### Common Errors and Solutions

#### 1. "Request must include a valid features" (400 Error)
**Cause:** Vision API `image.content` field is empty  
**Solution:** Fix Make.com mapping from `{{1.file.data}}` to `{{1.file_data}}`

#### 2. Empty Results Array
**Cause:** OCR couldn't extract text or no parts matched  
**Solution:** Return empty results array with metadata:
```json
{
  "body": {
    "results": []
  },
  "plate": "221-84-003",
  "error": "לא נמצאו חלקים בתמונה",
  "ocr_text": "...(raw OCR text)..."
}
```

#### 3. Database Constraint Error
**Cause:** Using Hebrew `data_source` values  
**Solution:** Always use English values: `'catalog'`, `'web'`, `'ocr'`

#### 4. Duplicate Parts Selected
**Cause:** User clicks checkbox multiple times  
**Solution:** System checks for duplicates by `pcode` before inserting

---

## Session 26 Changes Summary

### 1. Data Source Migration (Hebrew → English)
**Before:** `data_source = 'קטלוג' | 'אינטרנט' | 'אחר'`  
**After:** `data_source = 'catalog' | 'web' | 'ocr'`

**Modified Files:**
- `parts search.html` (8 locations)
- `partsSearchSupabaseService.js` (3 locations)
- `parts-search-results-pip.js` (routing logic)

### 2. OCR Results Array Separation
**Added:** `helper.parts_search.ocr_results[]`  
**Added:** `helper.parts_search.web_search_results[]`  
**Kept:** `helper.parts_search.results[]` (backward compatibility)

### 3. Removed Hardcoded Webhook URL
**Before:** `const webhookUrl = 'https://hook.eu2.make.com/...'`  
**After:** `const webhookUrl = window.WEBHOOKS?.INTERNAL_PARTS_OCR || '...'`

---

## Files Reference

### Core Files Modified
1. **parts search.html** (lines 1808-2005) - `searchOCR()` function
2. **parts search.html** (lines 1375-1425) - `handleWebhookResponse()` function
3. **webhook.js** (line 27) - `INTERNAL_PARTS_OCR` webhook definition
4. **partsSearchSupabaseService.js** (lines 128-185) - `createSearchSession()`
5. **partsSearchSupabaseService.js** (lines 196-284) - `saveSearchResults()`
6. **parts-search-results-pip.js** - PiP display logic

### Database Schema Files
1. **SESSION_11_REORDER_PARTS_SEARCH_RESULTS_COLUMNS.sql**
2. **SESSION_12_DROP_UNUSED_SEARCH_RESULTS_TABLE.sql**
3. **SESSION_26_DATA_SOURCE_ENGLISH_MIGRATION.sql** (to be created)

---

## Summary

The OCR webhook MUST return an array with a `body.results` structure containing part objects with at minimum: `pcode`, `cat_num_desc`, `price`, and `supplier_name`. The system will extract these results, store them in Supabase, display them in the PiP window, and allow users to select parts for their case.

**Critical Fix Required:** Change Make.com Vision API module mapping from `{{1.file.data}}` to `{{1.file_data}}` to resolve the 400 error.

# SESSION 28 - MASTER PLAN: Fix OCR Display & Restore All Paths
**Date:** 2025-10-13  
**Session:** 28  
**Previous Session:** 27 (OCR webhook field mapping fixes)  
**Status:** READY FOR EXECUTION

---

## EXECUTIVE SUMMARY

### What Happened in Session 27:
- ✅ Fixed Make.com Vision API mapping (`{{1.file.data}}` → `{{1.file_data}}`)
- ✅ Removed hardcoded webhook URL (now uses `window.WEBHOOKS.INTERNAL_PARTS_OCR`)
- ✅ Updated field transformation to prioritize webhook data over form data for OCR
- ✅ Created comprehensive field mapping documentation
- ❌ Did NOT fix OCR PiP display (fields still empty)
- ❌ Did NOT verify Supabase integration status

### Critical Discovery:
**OCR webhook uses `description` field, NOT `cat_num_desc`!**

User provided actual OCR response structure:
```json
{
  "plate": "221-84-003",
  "model": "רנו סניק 2020",
  "model_description": "תצורה: מיניוואן, מס' דלתות: 4 דלתות...",
  "pcode": "1908210",
  "part_family": "חלקי מרכב",
  "description": "מכסה מנוע",  ← This field, not cat_num_desc!
  "price": 1006.99,
  "quantity": 1,
  "make": "רנו",
  "year": 2020,
  "source": "תחליפי"
}
```

### Session 28 Goals:
1. ✅ Fix OCR field mapping (`description` priority)
2. ✅ Fix OCR PiP subtitle (use OCR data, not form data)
3. ✅ Verify all 3 paths work with Supabase
4. ✅ Document everything for Session 29
5. ❌ DO NOT break catalog or web search paths!

---

## PART 1: ARCHITECTURE ANALYSIS (Sessions 22-26)

### 1.1 The Three Search Paths

#### **PATH 1: CATALOG SEARCH (קטלוג)**
**Badge:** 🗄️ Green  
**Data Source:** Internal Supabase `catalog_items` table  
**Trigger:** "חפש במאגר הנתונים" button

**Flow:**
```
User fills form 
  ↓
searchSupabase()
  ↓
Create session in Supabase (UUID)
  ↓
SimplePartsSearchService.searchParts()
  ↓
Query catalog_items table
  ↓
Return results (already in Hebrew catalog format)
  ↓
PiP.showResults() with green badge
  ↓
User selects parts (checkboxes)
  ↓
Save to selected_parts table
```

**Fields Used:**
- Vehicle: plate, make, model, model_code, trim, year, engine_volume, engine_code, engine_type, vin
- Part Query: part_group, part_name, free_query, oem, source
- Results: All fields from catalog_items (pcode, cat_num_desc, supplier_name, price, part_family, oem, availability, location)

**Unique Characteristics:**
- ✅ Synchronous (immediate results)
- ✅ No transformation needed
- ✅ No webhook involved
- ✅ Supports advanced filtering (part family, OEM search)
- ✅ 1M+ rows with optimized indexes

**Session 25 Critical Fix:** Now creates Supabase session BEFORE search (was missing)

---

#### **PATH 2: WEB SEARCH (אינטרנט)**
**Badge:** 🌐 Blue  
**Data Source:** External Make.com webhook → web scraping/APIs  
**Trigger:** "חפש במערכת חיצונית" button

**Flow:**
```
User fills form
  ↓
searchWebExternal()
  ↓
Create session in Supabase (UUID)
  ↓
POST to Make.com webhook
  ↓
Make.com: web scraping/API calls
  ↓
Webhook returns results (Hebrew field names, varied)
  ↓
handleWebhookResponse('web')
  ↓
Store raw webhook in helper.parts_search.raw_webhook_data[]
  ↓
Transform Hebrew fields → catalog format
  ↓
Append to helper.parts_search.web_search_results[]
  ↓
PiP.showResults() with blue badge
  ↓
User selects parts
  ↓
Save to selected_parts table
```

**Field Transformation (Session 24):**
```javascript
// Hebrew → English
'שם_ספק' | 'ספק' → supplier_name
'קוד_קטלוגי' → pcode
'תיאור_חלק' → cat_num_desc
'מחיר' → price
'סוג_מקור' → source
'מלאי' → stock
'מיקום' → location
'הערות' → comments
```

**Unique Characteristics:**
- ⏳ Asynchronous (webhook wait time)
- 🔄 Complex field transformation required
- 💾 Raw webhook data preserved
- 🌐 External data source (not in DB)
- 📁 Supports file upload (catalog PDFs)
- 🔗 Webhook-specific fields: location, comments, condition, stock, currency

**Session 26 Critical Fix:** Raw webhook now APPENDS to array (was overwriting)

---

#### **PATH 3: OCR SEARCH (OCR)**
**Badge:** 📄 Orange  
**Data Source:** Make.com webhook → Google Vision OCR → catalog matching  
**Trigger:** "שלח תוצאת חיפוש לניתוח" button

**Flow:**
```
User uploads PDF/image
  ↓
searchOCR()
  ↓
Validate file (PDF/JPG/PNG, max 10MB)
  ↓
Compress image (1920x1920, quality 0.7)
  ↓
Convert to base64 (strip data URL prefix)
  ↓
Create session in Supabase (UUID)
  ↓
POST to Make.com OCR webhook
  ↓
Make.com: Google Vision OCR
  ↓
Extract text from image
  ↓
Match OCR text to catalog
  ↓
Return results with vehicle details from OCR
  ↓
handleWebhookResponse('ocr')
  ↓
Store raw webhook in helper.parts_search.raw_webhook_data[]
  ↓
Transform fields → catalog format
  ↓
Append to helper.parts_search.ocr_results[]
  ↓
PiP.showResults() with orange badge
  ↓
User selects parts
  ↓
Save to selected_parts table
```

**Unique Characteristics:**
- 📤 File upload REQUIRED
- 🗜️ Image compression to reduce payload
- 🔤 Base64 encoding for transmission
- 👁️ Google Vision OCR text extraction
- 🔍 Two-stage: OCR → catalog match
- 🚗 Vehicle details come from OCR'd text (NOT form input!)
- 📋 Multiple parts per file (unlike catalog/web single part search)

**Critical Difference from Web Search:**
- **Web:** Uses form data as fallback for vehicle details
- **OCR:** Uses ONLY OCR data (form is just for plate trigger)
- **Web:** Single part query → multiple supplier results
- **OCR:** Multiple parts in one file → one result per part

**Session 26 Status:** Partially broken - Make.com returns 500 error
**Session 27 Status:** Webhook fixed but PiP display broken (wrong field names)

---

### 1.2 What All Paths Share

#### **Universal Framework:**
1. **Session Creation** (All paths)
   - Create UUID in `parts_search_sessions` BEFORE search
   - Store in `window.currentSearchSessionId`
   - Pass to PiP via `pipContext.sessionId`

2. **PiP Component** (Same for all)
   - File: `parts-search-results-pip.js`
   - Same result card layout
   - Same checkbox selection
   - Same count logic
   - Only difference: badge color/text

3. **Helper Structure** (Universal)
   ```javascript
   helper.parts_search = {
     results: [],                    // Generic (all paths)
     web_search_results: [],         // Web-specific
     ocr_results: [],                // OCR-specific
     current_selected_list: [],      // Current search selections
     selected_parts: [],             // Cumulative selections
     raw_webhook_data: []            // Web/OCR raw webhooks
   }
   ```

4. **Supabase Integration** (3 tables)
   ```
   parts_search_sessions (id: UUID)
     ↓ FK: session_id
   parts_search_results (id: UUID)
     ↓ FK: search_result_id
   selected_parts (id: UUID)
   ```

5. **Smart Sync** (Page load)
   - Load from `selected_parts` table by plate
   - Sync to `helper.parts_search.selected_parts`
   - Handle deletions (clear helper if Supabase empty)

6. **Duplicate Prevention** (All paths)
   - Check by `pcode + plate` before adding
   - Return false if already selected
   - Maintain unique selections only

---

### 1.3 Supabase Table Structures

#### **Table 1: parts_search_sessions**
**Purpose:** Track every search attempt

```sql
CREATE TABLE parts_search_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id),  -- 3-tier waterproof lookup
  plate TEXT NOT NULL,
  data_source TEXT CHECK (data_source IN ('catalog', 'web', 'ocr')),  -- English!
  search_context JSONB,  -- Full search parameters
  
  -- Vehicle details
  make TEXT,
  model TEXT,
  trim TEXT,
  year INTEGER,
  engine_volume TEXT,
  engine_code TEXT,
  engine_type TEXT,
  vin TEXT,
  
  -- Metadata
  created_by UUID REFERENCES profiles(user_id),  -- User tracking
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**When Created:**
- Catalog: Line 1047 in `searchSupabase()` (Session 25 fix)
- Web: Line 1704 in `searchWebExternal()`
- OCR: Line 1845 in `searchOCR()`

**Critical Notes:**
- Session MUST be created BEFORE search (FK dependency)
- `data_source` MUST be English ('catalog', 'web', 'ocr') - Session 26 fix
- `case_id` can be NULL (orphan searches allowed)

---

#### **Table 2: parts_search_results**
**Purpose:** Store search results (batch record per search)

```sql
CREATE TABLE parts_search_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES parts_search_sessions(id) ON DELETE CASCADE,
  
  -- Search parameters (what user searched for)
  plate TEXT,
  make TEXT,
  model TEXT,
  trim TEXT,
  year TEXT,
  engine_volume TEXT,
  engine_code TEXT,
  engine_type TEXT,
  vin TEXT,
  part_family TEXT,
  search_type TEXT,  -- 'simple_search', 'advanced_search'
  data_source TEXT CHECK (data_source IN ('catalog', 'web', 'ocr')),
  
  -- Results data
  search_query JSONB,  -- Full search parameters
  results JSONB,  -- Complete results array (50+ parts with all details)
  response_time_ms INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**When Created:**
- All paths: PiP calls `saveSearchResults()` after displaying results (lines 95-126)

**Critical Notes:**
- PiP saves results (NOT webhook handler) - Session 25 fix
- `results` JSONB stores complete results array
- Individual field columns for query parameters only

---

#### **Table 3: selected_parts**
**Purpose:** Track individual part selections

```sql
CREATE TABLE selected_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_result_id UUID REFERENCES parts_search_results(id),
  
  -- Part identification
  plate TEXT,
  pcode TEXT,  -- Supplier catalog number
  cat_num_desc TEXT,  -- Part description
  oem TEXT,
  part_family TEXT,
  
  -- Pricing & availability
  price NUMERIC,
  supplier_name TEXT,
  source TEXT,  -- 'מקורי', 'תחליפי', 'משומש'
  availability TEXT,  -- Stock status (Session 24 fix)
  location TEXT,  -- Geographic location
  comments TEXT,
  quantity INTEGER DEFAULT 1,
  
  -- Vehicle details (full set, Session 24 addition)
  make TEXT,
  model TEXT,
  trim TEXT,
  year INTEGER,
  engine_volume TEXT,
  engine_code TEXT,
  engine_type TEXT,
  vin TEXT,
  
  -- Metadata
  status TEXT DEFAULT 'selected',
  data_source TEXT CHECK (data_source IN ('catalog', 'web', 'ocr')),
  raw_data JSONB,  -- Complete original part data
  selected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_selected_parts_plate ON selected_parts(plate);
CREATE INDEX idx_selected_parts_pcode ON selected_parts(pcode);
```

**When Created:**
- All paths: User checks checkbox → PiP calls `saveSelectedPart()` (lines 519-628)

**Critical Notes:**
- Duplicate check by `plate + pcode` before insert
- Full vehicle data stored with every part (Session 24)
- Session 24 fix: `availability` field now uses stock status (not location)

---

### 1.4 Sessions 22-26 History

#### **Session 22: Last Stable State**
✅ Catalog search fully functional  
✅ PiP displays catalog results  
✅ Supabase integration working  
✅ Smart sync functional  
✅ Selection counting accurate  
❌ Web search not yet integrated  
❌ OCR search not yet integrated

---

#### **Session 23: Web Search Integration (Breaking Changes)**

**What Was Added:**
- Web search button + Make.com webhook integration
- Webhook response handling (`handleWebhookResponse`)
- Field transformation logic (Hebrew → catalog format)
- Web search PiP display

**What Broke:**
- ❌ Catalog search stopped registering in Supabase
- ❌ Smart sync broken (helper ↔ Supabase)
- ❌ Selection count inaccurate
- ❌ Data source label missing (no badge)
- ❌ Global function `getSelectedParts` not accessible

**Root Causes:**
1. Changed `dataSource` from Hebrew to English without updating DB constraint
2. Removed global function exports needed for smart sync
3. Didn't initialize helper structure before catalog search
4. Modified PiP logic breaking catalog path

---

#### **Session 24: Restoration + Web Improvements**

**What Was Fixed:**
- ✅ Catalog search `dataSource: 'קטלוג'` → `'catalog'` (English)
- ✅ Global function export restored: `window.getSelectedParts`
- ✅ Helper initialization before catalog search
- ✅ Duplicate detection properly rejects (not updates)
- ✅ Smart sync helper initialization on page load
- ✅ Web search field mapping (ALL Hebrew variations)
- ✅ Full vehicle data added to all saves
- ✅ Fixed `availability` vs `location` mapping
- ✅ Fixed helper reuse in webhook handler
- ✅ Smart sync handles deletions

**Field Mapping Enhancements:**
```javascript
// Before (Session 23)
supplier_name: item.supplier_name || 'לא זמין'

// After (Session 24)
supplier_name: item.שם_ספק || item['שם ספק'] || item.ספק || 
               item.supplier_name || item.supplier || 
               item.supplierName || 'לא זמין'
```

**Statistics:**
- 15 tasks completed
- 4 files modified
- ~200 lines changed
- 12 bugs fixed
- 0 breaking changes
- 6 regression fixes

---

#### **Session 25: UUID Fixes + Critical Bugs**

**What Was Fixed:**
- ✅ Catalog search creates Supabase session BEFORE query
- ✅ Web search no longer saves results twice (removed webhook save)
- ✅ UUID detection fixed (36 chars, 5 segments)
- ✅ PiP validates session ID before use

**Critical Issue #1: Missing Catalog Session**
```javascript
// BEFORE (Session 24)
async function searchSupabase() {
  const results = await SimplePartsSearchService.searchParts(payload);
  // NO session creation! ❌
  window.partsResultsPiP.showResults(results, { plate });
}

// AFTER (Session 25)
async function searchSupabase() {
  // Create session FIRST ✅
  const sessionId = await partsSearchSupabaseService.createSearchSession(
    plate, 
    { searchParams: payload, dataSource: 'catalog' }
  );
  window.currentSearchSessionId = sessionId;
  
  const results = await SimplePartsSearchService.searchParts(payload);
  window.partsResultsPiP.showResults(results, { 
    plate, 
    sessionId  // Pass UUID to PiP ✅
  });
}
```

**Critical Issue #2: Duplicate Result Records**
```javascript
// BEFORE (Session 24)
async function handleWebhookResponse(webhookData, dataSource) {
  // ... transform results ...
  
  // SAVE #1: Webhook handler ❌
  await partsSearchSupabaseService.saveSearchResults(
    window.currentSearchSessionId, 
    flatResults
  );
  
  // Display in PiP
  await window.partsResultsPiP.showResults(transformedResults);
  // SAVE #2: PiP also saves results ❌ DUPLICATE!
}

// AFTER (Session 25)
async function handleWebhookResponse(webhookData, dataSource) {
  // ... transform results ...
  
  // NO SAVE HERE ✅ - PiP will save
  
  // Display in PiP
  await window.partsResultsPiP.showResults(transformedResults);
  // PiP saves results ✅ (only once)
}
```

**Critical Issue #3: UUID Detection**
```javascript
// BEFORE (Session 24)
if (partId.includes('-')) {
  // Assumes UUID
  query = query.eq('id', partId);
} else {
  // Assumes catalog code
  query = query.eq('plate', plate).eq('pcode', partId);
}
// PROBLEM: "PK-8544RGS" has dash → detected as UUID ❌

// AFTER (Session 25)
const isUUID = partId.length === 36 && partId.split('-').length === 5;
if (isUUID) {
  query = query.eq('id', partId);
} else {
  query = query.eq('plate', plate).eq('pcode', partId);
}
// CORRECT: Only true UUIDs detected ✅
```

**Remaining Problems (Passed to Session 26):**
1. Catalog search double session (not resolved)
2. Web search raw webhook overwriting (fixed in Session 26)

---

#### **Session 26: OCR Integration + Final Fixes**

**What Was Added:**
- ✅ OCR search button + searchOCR() function
- ✅ Image compression (1920x1920, quality 0.7)
- ✅ OCR arrays in helper (`ocr_results[]`, `web_search_results[]`)
- ✅ Result routing by dataSource (web vs OCR)
- ✅ Vehicle data in OCR webhook payload

**What Was Fixed:**
- ✅ Web search webhook appending (window.helper priority)
- ✅ All `dataSource` values migrated to English
- ✅ OCR event listener conflict removed
- ✅ Base64 cleanup (strip prefix)

**Database Constraint Migration:**
```javascript
// BEFORE (Session 25 - Hebrew)
data_source: 'קטלוג' | 'אינטרנט' | 'אחר'  ❌ DB constraint violation

// AFTER (Session 26 - English)
data_source: 'catalog' | 'web' | 'ocr'  ✅ Matches DB constraint
```

**Helper Structure Enhancement:**
```javascript
// BEFORE (Session 25)
helper.parts_search = {
  results: [],  // Mixed catalog/web results
  raw_webhook_data: []  // Web webhooks
};

// AFTER (Session 26)
helper.parts_search = {
  results: [],                // Generic (all paths)
  web_search_results: [],     // Web-specific ✅
  ocr_results: [],            // OCR-specific ✅
  raw_webhook_data: []        // Both web & OCR
};
```

**What's Still Broken:**
- ❌ OCR Make.com webhook returns 500 error
- ⚠️ Catalog double session (logs added, not tested)

**Session 26 OCR Issues:**
1. Make.com Vision API mapping wrong: `{{1.file.data}}` should be `{{1.file_data}}`
2. Payload too large (5MB even after compression)
3. Webhook receives data but processing fails

---

#### **Session 27: OCR Webhook Fixes (This Session)**

**What Was Done:**
- ✅ Documented Make.com Vision API fix (`{{1.file_data}}`)
- ✅ Removed hardcoded webhook URL
- ✅ Updated field transformation priority (webhook over form for OCR)
- ✅ Created comprehensive field mapping documentation
- ❌ Did NOT test OCR end-to-end (Make.com fix needed)
- ❌ Did NOT fix PiP display (fields still empty)

**Critical Discovery:**
OCR webhook uses `description` field, NOT `cat_num_desc`!

This is why PiP shows empty values - the field mapping fallback chain has `description` LAST, but OCR sends it FIRST.

---

## PART 2: THE ACTUAL PROBLEM (Session 27 → 28)

### 2.1 OCR Response Structure (Confirmed)

User provided actual OCR webhook response:
```json
[
  {
    "plate": "221-84-003",
    "model": "רנו סניק 2020",
    "model_description": "תצורה: מיניוואן, מס' דלתות: 4 דלתות, סוג דלת תא מטען: דלת תא מטען מתרוממת, סוג תיבת הילוכים: תיבת הילוכים מצמד כפול, נפח מנוע: 1330 cc, סוג דגם: Grand Scenic",
    "supplier_name": "",
    "pcode": "1908210",
    "part_family": "חלקי מרכב",
    "description": "מכסה מנוע",  ← KEY FIELD!
    "price": 1006.99,
    "quantity": 1,
    "make": "רנו",
    "year": 2020,
    "oem": "",
    "availability": "",
    "source": "תחליפי",
    "location": ""
  },
  {
    "plate": "221-84-003",
    "model": "רנו סניק 2020",
    "model_description": "תצורה: מיניוואן...",
    "pcode": "RE631009903R",
    "part_family": "חלקי מרכב",
    "description": "כנף קידמית ימ'",  ← KEY FIELD!
    "price": 1515.45,
    "quantity": 1,
    "make": "רנו",
    "year": 2020,
    "oem": "RE631009903R",
    "source": "מקורי"
  }
]
```

### 2.2 Field Name Comparison

| Field | Catalog Search | Web Search | OCR Search |
|-------|---------------|------------|------------|
| Description | `cat_num_desc` | `cat_num_desc` or Hebrew variations | **`description`** ← Different! |
| Model | `model` | `model` or Hebrew variations | `model` ✅ |
| Model Description | N/A | N/A | **`model_description`** ← NEW! |
| Part Family | `part_family` | `part_family` or Hebrew variations | `part_family` ✅ |
| Source | `source` or `availability` | Hebrew variations | `source` ✅ |
| Make | `make` | `make` or Hebrew variations | `make` ✅ |
| Year | `year` | `year` or Hebrew variations | `year` ✅ |
| Quantity | 1 (implicit) | 1 (implicit) | **`quantity`** ← Explicit! |

**Key Differences:**
1. OCR uses `description` instead of `cat_num_desc`
2. OCR adds `model_description` (long text field)
3. OCR includes explicit `quantity` field
4. OCR `supplier_name` often empty (parts from OCR'd invoices)

---

### 2.3 Current Transformation Code (Session 27)

**File:** `parts search.html` lines 1492-1565

**Current Fallback Chain:**
```javascript
cat_num_desc: item.cat_num_desc || item.תיאור_חלק || item['תיאור חלק'] || 
              item.part_description || item.description || item.partDescription || 
              item.תיאור || 'לא זמין',
```

**Problem:** `description` is 5th in the chain!

**For OCR results:**
- `item.cat_num_desc` → undefined ❌
- `item.תיאור_חלק` → undefined ❌
- `item['תיאור חלק']` → undefined ❌
- `item.part_description` → undefined ❌
- `item.description` → "מכסה מנוע" ✅ (finally found!)

**But PiP shows empty because the field is being evaluated wrong somewhere!**

---

### 2.4 PiP Display Code (Current)

**File:** `parts-search-results-pip.js` lines 328-360

```javascript
generateResultsTableHTML() {
  const tableRows = this.searchResults.map((item, index) => {
    const partFamily = item.part_family || 'לא מוגדר';  // Line 337
    
    return `
      <td class="col-description">${item.cat_num_desc || 'לא זמין'}</td>  // Line 352
      <td class="col-family">${partFamily}</td>  // Line 353
      <td class="col-type">${item.availability || 'מקורי'}</td>  // Line 356
    `;
  });
}
```

**Problem:** PiP directly reads `item.cat_num_desc` but OCR has `item.description`!

**Why didn't Session 27 fix work?**
The transformation DOES map `description` to `cat_num_desc`, but it's last in the chain. If ANY earlier field exists (even as empty string `""`), it takes precedence!

---

### 2.5 OCR Subtitle Requirements (NEW)

**Current Behavior (ALL paths):**
```
חיפוש חלקים - 2 תוצאות
```

**Required OCR Behavior:**
```
2 חלקים • רנו סניק 2020 • תצורה: מיניוואן, מס' דלתות: 4 דלתות...
```

**Why Different?**
- Catalog/Web: User searches for specific part → subtitle shows what they searched for
- OCR: System extracts multiple parts from one file → subtitle shows what was found

**Data Source:**
- Catalog/Web: Form input data
- OCR: First result from webhook (`results[0].model`, `results[0].model_description`)

---

## PART 3: THE FIX PLAN (Session 28)

### TASK 1: Fix OCR Field Mapping Priority

#### Problem:
`description` field is last in fallback chain, causing PiP to show empty values

#### Solution:
Move `description` to FIRST position in chain for OCR path

#### Code Change:
**File:** `parts search.html` line ~1514

**Current:**
```javascript
cat_num_desc: item.cat_num_desc || item.תיאור_חלק || item['תיאור חלק'] || 
              item.part_description || item.description || item.partDescription || 
              item.תיאור || 'לא זמין',
```

**New:**
```javascript
// SESSION 28: OCR uses 'description' first, catalog/web use 'cat_num_desc' first
cat_num_desc: item.description || item.cat_num_desc || item.תיאור_חלק || 
              item['תיאור חלק'] || item.part_description || 
              item.partDescription || item.תיאור || 'לא זמין',
```

**Impact Analysis:**
- ✅ OCR: Will find `description` immediately
- ✅ Catalog: `description` doesn't exist, falls back to `cat_num_desc` (2nd position)
- ✅ Web: `description` may or may not exist, falls back to `cat_num_desc` if not

**Risk:** VERY LOW (just reordering fallback chain)

---

### TASK 2: Add OCR-Specific Fields to Transformation

#### Problem:
OCR sends `model_description` and explicit `quantity`, but transformation doesn't capture them

#### Solution:
Add new fields after line 1541

#### Code Change:
**File:** `parts search.html` after line 1541

**Add:**
```javascript
// SESSION 28: OCR-specific fields
model_description: item.model_description || item.תיאור_דגם || '',
quantity: item.quantity || 1,  // OCR explicit, catalog/web implicit
```

**Impact Analysis:**
- ✅ OCR: Captures long vehicle description text
- ✅ OCR: Captures per-part quantity
- ✅ Catalog/Web: Fields will be empty string or 1 (no impact)

**Risk:** NONE (new fields, no overwrites)

---

### TASK 3: Fix OCR PiP Subtitle

#### Problem:
OCR subtitle shows form data (like catalog/web), but should show OCR results data

#### Solution:
Add conditional logic to generate OCR-specific subtitle

#### Code Change:
**File:** `parts-search-results-pip.js` lines ~246-254

**Current:**
```javascript
generatePiPHTML() {
  const sourceBadge = this.getSourceBadge(this.currentSearchContext);
  const subtitle = `חיפוש חלקים - ${this.searchResults.length} תוצאות`;
  
  return `
    <div class="pip-header">
      <h3>${sourceBadge}</h3>
      <p class="pip-subtitle">${subtitle}</p>
    </div>
    ...
  `;
}
```

**New:**
```javascript
generatePiPHTML() {
  const sourceBadge = this.getSourceBadge(this.currentSearchContext);
  let subtitle;
  
  // SESSION 28: OCR path uses results data for subtitle, not form data
  if (this.currentSearchContext.dataSource === 'ocr' && this.searchResults.length > 0) {
    const firstResult = this.searchResults[0];
    const count = this.searchResults.length;
    const model = firstResult.model || 'לא מוגדר';
    const modelDesc = firstResult.model_description || '';
    
    subtitle = `${count} חלקים • ${model}`;
    if (modelDesc && modelDesc.length > 0) {
      // Truncate if too long
      const truncatedDesc = modelDesc.length > 100 
        ? modelDesc.substring(0, 100) + '...' 
        : modelDesc;
      subtitle += ` • ${truncatedDesc}`;
    }
  } else {
    // Catalog/Web: use existing logic (form-based)
    subtitle = `חיפוש חלקים - ${this.searchResults.length} תוצאות`;
  }
  
  return `
    <div class="pip-header">
      <h3>${sourceBadge}</h3>
      <p class="pip-subtitle">${subtitle}</p>
    </div>
    ...
  `;
}
```

**Impact Analysis:**
- ✅ OCR: Subtitle shows "2 חלקים • רנו סניק 2020 • תצורה: מיניוואן..."
- ✅ Catalog/Web: Subtitle unchanged ("חיפוש חלקים - 5 תוצאות")
- ✅ Conditional protects existing paths

**Risk:** LOW (isolated conditional, no shared logic)

---

### TASK 4: Verify Supabase Integration

#### Purpose:
Confirm all 3 paths correctly save to Supabase after Session 27 changes

#### Test Procedure:

**Step 1: Test Catalog Search**
```
1. Open browser console
2. Clear Supabase tables (optional, for clean test)
3. Fill vehicle form (plate, make, model, year)
4. Click "חפש במאגר הנתונים"
5. Check console for:
   ✅ "SESSION 25: Search session created: [UUID]"
   ✅ "SESSION 9 TASK 3: Search results saved: [UUID]"
6. Open Supabase dashboard
7. Verify parts_search_sessions:
   - id = UUID
   - data_source = 'catalog'
   - plate = entered plate
   - make, model, year populated
8. Verify parts_search_results:
   - session_id = matching UUID
   - results JSONB has array of parts
   - data_source = 'catalog'
9. Select a part (checkbox)
10. Verify selected_parts:
    - search_result_id = matching UUID
    - pcode, cat_num_desc populated
    - data_source = 'catalog'
```

**Expected Outcome:** All 3 tables populated, no errors

**Step 2: Test Web Search**
```
1. Open browser console
2. Fill vehicle form
3. Click "חפש במערכת חיצונית"
4. Wait for webhook response
5. Check console for:
   ✅ "SESSION 26: Web result appended"
   ✅ "PiP displayed with transformed webhook results"
6. Open Supabase dashboard
7. Verify parts_search_sessions:
   - data_source = 'web'
8. Verify parts_search_results:
   - data_source = 'web'
   - results JSONB has webhook results
9. Select a part
10. Verify selected_parts:
    - data_source = 'web'
```

**Expected Outcome:** All 3 tables populated, no errors

**Step 3: Test OCR Search (After Tasks 1-3 Complete)**
```
1. Open browser console
2. Upload test invoice/image
3. Click "שלח תוצאת חיפוש לניתוח"
4. Wait for webhook response (or 500 error if Make.com still broken)
5. Check console for:
   ✅ "SESSION 26: OCR result appended"
   ✅ "PiP displayed with transformed webhook results"
6. Open Supabase dashboard
7. Verify parts_search_sessions:
   - data_source = 'ocr'  ← English!
8. Verify parts_search_results:
   - data_source = 'ocr'
   - results JSONB has OCR parts
9. Select a part
10. Verify selected_parts:
    - data_source = 'ocr'
    - pcode, cat_num_desc (from description field!)
```

**Expected Outcome:** All 3 tables populated, no errors

**Step 4: Check for Errors**
```
Common errors to look for:
❌ "invalid input syntax for type uuid"
   → Session ID is string, not UUID
   → Check session creation call

❌ "violates check constraint"
   → dataSource is Hebrew, not English
   → Check transformation code

❌ "duplicate key value violates unique constraint"
   → Part already selected
   → Normal behavior (expected)

❌ "column does not exist"
   → Field name mismatch
   → Check table schema vs code

❌ "null value in column violates not-null constraint"
   → Required field missing
   → Check session creation payload
```

---

### TASK 5: Create Session 28 Documentation

#### Purpose:
Document all changes for Session 29 continuation

#### Document Structure:

**File:** `SESSION_28_EXECUTION_REPORT.md`

**Sections:**
1. **Session 28 Summary**
   - What was attempted
   - What succeeded
   - What failed
   - Metrics (files changed, lines modified)

2. **OCR Response Structure**
   - Confirmed field names
   - Sample data
   - Field comparison table (catalog vs web vs OCR)

3. **Task 1 Report: Field Mapping**
   - Code change made
   - Before/after comparison
   - Test results
   - Impact on catalog/web paths

4. **Task 2 Report: New Fields**
   - Fields added
   - Rationale
   - Usage in PiP

5. **Task 3 Report: Subtitle Logic**
   - Code change made
   - Before/after screenshots
   - Conditional logic explanation

6. **Task 4 Report: Supabase Verification**
   - Catalog search test results
   - Web search test results
   - OCR search test results
   - Console logs
   - Database screenshots

7. **Remaining Issues**
   - What's still broken
   - Why it's broken
   - Proposed solutions

8. **Session 29 Tasks**
   - Next steps
   - Priority order
   - Dependencies

---

### TASK 6: Testing Checklist

#### OCR Path Tests (After Tasks 1-3)

**PiP Display:**
- [ ] Description field populated (not "לא זמין")
- [ ] Part family populated (not "לא מוגדר")
- [ ] Model populated with OCR value (not form value)
- [ ] Year populated with OCR value (not form value)
- [ ] Source populated ("מקורי"/"תחליפי")
- [ ] Price formatted correctly (₪1,006.99)
- [ ] Catalog number (pcode) displayed

**PiP Subtitle:**
- [ ] Shows part count (e.g., "2 חלקים")
- [ ] Shows model from OCR (e.g., "רנו סניק 2020")
- [ ] Shows model description (truncated if > 100 chars)
- [ ] NOT showing form input data

**Helper Structure:**
- [ ] helper.parts_search.ocr_results[] has results
- [ ] helper.parts_search.raw_webhook_data[] has webhook
- [ ] helper.parts_search.results[] has results (backward compat)
- [ ] All arrays preserved (no overwrites)

**Supabase:**
- [ ] parts_search_sessions record exists
- [ ] data_source = 'ocr' (English, not 'אחר')
- [ ] plate, make, model, year populated
- [ ] parts_search_results record exists
- [ ] results JSONB contains array
- [ ] selected_parts records created on checkbox
- [ ] FK chain intact (session → results → selected)

**Console:**
- [ ] No UUID errors
- [ ] No constraint violation errors
- [ ] No field name errors
- [ ] Session 28 logs visible

---

#### Catalog Path Tests (MUST NOT BREAK!)

**PiP Display:**
- [ ] All fields display correctly
- [ ] Subtitle shows "חיפוש חלקים - X תוצאות"
- [ ] Green "קטלוג" badge visible
- [ ] Selection count accurate

**Supabase:**
- [ ] All 3 tables populated correctly
- [ ] data_source = 'catalog'
- [ ] No regressions from Session 28 changes

**Console:**
- [ ] No new errors introduced
- [ ] Session creation logs visible

---

#### Web Path Tests (MUST NOT BREAK!)

**PiP Display:**
- [ ] All fields display correctly
- [ ] Subtitle shows "חיפוש חלקים - X תוצאות"
- [ ] Blue "אינטרנט" badge visible
- [ ] Selection count accurate

**Supabase:**
- [ ] All 3 tables populated correctly
- [ ] data_source = 'web'
- [ ] No regressions from Session 28 changes

**Helper:**
- [ ] helper.parts_search.web_search_results[] appends (not overwrites)
- [ ] raw_webhook_data[] preserves all webhooks

**Console:**
- [ ] No new errors introduced
- [ ] Webhook appending logs visible

---

## PART 4: IMPLEMENTATION DETAILS

### 4.1 File Changes Summary

**File 1: parts search.html**
- **Location:** Lines 1514-1516, 1541
- **Changes:** 2
- **Lines Modified:** ~5

**Change 1 (Line 1514):**
```javascript
// BEFORE
cat_num_desc: item.cat_num_desc || item.תיאור_חלק || item['תיאור חלק'] || 
              item.part_description || item.description || item.partDescription || 
              item.תיאור || 'לא זמין',

// AFTER (SESSION 28)
cat_num_desc: item.description || item.cat_num_desc || item.תיאור_חלק || 
              item['תיאור חלק'] || item.part_description || 
              item.partDescription || item.תיאור || 'לא זמין',
```

**Change 2 (After Line 1541):**
```javascript
// ADD
// SESSION 28: OCR-specific fields
model_description: item.model_description || item.תיאור_דגם || '',
quantity: item.quantity || 1,
```

---

**File 2: parts-search-results-pip.js**
- **Location:** Lines 246-254
- **Changes:** 1
- **Lines Added:** ~15

**Change (Lines 246-254):**
```javascript
// BEFORE
generatePiPHTML() {
  const sourceBadge = this.getSourceBadge(this.currentSearchContext);
  const subtitle = `חיפוש חלקים - ${this.searchResults.length} תוצאות`;
  
  return `
    <div class="pip-header">
      <h3>${sourceBadge}</h3>
      <p class="pip-subtitle">${subtitle}</p>
    </div>
    ...
  `;
}

// AFTER (SESSION 28)
generatePiPHTML() {
  const sourceBadge = this.getSourceBadge(this.currentSearchContext);
  let subtitle;
  
  // SESSION 28: OCR path uses results data for subtitle, not form data
  if (this.currentSearchContext.dataSource === 'ocr' && this.searchResults.length > 0) {
    const firstResult = this.searchResults[0];
    const count = this.searchResults.length;
    const model = firstResult.model || 'לא מוגדר';
    const modelDesc = firstResult.model_description || '';
    
    subtitle = `${count} חלקים • ${model}`;
    if (modelDesc && modelDesc.length > 0) {
      const truncatedDesc = modelDesc.length > 100 
        ? modelDesc.substring(0, 100) + '...' 
        : modelDesc;
      subtitle += ` • ${truncatedDesc}`;
    }
  } else {
    // Catalog/Web: use existing logic (form-based)
    subtitle = `חיפוש חלקים - ${this.searchResults.length} תוצאות`;
  }
  
  return `
    <div class="pip-header">
      <h3>${sourceBadge}</h3>
      <p class="pip-subtitle">${subtitle}</p>
    </div>
    ...
  `;
}
```

---

### 4.2 Change Impact Matrix

| Change | Catalog Impact | Web Impact | OCR Impact | Risk Level |
|--------|---------------|------------|------------|------------|
| Move `description` to front | None (field doesn't exist) | None (falls back to cat_num_desc) | ✅ Fixes display | LOW |
| Add `model_description` | None (new field) | None (new field) | ✅ Captures data | NONE |
| Add `quantity` field | None (defaults to 1) | None (defaults to 1) | ✅ Captures data | NONE |
| OCR subtitle logic | None (conditional skip) | None (conditional skip) | ✅ Shows OCR data | LOW |

**Total Risk:** LOW (all changes are isolated or additive)

---

### 4.3 Protection Strategy

**Principle:** Use conditionals to isolate OCR changes from catalog/web logic

**Pattern:**
```javascript
if (dataSource === 'ocr') {
  // OCR-specific logic
} else {
  // Existing catalog/web logic (UNCHANGED)
}
```

**Application:**
1. **Field mapping:** Reorder fallback chain (affects all, but safe due to fallback nature)
2. **Subtitle logic:** Conditional check before generating subtitle (isolated)
3. **New fields:** Additive only, no overwrites (safe)

**Safety Checks:**
- ✅ No changes to catalog search flow
- ✅ No changes to web search flow (except safer field order)
- ✅ No changes to shared PiP table generation
- ✅ No changes to helper structure
- ✅ No changes to Supabase tables
- ✅ No changes to selection logic
- ✅ No changes to duplicate detection

---

## PART 5: REMAINING ISSUES & SESSION 29 PLAN

### 5.1 Known Issues After Session 28

#### Issue 1: OCR Make.com Webhook 500 Error
**Status:** Unresolved (Session 26-28)  
**Symptom:** Webhook returns HTTP 500 Internal Server Error  
**Possible Causes:**
1. Vision API field mapping still wrong in Make.com
2. Payload too large even after compression
3. Make.com scenario misconfigured
4. Google Vision API quota exceeded
5. API key issue

**Session 29 Solutions:**
- **Option A:** Cloud Storage Approach
  - Upload image to Google Drive
  - Send Drive URL to webhook (not base64)
  - Make.com downloads from Drive
  - Reduces payload size to ~100 bytes
  
- **Option B:** Fix Current Webhook
  - Check Make.com execution logs
  - Verify Vision API module configuration
  - Test with smaller image (500KB)
  
- **Option C:** Alternative OCR Service
  - Use Tesseract.js (client-side OCR)
  - Use different cloud OCR API
  - Pros: More control
  - Cons: May be less accurate

---

#### Issue 2: Catalog Double Session
**Status:** Logged but not tested (Session 25-28)  
**Symptom:** Two `parts_search_sessions` records created per catalog search  
**Possible Causes:**
1. Session creation called twice in catalog flow
2. PiP creating duplicate session
3. Smart sync triggering session creation

**Session 29 Investigation:**
- Run catalog search with Session 26+ logs enabled
- Trace session creation call stack
- Check if `createSearchSession()` called twice

---

#### Issue 3: Helper Structure Complexity
**Status:** Accepted (not critical)  
**Symptom:** Multiple arrays for similar data  
**Impact:** Confusion, larger memory footprint  
**Current Structure:**
```javascript
helper.parts_search = {
  results: [],              // Generic
  web_search_results: [],   // Web-specific
  ocr_results: [],          // OCR-specific
  current_selected_list: [], // Current search
  selected_parts: [],       // Cumulative
  raw_webhook_data: []      // Web & OCR raw
}
```

**Session 29 Refactor (Optional):**
```javascript
helper.parts_search = {
  sessions: {
    catalog: [],
    web: [],
    ocr: []
  },
  selections: {
    current: [],
    saved: []
  },
  raw_data: []
}
```

**Risk:** HIGH (major refactor)  
**Priority:** LOW (cosmetic improvement)

---

### 5.2 Session 29 Task List

#### Phase 1: Verify Session 28 Changes (High Priority)
1. [ ] Test catalog search (no regressions)
2. [ ] Test web search (no regressions)
3. [ ] Test OCR search (with fixed PiP display)
4. [ ] Verify Supabase integration (all 3 paths)
5. [ ] Document test results

#### Phase 2: Fix OCR Make.com Webhook (High Priority)
1. [ ] Check Make.com execution history for 500 errors
2. [ ] Verify Vision API field mapping: `{{1.file_data}}`
3. [ ] Test with smaller image (500KB test file)
4. [ ] If still broken, implement cloud storage approach
5. [ ] Document solution for future reference

#### Phase 3: Investigate Catalog Double Session (Medium Priority)
1. [ ] Run catalog search with debugging logs
2. [ ] Trace session creation call stack
3. [ ] Fix if duplicate calls found
4. [ ] Verify fix doesn't break FK chain

#### Phase 4: Cleanup & Enhancement (Low Priority)
1. [ ] Update old console.log prefixes for consistency
2. [ ] Consider helper structure refactor (if time allows)
3. [ ] Add integration tests to prevent future regressions
4. [ ] Create architecture diagram for documentation

#### Phase 5: User Experience Improvements (Low Priority)
1. [ ] Add OCR progress indicator (upload, compress, OCR, match)
2. [ ] Add OCR result preview before PiP display
3. [ ] Add batch OCR processing (multiple files)
4. [ ] Improve error messages (Hebrew translations)

---

### 5.3 Success Criteria for Session 29

#### Must Have (Critical):
- ✅ OCR Make.com webhook returns results (not 500)
- ✅ OCR end-to-end flow works (upload → OCR → PiP → Supabase)
- ✅ All 3 paths working without regressions

#### Should Have (Important):
- ✅ Catalog double session issue resolved
- ✅ Comprehensive test coverage documented
- ✅ Architecture diagram created

#### Nice to Have (Optional):
- ⚪ Helper structure refactored
- ⚪ Old console.log prefixes updated
- ⚪ Integration tests added
- ⚪ UX improvements implemented

---

## PART 6: EXECUTION CHECKLIST

### Pre-Execution Checks
- [ ] Backup current code (git commit before changes)
- [ ] Browser console open for logging
- [ ] Supabase dashboard open for verification
- [ ] Test files ready (invoice images for OCR)
- [ ] Documentation file created (SESSION_28_EXECUTION_REPORT.md)

### Task 1: Fix Field Mapping
- [ ] Open `parts search.html`
- [ ] Navigate to line ~1514
- [ ] Move `item.description` to first position
- [ ] Save file
- [ ] Refresh browser (hard refresh)
- [ ] Test OCR search
- [ ] Verify description field displays

### Task 2: Add New Fields
- [ ] Open `parts search.html`
- [ ] Navigate to line ~1541
- [ ] Add `model_description` and `quantity` fields
- [ ] Save file
- [ ] Refresh browser
- [ ] Test OCR search
- [ ] Verify new fields captured in console

### Task 3: Fix Subtitle Logic
- [ ] Open `parts-search-results-pip.js`
- [ ] Navigate to lines ~246-254
- [ ] Add OCR conditional subtitle logic
- [ ] Save file
- [ ] Refresh browser
- [ ] Test OCR search
- [ ] Verify subtitle shows OCR data

### Task 4: Verify Supabase
- [ ] Test catalog search
- [ ] Check all 3 Supabase tables
- [ ] Document results
- [ ] Test web search
- [ ] Check all 3 Supabase tables
- [ ] Document results
- [ ] Test OCR search
- [ ] Check all 3 Supabase tables
- [ ] Document results

### Task 5: Create Documentation
- [ ] Fill in SESSION_28_EXECUTION_REPORT.md
- [ ] Add screenshots of PiP display
- [ ] Add screenshots of Supabase tables
- [ ] Document console logs
- [ ] List remaining issues
- [ ] Create Session 29 task list

### Task 6: Testing
- [ ] Complete OCR path checklist
- [ ] Complete catalog path checklist
- [ ] Complete web path checklist
- [ ] Document any failures
- [ ] Create bug reports for issues found

### Post-Execution
- [ ] Git commit with message: "SESSION 28: Fix OCR PiP display and subtitle"
- [ ] Create git tag: `session-28-complete`
- [ ] Update CLAUDE.md with session notes
- [ ] Prepare todo.md for Session 29

---

## APPENDIX A: Code Reference

### A.1 Key File Locations

| File | Path | Lines | Purpose |
|------|------|-------|---------|
| Parts Search HTML | `parts search.html` | 1-2700+ | Main search page, all 3 paths |
| PiP Component | `parts-search-results-pip.js` | 1-800+ | Results display popup |
| Supabase Service | `partsSearchSupabaseService.js` | 1-473 | Database operations |
| Webhook Config | `webhook.js` | 1-968 | Webhook URLs and handlers |
| Helper Functions | `helper.js` | 1-? | Helper object management |

### A.2 Function Call Stack

**Catalog Search:**
```
searchSupabase()
  → partsSearchSupabaseService.createSearchSession()
  → SimplePartsSearchService.searchParts()
  → partsResultsPiP.showResults()
    → partsSearchSupabaseService.saveSearchResults()
    → [User clicks checkbox]
    → partsResultsPiP.saveSelectedPart()
      → partsSearchSupabaseService.saveSelectedPart()
```

**Web Search:**
```
searchWebExternal()
  → partsSearchSupabaseService.createSearchSession()
  → sendPartSearch() [webhook.js]
  → [Make.com processes]
  → handleWebhookResponse('web')
    → Transform fields
    → Update helper arrays
    → partsResultsPiP.showResults()
      → partsSearchSupabaseService.saveSearchResults()
      → [User clicks checkbox]
      → partsResultsPiP.saveSelectedPart()
        → partsSearchSupabaseService.saveSelectedPart()
```

**OCR Search:**
```
searchOCR()
  → Validate file
  → Compress image
  → partsSearchSupabaseService.createSearchSession()
  → fetch(WEBHOOKS.INTERNAL_PARTS_OCR)
  → [Make.com Vision API OCR]
  → handleWebhookResponse('ocr')
    → Transform fields
    → Update helper arrays
    → partsResultsPiP.showResults()
      → partsSearchSupabaseService.saveSearchResults()
      → [User clicks checkbox]
      → partsResultsPiP.saveSelectedPart()
        → partsSearchSupabaseService.saveSelectedPart()
```

---

## APPENDIX B: Testing Data

### B.1 Test Vehicle Data
```javascript
{
  plate: '221-84-003',
  manufacturer: 'רנו',
  model: 'גרנד סניק',
  year: 2020,
  engine_volume: '1330',
  engine_code: 'K9K',
  engine_type: 'דיזל'
}
```

### B.2 Expected OCR Response
```json
[
  {
    "plate": "221-84-003",
    "model": "רנו סניק 2020",
    "model_description": "תצורה: מיניוואן...",
    "pcode": "1908210",
    "part_family": "חלקי מרכב",
    "description": "מכסה מנוע",
    "price": 1006.99,
    "quantity": 1,
    "make": "רנו",
    "year": 2020,
    "source": "תחליפי"
  }
]
```

### B.3 Expected PiP Display (OCR)

**Subtitle:**
```
1 חלקים • רנו סניק 2020 • תצורה: מיניוואן, מס' דלתות: 4 דלתות, סוג דלת תא מטען: דלת תא מטען מתרוממת...
```

**Result Card:**
```
□ [Checkbox]

מכסה מנוע
קוד קטלוגי: 1908210
משפחת חלק: חלקי מרכב
דגם: רנו סניק 2020
שנה: 2020
מחיר: ₪1,006.99
סוג: תחליפי
```

---

## APPENDIX C: Console Log Reference

### C.1 Session 28 New Logs

**Field Mapping:**
```
🔍 SESSION 27: Data source is: ocr
📋 First webhook item keys: [array of keys]
📋 First webhook item sample: {object}
```

**Subtitle Generation:**
```
📝 SESSION 28: Generating OCR-specific subtitle
  - Count: 2
  - Model: רנו סניק 2020
  - Description: תצורה: מיניוואן...
```

### C.2 Existing Important Logs

**Session Creation:**
```
✅ SESSION 11: Search session created: [UUID]
```

**Results Save:**
```
✅ SESSION 9 TASK 3: Search results saved: [UUID]
```

**Webhook Response:**
```
📥 SESSION 23: Processing webhook response
📦 Received [N] results from webhook
🔄 Transformed [N] results to catalog format
```

**PiP Display:**
```
📋 Showing PiP results: [N] items
✅ PiP displayed with transformed webhook results
```

**Selection:**
```
✅ SESSION 11: Selected part saved: [UUID]
```

---

## END OF SESSION 28 MASTER PLAN

**Next Steps:**
1. Execute Task 1-3 (code changes)
2. Execute Task 4 (Supabase verification)
3. Execute Task 5-6 (documentation and testing)
4. Create SESSION_28_EXECUTION_REPORT.md
5. Prepare for Session 29

**Estimated Time:** 2-3 hours  
**Files Modified:** 2  
**Lines Changed:** ~20-25  
**Risk Level:** LOW  
**Breaking Changes:** NONE (protected by conditionals)

**SUCCESS CRITERIA:**
- ✅ OCR PiP displays all fields correctly
- ✅ OCR subtitle shows count + model + description
- ✅ Catalog and web paths still work (no regressions)
- ✅ All 3 paths save to Supabase correctly

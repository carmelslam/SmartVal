# SESSION 9 - SAVE SEARCH RESULTS & SELECTED PARTS TO SUPABASE
**Date**: October 6, 2025  
**Status**: PLANNING COMPLETE - Ready for Implementation  
**Priority**: HIGH - Core functionality needed

---

## CONTEXT

User needs search results and selected parts saved to Supabase tables. Currently, everything is only in memory (`selectedParts[]` array) and helper.js. When user refreshes page, selections are lost unless saved to helper.

---

## TASK OVERVIEW

When user searches for parts:
1. **Save search session** to `parts_search_sessions` table (per plate number)
2. **Save all search results** to `parts_search_results` table
3. When user **checks a checkbox**, save to `selected_parts` table
4. **Sync with helper.parts_search.selected_parts**
5. Load selected parts from Supabase on page load

---

## FILES TO WORK WITH

### NEW FILES TO CREATE:
1. `/services/partsSearchSupabaseService.js` - Service for all Supabase operations
2. `/supabase/sql/Phase5_Parts_Search_2025-10-05/CREATE_PARTS_SEARCH_TABLES_2025-10-06.sql` - Verify tables exist

### FILES TO EDIT (MINIMAL CHANGES ONLY):
1. `/parts-search-results-pip.js` - Add session save in `showResults()` method
2. `/parts-search-results-pip.js` - Add checkbox handler to save selected parts
3. `/parts search.html` - Add Supabase sync after helper save (line ~1617)
4. `/selected-parts-list.js` - Fix table name and loading

---

## SUPABASE TABLES (from SUPABASE_MIGRATION_PROJECT.md lines 187-204)

```sql
CREATE TABLE parts_search_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id),
  plate TEXT NOT NULL,
  search_context JSONB,
  created_by UUID REFERENCES profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE parts_search_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES parts_search_sessions(id),
  supplier TEXT,
  search_query JSONB,
  results JSONB,
  response_time_ms INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Need to check if selected_parts table exists, or create it similar to parts_required table
```

---

## IMPLEMENTATION STEPS

### STEP 1: Create SQL to Verify Tables
**File**: `CREATE_PARTS_SEARCH_TABLES_2025-10-06.sql`

```sql
-- Check if tables exist, create if not
-- Verify parts_search_sessions
-- Verify parts_search_results  
-- Create selected_parts if doesn't exist (model after parts_required)
```

### STEP 2: Create Supabase Service
**File**: `/services/partsSearchSupabaseService.js`

**Functions needed:**
```javascript
class PartsSearchSupabaseService {
  async createSearchSession(plateNumber, searchContext) {
    // INSERT into parts_search_sessions
    // RETURN session_id
  }
  
  async saveSearchResults(sessionId, results) {
    // INSERT into parts_search_results
    // Save entire results array as JSONB
  }
  
  async saveSelectedPart(plateNumber, partData) {
    // INSERT into selected_parts
    // Check for duplicates first
  }
  
  async getSelectedParts(plateNumber) {
    // SELECT from selected_parts WHERE plate = plateNumber
  }
  
  async deleteSelectedPart(partId) {
    // DELETE from selected_parts
  }
}
```

### STEP 3: Integrate with PiP Results
**File**: `/parts-search-results-pip.js`

**Location**: Line ~27-44 in `showResults()` method

**Add after line 34:**
```javascript
// Save search session to Supabase
if (this.currentPlateNumber) {
  const searchService = new PartsSearchSupabaseService();
  this.currentSessionId = await searchService.createSearchSession(
    this.currentPlateNumber, 
    searchContext
  );
  await searchService.saveSearchResults(this.currentSessionId, this.searchResults);
  console.log('✅ Search session saved to Supabase:', this.currentSessionId);
}
```

### STEP 4: Add Checkbox → Supabase Save
**File**: `/parts-search-results-pip.js`

**Find**: Checkbox event handler (search for "checkbox" or "change" event)

**Add**: Supabase save when checked
```javascript
// When checkbox state changes
const checkbox = event.target;
const partData = this.searchResults[index];

if (checkbox.checked) {
  const searchService = new PartsSearchSupabaseService();
  await searchService.saveSelectedPart(this.currentPlateNumber, partData);
  console.log('✅ Part saved to Supabase');
}
```

### STEP 5: Sync Helper with Supabase
**File**: `/parts search.html`

**Location**: Line ~1617 (where helper.parts_search.selected_parts is updated)

**Add after existing helper save:**
```javascript
helper.parts_search.selected_parts = [...selectedParts];

// NEW: Sync to Supabase
const searchService = new PartsSearchSupabaseService();
await searchService.syncSelectedParts(plateNumber, selectedParts);
console.log('✅ Selected parts synced to Supabase');
```

### STEP 6: Fix Selected Parts List Loading
**File**: `/selected-parts-list.js`

**Location**: Line 32-36

**Change table name** (if wrong):
```javascript
// OLD: 
.from('selected_parts')

// Verify correct table name and update if needed
```

---

## CRITICAL CONSTRAINTS

⚠️ **DO NOT**:
- Change helper structure
- Change UI layout or styling
- Rewrite existing logic
- Touch any code outside the scope of these specific additions

✅ **DO**:
- Only add Supabase save calls
- Keep changes minimal and focused
- Test after each step
- Document every change

---

## HELPER STRUCTURE (DO NOT CHANGE)

```javascript
helper.parts_search = {
  selected_parts: [],  // ← Sync this with Supabase
  results: [],
  // ... other fields
}
```

**Rule**: Only ADD to `selected_parts`, never change the structure itself.

---

## TESTING CHECKLIST

After implementation, test:
1. ☐ Search for parts → Check parts_search_sessions table has new record
2. ☐ Verify parts_search_results has results JSONB
3. ☐ Check a checkbox → Verify selected_parts table has record
4. ☐ Refresh page → Verify selected parts load from Supabase
5. ☐ Check helper.parts_search.selected_parts has same data
6. ☐ Verify "רשימת חלקים נבחרים" UI shows correct parts

---

## DOCUMENTATION REQUIRED

After completing, document in `supabase and parts search module integration.md`:

**Session 9 Summary must include:**
- Date: 2025-10-06
- Purpose: Save search sessions and selected parts to Supabase
- Files Created: partsSearchSupabaseService.js, CREATE_PARTS_SEARCH_TABLES_2025-10-06.sql
- Files Modified: parts-search-results-pip.js (lines X-Y), parts search.html (line ~1617), selected-parts-list.js (line ~32)
- Logic: Why each change was made
- Result: What happened after testing
- SQL Names: Which SQL files deployed
- Status: WORKED or BROKE

---

## NEXT AGENT CHECKLIST

1. ☐ Read this instruction file completely
2. ☐ Read Session 8 summary to understand current state
3. ☐ Create SQL file first, run diagnostic to verify tables
4. ☐ Create partsSearchSupabaseService.js
5. ☐ Make ONE change at a time
6. ☐ Test after each change
7. ☐ Document in task file after completion
8. ☐ Mark todos as complete

---

**IMPORTANT**: Work on ONE task at a time. Get user approval before proceeding to next task.

---
raw previous claud's plan :
  UI Flow:
    1. User searches for parts → 
    Results appear in PiP window 
    (parts-search-results-pip.js)
    2. User checks checkboxes to select
     parts
    3. Selected parts show in "רשימת 
    חלקים נבחרים" section 
    (selected-parts-list.js)

    Current Storage:
    - selectedParts[] array in parts 
    search.html (line 543)
    - 
    helper.parts_search.selected_parts 
    in helper.js (line 3074)
    - Currently NO Supabase integration
     for search sessions or results

    Supabase Tables (from 
    SUPABASE_MIGRATION_PROJECT.md):
    1. parts_search_sessions (id, 
    case_id, plate, search_context, 
    created_by, created_at)
    2. parts_search_results (id, 
    session_id, supplier, search_query,
     results, response_time_ms, 
    created_at)
    3. selected_parts (needs schema 
    confirmation)

    ---
    TASKS TO IMPLEMENT

    TASK 1: Create Supabase Functions 
    for Search Session Management

    Purpose: Store search sessions and 
    results in Supabase tables per 
    plate number

    Files to Create:
    1. /services/partsSearchSupabaseSer
    vice.js - New service for all 
    Supabase operations

    Functions to implement:
    - createSearchSession(plateNumber, 
    searchParams) → returns session_id
    - saveSearchResults(sessionId, 
    results) → saves all results
    - saveSelectedPart(plateNumber, 
    partData) → saves checked part
    - getSearchSessions(plateNumber) → 
    retrieves search history
    - getSelectedParts(plateNumber) → 
    retrieves selected parts

    ---
    TASK 2: Integrate with PiP Search 
    Results

    Purpose: Auto-save search session 
    when search executes

    File to Edit: 
    parts-search-results-pip.js

    Changes (MINIMAL, scope-limited):
    1. Line ~27-44 in showResults() - 
    Add after line 34:
    // Save search session to Supabase
    if (this.currentPlateNumber) {
      this.currentSessionId = await 
    partsSearchService.createSearchSess
    ion(
        this.currentPlateNumber, 
        searchContext
      );
      await partsSearchService.saveSear
    chResults(this.currentSessionId, 
    searchResults);
    }

    Scope: Only add Supabase save 
    calls, NO changes to existing logic

    ---
    TASK 3: Handle Checkbox Selection →
     Supabase

    Purpose: When user checks a part, 
    save to Supabase selected_parts 
    table

    File to Edit: 
    parts-search-results-pip.js

    Changes (MINIMAL):
    1. Find checkbox change handler 
    (need to locate in file)
    2. Add Supabase save call:
    // When checkbox checked
    await partsSearchService.saveSelect
    edPart(plateNumber, partData);

    Scope: Only add save call when 
    checkbox state changes

    ---
    TASK 4: Sync Helper with Supabase

    Purpose: Ensure 
    helper.parts_search.selected_parts 
    stays in sync

    File to Edit: parts search.html

    Changes (MINIMAL):
    1. Line ~1617 - After helper save, 
    add Supabase save:
    helper.parts_search.selected_parts 
    = [...selectedParts];
    // NEW: Save to Supabase
    await partsSearchService.syncSelect
    edParts(plateNumber, 
    selectedParts);

    Scope: Only add sync call after 
    existing helper update

    ---
    TASK 5: Update Selected Parts List 
    UI

    Purpose: Load selected parts from 
    Supabase on page load

    File to Edit: 
    selected-parts-list.js

    Changes (MINIMAL):
    1. Line ~26-50 - Already has 
    loadSelectedParts() but uses wrong 
    table
    2. Update table name from 
    selected_parts to correct table
    3. Ensure real-time subscription 
    works

    Scope: Fix table reference only

    ---
    TASK 6: SQL - Verify Tables Exist

    Purpose: Ensure Supabase tables are
     created with correct schema

    File to Create: Phase5_Parts_Search
    _2025-10-05/CREATE_PARTS_SEARCH_TAB
    LES_2025-10-06.sql

    Tables to verify/create:
    1. parts_search_sessions (already 
    in schema)
    2. parts_search_results (already in
     schema)  
    3. selected_parts (need to check if
     exists, create if not)

    ---
    DOCUMENTATION STANDARD

    Each change will be documented 
    with:
    - Date: 2025-10-06
    - Version: Phase 5 - Session 9
    - Purpose: Save search sessions and
     selected parts to Supabase
    - Files Modified: List with line 
    numbers
    - Logic: Why this approach works
    - Result: What happened after 
    deployment

    ---
    CONSTRAINTS (YOUR REQUIREMENTS)

    ✅ ONLY touch files/code related to
     this task
    ✅ NO changes to helper structure 
    (only add to existing 
    parts_search.selected_parts)
    ✅ NO changes to UI layout (only 
    add backend save calls)
    ✅ MINIMAL edits (add Supabase 
    calls, don't rewrite logic)
    ✅ Test after each step before 
    proceeding

    ---
    EXECUTION ORDER

    1. Create SQL to verify/create 
    tables
    2. Create 
    partsSearchSupabaseService.js
    3. Integrate with PiP results 
    (session save)
    4. Add checkbox → Supabase save
    5. Sync helper with Supabase
    6. Update selected-parts-list.js 
    table reference
    7. Test end-to-end flow
    8. Document everything

    ---
    Ready to proceed? I will work one 
    task at a time, get your approval, 
    then continue.
Update Todos
  ⎿ ☐ Create SQL to verify/create      
      Supabase tables for search 
      sessions, results, and selected 
      parts
    ☐ Create
      partsSearchSupabaseService.js
      with all CRUD functions
    ☐ Integrate search session save in
      parts-search-results-pip.js
    ☐ Add checkbox selection →
      Supabase save in PiP
    ☐ Sync helper.parts_search.selecte
      d_parts with Supabase in parts
      search.html
    ☐ Test end-to-end flow: search →
      select → save → load
    ☐ Fix selected-parts-list.js table
      reference and loading
    ☐ Document all changes in task
      file with Session 9 summary
**End of Session 9 Instructions**

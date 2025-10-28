# Parts Search PiP Buttons - Quick Reference Summary

## Button Locations in HTML (Lines 617-618)

```html
<button onclick="window.TEST_showAllSavedParts()" style="background: #10b981;">
  🗂️ הצג רשימת חלקים נבחרים עדכנית
</button>

<button onclick="window.showAllSearchResults()" style="background: #3b82f6;">
  📊 הצג רשימת כל תוצאות החיפוש
</button>
```

---

## 1. Selected Parts Button (Green)

### Main Function
- **Name**: `window.TEST_showAllSavedParts()`
- **Lines**: 4678-4976
- **Database Table**: `selected_parts`
- **Key Query**: 
  ```javascript
  const parts = await getSelectedParts({ plate: plate });
  ```

### What It Does
1. Gets plate number from form or helper
2. Queries `selected_parts` table via `getSelectedParts()`
3. Builds HTML table with all selected parts
4. Calculates subtotal (price × quantity)
5. Shows modal with vehicle info header
6. Provides edit/delete/bulk delete buttons
7. Has export and print functionality

### Table Columns Displayed
- Checkbox | # | Code | Part Name | Source | Price | Qty | Total | Supplier | Date | Actions

### Action Buttons in Modal
- ✕ Close
- 🗑️ Bulk Delete (shows when items selected)
- 👁️ Preview
- 🖨️ Print
- 📤 Export to Folder

### Statistics Shown
- Total parts count
- Subtotal cost (with quantity calculation)
- Vehicle info (make, model, year)

---

## 2. Search Results Button (Blue)

### Main Function
- **Name**: `window.showAllSearchResults()`
- **Lines**: 4979-5125
- **Database Tables**: 
  - `cases` (to get case_id)
  - `parts_search_sessions` (to get session IDs)
  - `parts_search_results` (to get all results)

### What It Does
1. Gets and normalizes plate number (removes dashes)
2. Finds active case from `cases` table
3. Gets all search sessions for that case + plate
4. Queries all results from `parts_search_results` using session IDs
5. Flattens JSONB results arrays from all searches
6. Adds metadata (search_date, data_source) to each result
7. Calls `createSearchResultsModal()` to display

### Modal Creation Function
- **Name**: `window.createSearchResultsModal()`
- **Lines**: 5128-5320

### Table Columns Displayed
- Search Date | Data Source | Supplier | Catalog # | Description | Part Family | Price

### Action Buttons in Modal
- 🔍 Review (opens printable window)
- 🖨️ Print
- 📤 Export to PDF
- Close

### Statistics Shown
- Total searches performed
- Total results found across all searches
- Vehicle info (make, model, year)

---

## Key Data Flow

### Selected Parts (Button 1)
```
User Click
  → TEST_showAllSavedParts()
    → getSelectedParts({ plate })
      → Query: SELECT * FROM selected_parts WHERE plate = ?
        → Build table HTML with parts
          → Calculate subtotal
            → Show modal with actions
```

### Search Results (Button 2)
```
User Click
  → showAllSearchResults()
    → Query: cases table for case_id
      → Query: parts_search_sessions for session IDs
        → Query: parts_search_results for all results (JSONB)
          → Flatten results arrays
            → Add metadata to each result
              → createSearchResultsModal()
                → Show modal with actions
```

---

## Helper Functions Reference

### For Selected Parts
- `getSelectedParts()` - Lines 1409-1500+ (queries Supabase)
- `toggleSelectAll()` - Lines 5754-5761
- `closePartsModal()` - Lines 5777-5782
- `deletePartFromModal()` - Lines 6434-6476
- `bulkDeleteParts()` - Lines 5785-5850+
- `editPartFromModal()` - Lines 6479+ 
- `openPartsPreviewWindow()` - Lines 5859+
- `printPartsList()` - Lines 6075-6078
- `exportPartsToOneDrive()` - Lines 6260+

### For Search Results
- `createSearchResultsModal()` - Lines 5128-5320
- `closeSearchResultsModal()` - Lines 5323-5328
- `openSearchResultsReviewWindow()` - Lines 5330+
- `printAllSearchResults()` - Lines 5473-5476
- `exportSearchResultsToPDF()` - Lines 5479-5560+

---

## Styling Standards

### Both Modals Use
- **Logo**: `https://carmelcayouf.com/wp-content/uploads/2025/06/g.webp`
- **Business Name**: ירון כיוף - שמאות וייעוץ
- **Colors**:
  - Selected Parts: Green theme (#10b981)
  - Search Results: Blue theme (#3b82f6)
  - Header gradient: `linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)`
- **Direction**: RTL (Hebrew)
- **z-index**: Modal 10001, Backdrop 10000

### Mobile Responsive
Both modals include media queries for `@media (max-width: 768px)`:
- Smaller fonts
- Hidden header elements on mobile
- Compact padding
- Optimized for scrolling

---

## Database Schema Requirements

### selected_parts Table
```sql
- id (UUID, primary key)
- plate (TEXT)
- pcode, oem (TEXT)
- part_family, part_name (TEXT)
- source (TEXT: מקורי/חליפי/משומש)
- price, cost, expected_cost (NUMERIC)
- quantity, qty (INTEGER)
- supplier, supplier_name (TEXT)
- selected_at (TIMESTAMP)
```

### cases Table
```sql
- id (UUID, primary key)
- plate (TEXT, normalized)
- status (TEXT: OPEN/IN_PROGRESS/CLOSED)
- filing_case_id (TEXT)
- created_at (TIMESTAMP)
```

### parts_search_sessions Table
```sql
- id (UUID, primary key)
- case_id (UUID, foreign key)
- plate (TEXT)
- created_at (TIMESTAMP)
```

### parts_search_results Table
```sql
- id (UUID, primary key)
- session_id (UUID, foreign key)
- results (JSONB array)
- search_query (JSONB)
- data_source (TEXT: catalog/web/ocr)
- created_at (TIMESTAMP)
```

---

## Common Patterns

### Plate Normalization
```javascript
const normalizedPlate = plate.replace(/-/g, '');
// "221-84-003" → "22184003"
```

### Price Formatting
```javascript
price.toLocaleString('he-IL', {minimumFractionDigits: 2})
// 1500 → "1,500.00"
```

### Date Formatting
```javascript
new Date(dateString).toLocaleDateString('he-IL', {
  year: '2-digit', month: '2-digit', day: '2-digit'
})
// "2025-01-15" → "15/01/25"
```

### Vehicle Info Retrieval
```javascript
const vehicleInfo = {
  make: window.helper?.vehicle?.manufacturer || 'N/A',
  model: window.helper?.vehicle?.model || 'N/A',
  year: window.helper?.vehicle?.year || 'N/A'
};
```

---

## Testing Checklist

### Selected Parts Button
- [ ] Opens modal with selected parts
- [ ] Shows correct vehicle info
- [ ] Calculates subtotal correctly
- [ ] Select all checkbox works
- [ ] Individual checkboxes work
- [ ] Bulk delete button appears/hides
- [ ] Edit button opens edit modal
- [ ] Delete button removes part
- [ ] Preview window opens
- [ ] Print function works
- [ ] Export to folder works
- [ ] Modal closes on backdrop click
- [ ] Mobile view is responsive

### Search Results Button  
- [ ] Opens modal with all search history
- [ ] Shows correct number of searches
- [ ] Shows correct number of results
- [ ] Results are flattened from JSONB
- [ ] Data source badges show correctly
- [ ] Dates format correctly
- [ ] Review window opens
- [ ] Print function works
- [ ] PDF export works
- [ ] Modal closes on backdrop click
- [ ] Mobile view is responsive

---

## File Location
`/Users/carmelcayouf/Library/Mobile Documents/com~apple~CloudDocs/1A Yaron Automation/IntegratedAppBuild/System Building Team/code/new code /SmartVal/parts search.html`

**For complete code, see**: `PARTS_SEARCH_PIP_BUTTONS_COMPLETE_CODE.md`

# Part Vehicle Identity - Generated Columns Migration

**Date**: 2025-10-09  
**Session**: 18  
**Purpose**: Add columns to track part's original vehicle when it differs from user's car

---

## Problem

When user searches for parts, results may include **compatible parts from different vehicles**:

**Example:**
- User's car: 2022 Toyota Corolla Cross
- Search returns: Front fender from 2019 Audi A4 (compatible part)
- User selects it

**Current State:**
- ✅ Part's original vehicle details stored in `raw_data` JSONB
- ❌ Not easily queryable ("show all cross-compatible parts")
- ❌ Not visible in UI

---

## Solution

Add 4 **generated columns** that automatically extract data from existing `raw_data`:

1. `part_make` - Part's original manufacturer
2. `part_model` - Part's original model
3. `part_year_from` - Part compatibility start year
4. `part_year_to` - Part compatibility end year

**Generated columns = Database automatically populates them from JSONB, no code changes needed**

---

## How to Apply Migration

### **Step 1: Run SQL Migration**

1. Open Supabase SQL Editor
2. Copy contents of `add_part_vehicle_identity_columns.sql`
3. Execute the migration
4. Verify with test query:

```sql
SELECT 
  plate,
  make as user_car,
  part_make,
  part_model,
  part_name
FROM selected_parts
WHERE part_make IS NOT NULL
LIMIT 10;
```

### **Step 2: Test on Existing Data**

Generated columns should automatically populate for all existing rows.

**Test Query:**
```sql
-- Find all cross-compatibility parts
SELECT 
  COUNT(*) as total_parts,
  COUNT(CASE WHEN make != part_make THEN 1 END) as cross_make_parts,
  COUNT(CASE WHEN model != part_model THEN 1 END) as cross_model_parts
FROM selected_parts;
```

### **Step 3: Verify UI Display**

1. Open parts search page
2. Select parts from UI form
3. Load selected parts list
4. Parts from different vehicles should show **yellow badge**: "ℹ️ חלק תואם מ-VAG A4 (2009-2011)"

---

## Benefits

✅ **Zero code changes for data saving** - Columns auto-populate  
✅ **Works on existing data** - All old records get columns filled  
✅ **Fast queries** - Indexed columns for filtering  
✅ **Clear UI feedback** - Users see when part is from different vehicle  
✅ **Future-proof** - Can query compatibility patterns

---

## Example Use Cases

### **Query 1: Find all cross-make parts**
```sql
SELECT plate, make, part_make, part_name
FROM selected_parts  
WHERE make IS DISTINCT FROM part_make;
```

### **Query 2: Find parts from older years**
```sql
SELECT 
  plate, 
  year as user_car_year,
  part_year_from,
  part_name
FROM selected_parts
WHERE year > part_year_from;
```

### **Query 3: Compatibility analysis**
```sql
SELECT 
  part_make,
  part_model,
  COUNT(*) as usage_count
FROM selected_parts
WHERE make != part_make
GROUP BY part_make, part_model
ORDER BY usage_count DESC;
```

---

## Schema Changes

### **Before:**
```
selected_parts
├── make (user's car)
├── model (user's car)
├── year (user's car)
└── raw_data (JSONB with part's vehicle - not easily queryable)
```

### **After:**
```
selected_parts
├── make (user's car)
├── model (user's car)
├── year (user's car)
├── part_make (auto-extracted from raw_data) ← NEW
├── part_model (auto-extracted from raw_data) ← NEW
├── part_year_from (auto-extracted from raw_data) ← NEW
├── part_year_to (auto-extracted from raw_data) ← NEW
└── raw_data (JSONB - still source of truth)
```

---

## Rollback (if needed)

```sql
-- Remove generated columns
ALTER TABLE selected_parts 
  DROP COLUMN IF EXISTS part_make,
  DROP COLUMN IF EXISTS part_model,
  DROP COLUMN IF EXISTS part_year_from,
  DROP COLUMN IF EXISTS part_year_to;

-- Remove indexes
DROP INDEX IF EXISTS idx_selected_parts_part_make;
DROP INDEX IF EXISTS idx_selected_parts_compatibility;
DROP INDEX IF EXISTS idx_selected_parts_part_year;
```

---

## Testing Checklist

- [ ] SQL migration runs without errors
- [ ] Generated columns populated for existing data
- [ ] Indexes created successfully
- [ ] UI shows compatibility badge for cross-vehicle parts
- [ ] Badge displays correct make/model/year
- [ ] Query performance is acceptable

---

## Notes

- Generated columns use `STORED` (not `VIRTUAL`) for better query performance
- NULL handling included (uses `CASE` for year conversion)
- Indexes use `WHERE` clause for efficiency (only index non-NULL values)
- Compatibility badge only shows when part vehicle differs from user's car

---

**Status**: Ready to apply  
**Risk**: Very Low (additive change, no data modification)  
**Estimated Time**: 5 minutes

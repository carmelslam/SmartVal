# Deploy Fixes in This Order

**Date**: October 5, 2025  
**Total Fixes**: 3  
**Estimated Time**: 15 minutes

## Important Instructions

1. **Deploy ONE at a time**
2. **Test each fix before moving to next**
3. **Tell me the result after each deployment**

---

## FIX 1: Source Field Hebrew Reversal
**File**: `FIX_1_SOURCE_FIELD_REVERSAL.sql`  
**Affects**: ~29,000 records

### Deploy:
1. Copy contents of FIX_1_SOURCE_FIELD_REVERSAL.sql
2. Run in Supabase SQL Editor
3. Check the verification query results

### Expected Result:
- Should see "חליפי" with ~47,000+ count (combined)
- Should see "תואם מקורי" with ~1,000+ count (combined)
- "יפילח" and "ירוקמ םאות" should be gone

### Tell me:
- Did it work? 
- What are the new counts?

---

## FIX 2: Year Range Calculation  
**File**: `FIX_2_YEAR_RANGE_CALCULATION.sql`  
**Affects**: All records with year data

### Deploy:
1. Copy contents of FIX_2_YEAR_RANGE_CALCULATION.sql
2. Run in Supabase SQL Editor
3. Check the verification query results

### Expected Result:
- year_range should show format like "011-017", "015", "018-020"
- Should be 3-digit format
- Should match year_from and year_to values

### Tell me:
- Do year ranges look correct now?
- Show me a few examples

---

## FIX 3: cat_num_desc Full String Reversal
**File**: `FIX_3_CAT_NUM_DESC_FULL_REVERSAL.sql`  
**Affects**: Records with fully reversed Hebrew

### Deploy:
1. Copy contents of FIX_3_CAT_NUM_DESC_FULL_REVERSAL.sql  
2. Run in Supabase SQL Editor
3. Check the verification query results

### Expected Result:
- Should find 0 records with "עונמ", "הרמנפ", "ןגמ"
- Previously reversed strings should now be correct

### Tell me:
- How many records were updated?
- Are the reversed strings fixed?

---

## After All 3 Fixes

Run the SIMPLE_DATA_CHECK.sql again to verify all fixes worked.

Then we'll tackle:
- Part description word order issue (more complex)
- Advanced search problems
- Synonym support

# CORRECT Search Filter Order

**Date**: October 5, 2025  
**Source**: User specification

## Filter Order (Cascading Logic)

The search filters in THIS order:

1. **FAMILY** (part family - פנסים, דלתות, etc.)
2. **PART** (from simple and advanced search fields)
3. **MAKE** (manufacturer - טויוטה, הונדה, etc.)
4. **MODEL** (קורולה, סיויק, etc.)
5. **YEAR** ← Applied AFTER model
6. **TRIM** (actual_trim)
7. **MODEL_CODE** 
8. **VIN number**
9. **Engine code**
10. **ENGINE params** (engine type, etc.)
11. **Engine volume**
12. **OEM number**

**Note**: `plate` is for association/tracking, NOT for filtering results

## What This Means

The search logic is:
1. "What TYPE of part?" (family)
2. "What specific part?" (part name)
3. "For what manufacturer?" (make)
4. "For what model?" (model)
5. "What year?" (year)
6. ... and so on

## Cascading Behavior

Each filter narrows the results:
- If FAMILY provided → filter by family first
- If no FAMILY → skip to PART
- If PART provided → filter by part
- Then filter by MAKE if provided
- Then MODEL if provided
- Then YEAR if provided
- etc.

If a filter returns 0 results, the function should cascade back to previous level.

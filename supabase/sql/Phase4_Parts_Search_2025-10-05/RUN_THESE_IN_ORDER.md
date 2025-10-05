# Run These SQL Files in Order

**Date**: October 5, 2025  
**Purpose**: Complete diagnostic of current state

## Step 1: Get Function Signature
Run: `GET_EXACT_PARAMETERS.sql`

This shows the exact parameter list and types.

## Step 2: Run Main Diagnostic  
Run: `DIAGNOSTIC_COMPLETE_STATE_2025-10-05.sql`

This runs all 8 diagnostic sections:
- Section 1: Function signature
- Section 2: Triggers
- Section 3: Data quality
- Section 4: Word order check (for backwards issue)
- Section 5: Year reversal check (810 vs 018)
- Section 6: Source field check (reversed Hebrew)
- Section 7: Search tests (simple, advanced, cascade)
- Section 8: Sample results

## What to Send Back

Copy and paste ALL results from both SQL files.

I need to see:
1. The exact parameter list
2. All diagnostic results
3. Any errors that occur

This will tell me:
- What's actually deployed
- What's working vs broken
- Root causes of the 6 issues you reported

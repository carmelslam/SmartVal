# Total Market Value Section Fix Summary

## Issues Fixed

### 1. Type Dropdown Changes Don't Persist After Page Refresh
**Problem:** When user changed dropdown from "תוספת (+)" to "הפחתה (-)", after page refresh it would revert back to original value.

**Root Cause:** Data loading logic was using `getDropdownTypeFromValues()` function to detect type from percentage/amount values instead of using stored `adj.type` field.

**Fix Applied:**
```javascript
// OLD (broken):
const dropdownType = getDropdownTypeFromValues(itemPercent, itemAmount);
if (dropdownType === 'minus') {
  selectedType = 'הפחתה (-)';
} else if (dropdownType === 'plus') {
  selectedType = 'תוספת (+)';
}

// NEW (working):
const storedType = adj.type || 'plus';
if (storedType === 'minus' || storedType === 'הפחתה' || storedType === 'הפחתה (-)') {
  selectedType = 'minus';
} else if (storedType === 'plus' || storedType === 'תוספת' || storedType === 'תוספת (+)') {
  selectedType = 'plus';
}
```

### 2. Type Dropdown Changes Don't Update UI Percent Field Signs
**Problem:** When user changed dropdown type, the percentage field sign (+ or -) in the UI wouldn't update immediately.

**Root Cause:** Dropdown `onchange` handlers weren't calling `formatAdjustmentDisplay()` with absolute values.

**Fix Applied:**
Updated all dropdown `onchange` handlers to call `formatAdjustmentDisplay()` with `Math.abs()`:
```javascript
// Added to all dropdown onchange handlers:
formatAdjustmentDisplay(row, this.value, Math.abs(parseFloat(inputs[2].value) || 0), safeParseAmount(inputs[3].value))
```

### 3. Amount Calculation Not Working (amounts showing 0 in storage)
**Problem:** Amount fields were not being calculated/stored properly, showing 0 values in helper storage.

**Root Cause:** Inconsistent sign application in `syncAdjustmentToHelper` function. Was only applying signs to `amount` field, but needed to apply to all three fields (`amount`, `percent`, `percentage`) to maintain consistency with the rest of the system.

**Fix Applied:**
```javascript
// OLD (broken):
if (adjustmentData.type === 'minus') {
  adjustmentData.amount = -Math.abs(adjustmentData.amount);
} else {
  adjustmentData.amount = Math.abs(adjustmentData.amount);
}

// NEW (working):
if (adjustmentData.type === 'minus') {
  adjustmentData.amount = -Math.abs(adjustmentData.amount);
  adjustmentData.percent = -Math.abs(adjustmentData.percent);
  adjustmentData.percentage = -Math.abs(adjustmentData.percentage);
}
```

### 4. CSS Selector JavaScript Errors
**Problem:** JavaScript errors from escaped quotes in CSS selectors causing `dispatchEvent` failures.

**Fix Applied:**
```javascript
// OLD (causing errors):
this.closest('div[id^=\"featureAdj_\"]')

// NEW (working):
this.closest('.adjustment-row') || this.closest('div').parentElement
```

## Critical Guidelines for Future Changes

### ⚠️ **SIGN APPLICATION CONSISTENCY**
**NEVER** change sign application logic in isolation. The system requires ALL THREE fields to have consistent sign handling:
- `adjustmentData.amount`
- `adjustmentData.percent` 
- `adjustmentData.percentage`

If you change one, you MUST change all others to match.

### ⚠️ **DATA LOADING vs DATA SAVING**
- **Data Loading:** Always use stored `adj.type` field directly, never derive type from values
- **Data Saving:** Apply signs consistently across all three numeric fields
- **UI Display:** Use `formatAdjustmentDisplay()` with `Math.abs()` for proper sign display

### ⚠️ **AMOUNT CALCULATION DEPENDENCY**
The amount calculation logic depends on:
1. `adjustmentData.percentage` being truthy (non-zero)
2. `adjustmentData.amount` being falsy (0 or empty)
3. Consistent sign application across all numeric fields

Breaking any of these breaks amount auto-calculation.

### ⚠️ **TESTING WORKFLOW**
When making ANY changes to type/sign handling:
1. Test type dropdown persistence after page refresh
2. Test UI sign changes when dropdown changes
3. Test amount calculation from percentage
4. Test data storage in helper (check browser dev tools)
5. Test both plus and minus scenarios

## Files Modified
- `final-report-builder.html` - Main logic changes in:
  - `loadTotalMarketValueAdjustments()` function
  - `syncAdjustmentToHelper()` function
  - All dropdown `onchange` handlers
  - CSS selectors in event handlers

## Working Version Reference
- **Working Base:** Commit `66a23a1`
- **Final Working:** Current state after fixes

## Notes
- Amount calculation uses cumulative base values from `helper.estimate.market_value_base`
- System maintains backward compatibility with multiple type field formats
- Features/registration sections are read-only in Total Market Value (populated from estimate)
- Changes write to both `final_report.adjustments` and `valuation.adjustments`
- **NEVER** write to `estimate.adjustments` from final report page (read-only)
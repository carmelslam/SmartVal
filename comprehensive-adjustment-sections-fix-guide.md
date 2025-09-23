# Comprehensive Adjustment Sections Fix Guide

## Overview of the Problem Domain

The SmartVal final-report-builder.html contains two main adjustment sections:
1. **Gross Section** - Features and Registration (ערך הרכב לנזק גולמי)
2. **Total Section** - Mileage, Ownership Type, Ownership History, Additional (ערך שוק מלא)

Each section needed to support:
- Row-level cumulative calculations
- Sign display (תוספת/הפחתה) with proper minus signs
- Persistence across page refreshes
- Manual amount entry vs percentage calculations

## Phase 1: Initial Gross Section Fixes

### Problem 1: Sign Display Issues
**Issue**: When user selected "הפחתה (-)" from dropdown, the percentage and amount fields didn't show minus signs.

**Root Cause**: The `formatAdjustmentDisplay` function wasn't being called on dropdown changes.

**Solution Strategy**:
1. Add `formatAdjustmentDisplay` calls to all dropdown `onchange` handlers
2. Update the sign parsing logic to handle amounts that already have minus signs

**Implementation Pattern**:
```javascript
// In dropdown onchange handlers:
onchange="updateGrossMarketValueCalculation(); syncAdjustmentToHelper(this, 'features'); const row = this.closest('div[data-source]'); const inputs = row.querySelectorAll('input, select'); formatAdjustmentDisplay(row, this.value, Math.abs(parseFloat(inputs[2].value) || 0), safeParseAmount(inputs[3].value));"

// In amount parsing (updateGrossMarketValueCalculation):
const amountText = (inputs[3].value || '').trim();
const hasMinusSign = amountText.includes('-');
const amount = Math.abs(parseFloat(amountText.replace(/[₪,\s-]/g, '')) || 0);
const type = inputs[1].value;
const isNegative = isReductionType(type);
currentValue += (isNegative ? -amount : amount);
```

### Problem 2: Base Price Calculation
**Issue**: `calculateAdjustmentValueSimple` used hardcoded 118,000 instead of actual base price.

**Solution**:
```javascript
// Get actual base price from UI
let basePrice = 0;
const basicPriceField = document.getElementById('basicPrice');
if (basicPriceField?.value) {
  basePrice = parseFloat(basicPriceField.value.replace(/[₪,]/g, '')) || 0;
}
// Fallback to helper data if needed
if (basePrice === 0) {
  const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
  basePrice = helper.estimate?.market_value_base || 118000;
}
```

## Phase 2: Total Section Implementation

### Problem 3: Inconsistent Behavior Between Sections
**Issue**: Total section categories (mileage, ownership, additional) didn't have the same sign handling and cumulative features as Gross section.

**Solution Strategy**: Apply the exact same patterns from Gross section to Total section.

**Implementation Steps**:
1. **Add formatAdjustmentDisplay to Total section functions**:
   - `addFullFeaturesAdjustment()`
   - `addFullRegistrationAdjustment()`
   - `addMileageAdjustment()`
   - `addOwnershipAdjustment()`
   - `addOwnersAdjustment()`
   - `addFullMarketAdjustment()`

2. **Apply sign parsing fixes to updateFullMarketValueCalculation**:
```javascript
// Applied to all categories in Total section
} else if (valueInput && valueInput.value) {
  // FIXED: Parse amount considering it might already have a minus sign
  const amountText = (valueInput.value || '').trim();
  const hasMinusSign = amountText.includes('-');
  const value = Math.abs(parseFloat(amountText.replace(/[₪,\s-]/g, '')) || 0);
  const signedValue = (type === 'minus') ? -value : value;
  currentValue += signedValue;
}
```

## Phase 3: Row-Level Cumulative Storage

### Problem 4: Missing Cumulative Data per Row
**Issue**: Only Features and Registration had row-level cumulative values. Other categories only stored total cumulative in first row [0].

**Root Cause**: `syncAdjustmentToHelper` was capturing cumulative values but `saveAdjustmentAmount` was overwriting them by only updating the first item.

**Solution Strategy**:
1. Extend cumulative tracking to all categories
2. Remove conflicting `saveAdjustmentAmount` calls
3. Ensure data loading restores row-level cumulative values

**Implementation Steps**:

1. **Extended syncAdjustmentToHelper cumulative tracking**:
```javascript
// Add cumulative tracking for all adjustment categories
if (category === 'mileage' || category === 'ownership_type' || category === 'ownership_history' || 
    category === 'features' || category === 'registration' || category === 'additional') {
  // Get cumulative from the row itself, not the category total
  const rowCumulativeSpan = row.querySelector('.row-cumulative');
  if (rowCumulativeSpan) {
    const cumulativeText = rowCumulativeSpan.textContent.replace(/[₪,]/g, '');
    const cumulativeValue = parseFloat(cumulativeText) || 0;
    adjustmentData.cumulative = Math.round(cumulativeValue);
  }
}
```

2. **Removed conflicting saveAdjustmentAmount calls**:
```javascript
// REMOVED from updateFullMarketValueCalculation:
saveAdjustmentAmount('mileage', Math.round(totalMileageAmount), Math.round(currentValue));
saveAdjustmentAmount('ownership_type', Math.round(totalOwnershipAmount), Math.round(currentValue));
saveAdjustmentAmount('ownership_history', Math.round(totalOwnersAmount), Math.round(currentValue));

// REMOVED from row templates:
onchange="... saveAdjustmentAmount('mileage', safeParseAmount(this.value), 0); ..."
```

3. **Added cumulative restoration in data loading**:
```javascript
// In loadTotalValueSectionAdjustments for each category:
if (adj.cumulative !== undefined) {
  setTimeout(() => {
    const rows = container.querySelectorAll('.adjustment-row');
    const lastRow = rows[rows.length - 1];
    const cumulativeSpan = lastRow?.querySelector('.row-cumulative');
    if (cumulativeSpan) {
      cumulativeSpan.textContent = `₪${Math.round(adj.cumulative).toLocaleString()}`;
    }
  }, 10);
}
```

## Phase 4: Page Refresh Persistence Issues

### Problem 5: Data Loss on Page Refresh
**Issue**: After page refresh, first row amounts disappeared and cumulative values were lost.

**Root Cause Analysis**:
1. `updateFullMarketValueCalculation` was overwriting manual amounts during page load
2. Calculations ran before cumulative values were properly restored
3. The condition `(index === 0 || !window.pageLoadInProgress)` allowed first row to be overwritten

**Solution Strategy**: Fix page load sequence to preserve manual data and ensure cumulative values are calculated after data is fully loaded.

**Critical Fix 1 - Prevent Amount Overwriting During Page Load**:
```javascript
// CHANGED FROM:
if (valueInput && (index === 0 || !window.pageLoadInProgress)) {
  // This allowed first row to be overwritten during page load
}

// CHANGED TO:
if (valueInput && !window.pageLoadInProgress) {
  // Skip ALL rows during page load to preserve manual amounts
}
```

**Critical Fix 2 - Proper Page Load Sequence**:
```javascript
// After setting window.pageLoadInProgress = false:
setTimeout(() => {
  window.pageLoadInProgress = false;
  
  // Trigger final calculations to update cumulative values
  updateGrossMarketValueCalculation();
  updateFullMarketValueCalculation();
  
  // Sync all adjustments to ensure cumulative values are saved
  setTimeout(() => {
    const categories = ['features', 'registration', 'mileage', 'ownership_type', 'ownership_history', 'additional'];
    categories.forEach(category => {
      // Trigger syncAdjustmentToHelper for each category to capture cumulative values
      const container = document.getElementById(containerId);
      if (container) {
        const firstInput = container.querySelector('input');
        if (firstInput) {
          syncAdjustmentToHelper(firstInput, category);
        }
      }
    });
  }, 100);
}, 500);
```

## How to Diagnose and Fix Similar Issues in the Future

### 1. Sign Display Problems
**Symptoms**: Dropdown shows "הפחתה (-)" but fields show positive values
**Check**: Are `formatAdjustmentDisplay` calls present in all dropdown onchange handlers?
**Fix**: Add formatAdjustmentDisplay calls with `Math.abs()` for values

### 2. Amount Calculation Issues
**Symptoms**: Amounts are wrong or use old base prices
**Check**: Is `calculateAdjustmentValueSimple` using actual UI base price?
**Fix**: Update to get base price from `basicPrice` field, not hardcoded values

### 3. Page Refresh Data Loss
**Symptoms**: Manual amounts disappear or become 0/NaN on refresh
**Check**: Is calculation logic running during page load and overwriting fields?
**Fix**: Use `!window.pageLoadInProgress` condition to skip UI updates during load

### 4. Missing Cumulative Values
**Symptoms**: Only first row has cumulative, others are missing
**Check**: Is `saveAdjustmentAmount` overwriting row-level cumulative data?
**Fix**: Remove `saveAdjustmentAmount` calls, rely on `syncAdjustmentToHelper`

### 5. Cumulative Not Updating on Refresh
**Symptoms**: Real-time cumulative works but disappears on refresh
**Check**: Is final calculation pass running after page load completes?
**Fix**: Add calculation trigger after `pageLoadInProgress = false`

## Key Architectural Principles

1. **Single Source of Truth**: `syncAdjustmentToHelper` is the master function for saving adjustment data
2. **Page Load Protection**: Use `window.pageLoadInProgress` to prevent calculations from overwriting loaded data
3. **Consistent Patterns**: Apply the same logic across all categories (Gross and Total sections)
4. **Calculation Order**: Load data → Set flag → Calculate → Clear flag → Final sync
5. **Row-Level Storage**: Each array item should have its own cumulative value, not just totals

## Files Modified
- `final-report-builder.html` - All adjustment calculation and display logic

## Testing Checklist
1. Add manual amounts to each category
2. Change dropdown from תוספת to הפחתה - verify minus signs appear
3. Refresh page - verify all amounts and cumulative values persist
4. Add multiple rows - verify each has its own cumulative
5. Check helper data in browser console - verify row-level cumulative storage
# Floating Buttons Analysis and Fix Plan

## Issue Analysis

After examining both `final-report-builder.html` and `estimator-builder.html`, I've identified the key differences in their floating button implementations:

### What Works in Final Report Builder:

1. **Complete toggleFloatingScreen Implementation**: 
   - Properly defined function with screen mapping
   - Individual handlers for each screen type
   - Working integration with floating screen modules

2. **Correct Screen Type Mapping**:
   - `leviReport` → calls `window.toggleLeviReport()`
   - `carDetails` → calls `window.toggleCarDetails()`
   - `invoiceDetails` → calls `window.toggleInvoiceDetails()`
   - `partsSearchResults` → calls `window.togglePartsSearchResults()`
   - `internalBrowser` → calls `showBrowserMenuUnderToggle()`

3. **Proper Module Loading**:
   - All required floating JS files loaded at bottom
   - Modules properly initialized

### What's Broken in Estimator Builder:

1. **Incomplete toggleFloatingScreen Implementation**:
   - Function exists but only calls `window.toggleFloatingScreenOriginal()` which doesn't exist
   - No proper screen type mapping
   - No individual handlers for different screen types

2. **Incorrect Screen Type Names**:
   - Uses `'levi'` instead of `'leviReport'`
   - Uses `'parts'` instead of `'partsSearchResults'`
   - Uses `'invoice'` instead of `'invoiceDetails'`

3. **Missing Functionality**:
   - No internal browser support
   - Screen handlers not properly connected to modules

## Fix Plan

### Task 1: Fix toggleFloatingScreen Function
- Replace the incomplete implementation with the working version from final-report-builder
- Map screen types correctly to their respective functions

### Task 2: Update Screen Type Names
- Change button onclick calls to match final-report-builder naming:
  - `'levi'` → `'leviReport'`
  - `'parts'` → `'partsSearchResults'`
  - `'invoice'` → `'invoiceDetails'`

### Task 3: Add Missing Internal Browser Support
- Add internal browser toggle button
- Implement `showBrowserMenuUnderToggle()` function

### Task 4: Verify Module Integration
- Ensure all floating screen modules are properly loaded
- Test that each button properly opens its corresponding floating screen

## Implementation Steps

1. Read current estimator-builder.html toggleFloatingScreen implementation
2. Replace with working implementation from final-report-builder.html
3. Update button onclick handlers to use correct screen type names
4. Add internal browser functionality
5. Test each floating button to ensure proper functionality

## Expected Result

After the fix, the estimator-builder.html floating buttons will work exactly like the final-report-builder.html buttons, providing access to:
- Levi report floating screen
- Car details floating screen  
- Parts search results floating screen
- Invoice details floating screen
- Internal browser menu

## Files to Modify

- `estimator-builder.html` - Main file requiring fixes

## Files for Reference

- `final-report-builder.html` - Working implementation to copy from
- `levi-floating.js` - Levi screen module
- `car-details-floating.js` - Car details module
- `parts-search-results-floating.js` - Parts search module
- `invoice-details-floating.js` - Invoice details module
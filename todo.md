# Depreciation Section Analysis and Fix Plan

## Problem Analysis
The user reports that depreciation fields (description, percentage, value) are not saving properly and delete on refresh. This indicates that the data is not being properly stored or loaded from the helper.

## Current Implementation Review

### 1. Depreciation Section Structure
- **Location**: Line 1099-1121 in estimate-builder.html
- **Global Field**: `globalDep1` (percentage) and `globalDepValue` (calculated value)
- **Bulk Table**: `depreciationBulkTable` containing dynamic rows
- **Garage Days**: `garageDays` field for work days

### 2. Key Functions Analysis

#### saveDepreciationData() Function (Line 1356)
- **Purpose**: Saves depreciation data to sessionStorage helper
- **Data Structure**: 
  ```javascript
  helper.estimate_depreciation = {
    global_percent: globalPercent,
    global_value: globalValue,
    bulk_items: [{
      damaged_part: string,
      repair_type: string,
      percent: string,
      value: string
    }]
  }
  ```
- **Trigger**: Called on `onchange` events for all depreciation fields
- **Storage**: Saves to `sessionStorage.getItem('helper')`

#### loadDepreciationData() Function (Line 1910)
- **Purpose**: Loads depreciation data from helper on page load
- **Logic**: 
  1. Checks if `helper.estimate_depreciation` exists
  2. If exists, loads global fields and bulk items
  3. If not exists, tries to populate from damage centers
- **Called**: In `loadDataFromHelper()` at line 1692

#### addDepField() Function (Line 1324)
- **Purpose**: Adds new depreciation row to bulk table
- **Event Binding**: Uses `onchange="saveDepreciationData()"`
- **Issue**: There are two different implementations of this function (line 1324 and 3265)

### 3. Page Load Sequence
1. `DOMContentLoaded` event triggers (line 5069)
2. `loadDataFromHelper()` called after 100ms timeout (line 5075)
3. `loadDepreciationData(helper)` called within loadDataFromHelper (line 1692)
4. Data loaded from `helper.estimate_depreciation` or populated from damage centers

### 4. Event Listener Setup
- **Global Field**: `onchange="saveDepreciationData()"` (line 1113)
- **Bulk Fields**: `onchange="saveDepreciationData()"` (lines 1334-1337)
- **Garage Days**: No automatic save event attached

## Identified Issues

### Issue 1: Multiple addDepField Implementations
- Two different implementations exist (lines 1324 and 3265)
- Different HTML structures and event handling
- May cause inconsistent behavior

### Issue 2: Missing Event Listeners for Garage Days
- `garageDays` field has no onchange event to save data
- Data may not be saved when changed

### Issue 3: Inconsistent Data Structure
- Some fields may not be properly saved due to selector issues
- No validation of data integrity before saving

### Issue 4: Potential Race Conditions
- Page loads with 100ms timeout
- Functions may not be fully initialized when called

## Implementation Plan

### Task 1: Fix Multiple addDepField Implementations
- [ ] Remove duplicate addDepField function
- [ ] Ensure consistent HTML structure and event binding
- [ ] Test dynamic row creation and deletion

### Task 2: Add Missing Event Listeners
- [ ] Add onchange event to garageDays field
- [ ] Ensure all depreciation fields trigger saveDepreciationData()
- [ ] Add blur events for better user experience

### Task 3: Improve Data Validation
- [ ] Add validation before saving depreciation data
- [ ] Ensure proper data structure integrity
- [ ] Add error handling for malformed data

### Task 4: Fix Event Listener Race Conditions
- [ ] Ensure proper function initialization order
- [ ] Add checks for DOM element existence
- [ ] Improve error handling in load functions

### Task 5: Debug and Test
- [ ] Add console logging to track save/load operations
- [ ] Test field persistence across page refreshes
- [ ] Verify data integrity in sessionStorage

## Review Section
*This section will be updated as tasks are completed with implementation details and results.*
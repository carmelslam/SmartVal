# Depreciation Functions Analysis

## Overview
This document provides a detailed analysis of all JavaScript functions related to the depreciation section in both `estimator-builder.html` and `final-report-builder.html`.

## Functions Found

### 1. **addDepField()**

#### In estimator-builder.html (Line 2436)
```javascript
function addDepField() {
  console.log('➕ Add depreciation field');
  // Implementation here
}
```
- **Status**: Stub function - not implemented
- **Purpose**: Intended to add depreciation rows/fields
- **Current State**: Only logs to console, no actual implementation

#### In final-report-builder.html (Line 1902)
```javascript
function addDepField(data = {}) {
  const container = document.getElementById('depreciationBulkTable');
  if (!container) {
    return;
  }
  
  const rowId = 'depRow_' + Date.now();
  const newRow = `
    <div id="${rowId}" class="dep-row" style="display:grid; grid-template-columns:70px 2fr 2fr 80px 90px 80px; gap:10px; margin-bottom:8px;">
      <div><input type="text" placeholder="מס' מוקד" value="${data.center_number || ''}" onchange="saveDepreciationData();" oninput="saveDepreciationData();" style="text-align: center;" title="${data.center_number || ''}" /></div>
      <div><input type="text" placeholder="החלק הניזוק" value="${data.damaged_part || ''}" onchange="saveDepreciationData();" oninput="saveDepreciationData();" title="${data.damaged_part || ''}" /></div>
      <div><input type="text" placeholder="מהות התיקון" value="${data.repair_type || ''}" onchange="saveDepreciationData();" oninput="saveDepreciationData();" title="${data.repair_type || ''}" /></div>
      <div><input type="text" placeholder="ירידת ערך (מספר)" value="${data.percent || ''}" onchange="saveDepreciationData();" oninput="saveDepreciationData();" title="${data.percent || ''}" style="direction: ltr; text-align: right;" /></div>
      <div><input type="text" placeholder="ערך ב-₪" value="${data.value || ''}" onchange="saveDepreciationData();" oninput="saveDepreciationData();" title="₪${data.value || ''}" /></div>
      <div><button class="btn remove" onclick="removeDepField('${rowId}')">מחק</button></div>
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', newRow);
  
  // Add auto-calculation functionality to the percentage field
  // ... (continues with event listeners and calculations)
}
```
- **Status**: Fully implemented
- **Purpose**: Adds a new depreciation row to the bulk table
- **Parameters**: `data` object with optional fields:
  - `center_number`: Center/damage location number
  - `damaged_part`: The damaged part description
  - `repair_type`: Type of repair needed
  - `percent`: Depreciation percentage
  - `value`: Depreciation value in ₪
- **Features**:
  - Creates a unique row ID using timestamp
  - All inputs trigger `saveDepreciationData()` on change
  - Includes a remove button for each row
  - Auto-calculation functionality for percentage field

### 2. **saveDepreciationData()**

#### In estimator-builder.html (Line 2650)
```javascript
function saveDepreciationData() {
  console.log('💾 Save depreciation data');
  // Implementation here
}
```
- **Status**: Stub function - not implemented
- **Purpose**: Intended to save depreciation data
- **Current State**: Only logs to console

#### In final-report-builder.html (Line 2002)
```javascript
function saveDepreciationData() {
  console.log('💾 SAVE DATA BUTTON CLICKED!');
  const button = document.querySelector('.save-btn');
  
  // Show visual feedback
  if (button) {
    button.style.background = '#059669';
    button.innerHTML = '⏳ שומר...';
    button.disabled = true;
  }
  
  try {
    // Get helper data from sessionStorage (single source of truth)
    const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
    
    // Get global depreciation values
    const globalPercent = document.getElementById('globalDep1')?.value || '';
    const globalValue = document.getElementById('globalDepValue')?.value || '';
    
    // Collect depreciation data
    // ... (continues with data collection and storage)
  }
  // ... (error handling and button reset)
}
```
- **Status**: Fully implemented
- **Purpose**: Saves all depreciation data to sessionStorage
- **Features**:
  - Visual feedback during save (button changes)
  - Saves to both `helper.depreciation` and `helper.final_report.depreciation`
  - Collects global depreciation values
  - Collects bulk depreciation items
  - Updates market value from summary
  - Error handling with console logging

### 3. **loadDepreciationData()**

#### In estimator-builder.html
- **Status**: Not found in this file
- **Alternative**: Has `loadDepreciation()` function at line 5203 (stub only)

#### In final-report-builder.html (Line 3200)
```javascript
function loadDepreciationData(helper) {
  try {
    console.log('🔄 Loading depreciation data, helper:', helper);
    
    // 2-WAY DATA FLOW: Check both locations for depreciation data
    const depreciationData = helper.final_report?.depreciation || helper.depreciation || null;
    
    if (depreciationData) {
      // Load global depreciation fields
      const globalPercent = depreciationData.globalDep1 || depreciationData.global_percent || '';
      document.getElementById('globalDep1').value = globalPercent;
      // ... (continues loading all depreciation fields)
    }
  }
  // ... (error handling)
}
```
- **Status**: Fully implemented
- **Purpose**: Loads depreciation data from helper object
- **Features**:
  - Checks multiple locations for data (2-way data flow)
  - Loads global depreciation values
  - Loads bulk depreciation items
  - Loads work days impact
  - Handles missing data gracefully

### 4. **updateHelperDepreciationField()**

#### In estimator-builder.html (Line 2655)
```javascript
function updateHelperDepreciationField(element, field) {
  console.log('📝 Update depreciation field:', field);
  // Implementation here
}
```
- **Status**: Stub function - not implemented
- **Purpose**: Intended to update depreciation fields in helper
- **Current State**: Only logs to console

#### In final-report-builder.html (Line 1956)
```javascript
function updateHelperDepreciationField(element, fieldName) {
  try {
    const helper = window.helper || {};
    if (!helper.depreciation) helper.depreciation = {};
    
    let value = element.value;
    
    // Handle different field types
    switch(fieldName) {
      case 'global_percentage':
        const cleanValue = value.replace('%', '').replace(/[^0-9.-]/g, '');
        helper.depreciation.global_percentage = parseFloat(cleanValue) || 0;
        calculateGlobalDepreciationValue();
        break;
      case 'work_days_impact':
        helper.depreciation.work_days_impact = parseInt(value) || 0;
        break;
      default:
        helper.depreciation[fieldName] = value;
    }
    
    helper.depreciation.last_updated = new Date().toISOString();
    sessionStorage.setItem('helper', JSON.stringify(helper));
  }
  // ... (error handling)
}
```
- **Status**: Fully implemented
- **Purpose**: Updates individual depreciation fields in real-time
- **Parameters**:
  - `element`: The input element that triggered the update
  - `fieldName`: The field name to update in helper.depreciation
- **Features**:
  - Real-time 2-way data flow
  - Special handling for global_percentage (cleans value, triggers calculation)
  - Special handling for work_days_impact (converts to integer)
  - Updates timestamp
  - Saves to sessionStorage immediately

### 5. **Additional Depreciation Functions**

#### removeDepField() (final-report-builder.html, Line 1992)
```javascript
function removeDepField(rowId) {
  const row = document.getElementById(rowId);
  if (row) {
    row.remove();
    saveDepreciationData();
  }
}
```
- **Purpose**: Removes a depreciation row and saves data

#### updateGlobalDepreciationCalculation() 
- **In estimator-builder.html** (Line 2670): Stub only
- **In final-report-builder.html** (Line 5152): Fully implemented
  - Calculates global depreciation value based on percentage and market value
  - Updates UI fields
  - Triggers related calculations

#### calculateGlobalDepreciationValue() (final-report-builder.html, Line 14259)
```javascript
function calculateGlobalDepreciationValue() {
  // Retrieves market value from multiple sources
  // Calculates depreciation value based on percentage
  // Updates UI and helper data
  // Saves to sessionStorage
}
```
- **Purpose**: Core calculation function for global depreciation
- **Features**:
  - Multiple fallback sources for market value
  - Handles percentage formatting
  - Updates both UI and data storage

#### updateDepreciationFromDamageCenters() (final-report-builder.html, Line 8755)
```javascript
function updateDepreciationFromDamageCenters(damageCenterNames) {
  // Creates depreciation rows based on damage centers
  // Pre-fills center numbers and damaged parts
  // Maintains synchronization between sections
}
```
- **Purpose**: Syncs depreciation section with damage centers
- **Features**:
  - Auto-creates rows for each damage center
  - Pre-fills center number and location
  - Preserves existing data

## Key Differences Between Files

### estimator-builder.html
- Contains mostly stub functions
- Limited depreciation functionality
- Functions are placeholders for future implementation

### final-report-builder.html
- Fully implemented depreciation system
- Complete CRUD operations for depreciation data
- Real-time calculations and data synchronization
- 2-way data binding with sessionStorage
- Integration with damage centers
- Visual feedback for user actions

## Data Flow
1. **Input**: User enters depreciation data in UI fields
2. **Real-time Update**: `updateHelperDepreciationField()` saves to sessionStorage
3. **Calculation**: `calculateGlobalDepreciationValue()` computes values
4. **Bulk Save**: `saveDepreciationData()` saves all data
5. **Load**: `loadDepreciationData()` restores data on page load
6. **Sync**: `updateDepreciationFromDamageCenters()` keeps data synchronized

## Storage Structure
Data is stored in sessionStorage under `helper` object:
```javascript
helper: {
  depreciation: {
    global_percentage: number,
    global_value: number,
    work_days_impact: number,
    bulk_items: [
      {
        center_number: string,
        damaged_part: string,
        repair_type: string,
        percent: number,
        value: number
      }
    ],
    last_updated: ISO string
  },
  final_report: {
    depreciation: { /* same structure */ }
  }
}
```
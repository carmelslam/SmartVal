<!-- 
🚨 CRITICAL DIRECTIVE: NEVER DELETE USER INSTRUCTIONS
This file contains important user documentation and task tracking.
All user notes and sections marked with user input must be preserved.
When making edits, only add new content - never remove existing user notes.
-->

# 📋 CONSOLIDATED TODO & TASK TRACKING
**Last Updated:** July 18, 2025  
**Purpose:** Unified task management for evaluation system development

---

## 🎯 USER INSTRUCTIONS & PROJECT GUIDELINES

### Standard Workflow
1. First think through the problem, read the codebase for relevant files, and write a plan to todo.md. copy the paln and afterwards a concise implementation report by tasks to the todo.md
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Add a review section to the todo.md file with a summary of the changes you made and any other relevant information.
8. Preserve the styling standards across files using: logos, signatures, colors, layouts, business name and so on to maintain a unified feel and experience across modules.
9. Finally, always refer to the documentation.md folder for context and overview of the system.

### Important Instruction Reminders
- Do what has been asked; nothing more, nothing less.
- NEVER create files unless they're absolutely necessary for achieving your goal.
- ALWAYS prefer editing an existing file to creating a new one.
- NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

---

# 📊 TASK STATUS OVERVIEW

## ✅ COMPLETED TASKS

### ✅ GROSS VS MARKET PRICE CATEGORIZATION FIX 
**Date:** July 17, 2025  
**Status:** COMPLETED  
**Issue:** "חישוב אחוז הנזק (הצג/הסתר)" section incorrectly pulling same data as market price calculation  
**Root Cause:** No distinction between car properties vs user usage adjustments  
**Solution:** Implemented proper categorization within unified helper structure  

#### Problem Analysis:
- Both gross price and market price sections processed all adjustments together
- System lacked proper distinction between:
  - **Car Properties**: base price + מאפיינים + עליה לכביש  
  - **User Usage**: ק"מ, סוג בעלות, מספר בעלים
- Helper structure needed enhancement to support categorization
- Data flow violated single source of truth principle

#### Solution Implemented:
1. ✅ **Enhanced helper.js CalculationInterface** with new functions:
   - `calculateGrossPrice()` - car properties only
   - `calculateMarketPrice()` - gross + usage factors  
   - `updateGrossCalculations()` - stores gross data separately
   - `updateMarketCalculations()` - stores market data separately

2. ✅ **Updated estimate-builder.html functions**:
   - `updateGrossMarketValueCalculation()` - now only processes מאפיינים + עליה לכביש
   - `updateGrossPercentageFromGrossValue()` - uses gross price, not market price
   - `updateFullMarketValueCalculation()` - processes usage factors separately

3. ✅ **Enhanced helper data structure** (maintaining unified architecture):
   - Added `damage_percent_gross` vs `damage_percent` distinction  
   - Added `vehicle_value_gross` vs `vehicle_value_market` separation
   - Added categorized adjustment storage: `gross_adjustments` & `market_adjustments`

4. ✅ **Updated UI clarity**:
   - "ערך הרכב הגולמי - מאפיינים ועליה לכביש בלבד"
   - "ערך השוק המלא - כולל גורמי שימוש"  
   - Added helpful descriptions distinguishing car properties vs usage factors

### ✅ LEGAL TEXT AUTO-SAVE AND LOAD ANALYSIS & ATTACHMENTS
**Status:** COMPLETED  
**Module:** Legal Texts System  

### ✅ DAMAGE CENTERS LAYOUT OPTIMIZATION
**Status:** COMPLETED  
**Module:** Estimate Report Builder  
**Issue:** Excessive white space in damage centers section  

#### Implementation Report:
- Analyzed `generateDamageAnalysis` function (lines 931-1178)
- Identified excessive margin/padding in multiple layers
- Optimized table structures and spacing
- Reduced redundant summary tables
- Improved vertical spacing efficiency

---

## 🔄 IN PROGRESS TASKS

### 🔄 MANUAL EDIT BUTTON NAVIGATION FIX
**Date:** July 14, 2025  
**Status:** IN PROGRESS  
**Module:** Estimate Validation  
**Issue:** "Manual Edit" (עריכה ידנית) button for Levi section incorrectly navigates to upload-levi.html instead of estimate-builder.html  
**Location:** estimate-validation.html, line 1791 in editSection function  

#### Problem Analysis:
- Found 4 manual edit buttons in estimate-validation.html (lines 540, 588, 651, 705)
- Each button calls `editSection()` function with different parameters
- The Levi section button (line 588) calls `editSection('levi')`
- Current navigation in editSection function (line 1791): goes to 'upload-levi.html'
- Should navigate to estimate-builder.html like other sections

#### Plan:
1. ✅ **Identify the issue** - Located editSection function and problematic navigation
2. ⏳ **Fix navigation** - Change levi case to redirect to estimate-builder.html
3. ⏳ **Verify consistency** - Ensure all manual edit buttons go to builder interface
4. ⏳ **Test functionality** - Confirm button works correctly

#### Current editSection Function Analysis:
- vehicle: ✅ Goes to estimate-builder.html#vehicle-details (correct)
- levi: ❌ Goes to upload-levi.html (should go to builder)
- damage: ✅ Goes to damage-center-flow.html (correct)
- estimate: ✅ Goes to estimate-builder.html#estimate-type (correct)

---

## ❌ BLOCKED/PENDING TASKS

### ❌ INTEGRATION ISSUES
**Module:** Various  
**Status:** Needs Investigation  
- Helper file integration inconsistencies
- Data flow standardization
- Cross-module communication

---

# 🗂️ TASKS BY MODULE

## 📊 HELPER SYSTEM
### ✅ Completed
- Enhanced CalculationInterface with gross vs market price categorization
- Implemented proper data flow architecture
- Added categorized adjustment storage

### ⏳ Pending
- Data validation improvements
- Cross-module integration testing
- Performance optimization

## 📝 ESTIMATE BUILDER
### ✅ Completed
- Gross vs market price distinction implementation
- UI clarity improvements
- Calculation function updates

### ⏳ Pending
- Additional validation features
- Enhanced user experience improvements

## 🔍 ESTIMATE VALIDATION
### 🔄 In Progress
- Manual edit button navigation fix for Levi section

### ⏳ Pending
- Comprehensive validation rule updates
- Error handling improvements

## 📄 REPORT GENERATION
### ✅ Completed
- Damage centers layout optimization
- Legal text system implementation

### ⏳ Pending
- PDF generation enhancements
- Template system improvements

## 🔧 LEVI INTEGRATION
### 🔄 In Progress
- Portal URL fix to include /levicars/ path
- Manual edit button navigation fix

### ⏳ Pending
- OCR processing improvements
- Data mapping enhancements

## 🚗 PARTS SEARCH
### ✅ Completed
- Import path fixes (credentials vault)
- Search functionality optimization

### ⏳ Pending
- Integration with car-part.co.il improvements
- Search result filtering enhancements

## 🔐 SECURITY & CREDENTIALS
### ✅ Completed
- Credentials vault organization
- Internal browser security improvements

### ⏳ Pending
- Additional security measures
- Credential management enhancements

---

# 📚 DOCUMENTATION & HISTORY

## System Architecture Notes
- Unified helper structure maintains single source of truth
- Data flow standardization across modules
- Modular design for maintainability

## Integration Points
- Helper system serves as central data store
- Internal browser integration for external portals
- Webhook integration for external processing

## Performance Considerations
- Minimize code changes per task
- Maintain simplicity in implementations
- Preserve styling consistency across modules

---

# 🔄 WORKFLOW INTEGRATION

## Estimate Workflow Summary
1. **Case Initialization**: Car details input and validation
2. **Valuation**: Levi portal integration for market value assessment
3. **Damage Assessment**: Multi-center damage evaluation
4. **Calculation**: Gross vs market price distinction with proper categorization
5. **Parts Search**: Integration with car-part.co.il for cost estimates
6. **Legal Text**: Dynamic legal text generation based on estimate type
7. **Report Generation**: Comprehensive PDF report creation
8. **Export**: Final report delivery via Make.com integration

## Integration Points:
- **Floating Screens**: Quick access to damage centers, depreciation
- **Vault System**: Dynamic legal text and attachments
- **Make.com API**: External processing and notifications
- **Session Management**: Data persistence across the workflow

---

**Note:** This consolidated file merges content from todo.md and todo2.md while preserving all user instructions and maintaining proper organization by module and status.
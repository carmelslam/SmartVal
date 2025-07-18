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
1. First think through the problem, read the codebase for relevant files, and write a plan to todo.md. Copy the plan and afterwards a concise implementation report by tasks to the todo.md
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

# 🚨 COMPREHENSIVE USER AUDIT & TASK INSTRUCTIONS

**GENERAL NOTES AND THINGS TO FIX - USER INSTRUCTIONS**

## Audit 3 Comprehensive System Review
Read all the issues that were found in audit 3. Go through the issues I found. Learn them and evaluate throughout the whole system files, detect connections, relations and dependencies and evaluate functionality.
Run your own deep check and conclude the issues broadness inside the system.
After understanding all the issues and running a comprehensive audit combined with my list, create a plan to fix the issues. The plan needs to be a task by task plan, DO NOT attempt to include everything in one go. The plan needs to fix issues first targeting foundation and root symptoms that run throughout the whole system and then targeting each module/issue separately.

## System-Wide Requirements:
- **All reports, builders, floating screens, and main system products** are updated and filled from the helper directly
- **Validation pages** are updated from builders to make edit and error mapping easier
- **Data persistence:** The data in the system should be saved in the system until the next case is loaded/created. Always to have the last case details
- **Automatic logout:** needs to happen just if the user doesn't use the system for 15 min, for now the session is closing while working
- **On logout:** system sends the last helper to make.com and gives it a name: plate_helper_timestamp
- **Single case handling:** The system doesn't handle more than one case at a time

## Critical System Issues Found:

### 1. ✅ Open new case - redirects to password page and logs out - FIXED

### 2. ✅ Logo Animation - Slow down the logo spin and make it stop halfway - FIXED

### 3. ✅ Levi Report Page Issues - FIXED:
- Ensure password is prefilled from session storage
- Keep general page styling, fix specific styling issues
- Re-arrange buttons: Action buttons side by side, navigation buttons side by side
- Browser error: "The page cannot be displayed because an internal server error has occurred"
- Remove דפדפן toggle from top, move to selection page in orange style
- Fix title, business name, and site name style to match system
- Report toggle דו"ח לוי improvements with correct OCR field mapping
- OCR JSON Structure implemented:
```json
{
  "סוג רכב": "", "יצרן": "", "קוד דגם": "", "קטגוריה": "",
  "שנת יצור": "", "שם דגם מלא": "", "מחיר בסיס": "", "מחיר סופי לרכב": "",
  "התאמות מחיר": {
    "עליה לכביש": {"עליה לכביש": "", "עליה לכביש %": "", "ערך ש״ח עליה לכביש": "", "שווי מצטבר עליה לכביש": ""},
    "סוג בעלות": {"בעלות": "", "בעלות %": "", "ערך ש״ח בעלות": "", "שווי מצטבר בעלות": ""},
    "מספר ק״מ": {"מס ק״מ": "", "מס ק״מ %": "", "ערך ש״ח מס ק״מ": "", "שווי מצטבר מס ק״מ": ""},
    "מספר בעלים": {"מספר בעלים": "", "מספר בעלים %": "", "ערך ש״ח מספר בעלים": "", "שווי מצטבר מספר בעלים": ""},
    "מאפיינים": {"מאפיינים": "", "מאפיינים %": "", "ערך ש״ח מאפיינים": "", "שווי מצטבר מאפיינים": ""}
  }
}
```

### 4. ✅ Multi Pictures Upload Page - FIXED:
- Add password field prefilled from session storage
- Fix upload function for mobile/iPad/desktop support (gallery, files, camera)
- Improve layout of function buttons (העלה תמונות, עוד אפשרויות)
- Enhanced dropdown functionality for מוקד נזק:
  - Free text input option
  - "All pictures" option
  - Helper damage center descriptions when available
  - "לא הוזנו מוקדי נזק" when helper data unavailable

### 5. ✅ Invoice Upload Page - FIXED:
- Password prefilling from session storage
- Title style matching system standards

### 6. ✅ Depreciation Module - FIXED:
- Button font size corrections to match system style
- Auto-fill from helper with override capability
- Override updates helper and becomes source of truth
- Floating screen toggles improvements:
  - Fix toggle buttons display (were showing as one pipe)
  - Add names to toggle functions
  - Include: Levi report, car details floating, internal browser, invoice details floating
- Case ID display instead of plate number
- Summary fields with "הוסף שדה" option for free text (name field + value field)
- Auto-calculation for all relative fields from helper data
- Enhanced הפרשים section:
  - VAT value for each line and total cost
  - Architecture: תיאור הפרש displays invoice items, user selects, cost/VAT auto-populated
  - Total section: סה"כ הפרשים (without VAT), accumulated VAT field, total cost with VAT
  - סה"כ סופי עם הפרשים moved to separate section as final adjusted value

### 7. ✅ Admin Hub - FIXED:
- Administrator hub access and password validation error resolved
- Access denied issue fixed

### 8. ✅ Selection Page - FIXED:
- Report selection 404 error resolved
- Total selection page makeover reflecting workflow logic
- Report workflow implementation
- Broken link fixes

### 9. ✅ Report Selection Page - FIXED:
**Logic improvements for data persistence:**
- When selecting report option, pages behave based on previous work
- Empty forms if no previous work, pre-filled if work exists
- Helper data pulled and forms refilled for continuing work
- Plate number and password fields added with auto-prefill
- Two options: input plate number or "טען תיק קיים" message
- Upload existing case button integration
- Create new case button logic clarification

### 10. ✅ Nicole Knowledge Manager - FIXED:
- Made text/audio fields optional (at least one required)
- Fixed error: "The string did not match the expected pattern"
- Microphone functionality improvements (audio-capture error handling)
- Styling updates:
  - Microphone color: dark blue
  - Send query button: system green
  - Response icon: 👩 (Nicole's emoji instead of 🤖)
  - TTS response feature added

### 11. ❌ System Help Assistant - NOT FIXED (LOW PRIORITY):
**Purpose:** Help users with system technical actions, workflows, debugging, error handling
- Build comprehensive guide for complex technical questions
- Add graphic workflow display functionality
- Suggest next steps after user completes actions
- Add extensive admin hub assistance
- **Ensure floating assistant visibility on all pages (MEDIUM PRIORITY)**

### 12. ❌ Push Notifications - HIGH PRIORITY:
**OneSignal Integration Issues:**
- Chrome and iPhone can subscribe, Mac Safari doesn't register subscription
- iPhone receives push, Mac doesn't receive despite Chrome subscription
- No subscription prompt appearing
- "התראות כבויות" message shows with no enable option
- **Ensure OneSignal enabled on all pages**

### 13. ❌ Damage Wizard Module - HIGH PRIORITY:
**Most critical system component needing comprehensive work:**

#### Current Issues:
1. **Missing input fields** - fields for input missing in all bulks (name, description, work)
2. **Repairs missing** from wizard - needs to be added
3. **Parts search duplication** - opens new search page instead of required parts module
4. **Parts integration problems** - need to combine enhancements from wizard parts search
5. **Missing summary** - no status dropdown, additional details/comments, summary section
6. **Form creation issues** - search form not being created properly

#### Implementation Requirements:
- **Wizard integration** with parts module combination
- **Parts logic redesign:** Wizard → Search module → Helper storage → Required parts → Auto suggestions → User selection → Add part/fix display
- **Selected parts storage** in expertise builder and helper
- **End of wizard flow:** Add new מוקד נזק or continue to summary (not upload pictures)
- **Summary section:** Use ready expertise summary HTML with status dropdown and details
- **Deep understanding required** of logic, flow, current structure, and all repository files
- **Logic rebuilding** from scratch combining all expertise-related files

### 14. ✅ Orphan Pages - FIXED:
- **Pages integrated:** validation workflow, validation dashboard, test dashboard, debug login
- **Admin hub integration** completed
- **Dynamic real-time information** display implemented

### 15. Fee Module - MEDIUM PRIORITY:
- **Add return to selection button** under continue button

### 16. Automatic Logout - HIGH PRIORITY:
- **15-minute inactive timeout** (currently logging out while working)
- **2-minute warning** before logout (minute 13)
- **Activity detection:** mouse movement or screen touch resets countdown
- **Active use detection:** countdown disabled during system use

### 17. ✅ Report Generation Workflow - FIXED:
- **Validation process** before report generation implemented
- **Estimate and final report validation** required
- **Generate report module** as only place for report generation (except expertise)
- **Expertise workflow:** generates expertise report and draft report separately

---

# 📊 VALIDATION LOGIC, STRUCTURE AND PAGES

## ✅ Validation System Architecture - HIGH PRIORITY COMPLETED

### Validation Requirements:
**Report Types Requiring Validation:**
- Expertise Report
- Estimate Report (both types)  
- Final Report (all types)

### Two-Level Validation System:

#### System Level Validation:
- Automatically checks validity and integrity of report sections
- Checks for gaps and misalignments
- Extracts main information (titles, descriptions, properties)
- Calculates total costs
- **Legal Text:** Displays correct legal text in editable window requiring validation

#### User Level Validation:
- Reviews automatic validation results
- Edits fields or legal text as needed
- Saves and confirms changes
- **User modifications become system truth**

### Validation Page Structure by Report Type:

#### Expertise Validation:
- Car + General Details
- Levi Report Upload  
- Damage Centers: Name, Description, Works (total + costs), Parts (total + costs), Repairs (total + costs)
- Summary: Status and Comments
- **All editable and can be ignored if missing**

#### Estimate Report Validation:
- Based on Final Report HTML Builder
- Car + General Details
- Levi Report Upload
- Damage Centers: Name, Description, Works (total + costs), Parts (total + costs), Repairs (total + costs)
- **Legal Text:** Editable window with validation requirement
- **All editable and can be ignored if missing**

#### Final Report Validation:
- Fee Module integration
- Car + General Details
- Levi Report Upload
- Damage Centers with full breakdown
- Levi Price Adjustments Calculations: Base Price, Adjustments, Damage Percentage, Market Price
- Depreciation Module Integrity: Per damage center and global
- Final Report Summary
- **Legal Text:** Editable window with validation requirement

### ✅ Estimate Validation Page Implementation - COMPLETED:

#### Current Features:
1. ✅ **Data Source Hierarchy:** Builder → Helper fallback → Direct helper (minimized)
2. ✅ **Damage center subtotals** pulled from damage center sections
3. ✅ **Automatic system validation** checks data integrity
4. ✅ **Three-column display:** Value, Stored Data, Ignore Option for ❌ validations
5. ✅ **Editable fields:** Updates become source of truth in helper and report
6. ✅ **User validation section** maintained
7. ✅ **Report review integration:** "בדוק אומדן" button shows filled report builder
8. ✅ **Final confirmation:** User authorization in estimate builder

#### Technical Implementation:
- **Data Flow:** Helper → Builder → Validation (with update loops back to Helper)
- **Builder updates:** DOM changes → "Save Estimate" → Helper override → Validation retrieval
- **Adjustments section:** תוספות והורדות pulls from Helper with descriptions, percentages, values
- **Edit integration:** Builder or Validation edits update Helper accordingly
- **Validation fallback:** Minimal direct Helper access only when Builder data missing

#### Recent Fixes Applied:
- ✅ **Damage validation section** updates after builder changes
- ✅ **Subtotal calculations** corrected (תיקונים sums repairs only, not parts+works)
- ✅ **Work cost definitions** fixed (no predefined costs, case-specific pricing)
- ✅ **New damage center calculations** working properly
- ✅ **Builder integration:** תוספות נוספות added to תוספות והורדות
- ✅ **Date selector** for תאריך הפקה with helper integration
- ✅ **Expertise review option** added with PDF floating screen
- ✅ **Save and refresh buttons** in each section
- ✅ **Work dropdown "other" option** opens text input
- ✅ **Depreciation data persistence** (מהות התיקון saved to helper)
- ✅ **Legal text save** to helper for specific plate numbers

#### Validation Page Enhancements:
- ✅ **Floating screens** with full functionality from builder
- ✅ **Depreciation section** added with builder integration
- ✅ **Legal text source** changed from vault to builder
- ✅ **Button functionality** verified and working
- ✅ **Adjustment section** pulls from market calculation (not gross)
- ✅ **Legal text check button** fixed
- ✅ **Section validation persistence** prevents page resets
- ✅ **Progress scale accuracy** (התקדמות האימות) with proper measurement
- ✅ **Sequential validation** - can't proceed without validating previous sections

---

# ❌ PENDING HIGH PRIORITY TASKS

## ❌ Push Notifications System - HIGH PRIORITY
**Status:** Critical functionality not working
**Issues:** 
- No subscription prompts
- Cross-platform compatibility problems
- OneSignal integration incomplete

## ❌ Damage Wizard Module - HIGH PRIORITY  
**Status:** Most critical system component requiring complete rebuild
**Issues:**
- Missing input fields across all sections
- Parts search duplication and integration problems
- No repairs section in wizard
- Missing summary and status functionality
- Requires comprehensive logic redesign

## ❌ Case Status Displays - HIGH PRIORITY
**Status:** Broken admin functionality
**Issues:**
- Previously operational functions now broken
- Console errors preventing proper operation
- Admin hub core functionality affected

## ❌ Final Report Workflow - NEEDS IMPLEMENTATION
**Status:** Major workflow missing
**Requirements:**
- Match estimate workflow structure
- Depreciation module alignment with estimate builder
- Validation page remake following estimate validation logic
- Report builder enhancement with fee sections
- Multiple report types support (agreement/disagreement, company reports)
- Differences section (הפרשים) calculations

---

# 🔄 IN PROGRESS TASKS

## 🔄 Manual Edit Button Navigation Fix
**Date:** July 14, 2025  
**Status:** IN PROGRESS  
**Module:** Estimate Validation  
**Issue:** "Manual Edit" (עריכה ידנית) button for Levi section incorrectly navigates to upload-levi.html instead of estimate-builder.html  
**Location:** estimate-validation.html, line 1791 in editSection function  

### Problem Analysis:
- Found 4 manual edit buttons in estimate-validation.html (lines 540, 588, 651, 705)
- Each button calls `editSection()` function with different parameters
- The Levi section button (line 588) calls `editSection('levi')`
- Current navigation in editSection function (line 1791): goes to 'upload-levi.html'
- Should navigate to estimate-builder.html like other sections

### Plan:
1. ✅ **Identify the issue** - Located editSection function and problematic navigation
2. ⏳ **Fix navigation** - Change levi case to redirect to estimate-builder.html
3. ⏳ **Verify consistency** - Ensure all manual edit buttons go to builder interface
4. ⏳ **Test functionality** - Confirm button works correctly

### Current editSection Function Analysis:
- vehicle: ✅ Goes to estimate-builder.html#vehicle-details (correct)
- levi: ❌ Goes to upload-levi.html (should go to builder)
- damage: ✅ Goes to damage-center-flow.html (correct)
- estimate: ✅ Goes to estimate-builder.html#estimate-type (correct)

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
The damage centers section was generated by the `generateDamageAnalysis` function (lines 931-1178) and created excessive white space due to several layout issues:

#### Key Problems Identified:
1. **Excessive Margin/Padding in Multiple Layers**:
   - `.car-details` has 20px margin-bottom + 15px padding (lines 64-65)
   - `.section` has 20px margin-bottom + 15px margin-top (lines 39-44)
   - Individual category sections have 15px margin-bottom (lines 1013, 1040, 1067)
   - Summary tables have additional 15px margin-top (line 1089)

2. **Redundant Table Structure**:
   - Each damage center creates separate tables for works, parts, and repairs
   - Each table has its own header and spacing
   - Multiple summary tables with similar information

3. **Excessive Vertical Spacing**:
   - Large padding in table cells (8px on all sides)
   - Unnecessary line breaks between sections
   - Redundant spacing in summary calculations

#### Optimization Solutions Applied:
- Reduced excessive margins and padding across multiple layers
- Consolidated table structures where appropriate
- Optimized vertical spacing for better page utilization
- Improved summary table organization
- Enhanced print layout efficiency

---

# 🗂️ TASKS BY MODULE

## 📊 HELPER SYSTEM
### ✅ Completed
- Enhanced CalculationInterface with gross vs market price categorization
- Implemented proper data flow architecture
- Added categorized adjustment storage
- Data persistence and source of truth implementation

### ⏳ Pending
- Cross-module integration testing
- Performance optimization
- Enhanced validation features

## 📝 ESTIMATE BUILDER
### ✅ Completed
- Gross vs market price distinction implementation
- UI clarity improvements with descriptive labels
- Calculation function updates and validation
- Save functionality with helper integration
- Date selectors and form enhancements
- Legal text integration and persistence

### 🔄 In Progress
- Manual edit button navigation fixes

### ⏳ Pending
- Additional validation features
- Enhanced user experience improvements

## 🔍 ESTIMATE VALIDATION
### ✅ Completed
- Comprehensive validation page implementation
- Data source hierarchy (Builder → Helper)
- Automatic system validation with three-column display
- Editable fields with helper updates
- Floating screens integration
- Depreciation section integration
- Progress tracking and sequential validation

### 🔄 In Progress
- Manual edit button navigation fix for Levi section

### ⏳ Pending
- Final testing and edge case handling

## 📄 REPORT GENERATION
### ✅ Completed
- Damage centers layout optimization
- Legal text system implementation
- Estimate report builder integration
- PDF generation preparation

### ⏳ Pending
- Final report builder enhancements
- Template system improvements
- Export functionality completion

## 🔧 LEVI INTEGRATION
### ✅ Completed
- Portal URL fix to include /levicars/ path
- OCR data structure implementation
- Price adjustment categorization
- Floating screen integration

### 🔄 In Progress
- Manual edit button navigation fix

### ⏳ Pending
- OCR processing improvements
- Data mapping enhancements

## 🚗 PARTS SEARCH
### ✅ Completed
- Import path fixes (credentials vault)
- Search functionality optimization
- Basic integration improvements

### ❌ Critical Issues
- **Damage wizard integration** (HIGH PRIORITY)
- Parts search duplication resolution
- Required parts module integration

## 🔐 SECURITY & CREDENTIALS
### ✅ Completed
- Credentials vault organization
- Internal browser security improvements
- Password prefilling system implementation

### ⏳ Pending
- Additional security measures
- Enhanced credential management

## 👤 USER INTERFACE
### ✅ Completed
- Nicole knowledge manager improvements
- Selection page makeover
- Admin hub functionality restoration
- Floating screen implementations

### ❌ Critical Issues
- **Push notifications** (HIGH PRIORITY)
- System help assistant (LOW PRIORITY)
- Font system updates (MEDIUM PRIORITY)

## ⚙️ ADMIN SYSTEM
### ✅ Completed
- Admin hub access restoration
- Data override module implementation
- Case status search improvements

### ❌ Critical Issues
- **Case status displays** (HIGH PRIORITY)
- Admin panel menu system completion

---

# 📚 WORKFLOW INTEGRATION

## Estimate Workflow Summary - ✅ COMPLETED
1. **Case Initialization**: Car details input and validation
2. **Valuation**: Levi portal integration for market value assessment
3. **Damage Assessment**: Multi-center damage evaluation with wizard integration
4. **Calculation**: Gross vs market price distinction with proper categorization
5. **Parts Search**: Integration with car-part.co.il for cost estimates
6. **Legal Text**: Dynamic legal text generation based on estimate type
7. **Validation**: Comprehensive validation process before report generation
8. **Report Generation**: Estimate report builder with PDF generation
9. **Export**: Final report delivery via Make.com integration

## Final Report Workflow - ❌ NEEDS IMPLEMENTATION
1. **Case Initialization**: Same as estimate workflow
2. **Valuation**: Same as estimate workflow
3. **Damage Assessment**: Same as estimate workflow
4. **Calculation**: Enhanced with depreciation and fee calculations
5. **Parts Search**: Same as estimate workflow
6. **Invoice Integration**: Actual work costs vs estimated costs
7. **Depreciation Module**: Global and per-center depreciation calculations
8. **Differences Calculation**: Invoice vs authorization differences (הפרשים)
9. **Fee Module**: Photography, office, travel, assessment fees
10. **Validation**: Final report validation process
11. **Report Generation**: Final report builder with multiple types
12. **Export**: Final report delivery via Make.com integration

## Integration Points:
- **Floating Screens**: Quick access to damage centers, depreciation, car details, invoice details
- **Vault System**: Dynamic legal text and attachments based on report type
- **Make.com API**: External processing and notifications
- **Session Management**: Data persistence across the workflow
- **Helper System**: Single source of truth for all data throughout workflows

---

**Note:** This consolidated file merges content from todo.md and todo2.md while preserving all user instructions and maintaining proper organization by module and status. All content and history have been preserved while improving organization and adding clear status tracking.
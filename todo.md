<!-- 
🚨 CRITICAL DIRECTIVE: NEVER DELETE USER INSTRUCTIONS
This file contains important user documentation and task tracking.
All user notes and sections marked with user input must be preserved.
When making edits, only add new content - never remove existing user notes.
-->

# 📋 CONSOLIDATED TODO & TASK TRACKING
**Last Updated:** July 23, 2025  
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

# 🔧 RECENT IMPLEMENTATION & DATA FLOW ANALYSIS

## ✅ COMPLETED RECENT FIXES (July 2025)

### Data Synchronization & Helper System Improvements:
1. **✅ Field Naming Standardization** - Fixed critical inconsistencies between HTML forms and helper.js:
   - `ownerPhone` → `owner_phone` in general_info.html
   - `garageName` → `garage_name` in general_info.html  
   - `garagePhone` → `garage_phone` in general_info.html
   - Synchronized all form field IDs with helper expectations

2. **✅ Session Management Conflict Resolution** - Fixed 15-minute auto-logout conflict:
   - Synchronized logout timers between index.html (was 10min) and security-manager.js (15min)
   - Eliminated data loss during active work sessions
   - Unified session timeout across all system components

3. **✅ Duplicate Data Storage Elimination** - Implemented centralized data management:
   - Created `setPlateNumber()` and `getPlateNumber()` functions in helper.js
   - Created `setOwnerName()` and `getOwnerName()` functions in helper.js
   - Added automatic plate normalization (removes dashes: 221-84-003 → 22184003)
   - Eliminated storage in 4+ different locations for plate, 3+ for owner name

4. **✅ Hebrew Field Translation & Mapping** - Verified and enhanced webhook processing:
   - Hebrew webhook field mapping verified in field-mapping-dictionary.js
   - Webhook processing confirmed functional in webhook.js
   - All major Hebrew field translations operational

5. **✅ Levi Floating Screen Enhancements** - Fixed missing data mappings:
   - **Reordered adjustment sections** as requested: מאפיינים → עליה לכביש → סוג בעלות → מספר ק״מ → מספר בעלים
   - **Fixed percentage field mappings** with multiple variations support:
     - עליה לכביש % (Registration percentage)
     - בעלות % (Ownership percentage)  
     - מס ק״מ % (Mileage percentage) - with quotation mark variations
     - מספר בעלים % (Number of owners percentage)
     - מחיר מאפיינים % (Features percentage)
   - **Fixed value field mappings**:
     - ערך ש״ח בעלות (Ownership value)
     - ערך ש״ח מס ק״מ (Mileage value)
     - ערך ש״ח מספר בעלים (Number of owners value)
     - תיאור מאפיינים (Features description)
   - **Added debugging support** for percentage field detection

## 🔄 IN PROGRESS

### Code Cleanup Initiative:
- **486+ console.log statements** - Currently removing debug output from production files
- **67+ alert statements** - Replacing with proper user notifications
- **45KB+ test/debug code** - Cleaning up development artifacts

## ⏳ PENDING HIGH PRIORITY TASKS

### Data Flow Validation:
- Add comprehensive validation to ensure data properly flows: Make.com → Helper → UI forms
- Fix broken connections between modules where data isn't properly passed
- Add missing form validations (email patterns, phone formats, required fields)

---

# Data Flow Standardizer Analysis and Conflict Resolution

## Analysis Overview

After examining both the `data-flow-standardizer.js` and `helper.js` files, I've identified several critical conflicts and synchronization issues between the proposed unified schema and the actual helper structure.

## Plan: Data Flow Standardizer Conflict Resolution

### 1. ✅ Analyze Current Data Structure Conflicts
- **Status**: COMPLETED
- **Findings**: The standardizer attempts to unify data from different sources but conflicts with the actual helper.js structure

### 2. 🔄 Identify Field Name Mismatches
- **Status**: IN PROGRESS
- **Key Issues Found**:
  - Plate field inconsistencies: `plate` vs `plate_number`
  - Case ID generation conflicts
  - Missing protection mechanisms in standardizer
  - Valuation structure differences

### 3. ⚠️ Document Migration Logic Issues
- **Status**: PENDING
- **Critical Problems**:
  - Damage date auto-population conflicts
  - Report type handling inconsistencies
  - Legacy compatibility issues

### 4. ⚠️ Review Schema Validation Conflicts
- **Status**: PENDING
- **Problems**:
  - Validation rules don't match helper reality
  - Missing critical fields in unified schema

### 5. ⚠️ Propose Standardization Fixes
- **Status**: PENDING
- **Required Changes**:
  - Align field names with helper.js
  - Fix migration logic
  - Update validation rules

## Critical Conflicts Identified

### 1. **Plate Number Management**
- **Conflict**: Standardizer uses `plate` throughout, but helper has protection mechanisms with `original_plate`, `plate_locked`, `plate_protection_source`
- **Impact**: High - Could overwrite protected plate numbers
- **Fix Required**: Integrate plate protection logic into standardizer

### 2. **Case Information Structure**
- **Conflict**: 
  - Standardizer: Simple `case_info` with basic fields
  - Helper: Complex protection and dynamic generation logic
- **Impact**: Medium - Case metadata could be lost
- **Fix Required**: Preserve helper's case management logic

### 3. **Damage Assessment Data Flow**
- **Conflict**: 
  - Standardizer: Tries to merge `damage_blocks` and `damage_centers`
  - Helper: Uses structured `damage_assessment.centers` array
- **Impact**: High - Could cause data loss during migration
- **Fix Required**: Update standardizer to match helper structure

### 4. **Valuation Field Mapping**
- **Conflict**:
  - Standardizer: Generic adjustment structure
  - Helper: Specific Levi integration fields like `levi_code`, `levi_model_code`
- **Impact**: Medium - Levi-specific data could be lost
- **Fix Required**: Add Levi-specific fields to unified schema

### 5. **Financial Structure Differences**
- **Conflict**:
  - Standardizer: Simplified cost breakdown
  - Helper: Complex override system with manual modification tracking
- **Impact**: High - User manual changes could be lost
- **Fix Required**: Integrate override system into standardizer

### 6. **System Metadata Inconsistencies**
- **Conflict**:
  - Standardizer: Basic validation status flags
  - Helper: Detailed processing history and integration status
- **Impact**: Medium - System state tracking could be compromised
- **Fix Required**: Expand system metadata in unified schema

## Implementation Report

### Recent Changes Made
- ✅ Fixed critical field naming inconsistencies in general_info.html
- ✅ Synchronized session timeout conflicts between components
- ✅ Implemented centralized plate/owner management with normalization
- ✅ Enhanced Levi floating screen with proper Hebrew field mappings
- ✅ Added percentage field mapping support with multiple variations
- 🔄 Code cleanup initiative in progress (removing debug statements)

### Files Modified  
- `general_info.html` - Field name standardization
- `index.html` - Session timeout synchronization
- `helper.js` - Centralized data management functions
- `levi-floating.js` - Enhanced field mappings and debugging
- `security-manager.js` - Session management verification

### Tests Performed
- ✅ Form field mapping verification
- ✅ Session timeout conflict resolution testing
- ✅ Plate normalization functionality testing
- ✅ Hebrew field mapping validation

## Review Section

### Summary of Changes
The recent implementation phase focused on foundational data synchronization issues that were causing system-wide problems. Key achievements include eliminating duplicate data storage, standardizing field naming conventions, and fixing critical session management conflicts. The Levi floating screen enhancements specifically addressed the user's screenshot requirements for proper percentage and value field display.

### Relevant Information
All changes maintain backward compatibility while establishing a more robust data flow architecture. The centralized helper functions provide a single source of truth for critical data elements, reducing the complexity identified in the original audit. The debugging enhancements will help identify any remaining data flow issues during system operation.

---
*Last Updated: July 23, 2025*
*Analysis by: Claude Code Assistant*
*User Content Preserved and Merged*
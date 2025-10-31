# TASK: Invoice Assignment System with Version Control

**Session**: 88  
**Date**: October 31, 2025  
**Priority**: HIGH  
**Risk Level**: MEDIUM - Touches core data flow but uses existing architecture  

---
# Invoice Assignment System - Architecture & Logic Overview

**Document Type**: Strategic Architecture & Flow Description  
**Date**: October 31, 2025  
**Purpose**: Explain the system's intended behavior, architecture decisions, and user workflows

---

## EXECUTIVE SUMMARY

### The Problem We're Solving

Users need to incorporate actual invoice data (from repair shops) into their final reports, but the current system has no way to do this without:
1. Manually retyping all invoice information
2. Losing the original wizard estimates
3. Affecting all reports and modules unintentionally

### The Solution We're Building

A **version-controlled data management system** that allows users to:
1. Import invoice data to replace wizard estimates (by choice, not automatically)
2. Maintain a complete history of all data states
3. Show different data to different report types (private vs standard)
4. Restore previous versions whenever needed
5. Make the system synchronized (all modules see same current data)

### The Core Philosophy

**"Work on latest, archive the past, restore when needed"**

Like how users currently manage files in OneDrive:
- They work on the latest version of a document
- Old versions are saved for reference
- They can view old versions and restore them if needed
- They don't work on multiple versions simultaneously

---

## PART 1: CURRENT STATE (THE PROBLEMS)

### Problem 1: No Way to Import Invoice Data

**Current Behavior:**
- User receives invoices from repair shop after work is complete
- Invoice contains actual parts used and costs
- User has NO systematic way to import this data
- Must manually retype everything, which is error-prone and time-consuming

**Example:**
```
Wizard Estimate (Before Repair):
- Front bumper: ₪2,000 (estimated)
- Labor: ₪500 (estimated)
- Paint: ₪800 (estimated)

Actual Invoice (After Repair):
- Front bumper OEM: ₪2,500 (actual)
- Labor 6 hours: ₪900 (actual)
- Premium paint: ₪1,200 (actual)
- Additional rust repair: ₪600 (not estimated)

Currently: User must manually type all invoice data with no help
```

### Problem 2: No Historical Data Protection

**Current Behavior:**
- All modules (wizard, estimate, expertise, final report) read from one source: `helper.centers`
- When user updates `helper.centers`, ALL modules see the change immediately
- Original wizard estimates are lost forever
- No way to see "what did I estimate before the invoice arrived?"

**Example:**
```
Timeline:
Day 1: User creates estimate → ₪3,300 total
Day 5: User gets invoice, updates wizard → ₪5,200 total
Day 7: User needs to see original estimate → LOST FOREVER

The original ₪3,300 estimate is gone, no way to retrieve it
```

### Problem 3: Version Saving Not Working Properly

**Current Behavior:**
- Manual logout DOES save helper version to Supabase ✅
- System timeout logout does NOT save version ❌
- 3-hour auto-save rule does NOT work ❌
- Report submissions (estimate/expertise) do NOT create versions ❌

**Impact:**
- Users lose work if system logs them out
- No automatic backup of work every 3 hours
- No snapshots of data state when reports are submitted

### Problem 4: Final Report Doesn't Save Properly

**Current Behavior:**
- User makes changes in Final Report Builder damage centers section
- Changes save to localStorage (browser memory) only
- Changes do NOT save to Supabase database
- User must go to wizard and save there for Supabase update

**Impact:**
- Data loss risk if browser cleared
- Confusing workflow (why can't I save here?)
- Inconsistent with estimator (which DOES save to Supabase)

### Problem 5: No Differentiation Between Report Types

**Current Behavior:**
- All 5 final report types show identical data
- No way to show invoice data in private report but wizard estimates in others
- Private reports (for clients) should show actual costs
- Standard reports (for insurance/court) should show original estimates

---

## PART 2: DESIRED STATE (THE SOLUTION)

### Solution Overview: Version Control System

The system will work like **Git for reports**:
- Users work on the LATEST version (helper.centers)
- Every significant change creates a VERSION in Supabase
- Users can VIEW old versions anytime
- Users can RESTORE old versions if needed
- System is SYNCHRONIZED (all modules see same current data)

### Key Concept: Working State vs Historical Versions

```
┌─────────────────────────────────────────────┐
│           WORKING STATE (Current)            │
│              helper.centers                  │
│                                              │
│  This is what the user sees and edits NOW   │
│  This is the "latest" version               │
│  All modules read from here                 │
└─────────────────────────────────────────────┘
                    │
                    │ Creates versions ↓
                    ▼
┌─────────────────────────────────────────────┐
│     HISTORICAL VERSIONS (Supabase)          │
│                                              │
│  v1: Initial wizard estimate (Oct 1)        │
│  v2: After expertise submitted (Oct 3)      │
│  v3: Before invoice import (Oct 10) ← KEY!  │
│  v4: After invoice import (Oct 10)          │
│  v5: After user edits (Oct 12)              │
│                                              │
│  These are READ-ONLY archives               │
│  User can VIEW them                         │
│  User can RESTORE them to current           │
└─────────────────────────────────────────────┘
```

### Principle 1: ONE Working State

**Rule**: At any given time, there is ONE active working state (helper.centers)

**Why**: 
- Simplicity - no confusion about "which data is current?"
- Synchronization - all modules see same data
- No parallel data streams that can get out of sync

**Example**:
```
Before invoice import:
- helper.centers = wizard estimates
- All modules see wizard estimates

After invoice import:
- helper.centers = invoice data  
- All modules see invoice data

No parallel states, no "this module sees X, that module sees Y"
```

### Principle 2: Version History for Time Travel

**Rule**: Every significant change creates a version that captures the complete state

**Significant Changes Include**:
1. Before invoice import (CRITICAL - preserves wizard estimates)
2. After invoice import
3. When estimate report submitted
4. When expertise report submitted
5. Every 3 hours of active work
6. On logout (manual or automatic)

**Why**:
- Safety net - can always go back
- Audit trail - see how data evolved
- Legal compliance - prove what you estimated vs what was charged

**Example**:
```
User Journey with Versions:

Oct 1, 10:00 AM - Create wizard estimate
  → v1 created: "Initial estimate"
  → helper.centers = ₪3,300

Oct 3, 2:00 PM - Submit expertise report
  → v2 created: "Expertise submitted"
  → helper.centers = ₪3,300 (same data, but captured)

Oct 10, 9:00 AM - User gets invoice, clicks "Import"
  → v3 created: "Before invoice import" ← WIZARD DATA ARCHIVED HERE
  → helper.centers still = ₪3,300

Oct 10, 9:01 AM - System imports invoice
  → helper.centers changed to = ₪5,200 (invoice data)
  → v4 created: "After invoice import"

Oct 12, 11:00 AM - User edits description
  → helper.centers = ₪5,200 (with edited descriptions)
  → v5 created: "User edit"

At any time, user can:
- View v3 to see original estimates
- View v4 to see imported invoice
- Restore v3 to current if they want to go back
```

### Principle 3: Report Types Get Different Data

**Rule**: Private reports use CURRENT data, other reports use ARCHIVED WIZARD data

**The 5 Report Types**:
1. **Private Report (חוות דעת פרטית)** - For client
2. **Global Report (חוות דעת גלובלית)** - For insurance
3. **Cost Estimate Report** - For court
4. **Comprehensive Report** - For detailed analysis
5. **Standard Report** - For general use

**Data Source Logic**:

```
IF generating Private Report:
  → Use helper.centers (current working state)
  → If invoice imported, shows invoice data
  → If not imported, shows wizard data
  
IF generating any OTHER report type:
  → Query: "Get last version with flag is_pre_invoice_wizard = true"
  → Use THAT version's data (archived wizard estimates)
  → Even if invoice imported, shows original estimates
```

**Why This Logic**:
- Private reports show ACTUAL costs (what was really charged)
- Standard reports show ESTIMATED costs (what you predicted)
- Legal/insurance often needs original estimates, not actual costs
- Client needs to see what they're actually paying

**Example**:
```
Situation:
- Original wizard estimate: ₪3,300
- Invoice imported: ₪5,200
- helper.centers (current) = ₪5,200

Generate Private Report:
  → Uses helper.centers
  → Shows ₪5,200 (invoice data)
  → Shows actual parts used, actual costs

Generate Global Report for Insurance:
  → Queries Supabase for "last wizard version"
  → Finds v3 "Before invoice import"
  → Shows ₪3,300 (original estimate)
  → Shows estimated parts, estimated costs

User has BOTH reports from same system state!
```

---

## PART 3: USER FLOWS

### Flow 1: Standard Workflow (No Invoices)

**When**: User completes case from start to finish with estimates only

**Steps**:
```
Day 1: Initial Assessment
  1. User inspects vehicle
  2. Creates damage centers in wizard
  3. Adds parts, works, repairs
  4. helper.centers = wizard estimates
  5. System creates v1: "Initial estimate"

Day 3: Expertise Phase
  1. User opens expertise builder
  2. Reviews damage centers (reads from helper.centers)
  3. Submits expertise report
  4. System creates v2: "Expertise submitted"
  5. PDF generated and saved

Day 5: Estimate Phase
  1. User opens estimate builder
  2. Reviews/refines costs (reads from helper.centers)
  3. Submits estimate report
  4. System creates v3: "Estimate submitted"
  5. PDF generated and saved

Day 7: Final Report
  1. User opens final report builder
  2. Selects report type (e.g., Global)
  3. Reviews damage centers (reads from helper.centers)
  4. Generates final report
  5. PDF delivered to client

Result:
- All reports show consistent wizard estimates
- All versions archived in Supabase
- Clean, simple workflow
```

### Flow 2: Invoice Import Workflow

**When**: User receives actual invoices after repair work completed

**Steps**:
```
Day 1-7: [Same as Flow 1]
  User creates estimates, submits reports
  helper.centers = wizard estimates

Day 10: Invoice Arrives
  1. Repair shop emails invoice
  2. User uploads invoice to system
  3. OCR processes invoice → Supabase
  4. Invoice lines stored in database

Day 11: Invoice Assignment
  1. User opens "Invoice Assignment" page
  2. System shows all invoice lines
  3. System shows all damage centers
  4. User assigns each invoice line to a damage center:
     - "Front bumper OEM - ₪2,500" → Damage Center 1
     - "Labor 6 hours - ₪900" → Damage Center 1
     - "Premium paint - ₪1,200" → Damage Center 2
  5. Assignments saved to helper.final_report.invoice_assignments
  6. Status: "pending"
  7. helper.centers UNCHANGED (still wizard data)

Day 12: Generate Private Report
  1. User opens final report builder
  2. Selects "Private Report"
  3. System shows banner: "15 pending invoice assignments"
  4. User clicks "Apply Assignments"
  5. System asks: "This will replace current data. Create archive?"
  6. User confirms: "Yes"
  
  7. System executes:
     a. Create v8: "Before invoice import"
        - Flag: is_pre_invoice_wizard = true
        - Contains: wizard estimates (₪3,300)
     
     b. Replace helper.centers with invoice data
        - helper.centers = invoice data (₪5,200)
     
     c. Mark assignments as "applied"
     
     d. Create v9: "After invoice import"
        - Flag: is_post_invoice = true
        - Contains: invoice data (₪5,200)
  
  8. System reloads page
  9. User sees invoice data in damage centers
  10. User reviews, makes edits (descriptions, etc.)
  11. User generates Private Report PDF
  12. Shows ₪5,200 with actual invoice details

Day 13: Generate Global Report for Insurance
  1. User opens final report builder
  2. Selects "Global Report"
  3. System loads damage centers:
     - Queries: "Get last version with is_pre_invoice_wizard=true"
     - Finds: v8 "Before invoice import"
     - Loads: wizard estimates (₪3,300)
  4. User generates Global Report PDF
  5. Shows ₪3,300 with original estimates

Day 14: Need to See Original Estimate
  1. User opens estimate builder
  2. Current helper.centers = invoice data (₪5,200)
  3. User clicks version dropdown
  4. Selects: v8 "Before invoice import"
  5. System shows READ-ONLY view of wizard data
  6. User reviews original estimates
  7. User clicks "Return to Current"
  8. Back to invoice data

Result:
- Private report shows actual costs (₪5,200)
- Standard reports show original estimates (₪3,300)
- User can view old estimates anytime
- Complete audit trail maintained
```

### Flow 3: Restore Previous Version

**When**: User realizes invoice import was wrong or wants to go back

**Steps**:
```
Current State:
- helper.centers = invoice data (₪5,200)
- v8 exists: "Before invoice import" with wizard data

User Realizes Mistake:
  1. Opens any builder (wizard, estimate, final report)
  2. Clicks "Version History" dropdown
  3. Sees list:
     - "Current (Working)" ← Currently selected
     - "v9: After invoice import - Oct 12"
     - "v8: Before invoice import - Oct 10" ← Target
     - "v7: Estimate submitted - Oct 5"
  
  4. Selects: v8 "Before invoice import"
  
  5. System displays:
     - Banner: "Viewing version v8: Before invoice import"
     - Damage centers in READ-ONLY mode
     - Shows wizard data (₪3,300)
     - Buttons: [Return to Current] [Enable Edit Mode]
  
  6. User clicks: "Enable Edit Mode"
  
  7. System asks:
     "This will load v8 data into your current working state.
      Your current data will be saved as a new version first.
      Continue?"
  
  8. User confirms: "Yes"
  
  9. System executes:
     a. Create v10: "Before restore"
        - Saves current state (invoice data)
     
     b. Replace helper.centers with v8 data
        - helper.centers = wizard estimates (₪3,300)
     
     c. Create v11: "Restored from v8"
        - Marks this as restoration point
  
  10. System reloads page in edit mode
  11. User can now edit wizard data
  12. Invoice import is "undone"

Result:
- Back to wizard data as current
- Invoice data preserved in versions
- Can re-import invoice later if needed
- Nothing is ever lost
```

### Flow 4: Edit Field in Any Builder

**When**: User needs to fix typos or make data more readable

**Steps**:
```
Situation:
- Invoice imported with messy descriptions
- Part shows: "l rear light" (not user-friendly)
- User wants: "Left rear brake light"

User Action:
  1. Opens final report builder (or estimate, or expertise)
  2. Sees damage center with parts list
  3. Finds part: "l rear light"
  4. Clicks on description field
  5. Field becomes editable (highlighted)
  6. User types: "Left rear brake light"
  7. User presses Enter or clicks away (blur event)
  
  8. System executes:
     a. Update helper.centers
        - Find correct part in array
        - Update description field
        - Mark as "user_modified"
        - Add timestamp
     
     b. Save to localStorage (immediate)
     
     c. Save to Supabase (immediate)
        - Update cases.helper_data
     
     d. Visual feedback
        - Field briefly flashes green
        - "Saved" indicator appears
  
  9. Change is permanent
  10. All subsequent reports use new description

Result:
- User-friendly names in reports
- Changes save immediately
- No need to go through wizard
- Works in all builders
```

### Flow 5: Suggestive Dropdown Usage

**When**: User wants to add items to damage centers with suggestions

**Steps**:
```
Situation:
- User in final report builder
- Editing damage center "Front bumper"
- Wants to add a part
- System has: invoice data, wizard archive, parts bank

User Action:
  1. Clicks "Add Part" button
  2. Dropdown appears with 3 sections:
  
     ┌─────────────────────────────────────────┐
     │ בחר חלק...                               │
     ├─────────────────────────────────────────┤
     │ 🧾 מחשבוניות                            │
     │   ├─ Front bumper OEM - ₪2,500          │
     │   └─ Headlight assembly - ₪800          │
     ├─────────────────────────────────────────┤
     │ 📋 אומדן מקורי                           │
     │   ├─ Front bumper - ₪2,000              │
     │   └─ Headlight - ₪600                   │
     ├─────────────────────────────────────────┤
     │ 🏦 בנק חלקים                             │
     │   ├─ Front bumper aftermarket - ₪1,500  │
     │   ├─ Headlight generic - ₪400           │
     │   └─ ... (50 more options)              │
     └─────────────────────────────────────────┘
  
  3. User understands 3 sources:
     - Invoice: Actual items from repair shop
     - Wizard archive: Original estimates
     - Parts bank: General catalog
  
  4. User selects: "Front bumper OEM - ₪2,500" (from invoice)
  
  5. System executes:
     a. Transform invoice line to part format
     b. Add to helper.centers
     c. Mark source as "invoice"
     d. Recalculate totals
     e. Save to Supabase
     f. Render updated list
  
  6. Part appears in damage center
  7. Dropdown resets

Result:
- Easy selection from multiple sources
- Clear provenance (where did this come from?)
- Flexible - can mix sources
- All changes save properly
```

---

## PART 4: ARCHITECTURE DECISIONS

### Decision 1: Version Control, Not Parallel States

**Options Considered**:

**Option A: Parallel Data Structures (Rejected)**
```
helper.centers = [
  {
    Parts: { parts_required: [...] },  // Wizard data
    InvoiceAssignments: {
      parts: [...],                     // Invoice data
      works: [...]
    }
  }
]

Problem:
- Every module needs to know about BOTH structures
- Conditional logic everywhere
- "Do I show wizard or invoice?" in every render
- Maintenance nightmare
- Easy to get out of sync
```

**Option B: Version Control (Chosen)**
```
helper.centers = [...]  // Single working state

Supabase versions:
- v1, v2, v3 (wizard data)
- v4, v5 (invoice data)

Benefit:
- One source of truth for current state
- Simple logic in modules
- Versions for history
- Easy to reason about
- No sync issues
```

**Why We Chose B**:
1. Simpler code - less conditional logic
2. Easier to understand - one current state
3. Safer - versions immutable once created
4. Flexible - can restore any version
5. Matches user mental model (OneDrive)

### Decision 2: Report Types Query Versions

**The Question**: How do we show different data to different report types?

**Chosen Approach**:
- Private report reads: helper.centers (current)
- Other reports query: Last wizard version from Supabase

**Why**:
- Keeps current state clean (one data set)
- Reports generate at moment of creation
- No need to store multiple views in memory
- Query is fast (one database call)
- Version already exists (created during import)

**Alternative Considered (Rejected)**:
- Store computed views in helper
- Problem: More memory, more complexity, stale data risk

### Decision 3: User Control over Import

**The Question**: When should invoice data replace wizard data?

**Chosen Approach**: User clicks "Apply Assignments" button

**Why**:
- Explicit user action
- User sees what will happen
- Can review before committing
- Creates clear audit trail
- User in control, not system

**Alternative Considered (Rejected)**:
- Automatic import on invoice upload
- Problem: User loses control, might not want to import yet

### Decision 4: Archive Before Destructive Operations

**Rule**: Always create version BEFORE replacing data

**Why**:
- Safety net - can always undo
- Captures "before" state
- Audit trail shows what changed
- Legal compliance (prove what you estimated)

**Example**:
```
Wrong Order:
1. Replace helper.centers with invoice
2. Create version with invoice data
Result: Original wizard data LOST FOREVER

Right Order:
1. Create version with current data (wizard)
2. Replace helper.centers with invoice
3. Create version with invoice data
Result: Both states preserved
```

### Decision 5: Inline Editing for User-Friendliness

**The Question**: How do users fix messy invoice descriptions?

**Chosen Approach**: Click any field to edit, auto-saves

**Why**:
- Natural UX - click to edit
- Immediate feedback
- No separate "edit mode"
- Works everywhere (all builders)
- Saves to both localStorage and Supabase

**Alternative Considered (Rejected)**:
- Separate edit form/modal
- Problem: Clunky, extra clicks, poor UX

### Decision 6: Three-Layer Dropdowns

**The Question**: How do users select parts to add?

**Chosen Approach**: Dropdown with 3 labeled sections

**Why**:
- Shows all available sources
- Clear provenance (user sees where it came from)
- Flexible (can mix sources)
- Familiar pattern (like email folder dropdowns)

**The 3 Layers**:
1. **Invoice**: What was actually used (if available)
2. **Wizard Archive**: What was originally estimated (if invoice imported)
3. **Parts Bank**: General catalog (always available)

---

## PART 5: DATA FLOW DIAGRAMS

### Flow A: Before Invoice Import

```
┌─────────────────────────────────────────────────┐
│                    USER                          │
└─────────────────────────────────────────────────┘
                    │
                    │ Creates estimates
                    ▼
┌─────────────────────────────────────────────────┐
│                  WIZARD                          │
│  User adds parts, works, repairs                │
└─────────────────────────────────────────────────┘
                    │
                    │ Writes to
                    ▼
┌─────────────────────────────────────────────────┐
│             helper.centers                       │
│  Current working state = wizard data            │
└─────────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌──────────────┐        ┌──────────────┐
│   ESTIMATE   │        │  EXPERTISE   │
│   BUILDER    │        │   BUILDER    │
│              │        │              │
│ Reads from   │        │ Reads from   │
│ helper.      │        │ helper.      │
│ centers      │        │ centers      │
└──────────────┘        └──────────────┘
        │                       │
        │ Submits               │ Submits
        ▼                       ▼
┌──────────────┐        ┌──────────────┐
│  Creates v2  │        │  Creates v3  │
│  in Supabase │        │  in Supabase │
└──────────────┘        └──────────────┘
```

### Flow B: Invoice Import Process

```
┌─────────────────────────────────────────────────┐
│              USER UPLOADS INVOICE                │
└─────────────────────────────────────────────────┘
                    │
                    │ OCR Processing
                    ▼
┌─────────────────────────────────────────────────┐
│         SUPABASE: invoices table                 │
│         SUPABASE: invoice_lines table            │
└─────────────────────────────────────────────────┘
                    │
                    │ User assigns
                    ▼
┌─────────────────────────────────────────────────┐
│      INVOICE ASSIGNMENT UI                       │
│  User maps invoice lines to damage centers      │
└─────────────────────────────────────────────────┘
                    │
                    │ Saves to
                    ▼
┌─────────────────────────────────────────────────┐
│  helper.final_report.invoice_assignments        │
│  Status: "pending"                               │
│  helper.centers UNCHANGED                        │
└─────────────────────────────────────────────────┘
                    │
                    │ User clicks "Apply"
                    ▼
┌─────────────────────────────────────────────────┐
│           FINAL REPORT BUILDER                   │
│  Shows banner: "15 pending assignments"         │
└─────────────────────────────────────────────────┘
                    │
                    │ User confirms
                    ▼
┌─────────────────────────────────────────────────┐
│        SYSTEM EXECUTES IMPORT                    │
│  1. Create v8 "Before import" (wizard data)     │
│  2. Replace helper.centers with invoice         │
│  3. Create v9 "After import" (invoice data)     │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│        ALL MODULES NOW SEE INVOICE DATA          │
│  Wizard, Estimate, Expertise, Final Report      │
│  All synchronized                                │
└─────────────────────────────────────────────────┘
```

### Flow C: Report Generation After Import

```
┌─────────────────────────────────────────────────┐
│    USER SELECTS REPORT TYPE IN FINAL REPORT     │
└─────────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────┐        ┌──────────────────────┐
│   PRIVATE    │        │  OTHER 4 TYPES       │
│   REPORT     │        │  (Global, Standard)  │
└──────────────┘        └──────────────────────┘
        │                       │
        │ Reads from            │ Queries Supabase
        ▼                       ▼
┌──────────────┐        ┌──────────────────────┐
│ helper.      │        │ "Get last version    │
│ centers      │        │  with flag:          │
│ (current)    │        │  is_pre_invoice_     │
│              │        │  wizard = true"      │
│ = Invoice    │        │                      │
│   data       │        │ Returns v8 data      │
│              │        │ = Wizard estimates   │
└──────────────┘        └──────────────────────┘
        │                       │
        │ Shows                 │ Shows
        ▼                       ▼
┌──────────────┐        ┌──────────────────────┐
│ Actual costs │        │ Original estimates   │
│ ₪5,200       │        │ ₪3,300               │
│              │        │                      │
│ Invoice      │        │ Wizard data          │
│ descriptions │        │ descriptions         │
└──────────────┘        └──────────────────────┘
```

---

## PART 6: SYSTEM BEHAVIOR COMPARISON

### Behavior 1: Adding Invoice Data

**BEFORE (Current System)**:
```
Problem: No systematic way to import invoice data

User must:
1. Open invoice PDF manually
2. Read each line
3. Open wizard
4. Manually type each part
5. Manually type each price
6. Hope they didn't make typos

Issues:
- Extremely time-consuming
- Error-prone (typos, wrong prices)
- No audit trail (can't prove it matches invoice)
- No way to see original estimates afterward
```

**AFTER (New System)**:
```
Solution: Systematic import with preservation

User can:
1. Upload invoice (OCR processes it)
2. See all invoice lines in UI
3. Click to assign each line to damage center
4. Review assignments in summary
5. Click "Apply" when ready
6. System imports all data at once

Benefits:
- Fast (minutes instead of hours)
- Accurate (no manual typing)
- Auditable (system tracks where data came from)
- Safe (original estimates archived)
- Reversible (can restore wizard data)
```

### Behavior 2: Historical Data Access

**BEFORE (Current System)**:
```
Problem: No way to see previous data states

Timeline:
Day 1: Create estimate (₪3,300)
Day 10: Update with invoice (₪5,200)
Day 11: Need to see original estimate → IMPOSSIBLE

The ₪3,300 estimate is gone forever
No audit trail
No way to prove what you originally estimated
```

**AFTER (New System)**:
```
Solution: Complete version history

Timeline:
Day 1: Create estimate (₪3,300) → v1 saved
Day 10: Import invoice (₪5,200)
  → v8 saved "Before import" (₪3,300)
  → v9 saved "After import" (₪5,200)
Day 11: Need to see original estimate:
  → Open version dropdown
  → Select v8
  → View ₪3,300 data

Benefits:
- Never lose data
- Complete audit trail
- Can view any past state
- Can restore if needed
- Legal compliance
```

### Behavior 3: Report Type Differentiation

**BEFORE (Current System)**:
```
Problem: All report types show identical data

If you import invoice:
- Private report shows invoice data (correct)
- Global report shows invoice data (WRONG)
- Court report shows invoice data (WRONG)

User wants:
- Client to see actual costs
- Insurance to see original estimates
- Court to see original estimates

Can't achieve this
```

**AFTER (New System)**:
```
Solution: Different reports query different sources

After invoice import:
- Private report queries helper.centers
  → Shows invoice data (₪5,200)
  
- Global report queries "last wizard version"
  → Shows original estimates (₪3,300)
  
- Court report queries "last wizard version"
  → Shows original estimates (₪3,300)

User can generate:
- Private report with invoice data for client
- Standard reports with estimates for insurance
- All from same system state
- No manual switching or data juggling
```

### Behavior 4: Data Saving

**BEFORE (Current System)**:
```
Problem: Inconsistent saving behavior

Estimator:
- Edit damage centers
- Click save
- Saves to Supabase ✅

Final Report:
- Edit damage centers
- Click save
- Only saves to localStorage ❌
- Must go to wizard to save to Supabase

Issues:
- Confusing for users
- Data loss risk
- Inconsistent UX
```

**AFTER (New System)**:
```
Solution: Consistent saving everywhere

Any Builder (Estimate, Expertise, Final Report):
- Edit damage centers
- Click save
- Saves to localStorage ✅
- Saves to Supabase ✅
- Immediate confirmation

Benefits:
- Consistent UX
- No data loss risk
- Works same way everywhere
- User confidence
```

### Behavior 5: Version Creation

**BEFORE (Current System)**:
```
Problem: Versions only save on manual logout

Works:
- User clicks logout → Version saved ✅

Doesn't Work:
- System timeout logout → No version ❌
- 3-hour auto-save → No version ❌
- Estimate submission → No version ❌
- Expertise submission → No version ❌

Issues:
- Lose work on timeout
- No automatic backups
- No submission snapshots
```

**AFTER (New System)**:
```
Solution: Versions save on all triggers

Automatic Triggers:
- Manual logout → Version saved ✅
- System timeout → Version saved ✅
- Every 3 hours → Version saved ✅
- Estimate submission → Version saved ✅
- Expertise submission → Version saved ✅
- Before invoice import → Version saved ✅

Benefits:
- Never lose work
- Automatic backups
- Submission snapshots for audit
- Peace of mind
```

---

## PART 7: KEY CONCEPTS EXPLAINED

### Concept 1: Version vs Current

**Version**:
- Immutable snapshot stored in Supabase
- Represents system state at a moment in time
- Read-only (can't be edited)
- Used for history, audit trail, restore

**Current**:
- Mutable working state in helper.centers
- What user sees and edits NOW
- Changes frequently
- Single source of truth for "latest"

**Analogy**:
```
Current = Your working document in Word
Versions = Save As... copies you made along the way

You work on the current document
You can open old versions to view them
You can restore an old version to current if needed
```

### Concept 2: Archive vs Replace

**Archive**:
- Create version of current state
- Store in Supabase
- Doesn't change current state
- Can restore later

**Replace**:
- Change current state (helper.centers)
- New data becomes what everyone sees
- Old data preserved in archive
- Can undo by restoring archive

**Analogy**:
```
Archive = Taking a photo before renovation
Replace = Actually renovating the house
Photo = Version (preserved)
Renovated house = Current state (changed)
```

### Concept 3: Pending vs Applied

**Pending**:
- Invoice assignments created but NOT yet imported
- Stored in helper.final_report.invoice_assignments
- helper.centers unchanged
- User hasn't committed yet

**Applied**:
- Invoice assignments imported to helper.centers
- helper.centers now contains invoice data
- All modules see invoice data
- User has committed the change

**Analogy**:
```
Pending = Shopping cart with items
Applied = Checkout completed, items purchased
Cart = Assignments waiting
Purchased = Data imported to system
```

### Concept 4: Source Provenance

**What**: Tracking where each piece of data came from

**Why**: Important for legal, audit, and user understanding

**How**: Tags on each item:
```
part.source = "wizard"          // User estimated this
part.source = "invoice"         // From actual invoice
part.source = "parts_bank"      // From general catalog
part.source = "restored_from_archive"  // User restored old data

part._invoice_id = "uuid"       // Which invoice
part._invoice_line_id = "uuid"  // Which line in invoice
```

**Benefit**:
- User knows: "Where did this number come from?"
- System knows: "Should I show this in standard reports?"
- Audit trail: "Prove this matches the invoice"

### Concept 5: Read-Only vs Edit Mode

**Read-Only Mode**:
- Viewing a version from history
- Can't change anything
- Safe - can't accidentally corrupt version
- Used when browsing versions

**Edit Mode**:
- Working on current state
- Can change anything
- Changes save to Supabase
- Default mode for normal work

**Transition**:
```
User browsing versions (read-only)
  ↓
User clicks "Enable Edit Mode"
  ↓
System asks: "Load this version as current?"
  ↓
User confirms
  ↓
Version data becomes current (editable)
```

---

## PART 8: USER BENEFITS

### For Damage Assessors:

**Time Savings**:
- Before: Hours manually typing invoice data
- After: Minutes with click-to-assign UI

**Accuracy**:
- Before: Typos, wrong prices, missing items
- After: Exact data from OCR, no manual typing

**Flexibility**:
- Before: Can't show different data to different audiences
- After: Private report shows invoice, standard reports show estimates

**Safety**:
- Before: Update data and lose original forever
- After: Original always preserved, can restore

**Audit Trail**:
- Before: No proof of what you originally estimated
- After: Complete history with timestamps

### For Their Clients:

**Transparency**:
- Private report shows exactly what they're paying
- Can see actual parts used, actual costs
- No discrepancies between estimate and invoice

**Professionalism**:
- Clean, accurate reports
- No typos or manual errors
- Fast turnaround

### For Insurance Companies:

**Consistency**:
- Standard reports show original estimates
- Not affected by invoice imports
- Can compare estimate to actual

**Compliance**:
- Complete audit trail
- Can see version history
- Timestamps on all changes

### For Courts:

**Evidence**:
- Can see original estimate (what was predicted)
- Can see actual invoice (what was charged)
- Complete timeline of changes
- Immutable versions

---

## PART 9: TECHNICAL BENEFITS

### Simplified Architecture:

**Before**:
- Multiple parallel data structures
- Conditional logic everywhere
- Complex synchronization issues
- Hard to reason about state

**After**:
- One current state (helper.centers)
- Versions in Supabase
- Simple logic: "Use current or query version"
- Easy to reason about

### Data Safety:

**Before**:
- Data loss on timeout
- No automatic backups
- Destructive updates

**After**:
- Versions on all triggers
- Automatic backups every 3 hours
- Non-destructive (archive before replace)

### Maintainability:

**Before**:
- Hard to add features
- Risk of breaking existing code
- Unclear data flow

**After**:
- Easy to add features (just query versions)
- Low risk (versions immutable)
- Clear data flow (current vs version)

### Scalability:

**Before**:
- More report types = more complexity
- More data sources = exponential complexity

**After**:
- More report types = same pattern (query or use current)
- More data sources = just add to version metadata

---

## PART 10: IMPLEMENTATION PRIORITIES

### Phase 1: Foundation (CRITICAL)
```
Fix version saving system
Fix final report Supabase save

Why First:
- Prevents data loss NOW
- Foundation for everything else
- Low risk, high value
```

### Phase 2: Core Feature (HIGH)
```
Invoice import with archive
Report type data sourcing

Why Second:
- Delivers main value proposition
- Enables differentiated reports
- Builds on Phase 1 foundation
```

### Phase 3: UX Polish (MEDIUM)
```
Suggestive dropdowns
Version history UI
Inline field editing

Why Third:
- Enhances usability
- Nice to have, not critical
- Can be done incrementally
```

---

## CONCLUSION

### What We're Building:

A **version-controlled data management system** that:
1. Allows systematic invoice import
2. Preserves historical data states
3. Shows different data to different report types
4. Provides complete audit trail
5. Enables safe restoration of previous states

### Core Philosophy:

**"Work on latest, archive the past, restore when needed"**

Just like OneDrive, but for damage assessment data.

### Key Principles:

1. **ONE working state** (helper.centers)
2. **MULTIPLE versions** (Supabase)
3. **USER control** (explicit actions, not automatic)
4. **SAFETY first** (archive before replace)
5. **SIMPLE logic** (query or use current)

### Expected Outcomes:

- ✅ Faster workflow (minutes instead of hours)
- ✅ Higher accuracy (no manual typing errors)
- ✅ Better reports (right data for each audience)
- ✅ Complete audit trail (legal compliance)
- ✅ Data safety (never lose work)
- ✅ User confidence (can always undo)

---

*Architecture & Logic Documentation*  
*Version: 1.0*  
*Date: October 31, 2025*  
*Status: Final - Ready for Implementation*


## 🎯 OBJECTIVE

Implement an invoice assignment system that uses **version control** to manage data changes, allowing users to:
1. Import invoice data to replace wizard estimates (user-controlled)
2. View and restore previous versions of data
3. Show different data to different report types (private vs others)
4. Edit and update damage centers across all builders with proper saving

**Core Philosophy**: System maintains ONE working state (helper.centers) but creates versions in Supabase for history/restore. Like OneDrive - work on latest, view old versions when needed.

---

## 🔧 CRITICAL BUGS TO FIX

### Bug 1: Helper Version Saving Not Working
**Current Issues:**
- ✅ Manual logout DOES save version
- ❌ System logout (due to inactivity) does NOT save version
- ❌ 3-hour auto-save NOT working
- ❌ Estimate/expertise submission NOT creating versions

**Expected Behavior:**
- Save version on manual logout ✅ (already works)
- Save version on system timeout/inactivity logout
- Save version every 3 hours if helper changed
- Save version when estimate report submitted (with flag)
- Save version when expertise report submitted (with flag)
- Save version when invoice import happens (with special flag)

**Tables Available:**
- `helper_versions` (already exists in Supabase)
- `cases` table with helper_data column

### Bug 2: Final Report Damage Centers Not Saving to Supabase
**Current Issue:**
- Final report builder damage centers section changes only save when going through wizard
- Changes made directly in final report builder don't update Supabase
- Need to work like estimator (saves directly to Supabase)

**Expected Behavior:**
- User edits damage centers in final report builder
- Clicks save button on page
- Updates helper.centers
- Updates Supabase cases.helper_data directly
- No need to go through wizard

**Reference:** Check `estimate-report-builder.html` for correct save implementation

---

## 📋 ARCHITECTURE OVERVIEW

### Data Flow:

```
┌─────────────────────────────────────────────────────────────┐
│                    WORKING STATE                             │
│                 helper.centers (CURRENT)                     │
│         Always the latest, what user sees/edits              │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Version saves to ↓
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE: helper_versions                       │
│  Version 1: Initial wizard estimate                          │
│  Version 2: After expertise submitted                        │
│  Version 3: Before invoice import ← WIZARD DATA ARCHIVED     │
│  Version 4: After invoice import                             │
│  Version 5: After user edits                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Used by ↓
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              REPORT TYPE DATA SOURCING                       │
│  Private Report: helper.centers (current/invoice data)       │
│  Other 4 Reports: Last wizard version (before invoice)      │
└─────────────────────────────────────────────────────────────┘
```

### Key Principle:
- **ONE working state**: helper.centers (current, editable)
- **MULTIPLE versions**: Supabase for history/restore
- **Private report**: Uses current (invoice data after import)
- **Other reports**: Use last wizard version (before invoice)
- **All edits**: Update helper.centers + save to Supabase

---

## 📝 IMPLEMENTATION TASKS

### TASK 1: Fix Helper Version Saving System

**Files to Modify:**
- `helper.js` or wherever helper save logic lives
- Any file with logout handlers
- Any file with auto-save timers

**Sub-tasks:**

#### 1.1: Create Comprehensive Version Save Function
```javascript
/**
 * Save current helper state as a version in Supabase
 * @param {string} versionLabel - Human-readable label
 * @param {object} metadata - Additional metadata
 * @returns {Promise<object>} Saved version data
 */
async function saveHelperVersion(versionLabel, metadata = {}) {
  if (!window.helper || !window.helper.meta?.case_id) {
    console.error('Cannot save version: helper or case_id missing');
    return null;
  }
  
  try {
    // Get current version number
    const { data: existingVersions } = await supabase
      .from('helper_versions')
      .select('version_number')
      .eq('case_id', window.helper.meta.case_id)
      .order('version_number', { ascending: false })
      .limit(1);
    
    const nextVersion = existingVersions?.[0]?.version_number + 1 || 1;
    
    // Prepare version data
    const versionData = {
      case_id: window.helper.meta.case_id,
      version_number: nextVersion,
      version_label: versionLabel,
      helper_data: window.helper,
      created_at: new Date().toISOString(),
      created_by: window.helper.meta?.user_id || 'system',
      
      // PDF URLs (if exist)
      estimate_pdf_url: window.helper.estimate?.pdf_url || null,
      expertise_pdf_url: window.helper.expertise?.pdf_url || null,
      final_report_pdf_url: window.helper.final_report?.pdf_url || null,
      
      // Metadata
      trigger_event: metadata.trigger_event || 'manual',
      is_pre_invoice_wizard: metadata.is_pre_invoice_wizard || false,
      is_post_invoice: metadata.is_post_invoice || false,
      is_estimate_submission: metadata.is_estimate_submission || false,
      is_expertise_submission: metadata.is_expertise_submission || false,
      notes: metadata.notes || ''
    };
    
    // Save to Supabase
    const { data, error } = await supabase
      .from('helper_versions')
      .insert([versionData])
      .select()
      .single();
    
    if (error) {
      console.error('Error saving helper version:', error);
      return null;
    }
    
    console.log(`✅ Saved helper version ${nextVersion}: ${versionLabel}`);
    return data;
    
  } catch (error) {
    console.error('Exception saving helper version:', error);
    return null;
  }
}
```

#### 1.2: Fix System Logout Version Save
```javascript
// Find the system logout/timeout handler
// It might be in authentication code or session management

// ADD version save before logout:
async function handleSystemLogout() {
  console.log('System logout triggered - saving version...');
  
  // Save version
  await saveHelperVersion('System Logout', {
    trigger_event: 'system_logout',
    notes: 'Automatic save on system timeout/inactivity'
  });
  
  // Then proceed with logout
  // ... existing logout code ...
}

// Also handle page unload (browser close, navigation away)
window.addEventListener('beforeunload', async (event) => {
  // Try to save (may not complete if page closes immediately)
  navigator.sendBeacon('/api/save-version', JSON.stringify({
    helper: window.helper,
    trigger: 'page_unload'
  }));
});
```

#### 1.3: Implement 3-Hour Auto-Save
```javascript
// Global auto-save timer
let autoSaveTimer = null;
let lastSavedHelper = null;

/**
 * Check if helper has changed since last save
 */
function hasHelperChanged() {
  if (!lastSavedHelper) return true;
  
  // Compare stringified versions
  const current = JSON.stringify(window.helper);
  const previous = JSON.stringify(lastSavedHelper);
  
  return current !== previous;
}

/**
 * Start auto-save timer
 */
function startAutoSaveTimer() {
  // Clear any existing timer
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
  }
  
  // Save every 3 hours
  const THREE_HOURS = 3 * 60 * 60 * 1000;
  
  autoSaveTimer = setInterval(async () => {
    if (hasHelperChanged()) {
      console.log('3-hour auto-save triggered...');
      
      await saveHelperVersion('Auto-save (3 hours)', {
        trigger_event: 'auto_save_3h',
        notes: 'Automatic save after 3 hours of activity'
      });
      
      // Update last saved state
      lastSavedHelper = JSON.parse(JSON.stringify(window.helper));
    } else {
      console.log('No changes detected, skipping auto-save');
    }
  }, THREE_HOURS);
  
  console.log('✅ Auto-save timer started (3 hours)');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  startAutoSaveTimer();
  lastSavedHelper = JSON.parse(JSON.stringify(window.helper));
});
```

#### 1.4: Add Version Save to Estimate Submission
**File:** `estimate-report-builder.html`

```javascript
// Find the estimate submission function
// Should be something like submitEstimate() or generateEstimatePDF()

async function submitEstimate() {
  // ... existing estimate generation code ...
  
  // After successful estimate generation, BEFORE returning:
  
  // Save version with special flag
  await saveHelperVersion('Estimate Report Submitted', {
    trigger_event: 'estimate_submission',
    is_estimate_submission: true,
    notes: `Estimate report submitted - PDF: ${pdfUrl}`
  });
  
  // Store PDF URL in helper for this version
  if (!window.helper.estimate) window.helper.estimate = {};
  window.helper.estimate.pdf_url = pdfUrl;
  window.helper.estimate.submitted_at = new Date().toISOString();
  
  saveHelperToStorage();
  
  // ... rest of submission code ...
}
```

#### 1.5: Add Version Save to Expertise Submission
**File:** `expertise builder.html`

```javascript
// Find the expertise submission function

async function submitExpertise() {
  // ... existing expertise generation code ...
  
  // After successful expertise generation:
  
  // Save version with special flag
  await saveHelperVersion('Expertise Report Submitted', {
    trigger_event: 'expertise_submission',
    is_expertise_submission: true,
    notes: `Expertise report submitted - PDF: ${pdfUrl}`
  });
  
  // Store PDF URL in helper
  if (!window.helper.expertise) window.helper.expertise = {};
  window.helper.expertise.pdf_url = pdfUrl;
  window.helper.expertise.submitted_at = new Date().toISOString();
  
  saveHelperToStorage();
  
  // ... rest of submission code ...
}
```

---

### TASK 2: Fix Final Report Damage Centers Supabase Save

**Files to Modify:**
- `final-report-builder.html`

**Reference:**
- Look at `estimate-report-builder.html` for correct save implementation

**Sub-tasks:**

#### 2.1: Find the Save Button Handler
```javascript
// In final-report-builder.html
// Find the save button - might be something like:
// <button id="save-changes-btn">שמור שינויים</button>

// Current behavior: Only saves to localStorage/helper
// Needed: Also save to Supabase
```

#### 2.2: Implement Direct Supabase Save
```javascript
/**
 * Save damage centers changes directly to Supabase
 * (Based on estimator implementation)
 */
async function saveDamageCentersToSupabase() {
  if (!window.helper?.meta?.case_id) {
    console.error('Cannot save: case_id missing');
    alert('שגיאה: מזהה תיק חסר');
    return false;
  }
  
  try {
    console.log('💾 Saving damage centers to Supabase...');
    
    // Save complete helper to Supabase
    const { data, error } = await supabase
      .from('cases')
      .update({
        helper_data: window.helper,
        updated_at: new Date().toISOString()
      })
      .eq('case_id', window.helper.meta.case_id)
      .select();
    
    if (error) {
      console.error('Supabase save error:', error);
      alert('שגיאה בשמירה למסד נתונים');
      return false;
    }
    
    console.log('✅ Successfully saved to Supabase');
    
    // Also save to localStorage
    saveHelperToStorage();
    
    // Show success message
    showSuccessNotification('השינויים נשמרו בהצלחה');
    
    return true;
    
  } catch (error) {
    console.error('Exception saving to Supabase:', error);
    alert('שגיאה בשמירה');
    return false;
  }
}

// Attach to save button
document.getElementById('save-changes-btn')?.addEventListener('click', async () => {
  await saveDamageCentersToSupabase();
});

// Also save after damage center updates
function updateDamageCenterField(centerId, field, value) {
  // ... update helper.centers ...
  
  // Auto-save to Supabase after change
  saveDamageCentersToSupabase();
}
```

#### 2.3: Add Success Notification (If Not Exists)
```javascript
function showSuccessNotification(message) {
  // Check if notification system exists
  if (typeof showNotification === 'function') {
    showNotification(message, 'success');
    return;
  }
  
  // Otherwise create simple notification
  const notification = document.createElement('div');
  notification.className = 'save-notification success';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 15px 20px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
```

---

### TASK 3: Invoice Import with Version Archive

**Files to Modify:**
- `final-report-builder.html` (main implementation)
- `invoice_assignment.html` (might need updates)

**Sub-tasks:**

#### 3.1: Implement "Accept Invoice Assignments" with Archive
```javascript
/**
 * Apply invoice assignments to damage centers
 * Creates archive version before replacing data
 */
async function acceptInvoiceAssignments() {
  const pending = window.helper.final_report?.invoice_assignments?.filter(
    a => a.status === 'pending'
  ) || [];
  
  if (pending.length === 0) {
    alert('אין שיוכים ממתינים');
    return;
  }
  
  // Confirm with user
  const confirm = window.confirm(
    `זה יחליף את הנתונים הנוכחיים עם נתוני החשבונית.\n` +
    `גרסה ארכיונית תיווצר כדי לשמור את הנתונים המקוריים.\n\n` +
    `להמשיך?`
  );
  
  if (!confirm) return;
  
  try {
    console.log('📦 Creating archive version before invoice import...');
    
    // STEP 1: Save current state as "Before Invoice Import" version
    await saveHelperVersion('לפני יבוא חשבונית', {
      trigger_event: 'before_invoice_import',
      is_pre_invoice_wizard: true,  // ← CRITICAL FLAG
      notes: 'Wizard data archived before invoice import'
    });
    
    console.log('✅ Archive created');
    
    // STEP 2: Transform invoice assignments to parts/works/repairs format
    const invoiceData = transformInvoiceAssignmentsToCenters(pending);
    
    // STEP 3: Replace helper.centers with invoice data
    invoiceData.forEach(invoiceCenter => {
      const centerIndex = window.helper.centers.findIndex(
        c => c.Id === invoiceCenter.centerId
      );
      
      if (centerIndex >= 0) {
        // Replace Parts, Works, Repairs
        window.helper.centers[centerIndex].Parts = invoiceCenter.Parts;
        window.helper.centers[centerIndex].Works = invoiceCenter.Works;
        window.helper.centers[centerIndex].Repairs = invoiceCenter.Repairs;
        
        // Mark as invoice-sourced
        window.helper.centers[centerIndex]._data_source = 'invoice';
        window.helper.centers[centerIndex]._invoice_import_date = new Date().toISOString();
      }
    });
    
    // STEP 4: Mark assignments as applied
    pending.forEach(assignment => {
      assignment.status = 'applied';
      assignment.applied_at = new Date().toISOString();
    });
    
    // STEP 5: Save to Supabase
    await supabase.from('cases').update({
      helper_data: window.helper
    }).eq('case_id', window.helper.meta.case_id);
    
    // Update invoice mappings
    await supabase
      .from('invoice_damage_center_mappings')
      .update({ mapping_status: 'applied' })
      .in('id', pending.map(a => a.assignment_id));
    
    // STEP 6: Save as new version "After Invoice Import"
    await saveHelperVersion('אחרי יבוא חשבונית', {
      trigger_event: 'after_invoice_import',
      is_post_invoice: true,
      notes: 'Invoice data imported and applied'
    });
    
    // Save locally
    saveHelperToStorage();
    
    alert('שיוכים יושמו בהצלחה!\nגרסה ארכיונית נוצרה.');
    
    // Reload page
    location.reload();
    
  } catch (error) {
    console.error('Error applying invoice assignments:', error);
    alert('שגיאה ביישום השיוכים');
  }
}

/**
 * Transform invoice assignments to damage center format
 */
function transformInvoiceAssignmentsToCenters(assignments) {
  const centerData = {};
  
  assignments.forEach(assignment => {
    const centerId = assignment.damage_center_id;
    
    if (!centerData[centerId]) {
      centerData[centerId] = {
        centerId,
        Parts: { parts_required: [], parts_meta: {} },
        Works: { works: [], works_meta: {} },
        Repairs: { repairs: [], repairs_meta: {} }
      };
    }
    
    // Transform based on type
    if (assignment.field_type === 'part') {
      centerData[centerId].Parts.parts_required.push({
        part_name: assignment.invoice_line.description,
        price_per_unit: assignment.invoice_line.unit_price,
        quantity: assignment.invoice_line.quantity,
        total_cost: assignment.invoice_line.line_total,
        source: 'invoice',
        _invoice_id: assignment.invoice_id,
        _invoice_line_id: assignment.invoice_line_id,
        supplier_name: assignment.invoice_line.metadata?.ספק || '',
        pcode: assignment.invoice_line.metadata?.['מק״ט'] || '',
        // ... other fields
      });
    }
    // Similar for works and repairs...
  });
  
  // Calculate metas
  Object.keys(centerData).forEach(centerId => {
    const center = centerData[centerId];
    
    center.Parts.parts_meta = {
      total_items: center.Parts.parts_required.length,
      total_cost: center.Parts.parts_required.reduce((sum, p) => sum + p.total_cost, 0)
    };
    
    // Similar for works and repairs...
  });
  
  return Object.values(centerData);
}
```

---

### TASK 4: Report Type Data Sourcing

**Files to Modify:**
- `final-report-builder.html`

**Sub-tasks:**

#### 4.1: Create Function to Get Last Wizard Version
```javascript
/**
 * Get the last wizard version (before invoice import)
 * @returns {Promise<object>} Helper data from wizard version
 */
async function getLastWizardVersion() {
  if (!window.helper?.meta?.case_id) {
    console.error('Cannot get wizard version: case_id missing');
    return null;
  }
  
  try {
    // Query for version with is_pre_invoice_wizard = true
    const { data, error } = await supabase
      .from('helper_versions')
      .select('*')
      .eq('case_id', window.helper.meta.case_id)
      .eq('is_pre_invoice_wizard', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      console.log('No wizard version found, using current data');
      return window.helper;
    }
    
    console.log('📂 Loaded wizard version:', data.version_label);
    return data.helper_data;
    
  } catch (error) {
    console.error('Error loading wizard version:', error);
    return window.helper; // Fallback to current
  }
}

/**
 * Check if invoice has been imported
 */
function hasInvoiceBeenImported() {
  return window.helper?.centers?.some(c => c._data_source === 'invoice') || false;
}
```

#### 4.2: Modify Damage Centers Loading Based on Report Type
```javascript
/**
 * Load damage centers data based on report type
 */
async function loadDamageCentersForReport() {
  const reportType = getSelectedReportType(); // 'private', 'global', etc.
  
  let damageCentersData;
  let dataSourceLabel;
  
  if (reportType === 'private') {
    // Private report: Use CURRENT helper.centers (invoice data if imported)
    damageCentersData = window.helper.centers;
    dataSourceLabel = hasInvoiceBeenImported() ? 'נתוני חשבונית' : 'נתוני אומדן';
    
    console.log('📄 Private report: Using current helper.centers');
    
  } else {
    // Other 4 report types: Use wizard version (before invoice import)
    const wizardVersion = await getLastWizardVersion();
    damageCentersData = wizardVersion.centers;
    dataSourceLabel = 'נתוני אומדן מקוריים';
    
    console.log('📄 Standard report: Using wizard version');
  }
  
  // Show data source badge
  showDataSourceBadge(dataSourceLabel);
  
  // Render damage centers
  renderDamageCenters(damageCentersData);
}

/**
 * Show badge indicating data source
 */
function showDataSourceBadge(label) {
  const badge = document.createElement('div');
  badge.className = 'data-source-badge';
  badge.textContent = `מקור נתונים: ${label}`;
  badge.style.cssText = `
    display: inline-block;
    background: #2196F3;
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 14px;
    margin-bottom: 10px;
  `;
  
  // Insert at top of damage centers section
  const damageCentersSection = document.getElementById('damage-centers-section');
  damageCentersSection?.insertBefore(badge, damageCentersSection.firstChild);
}
```

---

### TASK 5: Suggestive Dropdowns for All Report Types

**Files to Modify:**
- `final-report-builder.html`

**Sub-tasks:**

#### 5.1: Create Multi-Layer Dropdown Population
```javascript
/**
 * Populate dropdown with 3 layers:
 * 1. Invoice assignments (if exist)
 * 2. Last saved wizard version (before invoice)
 * 3. Parts bank
 */
async function populatePartDropdown(centerId) {
  const dropdown = document.getElementById(`part-dropdown-${centerId}`);
  if (!dropdown) return;
  
  dropdown.innerHTML = '<option value="">בחר חלק...</option>';
  
  // LAYER 1: Invoice Assignments
  const invoiceAssignments = window.helper.final_report?.invoice_assignments || [];
  const invoicePartsForCenter = invoiceAssignments.filter(
    a => a.damage_center_id === centerId && a.field_type === 'part'
  );
  
  if (invoicePartsForCenter.length > 0) {
    const invoiceGroup = document.createElement('optgroup');
    invoiceGroup.label = '🧾 מחשבוניות';
    
    invoicePartsForCenter.forEach(assignment => {
      const option = document.createElement('option');
      option.value = JSON.stringify({
        source: 'invoice',
        data: assignment.invoice_line
      });
      option.textContent = `${assignment.invoice_line.description} - ₪${assignment.invoice_line.unit_price}`;
      invoiceGroup.appendChild(option);
    });
    
    dropdown.appendChild(invoiceGroup);
  }
  
  // LAYER 2: Last Wizard Version
  if (hasInvoiceBeenImported()) {
    const wizardVersion = await getLastWizardVersion();
    const wizardCenter = wizardVersion?.centers?.find(c => c.Id === centerId);
    
    if (wizardCenter?.Parts?.parts_required?.length > 0) {
      const wizardGroup = document.createElement('optgroup');
      wizardGroup.label = '📋 אומדן מקורי';
      
      wizardCenter.Parts.parts_required.forEach(part => {
        const option = document.createElement('option');
        option.value = JSON.stringify({
          source: 'wizard_archive',
          data: part
        });
        option.textContent = `${part.part_name} - ₪${part.price_per_unit}`;
        wizardGroup.appendChild(option);
      });
      
      dropdown.appendChild(wizardGroup);
    }
  }
  
  // LAYER 3: Parts Bank
  if (window.helper.parts_search?.global_parts_bank?.all_parts) {
    const bankGroup = document.createElement('optgroup');
    bankGroup.label = '🏦 בנק חלקים';
    
    // Limit to 50 items to avoid dropdown overload
    window.helper.parts_search.global_parts_bank.all_parts
      .slice(0, 50)
      .forEach(part => {
        const option = document.createElement('option');
        option.value = JSON.stringify({
          source: 'parts_bank',
          data: part
        });
        option.textContent = `${part.description || part.name} - ${part.supplier}`;
        bankGroup.appendChild(option);
      });
    
    dropdown.appendChild(bankGroup);
  }
}

/**
 * Handle part selection from dropdown
 */
function onPartSelected(centerId, dropdownElement) {
  const selectedValue = dropdownElement.value;
  if (!selectedValue) return;
  
  try {
    const selection = JSON.parse(selectedValue);
    
    // Transform based on source
    let partToAdd;
    
    if (selection.source === 'invoice') {
      partToAdd = transformInvoiceLineToPart(selection.data);
    } else if (selection.source === 'wizard_archive') {
      partToAdd = { ...selection.data, source: 'restored_from_archive' };
    } else if (selection.source === 'parts_bank') {
      partToAdd = transformBankPartToPart(selection.data);
    }
    
    // Add to helper.centers
    const center = window.helper.centers.find(c => c.Id === centerId);
    if (center) {
      center.Parts.parts_required.push(partToAdd);
      
      // Recalculate meta
      center.Parts.parts_meta.total_items = center.Parts.parts_required.length;
      center.Parts.parts_meta.total_cost = center.Parts.parts_required.reduce(
        (sum, p) => sum + p.total_cost, 0
      );
      
      // Save to Supabase
      saveDamageCentersToSupabase();
      
      // Re-render
      renderDamageCenters(window.helper.centers);
    }
    
    // Reset dropdown
    dropdownElement.value = '';
    
  } catch (error) {
    console.error('Error adding part:', error);
    alert('שגיאה בהוספת חלק');
  }
}
```

#### 5.2: Similar Dropdowns for Works and Repairs
```javascript
// Implement similar dropdown logic for:
// - populateWorkDropdown()
// - populateRepairDropdown()
// Following the same 3-layer pattern
```

---

### TASK 6: Edit Mode for Estimate/Expertise Builders

**Files to Modify:**
- `estimate-report-builder.html`
- `expertise builder.html`

**Sub-tasks:**

#### 6.1: Add Version History Dropdown
```html
<!-- Add to estimate/expertise builder UI -->
<div class="version-selector">
  <label>גרסת נתונים:</label>
  <select id="version-selector">
    <option value="current">גרסה נוכחית (עבודה)</option>
    <!-- Populated dynamically with versions -->
  </select>
  <button id="load-version-btn">טען גרסה</button>
</div>
```

#### 6.2: Implement Version Loading
```javascript
/**
 * Load versions for dropdown
 */
async function loadVersionsDropdown() {
  const caseId = window.helper?.meta?.case_id;
  if (!caseId) return;
  
  const { data: versions } = await supabase
    .from('helper_versions')
    .select('id, version_number, version_label, created_at')
    .eq('case_id', caseId)
    .order('version_number', { ascending: false });
  
  const dropdown = document.getElementById('version-selector');
  
  versions?.forEach(version => {
    const option = document.createElement('option');
    option.value = version.id;
    option.textContent = `v${version.version_number}: ${version.version_label} - ${formatDate(version.created_at)}`;
    dropdown.appendChild(option);
  });
}

/**
 * Load selected version
 */
async function loadSelectedVersion() {
  const versionId = document.getElementById('version-selector').value;
  
  if (versionId === 'current') {
    // Reload current
    location.reload();
    return;
  }
  
  const { data: version } = await supabase
    .from('helper_versions')
    .select('*')
    .eq('id', versionId)
    .single();
  
  if (!version) {
    alert('לא ניתן לטעון גרסה');
    return;
  }
  
  // Show version in read-only mode
  displayVersionReadOnly(version);
}

/**
 * Display version in read-only mode
 */
function displayVersionReadOnly(version) {
  // Store original helper
  window.originalHelper = window.helper;
  window.viewingVersion = version;
  
  // Load version data (don't replace helper yet)
  const versionHelper = version.helper_data;
  
  // Render damage centers from version (read-only)
  renderDamageCenters(versionHelper.centers, false); // false = read-only
  
  // Show banner
  showVersionBanner(version);
}

/**
 * Show banner for version viewing
 */
function showVersionBanner(version) {
  const banner = document.createElement('div');
  banner.className = 'version-banner';
  banner.innerHTML = `
    <div class="banner-content">
      <span>⚠️ צפייה בגרסה: ${version.version_label}</span>
      <span>תאריך: ${formatDate(version.created_at)}</span>
    </div>
    <div class="banner-actions">
      <button id="return-to-current">חזור לגרסה נוכחית</button>
      <button id="enable-edit-mode">מצב עריכה</button>
    </div>
  `;
  
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #FF9800;
    color: white;
    padding: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 10000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  `;
  
  document.body.insertBefore(banner, document.body.firstChild);
  
  // Attach handlers
  document.getElementById('return-to-current').addEventListener('click', () => {
    location.reload();
  });
  
  document.getElementById('enable-edit-mode').addEventListener('click', () => {
    enableEditModeForVersion();
  });
}

/**
 * Enable edit mode for archived version
 */
function enableEditModeForVersion() {
  const confirm = window.confirm(
    'הפעלת מצב עריכה תטען את הנתונים מהגרסה הארכיונית לגרסה הנוכחית.\n' +
    'שינויים יתבצעו בגרסת העבודה הנוכחית.\n\n' +
    'להמשיך?'
  );
  
  if (!confirm) return;
  
  // Replace current helper with version data
  window.helper = JSON.parse(JSON.stringify(window.viewingVersion.helper_data));
  
  // Save
  saveHelperToStorage();
  
  // Reload as editable
  location.reload();
}
```

---

### TASK 7: Inline Field Editing with Supabase Save

**Files to Modify:**
- `final-report-builder.html`
- `estimate-report-builder.html`
- `expertise builder.html`

**Sub-tasks:**

#### 7.1: Make Damage Center Fields Editable
```javascript
/**
 * Render editable field
 */
function renderEditableField(centerId, partIndex, fieldName, currentValue) {
  const fieldId = `field-${centerId}-${partIndex}-${fieldName}`;
  
  return `
    <span 
      id="${fieldId}"
      class="editable-field"
      contenteditable="true"
      data-center-id="${centerId}"
      data-part-index="${partIndex}"
      data-field-name="${fieldName}"
      data-original-value="${currentValue}"
    >
      ${currentValue}
    </span>
  `;
}

/**
 * Attach edit handlers
 */
function attachEditHandlers() {
  document.querySelectorAll('.editable-field').forEach(field => {
    field.addEventListener('blur', function() {
      const centerId = this.dataset.centerId;
      const partIndex = parseInt(this.dataset.partIndex);
      const fieldName = this.dataset.fieldName;
      const newValue = this.textContent.trim();
      const originalValue = this.dataset.originalValue;
      
      if (newValue !== originalValue) {
        updateFieldAndSave(centerId, partIndex, fieldName, newValue);
      }
    });
    
    // Also handle Enter key
    field.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.blur();
      }
    });
  });
}

/**
 * Update field and save to Supabase
 */
async function updateFieldAndSave(centerId, partIndex, fieldName, newValue) {
  try {
    // Update helper.centers
    const center = window.helper.centers.find(c => c.Id === centerId);
    if (!center) return;
    
    const part = center.Parts.parts_required[partIndex];
    if (!part) return;
    
    // Update field
    part[fieldName] = newValue;
    
    // Mark as user-modified
    if (!part.user_modified_fields) {
      part.user_modified_fields = [];
    }
    if (!part.user_modified_fields.includes(fieldName)) {
      part.user_modified_fields.push(fieldName);
    }
    part.last_modified_at = new Date().toISOString();
    
    // Save to Supabase
    await saveDamageCentersToSupabase();
    
    // Visual feedback
    const fieldElement = document.getElementById(`field-${centerId}-${partIndex}-${fieldName}`);
    if (fieldElement) {
      fieldElement.style.background = '#c8e6c9';
      setTimeout(() => {
        fieldElement.style.background = '';
      }, 1000);
    }
    
    console.log(`✅ Updated ${fieldName} for part in center ${centerId}`);
    
  } catch (error) {
    console.error('Error updating field:', error);
    alert('שגיאה בעדכון השדה');
  }
}
```

---

## 🧪 TESTING CHECKLIST

### Test 1: Version Saving
```
[ ] Manual logout saves version ✅ (already works)
[ ] System timeout logout saves version
[ ] 3-hour auto-save creates version (wait 3 hours or manually trigger)
[ ] Estimate submission creates version with flag
[ ] Expertise submission creates version with flag
[ ] All versions appear in helper_versions table
[ ] Versions have correct metadata and flags
```

### Test 2: Invoice Import Flow
```
[ ] Click "Accept Invoice Assignments"
[ ] System creates "Before Invoice Import" version with is_pre_invoice_wizard=true
[ ] helper.centers replaced with invoice data
[ ] Invoice assignments marked as applied
[ ] System creates "After Invoice Import" version with is_post_invoice=true
[ ] Supabase updated with new helper data
```

### Test 3: Report Type Data Sourcing
```
[ ] Private report: Loads helper.centers (invoice data if imported)
[ ] Global report: Loads last wizard version (pre-invoice)
[ ] Other 3 report types: Load last wizard version
[ ] Data source badge shows correct label
[ ] All reports render correctly with appropriate data
```

### Test 4: Suggestive Dropdowns
```
[ ] Dropdowns show 3 layers: invoice, wizard archive, parts bank
[ ] Each layer properly labeled
[ ] Selecting from dropdown adds to helper.centers
[ ] Changes save to Supabase
[ ] Works for parts, works, and repairs
```

### Test 5: Version History & Edit Mode
```
[ ] Version dropdown populates with all versions
[ ] Selecting version shows read-only view
[ ] Banner appears with correct info
[ ] "Return to Current" reloads current data
[ ] "Enable Edit Mode" loads version data as current
[ ] Edits in edit mode save to current helper
```

### Test 6: Inline Field Editing
```
[ ] Fields are editable in all builders
[ ] Editing field updates helper.centers
[ ] Changes save to Supabase automatically
[ ] Visual feedback shows save success
[ ] Example: "l rear light" → "left rear break light" saves correctly
```

### Test 7: Final Report Supabase Save
```
[ ] Edit damage center in final report builder
[ ] Click save button
[ ] Verify Supabase cases table updated
[ ] Verify helper saved to localStorage
[ ] Verify works without going through wizard
```

---

## 📚 REFERENCE FILES

### Study These for Implementation Patterns:
- `estimate-report-builder.html` - Correct Supabase save pattern
- `invoice_assignment.html` - Current invoice assignment logic
- `helper.js` - Helper structure and functions
- Session 86 implementation doc - Current state and issues

### Supabase Tables:
- `helper_versions` - Version storage
- `cases` - Main case data with helper_data column
- `invoice_damage_center_mappings` - Invoice assignments

---

## ⚠️ CRITICAL REMINDERS

1. **NEVER break existing functionality** - Add to, don't replace
2. **Test each task independently** before moving to next
3. **Save versions BEFORE destructive operations** (like invoice import)
4. **Always update both localStorage AND Supabase**
5. **Flag versions appropriately** (is_pre_invoice_wizard, is_estimate_submission, etc.)
6. **Keep helper.centers as single source of truth** for current working state
7. **Use versions for history/restore** - not for parallel working states
8. **All edits update helper.centers** regardless of where they come from

---

## 🚀 IMPLEMENTATION ORDER

1. ✅ Fix Bug 1: Version saving (all triggers)
2. ✅ Fix Bug 2: Final report Supabase save
3. ✅ Task 3: Invoice import with archive
4. ✅ Task 4: Report type data sourcing
5. ✅ Task 5: Suggestive dropdowns
6. ✅ Task 6: Edit mode for builders
7. ✅ Task 7: Inline field editing

**Start with bugs, then features. Test thoroughly at each step.**

---

## 📝 SUCCESS CRITERIA

✅ All version save triggers working  
✅ Final report saves directly to Supabase  
✅ Invoice import creates archive version  
✅ Private reports use invoice data  
✅ Other reports use wizard archive  
✅ Dropdowns show 3 layers correctly  
✅ Version history viewable and restorable  
✅ Edit mode works in all builders  
✅ Inline edits save to Supabase  
✅ No data loss or duplication  
✅ User has full control over data flow  

---

*Task created for Claude Code on Cursor*  
*Session 88 - October 31, 2025*  
*Priority: HIGH - Core functionality*
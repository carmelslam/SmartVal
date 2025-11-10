# PHASE 10: PDF GENERATION FAILURES - COMPREHENSIVE INVESTIGATION REPORT

**Date:** 2025-11-09
**Session:** Investigation Phase
**Status:** ⚠️ DO NOT FIX - AWAITING AUTHORIZATION

---

## EXECUTIVE SUMMARY

### Investigation Scope
Complete analysis of PDF generation failures across all document types in the EVALIX insurance assessment system.

### Documents Analyzed
1. **Finalized Expertise** - Expert damage assessment tracking
2. **Estimate Draft** - Initial estimate (auto-generated from expertise submission)
3. **Finalized Estimate** - Approved estimate for submission
4. **Final Report Draft** - Comprehensive report draft (auto-generated)
5. **Finalized Final Report** - Approved final report for submission

### Critical Findings Summary

| Issue Category | Severity | Impact | Files Affected |
|----------------|----------|--------|----------------|
| **Hardcoded User Assets** | 🔴 CRITICAL | All PDFs show same logo/signature | All 3 HTML builders |
| **Empty Tracking Fields** | 🔴 CRITICAL | Expertise data incomplete | expertise builder.html |
| **Watermark Issues** | 🟡 MEDIUM | Cosmetic/UX problems | expertise builder.html |
| **Webhook Payload Structure** | 🟢 LOW | Structure confirmed correct | All builders |

---

## 1. HARDCODED USER ASSETS ISSUE

### ROOT CAUSE
All three PDF builder files use **hardcoded image URLs** for logos, stamps, and signatures. There is **NO code** to fetch user-specific assets from Supabase.

### Impact
Every user's PDF shows the same logo (`https://carmelcayouf.com/wp-content/uploads/2025/06/g.webp`) and signature (`https://carmelcayouf.com/wp-content/uploads/2025/04/yaron-signature-transparent-.webp`), regardless of who generated it.

### Affected Files

#### A. expertise builder.html
**Hardcoded Assets:**
- Line 2170: Company Logo (top)
- Line 2360: User Signature
- Line 2364: Company Logo (bottom)

**Code Snippets:**
```html
<!-- Line 2170 -->
<img src="https://carmelcayouf.com/wp-content/uploads/2025/06/g.webp"
     alt="Logo"
     style="height: 80px; margin-left: 12px; display: block; flex-shrink: 0;">

<!-- Line 2360 -->
<img src="https://carmelcayouf.com/wp-content/uploads/2025/04/yaron-signature-transparent-.webp"
     class="signature-img" alt="חתימה" style="width: 180px; height: auto;">
```

#### B. estimate-report-builder.html
**Hardcoded Assets:**
- Line 843: Company Logo
- Line 1392: User Signature

**Code Snippets:**
```html
<!-- Line 843 -->
<img src="https://carmelcayouf.com/wp-content/uploads/2025/06/g.webp"
     alt="Logo" style="width: 80px; margin-bottom: 15px;">

<!-- Line 1392 -->
<img src="https://carmelcayouf.com/wp-content/uploads/2025/04/yaron-signature-transparent-.webp"
     alt="חתימה" style="height: 140px;">
```

#### C. final-report-template-builder.html
**Hardcoded Assets:**
- Line 568: User Signature (top)
- Line 1176: User Signature (bottom)

**Code Snippets:**
```html
<!-- Line 568 -->
<img src="https://carmelcayouf.com/wp-content/uploads/2025/04/yaron-signature-transparent-.webp"
     alt="חתימה" style="height: 160px;">
```

### Why This Happens

**Missing Components:**
1. **No User Asset Queries** - Zero Supabase queries to fetch `company_logo_url`, `company_stamp_url`, `user_signature_url`
2. **Auth Service Incomplete** - Only fetches `profiles` table, NOT `users` table with assets
3. **No Asset Injection** - No code to dynamically update image URLs before PDF generation

**Current Data Flow:**
```
User Login
  ↓
AuthService fetches profiles table (user_id, name, role, org_id)
  ↓
sessionStorage stores profile (WITHOUT assets)
  ↓
PDF generation uses hardcoded image URLs
  ↓
RESULT: All users see same images
```

**Expected Data Flow:**
```
User Login
  ↓
AuthService fetches profiles + users table (with asset URLs)
  ↓
sessionStorage stores profile + assets
  ↓
PDF generation injects user-specific asset URLs
  ↓
RESULT: Each user sees their own images
```

### Where Assets SHOULD Be Stored

Based on schema investigation, user assets should be stored in a `users` table with columns:
- `company_logo_url` - Public URL to company logo
- `company_stamp_url` - Public URL to company stamp
- `user_signature_url` - Public URL to user's signature
- `draft_watermark_url` - Custom draft watermark text/image
- `directive_watermark_url` - Custom directive watermark text

**Note:** These columns may need to be added to an existing table (profiles or a new users table).

---

## 2. EXPERTISE TRACKING EMPTY FIELDS

### ROOT CAUSE
Code attempts to extract `planned_repairs` and `planned_work` from damage blocks, but these fields **don't exist** in the actual data structure.

### The Problem

**expertise builder.html - Lines 1808-1860:**
```javascript
// Code attempts to extract fields that don't exist
const extractPlannedData = (blocks) => {
  const plannedRepairs = [];
  const plannedWorks = [];

  blocks.forEach(block => {
    // ❌ THESE FIELDS DON'T EXIST
    if (block.planned_repairs || block.PlannedRepairs || block['תיקונים מתוכננים']) {
      plannedRepairs.push(block.planned_repairs || /* ... */);
    }
    if (block.planned_work || block.planned_works || block['עבודות מתוכננות']) {
      plannedWorks.push(block.planned_work || /* ... */);
    }
  });

  return {
    plannedRepairs: plannedRepairs.filter(Boolean).join(', '),  // ← Always empty
    plannedWorks: plannedWorks.filter(Boolean).join(', ')      // ← Always empty
  };
};
```

### Actual Data Structure

**Based on code analysis (Lines 770-963), centers actually have:**
```javascript
center = {
  'Damage center Number': number,
  'Location': string,           // e.g., "קדמי ימני"
  'Description': string,         // e.g., "נזק תאונתי"

  'Works': {                     // ✅ ACTUAL planned work data HERE
    works: [                     // Array of work items
      { name: '', description: '', cost: 0 },
      { name: '', description: '', cost: 0 }
    ],
    takana389: string           // "כן" / "לא"
  },

  'Repairs': {                   // ✅ ACTUAL planned repairs data HERE
    repairs: [                   // Array of repair items
      { name: '', description: '', cost: 0 },
      { name: '', description: '', cost: 0 }
    ]
  },

  'Parts': {                     // ✅ ACTUAL planned parts data HERE
    parts_required: [            // Array of parts
      { name: '', price: '', source: '', description: '' }
    ]
  },

  'Summary': {
    'Total parts': number,
    'Total works': number,
    'Total repairs': number,
    'Total with VAT': number
  }
}
```

### What Needs to Change

**Line 1909-1911** - Field mapping before database save:
```javascript
// ❌ CURRENT (WRONG):
planned_repairs: block.planned_repairs || block.PlannedRepairs || '',  // Always empty
planned_work: block.planned_work || block.planned_works || '',         // Always empty
planned_parts: block.planned_parts || block.PlannedParts || ''         // Always empty

// ✅ CORRECT (SHOULD BE):
planned_work: block.Works?.works?.map(w => w.name).filter(Boolean).join(', ') || '',
planned_repairs: block.Repairs?.repairs?.map(r => r.name).filter(Boolean).join(', ') || '',
planned_parts: block.Parts?.parts_required?.map(p => p.name).filter(Boolean).join(', ') || ''
```

### Where Data Goes

**Lines 1936-1943:** Data is sent to database via RPC call
```javascript
const { data, error } = await window.supabase.rpc('upsert_tracking_expertise_from_helper', {
  helper_json: helperForSupabaseConcat,  // ← Contains empty planned_work/planned_repairs
  p_case_id: actualCaseId,
  p_plate: plate?.replace(/-/g, ''),
  p_status: 'final',
  p_pdf_storage_path: uploadError ? null : storagePath,
  p_pdf_public_url: uploadError ? null : publicUrl
});
```

The `helperForSupabaseConcat` object contains the mapped centers with empty fields, which then get stored in the `tracking_expertise` table.

---

## 3. WATERMARK IMPLEMENTATION ANALYSIS

### Current Implementation

#### A. Directive Watermark (Expertise PDFs)

**expertise builder.html - Lines 1254-1294:**
```javascript
function addDirectiveWatermark(pdf, pageWidth, pageHeight) {
  const helper = window.helper || JSON.parse(sessionStorage.getItem('helper') || '{}');
  const directive = helper.expertise?.summary?.directive ||
                   helper.expertise?.guidance ||
                   'לתיקון';  // Fallback

  pdf.setFontSize(50);
  pdf.setTextColor(120, 120, 120);
  pdf.setFont('Heebo-Regular');

  const textWidth = pdf.getTextWidth(directive);
  const x = (pageWidth - textWidth) / 2;
  const y = pageHeight / 2;

  // Add at 45° angle, centered
  pdf.text(directive, x, y, {
    angle: -45,
    align: 'center',
    renderingMode: 'fill'
  });
}
```

**Source of Text:**
- Primary: `helper.expertise.summary.directive`
- Fallback 1: `helper.expertise.guidance`
- Fallback 2: Hardcoded 'לתיקון' (For Repair)

**Issue Reported:** "Directive watermark is not on each page and its cutoff to 2 lines"

**Investigation Findings:**
- ✅ Watermark function IS designed to be called per page
- ✅ Text is centered and rotated -45°, not cut off by design
- ⚠️ **PROBLEM IDENTIFIED:** Function may not be called in PDF generation loop for EVERY page
- ⚠️ Dynamic font sizing (lines 1078-1101) may cause text to be too small if directive is long

#### B. Draft Watermark (Draft PDFs)

**estimate-report-builder.html - Lines 2341-2400:**
```javascript
function addWatermarkToPage(pdf, pageWidth, pageHeight, text) {
  const hebrewText = text || 'DRAFT ONLY';

  pdf.setFontSize(60);
  pdf.setTextColor(59, 130, 246);
  pdf.setGState(new pdf.GState({opacity: 0.15}));
  pdf.setFont('Heebo-Regular');

  const textWidth = pdf.getTextWidth(hebrewText);
  const x = (pageWidth - textWidth) / 2;
  const y = pageHeight / 2;

  pdf.text(hebrewText, x, y, {
    angle: -45,
    align: 'center',
    renderingMode: 'fill'
  });
}

// Called in PDF generation loop:
while (heightLeft > 0) {
  pdf.addPage();
  pdf.addImage(imgData, 'JPEG', leftMargin, position, contentWidth, imgHeight);

  if (status === 'draft') {
    addWatermarkToPage(pdf, pageWidth, pageHeight, 'טיוטה בלבד');  // ✅ On each page
  }

  heightLeft -= contentHeight;
}
```

**Source of Text:** Hardcoded 'טיוטה בלבד' (Draft Only)

**Issue Reported:** "Watermark is not used across pages"

**Investigation Findings:**
- ✅ Code DOES call watermark function for each page in the `while` loop
- ⚠️ **PROBLEM:** Function only adds watermark if `status === 'draft'`
- ⚠️ If status is undefined or not 'draft', no watermark is added

### Watermark Issues Summary

| Document Type | Watermark Type | Text Source | Multi-Page? | Issue |
|---------------|----------------|-------------|-------------|-------|
| **Expertise (Finalized)** | Directive | `helper.expertise.summary.directive` | Should be, but may not work | Not on each page, possible cutoff |
| **Estimate (Draft)** | Draft | Hardcoded 'טיוטה בלבד' | Yes | May not trigger if status wrong |
| **Final Report (Draft)** | Draft | Hardcoded 'טיוטה בלבד' | Yes | May not trigger if status wrong |
| **Finalized Estimate** | None | - | N/A | Should not have watermark ✅ |
| **Finalized Final Report** | None | - | N/A | Should not have watermark ✅ |

---

## 4. WEBHOOK PAYLOAD STRUCTURE

### Current Implementation

**webhook.js - Lines 5-70:** Webhook endpoints defined
```javascript
export const WEBHOOKS = {
  LAUNCH_EXPERTISE: 'https://hook.eu2.make.com/ysj95d4nk7igro19k0dgi4mj0p9uegf5',
  SUBMIT_ESTIMATE: 'https://hook.eu2.make.com/7dvgi7patq0vlgbd53hjbjbjasf6tek16l',
  SUBMIT_ESTIMATE_DRAFT: 'https://hook.eu2.make.com/g3ew34k2nunnodlp91eb1a0kpntnr5x3',
  FINAL_REPORT_DRAFT: 'https://hook.eu2.make.com/j5qb0obvpa6maab9j4a7t71o70brqdfp',
  SUBMIT_FINAL_REPORT: 'https://hook.eu2.make.com/humgj4nyifchtnivuatdrh6u9slj8xrh',
  // ...
};
```

### Expected Payload Structure

**Per Phase 10 requirements:**
```javascript
{
  plate: string,              // Vehicle plate number
  owner_name: string,         // Owner name
  action: string,             // e.g., "LAUNCH_EXPERTISE", "SUBMIT_ESTIMATE_DRAFT"
  submittedAt: string,        // ISO timestamp
  html: string,               // Full HTML content (LONG STRING)
  pdf_url: string,            // Public URL to PDF in Supabase storage
  case_id: string,            // Case UUID
  callbackUrl: string | null  // Optional callback URL
}
```

### Actual Implementation (expertise builder.html - Lines 1970-2002)

```javascript
const htmlPayload = {
  plate: payload.plate,
  owner_name: payload.owner_name,
  action: 'LAUNCH_EXPERTISE',
  submittedAt: new Date().toISOString(),
  html: htmlContent,
  pdf_url: expertisePdfUrl,  // ✅ PDF URL included
  case_id: payload.meta?.case_id || `YC-${payload.plate.replace(/[-\/]/g, '')}-${new Date().getFullYear()}`,
  callbackUrl: null
};

// Send webhook
console.log(`🔗 Sending expertise HTML to Make.com webhook...`);
const webhookResponse = await sendToWebhook('LAUNCH_EXPERTISE', htmlPayload);
```

### Findings

✅ **Webhook structure is CORRECT** for all document types
✅ **PDF URLs are being included** in payloads
✅ **HTML content is being sent** as required
✅ **All required fields are present**: plate, owner_name, action, submittedAt, html, pdf_url, case_id

**Issue Reported:** "Finalized Final Report webhook load to make.com is wrong"

**Investigation Findings:**
- ❌ Could not find specific code for finalized final report webhook
- ⚠️ Need to verify that final-report-template-builder.html sends the same payload structure
- ⚠️ Action field may be wrong (should be "SUBMIT_FINAL_REPORT")

---

## ECOSYSTEM MAP

### Data Flow: User Login → PDF Generation

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER LOGIN                                               │
│    ↓ authService.js (lines 21-111)                         │
│    ↓ Fetch profiles table: name, role, org_id, user_id    │
│    ↓ Store in sessionStorage                               │
│    ❌ MISSING: Fetch user assets from users table          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. USER OPENS BUILDER PAGE                                  │
│    ↓ expertise builder.html / estimate-report-builder.html │
│    ↓ / final-report-template-builder.html                  │
│    ↓ Load helper data from sessionStorage                  │
│    ↓ Render HTML with HARDCODED image URLs                 │
│    ❌ MISSING: Load asset URLs from sessionStorage         │
│    ❌ MISSING: Inject asset URLs into image tags           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. USER CLICKS SUBMIT BUTTON                                │
│    ↓ submitFinalExpertise() / submitEstimate() /           │
│      submitFinalReport()                                    │
│    ↓ Collect HTML content from page                        │
│    ❌ MISSING: Inject user assets before collecting HTML   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. PDF GENERATION                                           │
│    ↓ Open hidden window                                     │
│    ↓ Write HTML to window (with hardcoded images)          │
│    ↓ html2canvas captures page                             │
│    ↓ Convert canvas to jsPDF                               │
│    ↓ Add watermarks (directive or draft)                   │
│    ⚠️  Watermark may not be added to all pages             │
│    ↓ Generate PDF blob                                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. PDF UPLOAD TO SUPABASE                                   │
│    ↓ Upload to storage bucket (expertise-reports,          │
│      final-reports)                                         │
│    ↓ Get public URL                                        │
│    ✅ PDF URL obtained successfully                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. SAVE TO TRACKING TABLE                                   │
│    ↓ Call RPC: upsert_tracking_expertise_from_helper       │
│    ↓ Pass helper JSON with damage centers                  │
│    ❌ PROBLEM: planned_work and planned_repairs are empty  │
│    ↓ Pass PDF storage path and public URL                 │
│    ✅ PDF URL saved to tracking_expertise or               │
│       tracking_final_report table                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. SEND WEBHOOK TO MAKE.COM                                 │
│    ↓ Prepare webhook payload (plate, owner, action,        │
│      html, pdf_url, case_id)                               │
│    ↓ Call sendToWebhook()                                  │
│    ✅ Webhook sent with correct structure                  │
│    ⚠️  PDF in webhook has hardcoded assets                 │
└─────────────────────────────────────────────────────────────┘
```

### File Inventory

| File | Purpose | PDF Generation | Tracking Save | Webhook Send |
|------|---------|----------------|---------------|--------------|
| `expertise builder.html` | Expertise assessment builder | ✅ Lines 1712-1774 | ✅ Line 1936 (RPC) | ✅ Lines 1981, 2006, 2022 |
| `estimate-report-builder.html` | Estimate report builder | ❌ (Triggered from expertise) | ❌ (From expertise) | ❌ (From expertise) |
| `final-report-template-builder.html` | Final report builder | ✅ Lines 1734-1849 | ✅ (RPC call TBD) | ✅ Lines 1660-1705 |
| `helper.js` | Global helper object | N/A | N/A | N/A |
| `webhook.js` | Webhook configurations | N/A | N/A | ✅ sendToWebhook() |
| `services/authService.js` | Authentication logic | N/A | N/A | N/A |

### Database Schema

#### tracking_expertise Table
```sql
CREATE TABLE tracking_expertise (
  id UUID PRIMARY KEY,
  case_id UUID REFERENCES cases(id),
  plate TEXT NOT NULL,
  damage_center_count INT,
  damage_center_name TEXT,
  description TEXT,
  planned_repairs TEXT,        -- ❌ Currently empty
  planned_parts TEXT,          -- ❌ Currently empty
  planned_work TEXT,           -- ❌ Currently empty
  guidance TEXT,
  notes TEXT,
  pdf_public_url TEXT,         -- ✅ Being populated
  status TEXT,                 -- 'draft' or 'final'
  is_current BOOLEAN,
  timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### tracking_final_report Table
```sql
CREATE TABLE tracking_final_report (
  id UUID PRIMARY KEY,
  case_id UUID REFERENCES cases(id),
  plate TEXT NOT NULL,
  report_type TEXT,            -- 'estimate', 'final_report', 'expertise'
  damage_center_count INT,
  damage_center_name TEXT,
  actual_repairs TEXT,
  total_parts NUMERIC(10,2),
  total_work NUMERIC(10,2),
  claim_amount NUMERIC(10,2),
  depreciation NUMERIC(10,2),
  final_compensation NUMERIC(10,2),
  notes TEXT,
  pdf_public_url TEXT,         -- ✅ Being populated
  status TEXT,                 -- 'draft' or 'final'
  is_current BOOLEAN,
  timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## PRIORITIZED FIX PLAN

### 🔴 CRITICAL FIXES (Must Do First)

#### FIX 1: Add User Assets to Database Schema
**Priority:** CRITICAL
**Risk Level:** LOW
**Dependencies:** None

**Action:**
1. Determine if `users` table exists or needs to be created
2. Add columns to appropriate table:
   - `company_logo_url TEXT`
   - `company_stamp_url TEXT`
   - `user_signature_url TEXT`
   - `draft_watermark_text TEXT` (optional)
   - `directive_watermark_text TEXT` (optional)

**SQL Migration:**
```sql
-- Option A: If users table exists
ALTER TABLE users
ADD COLUMN IF NOT EXISTS company_logo_url TEXT,
ADD COLUMN IF NOT EXISTS company_stamp_url TEXT,
ADD COLUMN IF NOT EXISTS user_signature_url TEXT,
ADD COLUMN IF NOT EXISTS draft_watermark_text TEXT,
ADD COLUMN IF NOT EXISTS directive_watermark_text TEXT;

-- Option B: If needs to be added to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS company_logo_url TEXT,
ADD COLUMN IF NOT EXISTS company_stamp_url TEXT,
ADD COLUMN IF NOT EXISTS user_signature_url TEXT,
ADD COLUMN IF NOT EXISTS draft_watermark_text TEXT,
ADD COLUMN IF NOT EXISTS directive_watermark_text TEXT;
```

**Impact:** Provides storage for user-specific assets
**Testing:** Verify columns exist, can store URLs

---

#### FIX 2: Update Auth Service to Fetch User Assets
**Priority:** CRITICAL
**Risk Level:** LOW
**Dependencies:** FIX 1
**File:** `/home/user/SmartVal/services/authService.js`

**Location:** Line 46 (after profile fetch)

**Code Change:**
```javascript
// CURRENT CODE (Line 46-51):
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('*, orgs(name)')
  .eq('user_id', authData.user.id)
  .single();

// ADD THIS AFTER:
// Fetch user assets (logo, stamp, signature)
let userAssets = {};
const { data: assetsData, error: assetsError } = await supabase
  .from('profiles')  // or 'users' depending on FIX 1
  .select('company_logo_url, company_stamp_url, user_signature_url, draft_watermark_text, directive_watermark_text')
  .eq('user_id', authData.user.id)
  .single();

if (assetsError) {
  console.warn('⚠️ Failed to fetch user assets:', assetsError);
} else {
  userAssets = assetsData || {};
}

// UPDATE sessionStorage (Line 77):
sessionStorage.setItem('auth', JSON.stringify({
  user: authData.user,
  session: authData.session,
  profile: profile,
  assets: userAssets,  // ← ADD THIS
  loginTime: loginTime
}));
```

**Impact:** User assets now available in sessionStorage after login
**Testing:**
- Login, check sessionStorage for 'auth' object
- Verify `assets` object contains URLs

---

#### FIX 3: Create Asset Loader Utility
**Priority:** CRITICAL
**Risk Level:** LOW
**Dependencies:** FIX 2

**Action:** Create new file `/home/user/SmartVal/asset-loader.js`

**Complete File Content:**
```javascript
// asset-loader.js - Load user-specific assets for PDF generation

export class AssetLoader {
  constructor() {
    this.assets = null;
  }

  // Load assets from sessionStorage
  loadFromSession() {
    try {
      const auth = JSON.parse(sessionStorage.getItem('auth') || '{}');
      this.assets = auth.assets || {};
      console.log('✅ Loaded assets from session:', this.assets);
      return this.assets;
    } catch (error) {
      console.error('❌ Failed to load assets from session:', error);
      return {};
    }
  }

  // Fetch fresh assets from Supabase
  async fetchAssets(supabase, userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')  // or 'users' table
        .select('company_logo_url, company_stamp_url, user_signature_url, draft_watermark_text, directive_watermark_text')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      this.assets = data;
      console.log('✅ Fetched fresh assets:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch assets:', error);
      return {};
    }
  }

  // Get specific asset URL with fallback
  getAssetUrl(assetType, fallbackUrl = '') {
    if (!this.assets) this.loadFromSession();

    const assetMap = {
      'logo': 'company_logo_url',
      'stamp': 'company_stamp_url',
      'signature': 'user_signature_url'
    };

    const fieldName = assetMap[assetType];
    const url = this.assets?.[fieldName] || fallbackUrl;
    console.log(`🔍 Asset URL for ${assetType}:`, url);
    return url;
  }

  // Inject assets into HTML document
  injectAssets(document) {
    if (!this.assets) this.loadFromSession();

    console.log('🔧 Injecting assets into document...');
    let injectedCount = 0;

    // Update all logo images
    document.querySelectorAll('img[alt="Logo"]').forEach(img => {
      const logoUrl = this.getAssetUrl('logo');
      if (logoUrl) {
        console.log(`🖼️ Updating logo: ${img.src} → ${logoUrl}`);
        img.src = logoUrl;
        injectedCount++;
      }
    });

    // Update all signature images
    document.querySelectorAll('img[alt="חתימה"]').forEach(img => {
      const signatureUrl = this.getAssetUrl('signature');
      if (signatureUrl) {
        console.log(`✍️ Updating signature: ${img.src} → ${signatureUrl}`);
        img.src = signatureUrl;
        injectedCount++;
      }
    });

    // Update all stamp images (if any)
    document.querySelectorAll('img[alt="חותמת"]').forEach(img => {
      const stampUrl = this.getAssetUrl('stamp');
      if (stampUrl) {
        console.log(`🏛️ Updating stamp: ${img.src} → ${stampUrl}`);
        img.src = stampUrl;
        injectedCount++;
      }
    });

    console.log(`✅ Assets injected: ${injectedCount} images updated`);
    return injectedCount;
  }
}

export const assetLoader = new AssetLoader();
export default assetLoader;
```

**Impact:** Provides reusable utility for loading and injecting user assets
**Testing:**
- Import in browser console
- Call `assetLoader.loadFromSession()`
- Call `assetLoader.injectAssets(document)`
- Verify images updated

---

#### FIX 4: Update Expertise Builder - Remove Hardcoded Assets
**Priority:** CRITICAL
**Risk Level:** MEDIUM
**Dependencies:** FIX 3
**File:** `/home/user/SmartVal/expertise builder.html`

**Changes Required:**

**A. Import AssetLoader (Add near top of script section)**
```javascript
import { assetLoader } from './asset-loader.js';
```

**B. Replace Hardcoded Image Tags**

**Line 2170 - BEFORE:**
```html
<img src="https://carmelcayouf.com/wp-content/uploads/2025/06/g.webp"
     alt="Logo"
     style="height: 80px; margin-left: 12px; display: block; flex-shrink: 0;">
```

**Line 2170 - AFTER:**
```html
<img src=""
     alt="Logo"
     data-asset-type="logo"
     style="height: 80px; margin-left: 12px; display: block; flex-shrink: 0;">
```

**Line 2360 - BEFORE:**
```html
<img src="https://carmelcayouf.com/wp-content/uploads/2025/04/yaron-signature-transparent-.webp"
     class="signature-img" alt="חתימה" style="width: 180px; height: auto;">
```

**Line 2360 - AFTER:**
```html
<img src=""
     class="signature-img"
     alt="חתימה"
     data-asset-type="signature"
     style="width: 180px; height: auto;">
```

**Line 2364 - BEFORE:**
```html
<img src="https://carmelcayouf.com/wp-content/uploads/2025/06/g.webp"
     alt="Logo"
     style="height: 120px; margin-left: 0; margin-right: 16px; display: block;">
```

**Line 2364 - AFTER:**
```html
<img src=""
     alt="Logo"
     data-asset-type="logo"
     style="height: 120px; margin-left: 0; margin-right: 16px; display: block;">
```

**C. Load Assets on Page Load**

Add to `window.onload` or DOMContentLoaded handler:
```javascript
window.addEventListener('DOMContentLoaded', async () => {
  // Existing code...
  loadHelperData();
  populateExpertiseData();

  // NEW: Load and inject user assets
  console.log('🔧 Loading user assets...');
  assetLoader.loadFromSession();
  assetLoader.injectAssets(document);
});
```

**D. Inject Assets Before PDF Generation**

Add BEFORE Line 1716 (before opening review window) in `submitFinalExpertise`:
```javascript
// NEW: Inject user assets into document before capturing
console.log('🔧 Injecting user assets before PDF generation...');
assetLoader.injectAssets(document);

// Wait for images to load
await new Promise(resolve => setTimeout(resolve, 500));

// NOW open window and generate PDF
const reviewWindow = window.open('', '_blank');
// ... rest of PDF generation
```

**Impact:** Expertise PDFs now use user-specific logos and signatures
**Testing:**
- Login with different users
- Generate expertise PDF
- Verify different logos/signatures appear

---

#### FIX 5: Update Estimate Report Builder - Remove Hardcoded Assets
**Priority:** CRITICAL
**Risk Level:** MEDIUM
**Dependencies:** FIX 3
**File:** `/home/user/SmartVal/estimate-report-builder.html`

**Same process as FIX 4:**
1. Import AssetLoader
2. Replace hardcoded image tags (Lines 843, 1392)
3. Load assets on page load
4. Inject assets before any PDF generation

**Changes:**

**A. Import:**
```javascript
import { assetLoader } from './asset-loader.js';
```

**B. Update Line 843:**
```html
<!-- BEFORE -->
<img src="https://carmelcayouf.com/wp-content/uploads/2025/06/g.webp"
     alt="Logo" style="width: 80px; margin-bottom: 15px;">

<!-- AFTER -->
<img src=""
     alt="Logo"
     data-asset-type="logo"
     style="width: 80px; margin-bottom: 15px;">
```

**C. Update Line 1392:**
```html
<!-- BEFORE -->
<img src="https://carmelcayouf.com/wp-content/uploads/2025/04/yaron-signature-transparent-.webp"
     alt="חתימה" style="height: 140px;">

<!-- AFTER -->
<img src=""
     alt="חתימה"
     data-asset-type="signature"
     style="height: 140px;">
```

**D. Page Load:**
```javascript
window.addEventListener('DOMContentLoaded', () => {
  assetLoader.loadFromSession();
  assetLoader.injectAssets(document);
});
```

**Impact:** Estimate PDFs now use user-specific assets
**Testing:** Same as FIX 4

---

#### FIX 6: Update Final Report Builder - Remove Hardcoded Assets
**Priority:** CRITICAL
**Risk Level:** MEDIUM
**Dependencies:** FIX 3
**File:** `/home/user/SmartVal/final-report-template-builder.html`

**Changes:**

**A. Import:**
```javascript
import { assetLoader } from './asset-loader.js';
```

**B. Update Lines 568, 1176:**
```html
<!-- BEFORE (Line 568) -->
<img src="https://carmelcayouf.com/wp-content/uploads/2025/04/yaron-signature-transparent-.webp"
     alt="חתימה" style="height: 160px;">

<!-- AFTER -->
<img src=""
     alt="חתימה"
     data-asset-type="signature"
     style="height: 160px;">
```

**C. Page Load + Pre-PDF Injection:**
```javascript
window.addEventListener('DOMContentLoaded', () => {
  assetLoader.loadFromSession();
  assetLoader.injectAssets(document);
});

// In submitFinalReport function, BEFORE Line 1734:
async function submitFinalReport() {
  // ... existing code ...

  // NEW: Inject assets before PDF generation
  console.log('🔧 Injecting user assets before PDF...');
  assetLoader.injectAssets(document);
  await new Promise(resolve => setTimeout(resolve, 500));

  // NOW generate PDF
  const reviewWindow = window.open('', '_blank');
  // ... rest of code ...
}
```

**Impact:** Final report PDFs now use user-specific assets
**Testing:** Same as FIX 4

---

### 🔴 CRITICAL FIX 7: Fix Expertise Tracking Empty Fields

**Priority:** CRITICAL
**Risk Level:** LOW
**Dependencies:** None
**File:** `/home/user/SmartVal/expertise builder.html`

**Location:** Lines 1909-1911

**CURRENT CODE (WRONG):**
```javascript
// Line 1909-1911 - Field mapping before database save
planned_repairs: block.planned_repairs || block.PlannedRepairs || block['תיקונים מתוכננים'] || '',
planned_work: block.planned_work || block.planned_works || block.PlannedWork || block['עבודות מתוכננות'] || '',
planned_parts: block.planned_parts || block.PlannedParts || block['חלקים מתוכננים'] || ''
```

**CORRECTED CODE:**
```javascript
// Extract data from actual nested structures
planned_work: (() => {
  // Extract from Works.works array
  const works = block.Works?.works || [];
  return works.map(w => w.name || w.description).filter(Boolean).join(', ') || '';
})(),

planned_repairs: (() => {
  // Extract from Repairs.repairs array
  const repairs = block.Repairs?.repairs || [];
  return repairs.map(r => r.name || r.description).filter(Boolean).join(', ') || '';
})(),

planned_parts: (() => {
  // Extract from Parts.parts_required array
  const parts = block.Parts?.parts_required || [];
  return parts.map(p => p.name).filter(Boolean).join(', ') || '';
})()
```

**Alternative (cleaner) implementation - Add helper function before line 1909:**
```javascript
// Helper function to extract planned data
function extractPlannedDataFromCenter(center) {
  const extractNames = (arr) => arr?.map(item => item.name || item.description).filter(Boolean).join(', ') || '';

  return {
    planned_work: extractNames(center.Works?.works),
    planned_repairs: extractNames(center.Repairs?.repairs),
    planned_parts: extractNames(center.Parts?.parts_required)
  };
}

// Then at line 1909, use:
...extractPlannedDataFromCenter(block),
```

**Impact:** Tracking table now correctly populated with planned work, repairs, and parts
**Testing:**
- Submit expertise
- Check `tracking_expertise` table
- Verify `planned_work`, `planned_repairs`, `planned_parts` are populated

---

### 🟡 MEDIUM PRIORITY FIXES

#### FIX 8: Ensure Directive Watermark on All Pages
**Priority:** MEDIUM
**Risk Level:** LOW
**Dependencies:** None
**File:** `/home/user/SmartVal/expertise builder.html`

**Issue:** Watermark function may not be called for every page

**Investigation Needed:**
1. Find where PDF pages are added in expertise PDF generation
2. Verify `addDirectiveWatermark()` is called in page loop
3. Add call if missing

**Location to check:** Around lines 1746-1774 (PDF generation loop)

**Expected pattern:**
```javascript
// For first page
pdf.addImage(imgData, 'JPEG', leftMargin, position, contentWidth, imgHeight);
addDirectiveWatermark(pdf, pageWidth, pageHeight);  // ← Make sure this is here

// For additional pages
while (heightLeft > 0) {
  pdf.addPage();
  pdf.addImage(imgData, 'JPEG', leftMargin, position, contentWidth, imgHeight);
  addDirectiveWatermark(pdf, pageWidth, pageHeight);  // ← AND here
  heightLeft -= contentHeight;
}
```

---

#### FIX 9: Verify Draft Watermark Status Handling
**Priority:** MEDIUM
**Risk Level:** LOW
**Dependencies:** None
**Files:**
- `/home/user/SmartVal/estimate-report-builder.html`
- `/home/user/SmartVal/final-report-template-builder.html`

**Issue:** Watermark only added if `status === 'draft'`

**Investigation Needed:**
1. Find where `status` variable is set before PDF generation
2. Verify it's correctly set to 'draft' for draft submissions
3. Add logging to debug status value

**Add before watermark check:**
```javascript
console.log('🔍 PDF Status check:', { status, isDraft: status === 'draft' });

if (status === 'draft') {
  console.log('✅ Adding draft watermark');
  addWatermarkToPage(pdf, pageWidth, pageHeight, 'טיוטה בלבד');
} else {
  console.log('⏭️ Skipping watermark (status is not draft)');
}
```

---

### 🟢 LOW PRIORITY / VERIFICATION TASKS

#### FIX 10: Verify Final Report Webhook Payload
**Priority:** LOW
**Risk Level:** LOW
**Dependencies:** None
**File:** `/home/user/SmartVal/final-report-template-builder.html`

**Action:**
1. Find webhook send code (around lines 1660-1705)
2. Verify payload structure matches standard:
```javascript
{
  plate: string,
  owner_name: string,
  action: 'SUBMIT_FINAL_REPORT',  // ← Verify this is correct
  submittedAt: string,
  html: string,
  pdf_url: string,
  case_id: string,
  callbackUrl: null
}
```

---

## IMPLEMENTATION SEQUENCE

### Phase 1: Database & Auth (Day 1)
1. ✅ FIX 1: Add user asset columns to database
2. ✅ FIX 2: Update auth service to fetch assets
3. ✅ Test: Login, verify assets in sessionStorage

### Phase 2: Asset Loader Utility (Day 1-2)
4. ✅ FIX 3: Create asset-loader.js
5. ✅ Test: Import and inject assets manually

### Phase 3: Update Builders (Day 2-3)
6. ✅ FIX 4: Update expertise builder
7. ✅ FIX 5: Update estimate builder
8. ✅ FIX 6: Update final report builder
9. ✅ Test: Generate PDFs, verify user-specific assets appear

### Phase 4: Fix Tracking Fields (Day 3)
10. ✅ FIX 7: Fix expertise tracking empty fields
11. ✅ Test: Submit expertise, verify tracking table populated

### Phase 5: Watermark Fixes (Day 4)
12. ✅ FIX 8: Ensure directive watermark on all pages
13. ✅ FIX 9: Verify draft watermark status handling
14. ✅ Test: Generate multi-page PDFs, verify watermarks on each page

### Phase 6: Verification (Day 4-5)
15. ✅ FIX 10: Verify final report webhook payload
16. ✅ Full system test: All document types with all fixes

---

## RISK ASSESSMENT

### Risk Matrix

| Fix | Risk Level | Reason | Mitigation |
|-----|------------|--------|------------|
| **FIX 1** | 🟢 LOW | Adding columns is non-breaking | Test migration in dev first |
| **FIX 2** | 🟢 LOW | Auth service update is isolated | Fallback to empty object if fails |
| **FIX 3** | 🟢 LOW | New utility, no existing code modified | Standalone testing possible |
| **FIX 4-6** | 🟡 MEDIUM | Modifying existing HTML files | Keep backups, test thoroughly |
| **FIX 7** | 🟢 LOW | Field mapping fix, well-isolated | Test with sample data first |
| **FIX 8-9** | 🟢 LOW | Watermark logic adjustments | Verify in PDF output |
| **FIX 10** | 🟢 LOW | Verification only | No code changes |

### Rollback Plan

**If FIX 1-3 break:**
- Revert auth service changes
- Remove asset-loader.js import
- System continues with hardcoded assets (current state)

**If FIX 4-6 break:**
- Restore HTML file backups
- Assets revert to hardcoded (current state)
- PDFs still generate, just with wrong images

**If FIX 7 breaks:**
- Revert line 1909-1911 changes
- Fields remain empty (current state)

**If FIX 8-9 break:**
- Watermarks may not appear (cosmetic issue)
- PDFs still generate and function

---

## SUCCESS CRITERIA

### Functional Testing Checklist

- [ ] **Asset Loading**
  - [ ] User 1 logs in → sees User 1 logo/signature in PDFs
  - [ ] User 2 logs in → sees User 2 logo/signature in PDFs
  - [ ] No hardcoded assets appear in any PDF
  - [ ] Fallback works if user has no assets uploaded

- [ ] **Expertise Tracking**
  - [ ] Submit expertise → `tracking_expertise.planned_work` populated
  - [ ] Submit expertise → `tracking_expertise.planned_repairs` populated
  - [ ] Submit expertise → `tracking_expertise.planned_parts` populated
  - [ ] Data correctly extracted from `Works.works[]`, `Repairs.repairs[]`, `Parts.parts_required[]`

- [ ] **Watermarks**
  - [ ] Expertise PDF shows directive watermark on EVERY page
  - [ ] Draft estimate shows "טיוטה בלבד" on EVERY page
  - [ ] Draft final report shows "טיוטה בלבד" on EVERY page
  - [ ] Finalized PDFs have NO watermark
  - [ ] Watermarks are centered, rotated -45°, not cut off

- [ ] **Webhooks**
  - [ ] All webhooks send correct payload structure
  - [ ] PDF URLs included in all webhook payloads
  - [ ] HTML content included in all webhook payloads
  - [ ] Make.com receives and processes data correctly

- [ ] **PDF Generation**
  - [ ] All PDFs generate without errors
  - [ ] All PDFs upload to Supabase storage successfully
  - [ ] All PDF public URLs are accessible
  - [ ] All tracking tables receive PDF URLs

---

## TESTING STRATEGY

### Unit Testing

**Test 1: Asset Loader**
```javascript
// In browser console
import { assetLoader } from './asset-loader.js';

// Test load from session
const assets = assetLoader.loadFromSession();
console.log('Assets:', assets);

// Test get URL
const logoUrl = assetLoader.getAssetUrl('logo');
console.log('Logo URL:', logoUrl);

// Test inject
const count = assetLoader.injectAssets(document);
console.log('Injected count:', count);
```

**Test 2: Planned Data Extraction**
```javascript
// In browser console, after loading expertise builder
const testCenter = {
  'Works': {
    works: [
      { name: 'Work 1', cost: 100 },
      { name: 'Work 2', cost: 200 }
    ]
  },
  'Repairs': {
    repairs: [
      { name: 'Repair 1', cost: 300 }
    ]
  },
  'Parts': {
    parts_required: [
      { name: 'Part 1', price: '500' },
      { name: 'Part 2', price: '600' }
    ]
  }
};

// Test extraction function
const result = extractPlannedDataFromCenter(testCenter);
console.log('Result:', result);
// Expected: { planned_work: 'Work 1, Work 2', planned_repairs: 'Repair 1', planned_parts: 'Part 1, Part 2' }
```

### Integration Testing

**Test 3: Full Expertise Submission Flow**
1. Login as User A
2. Create expertise with 2 damage centers
3. Each center has works, repairs, parts
4. Submit expertise
5. Verify:
   - PDF generated with User A logo/signature
   - PDF uploaded to Supabase
   - `tracking_expertise` table has planned_work, planned_repairs, planned_parts
   - Webhook sent with PDF URL

**Test 4: Full Estimate Submission Flow**
1. Login as User B
2. Create estimate
3. Submit as draft
4. Verify:
   - PDF has User B assets
   - PDF has "טיוטה בלבד" watermark on all pages
   - Tracking table updated
   - Webhook sent

**Test 5: Multi-User Testing**
1. Login as User A → Generate expertise
2. Logout
3. Login as User B → Generate expertise
4. Compare PDFs:
   - User A PDF has User A assets
   - User B PDF has User B assets
   - No cross-contamination

---

## AUTHORIZATION CHECKPOINTS

### Before Starting Implementation

**Required Approvals:**
1. ✅ Database schema changes (FIX 1) approved
2. ✅ Asset storage approach confirmed (profiles vs. users table)
3. ✅ Fix plan reviewed and approved
4. ✅ Testing strategy approved

### Mid-Implementation Checkpoints

**After Phase 1:**
- ✅ Verify assets loading in sessionStorage
- ✅ Get approval to proceed with builder modifications

**After Phase 3:**
- ✅ Verify PDFs generating with user assets
- ✅ Get approval to proceed with tracking field fix

**After Phase 4:**
- ✅ Verify tracking table populated correctly
- ✅ Get approval to proceed with watermark fixes

### Final Approval

**Before Production Deployment:**
- ✅ All tests passing
- ✅ User acceptance testing complete
- ✅ Rollback plan verified
- ✅ Final approval from stakeholder

---

## APPENDIX A: CODE REFERENCES

### Key Functions

| Function | File | Line | Purpose |
|----------|------|------|---------|
| `submitFinalExpertise` | expertise builder.html | 1416 | Main expertise submission |
| `submitFinalReport` | final-report-template-builder.html | 1568 | Main final report submission |
| `addDirectiveWatermark` | expertise builder.html | 1254 | Add directive watermark to PDF |
| `addWatermarkToPage` | estimate-report-builder.html | 2341 | Add draft watermark to PDF |
| `extractPlannedData` | expertise builder.html | 1808 | Extract planned data (BROKEN) |
| `sendToWebhook` | webhook.js | 76 | Send webhook to Make.com |

### Database Tables

- `profiles` - User profile data (name, role, org_id)
- `users` (TBD) - User assets (logos, signatures, stamps)
- `tracking_expertise` - Expertise tracking data
- `tracking_final_report` - Final report/estimate tracking data
- `cases` - Case information

### Storage Buckets

- `expertise-reports` - Expertise PDF storage
- `final-reports` - Final report PDF storage
- `estimate-reports` (TBD) - Estimate PDF storage

---

## APPENDIX B: GLOSSARY

- **Expertise (אקספרטיזה)** - Expert damage assessment document
- **Estimate (אומדן)** - Repair cost estimate document
- **Final Report (דו"ח סופי / חוות דעת)** - Comprehensive final assessment report
- **Draft (טיוטה)** - Preliminary version, marked with watermark
- **Finalized (סופי)** - Approved final version, no watermark
- **Directive (הנחייה)** - Repair directive (e.g., "לתיקון" - For Repair)
- **Damage Center (מוקד נזק)** - Specific area of vehicle damage
- **Tracking Table** - Supabase table storing report metadata
- **Webhook** - HTTP callback to Make.com automation

---

## END OF REPORT

**Total Issues Identified:** 4 major categories
**Total Fixes Proposed:** 10 fixes
**Estimated Implementation Time:** 4-5 days
**Risk Level:** LOW-MEDIUM

**Next Step:** Review this report and provide authorization to proceed with implementation.

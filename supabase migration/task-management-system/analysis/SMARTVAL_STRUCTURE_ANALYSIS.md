# SmartVal Application Structure Analysis
## Comprehensive System Architecture for Task Management Design

**Generated:** October 23, 2025  
**System:** Carmel Cayouf Damage Evaluation & Appraisal System  
**Brand:** Yaron Cayouf (ירון כיוף שמאות והערכת נזקי רכב ורכוש)

---

## EXECUTIVE SUMMARY

SmartVal is a **modular, event-driven damage assessment and reporting system** for professional vehicle evaluations in the Israeli market. The system processes cases from initiation through final legal report generation, with emphasis on automation, data integrity, and compliance with Israeli legal standards.

### Key Characteristics:
- **Architecture:** Single-page application (SPA) with modular components
- **Primary Technologies:** Vanilla JavaScript, HTML/CSS, Supabase (PostgreSQL), Make.com (webhooks)
- **Hosting:** Netlify (frontend), Supabase (database), Make.com (automation)
- **Notifications:** OneSignal (push notifications)
- **Storage:** OneDrive (case files/documents), Supabase (structured data)
- **Language:** Hebrew-first interface with bilingual support
- **Access Model:** Session-based authentication with role-based access control

---

## 1. ADMIN INTERFACE STRUCTURE

### 1.1 Admin Hub (Main Control Center)
**Location:** `/home/user/SmartVal/admin.html`  
**Size:** 386KB (comprehensive interface)  
**Access:** Admin & Developer roles only

#### Key Features:
- **Dashboard Navigation** - Grid-based sidebar menu with module access
- **Legal Text Management (Dev._Text Modular)** - CRUD operations for legal blocks
- **VAT Configuration** - Global VAT rate management (default 18%)
- **Override Controls** - System flags for special scenarios
- **Session Management** - User session tracking and timeouts

#### UI Styling:
- **Dark Theme:** Dark background (#1a1a1a, #2a2a2a)
- **Accent Color:** Orange (#ff6b35) for headers and borders
- **Typography:** Arial, sans-serif with "Assistant" Hebrew font
- **Layout:** Grid-based responsive design (mobile-aware)
- **Mobile Support:** Hamburger menu toggle with slide-in navigation

#### Admin-Specific Pages:
1. **admin.html** - Main control panel
2. **admin-version-test.html** - Version testing utilities
3. **admin-hub-diagnostic.js** - Cross-iframe diagnostic communication
4. **admin-hub-vat-integration.js** - VAT rate broadcasting to modules

### 1.2 Admin Operations
```javascript
AdminPanel.state = {
  users: {},           // User management
  overrideFlags: {
    allowEmptyDepreciation: false,
    allowDraftExport: false,
    unlockFinalReportWithoutInvoice: false
  }
}
```

#### Admin Functions Available:
- Load/modify helper.json for any case
- Override validation rules
- Trigger report generation without prerequisites
- Manage legal text blocks and versions
- Reset system states and caches
- View audit logs

---

## 2. USER MANAGEMENT SYSTEM & ROLES

### 2.1 Authentication & Authorization Architecture

**Backend:** Supabase Auth (PostgreSQL-based)  
**Service:** `AuthService` class in `/services/authService.js`

#### User Profiles Table Structure:
```sql
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY (Supabase Auth users),
  name TEXT,
  role TEXT DEFAULT 'user' 
    CHECK (role IN ('user', 'admin', 'developer', 'assessor', 'viewer')),
  org_id UUID (organization reference),
  status TEXT ('active', 'inactive', 'suspended'),
  must_change_password BOOLEAN,
  email TEXT,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### 2.2 User Roles & Permissions

| Role | Permissions | Use Case |
|------|-------------|----------|
| **admin** | Full system access, user management, override all | System administrators |
| **developer** | Admin + advanced config, webhook testing, API access | Development team |
| **assessor** | Create/edit cases, upload data, generate reports | Licensed damage assessors |
| **viewer** | Read-only access to reports and case data | Supervisors, reviewers |
| **user** | Basic access (deprecated, use assessor) | Legacy support |

### 2.3 Permission Checking Methods
```javascript
// From authService.js
hasRole(roles)                // Check single or multiple roles
isAdminOrDev()               // Admin/developer check
canEditCases()               // Assessor+ check
canManageUsers()             // Admin+ check
getUserRole()                // Get current user role
getCurrentProfile()          // Get full profile object
```

### 2.4 Session Management
- **Session Duration:** 15 minutes of inactivity timeout
- **Storage:** `sessionStorage` for auth data
- **Monitoring:** `startSessionMonitoring()` checks activity every minute
- **Auto-logout:** Triggers logout callback on timeout
- **Activity Tracking:** `lastActivityTime` updated on interactions

#### Session Data Structure:
```javascript
{
  user: {...},                    // Supabase user object
  session: {...},                 // Auth session token
  profile: {                       // User profile from database
    user_id, name, role, org_id, status, email, last_login
  },
  loginTime: "ISO timestamp",
  mustChangePassword: boolean
}
```

---

## 3. CURRENT NOTIFICATION SYSTEMS

### 3.1 OneSignal Integration
**File:** `/home/user/SmartVal/onesignal-integration.js` (1,204 lines)  
**Status:** Fully integrated with error recovery mechanisms

#### Configuration:
```javascript
ONESIGNAL_APP_ID = '3b924b99-c302-4919-a97e-baf909394696'
ONESIGNAL_TEMPORARILY_DISABLED = false  // Emergency disable flag

// Auto-init on authenticated pages (post-login)
// Disabled on: index.html, login pages
```

#### OneSignal Manager Class
**Methods:**
- `init()` - Initialize SDK with minimal configuration
- `requestPermission()` - Native browser + OneSignal permission
- `checkSubscriptionStatus()` - Verify notification opt-in
- `sendTestNotification()` - Send test via webhook
- `setUserContext(authToken)` - Link user to notifications
- `setupSubscriptionListeners()` - Monitor subscription changes

#### Notification Features:
1. **Push Notifications:**
   - Report generation completion alerts
   - Invoice receipt notifications
   - System status updates
   - Permission prompts (slide-down UI)

2. **Status Indicator:**
   - Fixed position badge (top-right corner)
   - Shows notification permission status
   - Clickable to enable notifications
   - Hebrew-language labels

3. **Device Support:**
   - Chrome/Chromium browsers
   - Safari (with special configuration)
   - Service worker based on Netlify domain
   - Local storage cleanup to prevent errors

#### Webhook Integration:
- **Send Test Endpoint:** `https://hook.eu2.make.com/e41e2zm9f26ju5m815yfgn1ou41wwwhd`
- **Data Sent:**
  ```json
  {
    "type": "test_notification",
    "user_id": "auth_token",
    "player_id": "onesignal_id",
    "message": "Hebrew message",
    "title": "Hebrew title",
    "url": "current_page_url",
    "browser": "Safari|Chrome"
  }
  ```

#### Subscription Storage:
- `sessionStorage.onesignalId` - OneSignal user ID
- `sessionStorage.oneSignalSubscribed` - Permission status ("true"|"false")
- `sessionStorage.oneSignalPlayerId` - Player ID for targeting

### 3.2 Notification Status Monitoring
```javascript
window.oneSignalUtils = {
  enableNotifications(),      // Request permission
  sendTestNotification(),     // Send test
  getStatus(),               // Get manager status
  reinitialize(),            // Reset and reinit
  forceCleanAndReinitialize() // Full cleanup + reinit
}
```

### 3.3 Error Recovery
- **Comprehensive Storage Cleanup:** Clears localStorage, sessionStorage, IndexedDB
- **Service Worker Management:** Unregisters and clears caches
- **Graceful Degradation:** App continues without notifications if fails
- **Logging:** All operations logged to console with emoji prefixes

---

## 4. DATABASE STRUCTURE

### 4.1 Supabase/PostgreSQL Schema

**Location:** `/home/user/SmartVal/supabase/sql/Unassigned_SQL/20250926_initial_schema.sql`

#### Core Tables (Phase 1):

**1. Organizations Table:**
```sql
CREATE TABLE public.orgs (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**2. User Profiles (linked to Auth):**
```sql
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY,
  name TEXT,
  role TEXT,
  org_id UUID,
  status TEXT,
  must_change_password BOOLEAN,
  email TEXT,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**3. Cases (Main Entity):**
```sql
CREATE TABLE public.cases (
  id UUID PRIMARY KEY,
  plate TEXT NOT NULL,
  owner_name TEXT,
  status TEXT ('OPEN', 'IN_PROGRESS', 'CLOSED', 'ARCHIVED'),
  filing_case_id TEXT,  -- For case numbering
  org_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
-- Unique index: one active case per plate
```

**4. Case Helper (Versioned JSON Storage):**
```sql
CREATE TABLE public.case_helper (
  id UUID PRIMARY KEY,
  case_id UUID NOT NULL,
  version INT,
  is_current BOOLEAN DEFAULT false,
  helper_name TEXT,  -- e.g., "12345678_helper_v1"
  helper_json JSONB NOT NULL,  -- All case data
  source TEXT ('system', 'manual', 'import'),
  sync_status TEXT ('pending', 'synced', 'failed'),
  updated_by UUID,
  updated_at TIMESTAMPTZ
);
-- Unique index: one current version per case
```

**5. Helper Versions (Immutable History):**
```sql
CREATE TABLE public.helper_versions (
  id BIGSERIAL PRIMARY KEY,
  case_id UUID NOT NULL,
  version INT,
  helper_name TEXT,
  helper_json JSONB,  -- Complete snapshot
  source TEXT,
  saved_by UUID,
  saved_at TIMESTAMPTZ
);
```

#### Module Tables (Phase 2):

**6. Parts Search Sessions:**
```sql
CREATE TABLE public.parts_search_sessions (
  id UUID PRIMARY KEY,
  case_id UUID,
  plate TEXT NOT NULL,
  search_context JSONB,  -- Search parameters
  created_by UUID,
  created_at TIMESTAMPTZ
);
```

**7. Parts Required:**
```sql
CREATE TABLE public.parts_required (
  id UUID PRIMARY KEY,
  case_id UUID NOT NULL,
  damage_center_code TEXT,
  part_number TEXT,
  part_name TEXT,
  manufacturer TEXT,
  quantity INT DEFAULT 1,
  unit_price NUMERIC(10,2),
  selected_supplier TEXT,
  status TEXT ('PENDING', 'ORDERED', 'RECEIVED', 'CANCELLED'),
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**8. Invoices:**
```sql
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY,
  case_id UUID NOT NULL,
  plate TEXT NOT NULL,
  invoice_number TEXT UNIQUE,
  invoice_type TEXT ('PARTS', 'LABOR', 'TOWING', 'OTHER'),
  supplier_name TEXT,
  supplier_tax_id TEXT,
  issue_date DATE,
  due_date DATE,
  status TEXT ('DRAFT', 'SENT', 'PAID', 'CANCELLED'),
  total_before_tax NUMERIC(10,2),
  tax_amount NUMERIC(10,2),
  total_amount NUMERIC(10,2),
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**9. Documents/Files:**
```sql
CREATE TABLE public.documents (
  id UUID PRIMARY KEY,
  case_id UUID NOT NULL,
  category TEXT ('report', 'invoice', 'image', 'license', 'other'),
  filename TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  storage_key TEXT,  -- Supabase storage path
  onedrive_file_id TEXT,
  onedrive_web_url TEXT,
  checksum TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ
);
```

**10. Webhook Sync Log:**
```sql
CREATE TABLE public.webhook_sync_log (
  id UUID PRIMARY KEY,
  webhook_name TEXT NOT NULL,
  direction TEXT ('TO_SUPABASE', 'FROM_SUPABASE'),
  case_id UUID,
  payload JSONB,
  status TEXT ('SUCCESS', 'FAILED', 'PENDING'),
  error_message TEXT,
  created_at TIMESTAMPTZ
);
```

#### Supporting Tables:

**11. Knowledge Base:**
```sql
CREATE TABLE public.kb_docs (
  id UUID PRIMARY KEY,
  title TEXT,
  source TEXT,
  lang TEXT DEFAULT 'he',
  tags TEXT[],
  body TEXT,
  org_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### 4.2 Helper.json Structure

**Central Data Container** - Flat JSON format with comprehensive case metadata

```javascript
helper = {
  // Vehicle Information
  plate: "5785269",
  owner: "כרמל כיוף",
  manufacturer: "פיג'ו",
  model: "308",
  year: 2022,
  vin: "VF3xxxxxxxxxxxx",
  body: "B0DA3",
  engine: "B0F7X",

  // General Information
  general_info: {
    address: "...",
    phone: "...",
    garage: "...",
    garage_email: "...",
    insurance_company: "הראל",
    insurance_agent: "...",
    damage_type: "...",
    damage_date: "2025-04-04",
    inspection_date: "2025-04-04",
    location: "חיפה"
  },

  // Levi Summary
  levisummary: {
    model_code: "...",
    base_price: 84000,
    ownership_type: "private|company"
  },

  // Price Adjustments
  adjustments: [
    {
      subject: "ק"מ",
      value: 45000,
      percentage: -3,
      adjusted_value: -1500
    }
  ],

  // Damage Centers
  damage_centers: [
    {
      center_id: 1,
      location: "חזית",
      description: "נזק קדמי לרכב",
      repairs: [
        {
          name: "ישר פח",
          desc: "...",
          cost: 400
        }
      ],
      parts: [
        {
          name: "כנף",
          desc: "שבור",
          source: "חליפי"
        }
      ],
      works: ["עבודות צבע", "פירוקים והרכבות"],
      depreciation: 5
    }
  ],

  // Status
  status: "לתיקון|אובדן להלכה|טוטאלוס",  // Watermark directive
  finalized: false,
  finalized_at: "",

  // Fees
  fees: {
    photo_fee: 200,
    office_fee: 150,
    transport_fee: 100,
    vat_percent: 18
  },

  // Depreciation
  depreciation: {
    global: 7,
    centers: [
      { center_id: 1, depreciation_percent: 3 }
    ]
  }
}
```

### 4.3 Client-Side Storage
- **sessionStorage:** Auth data, case metadata, helper.json copy
- **localStorage:** User preferences, helper backup, VAT rates
- **IndexedDB:** Supabase SDK caching

---

## 5. AUTHENTICATION & AUTHORIZATION PATTERNS

### 5.1 Authentication Flow

1. **Login Page** (`index.html`)
   - Email + Password input
   - Supabase Auth verification
   - Profile check (status = 'active')
   - Session establishment

2. **Session Creation**
   ```javascript
   sessionStorage.auth = {
     user, session, profile, loginTime
   }
   ```

3. **Protected Routes**
   - All non-index pages check `sessionStorage.auth`
   - Redirect to login if missing/expired
   - 15-minute inactivity timeout

### 5.2 Authorization Patterns

```javascript
// Role-based access checks
if (authService.hasRole('admin')) { /* ... */ }
if (authService.canEditCases()) { /* assessor+ */ }
if (authService.canManageUsers()) { /* admin+ */ }
if (authService.isAdminOrDev()) { /* admin or developer */ }
```

### 5.3 Security Features

**From `security-manager.js`:**

1. **CSRF Protection**
   - Token generation: `crypto.getRandomValues()`
   - Added to forms and AJAX requests
   - Validated on submissions

2. **Input Sanitization**
   - XSS vector removal (`<script>`, `javascript:`, event handlers)
   - SQL injection attempt removal
   - Type-specific validation

3. **Rate Limiting**
   - IP-based request throttling
   - Login attempt limiting (5 max, 15-min lockout)

4. **Session Security**
   - Secure headers on all requests
   - HTTPS enforcement (via Netlify)
   - File type/size validation

5. **Audit Logging**
   - All security events logged
   - Timestamp + user tracking
   - Sanitization records

---

## 6. FORM & COMMUNICATION MODULES

### 6.1 Core Module Pages

| Page | Purpose | Key Fields | Navigation |
|------|---------|-----------|-----------|
| `index.html` | Login | email, password | → dashboard/helper |
| `general_info.html` | Case metadata | address, phone, garage, insurance | → damage description |
| `damage-description.html` | Damage centers | location, description, free text | → repairs |
| `damage-center-repairs.html` | Repairs/works | name, description, cost | → parts |
| `damage-center-parts-search.html` | Parts inventory | part name, source, supplier | → depreciation |
| `fee-module.html` | Fees | photo_fee, office_fee, transport_fee | → depreciation |
| `depreciation_module.html` | Devaluation | global %, center-specific % | → estimate |
| `estimate-report-builder.html` | Draft estimate | calculations, cost breakdown | → final report |
| `final-report-builder.html` | Legal report | report type selection, legal blocks | → PDF generation |
| `upload-images.html` | Image upload | file input, preview, Cloudinary | → assistant |
| `invoice upload.html` | Invoice OCR | file input, data extraction | → override costs |
| `open-cases.html` | Case management | search, filter, status tracking | → case view |
| `change-password.html` | Password reset | old_pwd, new_pwd, confirm | → dashboard |

### 6.2 Form Communication Pattern

```javascript
// All forms follow pattern:
1. Collect data from inputs
2. Validate data locally (field-level + form-level)
3. Call sendToWebhook('form_name', data)
4. Handle response: success → next page, error → show alert
5. Update sessionStorage.helper
```

**Webhook Integration:**
- All form submissions POST to Make.com webhooks
- Webhooks validate, process, and return responses
- Errors trigger alerts; success triggers navigation

### 6.3 Floating Screens (Overlay Modules)

**Used for:** Real-time data preview, image gallery, parts search results

**Files:**
- `car-details-floating.js` - Vehicle data preview
- `parts-floating.js` - Parts search interface
- `levi-floating.js` - Valuation data view
- `invoice-details-floating.js` - Invoice OCR results

**Features:**
- Overlay modal with close button
- Can be repositioned (drag-enabled in some)
- Responsive to mobile touch
- Data auto-loads from helper.json

### 6.4 Validation Modules

**Field-Level Validation:**
- Email format, phone number, numeric ranges
- Hebrew text encoding validation
- Date picker validation (no future dates)
- File type/size for uploads

**Form-Level Validation:**
- `validation-system.js` - Comprehensive checks
- Required field enforcement
- Cross-field dependencies (e.g., if estimate, then must have depreciation)
- Damage center completeness checks

---

## 7. STYLING & UI FRAMEWORK

### 7.1 CSS Framework
**File:** `/home/user/SmartVal/styles.css`

#### Global Styling:
```css
/* RTL Support (Hebrew) */
direction: rtl;
font-family: "Noto Sans Hebrew", Arial, sans-serif;

/* Theme Colors */
Primary: #003366 (Dark Blue)
Accent: #ff6b35 (Orange - used in admin)
Background: #ffffff (Light) or #1a1a1a (Dark)
Text: #000000 (Light mode) or #e0e0e0 (Dark mode)

/* Spacing & Layout */
max-width: 800px containers
padding: 20px standard
gap: 15px flex spacing
```

#### Component Styles:

**Buttons:**
```css
padding: 10px 20px;
border-radius: 8px;
background: #003366;
color: white;
font-weight: bold;
cursor: pointer;
hover: #005199;
transition: background-color 0.3s;
```

**Inputs/Selects:**
```css
width: 100%;
padding: 10px;
margin: 5px 0 15px;
border: 1px solid #aaa;
border-radius: 5px;
background: #f9f9f9;
```

**Tables:**
```css
width: 100%;
border-collapse: collapse;
th: background #e6f0ff, bold
td: border 1px solid #ccc, padding 10px
```

**Headings:**
```css
h1, h2, h3: color #003366, margin-bottom 10px
font-weight: bold
```

### 7.2 Admin Dark Theme
**File:** `admin.html` inline styles

```css
/* Admin-Specific */
body.admin: background #1a1a1a, color #e0e0e0
.container.admin: background #2a2a2a, border #444
header.admin: background #333, border 2px solid #ff6b35
nav: background #333
button.admin: similar but styled for dark
input.admin.date: special webkit styling for dark mode
```

### 7.3 Responsive Design

**Mobile Breakpoints:**
```css
@media (max-width: 768px) {
  grid-template-columns: 1fr;  /* Stack layout */
  nav: fixed slide-in from right
  padding: reduce to 12px
  font-size: 16px (prevent zoom)
}
```

**Navigation:**
- Desktop: Sidebar fixed
- Mobile: Hamburger menu with slide-in nav

### 7.4 Branding Elements

**Logo:**
- Source: `https://carmelcayouf.com/wp-content/uploads/2025/06/g.webp`
- Display: Block, max-width 250px, centered
- Used on login, reports, admin hub

**Company Name:**
```html
<div class="portal-name">
  ירון כיוף - שמאות והערכת נזקי רכב ורכוש
</div>
```

**Color Coding:**
- **Blue (#003366):** Primary actions, headings, professional
- **Orange (#ff6b35):** Alerts, admin, emphasis
- **Gray:** Borders, disabled states, secondary info

### 7.5 Typography

**Font Stack:**
```css
Hebrew: "Noto Sans Hebrew", Arial, sans-serif
HTML: lang="he", dir="rtl"
```

**Sizes:**
- Page headings: 24-32px
- Section titles: 20px
- Body text: 16px
- Small text: 14px
- Footer: 0.9em

---

## 8. CURRENT COMMUNICATION CHANNELS

### 8.1 Webhook Architecture

**Primary Make.com Endpoints:**

| Webhook | Purpose | Trigger | Response |
|---------|---------|---------|----------|
| `ho2ogzkuwxg66klgkin7nattl1nr7o6y` | Login verification | Login form submit | User validation |
| `xtvmwp6m3nxqge422clhs8v2hc74jid9` | Levi upload processing | Levi report upload | OCR data, valuations |
| `e41e2zm9f26ju5m815yfgn1ou41wwwhd` | Test notification | OneSignal test | Notification delivery |
| Generic case webhooks | Case CRUD operations | Case form submit | Confirmation/error |

**Webhook Data Format:**
```json
{
  "type": "form_name",
  "case_id": "plate_number",
  "user_id": "auth_token",
  "data": { /* form data */ },
  "timestamp": "ISO datetime"
}
```

### 8.2 Service Communication

**Supabase Client:**
- `lib/supabaseClient.js` - Initialization and config
- `services/supabaseClient.js` - Query helpers
- `services/authService.js` - Auth operations
- `services/supabaseHelperService.js` - Helper CRUD

**Services:**
```javascript
// Authentication
authService.login(email, password)
authService.logout()
authService.changePassword(newPassword)
authService.validateSession()

// Data Sync
supabaseHelperService.loadHelper(caseId)
supabaseHelperService.saveHelper(caseId, helperJson)
supabaseHelperService.getVersions(caseId)
supabaseHelperService.rollback(caseId, version)

// Case Management
caseRetrievalService.getCase(caseId)
caseRetrievalService.listCases()
caseRetrievalService.updateCase(caseId, data)
```

### 8.3 Event Flow & Synchronization

```
User Input
    ↓
Form Validation (local)
    ↓
sessionStorage Update (helper.json)
    ↓
Webhook POST to Make.com
    ↓
Make.com Processing (webhooks/scenarios)
    ↓
Supabase Write (case_helper, case_versions)
    ↓
Response Return
    ↓
UI Update + Navigation
```

### 8.4 Real-Time Features

**From `realtime-sync.js`:**
```javascript
// Subscribe to helper changes
supabase.from('case_helper')
  .on('*', payload => {
    // Update UI with new helper data
  })
  .subscribe()
```

**Broadcast Messaging:**
```javascript
// VAT rate changes broadcast to all modules
window.addEventListener('message', (event) => {
  if (event.data.type === 'VAT_RATE_CHANGE') {
    // Update calculations
  }
})
```

---

## 9. EXISTING TASK/WORKFLOW MANAGEMENT

### 9.1 Current Workflow Structure

**Case Lifecycle:**
```
New Case
  ↓
General Info
  ↓
Damage Description (1+ damage centers)
  ↓
Repairs & Parts Input
  ↓
Image Upload (optional, parallel)
  ↓
Invoice Upload (optional, parallel)
  ↓
Levi Valuation (optional)
  ↓
Fee Input
  ↓
Depreciation
  ↓
Estimate Report (draft)
  ↓
Final Report (4 types)
  ↓
PDF Generation
  ↓
Report Storage (OneDrive)
  ↓
Case Closure/Archival
```

### 9.2 Damage Center Management

**From `helper.js`:**
```javascript
createDamageCenter(location, description, sourceData)
// Creates comprehensive damage center with:
// - ID generation (damage_center_[timestamp]_[number])
// - Calculations tracking
// - Integration references (parts, invoices, estimates)
// - Validation state
// - Workflow status
// - Audit trail
```

**Damage Center Workflow:**
- Draft → In-progress → Review → Approved → Rejected (states)
- Can be modified until report finalized
- Each change logged to audit_trail
- Integration with parts search and invoices

### 9.3 Status Tracking

**Case Status Enum:**
- `OPEN` - Active, being worked on
- `IN_PROGRESS` - Currently being processed
- `CLOSED` - Report generated, ready to send
- `ARCHIVED` - Historical reference

**Helper Status (Watermark):**
- `לתיקון` (For Repair) - Damage but repairable
- `אובדן להלכה` (Total Loss) - Exceeds value threshold
- `טוטאלוס` (Totaled) - For dismantling

---

## 10. RECOMMENDED ARCHITECTURE FOR TASK MANAGEMENT SYSTEM

### 10.1 Integration Points

**Task Management Should Support:**

1. **Case-Level Tasks:**
   - Case creation tasks (collect initial data)
   - Module completion tasks (damage centers, fees, etc.)
   - Document upload tasks (images, invoices)
   - Report generation tasks

2. **User Assignment:**
   - Assign damage centers to specific assessors
   - Assign QA/review tasks to supervisors
   - Escalation paths for complex cases

3. **Workflow Orchestration:**
   - Sequential task dependencies
   - Parallel task execution (images + invoices)
   - Task completion blocking (can't finalize without depreciation)

4. **Tracking & Notifications:**
   - Task status updates via OneSignal
   - Overdue task alerts
   - Performance dashboards

### 10.2 Proposed Database Tables

```sql
-- Tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id),
  task_type TEXT ('data_entry', 'validation', 'review', 'correction'),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.profiles(user_id),
  assigned_by UUID REFERENCES public.profiles(user_id),
  status TEXT ('pending', 'in_progress', 'completed', 'blocked'),
  priority TEXT ('low', 'medium', 'high', 'urgent'),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Task dependencies
CREATE TABLE public.task_dependencies (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id),
  depends_on_task_id UUID REFERENCES public.tasks(id),
  dependency_type TEXT ('blocks', 'follows'),
  created_at TIMESTAMPTZ
);

-- Task history/audit
CREATE TABLE public.task_history (
  id BIGSERIAL PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id),
  changed_by UUID REFERENCES public.profiles(user_id),
  change_type TEXT ('created', 'assigned', 'status_change', 'completed'),
  old_value JSONB,
  new_value JSONB,
  changed_at TIMESTAMPTZ
);

-- Task attachments
CREATE TABLE public.task_attachments (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id),
  file_id UUID REFERENCES public.documents(id),
  attached_by UUID REFERENCES public.profiles(user_id),
  attached_at TIMESTAMPTZ
);
```

### 10.3 UI Components Needed

1. **Task Dashboard** - Overview of all tasks (assigned, completed, overdue)
2. **Task Details Modal** - Full task info, history, attachments
3. **Task Creation Form** - Auto-generate from case data
4. **Assignment Interface** - Assign to users by role
5. **Notifications Integration** - OneSignal push for task updates
6. **Analytics/Reporting** - Task completion rates, SLA tracking

---

## APPENDIX A: KEY FILES LOCATION REFERENCE

### Core System Files
- **Authentication:** `/services/authService.js`
- **Security:** `/security-manager.js`
- **Helper Management:** `/helper.js`
- **Admin Panel:** `/admin.html`, `/admin.js`
- **Notifications:** `/onesignal-integration.js`
- **Webhooks:** `/webhook.js`
- **Styling:** `/styles.css`

### Database
- **Supabase Config:** `/lib/supabaseClient.js`, `/services/supabaseClient.js`
- **Schema:** `/supabase/sql/Unassigned_SQL/20250926_initial_schema.sql`
- **Migrations:** `/supabase/sql/Phase6_Auth/`

### Module Pages
- **Damage Centers:** `/damage-centers-wizard.html` (345KB comprehensive)
- **Parts Search:** `/parts search.html`, `/parts-module.html`
- **Reports:** `/estimate-report-builder.html`, `/final-report-builder.html`
- **Admin:** `/admin.html`, `/dev-module.html`

### Utilities
- **Parts Service:** `/services/partsSearchService.js`
- **Case Retrieval:** `/services/caseRetrievalService.js`
- **Helper Sync:** `/services/helperSyncManager.js`
- **Validation:** `/validation-system.js`

---

## APPENDIX B: System Statistics

| Metric | Value |
|--------|-------|
| Total HTML Pages | 77 documented |
| JavaScript Modules | 150+ files |
| Database Tables | 11+ core tables |
| CSS Rules | Comprehensive RTL + responsive |
| Damage Center Fields | 200+ per center |
| Supported Report Types | 4 (Private, Global, Total Loss, Sale) |
| User Roles | 5 (admin, developer, assessor, viewer, user) |
| Session Timeout | 15 minutes |
| OneSignal Integration | Full with v16 SDK |
| Webhook Endpoints | 3+ active |
| Languages | Hebrew-first, bilingual ready |

---

## APPENDIX C: Security Configuration

**CSRF Tokens:** Generated per session, checked on all forms  
**Input Sanitization:** XSS/SQLi removal on all inputs  
**Rate Limiting:** 5 login attempts, 15-min lockout  
**Password:** AES-256-GCM encryption in storage  
**HTTPS:** Enforced via Netlify  
**Session:** 15-minute inactivity timeout  
**Audit:** All security events logged with timestamp + user  

---

**End of Document**


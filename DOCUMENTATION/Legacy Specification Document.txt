# Carmel Cayouf Damage Evaluation System – Unified Technical Specification  
(ירון כיוף שמאות והערכת נזקי רכב ורכוש)

© All rights reserved Carmel Cayouf

---
# Executive Summary

The Carmel Cayouf Damage Evaluation System is an advanced, modular automation platform for professional vehicle damage assessment, documentation, reporting, and workflow management. Designed for use by licensed assessors and office staff, the system streamlines all stages of a case—from initial data collection and image/document upload, through external data integration, automated calculations, and report generation, to final legal output and archiving.

Key features include:  
- Dynamic case folder and data management, with flat JSON-based metadata for maximum interoperability.
- Image and document pipeline leveraging Cloudinary, AI tagging, and branded PDF generation via custom WordPress endpoints.
- Multi-modal parts search (browser, agent, photo recognition), cross-referenced at both case and global knowledge levels.
- Automated invoice ingestion (file and email-based), with immediate integration into draft/final reports and analytics.
- Admin hub and developer back door for configuration, patching, credential management, and live monitoring.
- Robust legal and branding controls to ensure compliance and output integrity.
- Fallback/manual workflow for business continuity, with seamless reintegration and no data loss.
- Full auditability, real-time notifications, and a scalable platform for future multi-user and knowledge-driven extensions.

This specification details the full ecosystem, operational flows, dependencies, and technical contracts to guide both business operations and system engineering, and serves as the master reference for future growth and support.

---

# Terminology Index

| Term/Feature            | Definition / System Usage                                                                                 |
|-------------------------|----------------------------------------------------------------------------------------------------------|
| **Back Door**           | Secure, password-protected developer/admin interface for direct configuration, code patches, credential/vault access, and system hotfixes—  
  never exposed to 
  regular users.          |
| **Admin Hub**           | Central UI/dashboard for office/admin staff to monitor, override, and manage cases, users, reports, logs, and system health.                              |                         |
| **Helper Table**        | Core per-case metadata structure (flat JSON, stored in case folders and cumulative meta); serves as the integration point for all module 
   data (images, parts, 
  invoices, etc.).        |
| **Floating Screen**     | Overlay UI window providing instant, context-sensitive access to data or actions (e.g., car info, part selection) without leaving the main  
   workflow.              |
| **Inside Browser**      | Embedded, in-system web browser window allowing direct login, navigation, and data fetch from external sources (e.g., Levi Yitzhak, parts    
  supplier sites) while 
  keeping user in the main
 platform; credentials 
  managed via secure vault|
| **Knowledge Hub**       | Forthcoming smart-analytics module aggregating meta from all cases to provide suggestions, bottleneck detection, and cumulative reference/ 
 search capability.       |
| **Fallback/Manual Path**| Alternative data entry and workflow for continuity if automations fail—always reintegrated into main meta and reporting upon recovery.                      |
| **Make Agent**          | Automated workflow/AI module in Make.com, triggered by user/system events to fetch, process, and inject data (e.g., parts search, expertise 
  launch, etc.).          |
| **Meta / Meta Table**   | Synonymous with Helper Table; the aggregated data structure that drives all reports, tracking, and module interconnections.                                  |
| **Branded PDF Endpoint**| Custom WordPress-based API for generating formal reports (JSON/HTML in, branded/legal PDF out).                                                           |
| **Case Folder**         | Structured file system directory (cloud) where all documents, images, reports, meta, logs, and correspondence for a specific vehicle case are stored.               |



---


## 1. System Overview

### 1.1 Description and Purpose

The Yaron Cayouf Damage Evaluation System is a modular, automation-driven platform for vehicle damage assessment, legal reporting, and full workflow management for damage appraisals in the Israeli automotive market.  
Its core goal: **Eliminate manual inefficiency, guarantee legal-grade outputs, and deliver user flexibility and auditability across all stages of a case—from field reporting to final compensation.**

The system combines rapid field data capture, automatic car data scraping, dynamic report building, image optimization, invoice management, and integrated notifications.  
**All business processes, data management, and outputs are branded for "Yaron Cayouf Damage Assessment and Appraisal" (ירון כיוף שמאות והערכת נזקי רכב ורכוש),** with all legal rights reserved to Carmel Cayouf.

---

### 1.2 Vision and Core Principles

- **Maximum automation:** Wherever possible, use Make.com, Cloudinary, OneDrive, and API integrations to replace manual work.
- **Accessibility & Flexibility:** After authentication, all modules are accessible—users can jump between tasks without forced process order. Data required for any module is auto-prefilled and synced system-wide.
- **Resilience:** All data flows are event-driven, not session-dependent. No data loss is possible; partial/incremental saves and agent-driven merging are built-in.
- **Legal Compliance:** All outputs and actions comply with Israeli appraisal/reporting law and include required branding, footers, and disclaimers.
- **User Experience:** Fast, intuitive interface, with strong UX touches (e.g., login/logout animations, prefilled forms, minimal redundant input).
- **Data Integrity:** All data—auto, manual, or from fallback/manual flows—ultimately syncs to the **Helper Table** and case metadata for robust tracking, reporting, and search.
- **Auditability:** All actions are logged; critical admin/dev operations are protected behind a “back door” with secure access and audit trail.

---

### 1.3 Target Users/Segments

- **Primary:** Licensed vehicle damage assessors (שמאים), repair shop managers, appraisal firm back-office, legal review staff.
- **Secondary:** Insurance agents/adjusters, car owners in dispute or claim process, law firms, system admins/developers.
- **Office setup:** Supports both solo use and multi-user offices (future-ready with admin authorization and role management).

---

## 2. Ecosystem and Scope

### 2.1 Full Ecosystem Map

- **Make.com:** Core automation engine for all major data flows, webhook routing, image processing, document generation, notifications, and metadata sync.
- **Cloudinary:** Exclusive image pipeline for uploads, resizing, watermarking, optimization, and AI labelling (ImageKit deprecated).
- **OneDrive:** Main document/file storage and structured folder management for all cases, reports, invoices, images, metadata, logs.
- **Google Drive:** Used as a bridge when required to circumvent OneDrive/Excel limitations and for temporary staging.
- **Netlify:** Web frontend deployment (HTML, React, branded static/dynamic forms, in-system browser logic).
- **WordPress/html2pdf:** HTML-to-PDF conversion service, with webhook triggers and full Make.com integration.
- **OneSignal:** Primary notification channel (push subscriptions only enabled post-authentication; embedded in multiple automations).
- **Twilio/WhatsApp (future/optional):** SMS and message notification/alert integration.
- **GPT Agents:** Used for expertise management, parts search, and smart metadata enrichment, all via Make.com or webhook bridges.
- **Levi Yitzhak & Check-Car:** Data extraction via in-system browser and/or OCR, dynamic data scraping for vehicle market value, model, and legal fields.
- **Admin/Developer Back Door:** Special section for secure management of webhooks, secrets, static text, and system config—accessed only by tech admin.

---

### 2.2 Key Modules and Products

- **Expertise (“אקספרטיזה”)**: Field report and data capture, multi-damage support, initiates all downstream flows.
- **Final Report (“חוות דעת”)**: Legal-grade output, dynamic data block insertion, auto/calculated values, and embedded market value adjustments.
- **Draft Report (“טיוטה”)**: Live, editable, not-final state for case-in-progress; updates automatically as new data arrives.
- **Parts Module (“מודול חלפים”)**: In-system browser for car-part.co.il, with agent logic for search (manual/auto/image), and cross-mapping to Make automations.
- **Invoice Module (“חשבוניות”)**: Upload/OCR, direct link to case, auto-update of Helper and report tables.
- **Levi Report Integration (“דו״ח לוי יצחק”)**: Dual-path (in-system browser for direct PNG, or image upload for OCR), always stays in-system.
- **Picture Optimization/Upload (“העלאת תמונות”)**: Multi-step, AI-enhanced, watermarking and meta-labelling, all via Cloudinary.
- **Search Module (“מודול חיפוש”)**: General and case-specific search, folder/query-based, OneSignal-push alerting.
- **Admin Hub (“מודול אדמין”)**: User/role authorization, privacy controls, notification tuning, logs, and developer-only maintenance.
- **Knowledge Hub (“מרכז ידע”)**: Future: auto-detect bottlenecks, behavioral hints, smart analytics, and recommendations.

---

### 2.3 Platform Dependencies and Integrations

- **All automations and data flows depend on active and managed webhooks, endpoints, and API keys.**
- **All output is Hebrew by default; system logic and spec documentation in English for dev/admin clarity.**
- **Flat JSON is enforced for all webhook payloads to Make.com and across all modules (no nested structures).**
- **Every module is designed for autonomy and modular navigation, with meta/Helper sync and error-proof data aggregation at every step.**

---
## 3. Main Processes and Flows

### 3.1 Process/Module Names (English / Hebrew)

| Module/Process              | English Name                 | Hebrew Name                     |
|-----------------------------|------------------------------|---------------------------------|
| Expertise                   | Expertise                    | אקספרטיזה                       |
| Draft Report                | Draft Report                 | טיוטת חוות דעת                  |
| Final Report                | Final Report                 | חוות דעת                        |
| Depreciation                | Depreciation Module          | מודול פחת                       |
| Fee                         | Fee Module                   | מודול שכר טרחה                  |
| Parts                       | Parts Module                 | מודול חלפים                     |
| Invoice                     | Invoice Module               | מודול חשבוניות                  |
| Levi Report                 | Levi Report Module           | מודול דו"ח לוי יצחק             |
| Picture Upload/Optimization | Picture Optimization         | אופטימיזציית תמונות             |
| Search                      | Search Module                | מודול חיפוש                     |
| Admin                       | Admin Hub                    | מודול אדמין                     |
| Knowledge Hub               | Knowledge Hub                | מרכז ידע                        |
| Tracking Table              | Tracking Table               | טבלת מעקב                       |
| Helper Table                | Helper (Aggregation Table)   | טבלת עזר                        |
| Metadata/Shadow             | Metadata / Shadow Table      | מטאדאטה / טבלת צל               |
| Back Door                   | Developer/Tech Admin Section | דלת אחורית (מנהל טכני)          |
| OneSignal                   | Notification System          | מערכת התראות OneSignal          |

---

### 3.2 End-to-End Case Flow – Core Process Map

1. **User Login (Gate)**
   - Password authenticated **in Make.com**, never on HTML/client.
   - Upon success: animation + engine sound.  
   - OneSignal subscription enabled *only after* login (never on gate).

2. **Case Initiation**
   - User can start a new case (opens folders, preps metadata), or navigate directly to any module (upload images, parts search, Levi, etc.).
   - All actions (regardless of order) are tied to a `plate` (מספר רכב) as the unique case identifier.

3. **Expertise Module (אקספרטיזה)**
   - Main field data collection: general info, car data (scraped from [check-car.co.il](https://www.check-car.co.il/report/{{plate}})), multi-damage center entry.
   - Supports standalone or as part of a full workflow.
   - After each input/confirmation, data is **synced to the Helper and metadata** (via Make webhook, always flat JSON).

4. **Levi Report Handling (מודול דו"ח לוי יצחק)**
   - Dual mode:  
     a) In-system browser opens Levi portal; user logs in, generates report PNG, sends to OCR webhook.  
     b) User uploads Levi report image (if available), triggers OCR and data parsing.
   - Parsed data is merged into Helper and attached to case metadata.

5. **Picture Upload/Optimization (אופטימיזציית תמונות)**
   - Multi-image upload (drag, select, camera).
   - Images processed by Cloudinary: resized, watermarked, labeled by plate/date, AI part recognition if needed.
   - Each image’s metadata saved to case Helper; original and processed stored in correct folder.
   - Confirmation triggers push to Make/meta; can be done at any stage.

6. **Parts Module (מודול חלפים)**
   - Three arms:  
     a) In-system browser for car-part.co.il (user logs in, submits, can send answer back for auto/manual parse).  
     b) Textual search (free text/codes) sent to Make agent for results.  
     c) Image-based search—user uploads a part image, agent returns matches.
   - All results assigned/linked by agent; user can override or manually assign if auto-parse fails.
   - All results/choices are saved to Helper and metadata.

7. **Invoice Module (מודול חשבוניות)**
   - User uploads or scans invoice; OCR parses values and links costs to case.
   - Auto-updates the draft/final report and Helper.
   - Invoices stored in dedicated invoice folder; relevant values pushed to Google Table for analytics.

8. **Depreciation & Fee Modules (מודול פחת / מודול שכר טרחה)**
   - Simple table UI for per-damage and global depreciation (percentages, explanations).
   - Fee module (compensation, legal, admin).
   - Fast-input mode for small updates (direct entry) or “full meta pull” for bulk edit.

9. **Draft & Final Report (טיוטת חוות דעת / חוות דעת)**
   - Draft built from all prior data: auto-imports field, Levi, image, parts, invoice data into smart data blocks in HTML.
   - User can review, edit, confirm or reject blocks before finalization.
   - On finalize, report locks, but further changes can be made in subsequent steps.
   - Confirmation triggers final aggregation/save.

10. **Search & Tracking (מודול חיפוש / טבלת מעקב)**
    - Search across all modules, cases, folders by plate/date/owner/part/etc.
    - Tracking table auto-updates from Helper/meta and external automation (manual and full system).
    - Results displayed inline or as push (OneSignal).

11. **Admin Hub (מודול אדמין)**
    - User authorization, role management (future), privacy and notification settings.
    - View logs, system health, manual data override if needed.
    - “Developer Back Door” for secure webhook, text, and config management (separate password).

12. **Knowledge Hub (מרכז ידע) – [Future]**
    - Smart analytics, bottleneck detection, behavioral hints, prediction (per garage, insurance, car type).
    - Notifies at case open, offers workflow guidance.

---

### 3.3 Module Autonomy & Accessibility

- After login, **all modules are accessible directly**—not locked into a rigid process flow.
- For every module, if a case is open, plate/owner/date are prefilled; if not, required fields are prompted.
- Standalone access for:  
  - Multi-picture upload  
  - Parts search (text/image/browser)  
  - Invoice upload  
  - Levi report upload/browser  
  - Search/preview  
  - Admin

- Stage-tied modules (damage, repairs, work, depreciation, fees, etc.):  
  - Must be completed as part of the workflow; confirmation required before proceeding.
  - User can move back/forth within process prior to confirmation/finalization.

- **Every confirmation or exit triggers data sync to Helper/meta.**

---

### 3.4 Event-Driven Data Sync, Confirmation & Logout

- All data flows are **event-driven**—sent at confirmation, submit, or logout.
- **Auto-logout after 15 minutes inactivity:**  
    - Warning at minute 13; if no response, session ends and all unsaved data is force-synced.
    - Logout animation + message; no data is lost.

- Manual/partial inputs are recognized by the system; Make agents handle partial/incremental saves and queue for follow-up if needed.

---

### 3.5 Data Flow: From Module to Helper Table

- Every module’s output (auto, manual, or fallback) ends up in the **Helper (aggregation table) and case metadata**.
- Data always sent as flat JSON (no nested objects/arrays).
- Meta/Helper is single source of truth for tracking, search, and final reports.

---

### 3.6 Security & Privacy

- Password/auth only checked on server side (Make); HTML never exposes credentials.
- Sensitive admin/dev operations always behind separate, strong “back door.”
- All user interactions are logged; any access or config change via back door is auditable.

---

### 3.7 User Experience Touchpoints

- Login: animation + engine start audio.
- Logout/auto-logout: animation + “car driving away” GIF and sound.
- Every confirmation/finalization: explicit user acknowledgment, with summary of actions and “responsibility” note.

---
## 4. Technical Architecture & Data Management

---

### 4.1 System Architecture Overview

The Yaron Cayouf Damage Evaluation System is architected for **full modularity, high resilience, and maximum process automation**, using a combination of Make.com, Cloudinary, OneDrive/Google Drive, Netlify, and in-system browser modules.

#### **High-Level Architecture:**

- **Frontend/UI:**  
  - Deployed on Netlify (HTML/React), featuring branded login, navigation, process modules, and in-system browser logic.
  - All pages are mobile-friendly, responsive, and modular—each module (Expertise, Picture Upload, Levi, Parts, Invoice, Search, Admin, etc.) is accessible independently after authentication.
  - Animations and audio cues on login/logout.

- **Backend/Automation:**  
  - **Make.com:** Orchestrates all automations (webhooks, scenario routing, API calls, metadata updates, image processing, report generation, OneSignal notifications, etc.).
  - **Cloudinary:** Handles all image uploads, resizing, watermarking, optimization, and AI tagging.
  - **OneDrive (with Google Drive bridge):** Core document storage, folder and file structuring for each case.  
    - **Folder structure per case:**  
      - `/cases/[PLATE]/reports/`  
      - `/cases/[PLATE]/invoices/`  
      - `/cases/[PLATE]/pictures/`  
      - `/cases/[PLATE]/parts/`  
      - `/cases/[PLATE]/meta/`  
      - `/cases/[PLATE]/correspondence/`  
      - `/cases/[PLATE]/logs/`  
    - Each subfolder holds only the relevant files for that plate/case.  
    - **Helper table** and meta JSONs are updated in `/meta/`.

- **Agents & GPT Logic:**  
  - Used for expertise management, parts search (text/image/manual), smart field mapping, and metadata enrichment.
  - Each agent operates through a dedicated Make scenario and can be updated via the back door interface.

- **Admin/Back Door:**  
  - Securely protected; allows maintenance of webhooks, secrets, static text, fixed report blocks, API keys, and more.
  - All changes logged and auditable.

---

### 4.2 Core System Flows

#### **A. Authentication & Access**
- User logs in via branded gate (password checked server-side in Make.com).
- On success, session token enables:
  - **OneSignal push subscription (post-auth only)**
  - Access to all modules (direct navigation)
  - Autofill of case identifiers (plate/owner/date) throughout modules

#### **B. Case Initiation & Modular Navigation**
- User can:
  - Open a new case (creates all folders, initial meta/Helper)
  - Jump to any standalone module (pictures, Levi, parts, invoices, admin, etc.)
- **If no case open:**  
  - Minimal required fields (plate/owner/date) must be entered before action.
  - Manual input option always available.

#### **C. Data Input & Capture**
- **Car data scraped from [check-car.co.il](https://www.check-car.co.il/report/{{plate}})**
- **Levi report captured via in-system browser or image upload (OCR)**
- **Pictures uploaded (multi-batch, multi-format), processed via Cloudinary (resize, watermark, AI tag, file rename)**
- **Parts module:**  
  - Three arms: in-system browser (car-part.co.il), text search, image search—all agent-driven.
  - Results/choices can be assigned manually if auto-parse fails.

- **Invoice upload (OCR), parsed and linked to case meta, Helper, and Google Table.**

#### **D. Data Synchronization & Event-Driven Update**
- All data from all modules flows **immediately** to the Helper and meta (as flat JSON, via Make webhook) upon:
  - Confirmation in the UI (e.g., after data entry or process submit)
  - Forced save on logout or session timeout
  - Automated/agent-triggered action (e.g., parts agent assigns, picture AI tags, etc.)

- **Auto-logout after 15 min inactivity:**
  - Warning at minute 13; final save at logout ensures nothing is lost.
  - Logout triggers animation and sound.

#### **E. Data Aggregation: The Helper Table & Meta**

- **Helper Table:**  
  - Flat, universal aggregation of all case data—each module updates the Helper with every relevant field.
  - Format: **Flat JSON, no nesting, indexed field names for multi-blocks** (e.g., `damage_1_area`, `damage_2_cost`, etc.)
  - Helper is stored in `/meta/` folder per case, and mirrored to the tracking table for office-wide search.
  - All fallback/manual entries also update Helper to guarantee data consistency.

- **Meta Table:**  
  - Stores the current state of the case for rapid “case calling” and session restoration (single source of truth per session).
  - Pulled/cleaned via webhook if the user resumes or reopens a case.
  - UI always loads latest meta; all modules subscribe/react to updates.

#### **F. Dynamic, Case-Specific Reporting Engine**

- **Draft and Final Reports:**  
  - HTML is built dynamically per case, using blocks that pull only relevant data from Helper/meta.
  - **Smart blocks:**  
    - Know what to import, where to anchor in the report, and when to prompt for manual override.
    - Every report is unique in parameters and content, but fixed in structure/layout/legal.
  - All value adjustments (Levi, invoice, user entry, depreciation, fees) calculated in real time.
  - User confirms content before finalization; system enforces responsibility.
## 4. Technical Architecture & Data Management

...


#### **G. PDF Generation (Reports, Exports)**

- **Primary method:**  
  - All report PDFs (draft and final) are generated via the system’s own **WordPress host**, not external html2pdf (which remains available as an optional backup).
  - **Two input formats/endpoints:**
    - **JSON-based PDF rendering:**  
      - Endpoint: `https://carmelcayouf.com/pdf-api/render.php`
      - Receives structured report data as JSON for dynamic, template-driven PDF generation.
    - **HTML-based PDF rendering:**  
      - Endpoint: `https://carmelcayouf.com/pdf-api/html.php`
      - Receives pre-built HTML with full branding, legal text, and design—ideal for finalized layouts or branded drafts.
  - **Both endpoints support the system’s branded background, fixed legal text, and signature anchors.**
  - **html2pdf (external service)** is *not active in current workflows*, but may be re-integrated if required for future scenarios or backup redundancy.
  - **Make.com** orchestrates calls to the correct endpoint based on whether a report is being sent as a structured JSON block or pre-built HTML.
  - **Outputs:**  
    - Resulting PDFs are saved in the `/cases/[PLATE]/reports/` folder, and each is referenced by its generating JSON or HTML in the case’s meta/Helper data for full traceability and audibility.
    - Every PDF is linked to its source payload for potential regeneration or review.




---

### 4.3 Module & Data Interconnects

| Module          | Input Source(s)                | Output/Data Flow           | Receives from          | Sends To                |
|-----------------|-------------------------------|----------------------------|------------------------|-------------------------|
| Expertise       | UI, car scraper, user input    | Helper/meta update (flat)  | Car scraper, UI fields | Helper, meta, logs      |
| Levi Report     | OCR, in-system browser         | Helper/meta, image, value  | OCR, user upload       | Helper, meta, logs      |
| Pictures        | UI upload, Cloudinary          | Helper/meta, image files   | UI, Cloudinary         | Helper, meta, pictures  |
| Parts           | UI (browser/text/image), agent | Helper/meta, agent results | All search arms, agent | Helper, meta, logs      |
| Invoices        | UI upload, OCR                 | Helper/meta, invoice file  | User, OCR              | Helper, meta, invoices  |
| Depreciation    | UI table                       | Helper/meta, report        | User                   | Helper, meta, logs      |
| Fees            | UI table                       | Helper/meta, report        | User                   | Helper, meta, logs      |
| Admin/Back Door | Secure UI, config files        | System config, logs        | Dev/admin              | System, audit logs      |
| Search/Tracking | Tracking table, Helper         | UI, notifications         | Helper, meta           | UI, OneSignal           |
| Knowledge Hub   | All data sources               | Hints, analytics           | Helper, meta, logs     | UI, notifications       |

---

### 4.4 Security, Versioning, and Audit

- **Password security:**  
  - All checks server-side (never in HTML).
  - Back door/admin section requires separate strong password.
- **Webhook and key management:**  
  - All URLs, endpoints, secrets managed in the back door section (never hard-coded).
  - Versioned and auditable.
- **User/role management:**  
  - Future-ready for multi-user/role logic.
  - All sensitive actions logged.
- **Partial/incremental data saves:**  
  - All events (manual, auto, logout, session switch) force a metadata/Helper update.
  - Agents know to merge/resolve partials (no data loss).

---

### 4.5 Data Format: Flat JSON for Automation

- **All data sent to Make or agents is flat JSON**—no nested structures.
  - Example (multi-damage, invoice, Levi, parts, etc.):
    ```json
    {
      "plate": "5785269",
      "owner": "יוסי לוי",
      "date": "2025-05-21",
      "damage_1_area": "חזית",
      "damage_1_cost": 2200,
      "damage_2_area": "דלת ימין",
      "damage_2_cost": 1800,
      "levi_value": 67000,
      "invoice_1_sum": 800,
      "parts_1_supplier": "UMI",
      "parts_1_price": 300,
      ...
    }
    ```
- **All mapping tables and sample payloads are included in the appendices for devs/automation.**
- **Helper/meta always accepts and stores flat JSON, so manual/fallback and full automation are always in sync.**

---

### 4.6 Dynamic Folder, File, and Session Logic

- **Every case is its own universe:**  
  - All data, images, files, reports, and meta are isolated under the case’s main folder (by plate).
- **System supports:**
  - Standalone module ops (uploading Levi, parts, or invoices after the fact)
  - “Call a case” logic—pull meta, restore state, resume work
  - Dynamic folder creation for general queries/searches as needed
  - Incremental and partial saves (no orphan data)
  - Reconciliation/merge on next session or admin intervention

---

### 4.7 Future-Proofing & Admin Back Door

- **Developer/Admin back door** gives access to:
  - Webhook/endpoints (view/edit/rotate)
  - Static text/disclaimer/report block editor (Markdown, never raw HTML)
  - API key/secrets management
  - Log and config download/export
  - Prompt and agent logic update (for smart modules)
  - Forced backup/restore
  - UI/UX overrides in emergencies
- **All changes are logged and versioned; rollback is possible.**

---

### 4.8 Security and Privacy by Design

- **No sensitive logic in client/HTML**
- **All module accesses and edits logged**
- **Back door/admin is 2FA-ready and access is tightly controlled**
- **All data (even partial) is saved before session loss or logout**
- **No data is ever left orphaned—every flow ends at Helper/meta**

---

### 4.9 Key Architecture/Process Diagrams (ASCII for Markdown)

#### **A. System Data Flow (Simplified)**

[User] ──→ [UI Module] ──→ [Make Automation] ──→ [Cloudinary/OneDrive/Google] ──→ [Helper/meta]
│ │
│ └─→ [Agent/GPT logic] ──→ [Helper/meta]
│
└─→ [In-System Browser (Levi, Parts)] ──→ [Image/OCR/Parse] ──→ [Helper/meta]


#### **B. Folder/Data Hierarchy**
/cases/[PLATE]/
/reports/
/invoices/
/pictures/
/parts/
/meta/
/correspondence/
/logs/


#### **C. Module Interconnect**
[Expertise] ──→ [Helper/meta] ──→ [Draft/Final Report]
[Levi] ───────→│
[Pictures] ────→│
[Parts] ───────→│
[Invoices] ────→│
│

## 5. Data Management & Metadata Handling

---

### 5.1 Overview

The system’s data integrity and reporting accuracy rely on a **centralized metadata aggregation model**: every action, module, and automation either *feeds* or *consumes* the Helper/meta tables, which serve as the **single source of truth** for all cases, reports, and analytics.

---

### 5.2 The Helper Table and Metadata Model

- **Helper Table (“טבלת עזר”):**
  - Lives in each case’s `/meta/` subfolder (`/cases/[PLATE]/meta/`).
  - **Format:** Flat JSON, never nested, with explicit field names (e.g., `damage_1_area`, `levi_value`, `invoice_1_sum`).
  - **Updated by:** All feeder modules—expertise, Levi report, invoice upload, parts search, image optimization, manual entry, etc.
  - **Purpose:** Aggregates *all* structured data for a case; supports dynamic reporting, tracking, and audit.

- **Meta Files:**
  - Always two versions:  
    - **JSON:** For automation, audit, and regeneration of outputs  
    - **Plain text:** For quick search, knowledge hub ingestion, and resilience (fallback/manual)
  - **Cumulative Meta Folder:**  
    - Global folder for all meta snapshots across all cases (plain text)—enables knowledge hub, analytics, future ML.

---

### 5.3 Data Aggregation Order & Feeder/Consumer Split

#### **A. Feeders (Cross-System, Push Data)**
- Data scraping ([check-car.co.il](https://www.check-car.co.il/report/{{plate}})),  
- OCR (Levi, invoice, document scans),  
- User manual input (field data, damages, adjustments),  
- Image upload/optimization (Cloudinary, AI tagging),  
- Parts search (all three arms: textual, image, browser).

**Feeder modules are cross-system:**  
- Accessible at any time, in any order
- Always push their output into the Helper/meta tables immediately upon confirmation or automation

#### **B. Consumers (Depend on Aggregated Data)**
- **Draft Report**
- **Final Report**
- **Search & Tracking module**
- **Admin/Metadata backup**
- **Analytics & Knowledge Hub**
  
**Consumer modules only function on the latest Helper/meta state:**  
- They do *not* re-run or duplicate upstream automation  
- Any change in feeder data (field, Levi, invoice, etc.) is immediately reflected in all consumer modules after aggregation

#### **C. Data Aggregation Logic**

- **Order matters:**  
  - As a case advances, each consumer module (report, search, admin, etc.) depends on the completeness and integrity of aggregated data.
  - **No downstream process “short-circuits” feeder logic:**  
    - E.g., Final Report only builds/locks after draft, expertise, Levi, and invoices are all present in Helper/meta.
    - Search/Tracking queries always reflect the latest, fully-aggregated meta state.

- **Partial/incremental updates:**  
  - System supports partial saves (e.g., after image upload, before invoices), with Make.com agents tracking “in-progress” state.
  - No data is orphaned—on auto-logout, all in-progress meta is force-saved.

---

### 5.4 Metadata Sync, Backup, and Restore

- **Meta/Helper is versioned:**  
  - Each update generates a new snapshot (timestamped, per case) for rollback or audit.
- **Manual/fallback updates:**  
  - Any manual entry or fallback workflow pushes updates back into Helper/meta (never left “floating”).
  - Restore logic ensures data from manual/fallback path merges seamlessly with full automation.

- **Cumulative meta folder** enables:  
  - Knowledge hub, system analytics, detection of patterns/bottlenecks, and smart admin/search features.

---

### 5.5 “Call a Case” Logic & Data Retrieval

- **When a user resumes or reopens a case:**  
  - System “calls” meta by plate/owner/date, pulling the latest JSON and plain text from `/meta/`.
  - **Meta is auto-cleaned and normalized** (pre-mapped for automation, form fill, report generation).
  - All modules for that session subscribe to the same live meta context (reactive; all updates propagate instantly).

---

### 5.6 Directory & File Structure (Per Case)

/cases/[PLATE]/
/reports/
/invoices/
/pictures/
/parts/
/meta/
helper.json
meta.txt
[meta timestamped snapshots]
/correspondence/
/logs/

- **Cumulative global meta:**  
  - `/meta/global/` or `/knowledge/` for system-wide meta/text aggregation

---

### 5.7 Data Format and Mapping Examples

**Flat JSON Example:**
```json
{
  "plate": "5785269",
  "owner": "יוסי לוי",
  "date": "2025-05-21",
  "damage_1_area": "חזית",
  "damage_1_cost": 2200,
  "levi_value": 67000,
  "invoice_1_sum": 800,
  "parts_1_supplier": "UMI",
  "parts_1_price": 300
  // ... more fields as case advances
}
Meta Text Example (knowledge ingestion):

5785269 | יוסי לוי | 2025-05-21 | חזית: 2200 | לוי: 67000 | חשבונית: 800 | UMI: 300
5.8 Data Integrity, Sync, and Single Source of Truth
Helper/meta is always the definitive, up-to-date data set for all modules, reports, and analytics.
Any change—manual, auto, fallback—must aggregate through Helper/meta before it is considered final or reportable.
No module reads from raw feeder data; all consumers access only the latest Helper/meta snapshot.


## 6. Image & Document Pipeline

---

### 6.1 Overview

This section details the full lifecycle of images and documents in the system:  
from upload and optimization (Cloudinary), through AI tagging, to final report and PDF generation (WordPress API), including all metadata, file/folder rules, and cross-module integration.

---

### 6.2 Image Upload, Processing & Storage

- **Upload Logic:**
  - Images can be uploaded from any device (desktop/mobile), via standalone module or within any stage (expertise, parts, invoices, etc.).
  - Multi-file uploads supported (camera, gallery, file drag/drop).
  - User is never required to upload all images in one session—images can be added at any time until the case is finalized.

- **Cloudinary Transformation:**
  - All images are sent to Cloudinary for:
    - Resizing and format optimization (standardized output: JPG, web-friendly, lightweight).
    - **Branding:** Overlay of business name, plate, and date (no direct AI/ML logic in Cloudinary).
    - **Watermark:** Logo (bottom left) on all output.
    - Images are returned with direct URLs and public IDs for system reference.
  - No AI recognition done in Cloudinary; only transformation and stamping.

- **AI Tagging & Recognition:**
  - Image recognition (damage area, car part, etc.) is handled via Make.com automations, not within Cloudinary.
  - AI labels and tags are mapped back to each image and stored in Helper/meta for search, reporting, and workflow automation.

- **Folder & Naming Rules:**
  - Images are filed in `/cases/[PLATE]/pictures/` under the correct case folder.
  - File names follow pattern: `[plate]_[area/part_label]_[timestamp].jpg`
  - Both originals and processed versions are retained (for audit and legal purposes).

- **Legal Importance:**  
  - All pictures are treated as legal documentation and must be retained, properly labeled, and easily retrievable.
  - The images form a critical part of each case’s evidentiary record, supporting the assessor’s evaluation and protecting against legal challenge.

- **Staging for Grouped Parts PDF:**
  - After Cloudinary processing and AI tagging, all images for a case are also staged in a folder `/cases/[PLATE]/pictures/before_pdf/`.
  - User may review or adjust part labels before proceeding.
  - When ready, user triggers automation to:
    - Extract images from `before_pdf` folder
    - **Group images by damaged part** (using AI/part recognition or user label)
    - For each part, generate a **thumbnail PDF** (multi-image sheet) for fast localization, review, and visual search.
    - PDFs are saved in `/cases/[PLATE]/pictures/parts_pdfs/` and referenced in meta for rapid access.

---

### 6.3 Document Handling & Invoice Processing

- **Invoice Upload:**
  - Invoices can be uploaded or scanned as images/PDFs (multi-format support).
  - OCR is performed via Make.com automation, extracting costs, supplier, dates, and relevant invoice fields.
  - Extracted values are written to Helper/meta, directly affecting draft/final report and financial tables.
  - Each invoice is stored in `/cases/[PLATE]/invoices/` with traceable filename and audit log.

- **Other Documents:**
  - Any supplementary docs (correspondence, directives) are stored in `/cases/[PLATE]/correspondence/`.
  - Only PDF, image, or structured data formats allowed for legal outputs.

---

### 6.4 PDF Generation Flow

- **PDF Reports (Draft/Final):**
  - Reports are rendered using the system’s WordPress PDF API, with two available input formats:
    - **JSON to PDF:**  
      - Data sent to `https://carmelcayouf.com/pdf-api/render.php` for dynamic, template-driven PDF generation.
    - **HTML to PDF:**  
      - Prebuilt HTML sent to `https://carmelcayouf.com/pdf-api/html.php` for exact branded output.
  - All PDFs are saved in `/cases/[PLATE]/reports/` and referenced in the Helper/meta for traceability.
  - **External html2pdf** is available as a backup, but not active in the main pipeline.

- **Integration:**
  - Make.com scenarios handle the trigger, payload mapping, endpoint selection, and result filing.
  - Each PDF is linked to its source JSON/HTML payload for possible audit, replay, or regeneration.

- **Grouped Parts PDF (Thumbnail Sheets):**
  - Special automation (triggered by user or scenario) takes all optimized images in `before_pdf` folder, groups them by damaged part, and generates a thumbnail sheet PDF per group.
  - These PDFs support quick part identification, visual review, and internal/external reporting (workshop, legal, insurance).
  - All thumbnail PDFs are logged and indexed in Helper/meta, under the relevant part and case.

---

### 6.5 Metadata and Traceability

- **Every image and document is logged in Helper/meta** with:
  - File path, original/processed status, upload time, labels/tags, and module of origin.
  - All files are discoverable via the Search/Tracking module and included in audit logs.

- **AI recognition labels, invoice OCR results, and document meta** are always tied to case and surfaced in reporting.

---

### 6.6 Data & Privacy Safeguards

- **Originals always retained** (never overwritten or deleted until case is explicitly closed/archived).
- **No data is left orphaned**—each upload and result is tied to case/meta for end-to-end traceability.

---

### 6.7 Visual Pipeline (ASCII for Reference)

[User Upload]
↓
[Cloudinary Transformation] ←→ [Logo/Branding Overlay]
↓
[Make.com AI Recognition]
↓
[Helper/meta update]
↓
[PDF Generation via WordPress API]
↓
[File storage: /cases/[PLATE]/reports/ and /pictures/]


## 7. Admin, Tracking & Notification

---

### 7.1 Admin Hub & Developer Back Door

- **Admin Hub (מודול אדמין):**
  - Centralized interface for system configuration, health monitoring, and user management (future multi-user support).
  - Core features:
    - View/override any case meta or Helper data
    - Manual data corrections, emergency patches, and audit trail access
    - Log viewer (all user and automation actions tracked)
    - System status dashboard (webhooks, endpoints, agent/automation health)

- **Developer Back Door:**
  - Hidden, password-protected admin area for critical technical maintenance.
  - Key capabilities:
    - Webhook and endpoint management (review, edit, rotate, add/remove)
    - Static text/report block editor (Markdown—not direct HTML—for legal anchors, disclaimers, and fixed content)
    - API key and credential storage/management
    - Download/export of logs, meta, and configuration
    - Update or patch agent prompts, mapping logic, or automation configs live
    - Forced backup/restore of system state
    - All changes logged, versioned, and auditable
  - Two-factor authentication (2FA) ready for future security upgrades

---

### 7.2 Tracking Table, Search & Monitoring

- **Tracking Table (טבלת מעקב):**
  - Aggregates meta from all active cases for live office-wide search, filtering, and review.
  - Key columns: plate, owner, date, status, report links, outstanding actions, and metadata links
  - Updated in real time by Make.com scenario, manual actions, or fallback/manual input.
  - Supports direct links to case folders, reports, and Helper/meta for rapid action.

- **Search Module (מודול חיפוש):**
  - Enables search across all cases, reports, images, and documents by any core attribute (plate, owner, part, status, etc.)
  - Integrates with tracking table, notification system, and admin audit functions
  - Results displayed inline, with links to all related files/folders and status actions

---

### 7.3 Notification System (OneSignal, Twilio, WhatsApp)

- **OneSignal Integration:**
  - **Primary notification channel** for real-time system alerts, push notifications, and workflow status changes.
  - User subscription allowed only after successful authentication—no pre-auth notification spam or leaks.
  - Notifications triggered by automations, admin actions, overdue tasks, or critical events.

- **Twilio/WhatsApp (optional/future):**
  - Supports SMS or WhatsApp messaging for escalations, reminders, or cross-channel redundancy.
  - Not active by default, but system is designed for quick enable/disable.

- **Privacy & Opt-Out Controls:**
  - Admin interface allows review and management of notification preferences and privacy settings for each user/session.
  - All notification actions are logged for compliance.

---

### 7.4 Security, Logging & Audit

- **Access & Roles:**
  - All admin and developer actions require strong authentication; no sensitive actions exposed in client/HTML.
  - Back door/dev area requires separate password and can be upgraded to 2FA.

- **Logging & Audit:**
  - Every action (user, automation, admin, agent) is logged with timestamp, actor, and change details.
  - Log files are stored in `/logs/` (per case and system-wide).
  - All config changes, report block updates, and webhook changes are versioned and revertible.

- **Health Monitoring:**
  - Admin dashboard surfaces webhook status, automation failures, system exceptions, and performance issues.
  - Alerts can be pushed to admin/dev via notification system.

---

## 8. Legal, Branding & Compliance

---

### 8.1 Branding & Mandatory Content

- **All outputs (reports, PDFs, notifications, UI, images) are branded:**
  - **Business name:** "Yaron Cayouf Damage Assessment and Appraisal" (ירון כיוף שמאות והערכת נזקי רכב ורכוש)
  -All reports, documents, business data, and outputs are solely Yaron’s property.
  - 
  - **Logo, favicon, and legal footer:** Applied to every report, PDF, and branded image (see Cloudinary and PDF sections)
  - **© All rights reserved Carmel Cayouf** — appears on all pages , system UIs, and documentation to assert developer and IP rights, and that includes The system architecture, software, concept, automations, and user interface .

- **Branding elements are embedded in:**
  - Cloudinary image transformations (logo, text overlay)
  - PDF generation templates (background, header/footer, signature area)
  - All system notification templates (email, push, etc.)
  - Main navigation and login pages

---

### 8.2 Legal Disclaimers & Anchors

- **Fixed legal text and disclaimers** are included in all draft and final reports, with content set and editable only by admin (via Markdown editor in back door).
- **All legal disclaimers and compliance blocks** are versioned and auditable, with change logs for any updates.
- **Signature anchors and authorized signatures** are mandatory on final reports; draft reports are marked as provisional.

---

### 8.3 Compliance & Professional Standards

- **System enforces legal structure and field completeness** for every report—no submission allowed unless all mandatory blocks and compliance anchors are present.
- **All images and document metadata are retained per legal guidelines** for damage assessment, insurance, and court readiness.
- **Full audit log of every report generation, update, and submission**, including who finalized and with which metadata state.
- **Role separation:** Only authorized users (admin/assessor) can finalize reports or change legal content.

---

### 8.4 Intellectual Property & Rights

- **System code, automations, templates, and documentation** are the IP of Carmel Cayouf (developer).
- **Business branding, client data, and reports** are the property of Yaron Cayouf (user/business).
- **All rights reserved** statement appears in every output, with technical enforcement (embedded text, PDF watermarking, etc.) to prevent unauthorized reuse.

---

### 8.5 Update & Change Management

- **Any changes to branding, legal text, or compliance templates** must go through the admin back door, are versioned, and require re-authentication.
- **All previous versions are retained for audit, rollback, and legal challenge response.**
- **Periodic review:** System prompts admin to review/update disclaimers in accordance with regulatory or legal changes.

---
## 9. Fallback/Manual/Backup Path

---

### 9.1 Purpose and Principles

- The fallback/manual system is designed **strictly as a backup for continuity** if automations or cloud services fail.
- It is never a primary workflow and cannot override or bypass the main Make.com-driven system logic.
- Any data entered via fallback/manual methods must ultimately be pushed into the main system’s meta/Helper aggregation, ensuring no lost, orphaned, or “shadow” data.

---

### 9.2 Fallback Workflow

- **Entry Points:**
  - Manual data entry forms (for field reports, parts, images, invoices) available only when main modules are offline or by explicit admin override.
  - All forms require plate/owner/date to enforce case traceability.
- **Output:**
  - Data is formatted as flat JSON or standardized text, mirroring system module outputs.
  - Files and documents are filed into the same `/cases/[PLATE]/` structure as automated workflows.

---

### 9.3 Data Sync and Re-integration

- **Meta/Helper update:**
  - On system restore or admin-triggered sync, all fallback/manual records are submitted to Make.com for meta/Helper ingestion.
  - Duplicate checks and merges ensure manual entries do not overwrite fresher automated data.
  - Sync is logged, auditable, and can be forced by admin if partial restores are needed.

- **Reporting:**
  - Manual entries appear in tracking/search and are visible to the admin, with a “fallback” status until full sync.
  - No report can be finalized solely on fallback/manual data—completion requires revalidation or confirmation in the automated system.

---

### 9.4 Triggers & Limitations

- **Fallback path is only triggered:**
  - On loss of automation/Make.com availability
  - By explicit admin/developer action for system patching or hotfixes
- **Limitations:**
  - No unique logic, products, or workflows exist in the fallback path that do not have a match in the main system.
  - Manual entries cannot bypass compliance, audit, or data completeness checks.

---

### 9.5 Backup Storage, Recovery & Versioning

- All manual data is versioned, timestamped, and tagged by entry type and user.
- Backups are stored in `/cases/[PLATE]/backup/` with mirrored folder structure.
- All recovery and restore actions are logged and require admin confirmation for reintegration.
- Full audit trail is maintained for any data created or restored via fallback/manual path.

---
## 10. System Dependencies & Data Interconnection

---

### 10.1 Platform, API & Service Dependencies

- **Core Platforms:**
  - **Make.com:** All automation scenarios, webhooks, event-driven logic, agent orchestration.
  - **Cloudinary:** Exclusive image transformation, stamping, and storage.
  - **OneDrive & Google Drive:** Structured case folder hierarchy, backup, and bridge (where needed for Excel/metadata handling).
  - **Netlify:** Static and dynamic front-end deployment (forms, process modules, in-system browser).
  - **WordPress (PDF API):** JSON/HTML to PDF generation endpoints for all report outputs.
  - **GitHub:** Source code management, documentation, configuration backups, and technical change tracking.
  - **OneSignal:** Push notifications (primary channel), admin/assessor alerts.
  - **Twilio/WhatsApp:** Optional SMS/escalation channel.
  - **External data sources:**  
    - [check-car.co.il](https://www.check-car.co.il): Car details scrape.
    - [Levi Yitzhak](https://portal.levi-itzhak.co.il/levicars/Indexn.aspx): Market value and report blocks (via OCR/browser agent).

- **APIs, Webhooks, Credentials:**
  - All scenario endpoints, webhook URLs, and API keys are stored securely in the admin back door—never hard-coded.
  - System requires managed credential rotation, audit, and 2FA for all sensitive access.

---

### 10.2 Logical Data Dependency & Aggregation Order

#### **A. Feeder Modules (Data Generators)**
- Levi report (OCR/in-system browser)
- Invoice upload/OCR
- Parts search (text/image/browser)
- Image upload/optimization
- Manual entry/fallback
- **Expertise** (also feeds field/initial data, and user/manual input)

#### **B. Data Aggregation: Helper/Meta Table**
- All feeder modules push data to Helper/meta, in flat JSON—no intermediate or orphaned data is used downstream.

#### **C. Consumer Modules (Data Users)**
- **Expertise:**  
  - Consumes: Levi, image, invoice, parts, and manual/fallback updates  
  - Feeds: Field/initial damage/center data, and user/manual input  
  - *Role*: Expertise dashboard is updated as new feeder data arrives, serving as an “operational hub” during the open case.
- **Draft Report:** Requires all relevant field, Levi, invoice, and parts data.
- **Final Report:** Can only lock/submit if Helper/meta is fully aggregated with all feeder outputs.
- **Search & Tracking:** Only accesses Helper/meta for real-time case state—never queries individual feeder modules.
- **Admin, Backup, Analytics, Knowledge Hub:** Pull from Helper/meta and cumulative meta folders for monitoring, reporting, and ML/analytics.

#### **D. Data Dependency Tree & Sync Order**
1. **Feeder module completes (user/automation/manual)**
2. **Pushes flat data to Helper/meta**
3. **Helper/meta updates trigger downstream automation**
4. **Consumer modules “wake up” only after full data is present**
5. **No module ever duplicates or re-runs feeder automation—always aggregate, then consume**
6. **Expertise both pushes and consumes—its UI/logic refreshes as any related feeder data is updated.**

---

### 10.3 Interconnection Matrix (Expanded)

| Module             | Feeds Data | Consumes Data | Depends on                                      | Output Triggers      |
|--------------------|------------|---------------|--------------------------------------------------|----------------------|
| Expertise          | Yes        | Yes           | All feeders                                      | Helper/meta update   |
| Levi Report        | Yes        | No            | N/A                                              | Helper/meta update   |
| Invoice            | Yes        | No            | External work (garage) completion                 | Helper/meta update   |
| Parts Search       | Yes        | No            | N/A                                              | Helper/meta update   |
| Image Optimization | Yes        | No            | User selection of available raw/original pictures | Helper/meta update   |
| Draft Report       | No         | Yes           | All feeders/meta                                 | PDF generation, lock |
| Final Report       | No         | Yes           | All feeders/meta                                 | PDF, signature, lock |
| Search/Tracking    | No         | Yes           | Helper/meta                                      | UI, admin, notify    |
| Admin/Backup       | No         | Yes           | Helper/meta                                      | Logs, restore        |
| Knowledge Hub      | No         | Yes           | Cumulative meta                                  | Analytics, alerts    |

---

**Real-World Dependency Notes:**
- **Invoice module:**  
  - Actual invoice data entry and upload are blocked until the external work (e.g., repairs at garage or workshop) is completed and the invoice is issued.
- **Image Optimization:**  
  - Relies entirely on the user’s timely selection/upload of all required raw/original pictures for the case. No image automation proceeds until the base image set is available.



---

### 10.4 Failover, Sync & Update Logic

- Any module failure triggers notification via OneSignal/admin log.
- If any feeder data is missing, consumer modules remain locked/incomplete until updated.
- All backup/manual/fallback data follows the same aggregation logic—must reach Helper/meta before becoming available to consumers.
- **No “shadow” automations—every process is orchestrated through the main data tree and logged for audit.**

---
## 11. Technical Guidelines, Engine Design & Functional Contracts

---

### 11.1 Coding, Dynamic Data, and Content Standards

- **Frameworks:**  
  - Frontend: HTML5, JS (ES6+), React (for admin, floating screens, dashboards).
  - Backend/Automation: Make.com scenarios, WordPress PHP endpoints (PDF), Node.js/Python for helpers (OCR, parsing, AI).
  - All logic modular and API-driven—every process is a function, not a monolith.

- **Data Format:**  
  - **Flat JSON** for all metadata, report, and cross-module data (never nested for more than one level).
  - Naming: English, snake_case/camelCase for JSON; kebab-case for files/folders; Hebrew for output/labels only.
  - **Metadata is always additive, never destructive:** no deletion—filtered, archived, or marked “inactive,” but never erased.

---

### 11.2 Mathematical Engine & Dynamic Content Blocks

- **Math Engine:**  
  - Required for all calculations in draft/final reports: depreciation, compensation, percentage adjustments, multi-damage aggregation, fee summaries.
  - Capable of parsing embedded formulas in report templates or meta (e.g., `{total_damage = sum(damage_1_cost, damage_2_cost) - depreciation}`).
  - Calculations must auto-update live as any feeder (invoice, Levi, parts, manual) data changes—no hard-coded values.
  - All computed fields are both viewable and overrideable by authorized users (for legal or professional corrections).

- **Dynamic Content Generation:**  
  - Smart report blocks: content auto-fills from meta, including conditional sections (if-then for special damage, fee, or part cases).
  - Support for “smart” anchors—dynamic block pulls correct value from latest meta, regardless of data origin (OCR, user, agent).
  - Final reports must support block/section insertion or removal (e.g., adding a newly discovered damage or invoice after initial draft).

---

### 11.3 Metadata Flow: Filtering, History, Search & Never Lost Principle

- **Live Meta:**  
  - Every data point (even “unselected” parts, images, search results) is stored in meta/Helper with status (chosen, ignored, fallback, reference, etc.).
  - **Data is filtered for workflow, not deleted**—unselected or background results are kept for analytics, cross-case reference, and audit.

- **Cross-Case & Knowledge Hub:**  
  - All results (parts, images, reports) not chosen are moved to cumulative meta for cross-case analytics and fallback.
  - Knowledge hub logic ensures even rejected/archived data supports future system intelligence (smart suggestions, bottleneck alerts, reference search).

---

### 11.4 Special Features: Floating Screens, In-System Browser, Auto-Login, Import

- **Floating Screens:**  
  - Must support always-on-top mode, context switching, and dynamic content injection from any module.
  - Used for quick edits, confirmations, rapid navigation between modules without losing state.
  - Can pull/push meta changes, trigger automations, or surface real-time data validation/errors.

- **In-System Browser:**  
  - Embedded browser windows to external sites (e.g., Levi Yitzhak, car-part.co.il) without leaving the system.
  - **Auto-login:**  
    - Session cookies and credentials injected by Make.com/automation/admin when user opens browser—never stored in client JS or HTML.
    - All browser actions logged for security/audit.
  - **Import/Download:**  
    - Download PDFs, screenshots, or scraped data directly into the correct case folder (invoices, Levi report, etc.).
    - Immediate ingestion into meta/Helper, with mapping logic for field alignment and audit.

---

### 11.5 Stand-Alone Module Injection & Out-of-Flow Updates

- **Stand-alone Modules:**  
  - Any core module (e.g., picture upload, parts search, invoice upload) can be used independently from the main workflow.
  - Requires only minimal ID inputs (plate, owner, date)—auto-mapped to the relevant case upon submission.
  - All injected data is routed to Helper/meta and triggers downstream updates (report recalculation, status, notifications).

- **Late-Stage Modules (Fees, Depreciation, Invoice, etc.):**  
  - These modules are not “locked” to any workflow stage—can be accessed and updated at any time before finalization.
  - When new data arrives (e.g., invoice parsing, depreciation change), all downstream draft/final report blocks are instantly recalculated.

---

### 11.6 Invoice Parsing, Fee/Depreciation Table Logic

- **Invoice Parsing:**  
  - OCR or manual entry produces a mapped block (JSON/Markdown), aligned to draft and final report tables.
  - As soon as invoice data is confirmed, draft data/tables are auto-updated, including recalculated totals, fee adjustments, and compensation fields.
  - Audit log records source (OCR/manual), who confirmed, and any manual override.

- **Fees & Depreciation:**  
  - Tables are “smart”: rows/fields can be added per damage area/center, and global depreciation rates can be adjusted at any time.
  - Every change is logged, recalculated live, and visible in all consumer modules (draft, final, tracking, admin).

---

### 11.7 Final Report Process: Zoom-In and Late-Stage Data

- **Final report is never “static” until signed and locked:**  
  - The process “waits” for all data—field, Levi, parts, invoices, depreciation, fees, late-arriving images, external inputs.
  - Any new/late data is immediately ingested and recalculates all dependent values.
  - Only after final lock and signature is report archived as “final”—prior, all data remains dynamic and updatable.

---

### 11.8 Smart Aggregation, Data Integrity & Cross-Referencing

- **“Never Lost” Principle:**  
  - Any data point—whether or not used in the final report—is kept for fallback, future analytics, and reference.
  - All search results, rejected options, unchosen parts, and prior drafts are retained for future cases or legal review.

- **Cross-Referencing:**  
  - Code must enable linking and referencing between cases, so any similar part, image, invoice, or external event can be surfaced by the knowledge hub for suggestions or bottleneck warnings.

---

### 11.9 Coding Directives by Function

- **For every module:**  
  - Use Make.com for primary automation, but allow escape hatches (custom scripts, API triggers, manual/admin edits).
  - All functions, calculations, and user interactions must be idempotent (safe to re-run, no side effects).
  - All code/config must support live update, dynamic data injection, and rollback.

- **Security:**  
  - All credentials and secrets are rotated, never in client code.
  - Admin/dev interfaces are password-protected, with 2FA as needed.

- **Testing/Debug:**  
  - Every automation and module supports dry-run, test case injection, and detailed logging for errors/edge cases.

---

### 11.10 System Growth, Upgrade, and Maintainability

- **Modularity:**  
  - All code and data structures are built to support upgrades and new modules without breaking backward compatibility.
  - Adding a new module (e.g., new parts source, AI recognition, analytics dashboard) requires only updating config, mapping, and meta/Helper logic.
- **Patching & Hotfixes:**  
  - Always done via admin back door, with logging/versioning and quick rollback support.

---

## 12. Appendices

---

### 12.1 Sample Data Structures

**A. Flat JSON Sample (Case Metadata):**
```json
{
  "plate": "5785269",
  "owner": "יוסי לוי",
  "date": "2025-05-21",
  "damage_1_area": "חזית",
  "damage_1_cost": 2200,
  "levi_value": 67000,
  "invoice_1_sum": 800,
  "parts_1_supplier": "UMI",
  "parts_1_price": 300
}
B. Invoice Line Mapping (after OCR/parse):

{
  "invoice_id": "INV-8723",
  "date": "2025-05-20",
  "lines": [
    {
      "part_name": "מגן קדמי",
      "qty": 1,
      "price": 780,
      "matched_expertise_part": true,
      "anomaly_flag": false
    },
    {
      "part_name": "פנס שמאל",
      "qty": 1,
      "price": 620,
      "matched_expertise_part": false,
      "anomaly_flag": true
    }
  ]
}
C. Parts Search Result Block (for fallback/reference):

{
  "search_id": "PS-2536",
  "timestamp": "2025-05-20T12:40:11Z",
  "results": [
    {
      "part_name": "כנף ימנית",
      "supplier": "י.ש חלפים",
      "price": 650,
      "selected": true
    },
    {
      "part_name": "כנף ימנית",
      "supplier": "ב.ס.מ. חלקים",
      "price": 700,
      "selected": false
    }
  ]
}
12.2 Field & Logic Mapping Tables
Field (English)	Field (Hebrew)	Source Module	JSON Path	Used In
plate	מספר רכב	Expertise/All	plate	All reports, meta, search
damage_1_area	אזור נזק 1	Expertise/Image AI	damage_1_area	Draft, final report
levi_value	ערך רכב	Levi OCR/Browser	levi_value	Draft/final report
invoice_1_sum	סכום חשבונית 1	Invoice/OCR	invoice_1_sum	Draft, final report, admin
part_1_supplier	ספק חלק 1	Parts/Manual/Image	parts_1_supplier	Report, knowledge hub
(Add more as required for your use case.)

12.3 Webhook & API Reference
Purpose	Endpoint/URL	Method	Auth?	Payload Type	Notes
PDF Gen (JSON)	https://carmelcayouf.com/pdf-api/render.php	POST	Internal	JSON	Main endpoint, draft/final reports
PDF Gen (HTML)	https://carmelcayouf.com/pdf-api/html.php	POST	Internal	HTML	For full branded HTML
OneSignal Notify	[OneSignal API endpoint]	POST	Token	JSON	Push notifications
Image Transform	[Cloudinary API URL]	POST	Key	JSON/URL	Branding, resizing
Meta Update	[Make.com webhook URL]	POST	Token	JSON	Meta/Helper sync
(Full URLs/tokens managed in system vault.)

12.4 Platform Credentials (Placeholders Only)
Make.com: env[MAKE_API_KEY]
Cloudinary: env[CLOUDINARY_CLOUD_NAME], env[CLOUDINARY_API_KEY]
WordPress PDF: env[PDF_API_USER], env[PDF_API_PASS]
OneSignal: env[ONESIGNAL_APP_ID], env[ONESIGNAL_REST_KEY]
Admin Vault: vault/external_sites.json (for browser auto-login)

### 12.5 Outstanding Questions / Clarifications (with Detailed Resolutions)

---

**Parts Search: Fallback & Knowledge Hub**

- **Parts are structured in three operational categories:**
  1. **Initial classification/directive:** The evaluator’s assessment and part identification at start.
  2. **Actual availability and costs:** Search results (via browser, agent, or photo), source, and supplier info.
  3. **Additional/late parts:** Parts authorized or discovered during the process—these are tracked even if added after expertise.
- **Three search methods:**
  - **In-system browser:** User-driven, parsed, mapped into fields, and sent to meta as raw/final block.
  - **Make agent search:** Triggered in parallel or separately; results filed to meta by agent.
  - **Photo recognition:** Used for uncertain parts, auto-identification, or OEM number fetch; integrated when needed.
- **User workflow:** System can allow user to activate one or more search modes as needed (not forced parallel if not wanted).
- **Parts agent:** Posts and receives data—can file results from UI, browser, or Make, enabling full circle meta aggregation.
- **All results (used or not) are retained:**  
  - Selected parts stay with the case until changed or finalized.
  - Unused results are archived in meta at both plate and global level for fallback/knowledge/reference.

---

**Invoice-to-Expertise Matching: Anomaly, Replace, Unmatched**

- **Invoices come in various formats:**  
  - System uses table-based parsing—extracts all part/work types, costs, quantities into a unified JSON table.
- **Matching logic:**
  - After parse, each line is matched to expertise parts using fuzzy matching, synonyms, or code mapping.
  - **If match found:** Line is linked and flagged “matched.”
  - **If no match:** Line is flagged as “unmatched/anomaly” for review; can be added to expertise meta or archived as “unresolved.”
  - **When invoice part supersedes expertise:** Marked “replace” and case meta is updated accordingly.
- **All lines, even unmatched or “floating” parts, are retained in plate-level meta and cumulative knowledge for future reference, analytics, or fallback needs.**
- **Plate is always the main anchor for joining/finding data.**
**Invoice Automation: Upload & Email Fetch**

- **Two parallel automations:**
  1. **File Upload:**  
     - Triggered by user uploading an invoice (image, PDF, etc.) into the system.
  2. **Email Watcher:**  
     - Automation monitors designated email inbox, recognizes and extracts digital invoices automatically.
     - Digital invoices are parsed as soon as they are recognized, no manual download/upload required.
- **In both cases:**  
  - Parsing results are written to the Helper (local tracking for the case) and to a dedicated Google Sheet (global tracking for all invoices/parts).
  - Both routes serve the same consumer: the **final report**, where parsed parts/costs are injected into the report data block.
- **Technical note:**  
  - As Make.com cannot trigger two automations off one event, dual paths are built to ensure both upload and email events feed the same destination (meta + Google Sheet).
- **Business impact:**  
  - This dual-entry logic guarantees that no invoice, whether digital or scanned/uploaded, is ever missed by the system or lost in email.


---

**Floating Screens: Schema & UI Guidelines**

- **Purpose:** Facilitate rapid access to case data or sub-modules without leaving main workflow screen.
- **Data schema:** Generally “field:value” table, with core identifiers (plate, owner, model, year) always present.
- **Layout:**  
  - Global template, but each screen can have contextual title and specific columns (e.g., part, supplier, source for parts; cost/adjustments for Levi).
  - If possible, design as a table/grid for rapid scan; layouts adapt based on module.
- **Technical guideline:** Floating screens reuse the same engine/components, only columns/titles differ by context.

---

**Meta Archive/Event Triggers**

- **Meta fetch/archive is user-triggered** (user opens or searches plate, system fetches/loads relevant meta and state).
- **User experience:** Must provide clear UI feedback (“fetching data in progress,” spinner, etc.) so user is always aware the system is working/loading.
- **Archive is not fully automated or silent—manual action by user triggers the process.**

---

**In-System Browser: Expansion and Site Registry**

- **No hard-coded list of external sites:**  
  - Admin (back door) can add/register new external sites via simple interface: URL + credentials stored in encrypted vault.
  - Each new site is “inactive” by default; only admin can activate/enable for in-system browser use.
  - Credentials are never exposed in client—vault access only via admin.
- **Expansion is always controlled—system is not an open browser, but a curated set of allowed sites, added by explicit registration.**


12.6 Future/Optional Features & Roadmap
html2pdf re-integration for special or legacy cases.
Smart Knowledge Hub: Full cross-case analytics and smart suggestion engine.
Full multi-user admin with role-based access.
Modular plug-in framework for adding new external sites or tools.
Full system health dashboard with auto-recovery/repair tools.

******************************************************END OF VERSION 1 ************************

THIS PART NEEDS TO BE INTEGRATED ACROSS THE DOCUMENT .


MODIFICATIONS AND ADDITIONS :


those are not changing the logic of the spec but rather adding on it.
To day we have  3 consumers :
Expertise  =>1 type
Draft report =>1 type 
Final report =>1 type

We will need to create flow with the 4 consumers but with more types for the final report :

Expertise  =>1 type
Draft report =>  1 type
NEW CONSUMER - estimate report ( in Hebrew : אומדן) => 1 type 
Final report => 4 types


Final report types :

The needed types are the same as the final report , they are a final report version - it depends on the nature of the evaluation and decision to determine which type use .
Today our final report type is private type, it meant for a private contract between the owner of the car and the user 
There are 3 other final reports types that are generated instead of the private if certain conditions or situation are happening such as de-listing the car , sell the car in its damaged state , or sell it as parts. - the exact names of these versions will be provided by me later.
What is the difference between the types. 
In short NOTHING Special other than the title and the following 2 sections:

1. The final text summary of the assessor - important as it has legal implications .
2. Extra data needed for that new text version.

The types we add on the private type base we have : 4 in total 

 חוות דעת גלובאלי -
חוות דעת טוטלוסט -
מכירה מצבו הניזוק -
  
Solution for those 3 new versions of the final report :

Current data input just before finalization the private final report with a operate UI :
1. Depreciation 
2. Fees 
3. The new tips needed data will be integrated in the depreciation UI and its gonna be optional 
And :

In the beginning of the final report module, when the user wants to finalize the report , another new UI that asks which type the user would like to initiate , the user can initiate more than one type. 
Once the final report is initiated it is the same exact flow as we already described and synthesized including the pdates of the damage tables and the Levi price adjustments and everything we designed 
Then the flow goes as we already decided - screen -> confirmation , ......, , depreciation data input UI , (NEW) designated Type UI, fees input => finalization .

If the user decides to select 2-3 types then the system need to proved teh relevant UI's in the flow, and the generation will be 2-3 types at the same time (opened to suggestions) 

As for the text for each type, my view is that we have a vault or container of labeled texts , those are called upon o the final report according to its type, so we will have 4 texts versions, each is associate with a type, and once the user select the type the "placeholder" or the "anchor" in the summary will know which text version to pull. 
The extra needed data for that text version, is coming from the new UI we made for each type, filling the gaps inside the text will be the same as with the private report.

THE BACKDOOR in the text intervention is even more important now , I need to have a Dev._Text Modular_ that I changed / update or add text just there , those are the banks of the types texts and my intervention is updating the directory immidialaty. This text directory as you already made in the specs, are not just summary but all the explanatory and legal texts in the document. 

The NEW CONSUMER - estimate report ( in Hebrew : אומדן) 

We need to add a fourth consumer its called : estimate report or in Hebrew : אומדן
Basically it's the same report as the draft but will be short of some details. I will provide the details later 
The estimate report's location in the flow is after the draft.
-Importance of this distinction comes from the fact that the estimate report will never be initiated in the field , and just ;like the final report, it will be created later - it comes after the draft and after the session was closed - its main purpose is pre document that estimates the final report 
-Also - its is not a fixed step, it is an 'On Demand' step that the use MAY use.  

 What we need for this report is the following : 

1. Anything edited (based on the draft) in this report will become the true version, if the user changes the initial content he got based on the raw draft, those changes now become the new update that we need to use afterwards in the final report.
2. The estimate report, will need a UI that that is similar to the logic of the new final reports חוות דעת  we just talked about,
3. Integration in data flow, metadata, automation and etc, - in order to be relevant in the process and really affects the final reports.
4. The estimate report will have the same logic of retrieving data as we planned for the final report - from metadata and ongoing updates .
5. The estimate report is an optional step, the user may not use it in 50% of the cases , that means it 100% modular , if its selected it has value if its skipped, it doesn’t  exist and the flow doesn’t  see it a dependency.

Thoughts :
1. On how to integrate this in the flow 
2. How to update the specs we made 
3. Requirements if needed - or it just more of the same .
4. Do you see dependencies other than what we had ?
5. Are there ant complications / risks ?



אומדן ראשוני ( טוטלוס, אובדן להלכה, )
‏Basically this a modified final report draft 
הערות: 

ערך  הרכב  המצויין  לעיל  בהתאם  למחירון  ואינו  מתייחס  למקוריות  הרכב  בעבר  וארוע  תאונתי.   

הצעה זו אינה סופית ויתכן שינויים במהלך תיקון הרכב. 

הערכתנו  מתייחסת  לנזקים  כפי  שהוצגו  בפנינו , ולנסיבות  המקרה  כפי  שתוארו  לנו  ע"י  בעל  הרכב  אשר לדבריו.  

קוד דגם רשיון הרכב נבדק בהתאם לטבלת המרה של לוי יצחק ונמצא 624228. _ (this we have in the data )

אחוז הנזק ברכב הנ"ל הוא 58.46% מערך הרכב. (This is coming from the depreciation screen)

הצעה זו אינה כוללת נזקים בלתי נראים מראש העלולים להתגלות במהלך פירוק ו/או תיקון. 

להערכתינו ירידת ערך צפויה כ 14.00% מערך הרכב הנ"ל מאירוע הנדון. (This is a new input)

לטענת בעל הרכב 2 מוקדי הנזק מאירוע הנדון. ( we have those from expertise)

לאור היקף הנזקים אנו ממלצים לסלק את התביעה הנ"ל על בסיס "אובדן להלכה" ללא תיקון בפועל. 

להערכתינו זמן השהייה במוסך לצורך תיקון    ימי עבודה 

הצהרה 

אני החת"מ : ירון  כיוף  תעודת  שמאי  מס'  1097. 

נותן  על  פי  בקשתך / כם  חוות  דעתי  במקום  עדות  בשבועה  בבית  משפט.  הנני  מצהיר  כי  ידוע  לי   היטב  על  פי  הוראות  החוק  הפלילי  בדבר  מתן  עדות  שקר  בבית  משפט.  דין  חוות  דעת  זו  כשהיא  חתומה  על  ידי, כדין  עדות  בשבועה  בבית  משפט.  




 חוות דעת גלובאלי

בהתאם לבקשה סיכמנו את חוות דעתנו בטרם קבלת  חשבנות  התיקון, (גלובאלי)   

הערכת הנזקים אינה כוללת נזקים בלתי נראים מראש העלולים להתגלות במהלך  פירוק.  

מחירי החלפים נבדקו על ידינו בתוכנת מולטיקט חלפים. 

ערך הרכב המצויין לעיל בהתאם למחירון ואינו מתייחס למקוריות הרכב בעבר  וארוע  תאונתי. 

מאחר ובעלי הרכב מעוניין בתיקון רכבו בכוחות עצמו,ובתאום עם בעלי הרכב. התביעה הנ"ל נסגירה על בסיס גלובאלי בסך   ש"ח כולל מע"מ. את הרכב  יתקנו הבעלים בכוחות עצמם.  

חוות דעתינו כוללת סעיף י"ע בשיעור %  מערך הרכב המצויין לעיל בגין  פגיעה בדלת אחורי ימ'. כנף אח' ימ'. סף ימ' קד' ועמוד אמצעי ימ' באירוע  הנדון. 

אושר מע"מ מאחרובהתאם לפסק דין ביהמ"ש העליון (ע"א: 1772.99) וביהמ"ש   המחוזי בחיפה ( בר"ע 1520.02) יש להוסיף לתחשיב הננזק מע"מ בשיעורהחוקי  כפי שיהיה במועד התשלום בפועל. 

הערכתנו מתייחסת לנזקים כפי שהוצגו בפנינו, ולנסיבות המקרה כפי שתוארו לנו  ע"י בעל הרכב אשרלדבריו.   

לטענת בעל הרכב 2 מוקדי הנזק מאירוע הנדון.   

אנו מערכים שהיית הרכב במוסך לצורך תיקונים בכ     ימים.    

 
הצהרה 

אני החת"מ : ירון  כיוף  תעודת  שמאי  מס'  1097. 

נותן  על  פי  בקשתך / כם  חוות  דעתי  במקום  עדות  בשבועה  בבית  משפט.  הנני  מצהיר  כי  ידוע  לי   היטב  על  פי  הוראות  החוק  הפלילי  בדבר  מתן  עדות  שקר  בבית  משפט.  דין  חוות  דעת  זו  כשהיא  חתומה  על  ידי, כדין  עדות  בשבועה  בבית  משפט 


מכירה מצבו הניזוק 

הערות: 

בהתאם לבקשה סיכמנו את חוות דעתנו בטרם תיקון הרכב, זאת בהתייחסות לעוצמת הפגיעה נמכר הרכב במצבו הניזוק. 

הרכב נמכר ע"י בעליו. 

הרכב במצבו הניזוק נמכר בסך 20,000 ש"ח , 10,000 ש"ח בהעברה בנקאית  

ו 10,000 ש"ח במזומן, מצורף זיכרון דברים בין שני הצדדים, והעברת בעלות.  

ערך  הרכב  המצוין  לעיל  בהתאם  למחירון  ואינו  מתייחס  למקוריות  הרכב  ב 

עבר  ואירוע  תאונתי.   

מחירי החלפים נבדקו על ידינו בתוכנת מולטיקט חלפים,  

הערכת הנזקים אינה כוללת נזקים בלתי נראים מראש העלולים להתגלות במהלך הפירוק. 

מצו"ב צילום זיכרון דברים בגין מכירת הרכב. 

ירידת  ערך  צפויה  לרכב  הנ"ל  1.50%  מערך  הרכב הנ"ל באירוע הנדון.   

אנו  מערכים  את  משך  שהיית  הרכב  במוסך  לצורך  תיקונים ב / כ 5 ימי  עבודה. 

 
הצהרה 

אני החת"מ : ירון  כיוף  תעודת  שמאי  מס'  1097. 

נותן  על  פי  בקשתך / כם  חוות  דעתי  במקום  עדות  בשבועה  בבית  משפט.  הנני  מצהיר  כי  ידוע  לי   היטב  על  פי  הוראות  החוק  הפלילי  בדבר  מתן  עדות  שקר  בבית  משפט.  דין  חוות  דעת  זו  כשהיא  חתומה  על  ידי, כדין  עדות  בשבועה  בבית  משפט. 


חוות דעת טוטלוסט

הערות לסיכום: 

 

חוות דעתינו בוצעה בטרם בוצעו התיקונים בפועל ואינה כוללת את הנזקים  הסמויים   בשלב זה של  הבדיקה.  

בהתאם לבדיקתנו הנזק ברכב הדון הינו מעל  60% מערך הרכב, ובהתאם לתקנות  התעבורה סעיף 9  לצו הפיקוח על המצרכים והשירותים סעיף ב , הוכרז הרכב הנ"ל  כניזוק ב " אובדן גמור ( טוטאלוס )    

מאחר וערך הנזק הראשוני הינו מעל 60% מערך הרכב הנ"ל, ואין כל  כדאיות כלכלית  ו/ או בטיחותית בתיקון הרכב , לכן הרכב הוכרז כניזוק ב "אובדן גמור( טוטאלוס) ויועדו לפירוק בלבד.   

 

רשיון רכב: 

רשיון הרכב בוטל על ידי משרדינו בהתאם להנחיית משרד התחבורה. 

 

טיפול בשרידים:               

שרידי הרכב לפירוק הוערכו על ידינו בסך   ש"ח  

 

כללי: 

 

ערך הרכב המצויין לעיל בהתאם למחירון ואינו מתייחס למקוריות הרכב  בעבר וארוע תאונתי. 

מחירי החלפים נבדקו על ידינו בתוכנת מולאיקט חלפים.  

 

אנו ממלצים לפצות את המבוטח על בסיס אובדן גמור (טוטאלוס). 

 

רשיון הרכב בצירוף טופס 587 נשלח למשרד הרשוי.  

             

שרדי הרכב נשארו בידי המבוטח לפירוק בלבד.  

 

התשלום בגין מחיר הרכב הניזוק כפוף לבדיקת עבר הרכב. 

 

 בדיקותינו העלו כי מספר השלדה אשר נבדק על ידנו ברכב תואם רישיון  הרכב.  

 

הצהרה 

אני החת"מ : ירון  כיוף  תעודת  שמאי  מס'  1097. 

נותן  על  פי  בקשתך / כם  חוות  דעתי  במקום  עדות  בשבועה  בבית  משפט.  הנני  מצהיר  כי  ידוע  לי   היטב  על  פי  הוראות  החוק  הפלילי  בדבר  מתן  עדות  שקר  בבית  משפט.  דין  חוות  דעת  זו  כשהיא  חתומה  על  ידי, כדין  עדות  בשבועה  בבית  משפט.   


Final reports types UI integrated logic :

1. UI & Data Collection Strategy

Unified “Depreciation & Report Type” UI
All fields needed for all report types are in one UI (e.g., depreciation %, value drop %, days in garage, sale price, etc.)
Fields are context-aware:
Fields not needed for a selected type are simply left blank or hidden.
Only fields relevant to the selected report type(s) are validated as required.
Advantages:
Simplifies navigation: one form, less back-and-forth.
Easy to pre-fill fields for types that share values.
Minimizes risk of missing required data.

Nearly all needed fields are shared and already present in the system.
“Extra” data per type (e.g., ירידת ערך צפויה, מחיר מכירה, ימים במוסך) is small, can be clearly labeled as “only needed for X report type”.
You can use simple logic to display/hide/require fields as types are selected, while also allowing the user to skip non-relevant fields.
2. Technical Directives for Implementation

All “extra data” fields are part of the depreciation/finalization UI.
Label fields with the type(s) they’re relevant for.
If a type is selected, its needed fields are required.
If a field is left empty and its type is selected, system prompts before finalization.
Text block (“vault”) logic:
Each report type’s legal/explanatory text is labeled and stored in the text bank.
When generating a report, the system merges the shared sections (title, owner, plate, core data, table of damages, etc.) with the correct legal/explanatory block(s), inserting extra data as needed.
Multi-type selection:
User can select any combination of types before finalization.
System generates one PDF (or DOC) per selected type, using shared data and each type’s legal block + data fields.
3. For the Estimate Report (אומדן) and Final Report Types

Estimate report reuses the same UI logic.
When user initiates estimate report, relevant fields are presented (based on your template).
Text block for estimate report is included in the vault; any unique fields (e.g., estimated value drop %, estimated days in garage) are prepped and pulled from the same UI.
If user edits anything in the estimate report, these become “truth” for the subsequent final report (unless overwritten by invoice).
4. Full Integration Steps

Update meta/data model:
Track all possible fields needed for any report type.
Mark each field with which report type(s) it serves.
Store user input only once (no duplication across types).
Update UI/UX:
Unified “finalization” form with dynamic field logic based on report type selection.
Clear labeling and tooltips for fields used in certain types.
Text vault:
Each legal/explanatory block stored per type (editable via Dev_Text_Modular).
Anchors/placeholders in text blocks dynamically filled with the correct fields from meta.
Finalization process:
At finalization, present the user with a summary: which reports will be generated, which fields are missing (if any), and legal text previews for each.
Upon confirmation, generate reports accordingly.
5. Risks/Edge Cases

If the user selects a type and does not fill a required field, system must prompt/block until resolved.
If multiple types share a field (e.g., days in garage), only one value is entered, re-used as needed.
Audit/log every generated report type and the data that went into it, for legal traceability.
Summary Table Example for UI

Field	Used In	Required?
Depreciation %	All types	Always
Value drop % (ירידת ערך)	Estimate, מכירה מצבו, גלובאלי	If type chosen
Sale price (מחיר מכירה)	מכירה מצבו בלבד	If type chosen
Days in garage (ימים)	גלובאלי, מכירה מצבו	If type chosen
...	...	...
Conclusion

Unified, context-driven UI is most robust, avoids confusion, and matches your modular spec logic.
You can always expand the UI per type later if you find it’s too “crowded,” but with 3–4 extra fields, this is unlikely.

Ready to proceed to update the spec, UI, and meta/data model with this logic, unless you object or want to experiment with per-type mini-UIs.

Estimate report UI logic :

System Logic (Flow Order):

Expertise (field/initial data, editable until session close)
Draft Report (generated at session close, fed by expertise data)
(Optional) Estimate Report (אומדן)
Created after session closure, never in field.
Pulls data from Draft Report (as starting point).
User can edit/override any field (especially parts, depreciation, value drop, etc.).
Any edits here become “truth” for the Final Report, unless later overwritten by invoice.
Does not generate a “final” legal document—serves as the “independent estimate” for insurance/company purposes.
Final Report (one or more types):
Generated only after (optional) Estimate, plus Depreciation & Fees modules.
Final Report always uses latest values:
Parts/fields from invoice if available.
Else, from Estimate (if created and edited).
Else, from Draft (if estimate not created).
Finalization UI presents type selection (one or more), summary of values, and text vault content per type.
Separation of Logic (for UI, Automation, and Meta):

Estimate is always a separate module/UI from Final Report.
Estimate updates meta fields, which the Final Report pulls from, but does NOT directly invoke the Final Report logic.
Estimate is “standalone”—can be skipped entirely; if used, its edits flow forward but it does NOT depend on any final report-specific UI or text logic.
In Practical UI/UX Terms:

Estimate (אומדן) is a standalone step after Draft, before final modules (depreciation, fees, finalization).
When triggered, it loads the latest draft data.
User edits as needed; system logs edits as “source=estimate.”
When user proceeds to Final Report, finalization logic works as before—but pulls meta values last set by Estimate if no invoice data is present.
For Engineering:

Keep Estimate UI and code base 100% independent from Final Report logic.
Do not merge estimate-specific fields into final report-type logic, except for fields that truly overlap (e.g., depreciation %), and even those must track source (estimate vs. final vs. invoice).
All audit, data trace, and automation flows must be able to show “where this value came from” at every stage.
Visual/Flow Update:
graph TD
    A[Expertise] --> B[Draft Report]
    B --> C{Estimate?}
    C -- Yes --> D[Estimate Report]
    C -- No  --> E[Depreciation/Fees]
    D --> E[Depreciation/Fees]
    E --> F[Final Report Type Selection + Generation]
Summary:

Estimate is separate from final report.
It is the only module (besides Draft) that can be skipped in normal flow.
Final Report always takes “latest value,” preferring invoice > estimate > draft.
All UIs, data models, and specs reflect this clean separation.
 

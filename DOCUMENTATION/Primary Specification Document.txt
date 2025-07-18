**Chapter 1: Executive Summary & System Overview**

---

### 1.1 Executive Summary

The **Carmel Cayouf Damage Evaluation System** is a robust, modular automation platform for professional vehicle damage assessment, documentation, legal reporting, and workflow management in the Israeli market.

Developed for licensed damage assessors, office staff, and legal professionals, the system streamlines every phase of a case: from field data collection and real-time car data scraping, through image/document processing, automated invoicing, and customizable reporting — to final output delivery and archiving.

**Key Functional Highlights:**

* **Modular architecture** supporting parallel flows and optional steps
* **Full automation** of image handling, OCR, and metadata propagation via Make.com
* **Smart metadata aggregation** using flat JSON format for compatibility and traceability
* **Customizable report generation**, including 4 distinct Final Report variants
* **Integrated legal text management** using the dynamic **Dev.\_Text Modular**
* **Scalable, event-driven ecosystem** with built-in resilience and fallback/manual support
* **Branded system** for "Yaron Cayouf Damage Assessment and Appraisal" (ירון כיוף שמאות והערכת נזקי רכב ורכוש), with all legal rights reserved to Carmel Cayouf

The system ensures compliance with Israeli legal standards, enables fast field-to-office transitions, and supports future growth via admin-configurable modules and AI-powered assistants.

---

### 1.2 Description and Purpose

The system eliminates manual inefficiencies, reduces data entry errors, and guarantees legally compliant, fully auditable outputs.

It supports the full cycle:

* **Field expertise report (אקספרטיזה)** with multi-damage entry
* **Automatic vehicle data scraping** (e.g., from Check-Car and Levi Yitzhak)
* **Image upload, tagging, and optimization** via Cloudinary
* **OCR invoice processing**, linking costs to damages
* **Parts identification** through browser, image upload, or GPT-based search
* **Draft and Estimate Reports** as live, editable working documents
* **Final Report variants** tailored to legal and operational scenarios
* **Fallback/manual workflows** to ensure business continuity under all conditions

All business processes are tightly integrated, with session resilience, rollback, and incremental saves enabled by event-driven automation.

---

### 1.3 Vision and Core Principles

* **Flexibility & Future-Proofing:** New modules, flows, and report types can be added without disrupting core logic.
* **Maximum Automation:** Make.com, Cloudinary, OneDrive, GPT, and HTML/PDF APIs replace manual steps across all modules.
* **Legal Compliance:** All outputs follow Israeli law and are dynamically generated with the correct disclaimers, anchors, and branding.
* **Dynamic Legal Texts:** All legal sections in reports are injected at runtime based on type (e.g., Private, Global Opinion, Total Loss, Sale in Damaged State) using the **Dev.\_Text Modular** in the back door.
* **Data Integrity:** All source types (auto/manual/fallback) sync to a centralized **Helper Table** (flat JSON), ensuring report accuracy and full auditability.
* **User-Centric UX:** Smooth, intuitive UI across all modules — with animations, auto-fill fields, and floating screen overlays.
* **Auditability & Logs:** All actions are recorded; admin and back-door changes are versioned and traceable.
* **Session Resilience:** System remembers incomplete sessions; metadata ensures work can resume even months later.

---

### 1.4 Target Users and Segments

**Primary Users:**

* Licensed damage assessors (שמאים)
* Repair shop managers
* Appraisal firm office staff
* Legal reviewers

**Secondary Users:**

* Insurance adjusters and agents
* Car owners under claims/disputes
* Law firms
* Developers and admins

**Office Setup:**

* Designed for solo use or team setups
* Admin roles and role-based access planned in future expansions
* Every user action feeds into the same audit and metadata structure

---

**Chapter 2: Terminology & Definitions**

---

| Term / Module                | Description                                                                                           |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Expertise**                | Field data capture module (אקספרטיזה), the foundation for every case.                                 |
| **Draft Report**             | Editable interim report generated automatically after Expertise.                                      |
| **Estimate Report**          | Optional, editable post-Draft estimate that feeds the Final Report unless overridden by invoices.     |
**Final Report (Private)**     | Legal-grade report for private claims/contracts- when the  owner contracts directly and not through an|
|                              | Insurrance company with the assessor                                                                  |
| **Final Report (Global)**    | Global Opinion report (חוות דעת גלובאלי), a global estimate of the damage rather than per damage      | 
| **Final Report (Total)**     | Total Loss report for damages exceeding 60%, used for dismantling designations.                       |
| **Final Report (Sale)**      | Report for sale in damaged condition (מכירה מצבו הניזוק).                                             |
| **Dev.\_Text Modular**       | Admin module for managing versioned legal texts, injected dynamically into reports.                   |
| **Helper Table**             | Flat JSON-based central aggregation table per case — single source of truth across modules.           |
| **Metadata**                 | Secondary text/JSON snapshot of case activity and values, versioned and stored alongside Helper.      |
| **Math Engine**              | Internal logic layer that calculates depreciation, damage percentages, and feeds reports.             |
| **Cloudinary**               | Image upload, optimization, branding, and transformation engine.                                      |
| **Make.com**                 | Primary automation platform for triggering data flows, OCR, synchronization, and document generation. |
| **OneDrive / Google Drive**  | Primary and temporary cloud storage platforms respectively.                                           |
| **GPT Agents**               | AI agents used for parts search, metadata enrichment, or field support.                               |
| **Levi Yitzhak / Check-Car** | External valuation data sources scraped or parsed for market value and car data.                      |
| **OneSignal**                | Push notification platform used to alert users of key updates.                                        |
| **Admin Hub**                | Central system oversight UI for staff.                                                                |
| **Back Door**                | Developer interface for webhooks, text blocks, credentials, and core config — password-protected.     |
| **Floating Screen**          | Overlay interface used for inline data preview, image review, or contextual actions.                  |
| **In-System Browser**        | Embedded browser windows used for on-platform access to Levi, parts, or other data providers.         |

---

**Chapter 3: System Architecture & Operational Flow**

---

### 3.1 Modular Flow Logic

The system operates through independent yet interconnected modules that pass structured, event-driven data. Each process can be triggered manually or automatically, and all data updates flow into the **Helper Table**, maintaining a single source of truth.

### 3.2 Case Lifecycle Flow

1. **User Login:** Authenticated via server-side Make.com validation. Enables OneSignal, module access, and floating screen overlays.
2. **Case Initiation:** Opening a new case creates folders, metadata, and a Helper Table. Users may begin at any module.
3. **Expertise Module:** Primary data collection, including Check-Car scraping, GPT tag suggestions, and damage/parts input.
4. **Draft Report:** Automatically built from Expertise. Live-editable. Becomes the base for Estimate and Final reports.
5. **Estimate Report (Optional):** Post-Draft editable layer. Changes affect the Final Report unless overridden by invoices.
6. **Invoice Module:** OCR-parsed invoice input. Updates Draft and Final reports, overrides Estimate if applicable.
7. **Final Report(s):** One or more types selected via unified UI. Auto-filled from Helper, calculated via Math Engine, finalized with legal text via Dev.\_Text Modular.
8. **Reports & Archiving:** PDF generation via WordPress endpoint. Stored in OneDrive with JSON traceability in Helper/meta.

### 3.3 Parallel & Conditional Flows

* **Parallel:** Picture Upload, Parts Search, and Levi Integration can run alongside Expertise.
* **Conditional:** Estimate Report is optional; Final Report type selection determines which legal blocks load.

### 3.4 Event-Driven Updates & Session Logic

* Each confirmation/save pushes flat JSON to Helper Table.
* Auto-save on logout, session timeout after 15 mins.
* UI prompts manual confirmation where needed.

### 3.5 Module Access & UI Flexibility

* All modules available post-login.
* If launched standalone, users are prompted to enter required case fields.
* Floating screens allow image preview, data sync checks, and report downloads.

### 3.6 Automation & Intelligence

* **Math Engine:** Calculates depreciation, damage %, and overrides.
* **Dev.\_Text Modular:** Injects legal blocks dynamically by Final Report type.
* **GPT Agents:** Used in Parts Search, metadata population, and field enrichment.

### 3.7 Summary Diagram (Textual Format)

```
[User Login] → [Expertise] → [Draft] → [Estimate (optional)] → [Invoices] → [Final Report(s)]
                                      ↘                                    ↘
                           [Picture Upload / Parts / Levi]       [Legal Text + PDF + Archive]
```

**Chapter 4: Ecosystem & Platform Integration**

---

### 4.1 Overview

The system is architected as a **modular, event-driven ecosystem** composed of cloud services, embedded automation logic, UI modules, and AI-powered components. It guarantees continuity, traceability, and compliance across all processes.

Each platform plays a distinct role in enabling the flow, transformation, and persistence of data.

### 4.2 Core Components

| Component                    | Role                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| **Make.com**                 | Central automation engine handling webhooks, OCR, calculations, data routing, PDF generation.      |
| **Cloudinary**               | Handles image uploads, watermarking, optimization, and tagging.                                    |
| **OneDrive**                 | Main storage layer; houses all structured folders: reports, images, metadata, invoices.            |
| **Google Drive**             | Temporary staging area for Excel/OneDrive limitations; supports live sessions.                     |
| **Netlify**                  | Hosts all HTML/React-based frontends, forms, login UIs, and floating screen interfaces.            |
| **WordPress API**            | Hosts PDF rendering endpoints. Accepts both HTML and structured JSON payloads.                     |
| **OneSignal**                | Push notification platform integrated via Make. Alerts on report readiness, invoice received, etc. |
| **GPT Agents**               | Powers smart part search, metadata enrichment, and prompt-based automation.                        |
| **Check-Car / Levi Yitzhak** | Used for car data scraping and market valuation; accessible via in-system browser.                 |
| **Dev.\_Text Modular**       | Legal text vault. Injects final legal blocks into report PDFs based on report type.                |
| **Math Engine**              | Performs damage percentage, depreciation, and financial logic for Final Reports.                   |

### 4.3 Folder & Data Structure (OneDrive)

```
/cases/
  └─ [PLATE]/
       ├─ reports/
       ├─ invoices/
       ├─ pictures/
       ├─ parts/
       ├─ meta/
       │    ├─ helper.json
       │    ├─ meta.txt
       │    └─ [snapshots]
       ├─ correspondence/
       └─ logs/
```

* **Reports:** Final PDFs with matching JSON sources
* **Meta:** Aggregated, flat JSON + human-readable text for restoration/search
* **Invoices:** Original + OCR parsed outputs
* **Pictures:** Original + Cloudinary-tagged files

### 4.4 Automation & Sync Logic

* All module events (submit, confirm, logout) trigger a webhook to Make.com.
* All data is sent as flat JSON — never nested.
* Metadata and helper tables are synced and versioned.
* Post-session: metadata is reloaded automatically on case recall.

### 4.5 Report Data Aggregation Logic

* **Priority Order:**

  1. **Invoices** (most authoritative)
  2. **Estimate Report** (if present)
  3. **Draft Report**
* The system automatically cascades values: e.g., if invoice costs exist, they override Estimate values.

### 4.6 Legal Report Assembly

* **Dev.\_Text Modular** injects dynamic legal texts per Final Report type:

  * *Private*: For contracts where the **owner hired the assessor directly**, outside insurance.
  * *Global Opinion*: A **global evaluation of all damages**, not damage-by-damage.
  * *Total Loss*: For cases where damage exceeds 60% and dismantling is required.
  * *Sale in Damaged State*: For vehicles sold while still damaged.

* WordPress PDF endpoint renders final outputs with watermark, branding, and metadata linkage.

### 4.7 UI Platform Behavior (via Netlify)

* Responsive, modular UI hosted on Netlify
* Each module (Expertise, Picture Upload, Levi, Parts, Invoice, Search, Admin) accessible directly post-login
* Floating screens provide:

  * Search results
  * Image previews
  * PDF downloads
  * Legal injection previews

### 4.8 Session Continuity & Audit

* Session auto-logout after 15 mins (warn at 13 mins)
* All data is flushed to Helper/meta on exit
* Admin/back door access maintains logs for all system, webhook, and legal text edits

---

**Chapter 5: Module-Level Operations & Interconnections**

---

### 5.1 Expertise Module

This is the entry point for most new cases. It allows structured capture of the vehicle condition, car data, damage areas, and preliminary comments.

* **Inputs:**

  * Plate number (mandatory)
  * Owner name (mandatory)
  * Car scraping data (Check-Car, Levi Yitzhak)
  * Damage entries (can be grouped or single-line)
  * Optional image tagging and parts hints
* **Features:**

  * Floating screen support for scraped data
  * GPT tag suggestions for damage names
  * Trigger: auto-creates `helper.json` + folder structure

---

### 5.2 Picture Upload Module

* **Trigger:** May be initiated at any point (parallel)
* **Flow:**

  * User uploads images (from mobile or desktop)
  * Cloudinary resizes, optimizes, and adds watermark + overlay (logo, date, plate)
  * AI recognition tags image (e.g., “left back door, scratched”)
  * Final images stored in `pictures/`
* **Outputs:** Cleaned images + metadata added to `helper.json`

---

### 5.3 Draft Report Module

* Auto-generated after Expertise submission
* Live-editable with section-by-section manual override
* Base layer for Estimate and Final Reports
* Stores versioned snapshots for backtracking

---

### 5.4 Estimate Report Module (Optional)

* Editable projection of repair costs
* Used in **pre-invoice scenarios**, especially in court/insurance disputes
* Feeds values into Final Report unless **Invoice** overrides
* Legal disclaimer auto-added for non-binding nature
* Flagged clearly in UI as “projection only”

---

### 5.5 Invoice Processing Module

* OCR-based invoice parser (PDF or image)
* Extracts vendor name, parts, cost, VAT
* Cross-matches line items with damage groups
* Overrides Estimate Report values if valid invoice is received
* All data filed in `invoices/`, synced to Helper

---

### 5.6 Parts Search Module

* User may search for part name via:

  * Manual input (Hebrew keywords)
  * GPT-based recommendation engine
  * Image-based recognition
* Each match links to parts catalog (e.g., ilcats.ru)
* Stores linked part results in `parts/`

---

### 5.7 Levi Yitzhak Valuation Module

* Embedded browser window with credentials (auto-login)
* Plate number used to fetch:

  * Market value
  * Insurance value
  * Trim/spec summary
* Synced to `meta.txt` and shown in Final Report

---

### 5.8 Final Report Module (4 Types)

* Triggered after Draft → Estimate (optional) → Invoice (optional)
* Four types selectable from UI:

  * **Private**: For cases where assessor is hired directly
  * **Global Opinion**: A holistic estimate (not damage-by-damage)
  * **Total Loss**: >60% damage, car to be dismantled
  * **Sale in Damaged State**: For resale of unrepaired vehicle
* Injects relevant legal blocks via Dev.\_Text Modular
* Pulls all case data from `helper.json` and `meta.txt`
* Final output = Branded PDF + traceable JSON

---

### 5.9 Admin & Back-Door Access

* For system admins and developers only
* Manage:

  * Legal text versions (Dev.\_Text Modular)
  * Folder permissions
  * Module enable/disable states
  * Fallback templates and PDF engines
  * Audit logs and snapshots

---

### 5.10 Interconnection Logic Summary

| Module       | Feeds Into                        | Trigger Condition           |
| ------------ | --------------------------------- | --------------------------- |
| Expertise    | Draft Report, Metadata            | Manual or On-submit         |
| Draft Report | Estimate / Final                  | Auto-after Expertise        |
| Estimate     | Final Report                      | Optional                    |
| Invoice      | Final Report (overrides Estimate) | OCR complete + Valid format |
| Pictures     | Final Report visuals              | On upload                   |
| Parts Search | Final Report (if tagged)          | On match                    |
| Levi         | Final Report / Admin View         | Manual                      |

---

**Chapter 5: Module-Level Operations & Interconnections**

---

### 5.1 Expertise Module

This is the entry point for most new cases. It allows structured capture of the vehicle condition, car data, damage areas, and preliminary comments.

* **Inputs:**

  * Plate number (mandatory)
  * Owner name (mandatory)
  * Car scraping data (Check-Car, Levi Yitzhak)
  * Damage entries (can be grouped or single-line)
  * Optional image tagging and parts hints
* **Features:**

  * Floating screen support for scraped data
  * GPT tag suggestions for damage names
  * Trigger: auto-creates `helper.json` + folder structure

---

### 5.2 Picture Upload Module

* **Trigger:** May be initiated at any point (parallel)
* **Flow:**

  * User uploads images (from mobile or desktop)
  * Cloudinary resizes, optimizes, and adds watermark + overlay (logo, date, plate)
  * AI recognition tags image (e.g., “left back door, scratched”)
  * Final images stored in `pictures/`
* **Outputs:** Cleaned images + metadata added to `helper.json`

---

### 5.3 Draft Report Module

* Auto-generated after Expertise submission
* Live-editable with section-by-section manual override
* Base layer for Estimate and Final Reports
* Stores versioned snapshots for backtracking

---

### 5.4 Estimate Report Module (Optional)

* Editable projection of repair costs
* Used in **pre-invoice scenarios**, especially in court/insurance disputes
* Feeds values into Final Report unless **Invoice** overrides
* Legal disclaimer auto-added for non-binding nature
* Flagged clearly in UI as “projection only”

---

### 5.5 Invoice Processing Module

* OCR-based invoice parser (PDF or image)
* Extracts vendor name, parts, cost, VAT
* Cross-matches line items with damage groups
* Overrides Estimate Report values if valid invoice is received
* All data filed in `invoices/`, synced to Helper

---

### 5.6 Parts Search Module

* User may search for part name via:

  * Manual input (Hebrew keywords)
  * GPT-based recommendation engine
  * Image-based recognition
* Each match links to parts catalog (e.g., ilcats.ru)
* Stores linked part results in `parts/`

---

### 5.7 Levi Yitzhak Valuation Module

* Embedded browser window with credentials (auto-login)
* Plate number used to fetch:

  * Market value
  * Insurance value
  * Trim/spec summary
* Synced to `meta.txt` and shown in Final Report

---

### 5.8 Final Report Module (4 Types)

* Triggered after Draft → Estimate (optional) → Invoice (optional)
* Four types selectable from UI:

  * **Private**: For cases where assessor is hired directly
  * **Global Opinion**: A holistic estimate (not damage-by-damage)
  * **Total Loss**: >60% damage, car to be dismantled
  * **Sale in Damaged State**: For resale of unrepaired vehicle
* Injects relevant legal blocks via Dev.\_Text Modular
* Pulls all case data from `helper.json` and `meta.txt`
* Final output = Branded PDF + traceable JSON

---

### 5.9 Admin & Back-Door Access

* For system admins and developers only
* Manage:

  * Legal text versions (Dev.\_Text Modular)
  * Folder permissions
  * Module enable/disable states
  * Fallback templates and PDF engines
  * Audit logs and snapshots

---

### 5.10 Interconnection Logic Summary

| Module       | Feeds Into                        | Trigger Condition           |
| ------------ | --------------------------------- | --------------------------- |
| Expertise    | Draft Report, Metadata            | Manual or On-submit         |
| Draft Report | Estimate / Final                  | Auto-after Expertise        |
| Estimate     | Final Report                      | Optional                    |
| Invoice      | Final Report (overrides Estimate) | OCR complete + Valid format |
| Pictures     | Final Report visuals              | On upload                   |
| Parts Search | Final Report (if tagged)          | On match                    |
| Levi         | Final Report / Admin View         | Manual                      |

---

**Chapter 6: Folder Logic & Data Structures**

---

### 6.1 Master Folder Tree (OneDrive - Central Repository)

```
/Open Cases/
  └─ [plate]_[owner]/
       ├─ reports/
       ├─ invoices/
       ├─ pictures/
       ├─ parts/
       ├─ meta/
       │    ├─ helper.json
       │    ├─ meta.txt
       │    └─ [snapshots]
       ├─ correspondence/
       └─ logs/
```

---

### 6.2 Folder Purposes

| Folder            | Purpose                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `reports/`        | Stores all generated PDFs (Draft, Estimate, Final variants)          |
| `invoices/`       | Holds original invoices and OCR-extracted data                       |
| `pictures/`       | Holds original and processed Cloudinary images                       |
| `parts/`          | Houses linked part queries and AI-tagged items                       |
| `meta/`           | Technical memory for the case: helper.json, parsed meta.txt, backups |
| `correspondence/` | Communication copies, notices, push messages (if filed)              |
| `logs/`           | Developer logs, webhook records, admin operations                    |

---

### 6.3 Metadata Files

* **helper.json** – Primary flat memory unit for the case.

  * Includes: plate, owner, damage breakdown, image tags, valuation, OCR, part list
  * Updated incrementally from all modules

* **meta.txt** – Human-readable flattened summary for quick lookup and admin use

  * Pulled directly into reports and interface previews

* **Snapshots/** – Timestamped folders storing backups of helper.json and final reports after each major action (e.g., report generation, invoice override)

---

### 6.4 Alternate Zones (Lifecycle States)

Once case status changes, folders are moved out of `/Open Cases/` and into one of:

* `/Waiting for Payment/`
* `/Waiting for Invoice/`
* `/Lawsuits/`
* `/Closed Cases/`

Each of these zones has the **same internal structure** as the original case folder. All modules respect relative paths.

---

### 6.5 Naming Convention

Each folder is named using:
`[plate]_[owner name]` (spaces replaced with `_`, Hebrew accepted)

This format is used across:

* File names
* PDF names
* Case search logic
* Folder paths in Make

---

**Chapter 5: Module-Level Operations & Interconnections**

---

### 5.1 Expertise Module

This is the entry point for most new cases. It allows structured capture of the vehicle condition, car data, damage areas, and preliminary comments.

* **Inputs:**

  * Plate number (mandatory)
  * Owner name (mandatory)
  * Car scraping data (Check-Car, Levi Yitzhak)
  * Damage entries (can be grouped or single-line)
  * Optional image tagging and parts hints
* **Features:**

  * Floating screen support for scraped data
  * GPT tag suggestions for damage names
  * Trigger: auto-creates `helper.json` + folder structure

---

### 5.2 Picture Upload Module

* **Trigger:** May be initiated at any point (parallel)
* **Flow:**

  * User uploads images (from mobile or desktop)
  * Cloudinary resizes, optimizes, and adds watermark + overlay (logo, date, plate)
  * AI recognition tags image (e.g., “left back door, scratched”)
  * Final images stored in `pictures/`
* **Outputs:** Cleaned images + metadata added to `helper.json`

---

### 5.3 Draft Report Module

* Auto-generated after Expertise submission
* Live-editable with section-by-section manual override
* Base layer for Estimate and Final Reports
* Stores versioned snapshots for backtracking

---

### 5.4 Estimate Report Module (Optional)

* Editable projection of repair costs
* Used in **pre-invoice scenarios**, especially in court/insurance disputes
* Feeds values into Final Report unless **Invoice** overrides
* Legal disclaimer auto-added for non-binding nature
* Flagged clearly in UI as “projection only”

---

### 5.5 Invoice Processing Module

* OCR-based invoice parser (PDF or image)
* Extracts vendor name, parts, cost, VAT
* Cross-matches line items with damage groups
* Overrides Estimate Report values if valid invoice is received
* All data filed in `invoices/`, synced to Helper

---

### 5.6 Parts Search Module

* User may search for part name via:

  * Manual input (Hebrew keywords)
  * GPT-based recommendation engine
  * Image-based recognition
* Each match links to parts catalog (e.g., ilcats.ru)
* Stores linked part results in `parts/`

---

### 5.7 Levi Yitzhak Valuation Module

* Embedded browser window with credentials (auto-login)
* Plate number used to fetch:

  * Market value
  * Insurance value
  * Trim/spec summary
* Synced to `meta.txt` and shown in Final Report

---

### 5.8 Final Report Module (4 Types)

* Triggered after Draft → Estimate (optional) → Invoice (optional)
* Four types selectable from UI:

  * **Private**: For cases where assessor is hired directly
  * **Global Opinion**: A holistic estimate (not damage-by-damage)
  * **Total Loss**: >60% damage, car to be dismantled
  * **Sale in Damaged State**: For resale of unrepaired vehicle
* Injects relevant legal blocks via Dev.\_Text Modular
* Pulls all case data from `helper.json` and `meta.txt`
* Final output = Branded PDF + traceable JSON

---

### 5.9 Admin & Back-Door Access

* For system admins and developers only
* Manage:

  * Legal text versions (Dev.\_Text Modular)
  * Folder permissions
  * Module enable/disable states
  * Fallback templates and PDF engines
  * Audit logs and snapshots

---

### 5.10 Interconnection Logic Summary

| Module       | Feeds Into                        | Trigger Condition           |
| ------------ | --------------------------------- | --------------------------- |
| Expertise    | Draft Report, Metadata            | Manual or On-submit         |
| Draft Report | Estimate / Final                  | Auto-after Expertise        |
| Estimate     | Final Report                      | Optional                    |
| Invoice      | Final Report (overrides Estimate) | OCR complete + Valid format |
| Pictures     | Final Report visuals              | On upload                   |
| Parts Search | Final Report (if tagged)          | On match                    |
| Levi         | Final Report / Admin View         | Manual                      |

---

**Chapter 6: Folder Logic & Data Structures**

---

### 6.1 Master Folder Tree (OneDrive - Central Repository)

```
/Open Cases/
  └─ [plate]_[owner]/
       ├─ reports/
       ├─ invoices/
       ├─ pictures/
       ├─ parts/
       ├─ meta/
       │    ├─ helper.json
       │    ├─ meta.txt
       │    └─ [snapshots]
       ├─ correspondence/
       └─ logs/
```

---

### 6.2 Folder Purposes

| Folder            | Purpose                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `reports/`        | Stores all generated PDFs (Draft, Estimate, Final variants)          |
| `invoices/`       | Holds original invoices and OCR-extracted data                       |
| `pictures/`       | Holds original and processed Cloudinary images                       |
| `parts/`          | Houses linked part queries and AI-tagged items                       |
| `meta/`           | Technical memory for the case: helper.json, parsed meta.txt, backups |
| `correspondence/` | Communication copies, notices, push messages (if filed)              |
| `logs/`           | Developer logs, webhook records, admin operations                    |

---

### 6.3 Metadata Files

* **helper.json** – Primary flat memory unit for the case.

  * Includes: plate, owner, damage breakdown, image tags, valuation, OCR, part list
  * Updated incrementally from all modules

* **meta.txt** – Human-readable flattened summary for quick lookup and admin use

  * Pulled directly into reports and interface previews

* **Snapshots/** – Timestamped folders storing backups of helper.json and final reports after each major action (e.g., report generation, invoice override)

---

### 6.4 Alternate Zones (Lifecycle States)

Once case status changes, folders are moved out of `/Open Cases/` and into one of:

* `/Waiting for Payment/`
* `/Waiting for Invoice/`
* `/Lawsuits/`
* `/Closed Cases/`

Each of these zones has the **same internal structure** as the original case folder. All modules respect relative paths.

---

### 6.5 Naming Convention

Each folder is named using:
`[plate]_[owner name]` (spaces replaced with `_`, Hebrew accepted)

This format is used across:

* File names
* PDF names
* Case search logic
* Folder paths in Make

---

**Chapter 7: Report Generation Mechanics**

---

### 7.1 Document Generation Types

| Type                          | Description                                                          |
| ----------------------------- | -------------------------------------------------------------------- |
| **Draft Report**              | First editable version; free text mixed with structured logic        |
| **Estimate Report**           | Optional; contains projected repair cost and breakdown per damage    |
| **Final Report (Private)**    | Legal-grade report for private contracts without insurer involvement |
| **Final Report (Global)**     | Global estimate of the total damage without breakdowns               |
| **Final Report (Total Loss)** | Indicates dismantling; damages exceed legal value threshold          |
| **Final Report (Sale)**       | For reselling damaged vehicle as-is                                  |

All reports are stored in `reports/` with a matching filename structure:
`[plate]_[report_type]_[YYYYMMDD].pdf`

---

### 7.2 Trigger Conditions

| Trigger Source          | Report Type                | Required Conditions                                 |
| ----------------------- | -------------------------- | --------------------------------------------------- |
| On Expertise Submit     | Draft                      | Auto-created                                        |
| Manual Click (UI)       | Estimate                   | Draft must exist                                    |
| Invoice Upload (OCR OK) | Final (Overrides Estimate) | Invoice complete and matches structure              |
| Manual Select           | Final (All types)          | Draft complete, Estimate optional, Invoice optional |

---

### 7.3 Composition Engine

* **Inputs**:

  * `helper.json`
  * `meta.txt`
  * Dev.\_Text Modular legal paragraphs
  * User overrides and inserted free text blocks

* **Output Format**:

  * PDF (branded with logo, footer, contact info)
  * HTML (for preview mode)
  * Traceable JSON backup with timestamp

* **Dev.\_Text Modular**:

  * Detects report type and inserts corresponding legal language
  * Injects disclaimers (e.g., for Estimate)
  * Supports version control of paragraphs per legal update

---

### 7.4 Customization & Override

* Free-text blocks can override:

  * Introduction
  * Damage logic
  * Assessor’s conclusion
  * Final valuation summary

* Final Report UI allows toggling between predefined logic and manual override

---

### 7.5 Generation History & Snapshots

Each time a report is generated:

* A snapshot of `helper.json`, `meta.txt`, and the generated PDF is stored
* Metadata includes who triggered it, when, and why
* Enables rollbacks and reissues

---

**Chapter 5: Module-Level Operations & Interconnections**

---

### 5.1 Expertise Module

This is the entry point for most new cases. It allows structured capture of the vehicle condition, car data, damage areas, and preliminary comments.

* **Inputs:**

  * Plate number (mandatory)
  * Owner name (mandatory)
  * Car scraping data (Check-Car, Levi Yitzhak)
  * Damage entries (can be grouped or single-line)
  * Optional image tagging and parts hints
* **Features:**

  * Floating screen support for scraped data
  * GPT tag suggestions for damage names
  * Trigger: auto-creates `helper.json` + folder structure

---

### 5.2 Picture Upload Module

* **Trigger:** May be initiated at any point (parallel)
* **Flow:**

  * User uploads images (from mobile or desktop)
  * Cloudinary resizes, optimizes, and adds watermark + overlay (logo, date, plate)
  * AI recognition tags image (e.g., “left back door, scratched”)
  * Final images stored in `pictures/`
* **Outputs:** Cleaned images + metadata added to `helper.json`

---

### 5.3 Draft Report Module

* Auto-generated after Expertise submission
* Live-editable with section-by-section manual override
* Base layer for Estimate and Final Reports
* Stores versioned snapshots for backtracking

---

### 5.4 Estimate Report Module (Optional)

* Editable projection of repair costs
* Used in **pre-invoice scenarios**, especially in court/insurance disputes
* Feeds values into Final Report unless **Invoice** overrides
* Legal disclaimer auto-added for non-binding nature
* Flagged clearly in UI as “projection only”

---

### 5.5 Invoice Processing Module

* OCR-based invoice parser (PDF or image)
* Extracts vendor name, parts, cost, VAT
* Cross-matches line items with damage groups
* Overrides Estimate Report values if valid invoice is received
* All data filed in `invoices/`, synced to Helper

---

### 5.6 Parts Search Module

* User may search for part name via:

  * Manual input (Hebrew keywords)
  * GPT-based recommendation engine
  * Image-based recognition
* Each match links to parts catalog (e.g., ilcats.ru)
* Stores linked part results in `parts/`

---

### 5.7 Levi Yitzhak Valuation Module

* Embedded browser window with credentials (auto-login)
* Plate number used to fetch:

  * Market value
  * Insurance value
  * Trim/spec summary
* Synced to `meta.txt` and shown in Final Report

---

### 5.8 Final Report Module (4 Types)

* Triggered after Draft → Estimate (optional) → Invoice (optional)
* Four types selectable from UI:

  * **Private**: For cases where assessor is hired directly
  * **Global Opinion**: A holistic estimate (not damage-by-damage)
  * **Total Loss**: >60% damage, car to be dismantled
  * **Sale in Damaged State**: For resale of unrepaired vehicle
* Injects relevant legal blocks via Dev.\_Text Modular
* Pulls all case data from `helper.json` and `meta.txt`
* Final output = Branded PDF + traceable JSON

---

### 5.9 Admin & Back-Door Access

* For system admins and developers only
* Manage:

  * Legal text versions (Dev.\_Text Modular)
  * Folder permissions
  * Module enable/disable states
  * Fallback templates and PDF engines
  * Audit logs and snapshots

---

### 5.10 Interconnection Logic Summary

| Module       | Feeds Into                        | Trigger Condition           |
| ------------ | --------------------------------- | --------------------------- |
| Expertise    | Draft Report, Metadata            | Manual or On-submit         |
| Draft Report | Estimate / Final                  | Auto-after Expertise        |
| Estimate     | Final Report                      | Optional                    |
| Invoice      | Final Report (overrides Estimate) | OCR complete + Valid format |
| Pictures     | Final Report visuals              | On upload                   |
| Parts Search | Final Report (if tagged)          | On match                    |
| Levi         | Final Report / Admin View         | Manual                      |

---

**Chapter 6: Folder Logic & Data Structures**

---

### 6.1 Master Folder Tree (OneDrive - Central Repository)

```
/Open Cases/
  └─ [plate]_[owner]/
       ├─ reports/
       ├─ invoices/
       ├─ pictures/
       ├─ parts/
       ├─ meta/
       │    ├─ helper.json
       │    ├─ meta.txt
       │    └─ [snapshots]
       ├─ correspondence/
       └─ logs/
```

---

### 6.2 Folder Purposes

| Folder            | Purpose                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `reports/`        | Stores all generated PDFs (Draft, Estimate, Final variants)          |
| `invoices/`       | Holds original invoices and OCR-extracted data                       |
| `pictures/`       | Holds original and processed Cloudinary images                       |
| `parts/`          | Houses linked part queries and AI-tagged items                       |
| `meta/`           | Technical memory for the case: helper.json, parsed meta.txt, backups |
| `correspondence/` | Communication copies, notices, push messages (if filed)              |
| `logs/`           | Developer logs, webhook records, admin operations                    |

---

### 6.3 Metadata Files

* **helper.json** – Primary flat memory unit for the case.

  * Includes: plate, owner, damage breakdown, image tags, valuation, OCR, part list
  * Updated incrementally from all modules

* **meta.txt** – Human-readable flattened summary for quick lookup and admin use

  * Pulled directly into reports and interface previews

* **Snapshots/** – Timestamped folders storing backups of helper.json and final reports after each major action (e.g., report generation, invoice override)

---

### 6.4 Alternate Zones (Lifecycle States)

Once case status changes, folders are moved out of `/Open Cases/` and into one of:

* `/Waiting for Payment/`
* `/Waiting for Invoice/`
* `/Lawsuits/`
* `/Closed Cases/`

Each of these zones has the **same internal structure** as the original case folder. All modules respect relative paths.

---

### 6.5 Naming Convention

Each folder is named using:
`[plate]_[owner name]` (spaces replaced with `_`, Hebrew accepted)

This format is used across:

* File names
* PDF names
* Case search logic
* Folder paths in Make

---

**Chapter 7: Report Generation Mechanics**

---

### 7.1 Document Generation Types

| Type                          | Description                                                          |
| ----------------------------- | -------------------------------------------------------------------- |
| **Draft Report**              | First editable version; free text mixed with structured logic        |
| **Estimate Report**           | Optional; contains projected repair cost and breakdown per damage    |
| **Final Report (Private)**    | Legal-grade report for private contracts without insurer involvement |
| **Final Report (Global)**     | Global estimate of the total damage without breakdowns               |
| **Final Report (Total Loss)** | Indicates dismantling; damages exceed legal value threshold          |
| **Final Report (Sale)**       | For reselling damaged vehicle as-is                                  |

All reports are stored in `reports/` with a matching filename structure:
`[plate]_[report_type]_[YYYYMMDD].pdf`

---

### 7.2 Trigger Conditions

| Trigger Source          | Report Type                | Required Conditions                                 |
| ----------------------- | -------------------------- | --------------------------------------------------- |
| On Expertise Submit     | Draft                      | Auto-created                                        |
| Manual Click (UI)       | Estimate                   | Draft must exist                                    |
| Invoice Upload (OCR OK) | Final (Overrides Estimate) | Invoice complete and matches structure              |
| Manual Select           | Final (All types)          | Draft complete, Estimate optional, Invoice optional |

---

### 7.3 Composition Engine

* **Inputs**:

  * `helper.json`
  * `meta.txt`
  * Dev.\_Text Modular legal paragraphs
  * User overrides and inserted free text blocks

* **Output Format**:

  * PDF (branded with logo, footer, contact info)
  * HTML (for preview mode)
  * Traceable JSON backup with timestamp

* **Dev.\_Text Modular**:

  * Detects report type and inserts corresponding legal language
  * Injects disclaimers (e.g., for Estimate)
  * Supports version control of paragraphs per legal update

---

### 7.4 Customization & Override

* Free-text blocks can override:

  * Introduction
  * Damage logic
  * Assessor’s conclusion
  * Final valuation summary

* Final Report UI allows toggling between predefined logic and manual override

---

### 7.5 Generation History & Snapshots

Each time a report is generated:

* A snapshot of `helper.json`, `meta.txt`, and the generated PDF is stored
* Metadata includes who triggered it, when, and why
* Enables rollbacks and reissues

---

**Chapter 8: Legal Text Engine (Dev.\_Text Modular)**

---

### 8.1 Purpose

Dev.\_Text Modular governs the insertion of legal, declarative, or disclaimer text blocks dynamically into any report or document generated in the system. This is the primary source of legal integrity and formatting consistency across all Final Report variants.

---

### 8.2 Block Library Structure

Each legal block is stored as a modular paragraph inside a version-controlled repository. The blocks are tagged by:

* **Report Type** (e.g., Private, Global, Total Loss, Sale)
* **Section** (e.g., Intro, Methodology, Disclaimer, Conclusion)
* **Version** (auto-tracked; older versions kept for rollback)

Each block has:

* Internal ID (stable across versions)
* Hebrew and English content (bilingual where needed)
* Trigger logic: If/When to insert
* Overridable status: Locked or free-text-replaceable

---

### 8.3 Injection Logic

During report generation, the system:

1. Detects selected report type
2. Pulls all relevant legal blocks from Dev.\_Text Modular
3. Renders them in correct order inside the PDF
4. Applies version/date stamp in metadata

Manual override is allowed only for blocks tagged as ‘override=true’.

---

### 8.4 Legal Maintenance & Audit

Admins (via backdoor module):

* Add new block versions
* Retire obsolete blocks
* Translate or sync bilingual pairs
* Assign usage context (Estimate, Final Private, etc.)

Every change is logged with:

* Editor identity
* Timestamp
* Reason for change (optional)
* Immediate sync to report logic (next generation reflects new block set)

---

### 8.5 Special Disclaimers & Annotations

Some reports (e.g., Estimate Report) always insert:

* Non-binding disclaimer
* Clarification of valuation basis

Other examples:

* Final (Total Loss): Includes regulation-based threshold statement
* Final (Global): Mentions abstraction from part-by-part assessment

---

### 8.6 Sample Block Schema

```json
{
  "id": "intro_final_private",
  "version": 3,
  "hebrew": "...",
  "english": "...",
  "report_types": ["Final_Private"],
  "section": "Intro",
  "override": true
}
```

---

**Chapter 5: Module-Level Operations & Interconnections**

---

### 5.1 Expertise Module

This is the entry point for most new cases. It allows structured capture of the vehicle condition, car data, damage areas, and preliminary comments.

* **Inputs:**

  * Plate number (mandatory)
  * Owner name (mandatory)
  * Car scraping data (Check-Car, Levi Yitzhak)
  * Damage entries (can be grouped or single-line)
  * Optional image tagging and parts hints
* **Features:**

  * Floating screen support for scraped data
  * GPT tag suggestions for damage names
  * Trigger: auto-creates `helper.json` + folder structure

---

### 5.2 Picture Upload Module

* **Trigger:** May be initiated at any point (parallel)
* **Flow:**

  * User uploads images (from mobile or desktop)
  * Cloudinary resizes, optimizes, and adds watermark + overlay (logo, date, plate)
  * AI recognition tags image (e.g., “left back door, scratched”)
  * Final images stored in `pictures/`
* **Outputs:** Cleaned images + metadata added to `helper.json`

---

### 5.3 Draft Report Module

* Auto-generated after Expertise submission
* Live-editable with section-by-section manual override
* Base layer for Estimate and Final Reports
* Stores versioned snapshots for backtracking

---

### 5.4 Estimate Report Module (Optional)

* Editable projection of repair costs
* Used in **pre-invoice scenarios**, especially in court/insurance disputes
* Feeds values into Final Report unless **Invoice** overrides
* Legal disclaimer auto-added for non-binding nature
* Flagged clearly in UI as “projection only”

---

### 5.5 Invoice Processing Module

* OCR-based invoice parser (PDF or image)
* Extracts vendor name, parts, cost, VAT
* Cross-matches line items with damage groups
* Overrides Estimate Report values if valid invoice is received
* All data filed in `invoices/`, synced to Helper

---

### 5.6 Parts Search Module

* User may search for part name via:

  * Manual input (Hebrew keywords)
  * GPT-based recommendation engine
  * Image-based recognition
* Each match links to parts catalog (e.g., ilcats.ru)
* Stores linked part results in `parts/`

---

### 5.7 Levi Yitzhak Valuation Module

* Embedded browser window with credentials (auto-login)
* Plate number used to fetch:

  * Market value
  * Insurance value
  * Trim/spec summary
* Synced to `meta.txt` and shown in Final Report

---

### 5.8 Final Report Module (4 Types)

* Triggered after Draft → Estimate (optional) → Invoice (optional)
* Four types selectable from UI:

  * **Private**: For cases where assessor is hired directly
  * **Global Opinion**: A holistic estimate (not damage-by-damage)
  * **Total Loss**: >60% damage, car to be dismantled
  * **Sale in Damaged State**: For resale of unrepaired vehicle
* Injects relevant legal blocks via Dev.\_Text Modular
* Pulls all case data from `helper.json` and `meta.txt`
* Final output = Branded PDF + traceable JSON

---

### 5.9 Admin & Back-Door Access

* For system admins and developers only
* Manage:

  * Legal text versions (Dev.\_Text Modular)
  * Folder permissions
  * Module enable/disable states
  * Fallback templates and PDF engines
  * Audit logs and snapshots

---

### 5.10 Interconnection Logic Summary

| Module       | Feeds Into                        | Trigger Condition           |
| ------------ | --------------------------------- | --------------------------- |
| Expertise    | Draft Report, Metadata            | Manual or On-submit         |
| Draft Report | Estimate / Final                  | Auto-after Expertise        |
| Estimate     | Final Report                      | Optional                    |
| Invoice      | Final Report (overrides Estimate) | OCR complete + Valid format |
| Pictures     | Final Report visuals              | On upload                   |
| Parts Search | Final Report (if tagged)          | On match                    |
| Levi         | Final Report / Admin View         | Manual                      |

---

**Chapter 6: Folder Logic & Data Structures**

---

### 6.1 Master Folder Tree (OneDrive - Central Repository)

```
/Open Cases/
  └─ [plate]_[owner]/
       ├─ reports/
       ├─ invoices/
       ├─ pictures/
       ├─ parts/
       ├─ meta/
       │    ├─ helper.json
       │    ├─ meta.txt
       │    └─ [snapshots]
       ├─ correspondence/
       └─ logs/
```

---

### 6.2 Folder Purposes

| Folder            | Purpose                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `reports/`        | Stores all generated PDFs (Draft, Estimate, Final variants)          |
| `invoices/`       | Holds original invoices and OCR-extracted data                       |
| `pictures/`       | Holds original and processed Cloudinary images                       |
| `parts/`          | Houses linked part queries and AI-tagged items                       |
| `meta/`           | Technical memory for the case: helper.json, parsed meta.txt, backups |
| `correspondence/` | Communication copies, notices, push messages (if filed)              |
| `logs/`           | Developer logs, webhook records, admin operations                    |

---

### 6.3 Metadata Files

* **helper.json** – Primary flat memory unit for the case.

  * Includes: plate, owner, damage breakdown, image tags, valuation, OCR, part list
  * Updated incrementally from all modules

* **meta.txt** – Human-readable flattened summary for quick lookup and admin use

  * Pulled directly into reports and interface previews

* **Snapshots/** – Timestamped folders storing backups of helper.json and final reports after each major action (e.g., report generation, invoice override)

---

### 6.4 Alternate Zones (Lifecycle States)

Once case status changes, folders are moved out of `/Open Cases/` and into one of:

* `/Waiting for Payment/`
* `/Waiting for Invoice/`
* `/Lawsuits/`
* `/Closed Cases/`

Each of these zones has the **same internal structure** as the original case folder. All modules respect relative paths.

---

### 6.5 Naming Convention

Each folder is named using:
`[plate]_[owner name]` (spaces replaced with `_`, Hebrew accepted)

This format is used across:

* File names
* PDF names
* Case search logic
* Folder paths in Make

---

**Chapter 7: Report Generation Mechanics**

---

### 7.1 Document Generation Types

| Type                          | Description                                                          |
| ----------------------------- | -------------------------------------------------------------------- |
| **Draft Report**              | First editable version; free text mixed with structured logic        |
| **Estimate Report**           | Optional; contains projected repair cost and breakdown per damage    |
| **Final Report (Private)**    | Legal-grade report for private contracts without insurer involvement |
| **Final Report (Global)**     | Global estimate of the total damage without breakdowns               |
| **Final Report (Total Loss)** | Indicates dismantling; damages exceed legal value threshold          |
| **Final Report (Sale)**       | For reselling damaged vehicle as-is                                  |

All reports are stored in `reports/` with a matching filename structure:
`[plate]_[report_type]_[YYYYMMDD].pdf`

---

### 7.2 Trigger Conditions

| Trigger Source          | Report Type                | Required Conditions                                 |
| ----------------------- | -------------------------- | --------------------------------------------------- |
| On Expertise Submit     | Draft                      | Auto-created                                        |
| Manual Click (UI)       | Estimate                   | Draft must exist                                    |
| Invoice Upload (OCR OK) | Final (Overrides Estimate) | Invoice complete and matches structure              |
| Manual Select           | Final (All types)          | Draft complete, Estimate optional, Invoice optional |

---

### 7.3 Composition Engine

* **Inputs**:

  * `helper.json`
  * `meta.txt`
  * Dev.\_Text Modular legal paragraphs
  * User overrides and inserted free text blocks

* **Output Format**:

  * PDF (branded with logo, footer, contact info)
  * HTML (for preview mode)
  * Traceable JSON backup with timestamp

* **Dev.\_Text Modular**:

  * Detects report type and inserts corresponding legal language
  * Injects disclaimers (e.g., for Estimate)
  * Supports version control of paragraphs per legal update

---

### 7.4 Customization & Override

* Free-text blocks can override:

  * Introduction
  * Damage logic
  * Assessor’s conclusion
  * Final valuation summary

* Final Report UI allows toggling between predefined logic and manual override

---

### 7.5 Generation History & Snapshots

Each time a report is generated:

* A snapshot of `helper.json`, `meta.txt`, and the generated PDF is stored
* Metadata includes who triggered it, when, and why
* Enables rollbacks and reissues

---

**Chapter 8: Legal Text Engine (Dev.\_Text Modular)**

---

### 8.1 Purpose

Dev.\_Text Modular governs the insertion of legal, declarative, or disclaimer text blocks dynamically into any report or document generated in the system. This is the primary source of legal integrity and formatting consistency across all Final Report variants.

---

### 8.2 Block Library Structure

Each legal block is stored as a modular paragraph inside a version-controlled repository. The blocks are tagged by:

* **Report Type** (e.g., Private, Global, Total Loss, Sale)
* **Section** (e.g., Intro, Methodology, Disclaimer, Conclusion)
* **Version** (auto-tracked; older versions kept for rollback)

Each block has:

* Internal ID (stable across versions)
* Hebrew and English content (bilingual where needed)
* Trigger logic: If/When to insert
* Overridable status: Locked or free-text-replaceable

---

### 8.3 Injection Logic

During report generation, the system:

1. Detects selected report type
2. Pulls all relevant legal blocks from Dev.\_Text Modular
3. Renders them in correct order inside the PDF
4. Applies version/date stamp in metadata

Manual override is allowed only for blocks tagged as ‘override=true’.

---

### 8.4 Legal Maintenance & Audit

Admins (via backdoor module):

* Add new block versions
* Retire obsolete blocks
* Translate or sync bilingual pairs
* Assign usage context (Estimate, Final Private, etc.)

Every change is logged with:

* Editor identity
* Timestamp
* Reason for change (optional)
* Immediate sync to report logic (next generation reflects new block set)

---

### 8.5 Special Disclaimers & Annotations

Some reports (e.g., Estimate Report) always insert:

* Non-binding disclaimer
* Clarification of valuation basis

Other examples:

* Final (Total Loss): Includes regulation-based threshold statement
* Final (Global): Mentions abstraction from part-by-part assessment

---

### 8.6 Sample Block Schema

```json
{
  "id": "intro_final_private",
  "version": 3,
  "hebrew": "...",
  "english": "...",
  "report_types": ["Final_Private"],
  "section": "Intro",
  "override": true
}
```

---

**Chapter 9: User Interface & Session Handling**

---

### 9.1 Core Interface Design

The system UI is optimized for mobile-first data collection but supports desktop workflows as well.

* Clean HTML/CSS forms deployed via Netlify
* Responsive layout adapts to camera input and touch
* Branded elements (logo, favicon, color schema)
* Floating screens used for scraped data, image tagging, or part hints

---

### 9.2 User Roles & Screen Types

| Role           | Screens Accessed                          | Permissions                     |
| -------------- | ----------------------------------------- | ------------------------------- |
| Field Assessor | Entry forms, camera access, upload module | Can submit, edit, and retry     |
| Admin          | All screens incl. backdoor, debug, audit  | Can override logic, inject data |
| Assistant      | Partial access to reports/forms           | Can fill but not finalize       |

Each screen loads with user-type logic. Credentials (email or password token) define access.

---

### 9.3 Session Memory Handling

| Field          | Memory Duration | Notes                                  |
| -------------- | --------------- | -------------------------------------- |
| Plate Number   | 5 minutes       | Retained between uploads               |
| Owner Name     | 5 minutes       | Used to route image → folder           |
| Password Token | 20 minutes      | UI refresh resets                      |
| Image Queue    | Until sent      | Cleared only when upload is successful |

Stored using localStorage/sessionStorage (JS). Not persisted server-side.

---

### 9.4 Retry & Recovery Logic

* If user uploads 20 images but only 12 succeed:

  * Failed images stay in preview window
  * Submit button remains visible until full success
* If password is rejected:

  * Screen shake + alert message
  * Does not refresh screen (avoids loss of session data)

---

### 9.5 UI Elements

* Logo fetched from Cloudinary or direct link
* Camera opens directly on mobile (via `<input type='file' capture>`)
* Submit button = active only when all validations pass
* Upload preview grid supports delete and image labels

---

### 9.6 Restricted Access Screens

* Image Optimizer, Estimate Trigger, and Admin Logs

  * Require hidden password gate (stored in Make or env)
  * Not listed in index.html or sitemap

---

### 9.7 Screen Types

| Page Name            | Purpose                                | Trigger                           |
| -------------------- | -------------------------------------- | --------------------------------- |
| index.html           | Password screen                        | Root of all flows                 |
| /upload.html         | Field image + data collection          | From password pass-through        |
| /report.html         | View latest generated reports          | Auto-generated link or admin call |
| /admin.html (hidden) | Manual override and fallback actions   | Not public                        |
| /transmit.html       | Form to finalize case and call webhook | Triggered by report submission    |

---

**Chapter 10: Automation & Scenario Logic**

---

### 10.1 Scenario Architecture (Make.com Based)

The automation logic is modular, event-driven, and centralized around Make.com scenarios, each bound to a webhook or trigger condition. Scenarios are built for clarity, recoverability, and inter-module signaling.

---

### 10.2 Main Scenario Types

| Scenario Name      | Trigger Source             | Description                                                      |
| ------------------ | -------------------------- | ---------------------------------------------------------------- |
| `create_case`      | Form webhook (plate form)  | Creates full folder tree, initializes `helper.json`, `meta.txt`  |
| `upload_images`    | Form webhook (upload)      | Receives images, sends to Cloudinary, gets tags, files to folder |
| `parse_invoice`    | File watcher (`invoices/`) | OCRs invoice, updates helper, flags cost override                |
| `generate_report`  | Manual click or webhook    | Runs composition engine (Estimate / Final types)                 |
| `send_report`      | Report ready or transmit   | Sends PDF by email, archives to folder, updates status           |
| `move_case_folder` | Status change (dropdown)   | Moves folder to new lifecycle zone                               |

---

### 10.3 Scenario Trigger Types

* **Webhook-based:** Form submissions, upload actions, transmit final report
* **File-based:** File added to OneDrive (invoice, photos)
* **Time-based:** Daily checkers for status reminders or overdue cases
* **Manual buttons:** Admin-only or system functions (backdoor injects, reset flows)

---

### 10.4 Cross-Scenario Communication

Each scenario writes to:

* `helper.json`
* `meta.txt`
* Logs folder

Data integrity is guaranteed by:

* Atomic overwrite or versioned backups
* Retry policy if HTTP calls fail
* Fail-safe backup writing to logs/

Downstream scenarios always re-read the latest `helper.json`, ensuring sync.

---

### 10.5 Manual Override Junctions

Some actions (e.g., Estimate → Final Report) can be bypassed:

* Admin can directly trigger `generate_report` on any report type
* System allows Final Report generation even if Estimate/Invoice are missing, but flags such cases visibly
* Manual value override is respected over automated ones

---

### 10.6 Notification & Alert Routing

All alerts pass through Make’s connection to either:

* Email (via Outlook / Gmail module)
* Push (via OneSignal, optional)
* Webhook (to another scenario or external service)

Examples:

* If image upload fails, a retry link is sent
* If invoice parsing is invalid, admin is notified
* On report generation, OneSignal ping is triggered

---

### 10.7 Scenario Logging

Each scenario logs:

* Time of execution
* Trigger type
* Outcome (Success / Retry / Failed)
* Critical actions (files written, webhook called)

Stored under `/logs/[scenario_name]_YYYYMMDD.txt`

---

### 10.8 Retry and Fallback

Each scenario includes Make error-handling paths:

* Try 3 times on failures (e.g. Cloudinary, OneDrive)
* If fails repeatedly, error logged + email sent
* Redundant webhooks available (e.g., retry\_upload, retry\_report)

---

**Chapter 11: Recognition & Intelligence Layers**

---

### 11.1 Overview

This layer leverages AI (OpenAI GPT, Vision APIs, and heuristic logic) to identify, label, and interpret uploaded images and extracted document text. It bridges visual and textual data into structured JSON outputs that feed the automation and reports.

---

### 11.2 Image Recognition

#### Purpose:

Identify car parts, damage types, and context from uploaded images.

#### Modules:

* **GPT-4o (via Make.com):**

  * Recognizes part (e.g., front bumper)
  * Identifies damage (e.g., cracked, dented)
  * Suggests label (`part_type_plateNumber.jpg`)

* **ImageKit or Cloudinary:**

  * Performs transformation
  * Adds watermark, date, plate, business name

#### Output:

```json
{
  "plate": "5785269",
  "part": "left rear door",
  "damage": "scratched",
  "date": "2025-06-01"
}
```

---

### 11.3 OCR & Text Parsing (Invoices, Levi Itzhak)

#### Sources:

* OCR from PDF invoices or scans
* Levi Itzhak valuation PDFs

#### Process:

* Upload to folder (triggers scenario)
* Image-to-text or PDF-to-text via OCR
* Structured parsing using RegEx and GPT

#### Key Outputs:

* Invoice number, garage, cost breakdown
* Vehicle valuation fields (type, reduction %, reason, total NIS)

---

### 11.4 Smart Labeling & Grouping

* GPT maps images into logical clusters:

  * Front, back, sides, interior
* Sorted in display grids
* Titles generated dynamically (based on detection, in Hebrew)

---

### 11.5 Helper Population

All structured recognition results feed into `helper.json`:

* Auto-filled part list with damage type
* Extracted invoice values → pricing fields
* Valuation table extracted to structured JSON

Overrides are possible if user inputs a manual correction.

---

### 11.6 Accuracy Controls & Redundancy

* Double-pass validation:

  * First pass: AI extract
  * Second pass: Rule-based confirmation (e.g., value range, expected parts)
* Manual edit available in helper sheet or admin module

---

### 11.7 AI Response Handling

Responses are:

* Trimmed and sanitized
* Converted to valid JSON
* Logged in `logs/gpt_response_[type]_YYYYMMDD.json`
* Mapped to Make variables and downstream logic

---

**Chapter 11: Recognition & Intelligence Layers**

---

### 11.1 Overview

This layer leverages AI (OpenAI GPT, Vision APIs, and heuristic logic) to identify, label, and interpret uploaded images and extracted document text. It bridges visual and textual data into structured JSON outputs that feed the automation and reports.

---

### 11.2 Image Recognition

#### Purpose:

Identify car parts, damage types, and context from uploaded images.

#### Modules:

* **GPT-4o (via Make.com):**

  * Recognizes part (e.g., front bumper)
  * Identifies damage (e.g., cracked, dented)
  * Suggests label (`part_type_plateNumber.jpg`)

* **ImageKit or Cloudinary:**

  * Performs transformation
  * Adds watermark, date, plate, business name

#### Output:

```json
{
  "plate": "5785269",
  "part": "left rear door",
  "damage": "scratched",
  "date": "2025-06-01"
}
```

---

### 11.3 OCR & Text Parsing (Invoices, Levi Itzhak)

#### Sources:

* OCR from PDF invoices or scans
* Levi Itzhak valuation PDFs

#### Process:

* Upload to folder (triggers scenario)
* Image-to-text or PDF-to-text via OCR
* Structured parsing using RegEx and GPT

#### Key Outputs:

* Invoice number, garage, cost breakdown
* Vehicle valuation fields (type, reduction %, reason, total NIS)

---

### 11.4 Smart Labeling & Grouping

* GPT maps images into logical clusters:

  * Front, back, sides, interior
* Sorted in display grids
* Titles generated dynamically (based on detection, in Hebrew)

---

### 11.5 Helper Population

All structured recognition results feed into `helper.json`:

* Auto-filled part list with damage type
* Extracted invoice values → pricing fields
* Valuation table extracted to structured JSON

Overrides are possible if user inputs a manual correction.

---

### 11.6 Accuracy Controls & Redundancy

* Double-pass validation:

  * First pass: AI extract
  * Second pass: Rule-based confirmation (e.g., value range, expected parts)
* Manual edit available in helper sheet or admin module

---

### 11.7 AI Response Handling

Responses are:

* Trimmed and sanitized
* Converted to valid JSON
* Logged in `logs/gpt_response_[type]_YYYYMMDD.json`
* Mapped to Make variables and downstream logic

---

**Chapter 12: Limitations, Overrides & Roadmap**

---

### 12.1 Known Limitations

| Area                       | Limitation Description                                                 |
| -------------------------- | ---------------------------------------------------------------------- |
| Microsoft Graph / OneDrive | Latency on file appearance post-creation                               |
| Mobile Uploads             | iOS image selection may restrict file types                            |
| Hebrew Font in PDFs        | Some font packs break DOM-based rendering engines                      |
| Invoice OCR                | Poor scan quality can cause field skipping or misinterpretation        |
| Recognition Accuracy       | GPT can mislabel unusual parts or minor details without enough context |
| Concurrent Runs            | Cloudinary & Make rate limits can be hit under heavy simultaneous use  |

---

### 12.2 Manual Override Points

| Area              | Method                                                | Notes                           |
| ----------------- | ----------------------------------------------------- | ------------------------------- |
| helper.json       | Admin manual edit or injected via override scenario   | Always respected over logic     |
| Dev.\_Text blocks | Text can be replaced per report variant or version    | Override per report or globally |
| Report triggers   | Admin can force Estimate or Final generation manually | Even if preconditions not met   |
| Uploaded images   | Renaming or reprocessing supported                    | Allows replacing GPT decisions  |
| Invoice totals    | Manual cost entry overwrites OCR or Levi logic        |                                 |

---

### 12.3 Redundancy & Recovery

* All Make.com scenarios have fail-safe fallback logic
* Logs stored separately under `/logs/`
* Reports stored both as editable doc and final PDF
* Snapshots exist per case for rollback
* Cross-validation between JSON outputs and Excel/Word templates

---

### 12.4 Roadmap & Expansion

#### Near-Term:

* Add VIN decoding + part compatibility checker
* Multi-user chat layer with embedded instruction agents
* Real-time image upload status tracker
* Expand Dev.\_Text to cover edge-case disclaimers and rare legal clauses

#### Mid-Term:

* Introduce tagging history with audit trail per image and decision
* Allow user-specific preferences per garage (recurring behavior memory)
* Generate visual map from grouped images

#### Long-Term:

* Fully autonomous assistant (Nicole agent) that monitors every job, suggests actions, flags errors
* System-wide health dashboard: job counts, stuck states, alerts
* Full audit + case closure assistant flow

---

✅ Document Complete — All 12 Chapters integrated and aligned

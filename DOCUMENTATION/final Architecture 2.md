## System Builder Architecture Specification for Carmel Cayouf Damage Evaluation System

### 🧱 1. Overview

This document is for **system builders** (front-end and system logic developers). It **does not include Make.com flows** or automation logic. Instead, it defines:

* Required **inputs, outputs**, and **data flow**
* Structure of the central metadata container: `helper.json`
* **JSON exchange formats** with Make
* **Modular structure** of the system
* UI expectations, field persistence, and field override

The system consists of the following phases:

1. **Case Initiation**

   * User starts a case with plate and basic metadata.
   * Make.com returns scraped vehicle details → stored to `helper`.

2. **General Info Input**

   * Manual UI fields: garage, damage info, insurer → stored to `helper.general_info`.

3. **Levi Report Integration**

   * OCR-parsed PDF → price adjustments injected into `helper.levisummary` and `helper.adjustments`.

4. **Damage Centers Creation**

   * Sequential damage centers with description, parts, works, repairs, depreciation.

5. **Parts Search** (3 streams)

   * Internal browser to car-part.co.il (auto login → PDF response).
   * AI-based lookup.
   * Image recognition.
   * All results stored in `helper.parts_search[]`.

6. **Expertise Summary / Status**

   * Assessor chooses directive (e.g. "לתיקון") → stored in `helper.status` and rendered visually.

7. **Fees + Depreciation**

   * Manual fee entry + global and per-center depreciation.

8. **Invoice Module**

   * Actual costs override expertise draft.
   * Updated values flow back to `helper.damage_centers[].repairs` and `parts`.

9. **Finalization & Report Generation**

   * Selection of report type.
   * Legal texts injected from vault.
   * PDF built using `helper` data.

10. **Admin & Dev Hubs**

    * Admin can override session state.
    * Dev can alter webhooks, credentials, and legal vault.

This flow is modular, and the `helper.json` acts as the single source of truth for all modules, whether used in linear report creation or standalone (tool-mode). (front-end and system logic developers). It **does not include Make.com flows** or automation logic. Instead, it defines:

* Required **inputs, outputs**, and **data flow**
* Structure of the central metadata container: `helper.json`
* **JSON exchange formats** with Make
* **Modular structure** of the system
* UI expectations, field persistence, and field override

---

### 🗂 2. Core Modules

Each module below contributes data to `helper.json`, builds up the system logic, or supports the report lifecycle.

#### 2.1 Initial Input (Start Report Screen)

* **Inputs:**

  * `plate_number` (string)
  * `owner_name` (string)
  * `inspection_date` (date)
  * `location` (string)
* **JSON to Make:**

```json
{
  "plate": "5785269",
  "owner": "כרמל כיוף",
  "date": "2025-04-04",
  "location": "חיפה"
}
```

* **Returned JSON from Make:**

```json
{
  "manufacturer": "פיג׳ו",
  "model": "308",
  "year": 2022,
  "vin": "VF3xxxxxxxxxxxx",
  "engine": "B0F7X",
  "body": "B0DA3"
}
```

* **Stored in `helper.json`:** All input + returned values

#### 2.2 General Information UI

* Manual fields:

  * Address, Phone, Garage, Garage Email
  * Insurance Company, Insurance Agent, Damage Type, Damage Date
* All fields are editable, overrideable
* **Stored in `helper.json` under** `general_info`

#### 2.3 Levi Report Integration

* OCR parsed, returns:

  * `model_code`
  * `base_price`
  * `ownership_type`
  * Adjustment rows with fields:

```json
{
  "subject": "ק"מ",
  "value": 45000,
  "percentage": -3,
  "adjusted_value": -1500
}
```

* These are stored in:

  * `helper.levisummary`
  * `helper.adjustments`

#### 2.4 Damage Center (Repeating Module)

Each damage center is a repeatable section that tracks all data related to a specific area of vehicle damage. It contains the following structure:

```json
{
  "center_id": 1,
  "location": "חזית",
  "description": "נזק קדמי לרכב",
  "repairs": [ {"name": "ישר פח", "desc": "...", "cost": 400} ],
  "parts": [ {"name": "כנף", "desc": "שבור", "source": "חליפי"} ],
  "works": ["עבודות צבע", "פירוקים והרכבות"],
  "depreciation": 5
}
```

* Damage centers are stored in `helper.damage_centers[]` as a sequential array.
* `center_id` must increment uniquely for each damage center created.
* The `location` field is selected from a dropdown list of predefined values (e.g., "חזית", "דלת ימנית אחורית").
* The dropdown for parts and repairs are dynamically populated based on part search results and repair categories.
* Builders must support:

  * Adding a new damage center dynamically
  * Removing a damage center (with confirmation)
  * Ensuring re-indexing or consistent `center_id` retention after deletions
  * UI grouping each damage center into collapsible/expandable sections
  * Associating each set of parts and repairs to its corresponding center only
* Upon modification, the corresponding object in `helper.damage_centers[n]` must be updated immediately.
* Builders should allow optional notes per center, and support future extension of fields like labor hours or secondary assessments.
  Each damage center contains:

```json
{
  "center_id": 1,
  "location": "חזית",
  "description": "נזק קדמי לרכב",
  "repairs": [ {"name": "ישר פח", "desc": "...", "cost": 400} ],
  "parts": [ {"name": "כנף", "desc": "שבור", "source": "חליפי"} ],
  "works": ["עבודות צבע", "פירוקים והרכבות"],
  "depreciation": 5
}
```

* Damage centers are stored in array: `helper.damage_centers[]`

#### 2.5 Parts Search (3 Sources)

* Browser PDF → Make → JSON → builder injects
* Make AI Lookup → JSON
* Image Search → Make → JSON
* All 3 results should be compatible and mapped into:

```json
helper.parts_search[]
```

#### 2.6 Expertise Summary (Directive)

* Dropdown: "לתיקון", "אובדן להלכה", "טוטאלוס" etc.
* Needs to:

  * Be stored in `helper.status`
  * Displayed as **WATERMARK** on final report

#### 2.7 Fees Module

```json
{
  "photo_fee": 200,
  "office_fee": 150,
  "transport_fee": 100,
  "vat_percent": 18
}
```

* Stored in `helper.fees`

#### 2.8 Depreciation Module

* User selects **% per damage center** and **global %**
* Fields:

```json
{
  "center_id": 1,
  "depreciation_percent": 3
}
```

* Final `helper.depreciation.global = 7`

#### 2.9 Invoice Integration

* OCR returns true repair costs, replaces draft values
* Overwrites `helper.damage_centers[n].repairs` and `parts`
* Results stored in `helper.invoice`

---

### 🔄 3. Final Report Binding

* Builder must:

  * Use `helper.*` to fill placeholders
  * Assign appropriate section per report type
  * Support legal text fetching via:

```json
{
  "report_type": "Global",
  "legal_text_id": "5"
}
```

#### 🔎 Report Type Behaviors:

Each report type affects both data rendering and legal text injection:

* **Private:**

  * Uses full cost breakdowns
  * Includes client name and insurance data
  * Fetches legal text from `vault.legal.private`

* **Global:**

  * Emphasizes aggregate damage estimate
  * Shows price adjustments from Levi but not individual damage center costs
  * Fetches from `vault.legal.global`

* **Sale in Damaged State:**

  * Highlights pre-repair condition
  * Omits repair recommendations
  * Focuses on parts inventory and valuation for sale context
  * Pulls from `vault.legal.sale`

* **Legal/Total Loss:**

  * Strong watermark directive (e.g. "אובדן להלכה")
  * Reduced emphasis on fees, includes VIN/legal ownership details
  * Pulls text from `vault.legal.legal`

Builder must ensure:

* Each report loads the correct legal paragraph block
* Visual layout adjusts (e.g., watermark, headers, section omission)
* Non-relevant fields are hidden or neutralized
* Final PDF matches structure expected by legal use
* Builder must:

  * Use `helper.*` to fill placeholders
  * Assign appropriate section per report type
  * Support legal text fetching via:

```json
{
  "report_type": "Global",
  "legal_text_id": "5"
}
```

---

### 💾 4. Session & Persistence Rules

* `plate`, `owner`, `inspection_date` stay in memory (sessionStorage) throughout the session.
* All form fields across modules are editable and overrideable by the user.
* Draft case data is held entirely in `helper.json`.

#### Case Persistence and Reloading:

* Once the session is closed, the system "forgets" the case unless the `helper.json` file was saved via the admin override or at finalization.
* Reloading a partial case requires uploading or referencing a valid `helper.json`, which restores the exact state (including damage centers, Levi data, fees, etc.).
* Builders must implement a mechanism to load and validate a previously saved `helper.json` structure and repopulate all modules accordingly.

#### Differentiating Draft vs Finalized Reports:

* A finalized report is marked by the presence of a `finalized: true` flag and an immutable snapshot of the `helper` used to generate the final PDF.
* Draft mode allows users to freely update damage centers, fees, Levi values, and parts.
* Builders must visually distinguish finalized from draft status:

  * Disable form editing in finalized reports
  * Lock module transitions
  * Show "readonly" mode in UI
* Admin users retain the ability to override finalized reports by unlocking and modifying helper data manually.

#### Auto-save Behavior:

* Draft edits should trigger local helper updates in real-time
* Optional auto-save to browser storage is allowed but not required
* Manual export/import of helper is the primary supported persistence method
* `plate`, `owner`, `inspection_date` stay in memory (sessionStorage)
* All fields are overrideable
* `helper` is saved to disk only when:

  * Final report is triggered
  * Admin overrides data

---

### 🔧 5. Admin & Dev Hub

#### Admin:

* Load or inject full `helper.json` to restore case
* Override any module state, including:

  * General information fields (owner, garage, damage type)
  * Levi report fields (price, model code, adjustments)
  * Damage centers: repairs, parts, depreciation
  * Fees and VAT
  * Expertise status/directive
* Launch and use any module independently of case context (tool-mode)
* Manual trigger of finalization or PDF generation
* Any override updates the `helper` immediately and is considered authoritative

#### Dev:

* Configure and test:

  * Vault keys (e.g., part system credentials)
  * API endpoints and webhook URLs
  * Legal text variants by report type
  * Depreciation schemas and threshold logic
* Admin tools available to devs for backdoor debugging and injection Admin:
* Load/modify helper
* Launch individual modules as tools
* Override results

#### Dev:

* Edit:

  * Vault values (e.g., credentials)
  * Webhooks
  * Legal text options
  * VAT config

---

### 🔚 6. Summary

* Builders don’t need Make logic
* But **must conform to JSON I/O contracts**
* Must ensure all modules **read/write to `helper`**
* Report generation, field population, session logic = their core responsibility

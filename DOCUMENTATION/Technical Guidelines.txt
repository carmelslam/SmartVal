# Carmel Cayouf Damage Evaluation System – Unified Technical Specification  
(ירון כיוף שמאות והערכת נזקי רכב ורכוש)

© All rights reserved Carmel Cayouf


## Overview

This technical specification sets the engineering roadmap, technical directives, and architectural standards for building the system.  
It is divided into core journeys (user, data, case), module blueprints (with visuals), system-level skeleton, and test/validation plans.  
**Each section is intended to instruct engineers “how” (not just “what”) to build, integrate, and maintain the system to the highest standards of stability, legality, and user experience.**

---

## Table of Contents

1. **Technical Design Philosophy**
   - Unity, modularity, and sustainable architecture (“house/floors/rooms” approach)
2. **User Journey (UX/UI)**
   - Screen flows, assets, personalization, mobile responsiveness, overrides
   - Accessibility & branding
3. **Data Journey**
   - On-demand, real-time, sustainable data flows
   - Visual representation, “never lost” principle, metadata lifecycle
4. **Case Journey**
   - Technical contracts for legality, auditability, and integrity across real-world workflows
   - Case “lifecycle map” (from open to close)
5. **Visual System Architecture**
   - Block diagram: system “house” and its main floors/rooms/modules
   - Flowcharts for data and user movement
6. **Module Engineering Roadmap**
   - a. Stand-alone (Feeder) Modules:
     - React Admin Dashboard
     - Image Upload
     - Levi Report Integration
     - External Sites Module
     - Depreciation & Fees
     - Invoice Management
     - Parts Search (browser/agent/photo)
   - b. Core (Consumer) Modules:
     - Expertise Report
     - Draft Report
     - Final Report
   - For each module:
     - **1. Screen map (visuals + flow)**
     - **2. Data send/receive diagram**
     - **3. Dependencies, contributions, and integration points**
     - **4. Styling/branding guidelines**
     - **5. Inputs/outputs/byproducts**
     - **6. Success metrics (“green light” to next phase)**
     - **7. Test/simulation plan for integrity and performance**
7. **System Skeleton & Engineering Sequence**
   - House → floors → rooms: Order of system build, phase by phase
   - Milestones and decision gates
8. **Performance, Response, and Stability Targets**
   - Response time for key operations (data fetch, report generation, uploads, search)
   - Target uptime, monitoring, and auto-repair strategies
9. **Hybrid/Modular Integration**
   - How stand-alone modules work in isolation and as part of the full system
   - Plug-in/expansion contracts for new modules (future-proofing)
10. **Error Handling & Debugging**
    - Developer-level: Logs, tracing, error classification
    - User-level: UI feedback, recoverable errors, contact/support escalation
11. **Technical Glossary (for engineers)**
    - Protocols, libraries, data formats, test utilities, deployment scripts, etc.
12. **Appendices**
    - Sample code stubs, asset lists, CSS/branding resources, test scripts

---

## How to Use

- **Each engineer, product owner, or stakeholder should start here for any technical query, reference, or system update.**
- **Every module’s section will include:**  
  - **Screen map and dataflow diagram**  
  - **Detailed contract for inputs/outputs/events**  
  - **Clear test plan and success metrics for signoff**
- **All changes, patches, or new module proposals must comply with this guide and reference the appropriate architectural and coding standards.**

---

## System Architecture & Build Guidelines

---

### 1. Objective-Driven Architecture

- The **ultimate objective** is the accurate, compliant, legally valid *Final Report* for each case.
- All system design, engineering, and process integration serves this primary goal.

### 2. Process-Centric Design

- **Major processes** (e.g., Expertise, Draft Report, Final Report) are defined as distinct, outcome-producing action clusters.
- Each process maps to a real-world phase in case handling, with system contracts for entry, validation, data flow, and completion.
- **All critical business logic, audit, and legal requirements are implemented at the process level.**

### 3. Modular Engineering

- **Every process is composed of self-contained, reusable modules.**  
  (Examples: invoice parser, parts search agent, image uploader, depreciation table, browser login, notification handler.)
- **Module build directives:**
  - Each module exposes clear inputs, outputs, and event hooks.
  - Modules are responsible for their own validation, error handling, and state management.
  - All modules are designed for plug-and-play use—can be invoked by multiple processes, and support both standalone and orchestrated operation.
  - Inter-module communication uses flat JSON and defined message contracts (never side effects or hidden state).
- **Module technical spec must include:**
  - Required and optional inputs
  - Expected outputs and byproducts (e.g., logs, knowledge blocks, cross-case refs)
  - Trigger/activation logic (user, automation, scheduled)
  - Test cases and “ready for next” criteria

### 4. Screen & UI Contracts

- **Screens (UI) are the bridge between user needs and system logic.**
- **Each screen:**
  - Is mapped to one or more modules
  - Has a defined flow: entry point, data display, action triggers, validations, overrides
  - Must be designed for clarity, simplicity, and mobile-first responsiveness
  - Must enforce branding, access rights, and process context at all times
- **UI engineering guidelines:**
  - Minimal required fields, context-aware defaults (pre-filling plate/owner/date where possible)
  - All status/progress is clearly communicated (spinners, banners, alerts)
  - All error/recovery flows are visible and actionable for the user
  - Overrides and advanced actions (admin/dev/back door) are accessible only via secure paths

### 5. Integration & Interoperability

- **Modular design facilitates integrations between processes.**
- **No module is tightly coupled to a single process—reuse and integration are core principles.**
- All data flows, screen updates, and state changes are orchestrated via defined APIs and contracts—no direct “side channel” manipulation.

---


Technical Specification Breakdown: Structure, Content, and Directives

Purpose
The technical specs are the “engineering contract” for the Yaron Cayouf Damage Evaluation System—detailing how every part is to be built, integrated, and maintained.
They must leave no room for ambiguity: if a developer leaves and a new one steps in, they will know exactly what to build, how to connect, and how to maintain system and process integrity.

OVERALL STRUCTURE
Executive Overview & Scope
Restate the mission: deliver legally robust, workflow-driven damage evaluation and reporting.
Define intended readers: developers, maintainers, integrators, future product owners.
System Map & User Journey
Screen map: Visual flow of all screens and their possible transitions, with key actions called out.
Module map: Diagram showing all standalone and integrated modules, with data/trigger arrows.
User flows: Common and edge-case journeys through the system (including “float” modules and fallback/manual paths).
Module-by-Module Technical Specs
For each module (e.g. image upload, invoice parsing, parts search, depreciation, etc.):
Objective/Role: Why it exists, what outcome it drives.
Inputs/Outputs:
Required and optional fields (including “feeder” and “consumer” mapping).
Example flat JSON structures.
Triggers & Events:
How the module is launched (user, automation, external event, system state).
All system hooks, dependencies, and completion signals.
UI/UX Design:
Wireframe or description.
Required assets (logos, fields, buttons, banners, error states, floating screens).
Branding directives (color, font, logos, watermark, footer text).
Responsiveness/mobile guidelines.
Error Handling & Edge Cases:
What can go wrong, and what happens (UI, logs, user override, system fallback).
Data Propagation:
Where output goes, what meta/helper fields get updated, what is “remembered” for other modules.
Byproduct and knowledge hub contributions.
Success/Completion Criteria:
What qualifies as “done” for the module; what greenlights the next step.
Testing & Simulation:
Minimum unit and integration tests.
Required “virtual user” scenarios for QA.
Process and Case Flow Logic
Full journey of a case: Expertise → Draft → (Estimate?) → Depreciation/Fees → Final Report (all types)
Stepwise data dependencies:
What outputs must exist before each stage, what “feeds” are needed, how does skipping/overriding work.
Trigger/gate logic: e.g., fees+depreciation as preconditions for finalization.
Meta/helper update algorithm: Exact fields to write, override rules, and retrieval contracts.
Data Management & Formats
Flat JSON: All data exchanged via flat JSON; no nested structures for Make mapping ease.
Field naming conventions: (snake_case/camelCase, localization for Hebrew/English)
Meta/helper table: Contract for structure, storage, and update frequency.
Backup and recovery: How/when meta is force-synced (e.g., on logout, inactivity, step finalization).
Audit log design: All user/system actions logged for compliance and debugging.
Admin Hub & Developer Back Door
Capabilities: User management, log review, credential/vault access, live code patch, text bank management.
Security: Access control, session timeouts, double authentication.
Text bank: Directory for all legal and explanatory texts, with labels/anchors per report type.
Integration & Interop
Cloudinary, OneDrive, Google Drive, Netlify, Make.com, WordPress endpoints
Webhooks and API contracts (with examples, error returns, and versioning)
Session/cookie logic for in-system browsers, credential vault
Notification channels: OneSignal, email, WhatsApp (with trigger tables)
PDF generation: Endpoints for both HTML and JSON, expected payloads and asset rules.
Technical/Engineering Guidelines
Directory structure: Project skeleton (folders for each module, assets, configs, scripts, docs, etc.)
Coding standards: Language versions, formatting, comment requirements, documentation blocks.
Asset management: Where and how images, logos, legal footers, and dynamic overlays are stored and updated.
Dynamic content generation: Engine specs for populating and styling reports (math engine, placeholder logic, data block import).
Automatic login/vaulting for browser modules: Secure credential storage, change/update via back door, registering new sites.
Floating screens: Standardized data schema, table-based layout, title conventions, usage guidelines.
Edge-case handling: Fallbacks for expiring webhooks, manual data entry, session errors.
Performance, Uptime, and Error Handling
Response time goals per major function.
Uptime/availability targets (and auto-recovery protocols).
Developer/user error debugging: Logs, UI feedback, and reporting.
Testing, Success Criteria, and Build Order
Block-based plan: What is built first, what must be stable before next step.
Inputs, outputs, and byproducts for every block.
“Green light” criteria for module/step completion.
Required virtual and user-based test cases.
Appendices
Example data: JSON payloads, UI mockups, annotated reports.
Field mapping tables: Which fields are used where, source/target, English/Hebrew.
Platform credentials (placeholder only)
Open questions for future expansion (e.g., multi-user, knowledge hub v2).
How to Approach/Write Each Section
Always start with “what and why” (outcome and purpose)
Then give “how” (step-by-step technical approach)
Include examples wherever possible (JSON, UI, sequence diagrams, error flows)
Call out all dependencies and triggers
Be explicit about rules for editing/overriding/propagation
Document fallback and recovery for all critical points (e.g., admin back door, manual paths)
Where the spec is generic due to pending decisions, call it out and label clearly




Here’s the unified, implementation-ready plan for the Damage Centers system that merges:

The structured phased refactor I gave earlier
Your specific broken dropdown/edit/clear issues
My inspection findings from the helper structure, matrix of data flow, helper architecture, and depreciation_module.md

This is ready to hand to a dev in Cursor as a step-by-step checklist.
All steps are small, reversible, and safe—no breaking of existing flows.
There is no damage center section in the helper at all 
The damage section in helper needs to capture every pice of data input or received in a proper structure 
The webhook response for the parts search is not captured by the helper anywhere . 
The wizard has different rules for different modules , it needs ti be the same rules ,
Styke needs to be the same , color can change between wizard modules to indicate a new modular (not important) but style and feel should remain the same across wizard.
Phase 0 — Baseline + Guardrails
Add a read-only debug panel in dev mode:
Shows helper.version, damage_centers.length, last 20 helper events.
Implement a ring-buffer logger helper.log(event, data) (cap 200).
Freeze a schema header in helper:
helper.version = { schema: "damage-centers@v1", updated_at: new Date().toISOString() }
Phase 1 — Canonical Schema + IDs (no UI changes yet)
Create helper/damageCenters.schema.js:
Enums: AREA_CODE, DAMAGE_TYPE, SIDE.
Shape for a center and nested arrays: photos[], works[], parts_required[].
validateCenter(center) → { ok, errors[] }.
Create helper/ids.js:
dc_*, wk_*, pr_*, ph_* via nanoid(10).
One-time migration on load:
Ensure helper.damage_centers is an array.
Add missing IDs to centers + nested items.
Normalize enums, coerce numbers, dedupe arrays.
Log warnings instead of throwing.
Phase 2 — Single Writer API
Create helper/damageCenters.api.js:
create(draft), update(id, draft), remove(id)
attachPhoto/detachPhoto, add/update/removeWork, add/update/removePart
recalc(id), recalcAll()
Every write: fromDraft() → validate → commit → emit('damageCenters:changed')
Create helper/damageCenters.selectors.js:
getAll() → for dropdowns.
getById(id) → returns immutable snapshot.
Phase 3 — Serializer Layer
Create helper/damageCenters.serializer.js:
toDraft(center) → helper → UI form.
fromDraft(draft) → UI form → normalized patch.
All type coercion, enum mapping, and deduping happens here.
Phase 4 — Wizard Page 1 Fixes (Your broken feature)
Replace dropdown datasource with selectors.getAll().
On dropdown change:
If empty: resetDraft() + renderForm().
Else:
draft = serializer.toDraft(getById(id));
renderForm(draft);
Buttons:
Save/Edit: update(draft.id || dd.value, draft) or create(draft) if no ID.
Clear: Reset draft + form, dd.value='', no helper write.
Delete: remove(currentId) → reset UI.
Listen for 'damageCenters:changed' → refresh dropdown.
Phase 5 — Works & Parts Subpages Coherence
Force these subpages to:
Read active center via selectors.getById(activeId).
Add/update/remove via helper API only.
Remove all index-based data writes; use data-id attributes.
Phase 6 — Export/Import Contract
Add helper.damageCenters.export() → { version:'v1', damage_centers:[…] }
Add helper.damageCenters.import(snapshot) → version check, normalize, validate, emit one 'changed'.
Auto-export (debounced 300 ms) on:
center create/remove
work/part add/remove
recalcAll()
Phase 7 — Validation UX
Inline errors block Save:
Required: area_code, severity 0–5, damage_types[], qty>0, price≥0.
Show warnings for enum normalization without blocking.
Phase 8 — Consistency Sweeps
On load + before export:
Orphan works/parts → drop or reattach.
Duplicate photo refs → warn.
Totals drift → recalcAll().
Phase 9 — Telemetry
Emit:
damageCenters:changed {ids, reason}
damageCenters:validated:error {id, errors}
damageCenters:recalculated {ids}
Perf marks for heavy ops.
Phase 10 — Tests
Fixtures: 0, 1, 50 centers with nested lines.
Unit tests: CRUD round-trip, dropdown reflects changes, serializer idempotence, enum normalization.
Manual regression:
Select → prefill OK
Edit & Save → updates helper & dropdown
Clear → no helper change
Delete → removes center + updates UI
File Changes
helper/ids.js — new
helper/damageCenters.schema.js — new
helper/damageCenters.serializer.js — new
helper/damageCenters.selectors.js — new
helper/damageCenters.api.js — new
ui/wizard/page1.js — change data wiring only
ui/works.js, ui/parts.js — switch to API calls
helper/logger.js — new
helper/version.js — new
Acceptance Criteria
Dropdown lists all centers on load + after mutations.
Selecting a center fully repopulates form & nested lists.
Save applies edits atomically; no index bugs.
Clear leaves helper untouched.
Delete removes center & nested lines + updates dropdown.
Export JSON stable & normalized.
No console errors; only first-run normalization warnings.
Log shows coherent events per action.
Rollout
Ship Phase 1–3 behind DC_API_V1 flag.
Enable on dev, run migration once, verify.
Flip wizard page to new data path.
Remove legacy mirrors after 1 stable day.


1. Core Problems Identified
1.1. Broken UI ↔ Helper Binding
Dropdown list on wizard page does not fetch registered damage centers from helper.damage_centers on load.
Edit action does not repopulate UI with the selected center’s data from helper.
Clear/Delete action does not remove the item from helper or refresh the UI.
Data updates happen locally in the DOM but are not pushed back to helper consistently.
1.2. Missing CRUD Logic for Damage Centers
No unified Create/Read/Update/Delete handler for damage centers in helper.js.
Inconsistent key naming between UI and helper fields (e.g., damage_center vs מוקד_נזק).
No version control or overwrite rules—editing a damage center can silently overwrite the wrong one.
1.3. Inconsistent Field Mapping
Some UI inputs (cost, description, depreciation %) are mapped correctly, others are unmapped or mapped to old helper fields.
Fields from enhanced-damage-centers.html, damage-center-repairs.html, and damage-center-works.html are not always synchronized.
1.4. Dependent Module Drift
The depreciation module (see depreciation_module.md) expects each מוקד נזק to be in helper for percentage depreciation calculation.
If a damage center is missing or incomplete in helper, depreciation math engine returns wrong or empty values.
1.5. Data Flow Breakpoints
From the matrix (matrix of data flow - manual vs autofill.md) and helper architecture:
Manual input pages → helper works fine for some fields but damage center pages fail to push after edit.
Builder/calculator pages pull from helper but will show stale or missing values if damage center edits aren’t synced.
1.6. Missing Modern Resilience Practices
No event-driven sync between UI and helper (only manual save).
No deep cloning before editing—can cause live data corruption.
No UI diff logic to show changed fields before committing.
2. Required Fixes & Improvements
2.1. Standardize Helper Structure for Damage Centers
Define a single helper.damage_centers array structure:
helper.damage_centers = [
  {
    id: "uuid",
    name: "מוקד נזק",
    description: "",
    cost_parts: 0,
    cost_works: 0,
    cost_repairs: 0,
    depreciation_pct: 0,
    notes: "",
    last_updated: ISODate
  }
];
Enforce the same structure in all pages that modify damage centers.
2.2. Build CRUD in helper.js
addDamageCenter(centerObj)
getDamageCenterById(id)
updateDamageCenter(id, updatedObj)
deleteDamageCenter(id)
Ensure deep copy on edit and atomic replacement on save.
2.3. Fix Dropdown Loading Logic
On wizard load:
Fetch helper.damage_centers.
Populate dropdown with name (or translated label).
Attach data-id for edit/delete actions.
2.4. Implement Edit Flow
Selecting an item → populate all relevant UI fields from helper.
Save action → replace entry in helper without altering order.
Trigger UI refresh after save.
2.5. Implement Delete/Clear
On delete:
Remove entry from helper.
Refresh dropdown list.
Clear UI fields.
2.6. Field Mapping Audit
Cross-check all damage center related fields in:
damage-center-flow.html
enhanced-damage-centers.html
damage-center-repairs.html
damage-center-works.html
Map all to the unified helper structure (2.1).
2.7. Depreciation Module Compatibility
Ensure helper.damage_centers has all מוקד נזק values needed for depreciation_module.js math.
Add fallback for missing values → show 0 instead of breaking.
2.8. Resilience Enhancements
Add last_updated field for conflict resolution.
Add confirmation prompt before overwriting edited damage center.
Use event listeners so all dependent pages refresh helper data in real time.
Add validation to prevent empty names or duplicate names.
3. Modernization Recommendations
Two-way binding: Use a reactive binding (e.g., Proxy or Vue-like reactivity) for helper sections so UI updates instantly.
Local diff preview: Show the before/after changes before committing to helper.
Undo last change: Keep a single backup state for quick rollback.
Consistent UUID keys: No reliance on array index for identifying damage centers.
Partial save support: Allow saving incomplete damage center drafts.
4. Task Plan
Phase 1 – Foundation
 Define and lock unified helper structure for damage centers.
 Write CRUD functions in helper.js.
Phase 2 – UI Integration
 Fix dropdown load with helper data.
 Implement edit → repopulate UI fields.
 Implement delete → remove from helper + refresh UI.
 Map all related pages to new helper structure.
Phase 3 – Module Sync
 Update depreciation module to use new damage center data structure.
 Audit estimate/final builders for dependency on old keys.
Phase 4 – Resilience Layer
 Add timestamps, validation, and duplicate prevention.
 Implement diff preview and undo.
Phase 5 – QA
 Unit test CRUD in isolation.
 Integration test: create/edit/delete → verify updates in depreciation and final report.
 Simulate multi-edit session to ensure no overwrites.
If you want, I can now write the exact helper.js CRUD + UI binding code that will drop in without breaking existing flows and will fix the dropdown/edit/delete problem immediately.
Do you want me to prepare that?
You said:
yes 
ChatGPT said:
Great additions. Here’s the tight answer to your five “Thoughts”:
How to integrate in the flow
Insert Estimate (אומדן) after Draft, optional branch; Final pulls “latest value” with priority Invoice > Estimate > Draft (already aligned with your cascade). UI stays separate from Final; edits in Estimate write to Helper with source=estimate.
How to update the specs
Add Estimate as a fourth consumer in process maps, triggers, and folder logic; extend report generation tables and Dev._Text to include Estimate block. Update Final module to show type selector (multi-select) and load per‑type legal blocks from the vault. Mirror in UI maps and event rules.
Requirements (mostly “more of the same”)
Data: extend Helper (flat JSON) with minimal new fields (e.g., est_value_drop_pct, garage_days, sale_price_damaged, residual_value, loss_pct, client_is_company, differentials table).
UI: single “Depreciation & Report Type” screen with context-aware fields + per‑type summaries; block depreciation for Global/Total Loss; VAT handling when client=company; “Differentials” subsection. Connect to math engine.
Extra dependencies
Dev._Text Modular must add Estimate + 4 Final types, with placeholders for new fields and versioning.
Math engine: add formulas for totals, residuals, differentials, VAT, and derived fields; respect data source precedence.
PDF endpoints: permit multi-output when user selects multiple Final types in one go.
Complications / risks
Validation gaps when multiple types selected (ensure required-by-type fields are enforced).
Source-of-truth confusion (mitigated by explicit source and the Invoice>Estimate>Draft rule).
UI complexity (solved by one consolidated form with show/hide rules).
Auditability when Estimate overrides Draft (log diffs + snapshots).
Race conditions if invoices arrive after Estimate—Final must re-resolve precedence on generate.



Here’s the unified, implementation‑ready plan. Small, reversible steps. No behavior regressions. Hand to Claude in Cursor as a checklist.
Phase 0 — Baseline + Guardrails
Add a read‑only debug panel: prints helper.version, damage_centers count, last 20 events.
Add a ring‑buffer logger helper.log(event, data) (cap 200).
Freeze a version header in helper: { schema:"damage-centers@v1", updated_at }.
Phase 1 — Canonical schema + IDs (no UI changes yet)
Create helper/damageCenters.schema.js with:
enums: AREA_CODE, DAMAGE_TYPE, SIDE.
shape for a center and nested photos|works|parts_required.
validateCenter(center) returns {ok, errors[]}.
Add ID utils id.ts: dc_*, wk_*, pr_*, ph_* nanoid(10).
One‑time migration on load:
Ensure helper.damage_centers exists as array.
Add missing id on centers and nested items.
Coerce numbers, dedupe arrays, normalize enums.
Do not throw. Log warnings.
Phase 2 — Single writer API (helper only)
Add helper/damageCenters.api.js:
create(draft) → id
update(id, draft) → boolean
remove(id) → void
attachPhoto|detachPhoto, add|update|removeWork, add|update|removePart
recalc(id), recalcAll()
All writes run fromDraft() → validate → commit → emit('damageCenters:changed').
Add selectors helper/damageCenters.selectors.js:
getAll() for dropdown options.
getById(id) returns immutable snapshot.
Phase 3 — Serializer layer
Add helper/damageCenters.serializer.js:
toDraft(center): helper → UI form.
fromDraft(draft): UI form → normalized patch.
Centralize type coercions, enum map, dedupe.
Phase 4 — Wizard page 1 fixes (your reported issue)
Replace dropdown datasource with selectors.getAll().
On change:
If id empty → resetDraft(); renderForm().
Else load: draft = serializer.toDraft(getById(id)); renderForm().
Buttons:
Save/Edit → helper.damageCenters.update(draft.id||dd.value, draft) or create(draft) if no id.
Clear → resetDraft(); renderForm(); dd.value='' (no helper write).
Delete → helper.damageCenters.remove(currentId); reset UI.
Listen to document.addEventListener('damageCenters:changed', refreshDropdown).
Phase 5 — Works & Parts subpages coherence
Ensure those pages never write to mirrors. They must:
Read active center via selectors.getById(activeId).
Add/update/remove via helper API only.
Remove any index‑based logic. Use stable IDs in data‑ attributes.
Phase 6 — Export/Import contract (Make.com)
Add helper.damageCenters.export(): returns {version:'v1', damage_centers:[…]}.
Add helper.damageCenters.import(snapshot): strict version check, normalize, validate, emit one changed.
Auto‑export triggers (debounced 300 ms) on:
center create/remove
work/part add/remove
recalcAll() completion
Phase 7 — Validation UX
validateCenter errors surface inline:
Block Save when errors.
Highlight fields: area_code, severity 0–5, damage_types[], qty>0, price≥0.
Non‑blocking warnings banner for enum normalization.
Phase 8 — Consistency sweeps
On app load and before export:
Orphan lines check (work/part pointing to missing center) → drop or reattach policy.
Duplicate photo refs across centers with same id+order → warn.
Totals drift → force recalcAll().
Phase 9 — Telemetry
Emit events:
damageCenters:changed {ids, reason}
damageCenters:validated:error {id, errors}
damageCenters:recalculated {ids}
Add simple perf marks around heavy ops. Log durations.
Phase 10 — Tests (minimal but decisive)
Fixtures: 0 centers, 1 center, 50 centers with nested lines.
Unit tests:
Create→Edit→Delete round‑trip keeps IDs, types, and totals.
Dropdown reflects create/delete without reload.
Serializer preserves semantics (toDraft→fromDraft idempotent).
Import old enums normalizes correctly.
Manual regression:
Select existing center → form prefilled accurately.
Edit and Save updates helper and dropdown label.
Clear does not touch helper.
Delete removes helper record and dropdown option.
File‑level change plan (safe inserts)
helper/ids.ts — new.
helper/damageCenters.schema.js — new.
helper/damageCenters.serializer.js — new.
helper/damageCenters.selectors.js — new.
helper/damageCenters.api.js — new.
ui/wizard/page1.js — replace data wiring only (keep markup).
ui/works.js, ui/parts.js — swap to API calls, remove direct writes.
helper/logger.js — new ring buffer.
helper/version.ts — new constant.
Acceptance criteria (sign‑off list)
Wizard dropdown lists all centers on load and after mutations without refresh.
Selecting a center fully repopulates form fields and nested lists.
Save applies edits atomically. No array‑index bugs after reorders.
Clear does not mutate helper.
Delete removes center and nested lines and updates dropdown.
Make export shows normalized v1 JSON with stable IDs.
No console errors. Warnings only for normalization during first run.
Log shows coherent event sequence for each action.
Rollout
Ship Phase 1–3 behind a feature flag DC_API_V1.
Enable on dev. Run migration once. Verify.
Flip wizard page to new data path.
Remove legacy mirrors after one stable day.
Keep serializer and schema as the only place for mappings.




Problem: the wizard’s first-page dropdown does not 1) list helper damage centers, 2) load one into the form for edit, 3) clear/delete correctly. Root cause is missing selectors, no serializer/deserializer, and no single writer path.
What to implement
Canonical paths
Helper source of truth: helper.damage_centers (array of objects with stable id).
UI form model: wizard.form.damageCenterDraft (plain object).
No direct DOM writes. All through helper API + serializer.
Selectors (read-only)
// helper.selectors.damageCenters
getAll: () => (helper.damage_centers ?? []).map(c => ({
  id: c.id, value: c.id, label: `${dict.areaLabel(c.area_code)} • ${c.severity}/5`
})),
getById: (id) => (helper.damage_centers ?? []).find(c => c.id === id) || null
Serializer / deserializer (single place)
// serializer: helper → form draft
toDraft(center) {
  return {
    id: center.id,
    area_code: center.area_code,
    side: center.side ?? "N/A",
    severity: center.severity ?? 0,
    damage_types: [...(center.damage_types ?? [])],
    notes: center.notes ?? "",
    photos: [...(center.photos ?? [])],
    works: [...(center.works ?? [])],
    parts_required: [...(center.parts_required ?? [])],
  };
},
// deserializer: form draft → normalized center patch
fromDraft(draft) {
  return {
    area_code: draft.area_code,
    side: draft.side,
    severity: Number(draft.severity ?? 0),
    damage_types: Array.from(new Set(draft.damage_types ?? [])),
    notes: draft.notes ?? "",
    photos: (draft.photos ?? []).map(p => ({id:p.id, url:p.url, order:Number(p.order||0)})),
    works: (draft.works ?? []).map(w => ({...w, qty:Number(w.qty||1)})),
    parts_required: (draft.parts_required ?? []).map(p => ({...p, qty:Number(p.qty||1)})),
  };
}
Minimal helper writer API
helper.damageCenters = {
  create(draft){
    const id = `dc_${cryptoRand()}`;
    const center = { id, ...serializer.fromDraft(draft), estimates:{}, meta:{created_at:Date.now(),updated_at:Date.now()}};
    helper.damage_centers = [...(helper.damage_centers||[]), center];
    emit('damageCenters:changed',{ids:[id],reason:'create'});
    return id;
  },
  update(id, draft){
    const idx = (helper.damage_centers||[]).findIndex(c=>c.id===id);
    if (idx<0) return false;
    const patch = serializer.fromDraft(draft);
    helper.damage_centers[idx] = {...helper.damage_centers[idx], ...patch, meta:{...helper.damage_centers[idx].meta,updated_at:Date.now()}};
    emit('damageCenters:changed',{ids:[id],reason:'update'});
    return true;
  },
  remove(id){
    const before = helper.damage_centers?.length||0;
    helper.damage_centers = (helper.damage_centers||[]).filter(c=>c.id!==id);
    if ((helper.damage_centers?.length||0)!==before) emit('damageCenters:changed',{ids:[id],reason:'remove'});
  }
};
Wizard UI wiring
// DOM
const dd = document.querySelector('#dc-dropdown');        // <select>
const btnEdit = document.querySelector('#dc-edit');       // Edit
const btnClear = document.querySelector('#dc-clear');     // Clear form only
const btnDelete = document.querySelector('#dc-delete');   // Delete center

// 5.1 populate dropdown
function refreshDropdown(){
  const opts = helper.selectors.damageCenters.getAll();
  dd.innerHTML = `<option value="">— בחר מוקד נזק —</option>` +
    opts.map(o=>`<option value="${o.id}">${o.label}</option>`).join('');
}
// call on load and on event
document.addEventListener('damageCenters:changed', refreshDropdown);
refreshDropdown();

// 5.2 selecting a center does NOT mutate helper. It only loads draft.
dd.addEventListener('change', ()=>{
  const id = dd.value;
  if(!id){ resetDraft(); renderForm(); return; }
  const center = helper.selectors.damageCenters.getById(id);
  if(!center){ resetDraft(); renderForm(); return; }
  wizard.form.damageCenterDraft = serializer.toDraft(center);
  renderForm();
});

// 5.3 edit: user changes fields in the form → save
btnEdit.addEventListener('click', ()=>{
  const d = collectForm(); // read inputs → draft object
  const id = d.id || dd.value;
  if(!id){ // new if none
    const newId = helper.damageCenters.create(d);
    dd.value = newId;
  } else {
    helper.damageCenters.update(id, d);
  }
});

// 5.4 clear: wipe form only
btnClear.addEventListener('click', ()=>{
  resetDraft(); renderForm(); dd.value = '';
});

// 5.5 delete: remove from helper and UI
btnDelete.addEventListener('click', ()=>{
  const id = dd.value || wizard.form.damageCenterDraft?.id;
  if(!id) return;
  helper.damageCenters.remove(id);
  resetDraft(); renderForm(); dd.value = '';
});
Form glue
function resetDraft(){
  wizard.form.damageCenterDraft = {
    id:null, area_code:'', side:'N/A', severity:0,
    damage_types:[], notes:'', photos:[], works:[], parts_required:[]
  };
}
function renderForm(){
  const d = wizard.form.damageCenterDraft || {};
  setValue('#area_code', d.area_code);
  setValue('#side', d.side);
  setValue('#severity', d.severity);
  setChecks('input[name="damage_types"]', d.damage_types);
  setValue('#notes', d.notes);
  // render photos/works/parts lists as needed
}
function collectForm(){
  return {
    id: wizard.form.damageCenterDraft?.id || null,
    area_code: getValue('#area_code'),
    side: getValue('#side'),
    severity: getValue('#severity'),
    damage_types: getChecks('input[name="damage_types"]'),
    notes: getValue('#notes'),
    photos: collectPhotosUI(),
    works: collectWorksUI(),
    parts_required: collectPartsUI(),
  };
}
Validation guard (simple, inline)
function validateDraft(d){
  const errors = [];
  if(!d.area_code) errors.push('area_code');
  const sev = Number(d.severity);
  if(!(sev>=0 && sev<=5)) errors.push('severity');
  if(!Array.isArray(d.damage_types)) errors.push('damage_types');
  return errors;
}
// call validateDraft inside create/update before write; abort on errors and show UI error state.
Delete policy
Delete removes the center and all nested lines for that center. No orphan mirrors. Confirm in UI.
Regression tests (manual or unit)
Dropdown lists all centers after load and after create/delete.
Selecting an item loads the exact values into the form.
Editing then saving updates helper and reflects in dropdown label.
Clear resets form without touching helper.
Delete removes from helper and dropdown.
Reorder in helper triggers damageCenters:changed and re-populates.
Likely current faults to remove
Dropdown built from a stale mirror like helper.damageCenters vs helper.damage_centers.
Using array index in <option value> instead of stable id.
No serializer, so labels written into enums.
Delete button clears form only and does not call helper.
Edit writes to form state but never persists via helper API.
Task list for Cursor
Add selectors and serializer/deserializer modules.
Implement helper.damageCenters.create|update|remove.
Replace dropdown population with refreshDropdown() and event listener.
Implement resetDraft, renderForm, collectForm.
Wire buttons for edit/clear/delete as above.
Add validateDraft and block save on errors with inline messages.
Remove any legacy mirrors and index-based logic.
Smoke test the flows listed in Regression tests.



Here’s the audit and the fix plan for Damage Centers. I’m assuming no breaking code changes. Everything slots in with small, reversible commits.
Executive summary
Core risks: missing IDs, mixed indexing, partial writes to helper, stale UI mirrors, silent validation failures, and non-atomic updates.
Target state: single source of truth helper.damage_centers + evented, atomic mutations + strict schema + deterministic IDs + normalized lookups + full validation + telemetry.
Required canonical schema (contract)
Use one array, one object per center. No parallel mirrors.
helper.damage_centers: [
  {
    "id": "dc_8f3a2b",                 // stable, collision-resistant
    "area_code": "FRONT_LEFT_FENDER",   // enum
    "area_label": "כנף שמאל קדמי",     // i18n label
    "side": "LEFT",                     // enum: LEFT|RIGHT|FRONT|REAR|N/A
    "severity": 0,                      // 0–5 integer
    "damage_types": ["DENT","SCRATCH"], // enum[]
    "notes": "",                        // free text
    "photos": [                         // normalized references only
      {"id":"ph_123","url": "...", "order":1}
    ],
    "works": [                          // labor lines attached to this center
      {"id":"wk_ab1","code":"REMOVE_FENDER","qty":1,"hours":1.5,"rate":null}
    ],
    "parts_required": [                 // chosen parts for this center
      {"id":"pr_77a","part_id":"OEM-8K0-821-105","name":"כנף שמאל", "qty":1, "price":null, "source":"OEM"}
    ],
    "estimates": {                      // computed and cached fields
      "labor_total_nis": 0,
      "parts_total_nis": 0,
      "subtotal_nis": 0
    },
    "meta": { "created_at": 0, "updated_at": 0, "created_by":"ui" }
  }
]
Enums to freeze:
area_code list, damage_types, side. Keep as upper snake case.
Invariants
id unique across all centers. Never reuse.
UI never mutates arrays directly. All writes go through helper API.
No derived totals saved without meta.updated_at bump.
Photos, works, parts are references with their own IDs. No blobs.
Every mutation validates schema and enums, then emits one event.
Reads are pure. Writes are atomic.
Helper API (must exist and be the only writer)
Functions on helper.damageCenters namespace:
create(centerDraft): id
update(id, patch): void // shallow patch with full validation
remove(id): void
attachPhoto(id, photoRef): void
detachPhoto(id, photoId): void
addWork(id, workLine): string
updateWork(id, workId, patch): void
removeWork(id, workId): void
addPart(id, partLine): string
updatePart(id, partId, patch): void
removePart(id, partId): void
recalc(id): void // recompute estimates atomically
recalcAll(): void
export(): HelperSnapshot // full JSON for Make
import(snapshot): void // strict loader with version check
Events emitted (documented and centralized):
damageCenters:changed (payload: { ids, reason })
damageCenters:validated:error (payload: { id, errors[] })
damageCenters:recalculated (payload: { ids })
Validation rules
Required: area_code, severity, damage_types[].
severity integer 0–5.
damage_types subset of enum.
Deduplicate photos, works, parts_required by id.
qty positive numeric. price ≥ 0.
Reject unknown keys (use an allowlist).
i18n fields read-only for UI. Only labels from dictionary.
ID strategy
Use nanoid(10) or crypto-based. Prefix by entity: dc_, wk_, pr_, ph_.
Never index by array position in UI. Always by id.
Data flow: UI ↔ helper
UI form components are controlled by helper.selectors that return immutable snapshots.
UI dispatches only helper API calls. No direct state edits.
After each mutation: helper emits event. UI listens and re-renders.
Export to Make: triggered on explicit milestones only:
center created/removed
work/part added/removed
recalcAll completed
Debounce exports at 300 ms to coalesce bursts.
Consistency checks (run on load and before export)
Orphan work/part lines that reference missing center → fix or drop with log.
Unknown enum values → map via compatibility table or block export.
Totals cache drift → force recalcAll.
Duplicate photos across centers with same id and order → warn.
Known failure patterns to eliminate
Parallel “mirror” arrays (e.g., helper.works by area + helper.damage_centers[].works) → remove mirrors, keep only nested and compute views on demand.
UI storing indexes in DOM dataset and using them after reorder → forbid. Use IDs.
Silent coercion of Hebrew labels into enum fields → stop. Map labels to enums through a single dictionary.ts.
Telemetry and logs
Add helper.log(event, details) with ring buffer of last 200 events.
Persist logs with the snapshot for reproducibility on bug reports.
Migration plan (non-breaking)
Introduce schema guards: add a validator (zod or plain) used by all helper API writes. Log but do not throw for first 48h (warn mode).
Generate IDs for existing centers and nested items if missing. Store back.
Lock writer path: mark old direct writes as deprecated, console.warn with stack.
Enum normalization: add a map from current values to canonical enums. Keep reversible.
Wire events: central event bus inside helper. Replace ad‑hoc dispatchEvent.
Recalc correctness: implement deterministic recalc* with unit tests. Replace scattered math.
Export contract: freeze export JSON shape and version v1. Add version header.
UI fixes
Forms bind by center.id only.
Add optimistic UI for create/update/remove with rollback on helper validation error.
Strict input masks: severity slider 0–5. damage_types checkbox group from enum list.
Drag reordering of photos emits detach + attach with updated order.
Works/Repairs page writes to the active center only. Disallow multi-center writes from one page.
Edge cases to test
Create 50 centers. Performance and event storm coalescing.
Delete a center that has parts and works. Orphans removed in one atomic transaction.
Import snapshot with old enums. Normalization table applied.
Attach same photo to two centers. Allowed? Decide policy:
If
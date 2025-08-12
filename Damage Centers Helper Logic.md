Helper Map (scaffold only)
Keep helper as the single source of truth.
Don’t touch working zones (car card, general info, Levi, floating screens).
Add a documented map (readme) next to helper.js describing keys, types, and who writes/reads them. No code changes yet.
Damage Centers — canonical JSON (per center)
{
  "center_id": "uuid-ks-001",          // stable ID (never re-number on delete/reorder)
  "label": "קדמי ימין",                 // dropdown label
  "status": "draft|estimate|final",     // lifecycle state
  "phase_sources": {                    // who last wrote which block
    "repairs": "expertise|estimate|invoice",
    "parts":   "expertise|estimate|invoice",
    "works":   "expertise|estimate|invoice"
  },
  "links": {
    "group_id": "uuid-g-01",           // to support mutual/related centers
    "linked_center_ids": ["uuid-ks-002"]
  },
  "description": "טקסט חופשי…",
  "repairs": [
    {
      "id": "r-001",
      "name": "יישור פח",
      "desc": "כנף קדמית",
      "qty": 1,
      "unit_price": 400,
      "net": 400,
      "vat_rate": 0.18,
      "gross": 472,
      "source": "expertise|estimate|invoice",
      "note": ""
    }
  ],
  "parts": [
    {
      "id": "p-001",
      "name": "כנף ימנית",
      "desc": "שבורה",
      "condition": "חליפי|מקורי|משומש|מחודש",
      "catalog_no": "…",                // map if available
      "supplier": "…",
      "qty": 1,
      "unit_price": 850,
      "net": 850,
      "vat_rate": 0.18,
      "gross": 1003,
      "source": "expertise|estimate|invoice",
      "external_ref": "parts_search:abc123" // link to helper.parts_search[i].id
    }
  ],
  "works": [
    {
      "id": "w-001",
      "name": "עבודות צבע",
      "desc": "…",
      "qty": 1,
      "unit_price": 600,
      "net": 600,
      "vat_rate": 0.18,
      "gross": 708,
      "source": "expertise|estimate|invoice"
    }
  ],
  "totals": {                           // computed, not user-edited
    "net": 1850,
    "vat": 333,
    "gross": 2183
  },
  "depreciation": {                     // % only; disabled for types that forbid it
    "percent": 0,                       // always present; 0 if N/A
    "basis": "market|center_total|manual",
    "note": ""
  },
  "audit": {
    "created_at": "ISO-8601",
    "updated_at": "ISO-8601",
    "history": [ { "ts":"…","who":"UI|webhook","what":"updated parts[0].net" } ]
  }
}
Helper paths (new or confirmed)
helper.damage_centers: array of the above objects.
helper.parts_search: results your modules already store; each must have a stable id so lines can reference it via external_ref.
helper.invoice: keep raw OCR lines untouched; map/merge into centers (see merge rules).
helper.report.type: one of the 5 final types (drives UI hides).
helper.depreciation.global_percent: always present (0 if N/A).
helper.flags.not_in_agreement (לא בהסדר): boolean; used by builder, not part of legal text blocks.
Merge rules (safe, deterministic)
Precedence: invoice > estimate > expertise.
Granularity: merge per line item, not whole center.
If an invoice line matches an existing item (by external_ref or fuzzy on name+qty), overwrite financials and set source:"invoice".
New invoice-only lines: append to the appropriate center (UI lets the user assign center if ambiguous).
Estimate edits overwrite only edited fields; never nuke unrelated arrays.
Totals recompute after each merge.
UI rules (minimal but strict)
Stable IDs: centers and lines use UUIDs; UI reorders visually only.
Add/duplicate center: creates new center_id and copies fields; audit records provenance.
Hide depreciation inputs when report type is “מכירה מצבו הניזוק” or “טוטלוסט”; keep depreciation.percent = 0 (explicit zero, never omit).
Validation:
Center must have label.
Money fields: numbers ≥ 0; vat_rate defaults from system setting.
On delete line → soft-delete or remove; recompute totals.
Mutual centers: when user marks two centers as mutual, assign same links.group_id.
Builder behavior
Builders/readers (Expertise/Estimate/Final) only read helper.
Final report pulls costs from invoice-sourced lines if present; otherwise last known (estimate→expertise).
“לא בהסדר”: stored in helper.flags.not_in_agreement; the builder decides if/where to render an extra paragraph. It is not concatenated into the legal text vault.
Persistence & reload
Never fail on reload. Initialize missing keys with safe defaults:
Arrays → [], strings → "", numbers → 0, objects → {}.
Partial updates merge only changed keys along the path; never overwrite a whole center unless that’s the explicit operation (e.g., “replace center”).
Alignments:
Parts search results: ensure each result saved under helper.parts_search[] has:
{ "id":"parts:abc123","name":"כנף ימנית","condition":"חליפי", "supplier":"…","unit_price":…, "catalog_no":"…" }
Then a center-part line can safely link it via external_ref:"parts:abc123".
Invoice OCR: keep raw under helper.invoice.raw[]; map to centers by plate + user assignment; write merged values into center lines and set source:"invoice".
What Claude should do next (no breaking changes)
Add the schema types only (TS/JSDoc) + a lightweight validator (zod/yup) used by the damage-centers UI and by any writer before committing to helper.
Implement merge utility: applyCenterDelta(helper, delta) that:
upserts centers by center_id
upserts lines by their id (or creates new)
recomputes totals
updates audit.updated_at
UI fixes:
enforce stable IDs
per-line source badge (expertise/estimate/invoice)
mutual-center toggle (creates/assigns group_id)
auto-hide depreciation inputs per report type; always store 0.
Do not touch car card/Levi/floating screens.

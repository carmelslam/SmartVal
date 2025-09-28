Parts module and supabase :
The two level filtering logic: 
Here’s a clean, two-level filtering flow that matches your goal (end target = the part), without code.
Level 1 — Car filters (Make → Model → Year)
Purpose: shrink the dataset before any part search.
1. Make (יצרן)
* User picks “Audi”.
* Backend filters rows where make = 'Audi' (or canonical ‘אאודי’ if you store Hebrew).
* Optional: show a model list based on what actually exists for Audi (faceted list).
1. Model (דגם)
* User picks “A6”.
* Backend further narrows to model = 'A6' (or matches synonyms via your dictionary table).
* Optional: if you don’t have a clean model column yet, use the normalized model you extract from catnumdesc.
1. Year (שנה)
* User picks “2010”.
* Filter to rows where year_from ≤ 2010 ≤ year_to.
* If you haven’t split years yet, temporarily match the catnumdesc year pattern; long-term store year_from/year_to.
Result of Level 1: a subset of rows relevant to Audi A6 (2010).(You can display how many rows remain and offer quick facets like “סוג חלק” (part family), “צד” (ימין/שמאל), etc.)
Level 2 — Part filters (name/type/side/position)
Purpose: find the exact part(s) within the Level-1 subset.
1. Part name / intuitive text (e.g., “כנף שמאל”, “איתות מראה”, “פנס אחורי”)
* User types free text.
* Search only within the filtered subset from Level 1.
* Use your normalized signals:
    * part_family (e.g., light/mirror/panel)
    * position (קדמי/אחורי/כנף/מראה)
    * side (ימין/שמאל)
    * plus free-text match against catnumdesc
* Return ranked suggestions (top 10–20), then full list below.
1. Side / Position quick facets (optional but powerful)
* Chips/toggles for: “שמאל/ימין”, “קדמי/אחורי/דלת/כנף/מראה”.
* These facets further filter the Level-1 subset before the free-text match (or combined).
1. Pcode/OEM (if present)
* If user pastes a Pcode or OEM, you can jump directly to exact matches within the Level-1 subset; if none, broaden to all makes/models with a warning (“match outside current vehicle”).
How the UI behaves (simple + fast)
* Cascading filters: Make → Model → Year are dependent; each selection trims the next list to real options from the DB (no dead choices).
* Typeahead for part text: runs only on the already-filtered subset; debounce ~300–400 ms so it feels instant.
* Result list: always shows Pcode, price, CatNumDesc, and OEM (if any). Let users click through to supplier (Pcode) or copy OEM.
How the DB makes this work (normalization + speed)
* Store/maintain these normalized columns and/or a materialized search view:
    * make (canonical)
    * model (canonical; synonyms go in a dictionary table)
    * year_from, year_to
    * part_family (e.g., light, mirror, panel)
    * position (קדמי/אחורי/כנף/מראה/דלת…)
    * side (ימין/שמאל)
    * oem (nullable)
    * catnumdesc (raw, always kept)
* Keep a raw → normalized parser (trigger or scheduled job) that fills these fields from catnumdesc.
* Add indexes so each step is instant (make/model/year composite; trigram/unaccent for Hebrew free-text on catnumdesc; simple indexes on side, part_family, position).
Ranking logic (so suggestions feel smart)
When showing part suggestions inside Level-2:
1. Exact facet matches first (side/position/family if selected)
2. Exact text hits in oem / pcode
3. Text hits in normalized keywords (model synonyms, part keywords)
4. Trigram similarity against catnumdesc
Edge cases & safeguards
* Generations/Facelifts (e.g., A6 C6 vs C7): handle via model_variant or by keeping body codes (C6/C7) in your model dictionary so “A6 2010” maps reliably.
* Missing years: if a row lacks years, include it but badge as “year unknown” (don’t hide possibly valid items).
* Multiple models per row: allow a link table (part_models) or store array in a models[] column; Level-1 filters still work.
* Empty results: auto-widen year by ±1–2 and surface a hint (“expanded to 2009–2011”).
What the UI actually “sends”
* Step 1 (Make): { make: "Audi" }
* Step 2 (Model): { make: "Audi", model: "A6" }
* Step 3 (Year): { make: "Audi", model: "A6", year: 2010 }
* Step 4 (Part text + facets):{ make: "Audi", model: "A6", year: 2010, q: "כנף שמאל", side: "שמאל", position: "כנף" }
The UI doesn’t translate anything. The DB normalization ensures these simple parameters hit the right rows.
If you want, I can outline the exact normalized fields and facet values (Hebrew labels + canonical tokens) so your parser and dictionaries are aligned from day one.

complete, implementation-ready plan 
This plan keeps one unified serving table(fast), while still letting you add supplier-specific parsers as needed. I’m giving you:
* Purpose & flow
* UI payload and how it’s interpreted (no UI changes)
* Data model (unified table + optional raw staging)
* Normalization method (DB-side parsing, dictionaries)
* Search method (RPC + indexes + MV)
* Two runtime methods (Direct UI→Supabase, UI→Make.com→Supabase)
* SQL you can run
* Repo file layout (what to add where)
* Rollout & maintenance

🎯 Purpose (what this system does)
* Accept the UI payload as-is (plate, make, model, trim, year, engine fields, VIN, free text).
* Normalize diverse supplier catalog rows into standard fields by parsing catnumdesc.
* Search across ~1M rows instantly using proper indexes.
* Return one merged list of parts with supplier_name, pcode, price, catnumdesc, oem, etc.
* Keep future growth simple: add suppliers by loading raw data + parser; everything still lands in the one unified table.

🧾 UI → DB: what gets sent and what we use
UI sends (unchanged):
* plate (optional), make, model, trim, year
* engine_volume, engine_code, engine_type (may be empty)
* vin (optional)
* q (free text, e.g., “כנף שמאל”)
* (optional) supplier_id / supplier_name
DB uses what it can reliably match in the unified table:
* Level 1 (vehicle narrowing): make, model, year
* Level 2 (part narrowing): q (free text), side, position, part_family, oem, pcode
* Extras (VIN/engine) are ignored for catalog search unless you later add sources that support them

🗃️ Data model
1) Unified serving table (searches hit this)
parts_normalized — one table for all suppliers.
Key columns (canonical):
* id BIGSERIAL PK
* supplier_id TEXT, supplier_name TEXT
* pcode TEXT (supplier stock key)
* oem TEXT NULL
* make TEXT
* model TEXT NULL
* year_from INT NULL, year_to INT NULL
* trim TEXT NULL
* side TEXT NULL CHECK (side IN ('ימין','שמאל'))
* position TEXT NULL -- e.g., 'קדמי','אחורי','כנף','דלת','מראה'
* part_family TEXT NULL -- e.g., 'light','mirror','panel','reflector'
* price NUMERIC(12,2) NULL
* catnumdesc TEXT -- raw, always stored
* quality_flag TEXT NULL -- e.g., 'חליפי','OEM','משופץ'
* updated_at TIMESTAMPTZ DEFAULT now()
Optional: later convert to partitioned by supplier_id if you grow past ~5–10M rows.
2) Optional raw staging (per supplier)
If/when a supplier’s PDF/CSV has unique columns or re-ingestion needs isolation:
* raw_supplier_<code> with native columns
* A supplier-specific parser fills/updates parts_normalized
(If you already ingest straight to parts_normalized, that’s fine; keep this as a future option.)
3) Dictionaries (for stable matching)
* dict_makes(synonym, canonical)
* dict_models(synonym, canonical, body_code NULL) — e.g., A6, C6/C7
* dict_parts(cue, side NULL, position NULL, part_family NULL) — maps Hebrew cues to facets
* dict_year_patterns(pattern, year_from, year_to) — e.g., '016-018' → 2016–2018
These keep parsing rules centralized and independent of the UI.

🧪 Normalization method (DB-side)
* Parser function (parse_catnumdesc(...)) uses regex + dictionaries to extract:
    * oem, model, year_from/to, trim, side, position, part_family
* Upserts into the unified table.
* Trigger on insert/update or nightly batch to re-parse rows (your choice).

🔎 Search method
* Single RPC: search_parts(payload JSONB)
    * Consumes the UI payload as-is
    * Applies Level-1 filters (make→model→year) against normalized columns
    * Applies Level-2 filters (q/side/position/part_family/oem/pcode)
    * Ranks results (exact fields > OEM/Pcode > trigram similarity on catnumdesc)
    * Paginates (cursor recommended)
    * Returns a unified list across all suppliers with supplier_name
* Indexes:
    * B-tree: (make), (model), (year_from, year_to), (supplier_id), (oem), (pcode), (side), (position), (part_family)
    * GIN trgm on unaccent(lower(catnumdesc)) (for Hebrew free-text)
* (Optional) Materialized View parts_search_mv:
    * Precompute a normalized search_text and join dictionary hints
    * Refresh per supplier load, or on schedule

🛠️ SQL — run these (safe to paste in migrations)
0) Extensions
create extension if not exists pg_trgm;
create extension if not exists unaccent;
1) Unified table
create table if not exists parts_normalized (
  id bigserial primary key,
  supplier_id text not null,
  supplier_name text not null,
  pcode text not null,
  oem text null,
  make text not null,
  model text null,
  year_from int null,
  year_to int null,
  trim text null,
  side text null check (side in ('ימין','שמאל')),
  position text null,
  part_family text null,
  price numeric(12,2) null,
  catnumdesc text not null,
  quality_flag text null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_parts_supplier on parts_normalized(supplier_id);
create index if not exists idx_parts_make on parts_normalized(lower(make));
create index if not exists idx_parts_model on parts_normalized(lower(model));
create index if not exists idx_parts_years on parts_normalized(year_from, year_to);
create index if not exists idx_parts_oem on parts_normalized(lower(oem));
create index if not exists idx_parts_pcode on parts_normalized(pcode);
create index if not exists idx_parts_side on parts_normalized(side);
create index if not exists idx_parts_position on parts_normalized(position);
create index if not exists idx_parts_family on parts_normalized(part_family);

-- Expression GIN index for Hebrew free text
create index if not exists idx_parts_catnumdesc_trgm
on parts_normalized using gin ((unaccent(lower(catnumdesc))) gin_trgm_ops);
2) Dictionaries (skeletons)
create table if not exists dict_makes (
  synonym text primary key,
  canonical text not null
);

create table if not exists dict_models (
  synonym text primary key,
  canonical text not null,
  body_code text null
);

create table if not exists dict_parts (
  cue text primary key,     -- e.g., 'פנס אח' שמ''
  side text null,           -- 'ימין' / 'שמאל'
  position text null,       -- 'קדמי','אחורי','כנף','דלת','מראה', etc.
  part_family text null     -- 'light','mirror','panel','reflector', etc.
);

create table if not exists dict_year_patterns (
  pattern text primary key,         -- e.g., '016-018'
  year_from int not null,
  year_to int not null
);
3) Canonicalization helpers (examples)
-- Map make to canonical
create or replace function canon_make(t text)
returns text language sql immutable as $$
  select coalesce( (select canonical from dict_makes where lower(synonym)=lower(t)), t );
$$;

-- Short year pattern like '016-018' → 2016–2018
create or replace function parse_year_range(t text)
returns int[] language plpgsql immutable as $$
declare
  y int[] := array[null::int, null::int];
begin
  -- dictionary first
  select array[year_from, year_to] into y
  from dict_year_patterns where pattern = t;
  if y is not null then return y; end if;

  -- generic patterns: '08-10', '2009-2013', '016-018'
  if t ~ '^\d{2,3}-\d{2,3}$' then
    -- expand heuristically
    return array[
      case when length(split_part(t,'-',1))=2 then 2000 + split_part(t,'-',1)::int
           when length(split_part(t,'-',1))=3 then 2000 + split_part(t,'-',1)::int
           else split_part(t,'-',1)::int end,
      case when length(split_part(t,'-',2))=2 then 2000 + split_part(t,'-',2)::int
           when length(split_part(t,'-',2))=3 then 2000 + split_part(t,'-',2)::int
           else split_part(t,'-',2)::int end
    ];
  end if;
  return y;
end;
$$;
4) Parser (example skeleton; refine as you see patterns)
create or replace function parse_catnumdesc(desc_in text)
returns table(oem text, model text, year_from int, year_to int, trim text, side text, position text, part_family text)
language plpgsql stable as $$
declare
  t text := unaccent(lower(desc_in));
  m text;
  y text;
  yrs int[];
  o text;
begin
  -- OEM: last alphanumeric block of len 8–14 (heuristic)
  select regexp_match(t, '([a-z0-9]{8,14})$') into o;
  if o is not null then o := o[1]; end if;

  -- Year range: look for 'nn-nn' or 'nnn-nnn'
  select regexp_match(t, '(\d{2,3}-\d{2,3})') into y;
  if y is not null then
    yrs := parse_year_range(y[1]);
  end if;

  -- Model: look for known body codes or words from dict_models
  select canonical into m
  from dict_models
  where t like '%' || lower(synonym) || '%'
  limit 1;

  -- Parts cues → side/position/part_family
  select side, position, part_family
  from dict_parts
  where t like '%' || lower(cue) || '%'
  limit 1
  into side, position, part_family;

  return query
  select o, m, coalesce(yrs[1], null), coalesce(yrs[2], null), null::text, side, position, part_family;
end;
$$;
5) Upsert helper (normalize a batch)
-- Example: normalize existing rows that have only make/pcode/price/catnumdesc/supplier fields
create or replace procedure normalize_batch()
language plpgsql as $$
declare
  r record;
  o text; m text; y1 int; y2 int; tr text; s text; p text; f text;
begin
  for r in
    select id, catnumdesc from parts_normalized
    where model is null or (year_from is null and year_to is null) or oem is null
  loop
    select * into o, m, y1, y2, tr, s, p, f from parse_catnumdesc(r.catnumdesc);
    update parts_normalized
    set oem = coalesce(o, oem),
        model = coalesce(m, model),
        year_from = coalesce(y1, year_from),
        year_to = coalesce(y2, year_to),
        trim = coalesce(tr, trim),
        side = coalesce(s, side),
        position = coalesce(p, position),
        part_family = coalesce(f, part_family),
        updated_at = now()
    where id = r.id;
  end loop;
end;
$$;
6) RLS (read-only public search)
alter table parts_normalized enable row level security;

-- Public READ policy (only SELECT)
create policy parts_public_select on parts_normalized
for select using (true);
7) Search RPC (payload as-is → ranked results)
create or replace function search_parts(payload jsonb)
returns table (
  id bigint,
  supplier_name text,
  pcode text,
  oem text,
  make text,
  model text,
  year_from int,
  year_to int,
  trim text,
  side text,
  position text,
  part_family text,
  price numeric,
  catnumdesc text
) language sql stable as $$
  with params as (
    select
      lower(coalesce(payload->>'make','')) as make,
      lower(coalesce(payload->>'model','')) as model,
      (payload->>'year')::int as year,
      lower(coalesce(payload->>'q','')) as q,
      lower(coalesce(payload->>'side','')) as side,
      lower(coalesce(payload->>'position','')) as position,
      lower(coalesce(payload->>'part_family','')) as part_family,
      nullif(lower(coalesce(payload->>'oem','')), '') as oem,
      nullif(payload->>'pcode','') as pcode
  ),
  base as (
    select pn.*
    from parts_normalized pn, params p
    where
      (p.make = '' or lower(pn.make) = canon_make(p.make))
      and (p.model = '' or lower(pn.model) = p.model)
      and (p.year is null or (pn.year_from is not null and pn.year_to is not null and pn.year_from <= p.year and pn.year_to >= p.year))
      and (p.side = '' or lower(pn.side) = p.side)
      and (p.position = '' or lower(pn.position) = p.position)
      and (p.part_family = '' or lower(pn.part_family) = p.part_family)
      and (p.oem is null or lower(pn.oem) like '%'||p.oem||'%')
      and (p.pcode is null or pn.pcode = p.pcode)
  ),
  scored as (
    select
      b.*,
      -- rank: exact OEM/Pcode > facet matches > trigram text match
      (case when (select oem from params) is not null and lower(b.oem) like '%'||(select oem from params)||'%' then 100 else 0 end) +
      (case when (select pcode from params) is not null and b.pcode = (select pcode from params) then 100 else 0 end) +
      (case when (select q from params) <> '' and unaccent(lower(b.catnumdesc)) % unaccent((select q from params)) then
            10 + similarity(unaccent(lower(b.catnumdesc)), unaccent((select q from params))) * 10
            else 0 end) as score
    from base b
  )
  select
    id, supplier_name, pcode, oem, make, model, year_from, year_to, trim, side, position, part_family, price, catnumdesc
  from scored
  where (select q from params) = '' or unaccent(lower(catnumdesc)) % unaccent((select q from params))
  order by score desc, price nulls last, id
  limit 50
$$;
This RPC is stable (cache-friendly) and uses trigram similarity when q is present.

🚦 Two runtime methods
Method 1 — Direct UI → Supabase (default)
* UI sends the full payload to rpc.search_parts(payload)
* Supabase returns ranked, paginated results
* Fastest, fewer moving parts
Method 2 — UI → Make.com → Supabase → UI (fallback / enrichment)
* UI posts the same payload to a Make webhook
* Scenario calls:
    * Supabase RPC search_parts
    * Optional vendor APIs (shipping ETA, stock)
    * Aggregates/annotates results
* Returns normalized list to UI
Use Method 2 only when you need multi-source enrichment, batch exports, or extra logic not worth embedding in SQL.

📁 Repo layout (what to add)
/docs
  └─ data-normalization.md          # explains flow, dictionaries, parser behavior, edge cases

/sql
  ├─ 000_exts.sql                   # pg_trgm, unaccent
  ├─ 010_tables_core.sql            # parts_normalized + indexes
  ├─ 020_dicts.sql                  # dict_* tables + initial seeds (CSV/SQL)
  ├─ 030_funcs_parse.sql            # parse_year_range, canon_make, parse_catnumdesc
  ├─ 040_procs_jobs.sql             # normalize_batch(), optional triggers
  ├─ 050_rpc_search.sql             # search_parts(payload)
  └─ 099_rls.sql                    # RLS + public SELECT policy

/supabase/migrations                # copy sql files here in order (if using supabase CLI)

/supabase/functions (optional)
  └─ enrich_parts/                  # edge function if you ever need private enrichment

/src/lib
  └─ supabaseClient.js              # your existing client (env vars only)

/src/services
  └─ search.ts                      # thin wrapper calling rpc.search_parts(payload)

/.env.example
README.md                           # quick start: migrate, seed dicts, test RPC

🚀 Rollout plan (safe & incremental)
1. Run /sql/000_exts.sql and /sql/010_tables_core.sql.
2. Load initial data into parts_normalized (you already have 50k).
3. Add dictionaries (/sql/020_dicts.sql) with minimal seeds (you can grow them later).
4. Create parser & helpers (/sql/030_funcs_parse.sql).
5. Backfill normalization once (/sql/040_procs_jobs.sql → call normalize_batch();).
6. Add RLS (/sql/099_rls.sql) if you want public read.
7. Add RPC (/sql/050_rpc_search.sql).
8. Point UI to rpc.search_parts(payload) — no UI changes beyond calling this.
9. (Optional) Schedule nightly call normalize_batch(); or add a trigger if you ingest daily.

🧰 Maintenance & performance
* ANALYZE after bulk loads.
* If latency creeps up: verify the trgm index is used for q queries; ensure your WHERE uses normalized columns.
* Scale compute tier if needed; 1M rows is routine with these indexes.
* When total rows > ~5–10M or one supplier > ~1–2M, consider partitioning parts_normalized by supplier_id (LIST partitions). You can do this later without changing the UI.

✅ What you get
* One table that answers all searches quickly at 1M rows.
* UI unchanged; DB does parsing, normalization, ranking.
* Supplier flexibility: you can still add supplier-specific parsers; everything lands in the unified schema.
* Two methods supported: direct + Make.com enrichment, same payload.
If you want, I can turn these SQL blocks into ordered migration files and a sample seed for the dictionaries using your most common makes/models/part cues so you can run it verbatim.

One-Page Implementation Brief 
* Centralize all suppliers into one normalized search surface that the UI queries with its unchanged payload.
* DB does parsing + normalization + ranking; UI only sends filters and renders results.
* Scales to ≥1M rows with sub-second searches.
Inputs (UI → DB)
UI sends JSON payload (exact fields may be empty):
{
  "plate": "...",
  "make": "...",
  "model": "...",
  "trim": "...",
  "year": 2010,
  "engine_volume": "...",
  "engine_code": "...",
  "engine_type": "...",
  "vin": "...",
  "q": "כנף שמאל",
  "side": "שמאל",
  "position": "כנף",
  "part_family": "light|mirror|panel|...",
  "oem": "optional",
  "pcode": "optional",
  "supplier_id": "optional",
  "page_cursor": "optional"
}
Output (DB → UI)
List of parts (merged across suppliers), ranked, paginated:
{
  "items": [
    {
      "id": 12345,
      "supplier_id": "mpines",
      "supplier_name": "M Pines",
      "pcode": "DEP01730861",
      "oem": "7J0945095CG",
      "make": "Audi",
      "model": "A6",
      "year_from": 2008,
      "year_to": 2011,
      "trim": null,
      "side": "שמאל",
      "position": "כנף",
      "part_family": "panel",
      "price": 389.90,
      "catnumdesc": "פנס אח' שמ' ...",
      "updated_at": "2025-06-01T10:00:00Z"
    }
  ],
  "next_cursor": "opaque_string_or_null"
}

Decisions to Lock (you/PM)
1. Deduping across suppliers:
    * Default: no dedupe, show all offers.
    * Optional: group by {oem, make, model, year_range, side, position} and show “best price” + “N offers”.→ Pick one (you can add the other later).
2. Refresh model for normalization:
    * Trigger on insert/update or nightly job.→ Pick one (my default: nightly batch; triggers only if you need near-real-time).
3. Partitioning:
    * Start non-partitioned; switch to LIST partitioning by supplier_id if total rows > 5–10M or autovacuum lags.→ Accept this threshold.
If you accept the defaults above, no blocker remains.

Completions : 
A) Acceptance Criteria (clear DONE signals)
* ✅ UI calls one RPC search_parts(payload) with the payload above.
* ✅ Results return in ≤ 500 ms p95 for common filters (Make/Model/Year + q), ≤ 900 ms p95 for heavy free-text.
* ✅ Catalog size ≥1M rows supported with current compute tier + indexes.
* ✅ All rows include supplier_name, pcode, price, catnumdesc, and any available normalized fields.
* ✅ RLS allows read-only public SELECT (or authenticated—state which).
* ✅ Dictionary tables exist and can be edited without code deploys.
* ✅ Backfill job populated normalized fields for existing rows.
* ✅ Observability dashboards show: query p95, rows scanned vs. returned, MV refresh status.
B) API Contract (RPC)
* Function name: search_parts(payload JSONB)
* Required fields: none (empty payload returns top ranked within a safe default)
* Pagination: cursor (opaque next_cursor) or limit+offset (prefer cursor)
* Sorting: internal rank (OEM/Pcode hits > facet matches > trigram), then price asc, then id
* Error modes: returns empty list on no match; never throws on unknown fields
C) Test Plan (agent can run as checklist)
1. Seed: load 10k rows (2+ suppliers) with known patterns.
2. Index sanity: EXPLAIN shows index scans; trigram used on q.
3. Search happy paths:
    * Make→Model→Year narrowing.
    * Free text “כנף שמאל” inside narrowed set.
    * OEM exact and partial.
    * Pcode exact.
4. Edge cases:
    * Missing years: still returns rows with badge “year unknown”.
    * Synonyms: “אאודי” == “Audi”.
    * Year shorthand 016-018 expands to 2016–2018.
5. Performance:
    * p95 latency under stated targets on 1M synthetic rows.
6. RLS:
    * Anonymous can SELECT; cannot INSERT/UPDATE/DELETE.
7. Regression:
    * Re-run after dictionary change; results stable/improved.
8. MV refresh (if used):
    * Refresh after supplier batch; search results reflect new data.
D) Monitoring & Ops
* Log RPC latency and result counts.
* Track MV refresh time and last success timestamp.
* Weekly VACUUM (ANALYZE) after large ingests.
* Alert if RPC p95 > 900 ms over 5 minutes.

Deliverables Your Agent Should Produce
1. SQL migrations (ordered):
    * 000_exts.sql — enable pg_trgm, unaccent.
    * 010_parts_normalized.sql — unified table + indexes.
    * 020_dicts.sql — create dict_makes, dict_models, dict_parts, dict_year_patterns (+ minimal seeds).
    * 030_parse_funcs.sql — canon_make, parse_year_range, parse_catnumdesc (skeleton).
    * 040_normalize_job.sql — normalize_batch() and (if chosen) trigger or scheduled job.
    * 050_rpc_search.sql — search_parts(payload).
    * 099_rls.sql — enable RLS + read policy.
2. Docs:
    * /docs/data-normalization.md — how parsing works, how to edit dictionaries, examples.
    * /docs/search-api.md — RPC spec, payload examples, cursor rules.
    * /docs/ops.md — refresh cadence, analyze/vacuum, monitoring KPIs.
3. Seeds (CSV or SQL):
    * dict_makes: Audi/אאודי, BMW/ב.מ.וו, Volkswagen/פולקסווגן, Ford/פורד, etc.
    * dict_models: A6/C6,C7; X5/E70; Transporter/T5; Fiesta; etc.
    * dict_parts: cues mapping common Hebrew phrases to side/position/family (e.g., “פנס אחורי שמאל” → side=שמאל, position=אחורי, family=light).
    * dict_year_patterns: at least the common short patterns you observed (e.g., 09-13, 016-018).
4. Ops Scripts (optional):
    * A SQL or Edge Function to run normalize_batch() after each supplier import.
    * A small admin page or SQL snippets to edit dictionary rows safely.

Setup Depth (quick execution order)
1. Run migrations 000 → 010 → 020 → 030 → 040 → 050 → 099.
2. Load your existing 50k rows into parts_normalized (minimum fields: supplier_id, supplier_name, pcode, make, price, catnumdesc, updated_at).
3. Execute call normalize_batch();
4. Point UI to call rpc.search_parts(payload) with the full payload it already sends.
5. Verify acceptance criteria with the test plan.
6. (Optional) Add MV later if you want extra headroom; otherwise your indexes + trigram are enough at 1M.

Final verdict
* Nothing critical is missing.
* The added acceptance criteria, API contract, test plan, and dictionary seeds list were the only gaps for a zero-dialogue handoff.
* Give this to your agent and say: “Implement exactly as written. Use nightly normalize job, no dedupe, non-partitioned. Report p95 < 500 ms. Then we’ll iterate on dedupe and MV.”
If you want, I can also produce the exact dictionary seed lists for makes/models/part cues you encounter most (Hebrew), so your agent has copy-paste seeds for day 1.

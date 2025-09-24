Context (short):
In the system UI the helper = case (a large JSON that drives all pages/modals). Make.com orchestrations exist and currently write back to the app helper and to OneDrive. I’m introducing Supabase as primary state + backup without breaking UI mappings.
Non-negotiables & rules:
Do not change the helper structure or field names. The UI must keep reading/writing the same helper JSON.
Phase 1: Shadow Mirror. Keep current flow (Make updates app helper). Additionally, save the full helper JSON in Supabase as a versioned record per case.
Phase 2+: Single-Writer per module. Gradually switch modules so Make writes helper JSON into Supabase; the app loads from Supabase (Realtime or refetch). Must be reversible via feature flags.
Plate policy: Plate is immutable and the business key for discovery. A plate can have multiple cases over time (historical/closed). Use a stable case_id (UUID) as the FK so satellites (files, invoices, parts results) tie to the correct case instance. Optionally enforce “one active case per plate”.
Security: Use Supabase Auth for login (magic link/OTP or password). Keep RLS permissive initially; Make uses service role.
Realtime: I need instant UI updates when case_helper (and later files/invoices) change. Use Supabase Realtime subscriptions; make sure the tables are in the supabase_realtime publication.
Knowledge hub: Centralized table(s) for docs/notes with tags; later we may add embeddings. The “knowledge agent” in Make talks to Supabase via a Gateway sub-scenario.
Your tasks:
Propose a minimal, future-proof schema for Supabase:
Core tables and satellites (you propose). Expect: case catalog, versioned helper JSON store, file index, parts search pool, invoices+lines, knowledge docs, audit, reminders, profiles/orgs for Auth.
Explain briefly why each table exists and which can be deferred.
Suggest indexes/uniques and a partial unique for “one active case per plate”.
Generate SQL migrations (Postgres/Supabase) in /supabase/migrations/:
Extensions; Auth support tables (profiles, orgs, user_orgs, simple roles), cases, case_helper (jsonb, versioned, single current per case), satellites.
Enable RLS with permissive starter policies (tighten later).
Add GIN indexes for likely JSON paths (your suggestion).
Ensure Realtime works: add affected tables to the supabase_realtime publication.
Provide exact Supabase CLI steps to apply migrations (supabase login/link/migration new/db push).
Make “Gateway” sub-scenario spec (no UI clicks, just spec):
Ops: case.upsert, case_helper.save_full, case_helper.get_current, case_helper.restore_latest, files.upsert, parts_results.bulk_upsert, invoices.upsert, invoice_lines.bulk_upsert, kb.add, kb.search (keyword to start).
For each op: REST endpoint, headers, request/response, idempotency key.
Standard headers:
Authorization: Bearer {{SUPABASE_SERVICE_ROLE}}
apikey: {{SUPABASE_SERVICE_ROLE}}
Content-Type: application/json
Prefer: return=representation
Auth/RLS plan:
Supabase Auth (email OTP or magic link).
profiles(user_id, name, role, org_id); optional orgs + user_orgs.
Starter RLS policies (read/write within same org or permissive single-org mode).
Realtime integration plan:
Which tables to subscribe to initially (case_helper required; optionally files, invoices).
Event filters and recommended payload handling (refetch vs. use new row).
Cutover checklist tailored to this design:
Shadow Mirror first → pilot Single-Writer on Vehicle details (flagged) → expand.
Options for “instant” UI updates: Realtime vs refetch-on-done from Make.
Where to trigger Make from DB changes (DB trigger/Edge Function → Make webhook) vs scheduled pull.
Clarifying questions that affect schema:
Multi-tenant now or later (do we need org_id today)?
Which helper paths are queried most (to propose JSON indexes)?
Which Drive tracking sheets must stay in sync (names/columns)?
Which events must be instant to Make (e.g., invoice saved)?
Preferred Auth method (magic link vs password) and admin roles.
Assumptions (unless I say otherwise):
Single org for now; RLS permissive starter policies.
App reads with anon key, writes via app or Make; Make uses service role.
Helper JSON is saved whole in case_helper.helper_json per change (increment version), and exactly one is_current=true row per case.
Satellites likely include: files, parts_search_results, invoices + invoice_lines, kb_docs; but you propose.
Deliverables format:
Schema proposal (brief rationale).
Migration files (filenames + full SQL).
CLI commands.
Gateway spec (ops, endpoints, payloads).
Cutover checklist.
Questions list.
Aim for pragmatic minimalism: start with cases + versioned helper JSON + Auth/RLS + Realtime + kb_docs, add satellites incrementally, zero UI changes.
Add-on migration starter (Claude can extend)
Paste this as a starting migration; ask Claude to expand with profiles/orgs, Realtime publication, RLS, and satellites.
-- 00_extensions.sql
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create extension if not exists "uuid-ossp";

-- 01_auth_orgs_profiles.sql
-- Simple orgs & profiles for Supabase Auth
create table if not exists public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  role text default 'user',             -- 'user' | 'admin'
  org_id uuid references public.orgs(id),
  created_at timestamptz not null default now()
);

-- 02_core_cases_helper.sql
create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  plate text not null,
  owner_name text,
  status text default 'OPEN',
  org_id uuid references public.orgs(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.case_helper (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  version int not null,
  is_current boolean not null default true,
  helper_json jsonb not null,
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_case_helper_current
  on public.case_helper(case_id) where is_current = true;

create index if not exists ix_cases_plate on public.cases(plate);
create index if not exists ix_case_helper_case_version on public.case_helper(case_id, version desc);
create index if not exists ix_case_helper_json on public.case_helper using gin(helper_json jsonb_path_ops);

-- Realtime: ensure tables are in publication
alter publication supabase_realtime add table public.cases;
alter publication supabase_realtime add table public.case_helper;

-- RLS (starter, permissive)
alter table public.orgs enable row level security;
alter table public.profiles enable row level security;
alter table public.cases enable row level security;
alter table public.case_helper enable row level security;

create policy if not exists p_orgs_select on public.orgs for select using (true);
create policy if not exists p_profiles_select on public.profiles for select using (auth.uid() = user_id or exists (select 1));
create policy if not exists p_cases_select on public.cases for select using (true);
create policy if not exists p_cases_ins on public.cases for insert with check (true);
create policy if not exists p_cases_upd on public.cases for update using (true);

create policy if not exists p_ch_select on public.case_helper for select using (true);
create policy if not exists p_ch_ins on public.case_helper for insert with check (true);
create policy if not exists p_ch_upd on public.case_helper for update using (true);

-- 03_kb_docs.sql
create table if not exists public.kb_docs (
  id uuid primary key default gen_random_uuid(),
  title text,
  source text,
  lang text default 'he',
  tags text[],
  body text,
  org_id uuid references public.orgs(id),
  created_at timestamptz not null default now()
);
alter table public.kb_docs enable row level security;
create policy if not exists p_kb_sel on public.kb_docs for select using (true);
create policy if not exists p_kb_ins on public.kb_docs for insert with check (true);
alter publication supabase_realtime add table public.kb_docs;
Ask Claude to:
• add a partial unique on cases(plate) for active statuses if you want “one active case per plate”.
• add satellites (files, parts_search_results, invoices, invoice_lines) and include them in supabase_realtime if you want live updates.
• refine RLS later to use profiles.org_id when you’re ready.
Tiny checklist to give Claude too
Include Realtime subscription guidance: subscribe to case_helper (by case_id) and optionally files/invoices.
Include Auth wiring notes: app uses Supabase Auth; Make uses service role; optional shared secret on webhooks.
Include DB trigger → Make webhook pattern suggestion for “instant” Drive updates (or scheduled pull).

**Important:**
Base on you exposure to the system , the documentations, the helper instructions, todo.md and all the system architecture , suggest a valid supabase tables structure that really supports the systems functionality and features in large.


Supabase Integration Architecture — Documentation
Core Principle
The helper JSON = the case.
All case data (from inception through finalization) lives inside one canonical object called helper.
Documents, reports, and images are stored in Supabase Storage (and optionally mirrored to OneDrive), but the case meta is never fragmented.
Users can always fetch the helper, resume work, update, finalize, and the helper remains complete.
System Roles
Supabase (system of record)
Auth: user/role management with Row Level Security (RLS).
Postgres DB: structured tables for cases, helper, reports, documents, images, events.
Storage: private buckets for reports, originals, processed images, docs, and temp.
Edge Functions: mini APIs for ingest, helper load/save, report rendering, URL signing, finalization, OneDrive sync.
Realtime: broadcast updates (optional) for live collaboration.
Make.com (integration edge)
Inbound: fetch external data (Levi Yitzhak, government APIs, inbox files) → POST into Supabase via Edge Functions.
Outbound: send emails, SMS, WhatsApp messages with signed URLs; copy Supabase artifacts into user OneDrive folders.
Bridging: monitor OneDrive for user-added documents and register them in Supabase.
OneDrive (user-facing file cabinet)
Case folders exist for user convenience and daily work.
Contains mirrored reports, images, and ad-hoc documents (car license, driver license, invoices, etc.).
Files are registered in Supabase for indexing and linking, but OneDrive never holds the case logic.
VPS (rendering service)
Runs Gotenberg (HTML → PDF).
Called by Supabase Edge Functions for report generation.

Database Schema (key tables) - initial planning
cases (
  id uuid pk,
  plate text,
  owner_name text,
  status text,
  updated_at timestamptz
)

helper_state (
  case_id uuid pk fk→cases,
  helper jsonb not null,   -- entire case
  version int,
  updated_by uuid,
  updated_at timestamptz
)

helper_versions (
  id bigint pk,
  case_id uuid fk→cases,
  version int,
  helper jsonb,
  saved_by uuid,
  saved_at timestamptz
)

reports (
  id uuid pk,
  case_id uuid fk→cases,
  plate text,
  report_type text,
  version int,
  storage_key text,
  created_at timestamptz
)

docs (
  id uuid pk,
  case_id uuid fk→cases,
  category text,
  filename text,
  mime text,
  size bigint,
  storage_key text,        -- optional copy in Supabase
  onedrive_file_id text,
  onedrive_web_url text,
  checksum text,
  created_by text,
  created_at timestamptz
)

images (
  id uuid pk,
  case_id uuid fk→cases,
  original_key text,
  processed_key text,
  meta jsonb,
  created_at timestamptz
)

events (
  id bigint pk,
  actor text,
  type text,
  ref jsonb,
  created_at timestamptz
)
Storage Buckets (all private)
reports/ — final PDFs
originals/ — raw uploaded images
processed/ — watermarked/optimized images
docs/ — general user documents (car license, invoices, etc.)
temp/ — short-lived files
Edge Functions (catalog)
GET/PUT /case/{id}/helper
Fetch or replace the full helper JSON.
Uses optimistic concurrency via version.
Each save also writes an immutable record to helper_versions.
POST /ingest-external
Called by Make.com to push external data (scraped vehicle details, form uploads, etc.).
Function merges only the allowed subtree into helper.
POST /render-report
Accepts report HTML and metadata.
Calls Gotenberg → saves PDF into reports/.
Inserts reports row → returns signed URL.
POST /get-report
Fetches latest report for a plate/type.
Returns signed URL.
POST /sign-url
Generic short-lived signed URL for any storage key.
POST /update-helper
Scoped patch for helper (used internally and by Make).
POST /sync-onedrive (optional)
Triggered when new reports/docs are created.
Mirrors them into OneDrive case folders.
App Behavior
Helper lifecycle:
Load helper (by plate → case_id).
Work in UI with full JSON in memory.
Save = PUT helper + version check → increments version, writes helper_versions.
Resume anytime → fetch latest helper.
Conflicts → handled via version mismatch (409).
Reports:
Built from helper → HTML → Gotenberg → PDF in reports/.
Previewed in iframe using signed URL.
Shared as PDF via signed URL (short-lived).
Documents:
UI supports general uploads (plate, category dropdown, free text).
Stored in docs/ bucket + docs table.
Registered docs can be previewed via signed URLs.
Make mirrors selected docs into OneDrive case folders.
Images:
Upload to originals/.
Process into processed/ (resize, watermark, recognition).
Store metadata in images.meta.
Preview via signed URLs or UI gallery.
OneDrive Integration Pattern
Supabase → OneDrive (mirror):
When reports or processed images are created, Supabase events trigger Make to upload them into the correct OneDrive case folder.
OneDrive → Supabase (intake):
Make watches OneDrive case folders for new docs.
For each file: map to plate/case, compute checksum, classify category.
Register in docs table (with OneDrive file ID + URL).
Optional: copy binary into docs/ bucket for backup.
Security
RLS: enabled on all tables.
Buckets: private; clients only access via signed URLs or streaming Edge Functions.
Service role keys: used only by Edge Functions (never exposed to client).
Audit: all important operations log to events with actor, type, refs.
Migration Plan
Inventory existing Make scenarios → mark steps as External (keep in Make), Authoritative (migrate to Supabase), Rendering (move behind render-report).
Establish Supabase core: tables, buckets, Edge Functions (helper, reports, docs).
Dual-write: Make continues but also POSTs results to Supabase. Drive remains mirror/archive.
Switch app reads to Supabase only.
Trim Make: remove redundant internal logic, keep only ingestion + outbound.
Harden: add cleanup functions, indexes, monitoring.
Key Benefits
Single truth: helper JSON in Supabase, always complete.
Continuity: users can fetch, resume, update, finalize — no split-brain.
Flexibility: OneDrive remains for user comfort, but Supabase governs the system.
Security: private storage, signed links, RLS.
Scalability: Edge Functions handle rendering, ingestion, syncing without heavy Make automations.

Here’s a structured documentation-ready **summary of Supabase integration** based on everything we discussed:

---

# Supabase Integration Architecture — Documentation

## Core Principle

The **helper JSON = the case.**

* All case data (from inception through finalization) lives inside one canonical object called `helper`.
* Documents, reports, and images are stored in Supabase Storage (and optionally mirrored to OneDrive), but the **case meta is never fragmented**.
* Users can always fetch the helper, resume work, update, finalize, and the helper remains complete.

---

## System Roles

### Supabase (system of record)

* **Auth**: user/role management with Row Level Security (RLS).
* **Postgres DB**: structured tables for cases, helper, reports, documents, images, events.
* **Storage**: private buckets for reports, originals, processed images, docs, and temp.
* **Edge Functions**: mini APIs for ingest, helper load/save, report rendering, URL signing, finalization, OneDrive sync.
* **Realtime**: broadcast updates (optional) for live collaboration.

### Make.com (integration edge)

* **Inbound**: fetch external data (Levi Yitzhak, government APIs, inbox files) → POST into Supabase via Edge Functions.
* **Outbound**: send emails, SMS, WhatsApp messages with signed URLs; copy Supabase artifacts into user OneDrive folders.
* **Bridging**: monitor OneDrive for user-added documents and register them in Supabase.

### OneDrive (user-facing file cabinet)

* Case folders exist for user convenience and daily work.
* Contains mirrored reports, images, and ad-hoc documents (car license, driver license, invoices, etc.).
* Files are registered in Supabase for indexing and linking, but OneDrive never holds the case logic.

### VPS (rendering service)

* Runs **Gotenberg** (HTML → PDF).
* Called by Supabase Edge Functions for report generation.

---

## Database Schema (key tables)

```sql
cases (
  id uuid pk,
  plate text,
  owner_name text,
  status text,
  updated_at timestamptz
)

helper_state (
  case_id uuid pk fk→cases,
  helper jsonb not null,   -- entire case
  version int,
  updated_by uuid,
  updated_at timestamptz
)

helper_versions (
  id bigint pk,
  case_id uuid fk→cases,
  version int,
  helper jsonb,
  saved_by uuid,
  saved_at timestamptz
)

reports (
  id uuid pk,
  case_id uuid fk→cases,
  plate text,
  report_type text,
  version int,
  storage_key text,
  created_at timestamptz
)

docs (
  id uuid pk,
  case_id uuid fk→cases,
  category text,
  filename text,
  mime text,
  size bigint,
  storage_key text,        -- optional copy in Supabase
  onedrive_file_id text,
  onedrive_web_url text,
  checksum text,
  created_by text,
  created_at timestamptz
)

images (
  id uuid pk,
  case_id uuid fk→cases,
  original_key text,
  processed_key text,
  meta jsonb,
  created_at timestamptz
)

events (
  id bigint pk,
  actor text,
  type text,
  ref jsonb,
  created_at timestamptz
)
```

---

## Storage Buckets (all private)

* `reports/` — final PDFs
* `originals/` — raw uploaded images
* `processed/` — watermarked/optimized images
* `docs/` — general user documents (car license, invoices, etc.)
* `temp/` — short-lived files

---

## Edge Functions (catalog)

1. **`GET/PUT /case/{id}/helper`**

   * Fetch or replace the full helper JSON.
   * Uses optimistic concurrency via `version`.
   * Each save also writes an immutable record to `helper_versions`.

2. **`POST /ingest-external`**

   * Called by Make.com to push external data (scraped vehicle details, form uploads, etc.).
   * Function merges only the allowed subtree into `helper`.

3. **`POST /render-report`**

   * Accepts report HTML and metadata.
   * Calls Gotenberg → saves PDF into `reports/`.
   * Inserts `reports` row → returns signed URL.

4. **`POST /get-report`**

   * Fetches latest report for a plate/type.
   * Returns signed URL.

5. **`POST /sign-url`**

   * Generic short-lived signed URL for any storage key.

6. **`POST /update-helper`**

   * Scoped patch for helper (used internally and by Make).

7. **`POST /sync-onedrive`** (optional)

   * Triggered when new reports/docs are created.
   * Mirrors them into OneDrive case folders.

---

## App Behavior

* **Helper lifecycle:**

  * Load helper (by plate → case\_id).
  * Work in UI with full JSON in memory.
  * Save = PUT helper + version check → increments version, writes helper\_versions.
  * Resume anytime → fetch latest helper.
  * Conflicts → handled via version mismatch (409).

* **Reports:**

  * Built from helper → HTML → Gotenberg → PDF in `reports/`.
  * Previewed in iframe using signed URL.
  * Shared as PDF via signed URL (short-lived).

* **Documents:**

  * UI supports general uploads (plate, category dropdown, free text).
  * Stored in `docs/` bucket + `docs` table.
  * Registered docs can be previewed via signed URLs.
  * Make mirrors selected docs into OneDrive case folders.

* **Images:**

  * Upload to `originals/`.
  * Process into `processed/` (resize, watermark, recognition).
  * Store metadata in `images.meta`.
  * Preview via signed URLs or UI gallery.

---

## OneDrive Integration Pattern

* **Supabase → OneDrive (mirror)**:

  * When reports or processed images are created, Supabase events trigger Make to upload them into the correct OneDrive case folder.

* **OneDrive → Supabase (intake)**:

  * Make watches OneDrive case folders for new docs.
  * For each file: map to plate/case, compute checksum, classify category.
  * Register in `docs` table (with OneDrive file ID + URL).
  * Optional: copy binary into `docs/` bucket for backup.

---

## Security

* **RLS**: enabled on all tables.
* **Buckets**: private; clients only access via signed URLs or streaming Edge Functions.
* **Service role keys**: used only by Edge Functions (never exposed to client).
* **Audit**: all important operations log to `events` with actor, type, refs.

---

## Migration Plan

1. **Inventory** existing Make scenarios → mark steps as External (keep in Make), Authoritative (migrate to Supabase), Rendering (move behind `render-report`).
2. **Establish Supabase core**: tables, buckets, Edge Functions (`helper`, `reports`, `docs`).
3. **Dual-write**: Make continues but also POSTs results to Supabase. Drive remains mirror/archive.
4. **Switch app reads** to Supabase only.
5. **Trim Make**: remove redundant internal logic, keep only ingestion + outbound.
6. **Harden**: add cleanup functions, indexes, monitoring.

---

## Key Benefits

* **Single truth**: helper JSON in Supabase, always complete.
* **Continuity**: users can fetch, resume, update, finalize — no split-brain.
* **Flexibility**: OneDrive remains for user comfort, but Supabase governs the system.
* **Security**: private storage, signed links, RLS.
* **Scalability**: Edge Functions handle rendering, ingestion, syncing without heavy Make automations.


## Pragmatic Supabase Migration Plan - Starting with New Modules

building new modules directly in Supabase while gradually migrating existing ones. Here's a tailored plan:

### Phase 1: Parts Search & Invoices (New Modules) - Weeks 1-3

Since these don't exist yet, we build them Supabase-native:

```sql
-- 01_parts_module.sql
create table public.parts_search_sessions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id),
  plate text not null,
  search_context jsonb, -- damage centers, vehicle info
  created_by text,
  created_at timestamptz default now()
);

create table public.parts_search_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references parts_search_sessions(id),
  supplier text,
  search_query jsonb,
  results jsonb, -- array of parts
  response_time_ms int,
  created_at timestamptz default now()
);

create table public.parts_required (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id),
  damage_center_code text,
  part_number text,
  part_name text,
  manufacturer text,
  quantity int default 1,
  unit_price numeric(10,2),
  selected_supplier text,
  status text default 'PENDING', -- PENDING, ORDERED, RECEIVED
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 02_invoices_module.sql
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id),
  plate text not null,
  invoice_number text unique,
  invoice_type text, -- PARTS, LABOR, TOWING, OTHER
  supplier_name text,
  supplier_tax_id text,
  issue_date date,
  due_date date,
  status text default 'DRAFT', -- DRAFT, SENT, PAID
  total_before_tax numeric(10,2),
  tax_amount numeric(10,2),
  total_amount numeric(10,2),
  metadata jsonb,
  created_at timestamptz default now()
);

create table public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id) on delete cascade,
  line_number int,
  description text,
  part_id uuid references parts_required(id), -- optional link
  quantity numeric(10,2),
  unit_price numeric(10,2),
  discount_percent numeric(5,2),
  line_total numeric(10,2),
  metadata jsonb
);

-- Indexes for performance
create index idx_parts_case on parts_required(case_id);
create index idx_parts_status on parts_required(status);
create index idx_invoice_case on invoices(case_id);
create index idx_invoice_status on invoices(status);
```

### Phase 2: Helper Integration - Weeks 4-5

Embed helper as shadow storage first:

```sql
-- 03_helper_storage.sql
create table public.case_helper_mirror (
  case_id uuid primary key,
  plate text not null,
  helper_json jsonb not null,
  helper_size_bytes int,
  last_synced_from text, -- 'MAKE' or 'UI'
  last_synced_at timestamptz,
  version int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Store helper in chunks for better performance
create table public.case_helper_sections (
  case_id uuid,
  section_name text, -- 'vehicle', 'damage', 'valuation', etc.
  section_data jsonb,
  updated_at timestamptz default now(),
  primary key (case_id, section_name)
);

-- Sync tracking
create table public.helper_sync_log (
  id uuid primary key default gen_random_uuid(),
  case_id uuid,
  sync_direction text, -- 'TO_SUPABASE', 'FROM_SUPABASE'
  sync_status text, -- 'SUCCESS', 'FAILED', 'PARTIAL'
  sections_synced text[],
  error_details jsonb,
  created_at timestamptz default now()
);
```

### Phase 3: Tracking & Search Layer - Weeks 6-7

Build on top of helper data:

```sql
-- 04_tracking_search.sql
create table public.case_tracking (
  id uuid primary key default gen_random_uuid(),
  case_id uuid,
  plate text not null,
  event_type text, -- 'STATUS_CHANGE', 'PART_ORDERED', 'INVOICE_CREATED'
  event_data jsonb,
  actor text,
  created_at timestamptz default now()
);

-- Materialized view for fast searching
create materialized view case_search_index as
select 
  c.id as case_id,
  c.plate,
  c.owner_name,
  h.helper_json->>'status' as case_status,
  h.helper_json->'vehicle'->>'model' as vehicle_model,
  h.helper_json->'vehicle'->>'year' as vehicle_year,
  h.helper_json->'valuation'->>'total_loss' as total_loss,
  count(distinct p.id) as parts_count,
  count(distinct i.id) as invoice_count,
  h.updated_at as last_activity
from cases c
left join case_helper_mirror h on h.case_id = c.id
left join parts_required p on p.case_id = c.id
left join invoices i on i.case_id = c.id
group by c.id, c.plate, c.owner_name, h.helper_json, h.updated_at;

-- Refresh function
create or replace function refresh_search_index() returns void as $$
begin
  refresh materialized view concurrently case_search_index;
end;
$$ language plpgsql;
```

### Phase 4: Existing Modules (Levi, Vehicle Details) - Weeks 8-9

These already exist in Make.com, so we dual-write:

```sql
-- 05_existing_modules.sql
create table public.levi_reports (
  id uuid primary key default gen_random_uuid(),
  case_id uuid,
  plate text not null,
  report_id text unique, -- Levi's ID
  raw_response jsonb,
  parsed_data jsonb,
  report_url text,
  fetched_at timestamptz,
  created_at timestamptz default now()
);

create table public.vehicle_details (
  case_id uuid primary key,
  plate text not null,
  vin text,
  manufacturer text,
  model text,
  year int,
  engine_size int,
  color text,
  raw_data jsonb, -- Original from various sources
  enriched_data jsonb, -- After processing
  updated_at timestamptz default now()
);
```

### Migration Strategy for Existing System

#### Step 1: Make.com Dual-Write Pattern

```javascript
// In Make.com scenarios, add these modules:

// After saving to OneDrive/current system:
{
  "module": "HTTP Request",
  "name": "Mirror to Supabase",
  "url": "{{SUPABASE_URL}}/rest/v1/rpc/sync_helper",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer {{SUPABASE_SERVICE_KEY}}",
    "Content-Type": "application/json"
  },
  "body": {
    "case_id": "{{case_id}}",
    "helper_json": "{{helper}}",
    "source": "MAKE"
  },
  "continueOnError": true // Don't break existing flow
}
```

#### Step 2: Gradual UI Migration

```javascript
// Feature flags in your app
const FEATURE_FLAGS = {
  USE_SUPABASE_PARTS: true,      // New module
  USE_SUPABASE_INVOICES: true,   // New module
  USE_SUPABASE_HELPER: false,    // Start false, enable gradually
  USE_SUPABASE_TRACKING: false,  // Enable after helper
  USE_SUPABASE_LEVI: false       // Last to migrate
};

// Adapter pattern for gradual migration
class DataService {
  async getParts(caseId) {
    if (FEATURE_FLAGS.USE_SUPABASE_PARTS) {
      return await supabase
        .from('parts_required')
        .select('*')
        .eq('case_id', caseId);
    } else {
      return await makeWebhook.getParts(caseId);
    }
  }
  
  async saveHelper(caseId, helper) {
    // Always save to Make/OneDrive (current system)
    await makeWebhook.saveHelper(caseId, helper);
    
    // Additionally save to Supabase if enabled
    if (FEATURE_FLAGS.USE_SUPABASE_HELPER) {
      await supabase.rpc('sync_helper', {
        case_id: caseId,
        helper_json: helper,
        source: 'UI'
      });
    }
  }
}
```

### Admin & Dev Hubs Migration - Phase 5

```sql
-- 06_admin_dev_tools.sql
create table public.system_logs (
  id uuid primary key default gen_random_uuid(),
  log_level text, -- ERROR, WARN, INFO, DEBUG
  component text, -- MAKE_SYNC, UI, EDGE_FUNCTION
  message text,
  context jsonb,
  created_at timestamptz default now()
);

create table public.dev_test_cases (
  id uuid primary key default gen_random_uuid(),
  test_name text,
  test_data jsonb,
  expected_result jsonb,
  actual_result jsonb,
  status text, -- PASS, FAIL, PENDING
  created_at timestamptz default now()
);

-- Admin dashboard views
create view admin_system_health as
select 
  date_trunc('hour', created_at) as hour,
  count(*) filter (where log_level = 'ERROR') as errors,
  count(*) filter (where log_level = 'WARN') as warnings,
  count(*) as total_events
from system_logs
where created_at > now() - interval '24 hours'
group by hour
order by hour desc;
```

### OneDrive Sync Strategy

Since the system relies heavily on OneDrive, maintain it as a mirror:

```sql
-- 07_onedrive_sync.sql
create table public.onedrive_sync (
  id uuid primary key default gen_random_uuid(),
  case_id uuid,
  file_type text, -- REPORT, INVOICE, IMAGE, DOCUMENT
  supabase_path text,
  onedrive_path text,
  onedrive_item_id text,
  sync_status text, -- PENDING, SYNCED, FAILED
  last_synced_at timestamptz,
  created_at timestamptz default now()
);

-- Function to queue OneDrive sync
create or replace function queue_onedrive_sync(
  p_case_id uuid,
  p_file_type text,
  p_supabase_path text
) returns uuid as $$
declare
  v_sync_id uuid;
begin
  insert into onedrive_sync (
    case_id, file_type, supabase_path, sync_status
  ) values (
    p_case_id, p_file_type, p_supabase_path, 'PENDING'
  ) returning id into v_sync_id;
  
  -- Notify Make.com webhook
  perform pg_notify('onedrive_sync', json_build_object(
    'sync_id', v_sync_id,
    'case_id', p_case_id
  )::text);
  
  return v_sync_id;
end;
$$ language plpgsql;
```

### Cutover Checklist

```markdown
## Week 1-3: New Modules (Safe)
- [x] Deploy parts search tables
- [x] Deploy invoices tables
- [x] Build UI for parts/invoices using Supabase
- [x] Test with real cases
- [ ] No risk - these are new

## Week 4-5: Helper Shadow (Low Risk)
- [ ] Deploy helper mirror tables
- [ ] Add dual-write in Make.com
- [ ] Monitor sync success rate
- [ ] Compare helper versions
- [ ] Rollback: Just disable sync

## Week 6-7: Search & Tracking (Medium Risk)
- [ ] Deploy tracking tables
- [ ] Build search UI reading from Supabase
- [ ] Test search performance
- [ ] Rollback: Switch back to Make search

## Week 8-9: Existing Modules (High Risk)
- [ ] Dual-write Levi reports
- [ ] Dual-write vehicle details
- [ ] Test data consistency
- [ ] Gradual UI switchover
- [ ] Rollback: Feature flags

## Week 10: Full Migration
- [ ] Enable all Supabase features
- [ ] Monitor for 1 week
- [ ] Disable Make.com writes
- [ ] Keep Make for external integrations only
```

### Key Success Factors

1. **Start with new modules** - No migration risk
2. **Keep Make.com running** - It's your safety net
3. **Use feature flags** - Roll back instantly if needed
4. **Monitor everything** - Sync status, errors, performance
5. **OneDrive stays** - Users don't notice the backend change

This approach minimizes risk by starting with new functionality, maintaining the existing system as backup, and providing multiple rollback points throughout the migration.
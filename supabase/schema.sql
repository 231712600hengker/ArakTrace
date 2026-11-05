-- ArakTrace.bali: skema v2. Aman dijalankan ulang (idempotent), baik untuk database baru maupun upgrade dari v1.
-- Jalankan di SQL Editor Supabase sebelum `npm run seed`.
-- Semua nama/izin/nomor pita cukai pada data seed adalah TIRUAN (kolom is_demo = true).

create table if not exists cooperatives (
  id text primary key, name text not null, village text not null, regency text not null,
  permit_no text, region_code text not null check (region_code ~ '^[A-Z]{3}$'), legal_status text, contact text
);
alter table cooperatives add column if not exists is_demo boolean not null default true;

create table if not exists producers (
  id text primary key, name text not null, regency text not null,
  iui_no text, nppbkc_no text, izin_edar_no text, is_demo boolean not null default true
);

-- "Perajin" memakai alias (bukan nama orang) agar tidak memuat data pribadi.
create table if not exists farmers (
  id text primary key, cooperative_id text not null references cooperatives(id),
  alias text not null, village text not null, is_demo boolean not null default true
);

create table if not exists batches (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^ARK-[A-Z]{3}-[0-9]{4}-[0-9]{4}$'),
  cooperative_id text not null references cooperatives(id),
  sap_type text not null check (sap_type in ('aren', 'kelapa', 'lontar')),
  distillation_date date not null, volume_liters numeric not null,
  distill_temp_c numeric not null, distill_duration_min integer not null,
  equipment_sanitized boolean not null, lab_tested boolean not null, lab_note text not null default '',
  risk_score numeric, risk_label text, risk_factors jsonb, created_at timestamptz not null default now()
);
alter table batches add column if not exists farmer_id text references farmers(id);
alter table batches add column if not exists producer_id text references producers(id);
alter table batches add column if not exists lab_name text not null default '';
alter table batches add column if not exists lab_ethanol_pct numeric;
alter table batches add column if not exists lab_methanol_pct numeric;
alter table batches add column if not exists lab_report_source text check (lab_report_source in ('manual', 'ocr'));
alter table batches add column if not exists surat_jalan_no text;
alter table batches add column if not exists excise_band_no text;
alter table batches add column if not exists verification_status text not null default 'self_reported'
  check (verification_status in ('self_reported', 'verified', 'rejected'));
alter table batches add column if not exists verified_by text;
alter table batches add column if not exists verified_at timestamptz;
alter table batches add column if not exists verification_note text not null default '';
alter table batches add column if not exists is_demo boolean not null default true;

-- v3: batas harga (Pergub Pasal 9), penarikan produk, dan jumlah liter per tahap rantai.
alter table batches add column if not exists production_cost_per_liter numeric check (production_cost_per_liter is null or production_cost_per_liter > 0);
alter table batches add column if not exists purchase_price_per_liter numeric check (purchase_price_per_liter is null or purchase_price_per_liter > 0);
alter table batches add column if not exists recalled_at timestamptz;
alter table batches add column if not exists recall_reason text not null default '';

-- Rantai pasok: perajin -> koperasi -> produsen -> distributor -> sub distributor -> penjual langsung.
create table if not exists supply_events (
  id uuid primary key default gen_random_uuid(),
  batch_code text not null references batches(code) on delete cascade,
  step integer not null,
  actor_type text not null check (actor_type in ('perajin', 'koperasi', 'produsen', 'distributor', 'sub_distributor', 'penjual_langsung')),
  actor_name text not null, event text not null, event_date date not null,
  created_at timestamptz not null default now(),
  unique (batch_code, step)
);

alter table supply_events add column if not exists quantity_liters numeric check (quantity_liters is null or quantity_liters > 0);

create index if not exists batches_cooperative_id_idx on batches(cooperative_id);
create index if not exists batches_verification_idx on batches(verification_status);
create index if not exists supply_events_batch_idx on supply_events(batch_code);

-- Tabel lama dari v1 tidak dipakai lagi (verifikasi kini dihitung dari data batch).
drop table if exists verifications;

-- Row Level Security: tolak semua akses langsung dari klien (anon/authenticated).
-- Aplikasi mengakses data hanya lewat API server memakai service role (melewati RLS),
-- sehingga hak akses ditegakkan di kode server (lib/auth.ts dan lib/permissions.ts).
alter table cooperatives enable row level security;
alter table producers enable row level security;
alter table farmers enable row level security;
alter table batches enable row level security;
alter table supply_events enable row level security;

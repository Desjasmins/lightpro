-- Gate leads — NDA acceptance audit trail for the Lightpro OM estimation tool.
--
-- One row per NDA submission (immutable trail). The same email can produce many
-- rows over time as cookies expire and users re-accept.
--
-- Writes go through /api/gate using the service-role key. RLS is enabled with no
-- public policies so anon/authenticated keys (which we don't use) cannot read or
-- write the table.
--
-- Verification flow:
--   1. Visitor submits the NDA form → /api/gate inserts here with verification_code
--      + code_expires_at set, verified_at null.
--   2. Visitor confirms via OTP code (POST /api/gate/verify) or magic link
--      (GET /api/gate/verify?t=...) → verified_at gets set.
--   3. /estimation/tool only renders for cookies whose verified_at is non-null
--      (enforced implicitly: cookies are only minted after verification).

create extension if not exists "pgcrypto";

create table if not exists public.gate_leads (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null check (char_length(name) between 2 and 200),
  email               text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  organization        text check (organization is null or char_length(organization) <= 200),
  organization_type   text check (
    organization_type is null
    or organization_type in (
      'municipality',
      'city',
      'mrc',
      'engineering_firm',
      'public_agency',
      'consultant',
      'investor',
      'other'
    )
  ),
  lang                text not null check (lang in ('fr', 'en')),
  accepted_terms      boolean not null,
  accepted_at         timestamptz not null,
  terms_version       text not null,
  ip                  inet,
  user_agent          text,
  verification_code   text,
  code_expires_at     timestamptz,
  verified_at         timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists gate_leads_email_idx
  on public.gate_leads (lower(email));

create index if not exists gate_leads_created_at_idx
  on public.gate_leads (created_at desc);

-- Partial index: only pending (unverified) rows participate in code lookups.
create index if not exists gate_leads_verification_lookup_idx
  on public.gate_leads (lower(email), verification_code)
  where verified_at is null;

alter table public.gate_leads enable row level security;
-- No policies on purpose: only the service role bypasses RLS.

comment on table public.gate_leads is
  'NDA acceptance audit trail for the Lightpro OM estimation tool. Immutable per-submission rows. Service-role only.';

comment on column public.gate_leads.terms_version is
  'Frozen at insert time so historical acceptances stay tied to the exact NDA text they saw.';
comment on column public.gate_leads.verification_code is
  '6-char alphanumeric OTP (no 0/O/1/I/L). Cleared after first successful match.';
comment on column public.gate_leads.code_expires_at is
  'Hard expiry (insert time + 15 minutes).';
comment on column public.gate_leads.verified_at is
  'Set when the visitor confirms via code or magic link. Null = pending.';

-- ---------------------------------------------------------------------------
-- Estimation views — best-effort audit trail for "who opened the wizard and
-- when". Failures here must never break /estimation/tool.
-- ---------------------------------------------------------------------------

create table if not exists public.estimation_views (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid references public.gate_leads (id) on delete set null,
  email       text,
  ip          inet,
  user_agent  text,
  referer     text,
  viewed_at   timestamptz not null default now()
);

create index if not exists estimation_views_lead_idx
  on public.estimation_views (lead_id, viewed_at desc);

create index if not exists estimation_views_viewed_at_idx
  on public.estimation_views (viewed_at desc);

alter table public.estimation_views enable row level security;
-- No policies on purpose: only the service role bypasses RLS.

comment on table public.estimation_views is
  'Lightpro OM wizard view audit trail. Service-role only. Best-effort — failures must never break the wizard.';

-- Proposals table for client-facing proposal pages with Stripe payment links
create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  client_name text not null,
  client_company text,
  client_website text,
  prepared_date date not null default current_date,
  expires_at timestamp with time zone,
  status text not null default 'draft' check (status in ('draft', 'sent', 'viewed', 'accepted', 'expired')),

  -- Problem statement
  problem_text text not null,

  -- Phases stored as JSONB array
  -- Each: { name, title, description, items[], time_saved, setup_price_cents }
  phases jsonb not null default '[]'::jsonb,

  -- Retainer
  retainer_price_cents integer not null default 0,
  retainer_description text,

  -- Stripe payment links (created in Stripe dashboard or via API)
  stripe_setup_payment_link text,
  stripe_retainer_payment_link text,

  -- Before/after comparison as JSONB array
  -- Each: { label, before, after }
  comparison jsonb not null default '[]'::jsonb,

  -- CTA
  cta_url text default 'https://wolfgrey.ai/call',
  cta_text text default 'Book a Call',

  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Allow public read access by slug (proposals are shared via link)
alter table public.proposals enable row level security;

create policy "Proposals are viewable by anyone with the link"
  on public.proposals for select
  using (true);

create policy "Proposals are manageable by service role only"
  on public.proposals for all
  using (auth.role() = 'service_role');

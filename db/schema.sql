-- Neon/Postgres schema for BrandCopy AI
-- Note: gen_random_uuid() requires pgcrypto
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique not null,
  email text,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_metered_item_id text,
  plan text not null default 'free',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists usage_events (
  id bigserial primary key,
  clerk_user_id text not null,
  provider text not null,
  model text not null,
  prompt_tokens int not null default 0,
  completion_tokens int not null default 0,
  total_tokens int not null default 0,
  unit text not null default 'token',
  created_at timestamptz default now()
);

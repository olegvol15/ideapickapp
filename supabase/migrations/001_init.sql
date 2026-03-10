-- Run this in the Supabase SQL editor or via `supabase db push`.

create table if not exists generations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  prompt       text not null,
  product_type text,
  difficulty   text,
  result_json  jsonb not null,
  created_at   timestamptz default now()
);

create table if not exists saved_ideas (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  generation_id uuid references generations(id) on delete set null,
  idea_json     jsonb not null,
  created_at    timestamptz default now()
);

-- Indexes for common query patterns
create index if not exists generations_user_id_idx  on generations(user_id, created_at desc);
create index if not exists saved_ideas_user_id_idx  on saved_ideas(user_id, created_at desc);

-- Row-level security: users can only access their own rows
alter table generations  enable row level security;
alter table saved_ideas  enable row level security;

create policy "own generations"  on generations  for all using (auth.uid() = user_id);
create policy "own saved_ideas"  on saved_ideas  for all using (auth.uid() = user_id);

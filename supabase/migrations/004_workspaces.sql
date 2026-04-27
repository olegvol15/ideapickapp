create table if not exists workspaces (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  idea_slug    text not null,
  title        text not null,
  idea_json    jsonb not null,
  tasks_json   jsonb not null default '[]'::jsonb,
  content_json jsonb not null default '[]'::jsonb,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  constraint workspaces_user_id_slug_key unique (user_id, idea_slug)
);

create index if not exists workspaces_user_id_idx on workspaces(user_id, updated_at desc);

alter table workspaces enable row level security;
drop policy if exists "own workspaces" on workspaces;
create policy "own workspaces"
  on workspaces
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

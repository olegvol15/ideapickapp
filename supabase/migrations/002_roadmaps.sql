create table if not exists roadmaps (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  slug       text not null,
  idea_json  jsonb not null,
  graph_json jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, slug)
);

create index if not exists roadmaps_user_id_idx on roadmaps (user_id, updated_at desc);

alter table roadmaps enable row level security;
create policy "own roadmaps" on roadmaps for all using (auth.uid() = user_id);

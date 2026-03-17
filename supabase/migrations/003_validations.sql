create table if not exists validations (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  description      text not null,
  product_type     text,
  result_json      jsonb not null,
  competitors_json jsonb not null default '[]',
  created_at       timestamptz default now()
);

create index if not exists validations_user_id_idx on validations(user_id, created_at desc);

alter table validations enable row level security;
create policy "own validations" on validations for all using (auth.uid() = user_id);

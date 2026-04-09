create table if not exists public.client_invitations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  coach_id uuid not null references public.coaches(id) on delete cascade,
  email text not null,
  token_digest text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_client_invitations_client_id on public.client_invitations(client_id);
create index if not exists idx_client_invitations_coach_id on public.client_invitations(coach_id);
create index if not exists idx_client_invitations_created_at on public.client_invitations(created_at desc);

alter table public.client_invitations enable row level security;

drop policy if exists "client_invitations_select_coach_only" on public.client_invitations;
create policy "client_invitations_select_coach_only"
on public.client_invitations
for select
using (coach_id = public.get_my_coach_id());

drop policy if exists "client_invitations_insert_coach_only" on public.client_invitations;
create policy "client_invitations_insert_coach_only"
on public.client_invitations
for insert
with check (coach_id = public.get_my_coach_id());

drop policy if exists "client_invitations_update_coach_only" on public.client_invitations;
create policy "client_invitations_update_coach_only"
on public.client_invitations
for update
using (coach_id = public.get_my_coach_id())
with check (coach_id = public.get_my_coach_id());

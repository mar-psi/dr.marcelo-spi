create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  push_notifications boolean not null default true,
  email_updates boolean not null default true,
  study_reminders boolean not null default true,
  marketing_emails boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_ebook_downloads (
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references public.content_items(id) on delete cascade,
  downloaded_at timestamptz not null default now(),
  primary key (user_id, content_id)
);

alter table public.user_ebook_downloads enable row level security;

drop policy if exists "user_ebook_downloads_own" on public.user_ebook_downloads;
create policy "user_ebook_downloads_own"
  on public.user_ebook_downloads for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop trigger if exists user_preferences_touch_updated_at on public.user_preferences;
create trigger user_preferences_touch_updated_at
  before update on public.user_preferences
  for each row execute procedure public.touch_updated_at();

alter table public.user_preferences enable row level security;

drop policy if exists "user_preferences_own_select" on public.user_preferences;
create policy "user_preferences_own_select"
  on public.user_preferences for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "user_preferences_own_insert" on public.user_preferences;
create policy "user_preferences_own_insert"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_preferences_own_update" on public.user_preferences;
create policy "user_preferences_own_update"
  on public.user_preferences for update
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create or replace function public.delete_own_account()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  delete from auth.users where id = current_user_id;
  return true;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;

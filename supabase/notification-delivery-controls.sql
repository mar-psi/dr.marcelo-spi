alter table public.notifications
  add column if not exists expires_at timestamptz,
  add column if not exists audience_created_before timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users(id) on delete set null;

update public.notifications
set audience_created_before = coalesce(audience_created_before, sent_at, created_at)
where audience_created_before is null
  and sent_at is not null;

create index if not exists notifications_active_idx
  on public.notifications(sent_at desc, expires_at, archived_at);

drop policy if exists "notifications_user_targeted_read" on public.notifications;
create policy "notifications_user_targeted_read"
  on public.notifications for select
  using (
    sent_at is not null
    and archived_at is null
    and (expires_at is null or expires_at > now())
    and (
      public.is_admin()
      or user_id = auth.uid()
      or (
        user_id is null
        and exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and p.created_at <= coalesce(notifications.audience_created_before, notifications.sent_at, notifications.created_at)
        )
        and (
          target = 'all'
          or (target = 'subscribers' and public.has_active_subscription(auth.uid()))
          or (target = 'free' and auth.uid() is not null and not public.has_active_subscription(auth.uid()))
        )
      )
    )
  );

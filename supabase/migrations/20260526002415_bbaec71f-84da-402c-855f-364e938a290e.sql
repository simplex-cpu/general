
insert into storage.buckets (id, name, public) values ('brand-briefs', 'brand-briefs', true)
on conflict (id) do update set public = true;

create policy "Public read brand-briefs"
on storage.objects for select
using (bucket_id = 'brand-briefs');

create policy "Service role write brand-briefs"
on storage.objects for insert
to service_role
with check (bucket_id = 'brand-briefs');

create policy "Service role update brand-briefs"
on storage.objects for update
to service_role
using (bucket_id = 'brand-briefs');

create policy "Service role delete brand-briefs"
on storage.objects for delete
to service_role
using (bucket_id = 'brand-briefs');

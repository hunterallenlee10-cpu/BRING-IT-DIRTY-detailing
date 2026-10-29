-- RLS checks: strangers see nothing, allow-listed owners see everything, nobody but service_role can book directly.
grant select, update on public.leads to authenticated;
grant select on public.admins to authenticated;
insert into public.admins(email) values ('owner@example.com') on conflict do nothing;

set role authenticated;
select set_config('request.jwt.claims', '{"email":"stranger@example.com"}', false);
select 'stranger sees ' || count(*) || ' leads' as check from public.leads;
select set_config('request.jwt.claims', '{"email":"owner@example.com"}', false);
select 'owner sees ' || count(*) || ' leads' as check from public.leads;
reset role;

set role anon;
do $$ begin
  perform public.book_slot('{"name":"x","phone":"1","slot_start":"2030-02-01T15:00:00Z"}'::jsonb, 1);
  raise notice 'FAIL: anon could book';
exception when insufficient_privilege then raise notice 'PASS: anon cannot call book_slot';
end $$;
reset role;

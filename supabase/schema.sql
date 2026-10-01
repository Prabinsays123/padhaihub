create table subjects(id uuid primary key default gen_random_uuid(), name text unique not null, created_at timestamptz default now());
create table notes(id uuid primary key default gen_random_uuid(), subject_id uuid not null references subjects(id) on delete cascade,
 title text not null, description text, file_path text not null, published boolean not null default true,
 created_at timestamptz default now(), updated_at timestamptz default now());
create table profiles(id uuid primary key references auth.users(id) on delete cascade, email text not null, role text not null check(role in('admin','super_admin')), created_at timestamptz default now());

create function is_admin() returns boolean language sql security definer stable set search_path=public as $$ select exists(select 1 from profiles where id=auth.uid()) $$;
create function is_super() returns boolean language sql security definer stable set search_path=public as $$ select exists(select 1 from profiles where id=auth.uid() and role='super_admin') $$;

-- First sign-up of the owner email becomes super admin automatically
create function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin if lower(new.email)='prabinsays@gmail.com' then insert into profiles values(new.id,new.email,'super_admin'); end if; return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

alter table subjects enable row level security; alter table notes enable row level security; alter table profiles enable row level security;
create policy "public read subjects" on subjects for select using(true);
create policy "admin write subjects" on subjects for all using(is_admin()) with check(is_admin());
create policy "public read published notes" on notes for select using(published or is_admin());
create policy "admin write notes" on notes for all using(is_admin()) with check(is_admin());
create policy "admins read profiles" on profiles for select using(is_admin());
-- no write policies on profiles: only the server (service role) manages admins

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('notes','notes',false,52428800,array['application/pdf']);
create policy "read published pdfs" on storage.objects for select using(bucket_id='notes' and (is_admin() or exists(select 1 from notes n where n.file_path=name and n.published)));
create policy "admin upload pdfs" on storage.objects for insert with check(bucket_id='notes' and is_admin());
create policy "admin update pdfs" on storage.objects for update using(bucket_id='notes' and is_admin());
create policy "admin delete pdfs" on storage.objects for delete using(bucket_id='notes' and is_admin());

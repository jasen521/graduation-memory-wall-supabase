-- 毕业照片星球互动大屏：Supabase 初始化 SQL
-- 使用方法：
-- Supabase 后台 → SQL Editor → New query → 粘贴本文件全部内容 → Run

create extension if not exists pgcrypto;

-- 1. 创建照片记录表
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  name text default '',
  message text default '',
  image_url text not null,
  file_path text,
  created_at timestamptz default now()
);

-- 2. 开启 RLS
alter table public.photos enable row level security;

-- 3. photos 表权限：允许匿名读取，允许匿名插入
drop policy if exists "Allow anon read photos" on public.photos;
create policy "Allow anon read photos"
on public.photos
for select
to anon
using (true);

drop policy if exists "Allow anon insert photos" on public.photos;
create policy "Allow anon insert photos"
on public.photos
for insert
to anon
with check (
  image_url is not null
  and char_length(coalesce(name, '')) <= 30
  and char_length(coalesce(message, '')) <= 100
);

grant usage on schema public to anon;
grant select, insert on public.photos to anon;

-- 4. 创建公开 Storage bucket
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'graduation-photos',
  'graduation-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 5. Storage 权限：允许匿名读取和上传到 graduation-photos bucket
drop policy if exists "Allow public read graduation photos" on storage.objects;
create policy "Allow public read graduation photos"
on storage.objects
for select
to anon
using (bucket_id = 'graduation-photos');

drop policy if exists "Allow anon upload graduation photos" on storage.objects;
create policy "Allow anon upload graduation photos"
on storage.objects
for insert
to anon
with check (
  bucket_id = 'graduation-photos'
  and (storage.foldername(name))[1] = 'uploads'
);

-- 6. 开启 Realtime 监听 photos 表
do $$
begin
  alter publication supabase_realtime add table public.photos;
exception
  when duplicate_object then null;
end $$;

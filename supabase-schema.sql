-- ═══════════════════════════════════════════════════
--  QuizCraft — Supabase Schema
--  Chạy toàn bộ file này trong Supabase SQL Editor
-- ═══════════════════════════════════════════════════

-- 1. Bảng profiles (liên kết với auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  role text not null default 'student', -- 'owner' hoặc 'student'
  created_at timestamptz default now()
);

-- 2. Bảng exams (đề thi)
create table public.exams (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  questions jsonb not null default '[]',
  upload_date date not null default current_date,
  exp_date date not null,
  created_at timestamptz default now()
);

-- 3. Bảng results (kết quả làm bài)
create table public.results (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references public.exams(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  answers jsonb not null default '{}',
  correct_count int not null default 0,
  total_count int not null default 0,
  score numeric(4,2) not null default 0,
  elapsed_seconds int not null default 0,
  finished_at timestamptz default now(),
  unique(exam_id, user_id)
);

-- ═══════════════════════════════════════════════════
--  Row Level Security
-- ═══════════════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.exams enable row level security;
alter table public.results enable row level security;

-- Profiles: user chỉ đọc/sửa profile của mình
create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

-- Exams: ai cũng đọc được, chỉ owner mới tạo/sửa/xóa
create policy "exams: read all" on public.exams
  for select using (true);
create policy "exams: insert owner" on public.exams
  for insert with check (
    auth.uid() = owner_id and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
  );
create policy "exams: update owner" on public.exams
  for update using (auth.uid() = owner_id);
create policy "exams: delete owner" on public.exams
  for delete using (auth.uid() = owner_id);

-- Results: user chỉ đọc/ghi kết quả của mình; owner đọc được tất cả kết quả đề của mình
create policy "results: read own" on public.results
  for select using (
    auth.uid() = user_id or
    exists (
      select 1 from public.exams e
      where e.id = exam_id and e.owner_id = auth.uid()
    )
  );
create policy "results: insert own" on public.results
  for insert with check (auth.uid() = user_id);
create policy "results: update own" on public.results
  for update using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════
--  Auto-create profile khi user đăng ký
-- ═══════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

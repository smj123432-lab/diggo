-- ============================================================
-- Diggo — 굴착기 배차 플랫폼 DB 스키마
-- Supabase SQL Editor에서 순서대로 실행하세요.
-- ============================================================

-- profiles 테이블 (auth.users와 1:1 연결)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text not null,
  role text not null check (role in ('driver', 'manager', 'admin')),
  phone text,
  experience_years integer,
  garage_address text,
  latitude double precision,
  longitude double precision,
  rating_avg numeric(3,2) default 0,
  is_certified boolean default false,
  created_at timestamptz default now() not null
);

-- equipments 테이블
create table equipments (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references profiles(id) on delete cascade not null,
  assigned_driver_id uuid references profiles(id) on delete set null,
  type text not null default '굴착기',
  model_code text not null check (model_code in ('008', '017', '035', '02', '3w', '6w', '8w', '10t')),
  license_number text,
  created_at timestamptz default now() not null
);

-- jobs 테이블
create table jobs (
  id uuid default gen_random_uuid() primary key,
  manager_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  job_type text not null check (job_type in ('civil', 'demolition')),
  equipment_code text not null check (equipment_code in ('008', '017', '035', '02', '3w', '6w', '8w', '10t')),
  description text not null,
  attachments text,
  caution text,
  location text not null,
  latitude double precision,
  longitude double precision,
  pay_amount integer not null,
  work_date date not null,
  pay_due_type text not null check (pay_due_type in ('same_day', 'd3', 'd7', 'd14', 'd30')),
  pay_due_date date,
  status text not null default 'open' check (status in ('open', 'closed', 'in_progress', 'completed')),
  created_at timestamptz default now() not null
);

-- applications 테이블
create table applications (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references jobs(id) on delete cascade not null,
  driver_id uuid references profiles(id) on delete cascade not null,
  equipment_id uuid references equipments(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'accepted', 'rejected')),
  applied_at timestamptz default now() not null,
  unique (job_id, driver_id)
);

-- ledger_expenses 테이블 (기사 지출 기록)
create table ledger_expenses (
  id uuid default gen_random_uuid() primary key,
  driver_id uuid references profiles(id) on delete cascade not null,
  job_id uuid references jobs(id) on delete set null,
  expense_date date not null,
  category text not null,
  memo text,
  amount integer not null,
  created_at timestamptz default now() not null
);

-- reviews 테이블 (상호 평가)
create table reviews (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references jobs(id) on delete cascade not null,
  reviewer_id uuid references profiles(id) on delete cascade not null,
  reviewee_id uuid references profiles(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now() not null,
  unique (job_id, reviewer_id)
);

-- certifications 테이블 (자격증)
create table certifications (
  id uuid default gen_random_uuid() primary key,
  driver_id uuid references profiles(id) on delete cascade not null,
  cert_type text not null,
  image_url text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  verified_at timestamptz,
  created_at timestamptz default now() not null
);

-- chats 테이블 (1:1 채팅방)
create table chats (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references jobs(id) on delete cascade not null,
  application_id uuid references applications(id) on delete cascade not null unique,
  created_at timestamptz default now() not null
);

-- messages 테이블
create table messages (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid references chats(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  is_read boolean default false not null,
  created_at timestamptz default now() not null
);

-- notifications 테이블
create table notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  type text not null,
  message text not null,
  is_read boolean default false not null,
  created_at timestamptz default now() not null
);

-- ============================================================
-- 트리거: 신규 유저 가입 시 profiles 자동 생성
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'driver')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- 트리거: 평가 작성 시 rating_avg 자동 업데이트
-- ============================================================
create or replace function update_rating_avg()
returns trigger as $$
begin
  update profiles
  set rating_avg = (
    select round(avg(rating)::numeric, 2)
    from reviews
    where reviewee_id = new.reviewee_id
  )
  where id = new.reviewee_id;
  return new;
end;
$$ language plpgsql;

create or replace trigger on_review_created
  after insert on reviews
  for each row execute function update_rating_avg();

-- ============================================================
-- RLS 활성화
-- ============================================================
alter table profiles enable row level security;
alter table equipments enable row level security;
alter table jobs enable row level security;
alter table applications enable row level security;
alter table ledger_expenses enable row level security;
alter table reviews enable row level security;
alter table certifications enable row level security;
alter table chats enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;

-- ============================================================
-- RLS 정책: profiles
-- ============================================================
create policy "프로필 공개 조회" on profiles
  for select using (true);

create policy "본인 프로필만 수정" on profiles
  for update using (auth.uid() = id);

-- ============================================================
-- RLS 정책: jobs
-- ============================================================
create policy "일감 공개 조회" on jobs
  for select using (true);

create policy "소장만 일감 등록" on jobs
  for insert with check (
    auth.uid() = manager_id and
    exists (select 1 from profiles where id = auth.uid() and role in ('manager', 'admin'))
  );

create policy "소장 본인 일감만 수정" on jobs
  for update using (
    auth.uid() = manager_id or
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "소장 본인 일감만 삭제" on jobs
  for delete using (
    auth.uid() = manager_id or
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- RLS 정책: applications
-- ============================================================
create policy "기사: 본인 지원 조회" on applications
  for select using (auth.uid() = driver_id);

create policy "소장: 내 일감 지원자 조회" on applications
  for select using (
    exists (
      select 1 from jobs
      where jobs.id = applications.job_id
      and jobs.manager_id = auth.uid()
    )
  );

create policy "관리자: 전체 지원 조회" on applications
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "기사만 지원 신청" on applications
  for insert with check (
    auth.uid() = driver_id and
    exists (select 1 from profiles where id = auth.uid() and role = 'driver')
  );

create policy "소장: 내 일감 지원 상태 변경" on applications
  for update using (
    exists (
      select 1 from jobs
      where jobs.id = applications.job_id
      and jobs.manager_id = auth.uid()
    )
  );

-- ============================================================
-- RLS 정책: ledger_expenses
-- ============================================================
create policy "기사: 본인 지출 CRUD" on ledger_expenses
  for all using (auth.uid() = driver_id)
  with check (auth.uid() = driver_id);

create policy "관리자: 전체 지출 조회" on ledger_expenses
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- RLS 정책: reviews
-- ============================================================
create policy "평가 공개 조회" on reviews
  for select using (true);

create policy "완료 일감에만 평가 작성" on reviews
  for insert with check (
    auth.uid() = reviewer_id and
    exists (
      select 1 from jobs
      where jobs.id = reviews.job_id
      and jobs.status = 'completed'
    )
  );

-- ============================================================
-- RLS 정책: certifications
-- ============================================================
create policy "기사: 본인 자격증 조회" on certifications
  for select using (auth.uid() = driver_id);

create policy "소장: 인증된 자격증 조회" on certifications
  for select using (
    status = 'approved' and
    exists (select 1 from profiles where id = auth.uid() and role in ('manager', 'admin'))
  );

create policy "기사만 자격증 업로드" on certifications
  for insert with check (
    auth.uid() = driver_id and
    exists (select 1 from profiles where id = auth.uid() and role = 'driver')
  );

create policy "관리자만 자격증 상태 변경" on certifications
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- RLS 정책: chats
-- ============================================================
create policy "채팅 참여자만 조회" on chats
  for select using (
    exists (
      select 1 from applications
      where applications.id = chats.application_id
      and (
        applications.driver_id = auth.uid() or
        exists (
          select 1 from jobs
          where jobs.id = applications.job_id
          and jobs.manager_id = auth.uid()
        )
      )
    )
  );

create policy "검토중 전환 시 채팅방 생성" on chats
  for insert with check (
    exists (
      select 1 from applications
      where applications.id = chats.application_id
      and applications.status = 'reviewing'
    )
  );

-- ============================================================
-- RLS 정책: messages
-- ============================================================
create policy "채팅 참여자만 메시지 조회" on messages
  for select using (
    exists (
      select 1 from chats
      join applications on applications.id = chats.application_id
      where chats.id = messages.chat_id
      and (
        applications.driver_id = auth.uid() or
        exists (
          select 1 from jobs
          where jobs.id = applications.job_id
          and jobs.manager_id = auth.uid()
        )
      )
    )
  );

create policy "채팅 참여자만 메시지 전송" on messages
  for insert with check (
    auth.uid() = sender_id and
    exists (
      select 1 from chats
      join applications on applications.id = chats.application_id
      where chats.id = messages.chat_id
      and (
        applications.driver_id = auth.uid() or
        exists (
          select 1 from jobs
          where jobs.id = applications.job_id
          and jobs.manager_id = auth.uid()
        )
      )
    )
  );

-- ============================================================
-- RLS 정책: notifications
-- ============================================================
create policy "본인 알림만 조회" on notifications
  for select using (auth.uid() = user_id);

create policy "본인 알림만 읽음 처리" on notifications
  for update using (auth.uid() = user_id);

-- ============================================================
-- Realtime 활성화 (채팅, 알림)
-- ============================================================
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table notifications;

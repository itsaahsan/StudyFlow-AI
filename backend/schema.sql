-- StudyFlow AI — PostgreSQL schema (Supabase-ready).
-- Normalized, clean relationships.

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade text,
  available_hours numeric default 3.0,
  preferred_times text[] default '{}',
  created_at timestamptz default now()
);

create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  color text default '#6366f1'
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  subject text not null default 'General',
  title text not null,
  type text not null default 'assignment',
  due_date date,
  due_time text,
  estimated_minutes int not null default 60,
  difficulty int not null default 3 check (difficulty between 1 and 5),
  importance int not null default 3 check (importance between 1 and 5),
  progress int not null default 0 check (progress between 0 and 100),
  status text not null default 'todo',
  depends_on uuid[] default '{}',
  created_at timestamptz default now(),
  completed_at timestamptz
);
create index if not exists idx_tasks_user_due on tasks(user_id, due_date);

create table if not exists subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  title text not null,
  estimated_minutes int default 25,
  done boolean default false,
  position int default 0
);

create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  subject text not null,
  title text not null,
  exam_date date not null,
  weight_pct numeric default 20
);

create table if not exists study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  minutes int not null,
  difficulty_feedback text,
  started_at timestamptz default now()
);

create table if not exists schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  task_id uuid references tasks(id) on delete cascade,
  day date not null,
  start_time text not null,
  minutes int not null
);

create table if not exists ai_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  kind text not null, -- next_action | radar | review | rescue
  message text not null,
  payload jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  week_start date not null,
  completion_rate numeric default 0,
  study_minutes int default 0,
  summary text
);

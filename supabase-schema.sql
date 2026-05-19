-- Run this in Supabase → SQL Editor → New query

create table preferences (
  id integer primary key default 1,
  job_titles text[] default '{}',
  salary_floor integer default 0,
  location_preferences text[] default '{}',
  domains_of_interest text[] default '{}',
  companies_to_exclude text[] default '{}',
  role_type text default '',
  work_style text default ''
);
insert into preferences (id) values (1) on conflict do nothing;

create table resume (
  id integer primary key default 1,
  content text default '',
  has_docx boolean default false
);
insert into resume (id) values (1) on conflict do nothing;

create table profile (
  id integer primary key default 1,
  content text default ''
);
insert into profile (id) values (1) on conflict do nothing;

create table stories (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  situation text default '',
  task text default '',
  action text default '',
  result text default '',
  competencies text[] default '{}',
  domains text[] default '{}',
  metrics text default ''
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  title text not null,
  location text default '',
  salary integer default 0,
  source_url text default '',
  content text default '',
  status text default 'interested',
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  score numeric,
  dimensions jsonb,
  scored_at timestamptz
);

create table portals (
  company text primary key,
  careers_url text not null,
  shard text,
  site text
);

create table scan_cache (
  id integer primary key default 1,
  scanned_at timestamptz,
  discoveries jsonb default '[]',
  errors jsonb default '[]'
);
insert into scan_cache (id) values (1) on conflict do nothing;

create table dismissed_urls (
  url text primary key,
  created_at timestamptz default now()
);

create table tailored_resumes (
  id text primary key,
  name text not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  source text default 'landing',
  created_at timestamptz default now()
);

create table feedback (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  email text default '',
  created_at timestamptz default now()
);

-- Storage: go to Storage → New bucket → name it "resumes", set to private

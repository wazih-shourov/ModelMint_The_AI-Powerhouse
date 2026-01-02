-- Create the deployments table
create table deployments (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null,
  project_id uuid references projects(id) not null,
  slug text not null,
  title text,
  description text,
  is_public boolean default true,
  view_count bigint default 0,
  
  -- Ensure slug is unique per user (or globally? User asked for subdomain-like behavior, so globally unique or unique per user if URL is /share/:username/:slug)
  -- The user asked for "subdomain hishebe", but in localhost/path context, /share/:username/:slug is best.
  -- Let's make slug unique per user for now to allow different users to have 'my-model'.
  unique(user_id, slug)
);

-- Enable RLS
alter table deployments enable row level security;

-- Policies
-- 1. Users can view their own deployments
create policy "Users can view own deployments"
  on deployments for select
  using ( auth.uid() = user_id );

-- 2. Users can insert their own deployments
create policy "Users can insert own deployments"
  on deployments for insert
  with check ( auth.uid() = user_id );

-- 3. Users can update their own deployments
create policy "Users can update own deployments"
  on deployments for update
  using ( auth.uid() = user_id );

-- 4. Users can delete their own deployments
create policy "Users can delete own deployments"
  on deployments for delete
  using ( auth.uid() = user_id );

-- 5. Public access for reading deployments (for the public landing page)
create policy "Public can view public deployments"
  on deployments for select
  using ( is_public = true );

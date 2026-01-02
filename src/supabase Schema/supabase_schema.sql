-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  email text,
  avatar_url text,

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Create a table for projects
create table projects (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null,
  name text not null,
  model_data jsonb,

  constraint name_length check (char_length(name) > 0)
);

-- Set up RLS for projects
alter table projects enable row level security;

create policy "Users can view their own projects." on projects
  for select using (auth.uid() = user_id);

create policy "Users can create their own projects." on projects
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own projects." on projects
  for update using (auth.uid() = user_id);

create policy "Users can delete their own projects." on projects
  for delete using (auth.uid() = user_id);

-- Set up a trigger to automatically create a profile entry when a new user signs up
-- This is optional but recommended. If you don't use this, you must insert into 'profiles' manually from the frontend after signUp.
-- For this app, we will handle profile creation in the frontend for simplicity with the custom fields (username, full name).
-- However, having the table ready is crucial.

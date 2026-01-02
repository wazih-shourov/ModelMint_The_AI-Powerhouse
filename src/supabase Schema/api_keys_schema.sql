-- API Keys Table for Model Mint
-- This table stores API keys for users to access their trained models via API

create table api_keys (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- User and Project references
  user_id uuid references auth.users not null,
  project_id uuid references projects(id) on delete cascade not null,
  
  -- API Key data
  key_hash text not null unique, -- Hashed version of the API key (for security)
  key_prefix text not null, -- First few characters for display (e.g., "mk_live_abc...")
  
  -- Key metadata
  name text, -- Optional name for the key (e.g., "Production API", "Testing")
  is_active boolean default true not null,
  
  -- Expiry
  expires_at timestamp with time zone, -- NULL means no expiry
  
  -- Usage tracking
  last_used_at timestamp with time zone,
  usage_count integer default 0 not null,
  
  -- Rate limiting counters (reset periodically)
  daily_count integer default 0 not null,
  hourly_count integer default 0 not null,
  minute_count integer default 0 not null,
  
  -- Last reset timestamps
  daily_reset_at timestamp with time zone default timezone('utc'::text, now()) not null,
  hourly_reset_at timestamp with time zone default timezone('utc'::text, now()) not null,
  minute_reset_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraints
  constraint key_prefix_format check (key_prefix ~ '^mk_live_[a-zA-Z0-9]{8}$')
);

-- Indexes for performance
create index api_keys_user_id_idx on api_keys(user_id);
create index api_keys_project_id_idx on api_keys(project_id);
create index api_keys_key_hash_idx on api_keys(key_hash);
create index api_keys_is_active_idx on api_keys(is_active);

-- Set up Row Level Security (RLS)
alter table api_keys enable row level security;

-- Users can view their own API keys
create policy "Users can view their own API keys." on api_keys
  for select using (auth.uid() = user_id);

-- Users can create API keys for their own projects
create policy "Users can create their own API keys." on api_keys
  for insert with check (
    auth.uid() = user_id 
    and exists (
      select 1 from projects 
      where projects.id = api_keys.project_id 
      and projects.user_id = auth.uid()
    )
  );

-- Users can update their own API keys (e.g., revoke, rename)
create policy "Users can update their own API keys." on api_keys
  for update using (auth.uid() = user_id);

-- Users can delete their own API keys
create policy "Users can delete their own API keys." on api_keys
  for delete using (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
create or replace function update_api_keys_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger to update updated_at on every update
create trigger update_api_keys_updated_at_trigger
  before update on api_keys
  for each row
  execute function update_api_keys_updated_at();

-- Function to clean up expired API keys (can be called periodically)
create or replace function cleanup_expired_api_keys()
returns void as $$
begin
  update api_keys
  set is_active = false
  where expires_at is not null
    and expires_at < timezone('utc'::text, now())
    and is_active = true;
end;
$$ language plpgsql;

-- Comments for documentation
comment on table api_keys is 'Stores API keys for accessing trained models via API';
comment on column api_keys.key_hash is 'SHA-256 hash of the actual API key';
comment on column api_keys.key_prefix is 'Display prefix (e.g., mk_live_abc12345)';
comment on column api_keys.expires_at is 'Expiry date (NULL = never expires)';
comment on column api_keys.usage_count is 'Total number of API calls made with this key';
comment on column api_keys.daily_count is 'API calls made today (resets daily)';
comment on column api_keys.hourly_count is 'API calls made this hour (resets hourly)';
comment on column api_keys.minute_count is 'API calls made this minute (resets every minute)';

-- ============================================================
-- Queue Rotation: Edge Function + Cron Schedule
-- ============================================================
-- Run this in Supabase SQL Editor after deploying the edge function.
-- This creates a cron job that calls the rotate-queue edge function
-- every hour. The function checks if the active queue's current
-- recommendation has ended, and if so advances to the next product
-- (looping back to #1 after the last item) and creates a new 24H
-- recommendation.
-- ============================================================

-- Enable pg_cron extension if not already enabled
create extension if not exists pg_cron;

-- Grant usage to postgres role
grant usage on schema cron to postgres;

-- Create a function to call the edge function via pg_net
create or replace function public.rotate_queue_cron()
returns void
language plpgsql
security definer
as $$
declare
  project_url text;
  service_key text;
begin
  -- Get the project URL and service role key from vault or settings
  -- You must set these values first:
  --   select vault.create_secret('https://YOUR_PROJECT.supabase.co', 'supabase_url');
  --   select vault.create_secret('YOUR_SERVICE_ROLE_KEY', 'supabase_service_key');

  select decrypted_secret into project_url
  from vault.decrypted_secrets
  where name = 'supabase_url';

  select decrypted_secret into service_key
  from vault.decrypted_secrets
  where name = 'supabase_service_key';

  -- Call the edge function
  perform net.http_post(
    url := project_url || '/functions/v1/rotate-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := '{}'::jsonb
  );
end;
$$;

-- Schedule: run every hour at minute 0
select cron.schedule(
  'rotate-queue-hourly',
  '0 * * * *',
  $$select public.rotate_queue_cron();$$
);

-- ============================================================
-- SETUP INSTRUCTIONS (run manually in Supabase Dashboard):
-- ============================================================
-- 1. Deploy the edge function:
--    supabase functions deploy rotate-queue
--
-- 2. Set vault secrets (replace with your actual values):
--    select vault.create_secret('https://YOUR_PROJECT.supabase.co', 'supabase_url');
--    select vault.create_secret('YOUR_SERVICE_ROLE_KEY', 'supabase_service_key');
--
-- 3. Enable pg_net extension:
--    create extension if not exists pg_net;
--
-- 4. The cron job above will now run every hour.
--    To test manually: select public.rotate_queue_cron();
-- ============================================================
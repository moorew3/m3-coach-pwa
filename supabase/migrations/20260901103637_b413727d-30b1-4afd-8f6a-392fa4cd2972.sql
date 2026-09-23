CREATE TABLE public.sync_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash text NOT NULL UNIQUE,
  channel_id uuid NOT NULL DEFAULT gen_random_uuid(),
  pair_code text UNIQUE,
  pair_secret text,
  pair_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.app_snapshots (
  account_id uuid PRIMARY KEY REFERENCES public.sync_accounts(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  rev bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.live_sessions (
  account_id uuid PRIMARY KEY REFERENCES public.sync_accounts(id) ON DELETE CASCADE,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  rev bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.sync_accounts TO service_role;
GRANT ALL ON public.app_snapshots TO service_role;
GRANT ALL ON public.live_sessions TO service_role;

ALTER TABLE public.sync_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_sync_accounts_updated BEFORE UPDATE ON public.sync_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_app_snapshots_updated BEFORE UPDATE ON public.app_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_live_sessions_updated BEFORE UPDATE ON public.live_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_sync_accounts_pair_code ON public.sync_accounts(pair_code) WHERE pair_code IS NOT NULL;
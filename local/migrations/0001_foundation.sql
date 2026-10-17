-- Applied within the migration runner's transaction, using a local migration role.
-- This establishes ownership boundaries, not working login/session authentication.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'swingpilot_app') THEN
    CREATE ROLE swingpilot_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'swingpilot_app'
             AND (rolsuper OR rolbypassrls OR rolcreaterole OR rolcreatedb OR rolcanlogin)) THEN
    RAISE EXCEPTION 'swingpilot_app must be an unprivileged NOLOGIN role';
  END IF;
END $$;

REVOKE ALL ON SCHEMA swingpilot FROM PUBLIC;
GRANT USAGE ON SCHEMA swingpilot TO swingpilot_app;

CREATE TABLE swingpilot.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  login_name text NOT NULL UNIQUE CHECK (login_name = lower(btrim(login_name)) AND length(login_name) BETWEEN 1 AND 100),
  password_hash text NOT NULL CHECK (password_hash LIKE '$argon2id$%'),
  password_changed_at timestamptz NOT NULL DEFAULT now(),
  session_epoch bigint NOT NULL DEFAULT 0 CHECK (session_epoch >= 0),
  state text NOT NULL DEFAULT 'ACTIVE' CHECK (state IN ('ACTIVE', 'DISABLED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX one_enabled_owner ON swingpilot.app_users (state) WHERE state = 'ACTIVE';
REVOKE ALL ON swingpilot.app_users FROM PUBLIC, swingpilot_app;

CREATE TABLE swingpilot.profiles (
  id uuid PRIMARY KEY REFERENCES swingpilot.app_users(id),
  display_name text NOT NULL CHECK (length(display_name) BETWEEN 1 AND 100),
  locale text NOT NULL DEFAULT 'he' CHECK (locale = 'he'),
  timezone text NOT NULL DEFAULT 'Asia/Jerusalem' CHECK (timezone = 'Asia/Jerusalem'),
  theme text NOT NULL DEFAULT 'dark' CHECK (theme = 'dark'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1 CHECK (row_version > 0)
);

CREATE TABLE swingpilot.portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES swingpilot.app_users(id),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 100),
  currency text NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  opening_cash numeric(20,8) NOT NULL CHECK (opening_cash >= 0 AND opening_cash <> 'NaN'::numeric),
  opening_cash_at timestamptz NOT NULL,
  risk_per_trade_fraction numeric(12,10) NOT NULL CHECK (risk_per_trade_fraction > 0 AND risk_per_trade_fraction <= 1),
  max_position_fraction numeric(12,10) NOT NULL CHECK (max_position_fraction > 0 AND max_position_fraction <= 1),
  max_total_exposure_fraction numeric(12,10) NOT NULL CHECK (max_total_exposure_fraction > 0 AND max_total_exposure_fraction <= 1),
  max_sector_fraction numeric(12,10) NOT NULL CHECK (max_sector_fraction > 0 AND max_sector_fraction <= 1),
  cash_buffer numeric(20,8) NOT NULL CHECK (cash_buffer >= 0 AND cash_buffer <> 'NaN'::numeric),
  policy_version integer NOT NULL DEFAULT 1 CHECK (policy_version > 0),
  is_default boolean NOT NULL DEFAULT true,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1 CHECK (row_version > 0),
  UNIQUE (owner_id, id),
  CHECK (risk_per_trade_fraction <= max_position_fraction),
  CHECK (max_position_fraction <= max_total_exposure_fraction),
  CHECK (max_sector_fraction <= max_total_exposure_fraction)
);
CREATE UNIQUE INDEX one_active_portfolio ON swingpilot.portfolios(owner_id) WHERE archived_at IS NULL;

-- The server must set this only from an authenticated owner within BEGIN/COMMIT.
-- It is not an authentication mechanism and the DB must not be exposed to clients.
ALTER TABLE swingpilot.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE swingpilot.profiles FORCE ROW LEVEL SECURITY;
CREATE POLICY profile_owner ON swingpilot.profiles TO swingpilot_app
  USING (id = nullif(current_setting('swingpilot.owner_id', true), '')::uuid)
  WITH CHECK (id = nullif(current_setting('swingpilot.owner_id', true), '')::uuid);

ALTER TABLE swingpilot.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE swingpilot.portfolios FORCE ROW LEVEL SECURITY;
CREATE POLICY portfolio_owner ON swingpilot.portfolios TO swingpilot_app
  USING (owner_id = nullif(current_setting('swingpilot.owner_id', true), '')::uuid)
  WITH CHECK (owner_id = nullif(current_setting('swingpilot.owner_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE ON swingpilot.profiles, swingpilot.portfolios TO swingpilot_app;
-- No DELETE, credential-table, migration-table or public-schema grants.

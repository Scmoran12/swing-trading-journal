DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='swingpilot_auth') THEN
  CREATE ROLE swingpilot_auth NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
 END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='swingpilot_auth' AND(rolsuper OR rolbypassrls OR rolcreaterole OR rolcreatedb OR rolcanlogin))THEN
  RAISE EXCEPTION 'Unsafe existing auth role';
 END IF;
END $$;
GRANT USAGE ON SCHEMA swingpilot TO swingpilot_auth;
GRANT SELECT ON swingpilot.app_users TO swingpilot_auth;
GRANT SELECT(id,display_name) ON swingpilot.profiles TO swingpilot_auth;

CREATE TABLE swingpilot.app_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES swingpilot.app_users(id),
  session_token_hash text NOT NULL UNIQUE,
  session_epoch bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  UNIQUE(owner_id,id)
);
GRANT SELECT,INSERT,UPDATE ON swingpilot.app_sessions TO swingpilot_auth;
CREATE TABLE swingpilot.login_limits (
  bucket text PRIMARY KEY,
  attempts integer NOT NULL,
  window_started_at timestamptz NOT NULL
);
GRANT SELECT,INSERT,UPDATE,DELETE ON swingpilot.login_limits TO swingpilot_auth;

CREATE TABLE swingpilot.uploads (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES swingpilot.app_users(id),
  storage_key text NOT NULL UNIQUE,
  bytes integer NOT NULL CHECK(bytes>0 AND bytes<=10485760),
  content_type text NOT NULL CHECK(content_type='image/png'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id,id)
);
ALTER TABLE swingpilot.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE swingpilot.uploads FORCE ROW LEVEL SECURITY;
CREATE POLICY upload_owner ON swingpilot.uploads TO swingpilot_app
 USING(owner_id=nullif(current_setting('swingpilot.owner_id',true),'')::uuid)
 WITH CHECK(owner_id=nullif(current_setting('swingpilot.owner_id',true),'')::uuid);
GRANT SELECT,INSERT,DELETE ON swingpilot.uploads TO swingpilot_app;

-- Manual copy/paste review transport only. No broker/AI dispatcher or financial writes.
CREATE TABLE swingpilot.codex_review_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES swingpilot.app_users(id),
 plan_id uuid NOT NULL, version_id uuid NOT NULL, plan_revision bigint NOT NULL, portfolio_revision bigint NOT NULL, journal_revision bigint NOT NULL,
 input jsonb NOT NULL CHECK(jsonb_typeof(input)='object'), input_sha256 text NOT NULL CHECK(input_sha256~'^[a-f0-9]{64}$'),
 transport text NOT NULL DEFAULT 'MANUAL_COPY' CHECK(transport='MANUAL_COPY'),
 state text NOT NULL DEFAULT 'AWAITING_CODEX' CHECK(state IN('AWAITING_CODEX','PAUSED_USAGE','PAUSED_AUTH','PAUSED_BRIDGE','REVIEW_READY','STALE_RESULT','CANCELLED')),
 response jsonb, response_sha256 text, completed_at timestamptz,
 row_version integer NOT NULL DEFAULT 1 CHECK(row_version>0),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(owner_id,id), FOREIGN KEY(owner_id,plan_id) REFERENCES swingpilot.plans(owner_id,id),
 FOREIGN KEY(owner_id,version_id) REFERENCES swingpilot.plan_versions(owner_id,id),
 CHECK(coalesce((response IS NULL AND response_sha256 IS NULL AND completed_at IS NULL AND state NOT IN('REVIEW_READY','STALE_RESULT'))
    OR(response IS NOT NULL AND jsonb_typeof(response)='object' AND response_sha256~'^[a-f0-9]{64}$' AND completed_at IS NOT NULL AND state IN('REVIEW_READY','STALE_RESULT')),false))
);
CREATE UNIQUE INDEX one_pending_codex_review ON swingpilot.codex_review_jobs(owner_id,version_id,plan_revision,portfolio_revision,journal_revision)
 WHERE state IN('AWAITING_CODEX','PAUSED_USAGE','PAUSED_AUTH','PAUSED_BRIDGE');
CREATE TABLE swingpilot.codex_review_commands (
 owner_id uuid NOT NULL REFERENCES swingpilot.app_users(id), id uuid NOT NULL, request_hash text NOT NULL CHECK(request_hash~'^[a-f0-9]{64}$'),
 response jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(owner_id,id)
);
CREATE TABLE swingpilot.codex_review_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL, job_id uuid NOT NULL,
 action text NOT NULL CHECK(action IN('CREATE','SUBMIT','PAUSE_USAGE','PAUSE_AUTH','PAUSE_BRIDGE','RESUME','CANCEL')),
 state text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), FOREIGN KEY(owner_id,job_id) REFERENCES swingpilot.codex_review_jobs(owner_id,id)
);
DO $$ DECLARE tab text; BEGIN
 FOREACH tab IN ARRAY ARRAY['codex_review_jobs','codex_review_commands','codex_review_events'] LOOP
  EXECUTE format('ALTER TABLE swingpilot.%I ENABLE ROW LEVEL SECURITY',tab);
  EXECUTE format('ALTER TABLE swingpilot.%I FORCE ROW LEVEL SECURITY',tab);
  EXECUTE format('CREATE POLICY owner_access ON swingpilot.%I TO swingpilot_app USING(owner_id=nullif(current_setting(''swingpilot.owner_id'',true),'''')::uuid)',tab);
  EXECUTE format('GRANT SELECT ON swingpilot.%I TO swingpilot_app',tab);
 END LOOP;
END $$;

CREATE FUNCTION swingpilot.codex_review_command(action text,body jsonb,key uuid,fingerprint text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=swingpilot,pg_temp AS $$
DECLARE uid uuid:=nullif(current_setting('swingpilot.owner_id',true),'')::uuid;
 pl plans%ROWTYPE; ver plan_versions%ROWTYPE; port portfolios%ROWTYPE; job codex_review_jobs%ROWTYPE;
 prior codex_review_commands%ROWTYPE; result jsonb; packet jsonb; next_state text; stale boolean; journal_rev bigint;
BEGIN
 IF uid IS NULL OR NOT EXISTS(SELECT 1 FROM app_users WHERE id=uid AND state='ACTIVE') THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
 IF key IS NULL OR fingerprint IS NULL OR fingerprint!~'^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'INVALID_COMMAND'; END IF;
 -- Same owner lock/order as financial commands: pin inputs atomically, never write the ledger.
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text,19485003));
 SELECT count(*) INTO journal_rev FROM commands WHERE owner_id=uid AND request->>'action'<>'READ_NOTIFICATION';
 SELECT * INTO prior FROM codex_review_commands WHERE owner_id=uid AND id=key;
 IF FOUND THEN
  IF prior.request_hash<>fingerprint THEN RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT'; END IF;
  RETURN prior.response;
 END IF;
 IF action='CREATE' THEN
  IF (body->>'sharingAcknowledged')::boolean IS DISTINCT FROM true THEN RAISE EXCEPTION 'SHARING_ACKNOWLEDGMENT_REQUIRED'; END IF;
  SELECT * INTO pl FROM plans WHERE owner_id=uid AND id=(body->>'planId')::uuid;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  SELECT * INTO port FROM portfolios WHERE owner_id=uid AND id=pl.portfolio_id AND archived_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF pl.row_version IS DISTINCT FROM (body->>'expectedPlanRevision')::bigint THEN RAISE EXCEPTION 'REVISION_CONFLICT'; END IF;
  SELECT * INTO ver FROM plan_versions WHERE owner_id=uid AND plan_id=pl.id AND version=pl.current_version;
  IF NOT FOUND OR pl.state='ARCHIVED' OR ver.expires_at<=now() THEN RAISE EXCEPTION 'PLAN_UNAVAILABLE'; END IF;
  SELECT * INTO job FROM codex_review_jobs WHERE owner_id=uid AND version_id=ver.id AND plan_revision=pl.row_version
   AND portfolio_revision=port.row_version AND journal_revision=journal_rev AND state IN('AWAITING_CODEX','PAUSED_USAGE','PAUSED_AUTH','PAUSED_BRIDGE');
  IF NOT FOUND THEN
   IF (SELECT count(*) FROM codex_review_jobs WHERE owner_id=uid AND state IN('AWAITING_CODEX','PAUSED_USAGE','PAUSED_AUTH','PAUSED_BRIDGE'))>=8
      OR (SELECT count(*) FROM codex_review_jobs WHERE owner_id=uid)>=500 THEN RAISE EXCEPTION 'REVIEW_LIMIT_REACHED'; END IF;
   packet:=jsonb_build_object('schemaVersion',1,'scope','JOURNAL_ONLY_PLAN_REVIEW','planId',pl.id,'planVersionId',ver.id,
    'planRevision',pl.row_version::text,'portfolioRevision',port.row_version::text,'journalRevision',journal_rev::text,
    'facts',jsonb_build_array(
     jsonb_build_object('id','F_SYMBOL','value',pl.symbol),jsonb_build_object('id','F_EXCHANGE','value',pl.exchange),
     jsonb_build_object('id','F_SECTOR','value',pl.sector),jsonb_build_object('id','F_ENTRY','value',ver.entry::text),
     jsonb_build_object('id','F_STOP','value',ver.stop::text),jsonb_build_object('id','F_TARGET','value',ver.target::text),
     jsonb_build_object('id','F_BUY_FEE','value',ver.buy_fee::text),jsonb_build_object('id','F_SELL_FEE','value',ver.sell_fee::text),
     jsonb_build_object('id','F_SLIPPAGE','value',ver.slippage::text),jsonb_build_object('id','F_THESIS','value',ver.thesis),
     jsonb_build_object('id','F_INVALIDATION','value',ver.invalidation),jsonb_build_object('id','F_EXPIRY','value',to_char(ver.expires_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))));
   INSERT INTO codex_review_jobs(owner_id,plan_id,version_id,plan_revision,portfolio_revision,journal_revision,input,input_sha256)
    VALUES(uid,pl.id,ver.id,pl.row_version,port.row_version,journal_rev,packet,encode(sha256(convert_to(packet::text,'UTF8')),'hex')) RETURNING * INTO job;
  ELSE
   result:=jsonb_build_object('id',job.id,'state',job.state,'rowVersion',job.row_version);
   INSERT INTO codex_review_commands(owner_id,id,request_hash,response) VALUES(uid,key,fingerprint,result);
   RETURN result;
  END IF;
 ELSE
  SELECT * INTO job FROM codex_review_jobs WHERE owner_id=uid AND id=(body->>'jobId')::uuid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF job.row_version IS DISTINCT FROM (body->>'expectedRevision')::integer THEN RAISE EXCEPTION 'REVISION_CONFLICT'; END IF;
  IF job.state IN('REVIEW_READY','STALE_RESULT','CANCELLED') THEN RAISE EXCEPTION 'REVIEW_TERMINAL'; END IF;
  SELECT * INTO pl FROM plans WHERE owner_id=uid AND id=job.plan_id;
  SELECT * INTO port FROM portfolios WHERE owner_id=uid AND id=pl.portfolio_id;
  SELECT * INTO ver FROM plan_versions WHERE owner_id=uid AND id=job.version_id;
  stale:=pl.row_version<>job.plan_revision OR pl.current_version<>ver.version OR port.row_version<>job.portfolio_revision OR journal_rev<>job.journal_revision
    OR port.archived_at IS NOT NULL OR pl.state='ARCHIVED' OR ver.expires_at<=now();
  IF action='SUBMIT' THEN
   IF job.state<>'AWAITING_CODEX' THEN RAISE EXCEPTION 'REVIEW_PAUSED'; END IF;
   IF (body->>'reviewAcknowledged')::boolean IS DISTINCT FROM true THEN RAISE EXCEPTION 'REVIEW_ACKNOWLEDGMENT_REQUIRED'; END IF;
   IF body->'response'->>'jobId' IS DISTINCT FROM job.id::text OR body->'response'->>'inputSha256' IS DISTINCT FROM job.input_sha256
      OR body->'response'->>'scope' IS DISTINCT FROM 'JOURNAL_ONLY_PLAN_REVIEW' THEN RAISE EXCEPTION 'REVIEW_BINDING_MISMATCH'; END IF;
   next_state:=CASE WHEN stale THEN 'STALE_RESULT' ELSE 'REVIEW_READY' END;
   UPDATE codex_review_jobs SET response=body->'response',response_sha256=encode(sha256(convert_to((body->'response')::text,'UTF8')),'hex'),
    completed_at=now(),state=next_state,row_version=row_version+1,updated_at=now() WHERE id=job.id RETURNING * INTO job;
  ELSE
   next_state:=CASE action WHEN 'PAUSE_USAGE' THEN 'PAUSED_USAGE' WHEN 'PAUSE_AUTH' THEN 'PAUSED_AUTH'
    WHEN 'PAUSE_BRIDGE' THEN 'PAUSED_BRIDGE' WHEN 'RESUME' THEN 'AWAITING_CODEX' WHEN 'CANCEL' THEN 'CANCELLED' ELSE NULL END;
   IF next_state IS NULL THEN RAISE EXCEPTION 'UNKNOWN_REVIEW_COMMAND'; END IF;
   IF action='RESUME' AND (job.state='AWAITING_CODEX' OR stale) THEN RAISE EXCEPTION 'REVIEW_CANNOT_RESUME'; END IF;
   IF next_state=job.state THEN RAISE EXCEPTION 'REVIEW_STATE_UNCHANGED'; END IF;
   UPDATE codex_review_jobs SET state=next_state,row_version=row_version+1,updated_at=now() WHERE id=job.id RETURNING * INTO job;
  END IF;
 END IF;
 result:=jsonb_build_object('id',job.id,'state',job.state,'rowVersion',job.row_version);
 INSERT INTO codex_review_commands(owner_id,id,request_hash,response) VALUES(uid,key,fingerprint,result);
 INSERT INTO codex_review_events(owner_id,job_id,action,state) VALUES(uid,job.id,action,job.state);
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION swingpilot.codex_review_command(text,jsonb,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION swingpilot.codex_review_command(text,jsonb,uuid,text) TO swingpilot_app;

-- Immutable analytics inputs and manual weekly requests. No financial writes.
CREATE INDEX trades_closed_analytics ON swingpilot.trades(owner_id,closed_at,id) WHERE state='CLOSED';
CREATE INDEX effective_execution_trade ON swingpilot.executions(owner_id,trade_id,batch_id);
CREATE INDEX execution_reversal_lookup ON swingpilot.executions(owner_id,reverses_execution_id) WHERE reverses_execution_id IS NOT NULL;
CREATE FUNCTION swingpilot.analytics_input(date_from date,date_to date) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path=swingpilot,pg_temp AS $$
DECLARE uid uuid:=nullif(current_setting('swingpilot.owner_id',true),'')::uuid; rows jsonb; included bigint;
BEGIN
 IF date_from IS NULL OR date_to IS NULL OR date_from>date_to OR date_from<'1900-01-01'::date OR date_to>'2100-12-31'::date THEN RAISE EXCEPTION 'ANALYTICS_PERIOD_INVALID'; END IF;
 SELECT count(*) INTO included FROM trades WHERE owner_id=uid AND state='CLOSED'
  AND closed_at>=date_from::timestamp AT TIME ZONE 'Asia/Jerusalem'
  AND closed_at<(date_to+1)::timestamp AT TIME ZONE 'Asia/Jerusalem';
 IF included>10000 THEN RAISE EXCEPTION 'ANALYTICS_COHORT_TOO_LARGE'; END IF;
 WITH effective AS (
  SELECT e.* FROM executions e WHERE e.owner_id=uid AND e.kind<>'REVERSAL'
   AND NOT EXISTS(SELECT 1 FROM executions r WHERE r.owner_id=uid AND r.reverses_execution_id=e.id)
 ), cohort AS (
  SELECT t.*,a.quantity approved_quantity,v.entry approved_entry,
   f.quantity first_quantity,f.max_price first_max_price,f.emotion entry_emotion,
   EXISTS(SELECT 1 FROM effective e WHERE e.trade_id=t.id AND e.kind='BUY' AND e.batch_id<>t.initial_batch_id) has_add
  FROM trades t LEFT JOIN plan_approvals a ON a.owner_id=uid AND a.id=t.approval_id
   LEFT JOIN plan_versions v ON v.owner_id=uid AND v.id=a.version_id
   LEFT JOIN LATERAL (SELECT sum(e.quantity) quantity,max(e.price) max_price,
    CASE WHEN count(DISTINCT e.emotion)=1 THEN min(e.emotion) ELSE 'MULTIPLE' END emotion
    FROM effective e WHERE e.trade_id=t.id AND e.kind='BUY' AND e.batch_id=t.initial_batch_id) f ON true
  WHERE t.owner_id=uid AND t.state='CLOSED'
   AND t.closed_at>=date_from::timestamp AT TIME ZONE 'Asia/Jerusalem'
   AND t.closed_at<(date_to+1)::timestamp AT TIME ZONE 'Asia/Jerusalem'
 ) SELECT coalesce(jsonb_agg(jsonb_build_object(
  'id',id,'symbol',symbol,'ledgerRevision',ledger_revision::text,
  'openedAt',to_char(opened_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
  'closedAt',to_char(closed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
  'initialRisk',initial_risk::text,'netPnl',realized_pnl::text,'feeEstimates',fee_estimates,'hasAdd',has_add,
  'firstQuantity',first_quantity::text,'firstMaxPrice',first_max_price::text,
  'approvedQuantity',approved_quantity::text,'approvedEntry',approved_entry::text,
  'entryEmotion',coalesce(entry_emotion,'UNKNOWN')) ORDER BY closed_at,id),'[]'::jsonb) INTO rows FROM cohort;
 RETURN jsonb_build_object('schemaVersion',1,'metricVersion','CLOSED_TRADES_V1',
  'period',jsonb_build_object('from',date_from::text,'to',date_to::text,'zone','Asia/Jerusalem','cohort','FINAL_EFFECTIVE_SELL_DATE'),
  'journalRevision',(SELECT count(*)::text FROM commands WHERE owner_id=uid AND request->>'action'<>'READ_NOTIFICATION'),
  'asOf',to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
  'excluded',jsonb_build_object('openTrades',(SELECT count(*) FROM trades WHERE owner_id=uid AND state='ACTIVE'),
   'outsidePeriod',(SELECT count(*) FROM trades WHERE owner_id=uid AND state='CLOSED')-included),'trades',rows);
END $$;
REVOKE ALL ON FUNCTION swingpilot.analytics_input(date,date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION swingpilot.analytics_input(date,date) TO swingpilot_app;

CREATE TABLE swingpilot.weekly_review_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES swingpilot.app_users(id),
 journal_revision bigint NOT NULL, date_from date NOT NULL, date_to date NOT NULL, include_emotions boolean NOT NULL,
 input jsonb NOT NULL CHECK(jsonb_typeof(input)='object'), input_sha256 text NOT NULL CHECK(input_sha256~'^[a-f0-9]{64}$'),
 transport text NOT NULL DEFAULT 'MANUAL_COPY' CHECK(transport='MANUAL_COPY'),
 state text NOT NULL DEFAULT 'AWAITING_CODEX' CHECK(state IN('AWAITING_CODEX','PAUSED_USAGE','PAUSED_AUTH','PAUSED_BRIDGE','REVIEW_READY','STALE_RESULT','CANCELLED')),
 response jsonb, response_sha256 text, completed_at timestamptz,
 row_version integer NOT NULL DEFAULT 1 CHECK(row_version>0),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(owner_id,id), CHECK(date_from<=date_to),
 CHECK(coalesce((response IS NULL AND response_sha256 IS NULL AND completed_at IS NULL AND state NOT IN('REVIEW_READY','STALE_RESULT'))
    OR(response IS NOT NULL AND jsonb_typeof(response)='object' AND response_sha256~'^[a-f0-9]{64}$' AND completed_at IS NOT NULL AND state IN('REVIEW_READY','STALE_RESULT')),false))
);
CREATE UNIQUE INDEX one_pending_weekly_review ON swingpilot.weekly_review_jobs(owner_id,date_from,date_to,include_emotions,journal_revision)
 WHERE state IN('AWAITING_CODEX','PAUSED_USAGE','PAUSED_AUTH','PAUSED_BRIDGE');
CREATE TABLE swingpilot.weekly_review_commands (
 owner_id uuid NOT NULL REFERENCES swingpilot.app_users(id), id uuid NOT NULL, request_hash text NOT NULL CHECK(request_hash~'^[a-f0-9]{64}$'),
 response jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(owner_id,id)
);
CREATE TABLE swingpilot.weekly_review_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL, job_id uuid NOT NULL,
 action text NOT NULL CHECK(action IN('CREATE','SUBMIT','PAUSE_USAGE','PAUSE_AUTH','PAUSE_BRIDGE','RESUME','CANCEL')),
 state text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), FOREIGN KEY(owner_id,job_id) REFERENCES swingpilot.weekly_review_jobs(owner_id,id)
);
DO $$ DECLARE tab text; BEGIN
 FOREACH tab IN ARRAY ARRAY['weekly_review_jobs','weekly_review_commands','weekly_review_events'] LOOP
  EXECUTE format('ALTER TABLE swingpilot.%I ENABLE ROW LEVEL SECURITY',tab);
  EXECUTE format('ALTER TABLE swingpilot.%I FORCE ROW LEVEL SECURITY',tab);
  EXECUTE format('CREATE POLICY owner_access ON swingpilot.%I TO swingpilot_app USING(owner_id=nullif(current_setting(''swingpilot.owner_id'',true),'''')::uuid)',tab);
  EXECUTE format('GRANT SELECT ON swingpilot.%I TO swingpilot_app',tab);
 END LOOP;
END $$;

CREATE FUNCTION swingpilot.weekly_review_command(action text,body jsonb,key uuid,fingerprint text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=swingpilot,pg_temp AS $$
DECLARE uid uuid:=nullif(current_setting('swingpilot.owner_id',true),'')::uuid;
 job weekly_review_jobs%ROWTYPE;
 prior weekly_review_commands%ROWTYPE; result jsonb; packet jsonb; next_state text; stale boolean; journal_rev bigint;
BEGIN
 IF uid IS NULL OR NOT EXISTS(SELECT 1 FROM app_users WHERE id=uid AND state='ACTIVE') THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
 IF key IS NULL OR fingerprint IS NULL OR fingerprint!~'^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'INVALID_COMMAND'; END IF;
 -- Same owner lock/order as financial commands: pin inputs atomically, never write the ledger.
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text,19485003));
 SELECT count(*) INTO journal_rev FROM commands WHERE owner_id=uid AND request->>'action'<>'READ_NOTIFICATION';
 SELECT * INTO prior FROM weekly_review_commands WHERE owner_id=uid AND id=key;
 IF FOUND THEN
  IF prior.request_hash<>fingerprint THEN RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT'; END IF;
  RETURN prior.response;
 END IF;
 IF action='CREATE' THEN
  IF (body->>'sharingAcknowledged')::boolean IS DISTINCT FROM true THEN RAISE EXCEPTION 'SHARING_ACKNOWLEDGMENT_REQUIRED'; END IF;
  IF jsonb_typeof(body->'includeEmotions') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'REVIEW_SCHEMA_INVALID'; END IF;
  IF journal_rev IS DISTINCT FROM (body->>'expectedJournalRevision')::bigint THEN RAISE EXCEPTION 'REVISION_CONFLICT'; END IF;
  SELECT * INTO job FROM weekly_review_jobs WHERE owner_id=uid AND date_from=(body->>'from')::date
   AND date_to=(body->>'to')::date AND include_emotions=(body->>'includeEmotions')::boolean AND journal_revision=journal_rev
   AND state IN('AWAITING_CODEX','PAUSED_USAGE','PAUSED_AUTH','PAUSED_BRIDGE');
  IF NOT FOUND THEN
   IF (SELECT count(*) FROM weekly_review_jobs WHERE owner_id=uid AND state IN('AWAITING_CODEX','PAUSED_USAGE','PAUSED_AUTH','PAUSED_BRIDGE'))>=8
      OR (SELECT count(*) FROM weekly_review_jobs WHERE owner_id=uid)>=500 THEN RAISE EXCEPTION 'REVIEW_LIMIT_REACHED'; END IF;
   packet:=analytics_input((body->>'from')::date,(body->>'to')::date)||jsonb_build_object('includeEmotions',(body->>'includeEmotions')::boolean);
   INSERT INTO weekly_review_jobs(owner_id,journal_revision,date_from,date_to,include_emotions,input,input_sha256)
    VALUES(uid,journal_rev,(body->>'from')::date,(body->>'to')::date,(body->>'includeEmotions')::boolean,packet,encode(sha256(convert_to(packet::text,'UTF8')),'hex')) RETURNING * INTO job;
  ELSE
   result:=jsonb_build_object('id',job.id,'state',job.state,'rowVersion',job.row_version);
   INSERT INTO weekly_review_commands(owner_id,id,request_hash,response) VALUES(uid,key,fingerprint,result);
   RETURN result;
  END IF;
 ELSE
  SELECT * INTO job FROM weekly_review_jobs WHERE owner_id=uid AND id=(body->>'jobId')::uuid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF job.row_version IS DISTINCT FROM (body->>'expectedRevision')::integer THEN RAISE EXCEPTION 'REVISION_CONFLICT'; END IF;
  IF job.state IN('REVIEW_READY','STALE_RESULT','CANCELLED') THEN RAISE EXCEPTION 'REVIEW_TERMINAL'; END IF;
  stale:=journal_rev<>job.journal_revision;
  IF action='SUBMIT' THEN
   IF job.state<>'AWAITING_CODEX' THEN RAISE EXCEPTION 'REVIEW_PAUSED'; END IF;
   IF (body->>'reviewAcknowledged')::boolean IS DISTINCT FROM true THEN RAISE EXCEPTION 'REVIEW_ACKNOWLEDGMENT_REQUIRED'; END IF;
   IF body->'response'->>'jobId' IS DISTINCT FROM job.id::text OR body->'response'->>'inputSha256' IS DISTINCT FROM job.input_sha256
      OR body->'response'->>'scope' IS DISTINCT FROM 'JOURNAL_ONLY_WEEKLY_REVIEW' THEN RAISE EXCEPTION 'REVIEW_BINDING_MISMATCH'; END IF;
   next_state:=CASE WHEN stale THEN 'STALE_RESULT' ELSE 'REVIEW_READY' END;
   UPDATE weekly_review_jobs SET response=body->'response',response_sha256=encode(sha256(convert_to((body->'response')::text,'UTF8')),'hex'),
    completed_at=now(),state=next_state,row_version=row_version+1,updated_at=now() WHERE id=job.id RETURNING * INTO job;
  ELSE
   next_state:=CASE action WHEN 'PAUSE_USAGE' THEN 'PAUSED_USAGE' WHEN 'PAUSE_AUTH' THEN 'PAUSED_AUTH'
    WHEN 'PAUSE_BRIDGE' THEN 'PAUSED_BRIDGE' WHEN 'RESUME' THEN 'AWAITING_CODEX' WHEN 'CANCEL' THEN 'CANCELLED' ELSE NULL END;
   IF next_state IS NULL THEN RAISE EXCEPTION 'UNKNOWN_REVIEW_COMMAND'; END IF;
   IF action='RESUME' AND (job.state='AWAITING_CODEX' OR stale) THEN RAISE EXCEPTION 'REVIEW_CANNOT_RESUME'; END IF;
   IF next_state=job.state THEN RAISE EXCEPTION 'REVIEW_STATE_UNCHANGED'; END IF;
   UPDATE weekly_review_jobs SET state=next_state,row_version=row_version+1,updated_at=now() WHERE id=job.id RETURNING * INTO job;
  END IF;
 END IF;
 result:=jsonb_build_object('id',job.id,'state',job.state,'rowVersion',job.row_version);
 INSERT INTO weekly_review_commands(owner_id,id,request_hash,response) VALUES(uid,key,fingerprint,result);
 INSERT INTO weekly_review_events(owner_id,job_id,action,state) VALUES(uid,job.id,action,job.state);
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION swingpilot.weekly_review_command(text,jsonb,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION swingpilot.weekly_review_command(text,jsonb,uuid,text) TO swingpilot_app;

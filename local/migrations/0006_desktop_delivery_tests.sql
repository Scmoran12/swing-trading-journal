-- Owner-requested synthetic desktop tests only. No market alert or recurring dispatcher.
CREATE TABLE swingpilot.desktop_test_preferences(
 owner_id uuid PRIMARY KEY REFERENCES swingpilot.app_users(id),enabled boolean NOT NULL DEFAULT false,
 row_version integer NOT NULL DEFAULT 1,updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE swingpilot.desktop_delivery_tests(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),owner_id uuid NOT NULL REFERENCES swingpilot.app_users(id),
 kind text NOT NULL DEFAULT 'DESKTOP_TEST' CHECK(kind='DESKTOP_TEST'),
 state text NOT NULL DEFAULT 'QUEUED' CHECK(state IN('QUEUED','LEASED','ACCEPTED','FAILED','UNKNOWN','RECEIPT_CONFIRMED','EXPIRED','CANCELLED')),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '10 minutes',attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count BETWEEN 0 AND 3),
 lease_token uuid,lease_until timestamptz,receipt_hash text CHECK(receipt_hash~'^[a-f0-9]{64}$'),receipt_attempts integer NOT NULL DEFAULT 0 CHECK(receipt_attempts BETWEEN 0 AND 5),
 accepted_at timestamptz,confirmed_at timestamptz,receipt_context text CHECK(receipt_context IN('WEBSITE_CLOSED','WEBSITE_OPEN','UNKNOWN')),
 row_version integer NOT NULL DEFAULT 1,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(owner_id,id),
 CHECK(state<>'LEASED' OR(lease_token IS NOT NULL AND lease_until IS NOT NULL)),
 CHECK(state<>'RECEIPT_CONFIRMED' OR(confirmed_at IS NOT NULL AND receipt_context IS NOT NULL))
);
CREATE TABLE swingpilot.desktop_delivery_attempts(
 owner_id uuid NOT NULL,test_id uuid NOT NULL,attempt integer NOT NULL,token uuid NOT NULL,
 outcome text NOT NULL CHECK(outcome IN('LEASED','ACCEPTED','FAILED','UNKNOWN')),error_code text,
 started_at timestamptz NOT NULL DEFAULT now(),finished_at timestamptz,
 PRIMARY KEY(owner_id,test_id,attempt),FOREIGN KEY(owner_id,test_id) REFERENCES swingpilot.desktop_delivery_tests(owner_id,id)
);
CREATE TABLE swingpilot.desktop_delivery_events(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),owner_id uuid NOT NULL,test_id uuid,
 action text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(owner_id) REFERENCES swingpilot.app_users(id),FOREIGN KEY(owner_id,test_id) REFERENCES swingpilot.desktop_delivery_tests(owner_id,id)
);
CREATE TABLE swingpilot.desktop_delivery_commands(
 owner_id uuid NOT NULL REFERENCES swingpilot.app_users(id),id uuid NOT NULL,request_hash text NOT NULL CHECK(request_hash~'^[a-f0-9]{64}$'),
 response jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(owner_id,id)
);
DO $$ DECLARE tab text;BEGIN
 FOREACH tab IN ARRAY ARRAY['desktop_test_preferences','desktop_delivery_tests','desktop_delivery_attempts','desktop_delivery_events','desktop_delivery_commands'] LOOP
  EXECUTE format('ALTER TABLE swingpilot.%I ENABLE ROW LEVEL SECURITY',tab);
  EXECUTE format('ALTER TABLE swingpilot.%I FORCE ROW LEVEL SECURITY',tab);
  EXECUTE format('CREATE POLICY owner_access ON swingpilot.%I TO swingpilot_app USING(owner_id=nullif(current_setting(''swingpilot.owner_id'',true),'''')::uuid)',tab);
  EXECUTE format('GRANT SELECT ON swingpilot.%I TO swingpilot_app',tab);
 END LOOP;
END $$;
CREATE FUNCTION swingpilot.reconcile_desktop_tests(uid uuid) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=swingpilot,pg_temp AS $$
DECLARE job desktop_delivery_tests%ROWTYPE;sample_now timestamptz:=clock_timestamp();next_state text;n integer:=0;
BEGIN
 FOR job IN SELECT * FROM desktop_delivery_tests WHERE owner_id=uid AND
  ((state IN('QUEUED','ACCEPTED','FAILED','UNKNOWN','LEASED') AND expires_at<=sample_now) OR(state='LEASED' AND lease_until<=sample_now)) FOR UPDATE LOOP
  next_state:=CASE WHEN job.expires_at<=sample_now THEN 'EXPIRED' ELSE 'UNKNOWN' END;
  UPDATE desktop_delivery_tests SET state=next_state,lease_token=NULL,lease_until=NULL,row_version=row_version+1 WHERE id=job.id;
  IF job.state='LEASED' THEN UPDATE desktop_delivery_attempts SET outcome='UNKNOWN',error_code='LEASE_EXPIRED',finished_at=sample_now
    WHERE owner_id=uid AND test_id=job.id AND outcome='LEASED';END IF;
  INSERT INTO desktop_delivery_events(owner_id,test_id,action)VALUES(uid,job.id,next_state);
  n:=n+1;
 END LOOP;RETURN n;
END $$;
REVOKE ALL ON FUNCTION swingpilot.reconcile_desktop_tests(uuid) FROM PUBLIC;
CREATE FUNCTION swingpilot.desktop_delivery_command(action text,body jsonb,key uuid,fingerprint text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=swingpilot,pg_temp AS $$
DECLARE uid uuid:=nullif(current_setting('swingpilot.owner_id',true),'')::uuid;pref desktop_test_preferences%ROWTYPE;
 job desktop_delivery_tests%ROWTYPE;prior desktop_delivery_commands%ROWTYPE;result jsonb;reconciled integer;matched boolean;
BEGIN
 IF uid IS NULL OR NOT EXISTS(SELECT 1 FROM app_users WHERE id=uid AND state='ACTIVE')THEN RAISE EXCEPTION 'AUTH_REQUIRED';END IF;
 IF key IS NULL OR fingerprint IS NULL OR fingerprint!~'^[a-f0-9]{64}$'THEN RAISE EXCEPTION 'INVALID_COMMAND';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text,19485006));
 SELECT * INTO prior FROM desktop_delivery_commands WHERE owner_id=uid AND id=key;
 IF FOUND THEN IF prior.request_hash<>fingerprint THEN RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT';END IF;RETURN prior.response;END IF;
 reconciled:=reconcile_desktop_tests(uid);
 SELECT * INTO pref FROM desktop_test_preferences WHERE owner_id=uid;
 IF action='PREFERENCE' THEN
  IF coalesce(pref.row_version,0) IS DISTINCT FROM (body->>'expectedRevision')::integer THEN RAISE EXCEPTION 'REVISION_CONFLICT';END IF;
  INSERT INTO desktop_test_preferences(owner_id,enabled)VALUES(uid,(body->>'enabled')::boolean)
   ON CONFLICT(owner_id)DO UPDATE SET enabled=excluded.enabled,row_version=desktop_test_preferences.row_version+1,updated_at=clock_timestamp()
   RETURNING * INTO pref;
  IF NOT pref.enabled THEN
   FOR job IN SELECT * FROM desktop_delivery_tests WHERE owner_id=uid AND state IN('QUEUED','LEASED','ACCEPTED','FAILED','UNKNOWN') FOR UPDATE LOOP
    UPDATE desktop_delivery_tests SET state='CANCELLED',lease_token=NULL,lease_until=NULL,row_version=row_version+1 WHERE id=job.id;
    UPDATE desktop_delivery_attempts SET outcome='UNKNOWN',error_code='PREFERENCE_REVOKED',finished_at=clock_timestamp() WHERE owner_id=uid AND test_id=job.id AND outcome='LEASED';
    INSERT INTO desktop_delivery_events(owner_id,test_id,action)VALUES(uid,job.id,'CANCELLED');
   END LOOP;
  END IF;
  INSERT INTO desktop_delivery_events(owner_id,action)VALUES(uid,'PREFERENCE_CHANGED');
  result:=jsonb_build_object('enabled',pref.enabled,'rowVersion',pref.row_version);
 ELSIF action='QUEUE' THEN
  IF coalesce(pref.enabled,false) IS DISTINCT FROM true THEN RAISE EXCEPTION 'DESKTOP_TESTS_DISABLED';END IF;
  SELECT * INTO job FROM desktop_delivery_tests WHERE owner_id=uid AND state IN('QUEUED','LEASED','ACCEPTED') ORDER BY created_at LIMIT 1;
  IF NOT FOUND THEN
   IF (SELECT count(*) FROM desktop_delivery_tests WHERE owner_id=uid)>=200 OR
      (SELECT count(*) FROM desktop_delivery_tests WHERE owner_id=uid AND created_at>clock_timestamp()-interval '24 hours')>=20 THEN RAISE EXCEPTION 'DESKTOP_TEST_LIMIT';END IF;
   INSERT INTO desktop_delivery_tests(owner_id)VALUES(uid)RETURNING * INTO job;
   INSERT INTO desktop_delivery_events(owner_id,test_id,action)VALUES(uid,job.id,'QUEUED');
  END IF;
  result:=jsonb_build_object('id',job.id,'state',job.state,'rowVersion',job.row_version);
 ELSIF action='RECONCILE' THEN result:=jsonb_build_object('reconciled',reconciled);
 ELSE
  SELECT * INTO job FROM desktop_delivery_tests WHERE owner_id=uid AND id=(body->>'testId')::uuid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND';END IF;
  IF action='FINISH' THEN
   IF job.state<>'LEASED' OR job.lease_token IS DISTINCT FROM (body->>'token')::uuid OR job.lease_until<=clock_timestamp() THEN RAISE EXCEPTION 'STALE_DELIVERY_LEASE';END IF;
   IF body->>'outcome' NOT IN('ACCEPTED','FAILED','UNKNOWN') THEN RAISE EXCEPTION 'DELIVERY_INPUT_INVALID';END IF;
   UPDATE desktop_delivery_tests SET state=body->>'outcome',accepted_at=CASE WHEN body->>'outcome'='ACCEPTED' THEN clock_timestamp() ELSE accepted_at END,
    lease_token=NULL,lease_until=NULL,row_version=row_version+1 WHERE id=job.id RETURNING * INTO job;
   UPDATE desktop_delivery_attempts SET outcome=job.state,error_code=body->>'errorCode',finished_at=clock_timestamp() WHERE owner_id=uid AND test_id=job.id AND token=(body->>'token')::uuid;
  ELSE
   IF job.row_version IS DISTINCT FROM (body->>'expectedRevision')::integer THEN RAISE EXCEPTION 'REVISION_CONFLICT';END IF;
   IF action='CLAIM' THEN
    IF NOT coalesce(pref.enabled,false) OR job.state<>'QUEUED' OR job.expires_at<=clock_timestamp() OR job.attempt_count>=3 THEN RAISE EXCEPTION 'DESKTOP_TEST_UNAVAILABLE';END IF;
    IF body->>'receiptHash' IS NULL OR body->>'receiptHash'!~'^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'DELIVERY_INPUT_INVALID';END IF;
    UPDATE desktop_delivery_tests SET state='LEASED',attempt_count=attempt_count+1,lease_token=(body->>'token')::uuid,lease_until=clock_timestamp()+interval '60 seconds',
     receipt_hash=body->>'receiptHash',receipt_attempts=0,row_version=row_version+1 WHERE id=job.id RETURNING * INTO job;
    INSERT INTO desktop_delivery_attempts(owner_id,test_id,attempt,token,outcome)VALUES(uid,job.id,job.attempt_count,job.lease_token,'LEASED');
   ELSIF action='ACK' THEN
    IF job.state NOT IN('ACCEPTED','UNKNOWN') OR job.receipt_hash IS NULL OR (body->>'seen')::boolean IS DISTINCT FROM true THEN RAISE EXCEPTION 'RECEIPT_UNAVAILABLE';END IF;
    IF body->>'context' IS NULL OR body->>'context' NOT IN('WEBSITE_CLOSED','WEBSITE_OPEN','UNKNOWN') THEN RAISE EXCEPTION 'DELIVERY_INPUT_INVALID';END IF;
    IF job.receipt_attempts>=5 THEN result:=jsonb_build_object('id',job.id,'verified',false,'locked',true,'rowVersion',job.row_version);
    ELSE
     matched:=job.receipt_hash=body->>'receiptHash';
     UPDATE desktop_delivery_tests SET receipt_attempts=receipt_attempts+1,state=CASE WHEN matched THEN 'RECEIPT_CONFIRMED' ELSE state END,
      confirmed_at=CASE WHEN matched THEN clock_timestamp() ELSE NULL END,receipt_context=CASE WHEN matched THEN body->>'context' ELSE NULL END,row_version=row_version+1 WHERE id=job.id RETURNING * INTO job;
     INSERT INTO desktop_delivery_events(owner_id,test_id,action)VALUES(uid,job.id,CASE WHEN matched THEN 'HUMAN_RECEIPT_CONFIRMED' ELSE 'RECEIPT_CODE_REJECTED' END);
     result:=jsonb_build_object('id',job.id,'verified',matched,'locked',job.receipt_attempts>=5,'rowVersion',job.row_version);
    END IF;
   ELSIF action='RETRY' THEN
    IF NOT coalesce(pref.enabled,false) OR job.state<>'FAILED' OR job.attempt_count>=3 THEN RAISE EXCEPTION 'DELIVERY_RETRY_UNAVAILABLE';END IF;
    UPDATE desktop_delivery_tests SET state='QUEUED',receipt_hash=NULL,receipt_attempts=0,row_version=row_version+1 WHERE id=job.id RETURNING * INTO job;
   ELSIF action='CANCEL' THEN
    IF job.state NOT IN('QUEUED','LEASED','ACCEPTED','FAILED','UNKNOWN') THEN RAISE EXCEPTION 'DESKTOP_TEST_TERMINAL';END IF;
    UPDATE desktop_delivery_tests SET state='CANCELLED',lease_token=NULL,lease_until=NULL,row_version=row_version+1 WHERE id=job.id RETURNING * INTO job;
    UPDATE desktop_delivery_attempts SET outcome='UNKNOWN',error_code='CANCELLED_DURING_ATTEMPT',finished_at=clock_timestamp() WHERE owner_id=uid AND test_id=job.id AND outcome='LEASED';
   ELSE RAISE EXCEPTION 'DELIVERY_INPUT_INVALID';END IF;
  END IF;
  IF action<>'ACK' THEN
   INSERT INTO desktop_delivery_events(owner_id,test_id,action)VALUES(uid,job.id,job.state);
   result:=jsonb_build_object('id',job.id,'state',job.state,'rowVersion',job.row_version);
  END IF;
 END IF;
 INSERT INTO desktop_delivery_commands(owner_id,id,request_hash,response)VALUES(uid,key,fingerprint,result);
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION swingpilot.desktop_delivery_command(text,jsonb,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION swingpilot.desktop_delivery_command(text,jsonb,uuid,text) TO swingpilot_app;

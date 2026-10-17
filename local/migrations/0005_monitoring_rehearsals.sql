-- Persist inactive schedule rehearsals. There is no background worker/activation/signal path.
CREATE TABLE swingpilot.monitoring_scenarios (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES swingpilot.app_users(id),
 session_date date NOT NULL CHECK(session_date BETWEEN date '2000-01-01' AND date '2099-12-31'),
 session_status text NOT NULL CHECK(session_status IN('OPEN','CLOSED')),
 regular_close time, source_note text NOT NULL CHECK(length(btrim(source_note)) BETWEEN 1 AND 250),
 calendar_scope text NOT NULL DEFAULT 'MANUAL_REHEARSAL' CHECK(calendar_scope='MANUAL_REHEARSAL'),
 version integer NOT NULL CHECK(version>0), is_current boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(owner_id,id),UNIQUE(owner_id,session_date,version),
 CHECK((session_status='CLOSED' AND regular_close IS NULL) OR(session_status='OPEN' AND regular_close IS NOT NULL AND regular_close IN(time '13:00',time '16:00')))
);
CREATE UNIQUE INDEX current_monitoring_scenario ON swingpilot.monitoring_scenarios(owner_id,session_date) WHERE is_current;
CREATE TABLE swingpilot.monitoring_rehearsal_runs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL, scenario_id uuid NOT NULL,
 reason text NOT NULL CHECK(reason IN('JERUSALEM_2240','AFTER_CLOSE')),
 due_at timestamptz NOT NULL,deadline_at timestamptz NOT NULL CHECK(deadline_at=due_at+interval '5 minutes'),
 state text NOT NULL DEFAULT 'PENDING' CHECK(state IN('PENDING','BLOCKED_GATES','EXPIRED_SUPPRESSED','SUPERSEDED','CANCELLED')),
 assessed_at timestamptz,row_version integer NOT NULL DEFAULT 1 CHECK(row_version>0),created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(owner_id,id),UNIQUE(owner_id,scenario_id,reason),FOREIGN KEY(owner_id,scenario_id) REFERENCES swingpilot.monitoring_scenarios(owner_id,id)
);
CREATE TABLE swingpilot.monitoring_rehearsal_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),owner_id uuid NOT NULL,scenario_id uuid NOT NULL,run_id uuid,
 action text NOT NULL CHECK(action IN('SCENARIO_CREATED','SUPERSEDED','BLOCKED_GATES','EXPIRED_SUPPRESSED','CANCELLED')),
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(owner_id,scenario_id) REFERENCES swingpilot.monitoring_scenarios(owner_id,id),
 FOREIGN KEY(owner_id,run_id) REFERENCES swingpilot.monitoring_rehearsal_runs(owner_id,id)
);
CREATE TABLE swingpilot.monitoring_rehearsal_commands (
 owner_id uuid NOT NULL REFERENCES swingpilot.app_users(id),id uuid NOT NULL,request_hash text NOT NULL CHECK(request_hash~'^[a-f0-9]{64}$'),
 response jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(owner_id,id)
);
DO $$ DECLARE tab text; BEGIN
 FOREACH tab IN ARRAY ARRAY['monitoring_scenarios','monitoring_rehearsal_runs','monitoring_rehearsal_events','monitoring_rehearsal_commands'] LOOP
  EXECUTE format('ALTER TABLE swingpilot.%I ENABLE ROW LEVEL SECURITY',tab);
  EXECUTE format('ALTER TABLE swingpilot.%I FORCE ROW LEVEL SECURITY',tab);
  EXECUTE format('CREATE POLICY owner_access ON swingpilot.%I TO swingpilot_app USING(owner_id=nullif(current_setting(''swingpilot.owner_id'',true),'''')::uuid)',tab);
  EXECUTE format('GRANT SELECT ON swingpilot.%I TO swingpilot_app',tab);
 END LOOP;
END $$;
CREATE FUNCTION swingpilot.monitoring_rehearsal_command(action text,body jsonb,key uuid,fingerprint text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=swingpilot,pg_temp AS $$
DECLARE uid uuid:=nullif(current_setting('swingpilot.owner_id',true),'')::uuid;
 scenario monitoring_scenarios%ROWTYPE;run monitoring_rehearsal_runs%ROWTYPE;prior monitoring_rehearsal_commands%ROWTYPE;
 result jsonb;sid uuid;version_no integer;due timestamptz;sample_now timestamptz;new_state text;reason_code text;
 blocked integer:=0;expired integer:=0;
BEGIN
 IF uid IS NULL OR NOT EXISTS(SELECT 1 FROM app_users WHERE id=uid AND state='ACTIVE') THEN RAISE EXCEPTION 'AUTH_REQUIRED';END IF;
 IF key IS NULL OR fingerprint IS NULL OR fingerprint!~'^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'INVALID_COMMAND';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text,19485005));
 SELECT * INTO prior FROM monitoring_rehearsal_commands WHERE owner_id=uid AND id=key;
 IF FOUND THEN
  IF prior.request_hash<>fingerprint THEN RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT';END IF;
  RETURN prior.response;
 END IF;
 IF action='SAVE_SCENARIO' THEN
  IF (body->>'acknowledgedRehearsal')::boolean IS DISTINCT FROM true THEN RAISE EXCEPTION 'REHEARSAL_ACKNOWLEDGMENT_REQUIRED';END IF;
  SELECT * INTO scenario FROM monitoring_scenarios WHERE owner_id=uid AND session_date=(body->>'sessionDate')::date AND is_current;
  IF coalesce(scenario.version,0) IS DISTINCT FROM (body->>'expectedVersion')::integer THEN RAISE EXCEPTION 'REVISION_CONFLICT';END IF;
  IF scenario.id IS NOT NULL AND scenario.session_status=body->>'sessionStatus' AND scenario.regular_close IS NOT DISTINCT FROM (body->>'regularClose')::time
    AND scenario.source_note=body->>'sourceNote' THEN
   sid:=scenario.id;version_no:=scenario.version;
  ELSE
   IF (SELECT count(*) FROM monitoring_scenarios WHERE owner_id=uid)>=500 THEN RAISE EXCEPTION 'REHEARSAL_LIMIT_REACHED';END IF;
   version_no:=coalesce(scenario.version,0)+1;
   IF scenario.id IS NOT NULL THEN
    UPDATE monitoring_scenarios SET is_current=false WHERE id=scenario.id;
    FOR run IN SELECT * FROM monitoring_rehearsal_runs WHERE owner_id=uid AND scenario_id=scenario.id AND state IN('PENDING','BLOCKED_GATES') FOR UPDATE LOOP
     UPDATE monitoring_rehearsal_runs SET state='SUPERSEDED',assessed_at=clock_timestamp(),row_version=row_version+1 WHERE id=run.id;
     INSERT INTO monitoring_rehearsal_events(owner_id,scenario_id,run_id,action)VALUES(uid,scenario.id,run.id,'SUPERSEDED');
    END LOOP;
   END IF;
   INSERT INTO monitoring_scenarios(owner_id,session_date,session_status,regular_close,source_note,version)
    VALUES(uid,(body->>'sessionDate')::date,body->>'sessionStatus',(body->>'regularClose')::time,body->>'sourceNote',version_no) RETURNING id INTO sid;
   IF body->>'sessionStatus'='OPEN' THEN
    FOREACH reason_code IN ARRAY ARRAY['JERUSALEM_2240','AFTER_CLOSE'] LOOP
     due:=CASE WHEN reason_code='JERUSALEM_2240' THEN ((body->>'sessionDate')::date+time '22:40') AT TIME ZONE 'Asia/Jerusalem'
      ELSE (((body->>'sessionDate')::date+(body->>'regularClose')::time) AT TIME ZONE 'America/New_York')+interval '15 minutes' END;
     INSERT INTO monitoring_rehearsal_runs(owner_id,scenario_id,reason,due_at,deadline_at)VALUES(uid,sid,reason_code,due,due+interval '5 minutes');
    END LOOP;
   END IF;
   INSERT INTO monitoring_rehearsal_events(owner_id,scenario_id,action)VALUES(uid,sid,'SCENARIO_CREATED');
  END IF;
  result:=jsonb_build_object('id',sid,'version',version_no,'scope','MANUAL_REHEARSAL','automaticMonitoring',false);
 ELSIF action='RECONCILE' THEN
  sample_now:=clock_timestamp();
  FOR run IN SELECT r.* FROM monitoring_rehearsal_runs r JOIN monitoring_scenarios s ON s.id=r.scenario_id AND s.owner_id=r.owner_id
    WHERE r.owner_id=uid AND s.is_current AND r.state IN('PENDING','BLOCKED_GATES') AND r.due_at<=sample_now ORDER BY r.due_at,r.id FOR UPDATE OF r LOOP
   new_state:=CASE WHEN sample_now>=run.deadline_at THEN 'EXPIRED_SUPPRESSED' ELSE 'BLOCKED_GATES' END;
   IF new_state<>run.state THEN
    UPDATE monitoring_rehearsal_runs SET state=new_state,assessed_at=sample_now,row_version=row_version+1 WHERE id=run.id;
    INSERT INTO monitoring_rehearsal_events(owner_id,scenario_id,run_id,action)VALUES(uid,run.scenario_id,run.id,new_state);
    IF new_state='BLOCKED_GATES' THEN blocked:=blocked+1;ELSE expired:=expired+1;END IF;
   END IF;
  END LOOP;
  result:=jsonb_build_object('blocked',blocked,'expired',expired,'assessedAt',sample_now,'automaticMonitoring',false);
 ELSIF action='CANCEL_RUN' THEN
  SELECT * INTO run FROM monitoring_rehearsal_runs WHERE owner_id=uid AND id=(body->>'runId')::uuid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND';END IF;
  IF run.row_version IS DISTINCT FROM (body->>'expectedRevision')::integer THEN RAISE EXCEPTION 'REVISION_CONFLICT';END IF;
  IF run.state NOT IN('PENDING','BLOCKED_GATES') THEN RAISE EXCEPTION 'REHEARSAL_TERMINAL';END IF;
  UPDATE monitoring_rehearsal_runs SET state='CANCELLED',assessed_at=clock_timestamp(),row_version=row_version+1 WHERE id=run.id;
  INSERT INTO monitoring_rehearsal_events(owner_id,scenario_id,run_id,action)VALUES(uid,run.scenario_id,run.id,'CANCELLED');
  result:=jsonb_build_object('id',run.id,'state','CANCELLED','rowVersion',run.row_version+1,'automaticMonitoring',false);
 ELSE RAISE EXCEPTION 'UNKNOWN_REHEARSAL_COMMAND';
 END IF;
 INSERT INTO monitoring_rehearsal_commands(owner_id,id,request_hash,response)VALUES(uid,key,fingerprint,result);
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION swingpilot.monitoring_rehearsal_command(text,jsonb,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION swingpilot.monitoring_rehearsal_command(text,jsonb,uuid,text) TO swingpilot_app;

CREATE TABLE swingpilot.plans(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),owner_id uuid NOT NULL REFERENCES swingpilot.app_users(id),portfolio_id uuid NOT NULL,
 symbol text NOT NULL CHECK(symbol~'^[A-Z][A-Z0-9.-]{0,9}$'),exchange text NOT NULL CHECK(exchange IN('XNYS','XNAS')),
 sector text NOT NULL CHECK(length(sector) BETWEEN 1 AND 80),identity_source text NOT NULL DEFAULT 'MANUAL_REFERENCE' CHECK(identity_source='MANUAL_REFERENCE'),
 state text NOT NULL DEFAULT 'DRAFT' CHECK(state IN('DRAFT','APPROVED','PAUSED','ARCHIVED')),entry_state text NOT NULL DEFAULT 'WAITING' CHECK(entry_state IN('WAITING','ENTERED')),current_version integer NOT NULL DEFAULT 1,
 row_version bigint NOT NULL DEFAULT 1,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(owner_id,id),
 FOREIGN KEY(owner_id,portfolio_id) REFERENCES swingpilot.portfolios(owner_id,id)
);
CREATE TABLE swingpilot.plan_versions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),owner_id uuid NOT NULL,plan_id uuid NOT NULL,version integer NOT NULL,
 entry numeric(20,8) NOT NULL CHECK(entry>0 AND entry<>'NaN'::numeric),stop numeric(20,8) NOT NULL CHECK(stop>0 AND stop<entry),
 target numeric(20,8) NOT NULL CHECK(target>entry),buy_fee numeric(20,8) NOT NULL CHECK(buy_fee>=0 AND buy_fee<>'NaN'::numeric),
 sell_fee numeric(20,8) NOT NULL CHECK(sell_fee>=0 AND sell_fee<>'NaN'::numeric),slippage numeric(20,8) NOT NULL CHECK(slippage>=0 AND slippage<stop),
 thesis text NOT NULL CHECK(length(thesis) BETWEEN 1 AND 5000),invalidation text NOT NULL CHECK(length(invalidation) BETWEEN 1 AND 5000),
 expires_at timestamptz NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(owner_id,id),UNIQUE(plan_id,version),
 FOREIGN KEY(owner_id,plan_id) REFERENCES swingpilot.plans(owner_id,id)
);
CREATE TABLE swingpilot.plan_approvals(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),owner_id uuid NOT NULL,plan_id uuid NOT NULL,version_id uuid NOT NULL,
 quantity bigint NOT NULL CHECK(quantity>0),snapshot jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(owner_id,id),
 FOREIGN KEY(owner_id,plan_id) REFERENCES swingpilot.plans(owner_id,id),FOREIGN KEY(owner_id,version_id) REFERENCES swingpilot.plan_versions(owner_id,id)
);
CREATE TABLE swingpilot.trades(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),owner_id uuid NOT NULL,portfolio_id uuid NOT NULL,plan_id uuid,approval_id uuid,
 symbol text NOT NULL,exchange text NOT NULL,sector text NOT NULL,initial_batch_id uuid NOT NULL,
 initial_stop numeric(20,8) CHECK(initial_stop>0 AND initial_stop<>'NaN'::numeric),current_stop numeric(20,8) CHECK(current_stop>0 AND current_stop<>'NaN'::numeric),fee_estimates boolean NOT NULL DEFAULT false,
 quantity bigint NOT NULL DEFAULT 0 CHECK(quantity>=0 AND quantity<=9007199254740991),remaining_basis numeric(20,8) NOT NULL DEFAULT 0,
 cash_delta numeric(20,8) NOT NULL DEFAULT 0,realized_pnl numeric(20,8) NOT NULL DEFAULT 0,initial_risk numeric(20,8),
 state text NOT NULL DEFAULT 'ACTIVE' CHECK(state IN('ACTIVE','CLOSED')),opened_at timestamptz,closed_at timestamptz,
 ledger_revision bigint NOT NULL DEFAULT 0,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(owner_id,id),
 FOREIGN KEY(owner_id,portfolio_id) REFERENCES swingpilot.portfolios(owner_id,id),FOREIGN KEY(owner_id,plan_id) REFERENCES swingpilot.plans(owner_id,id),
 FOREIGN KEY(owner_id,approval_id) REFERENCES swingpilot.plan_approvals(owner_id,id)
);
CREATE UNIQUE INDEX one_active_instrument ON swingpilot.trades(portfolio_id,symbol,exchange) WHERE state='ACTIVE';
CREATE TABLE swingpilot.executions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),owner_id uuid NOT NULL,trade_id uuid NOT NULL,batch_id uuid NOT NULL,
 kind text NOT NULL CHECK(kind IN('BUY','SELL','REVERSAL')),quantity bigint,price numeric(20,8),fee numeric(20,8),fee_source text NOT NULL DEFAULT 'RECORDED' CHECK(fee_source IN('RECORDED','ESTIMATED')),
 emotion text CHECK(emotion IN('CALM','CONFIDENT','FOMO','FEAR','GREED','FRUSTRATED','UNKNOWN','DECLINED')),
 executed_at timestamptz NOT NULL CHECK(executed_at<=now()+interval '5 minutes'),ordering_sequence bigint GENERATED ALWAYS AS IDENTITY,
 reverses_execution_id uuid,reason text,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(owner_id,id),UNIQUE(reverses_execution_id),
 FOREIGN KEY(owner_id,trade_id) REFERENCES swingpilot.trades(owner_id,id),FOREIGN KEY(owner_id,reverses_execution_id) REFERENCES swingpilot.executions(owner_id,id),
 CHECK((kind='REVERSAL' AND reverses_execution_id IS NOT NULL AND quantity IS NULL AND price IS NULL AND fee IS NULL AND length(reason)>0)
 OR(kind IN('BUY','SELL') AND reverses_execution_id IS NULL AND quantity>0 AND quantity<=9007199254740991 AND price>0 AND price<>'NaN'::numeric AND fee>=0 AND fee<>'NaN'::numeric)),
 CHECK(kind<>'BUY' OR emotion IS NOT NULL)
);
CREATE INDEX execution_replay ON swingpilot.executions(owner_id,trade_id,executed_at,ordering_sequence);
CREATE TABLE swingpilot.stop_events(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),owner_id uuid NOT NULL,trade_id uuid NOT NULL,stop numeric(20,8) NOT NULL CHECK(stop>0 AND stop<>'NaN'::numeric),
 reason text NOT NULL CHECK(length(reason) BETWEEN 1 AND 5000),effective_at timestamptz NOT NULL CHECK(effective_at<=now()+interval '5 minutes'),created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(owner_id,trade_id) REFERENCES swingpilot.trades(owner_id,id),UNIQUE(owner_id,id)
);
CREATE TABLE swingpilot.cash_events(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),owner_id uuid NOT NULL,portfolio_id uuid NOT NULL,
 kind text NOT NULL CHECK(kind IN('DEPOSIT','WITHDRAWAL','DIVIDEND','ACCOUNT_FEE','TAX','REVERSAL')),amount numeric(20,8) NOT NULL CHECK(amount<>0 AND amount<>'NaN'::numeric),
 flow_class text NOT NULL CHECK(flow_class IN('EXTERNAL','INTERNAL')),effective_at timestamptz NOT NULL CHECK(effective_at<=now()+interval '5 minutes'),
 reason text NOT NULL CHECK(length(reason) BETWEEN 1 AND 5000),reverses_id uuid UNIQUE,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(owner_id,id),
 FOREIGN KEY(owner_id,portfolio_id) REFERENCES swingpilot.portfolios(owner_id,id),FOREIGN KEY(owner_id,reverses_id) REFERENCES swingpilot.cash_events(owner_id,id),
 CHECK(kind='REVERSAL' OR(kind IN('DEPOSIT','DIVIDEND') AND amount>0)OR(kind IN('WITHDRAWAL','ACCOUNT_FEE','TAX') AND amount<0)),
 CHECK((kind='REVERSAL')=(reverses_id IS NOT NULL))
);
CREATE TABLE swingpilot.manual_marks(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),owner_id uuid NOT NULL,trade_id uuid NOT NULL,price numeric(20,8) NOT NULL CHECK(price>0 AND price<>'NaN'::numeric),
 as_of timestamptz NOT NULL CHECK(as_of<=now()+interval '5 minutes'),ledger_revision bigint NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(owner_id,id),
 FOREIGN KEY(owner_id,trade_id) REFERENCES swingpilot.trades(owner_id,id)
);
CREATE TABLE swingpilot.trade_notes(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),owner_id uuid NOT NULL,trade_id uuid NOT NULL,upload_id uuid,body text NOT NULL CHECK(length(body) BETWEEN 1 AND 5000),created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(owner_id,trade_id) REFERENCES swingpilot.trades(owner_id,id),FOREIGN KEY(owner_id,upload_id) REFERENCES swingpilot.uploads(owner_id,id),UNIQUE(owner_id,id)
);
CREATE TABLE swingpilot.commands(owner_id uuid NOT NULL REFERENCES swingpilot.app_users(id),id uuid NOT NULL,request_hash text NOT NULL,request jsonb NOT NULL,response jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(owner_id,id));
CREATE TABLE swingpilot.audit_events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),owner_id uuid NOT NULL REFERENCES swingpilot.app_users(id),command_id uuid NOT NULL,action text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),FOREIGN KEY(owner_id,command_id) REFERENCES swingpilot.commands(owner_id,id));
CREATE TABLE swingpilot.notifications(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),owner_id uuid NOT NULL REFERENCES swingpilot.app_users(id),command_id uuid NOT NULL,kind text NOT NULL,read_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(owner_id,command_id),FOREIGN KEY(owner_id,command_id) REFERENCES swingpilot.commands(owner_id,id));

DO $$ DECLARE tab text; BEGIN
 FOREACH tab IN ARRAY ARRAY['plans','plan_versions','plan_approvals','trades','executions','stop_events','cash_events','manual_marks','trade_notes','commands','audit_events','notifications'] LOOP
  EXECUTE format('ALTER TABLE swingpilot.%I ENABLE ROW LEVEL SECURITY',tab);
  EXECUTE format('ALTER TABLE swingpilot.%I FORCE ROW LEVEL SECURITY',tab);
  EXECUTE format('CREATE POLICY owner_access ON swingpilot.%I TO swingpilot_app USING(owner_id=nullif(current_setting(''swingpilot.owner_id'',true),'''')::uuid)',tab);
  EXECUTE format('GRANT SELECT ON swingpilot.%I TO swingpilot_app',tab);
 END LOOP;
END $$;
-- Runtime cannot directly mutate financial facts/projections; only the bounded command below.
REVOKE INSERT,UPDATE ON swingpilot.portfolios FROM swingpilot_app;

CREATE TYPE swingpilot.fifo_lot AS(execution_id uuid,quantity bigint,price numeric,fee numeric);
CREATE FUNCTION swingpilot.replay_trade(uid uuid,tid uuid) RETURNS void LANGUAGE plpgsql SET search_path=swingpilot,pg_temp AS $$
DECLARE tr trades%ROWTYPE;ex executions%ROWTYPE;lots fifo_lot[]:=ARRAY[]::fifo_lot[];n integer;i integer;remaining bigint;take bigint;
 qty bigint:=0;cash numeric:=0;pnl numeric:=0;basis numeric:=0;risk numeric:=0;risk_valid boolean:=true;bf numeric;sf numeric;allocated numeric;
 opened timestamptz;closed timestamptz;stop_value numeric;
BEGIN
 SELECT * INTO STRICT tr FROM trades WHERE id=tid AND owner_id=uid;
 FOR ex IN SELECT e.* FROM executions e WHERE e.trade_id=tid AND e.owner_id=uid AND e.kind<>'REVERSAL'
  AND NOT EXISTS(SELECT 1 FROM executions r WHERE r.reverses_execution_id=e.id)
  ORDER BY e.executed_at,e.ordering_sequence,e.id LOOP
  IF ex.kind='BUY' THEN
   lots:=array_append(lots,ROW(ex.id,ex.quantity,ex.price,ex.fee)::fifo_lot);qty:=qty+ex.quantity;cash:=cash-ex.quantity*ex.price-ex.fee;
   opened:=coalesce(opened,ex.executed_at);closed:=NULL;
   IF ex.batch_id=tr.initial_batch_id THEN
    IF ex.price<=tr.initial_stop THEN risk_valid:=false;END IF;
    risk:=risk+ex.quantity*(ex.price-tr.initial_stop);
   END IF;
  ELSE
   IF ex.quantity>qty THEN RAISE EXCEPTION 'OVERSELL';END IF;
   remaining:=ex.quantity;allocated:=0;cash:=cash+ex.quantity*ex.price-ex.fee;
   FOR i IN 1..coalesce(array_length(lots,1),0) LOOP
    EXIT WHEN remaining=0;IF (lots[i]).quantity=0 THEN CONTINUE;END IF;
    take:=least(remaining,(lots[i]).quantity);
    bf:=CASE WHEN take=(lots[i]).quantity THEN (lots[i]).fee ELSE round((lots[i]).fee*take/(lots[i]).quantity,8) END;
    sf:=CASE WHEN take=remaining THEN ex.fee-allocated ELSE round(ex.fee*take/ex.quantity,8) END;
    allocated:=allocated+sf;pnl:=pnl+take*(ex.price-(lots[i]).price)-bf-sf;
    lots[i]:=ROW((lots[i]).execution_id,(lots[i]).quantity-take,(lots[i]).price,(lots[i]).fee-bf)::fifo_lot;
    remaining:=remaining-take;
   END LOOP;
   qty:=qty-ex.quantity;IF qty=0 THEN closed:=ex.executed_at;END IF;
  END IF;
 END LOOP;
 FOR i IN 1..coalesce(array_length(lots,1),0) LOOP basis:=basis+(lots[i]).quantity*(lots[i]).price+(lots[i]).fee;END LOOP;
 SELECT stop INTO stop_value FROM stop_events WHERE trade_id=tid AND owner_id=uid ORDER BY effective_at DESC,created_at DESC,id DESC LIMIT 1;
 UPDATE trades SET quantity=qty,remaining_basis=basis,cash_delta=cash,realized_pnl=pnl,
 initial_risk=CASE WHEN risk_valid AND risk>0 THEN risk ELSE NULL END,current_stop=coalesce(stop_value,tr.initial_stop),
 state=CASE WHEN qty=0 THEN 'CLOSED' ELSE 'ACTIVE' END,fee_estimates=EXISTS(SELECT 1 FROM executions e WHERE e.owner_id=uid AND e.trade_id=tid AND e.fee_source='ESTIMATED' AND e.kind<>'REVERSAL' AND NOT EXISTS(SELECT 1 FROM executions r WHERE r.reverses_execution_id=e.id)),opened_at=opened,closed_at=closed,ledger_revision=ledger_revision+1 WHERE id=tid AND owner_id=uid;
END $$;
REVOKE ALL ON FUNCTION swingpilot.replay_trade(uuid,uuid) FROM PUBLIC;

CREATE FUNCTION swingpilot.journal_totals(uid uuid,pid uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=swingpilot,pg_temp AS $$
 SELECT jsonb_build_object('cash',cash::text,'equity',CASE WHEN missing=0 THEN(cash+exposure)::text ELSE NULL END,'exposure',exposure::text,'missingMarks',missing,'realized',realized::text,'estimatedFees',EXISTS(SELECT 1 FROM trades WHERE owner_id=uid AND portfolio_id=pid AND fee_estimates),
 'marks',coalesce((SELECT jsonb_agg(jsonb_build_object('id',m.id,'tradeId',t.id,'symbol',t.symbol,'price',m.price::text,'asOf',m.as_of,'ledgerRevision',m.ledger_revision)) FROM trades t JOIN LATERAL(SELECT * FROM manual_marks WHERE owner_id=uid AND trade_id=t.id AND ledger_revision=t.ledger_revision ORDER BY created_at DESC,id DESC LIMIT 1)m ON true WHERE t.owner_id=uid AND t.portfolio_id=pid AND t.quantity>0),'[]'::jsonb))
 FROM(SELECT p.opening_cash+coalesce((SELECT sum(amount) FROM cash_events WHERE owner_id=uid AND portfolio_id=pid),0)+coalesce((SELECT sum(cash_delta) FROM trades WHERE owner_id=uid AND portfolio_id=pid),0)cash,
 coalesce((SELECT sum(t.quantity*m.price) FROM trades t LEFT JOIN LATERAL(SELECT price FROM manual_marks WHERE owner_id=uid AND trade_id=t.id AND ledger_revision=t.ledger_revision ORDER BY created_at DESC,id DESC LIMIT 1)m ON true WHERE t.owner_id=uid AND t.portfolio_id=pid AND t.quantity>0),0)exposure,
 (SELECT count(*) FROM trades t WHERE t.owner_id=uid AND t.portfolio_id=pid AND t.quantity>0 AND NOT EXISTS(SELECT 1 FROM manual_marks m WHERE m.owner_id=uid AND m.trade_id=t.id AND m.ledger_revision=t.ledger_revision))missing,
 coalesce((SELECT sum(realized_pnl) FROM trades WHERE owner_id=uid AND portfolio_id=pid),0)realized
 FROM portfolios p WHERE p.owner_id=uid AND p.id=pid)q
 WHERE uid=nullif(current_setting('swingpilot.owner_id',true),'')::uuid
$$;
REVOKE ALL ON FUNCTION swingpilot.journal_totals(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION swingpilot.journal_totals(uuid,uuid) TO swingpilot_app;

CREATE FUNCTION swingpilot.journal_command(action text,body jsonb,key uuid,fingerprint text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=swingpilot,pg_temp AS $$
DECLARE uid uuid:=nullif(current_setting('swingpilot.owner_id',true),'')::uuid;pid uuid;tid uuid;pl plans%ROWTYPE;ver plan_versions%ROWTYPE;tr trades%ROWTYPE;ex executions%ROWTYPE;ce cash_events%ROWTYPE;
 port portfolios%ROWTYPE;prior commands%ROWTYPE;result jsonb;totals jsonb;newid uuid;batch uuid:=gen_random_uuid();fill jsonb;vnum integer;approved plan_approvals%ROWTYPE;
 equity numeric;cash numeric;exposure numeric;sector_exposure numeric;symbol_exposure numeric;quantity bigint;budget numeric;cap bigint;deviation boolean:=false;delta numeric;next_amount numeric; old_value numeric:=0; fill_price numeric;
BEGIN
 IF uid IS NULL OR NOT EXISTS(SELECT 1 FROM app_users WHERE id=uid AND state='ACTIVE')THEN RAISE EXCEPTION 'AUTH_REQUIRED';END IF;
 IF length(fingerprint)<>64 THEN RAISE EXCEPTION 'INVALID_COMMAND';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text,19485003));
 SELECT * INTO prior FROM commands WHERE owner_id=uid AND id=key;
 IF FOUND THEN IF prior.request_hash<>fingerprint THEN RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT';END IF;RETURN prior.response;END IF;
 IF action='CREATE_PORTFOLIO' THEN
  INSERT INTO portfolios(owner_id,name,opening_cash,opening_cash_at,risk_per_trade_fraction,max_position_fraction,max_total_exposure_fraction,max_sector_fraction,cash_buffer)
   VALUES(uid,body->>'name',(body->>'openingCash')::numeric,(body->>'asOf')::timestamptz,(body->>'riskFraction')::numeric,(body->>'positionFraction')::numeric,(body->>'exposureFraction')::numeric,(body->>'sectorFraction')::numeric,(body->>'cashBuffer')::numeric) RETURNING id INTO newid;
  result:=jsonb_build_object('id',newid);
 ELSE
  SELECT * INTO port FROM portfolios WHERE owner_id=uid AND archived_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PORTFOLIO_REQUIRED';END IF;pid:=port.id;
  IF action IN('SAVE_PLAN','APPROVE_PLAN','PAUSE_PLAN','ARCHIVE_PLAN','BUY') AND body?'planId' THEN
   SELECT * INTO pl FROM plans WHERE owner_id=uid AND id=(body->>'planId')::uuid AND portfolio_id=pid FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND';END IF;
   IF action<>'BUY' OR NOT(body?'tradeId')THEN
    IF pl.row_version IS DISTINCT FROM (body->>'expectedRevision')::bigint THEN RAISE EXCEPTION 'REVISION_CONFLICT';END IF;
   END IF;
   SELECT * INTO ver FROM plan_versions WHERE plan_id=pl.id AND owner_id=uid AND version=pl.current_version;
  END IF;
  IF action IN('SELL','BUY','CORRECT_EXECUTION','SET_STOP','SET_MARK','ADD_NOTE')AND body?'tradeId' THEN
   SELECT * INTO tr FROM trades WHERE owner_id=uid AND id=(body->>'tradeId')::uuid AND portfolio_id=pid FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND';END IF;
   IF tr.ledger_revision IS DISTINCT FROM (body->>'expectedRevision')::bigint THEN RAISE EXCEPTION 'REVISION_CONFLICT';END IF;tid:=tr.id;
  END IF;
  IF action='UPDATE_POLICY' THEN
   IF port.row_version IS DISTINCT FROM (body->>'expectedRevision')::bigint THEN RAISE EXCEPTION 'REVISION_CONFLICT';END IF;
   UPDATE portfolios SET risk_per_trade_fraction=(body->>'riskFraction')::numeric,max_position_fraction=(body->>'positionFraction')::numeric,max_total_exposure_fraction=(body->>'exposureFraction')::numeric,max_sector_fraction=(body->>'sectorFraction')::numeric,cash_buffer=(body->>'cashBuffer')::numeric,policy_version=policy_version+1,row_version=row_version+1,updated_at=now() WHERE id=pid;result:=jsonb_build_object('id',pid);
  ELSIF action='SAVE_PLAN' THEN
   IF NOT coalesce((body->>'manualIdentityAcknowledged')::boolean,false)THEN RAISE EXCEPTION 'MANUAL_IDENTITY_REQUIRED';END IF;
   IF pl.id IS NULL THEN
    INSERT INTO plans(owner_id,portfolio_id,symbol,exchange,sector)VALUES(uid,pid,body->>'symbol',body->>'exchange',body->>'sector')RETURNING * INTO pl;
   ELSE
    UPDATE plans SET current_version=current_version+1,row_version=row_version+1 WHERE id=pl.id RETURNING * INTO pl;
   END IF;
   INSERT INTO plan_versions(owner_id,plan_id,version,entry,stop,target,buy_fee,sell_fee,slippage,thesis,invalidation,expires_at)
    VALUES(uid,pl.id,pl.current_version,(body->>'entry')::numeric,(body->>'stop')::numeric,(body->>'target')::numeric,(body->>'buyFee')::numeric,(body->>'sellFee')::numeric,(body->>'slippage')::numeric,body->>'thesis',body->>'invalidation',(body->>'expiresAt')::timestamptz)RETURNING id INTO newid;
   result:=jsonb_build_object('id',pl.id,'versionId',newid);
  ELSIF action='APPROVE_PLAN' THEN
   IF pl.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND';END IF;
   IF pl.entry_state='ENTERED' THEN RAISE EXCEPTION 'PLAN_ALREADY_ENTERED';END IF;
   IF ver.expires_at<=now() OR pl.state='ARCHIVED' THEN RAISE EXCEPTION 'PLAN_EXPIRED_OR_ARCHIVED';END IF;
   IF NOT coalesce((body->>'manualValuationAcknowledged')::boolean,false)THEN RAISE EXCEPTION 'MANUAL_VALUATION_REQUIRED';END IF;
   totals:=journal_totals(uid,pid);IF(totals->>'equity')IS NULL THEN RAISE EXCEPTION 'MANUAL_MARKS_REQUIRED';END IF;
   equity:=(totals->>'equity')::numeric;cash:=(totals->>'cash')::numeric;exposure:=(totals->>'exposure')::numeric;
   SELECT coalesce(sum(t.quantity*m.price),0) INTO sector_exposure FROM trades t JOIN LATERAL(SELECT price FROM manual_marks WHERE owner_id=uid AND trade_id=t.id AND ledger_revision=t.ledger_revision ORDER BY created_at DESC,id DESC LIMIT 1)m ON true WHERE t.owner_id=uid AND t.portfolio_id=pid AND t.quantity>0 AND t.sector=pl.sector;
   SELECT coalesce(sum(t.quantity*m.price),0) INTO symbol_exposure FROM trades t JOIN LATERAL(SELECT price FROM manual_marks WHERE owner_id=uid AND trade_id=t.id AND ledger_revision=t.ledger_revision ORDER BY created_at DESC,id DESC LIMIT 1)m ON true WHERE t.owner_id=uid AND t.portfolio_id=pid AND t.quantity>0 AND t.symbol=pl.symbol AND t.exchange=pl.exchange;
   cap:=greatest(0,least(9007199254740991,floor((equity*port.risk_per_trade_fraction-ver.buy_fee-ver.sell_fee)/(ver.entry-ver.stop+ver.slippage)),floor((cash-port.cash_buffer-ver.buy_fee)/ver.entry),floor((equity*port.max_position_fraction-symbol_exposure)/ver.entry),floor((equity*port.max_total_exposure_fraction-exposure)/ver.entry),floor((equity*port.max_sector_fraction-sector_exposure)/ver.entry)))::bigint;
   IF cap<1 THEN RAISE EXCEPTION 'RISK_BLOCKED';END IF;
   INSERT INTO plan_approvals(owner_id,plan_id,version_id,quantity,snapshot)VALUES(uid,pl.id,ver.id,cap,jsonb_build_object('mode','JOURNAL_ONLY','totals',totals,'policy',jsonb_build_object('portfolioId',port.id,'policyVersion',port.policy_version,'riskFraction',port.risk_per_trade_fraction::text,'positionFraction',port.max_position_fraction::text,'exposureFraction',port.max_total_exposure_fraction::text,'sectorFraction',port.max_sector_fraction::text,'cashBuffer',port.cash_buffer::text,'openingCash',port.opening_cash::text,'openingCashAt',port.opening_cash_at),'feesBuy',ver.buy_fee::text,'feesSell',ver.sell_fee::text,'slippage',ver.slippage::text))RETURNING id INTO newid;
   UPDATE plans SET state='APPROVED',row_version=row_version+1 WHERE id=pl.id;result:=jsonb_build_object('id',newid,'quantity',cap);
  ELSIF action IN('PAUSE_PLAN','ARCHIVE_PLAN')THEN
   IF pl.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND';END IF;
   UPDATE plans SET state=CASE WHEN action='PAUSE_PLAN' THEN 'PAUSED' ELSE 'ARCHIVED' END,row_version=row_version+1 WHERE id=pl.id;result:=jsonb_build_object('id',pl.id);
  ELSIF action IN('BUY','SELL')THEN
   IF NOT coalesce((body->>'actualExecution')::boolean,false) THEN RAISE EXCEPTION 'ACTUAL_EXECUTION_REQUIRED';END IF;
   IF jsonb_typeof(body->'fills')<>'array' OR jsonb_array_length(body->'fills')NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'FILLS_REQUIRED';END IF;
   totals:=journal_totals(uid,pid);equity:=(totals->>'equity')::numeric;exposure:=(totals->>'exposure')::numeric;
   IF action='BUY' THEN
    SELECT coalesce(sum(t.quantity*m.price),0),coalesce(sum(t.quantity*m.price)FILTER(WHERE t.sector=coalesce(tr.sector,pl.sector)),0),coalesce(sum(t.quantity*m.price)FILTER(WHERE t.symbol=coalesce(tr.symbol,pl.symbol)AND t.exchange=coalesce(tr.exchange,pl.exchange)),0),coalesce(sum(t.quantity*m.price)FILTER(WHERE t.id=tid),0)
     INTO exposure,sector_exposure,symbol_exposure,old_value FROM trades t JOIN LATERAL(SELECT price FROM manual_marks WHERE owner_id=uid AND trade_id=t.id AND ledger_revision=t.ledger_revision ORDER BY created_at DESC,id DESC LIMIT 1)m ON true WHERE t.owner_id=uid AND t.portfolio_id=pid AND t.quantity>0;
   END IF;
   IF tid IS NULL THEN
    IF action<>'BUY' THEN RAISE EXCEPTION 'NOT_FOUND';END IF;
    IF pl.id IS NULL THEN
     IF NOT coalesce((body->>'historical')::boolean,false)OR NOT coalesce((body->>'manualIdentityAcknowledged')::boolean,false)OR body->>'symbol'!~'^[A-Z][A-Z0-9.-]{0,9}$'OR body->>'exchange' NOT IN('XNYS','XNAS') OR length(body->>'sector') NOT BETWEEN 1 AND 80 THEN RAISE EXCEPTION 'MANUAL_IDENTITY_REQUIRED';END IF;
     INSERT INTO trades(owner_id,portfolio_id,symbol,exchange,sector,initial_batch_id,initial_stop,current_stop)VALUES(uid,pid,body->>'symbol',body->>'exchange',body->>'sector',batch,(body->>'initialStop')::numeric,(body->>'initialStop')::numeric)RETURNING * INTO tr;tid:=tr.id;deviation:=true;
    ELSE
    IF pl.entry_state='ENTERED' THEN RAISE EXCEPTION 'PLAN_ALREADY_ENTERED';END IF;
    SELECT * INTO approved FROM plan_approvals WHERE owner_id=uid AND plan_id=pl.id ORDER BY created_at DESC,id DESC LIMIT 1;
    IF approved.id IS NOT NULL THEN SELECT * INTO ver FROM plan_versions WHERE id=approved.version_id AND owner_id=uid;END IF;
    deviation:=approved.id IS NULL OR pl.state<>'APPROVED' OR ver.expires_at<=now();
    INSERT INTO trades(owner_id,portfolio_id,plan_id,approval_id,symbol,exchange,sector,initial_batch_id,initial_stop,current_stop)
     VALUES(uid,pid,pl.id,approved.id,pl.symbol,pl.exchange,pl.sector,batch,ver.stop,ver.stop)RETURNING * INTO tr;tid:=tr.id;
    UPDATE plans SET entry_state='ENTERED',row_version=row_version+1 WHERE id=pl.id;
    END IF;
   ELSE
    IF tr.state='CLOSED' THEN RAISE EXCEPTION 'TRADE_CLOSED';END IF;
    IF action='BUY' THEN deviation:=true;END IF;
   END IF;
   FOR fill IN SELECT value FROM jsonb_array_elements(body->'fills') LOOP
    IF(fill->>'executedAt')::timestamptz<port.opening_cash_at THEN RAISE EXCEPTION 'EXECUTION_BEFORE_OPENING_BALANCE';END IF;
    INSERT INTO executions(owner_id,trade_id,batch_id,kind,quantity,price,fee,fee_source,emotion,executed_at)
     VALUES(uid,tid,batch,action,(fill->>'quantity')::bigint,(fill->>'price')::numeric,(fill->>'fee')::numeric,CASE WHEN coalesce((fill->>'feeEstimated')::boolean,false)THEN 'ESTIMATED' ELSE 'RECORDED' END,CASE WHEN action='BUY' THEN fill->>'emotion' ELSE NULL END,(fill->>'executedAt')::timestamptz);
    IF action='BUY' AND ((fill->>'price')::numeric<=tr.current_stop OR(approved.id IS NOT NULL AND(fill->>'price')::numeric>ver.entry))THEN deviation:=true;END IF;
   END LOOP;
   PERFORM replay_trade(uid,tid);SELECT * INTO tr FROM trades WHERE id=tid;
   IF action='BUY' AND(approved.id IS NOT NULL AND tr.quantity>approved.quantity)THEN deviation:=true;END IF;
   SELECT max(price) INTO fill_price FROM executions WHERE batch_id=batch;
   IF action='BUY' AND equity IS NOT NULL AND (
    tr.quantity*fill_price>equity*port.max_position_fraction OR exposure-old_value+tr.quantity*fill_price>equity*port.max_total_exposure_fraction OR sector_exposure-old_value+tr.quantity*fill_price>equity*port.max_sector_fraction
    OR tr.quantity*greatest(0,fill_price-tr.current_stop+coalesce(ver.slippage,0))+coalesce((SELECT sum(fee) FROM executions WHERE batch_id=batch),0)+coalesce(ver.sell_fee,0)>equity*port.risk_per_trade_fraction)THEN deviation:=true;END IF;
   IF action='BUY' AND(equity IS NULL OR tr.quantity*greatest(0,(SELECT max(price) FROM executions WHERE batch_id=batch)-tr.current_stop)>equity*port.risk_per_trade_fraction)THEN deviation:=true;END IF;
   IF(journal_totals(uid,pid)->>'cash')::numeric<0 OR(action='BUY' AND(journal_totals(uid,pid)->>'cash')::numeric<port.cash_buffer)THEN deviation:=true;END IF;
   IF deviation AND NOT coalesce((body->>'riskDeviationAcknowledged')::boolean,false)THEN RAISE EXCEPTION 'RISK_ACKNOWLEDGMENT_REQUIRED';END IF;
   result:=jsonb_build_object('id',tid,'deviation',deviation,'ledgerRevision',tr.ledger_revision);
  ELSIF action='CORRECT_EXECUTION' THEN
   IF tid IS NULL OR length(body->>'reason')NOT BETWEEN 1 AND 5000 THEN RAISE EXCEPTION 'CORRECTION_REASON_REQUIRED';END IF;
   SELECT * INTO ex FROM executions WHERE owner_id=uid AND trade_id=tid AND id=(body->>'executionId')::uuid AND kind<>'REVERSAL';
   IF NOT FOUND OR EXISTS(SELECT 1 FROM executions WHERE reverses_execution_id=ex.id)THEN RAISE EXCEPTION 'EXECUTION_NOT_EFFECTIVE';END IF;
   INSERT INTO executions(owner_id,trade_id,batch_id,kind,executed_at,reverses_execution_id,reason)VALUES(uid,tid,batch,'REVERSAL',ex.executed_at,ex.id,body->>'reason');
   IF NOT coalesce((body->>'cancel')::boolean,false)THEN
    fill:=body->'replacement';IF(fill->>'executedAt')::timestamptz<port.opening_cash_at THEN RAISE EXCEPTION 'EXECUTION_BEFORE_OPENING_BALANCE';END IF;INSERT INTO executions(owner_id,trade_id,batch_id,kind,quantity,price,fee,fee_source,emotion,executed_at,reason,ordering_sequence)OVERRIDING SYSTEM VALUE
     VALUES(uid,tid,ex.batch_id,ex.kind,(fill->>'quantity')::bigint,(fill->>'price')::numeric,(fill->>'fee')::numeric,CASE WHEN coalesce((fill->>'feeEstimated')::boolean,false)THEN 'ESTIMATED' ELSE 'RECORDED' END,CASE WHEN ex.kind='BUY' THEN fill->>'emotion' ELSE NULL END,(fill->>'executedAt')::timestamptz,body->>'reason',ex.ordering_sequence);
   END IF;
   PERFORM replay_trade(uid,tid);
   IF NOT coalesce((body->>'riskDeviationAcknowledged')::boolean,false)THEN RAISE EXCEPTION 'RISK_ACKNOWLEDGMENT_REQUIRED';END IF;
   result:=jsonb_build_object('id',tid);
  ELSIF action='SET_STOP' THEN
   IF tid IS NULL OR tr.state<>'ACTIVE' THEN RAISE EXCEPTION 'NOT_FOUND';END IF;
   IF(tr.current_stop IS NULL OR(body->>'stop')::numeric<tr.current_stop)AND NOT coalesce((body->>'riskDeviationAcknowledged')::boolean,false)THEN RAISE EXCEPTION 'RISK_ACKNOWLEDGMENT_REQUIRED';END IF;
   IF(body->>'effectiveAt')::timestamptz<tr.opened_at THEN RAISE EXCEPTION 'STOP_PRECEDES_POSITION';END IF;
   INSERT INTO stop_events(owner_id,trade_id,stop,reason,effective_at)VALUES(uid,tid,(body->>'stop')::numeric,body->>'reason',(body->>'effectiveAt')::timestamptz);
   PERFORM replay_trade(uid,tid);result:=jsonb_build_object('id',tid);
  ELSIF action='SET_MARK' THEN
   IF tid IS NULL OR tr.state<>'ACTIVE' THEN RAISE EXCEPTION 'NOT_FOUND';END IF;
   IF(body->>'asOf')::timestamptz<(SELECT max(e.executed_at) FROM executions e WHERE e.owner_id=uid AND e.trade_id=tid AND e.kind<>'REVERSAL' AND NOT EXISTS(SELECT 1 FROM executions r WHERE r.reverses_execution_id=e.id))THEN RAISE EXCEPTION 'MARK_PRECEDES_POSITION';END IF;
   INSERT INTO manual_marks(owner_id,trade_id,price,as_of,ledger_revision)VALUES(uid,tid,(body->>'price')::numeric,(body->>'asOf')::timestamptz,tr.ledger_revision)RETURNING id INTO newid;result:=jsonb_build_object('id',newid);
  ELSIF action='ADD_NOTE' THEN
   IF tid IS NULL THEN RAISE EXCEPTION 'NOT_FOUND';END IF;
   INSERT INTO trade_notes(owner_id,trade_id,upload_id,body)VALUES(uid,tid,(body->>'uploadId')::uuid,body->>'note')RETURNING id INTO newid;result:=jsonb_build_object('id',newid);
  ELSIF action='CASH_EVENT' THEN
   IF body?'reversesId' THEN
    SELECT * INTO ce FROM cash_events WHERE owner_id=uid AND portfolio_id=pid AND id=(body->>'reversesId')::uuid AND kind<>'REVERSAL';
    IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND';END IF;
    INSERT INTO cash_events(owner_id,portfolio_id,kind,amount,flow_class,effective_at,reason,reverses_id)VALUES(uid,pid,'REVERSAL',-ce.amount,ce.flow_class,ce.effective_at,body->>'reason',ce.id);
   END IF;
   IF NOT coalesce((body->>'cancel')::boolean,false)THEN
    IF(body->>'effectiveAt')::timestamptz<port.opening_cash_at THEN RAISE EXCEPTION 'CASH_BEFORE_OPENING_BALANCE';END IF;
    delta:=(body->>'amount')::numeric;
    INSERT INTO cash_events(owner_id,portfolio_id,kind,amount,flow_class,effective_at,reason)VALUES(uid,pid,body->>'kind',delta,CASE WHEN body->>'kind' IN('DEPOSIT','WITHDRAWAL')THEN 'EXTERNAL' ELSE 'INTERNAL' END,(body->>'effectiveAt')::timestamptz,body->>'reason')RETURNING id INTO newid;
   END IF;
   IF(journal_totals(uid,pid)->>'cash')::numeric<0 AND NOT coalesce((body->>'riskDeviationAcknowledged')::boolean,false)THEN RAISE EXCEPTION 'RISK_ACKNOWLEDGMENT_REQUIRED';END IF;
   result:=jsonb_build_object('id',newid);
  ELSIF action='READ_NOTIFICATION' THEN
   UPDATE notifications SET read_at=coalesce(read_at,now())WHERE owner_id=uid AND id=(body->>'notificationId')::uuid;
   IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND';END IF;result:=jsonb_build_object('ok',true);
  ELSE RAISE EXCEPTION 'UNKNOWN_COMMAND';END IF;
 END IF;
 INSERT INTO commands(owner_id,id,request_hash,request,response)VALUES(uid,key,fingerprint,jsonb_build_object('action',action,'body',body),result);
 INSERT INTO audit_events(owner_id,command_id,action)VALUES(uid,key,action);
 IF action<>'READ_NOTIFICATION' THEN INSERT INTO notifications(owner_id,command_id,kind)VALUES(uid,key,action);END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION swingpilot.journal_command(text,jsonb,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION swingpilot.journal_command(text,jsonb,uuid,text) TO swingpilot_app;

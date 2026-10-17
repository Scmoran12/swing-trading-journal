import test from 'node:test';import assert from 'node:assert/strict';import pg from 'pg';
import {randomBytes,randomUUID} from 'node:crypto';import {mkdtemp,copyFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {migrate,localDatabaseUrl} from '../../scripts/database/migrate.mjs';import {setOwner} from '../../scripts/local/setup.mjs';
import {ownerDatabase,closePools} from '../../src/infrastructure/database/pools.mjs';import {command,workspace} from '../../src/application/workspace.mjs';
import {reviewCommand,reviewsWorkspace} from '../../src/application/reviews.mjs';
import {monitoringCommand,monitoringWorkspace} from '../../src/application/monitoring.mjs';
import {scenarioSchedule} from '../../src/domain/monitoring/schedule.mjs';
const connection=process.env.SWINGPILOT_TEST_DATABASE_URL;
test('inactive monitoring scenarios, immutable schedule revisions and fail-closed recovery',{skip:!connection&&'requires a fresh isolated local swingpilot_test_* database'},async t=>{
 const url=new URL(localDatabaseUrl(connection));assert.match(url.pathname,/^\/swingpilot_test_/);const admin=new pg.Client({connectionString:connection});await admin.connect();
 const directory=await mkdtemp(join(tmpdir(),'swingpilot-monitor-upgrade-'));let role;
 try{
  for(const file of ['0001_foundation.sql','0002_auth_and_files.sql','0003_manual_journal.sql','0004_manual_codex_reviews.sql'])await copyFile('local/migrations/'+file,join(directory,file));
  await migrate(admin,directory);await setOwner(admin,'monitorowner','synthetic monitoring password');
  const owner=(await admin.query("SELECT id FROM swingpilot.app_users WHERE login_name='monitorowner'")).rows[0].id;
  role='monitor_'+randomBytes(8).toString('hex');const secret=randomBytes(24).toString('hex');await admin.query((await admin.query("SELECT format('CREATE ROLE %I LOGIN NOINHERIT PASSWORD %L',$1::text,$2::text)",[role,secret])).rows[0].format);await admin.query(`GRANT swingpilot_app TO ${role}`);
  const u=new URL(url);u.username=role;u.password=secret;process.env.APP_DATABASE_URL=u.toString();
  await command(owner,'CREATE_PORTFOLIO',{name:'Synthetic monitoring portfolio',openingCash:'10000',asOf:'2026-01-01T00:00:00Z',riskFraction:'0.01',positionFraction:'0.2',exposureFraction:'0.8',sectorFraction:'0.4',cashBuffer:'0'},randomUUID());
  const plan=await command(owner,'SAVE_PLAN',{symbol:'AAPL',exchange:'XNAS',sector:'Technology',entry:'100',stop:'95',target:'120',buyFee:'0',sellFee:'0',slippage:'0',thesis:'Synthetic fixture',invalidation:'Stop',expiresAt:'2030-01-01T00:00:00Z',manualIdentityAcknowledged:true},randomUUID());
  await reviewCommand(owner,'CREATE',{planId:plan.id,expectedPlanRevision:1,sharingAcknowledged:true},randomUUID());
  const finances=await workspace(owner),reviews=await reviewsWorkspace(owner);
  const send=(action,body,key=randomUUID())=>monitoringCommand(owner,action,body,key),state=()=>monitoringWorkspace(owner);
  const body=(day,close='16:00')=>({sessionDate:day,sessionStatus:'OPEN',regularClose:close,sourceNote:'Synthetic rehearsal only',expectedVersion:0,acknowledgedRehearsal:true});
  await t.test('upgrade preserves populated financial/review facts; no implicit weekday jobs',async()=>{
   assert.ok((await migrate(admin)).includes('0005_monitoring_rehearsals.sql'));assert.deepEqual(await migrate(admin),[]);
   assert.deepEqual(await workspace(owner),finances);assert.deepEqual(await reviewsWorkspace(owner),reviews);
   const empty=await state();assert.deepEqual(empty.scenarios,[]);assert.deepEqual(empty.runs,[]);assert.equal(empty.automaticMonitoring,false);assert.equal(empty.lastScheduledExecution,null);
  });
  let saved;
  await t.test('two SQL-computed instants match independent DST/early-close goldens and JS preview',async()=>{
   for(const [day,close,fixed,after] of [['2026-03-09','16:00','20:40','20:15'],['2026-03-27','16:00','19:40','20:15'],['2026-10-26','16:00','20:40','20:15'],['2026-11-27','13:00','20:40','18:15']]){
    const b=body(day,close),created=await send('SAVE_SCENARIO',b);const runs=(await state()).runs.filter(r=>r.scenario_id===created.id);assert.equal(runs.length,2);
    const expected=scenarioSchedule(b);for(const [reason,time] of [['JERUSALEM_2240',fixed],['AFTER_CLOSE',after]]){
     const run=runs.find(r=>r.reason===reason);assert.equal(run.due_at,`${day}T${time}:00.000Z`);assert.equal(run.due_at,expected.find(r=>r.reason===reason).dueAt);
    }saved=created;
   }
  });
  await t.test('fresh connections retain runs; repeated identical input and retries do not duplicate',async()=>{
   await closePools();assert.equal((await state()).runs.length,8);const b={...body('2026-11-27','13:00'),expectedVersion:1},key=randomUUID();
   assert.equal((await send('SAVE_SCENARIO',b,key)).id,saved.id);assert.equal((await send('SAVE_SCENARIO',b,key)).id,saved.id);
   await assert.rejects(send('SAVE_SCENARIO',{...b,sourceNote:'Changed'},key),/IDEMPOTENCY_CONFLICT/);assert.equal((await state()).runs.length,8);
  });
  await t.test('closed date has no probes; correction appends a version and supersedes old pending runs',async()=>{
   const closed=await send('SAVE_SCENARIO',{...body('2026-12-25'),sessionStatus:'CLOSED',regularClose:null});assert.equal((await state()).runs.filter(r=>r.scenario_id===closed.id).length,0);
   const corrected=await send('SAVE_SCENARIO',{...body('2026-11-27'),expectedVersion:1,sourceNote:'Changed hypothetical close'});assert.equal(corrected.version,2);
   const s=await state();assert.ok(s.runs.filter(r=>r.scenario_id===saved.id).every(r=>r.state==='SUPERSEDED'));assert.equal(s.runs.filter(r=>r.scenario_id===corrected.id).length,2);
   await assert.rejects(send('SAVE_SCENARIO',{...body('2026-11-27'),expectedVersion:1}),/REVISION_CONFLICT/);
  });
  let runId;
  await t.test('due rehearsal is blocked once; repeated reconciliation does not duplicate events',async()=>{
   const scenario=await send('SAVE_SCENARIO',body('2099-01-02'));runId=(await state()).runs.find(r=>r.scenario_id===scenario.id).id;
   // Synthetic fixture only: move a disposable run around the DB clock; no live schedule runs.
   await admin.query("UPDATE swingpilot.monitoring_rehearsal_runs SET due_at=now()-interval '1 minute',deadline_at=now()+interval '4 minutes' WHERE id=$1",[runId]);
   const before=await workspace(owner);await send('RECONCILE',{});let s=await state();assert.equal(s.runs.find(r=>r.id===runId).state,'BLOCKED_GATES');
   const count=s.events.length,repeated=await send('RECONCILE',{});assert.equal(repeated.blocked,0);assert.equal(repeated.expired,0);assert.equal(repeated.automaticMonitoring,false);
   s=await state();assert.equal(s.events.length,count);assert.deepEqual(await workspace(owner),before);assert.equal(s.canNotify,false);assert.equal(s.canRequestMarketData,false);
  });
  await t.test('sleep/recovery past deadline suppresses old work without replay or notification',async()=>{
   await admin.query("UPDATE swingpilot.monitoring_rehearsal_runs SET due_at=now()-interval '10 minutes',deadline_at=now()-interval '5 minutes' WHERE id=$1",[runId]);
   await send('RECONCILE',{});const s=await state();assert.equal(s.runs.find(r=>r.id===runId).state,'EXPIRED_SUPPRESSED');
   assert.equal(s.lastScheduledExecution,null);assert.equal(s.automaticMonitoring,false);assert.equal((await workspace(owner)).notifications.length,finances.notifications.length);
   await assert.rejects(send('CANCEL_RUN',{runId,expectedRevision:s.runs.find(r=>r.id===runId).row_version}),/REHEARSAL_TERMINAL/);
  });
  await t.test('concurrent cancellations commit once; owner and direct-write boundaries hold',async()=>{
   const scenario=await send('SAVE_SCENARIO',body('2099-01-03')),run=(await state()).runs.find(r=>r.scenario_id===scenario.id);
   const results=await Promise.allSettled([send('CANCEL_RUN',{runId:run.id,expectedRevision:1}),send('CANCEL_RUN',{runId:run.id,expectedRevision:1})]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
   const stranger=randomUUID();assert.equal((await monitoringWorkspace(stranger)).runs.length,0);await assert.rejects(monitoringCommand(stranger,'RECONCILE',{},randomUUID()),/AUTH_REQUIRED/);
   await assert.rejects(ownerDatabase(owner,c=>c.query("UPDATE swingpilot.monitoring_rehearsal_runs SET state='PENDING'")),e=>e.code==='42501');
   await assert.rejects(ownerDatabase(owner,c=>c.query('DELETE FROM swingpilot.monitoring_rehearsal_events')),e=>e.code==='42501');
  });
  await t.test('client attempts to activate, forge timestamps or bypass calendar acknowledgment reject',async()=>{
   for(const extra of [{automaticMonitoring:true},{calendarVerified:true},{now:'2099-01-03T00:00:00Z'},{dueAt:'2026-01-01T00:00:00Z'}])await assert.rejects(send('SAVE_SCENARIO',{...body('2099-01-04'),...extra}),/SCENARIO_INPUT_INVALID/);
   await assert.rejects(send('ACTIVATE',{}),/SCENARIO_INPUT_INVALID/);await assert.rejects(send('RECONCILE',{now:'2026-01-01T00:00:00Z'}),/SCENARIO_INPUT_INVALID/);
   assert.deepEqual(await workspace(owner),finances);assert.deepEqual(await reviewsWorkspace(owner),reviews);
  });
 }finally{await closePools();if(role)await admin.query(`DROP ROLE ${role}`);await admin.end();await rm(directory,{recursive:true,force:true});}
});

import test from 'node:test';import assert from 'node:assert/strict';import pg from 'pg';
import {randomUUID,randomBytes} from 'node:crypto';import {mkdtemp,copyFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {migrate,localDatabaseUrl} from '../../scripts/database/migrate.mjs';import {setOwner} from '../../scripts/local/setup.mjs';
import {command,workspace} from '../../src/application/workspace.mjs';import {ownerDatabase,closePools} from '../../src/infrastructure/database/pools.mjs';
import {analyticsWorkspace,weeklyCommand,weeklyForOwner} from '../../src/application/analytics.mjs';
const connection=process.env.SWINGPILOT_TEST_DATABASE_URL;
test('analytics reconciles effective SQL ledger and immutable manual review snapshots',{skip:!connection&&'requires a fresh isolated swingpilot_test_* database'},async t=>{
 const url=new URL(localDatabaseUrl(connection)),admin=new pg.Client({connectionString:connection}),roles=[];
 assert.match(url.pathname,/^\/swingpilot_test_/);await admin.connect();const dir=await mkdtemp(join(tmpdir(),'swingpilot-analytics-upgrade-'));
 try{
  for(const name of ['0001_foundation.sql','0002_auth_and_files.sql','0003_manual_journal.sql','0004_manual_codex_reviews.sql','0005_monitoring_rehearsals.sql','0006_desktop_delivery_tests.sql'])await copyFile('local/migrations/'+name,join(dir,name));
  await migrate(admin,dir);await setOwner(admin,'analyticowner','synthetic analytics password');const owner=(await admin.query("SELECT id FROM swingpilot.app_users WHERE login_name='analyticowner'")).rows[0].id;
  const role='ana_'+randomBytes(8).toString('hex'),password=randomBytes(24).toString('hex');await admin.query((await admin.query("SELECT format('CREATE ROLE %I LOGIN NOINHERIT PASSWORD %L',$1::text,$2::text)",[role,password])).rows[0].format);roles.push(role);await admin.query(`GRANT swingpilot_app TO ${role}`);const u=new URL(url);u.username=role;u.password=password;process.env.APP_DATABASE_URL=u.toString();
  const send=(action,body)=>command(owner,action,body,randomUUID());
  await send('CREATE_PORTFOLIO',{name:'Synthetic analytics',openingCash:'10000',asOf:'2026-01-01T00:00:00Z',riskFraction:'0.01',positionFraction:'0.2',exposureFraction:'0.8',sectorFraction:'0.4',cashBuffer:'0'});
  const p=await send('SAVE_PLAN',{symbol:'AAPL',exchange:'XNAS',sector:'Technology',entry:'100',stop:'95',target:'120',buyFee:'1',sellFee:'1',slippage:'0',thesis:'Synthetic only',invalidation:'Stop',expiresAt:'2030-01-01T00:00:00Z',manualIdentityAcknowledged:true});
  await send('APPROVE_PLAN',{planId:p.id,expectedRevision:1,manualValuationAcknowledged:true});
  const trade=await send('BUY',{planId:p.id,expectedRevision:2,actualExecution:true,fills:[{quantity:10,price:'100',fee:'1',executedAt:'2026-01-01T12:00:00Z',emotion:'CALM'}]});
  await send('BUY',{tradeId:trade.id,expectedRevision:1,actualExecution:true,riskDeviationAcknowledged:true,fills:[{quantity:5,price:'110',fee:'1',executedAt:'2026-01-02T12:00:00Z',emotion:'FOMO'}]});
  await send('SELL',{tradeId:trade.id,expectedRevision:2,actualExecution:true,fills:[{quantity:12,price:'120',fee:'1.2',executedAt:'2026-01-03T12:00:00Z'}]});
  await send('SELL',{tradeId:trade.id,expectedRevision:3,actualExecution:true,fills:[{quantity:3,price:'90',fee:'0.3',executedAt:'2026-01-04T22:00:00Z'}]});
  const before=await workspace(owner);
  const data=(from='2026-01-01',to='2026-01-07')=>analyticsWorkspace(owner,from,to);
  const weekly=(action,body,key=randomUUID())=>weeklyCommand(owner,action,body,key);
  await t.test('forward0007 preserves populated ledger and is replay-safe',async()=>{assert.deepEqual(await migrate(admin),['0007_journal_analytics.sql']);assert.deepEqual(await migrate(admin),[]);assert.deepEqual(await workspace(owner),before);});
  await t.test('fee-inclusive FIFO ADD result reconciles frozen R and source detail',async()=>{
   const r=(await data()).report;assert.equal(r.metrics.count,1);assert.equal(r.metrics.netPnl,'156.5');assert.equal(r.metrics.expectancyR,'3.13');assert.equal(r.trades[0].initialRisk,'50.00000000');assert.equal(r.trades[0].entryEmotion,'CALM');assert.equal(r.segments.withAdd.count,1);assert.equal(r.adherence.eligible,1);assert.equal(r.adherence.entryPriceDeviations,0);assert.equal(r.adherence.entryQuantityDeviations,0);
  });
  await t.test('Jerusalem closure date boundary excludes January4 UTC22:00 and includes January5',async()=>{assert.equal((await data('2026-01-04','2026-01-04')).report.metrics.count,0);assert.equal((await data('2026-01-05','2026-01-05')).report.metrics.count,1);});
  let job,body;
  const responseFor=async id=>{const d=await weeklyForOwner(owner,id,true);return {schemaVersion:1,jobId:id,inputSha256:d.inputSha256,scope:'JOURNAL_ONLY_WEEKLY_REVIEW',modelLabel:'UNKNOWN',findings:[{category:'MISSING_CONTEXT',factIds:['F_METRICS'],observation:'Small manual cohort',question:'What context is missing?'}],limitations:['No market evidence or causal conclusions.']};};
  await t.test('durable deduplicated request pins complete cohort without sharing identifiers/emotions',async()=>{
   body={from:'2026-01-01',to:'2026-01-07',expectedJournalRevision:(await data()).report.journalRevision,sharingAcknowledged:true,includeEmotions:false};
   const key=randomUUID();job=await weekly('CREATE',body,key);assert.deepEqual(await weekly('CREATE',body,key),job);assert.equal((await weekly('CREATE',body)).id,job.id);await closePools();
   const packet=await weeklyForOwner(owner,job.id);assert.ok(!packet.packet.includes('"symbol"'));assert.ok(!packet.packet.includes('"F_EMOTIONS"'));assert.equal(packet.report.metrics.netPnl,'156.5');
   await assert.rejects(weekly('CREATE',{...body,includeEmotions:true},key),/IDEMPOTENCY_CONFLICT/);await assert.rejects(weekly('CREATE',{...body,sharingAcknowledged:false}),/ACKNOWLEDGMENT/);await assert.rejects(weekly('CREATE',{...body,expectedJournalRevision:'0'}),/REVISION_CONFLICT/);
  });
  await t.test('usage/auth/bridge pause stops transfer and import; explicit resume persists',async()=>{
   for(const action of ['PAUSE_USAGE','PAUSE_AUTH','PAUSE_BRIDGE']){job=await weekly(action,{jobId:job.id,expectedRevision:job.rowVersion});await assert.rejects(weeklyForOwner(owner,job.id),/PACKET_UNAVAILABLE/);await assert.rejects(weekly('SUBMIT',{jobId:job.id,expectedRevision:job.rowVersion,reviewAcknowledged:true,response:await responseFor(job.id)}),/REVIEW_PAUSED/);job=await weekly('RESUME',{jobId:job.id,expectedRevision:job.rowVersion});}
  });
  await t.test('strict bound response stored as commentary only; fake references rejected',async()=>{
   const response=await responseFor(job.id),base={jobId:job.id,expectedRevision:job.rowVersion,reviewAcknowledged:true};
   await assert.rejects(weekly('SUBMIT',{...base,response:{...response,inputSha256:'b'.repeat(64)}}),/BINDING/);
   const fake=structuredClone(response);fake.findings[0].factIds=['F_EMOTIONS'];await assert.rejects(weekly('SUBMIT',{...base,response:fake}),/REFERENCE/);
   job=await weekly('SUBMIT',{...base,response});assert.equal(job.state,'REVIEW_READY');assert.deepEqual(await workspace(owner),before);
  });
  await t.test('reading an inbox item does not invalidate a weekly input revision',async()=>{
   const j=await weekly('CREATE',body),revision=(await data()).report.journalRevision;
   await send('READ_NOTIFICATION',{notificationId:before.notifications[0].id});
   assert.equal((await data()).report.journalRevision,revision);assert.equal((await weeklyForOwner(owner,j.id)).stale,false);
   await weekly('CANCEL',{jobId:j.id,expectedRevision:1});
  });
  let pending;
  await t.test('correction recomputes cohort, quarantines late imports and leaves old snapshot intact',async()=>{
   pending=await weekly('CREATE',body);const response=await responseFor(pending.id);
   const execution=before.executions.find(e=>e.trade_id===trade.id&&e.kind==='SELL'&&e.quantity==='3');
   await send('CORRECT_EXECUTION',{tradeId:trade.id,expectedRevision:4,executionId:execution.id,reason:'Synthetic corrected closure',riskDeviationAcknowledged:true,replacement:{quantity:3,price:'100',fee:'0.3',executedAt:'2026-01-06T12:00:00Z'}});
   assert.equal((await data()).report.metrics.netPnl,'186.5');assert.equal((await data('2026-01-05','2026-01-05')).report.metrics.count,0);
   const old=await weeklyForOwner(owner,job.id,true);assert.equal(old.stale,true);assert.equal(old.report.metrics.netPnl,'156.5');assert.equal(old.response.modelLabel,'UNKNOWN');await assert.rejects(weeklyForOwner(owner,pending.id),/PACKET_UNAVAILABLE/);
   assert.equal((await weekly('SUBMIT',{jobId:pending.id,expectedRevision:1,response,reviewAcknowledged:true})).state,'STALE_RESULT');
  });
  await t.test('missing R, estimated fees, mixed first-batch emotions and open trades disclose coverage',async()=>{
   const h=await send('BUY',{historical:true,symbol:'IBM',exchange:'XNYS',sector:'Technology',manualIdentityAcknowledged:true,actualExecution:true,riskDeviationAcknowledged:true,fills:[{quantity:1,price:'100',fee:'1',feeEstimated:true,executedAt:'2026-01-02T12:00:00Z',emotion:'UNKNOWN'},{quantity:1,price:'100',fee:'1',executedAt:'2026-01-02T12:01:00Z',emotion:'DECLINED'}]});
   await send('SELL',{tradeId:h.id,expectedRevision:1,actualExecution:true,fills:[{quantity:2,price:'110',fee:'1',executedAt:'2026-01-07T12:00:00Z'}]});
   await send('BUY',{historical:true,symbol:'MSFT',exchange:'XNAS',sector:'Technology',manualIdentityAcknowledged:true,actualExecution:true,riskDeviationAcknowledged:true,fills:[{quantity:1,price:'1',fee:'0',executedAt:'2026-01-07T12:00:00Z',emotion:'UNKNOWN'}]});
   const r=(await data()).report;assert.equal(r.metrics.count,2);assert.equal(r.metrics.netPnl,'203.5');assert.equal(r.metrics.missingR,1);assert.equal(r.metrics.estimatedFeeTrades,1);assert.equal(r.excluded.openTrades,1);assert.equal(r.emotions.find(e=>e.emotion==='MULTIPLE').count,1);assert.equal(r.adherence.excluded,1);
  });
  await t.test('new plan drafts do not replace pinned approval in historical entry comparisons',async()=>{
   const plan=(await workspace(owner)).plans.find(x=>x.id===p.id);
   await send('SAVE_PLAN',{planId:p.id,expectedRevision:Number(plan.row_version),entry:'200',stop:'195',target:'220',buyFee:'1',sellFee:'1',slippage:'0',thesis:'Synthetic changed draft',invalidation:'Stop',expiresAt:'2030-01-01T00:00:00Z',manualIdentityAcknowledged:true});
   const row=(await data()).report.trades.find(x=>x.id===trade.id);assert.equal(row.approvedEntry,'100.00000000');assert.equal(row.approvedQuantity,'19');assert.equal(row.entryPriceDeviation,false);
  });
  await t.test('wrong owners, disabled principals and direct mutations cannot access or alter stored facts',async()=>{
   const other=randomUUID();assert.equal((await analyticsWorkspace(other,'2026-01-01','2026-01-07')).report.metrics.count,0);await assert.rejects(weeklyForOwner(other,job.id,true),/NOT_FOUND/);await assert.rejects(weeklyCommand(other,'CREATE',body,randomUUID()),/AUTH_REQUIRED/);
   await assert.rejects(ownerDatabase(owner,c=>c.query('DELETE FROM swingpilot.weekly_review_jobs')),e=>e.code==='42501');
   await admin.query("UPDATE swingpilot.app_users SET state='DISABLED' WHERE id=$1",[owner]);await assert.rejects(weekly('CREATE',body),/AUTH_REQUIRED/);await admin.query("UPDATE swingpilot.app_users SET state='ACTIVE' WHERE id=$1",[owner]);
  });
  await t.test('concurrent state changes fence revisions and explicit emotion consent permits that reference',async()=>{
   const current={...body,expectedJournalRevision:(await data()).report.journalRevision,includeEmotions:true};const j=await weekly('CREATE',current);assert.match((await weeklyForOwner(owner,j.id)).packet,/"F_EMOTIONS"/);
   const outcomes=await Promise.allSettled(['PAUSE_USAGE','CANCEL'].map(action=>weekly(action,{jobId:j.id,expectedRevision:1})));assert.equal(outcomes.filter(o=>o.status==='fulfilled').length,1);
  });
  await t.test('eight pending requests cap the queue without losing old snapshots',async()=>{
   for(const j of (await data()).jobs.filter(j=>['AWAITING_CODEX','PAUSED_USAGE','PAUSED_AUTH','PAUSED_BRIDGE'].includes(j.state)))await weekly('CANCEL',{jobId:j.id,expectedRevision:j.row_version});
   const current={...body,expectedJournalRevision:(await data()).report.journalRevision};
   for(let n=1;n<=8;n++)await weekly('CREATE',{...current,from:'2026-01-0'+n,to:'2026-01-0'+n});
   await assert.rejects(weekly('CREATE',{...current,from:'2026-01-09',to:'2026-01-09'}),/REVIEW_LIMIT_REACHED/);
   assert.equal((await weeklyForOwner(owner,job.id,true)).report.metrics.netPnl,'156.5');
  });
  await t.test('cohorts above legacy500-row UI limit are complete; over10000 rejects without truncation',async()=>{
   const portfolio=before.portfolio.id;
   await admin.query(`INSERT INTO swingpilot.trades(owner_id,portfolio_id,symbol,exchange,sector,initial_batch_id,state,realized_pnl,opened_at,closed_at)
    SELECT $1,$2,'BULK'||g,'XNAS','Test',gen_random_uuid(),'CLOSED',1,'2025-01-01T12:00:00Z','2025-01-02T12:00:00Z' FROM generate_series(1,501) g`,[owner,portfolio]);
   assert.equal((await data('2025-01-01','2025-01-03')).report.metrics.netPnl,'501');assert.equal((await data('2025-01-01','2025-01-03')).report.metrics.count,501);
   await admin.query(`INSERT INTO swingpilot.trades(owner_id,portfolio_id,symbol,exchange,sector,initial_batch_id,state,realized_pnl,opened_at,closed_at)
    SELECT $1,$2,'LIMIT'||g,'XNAS','Test',gen_random_uuid(),'CLOSED',1,'2025-01-01T12:00:00Z','2025-01-02T12:00:00Z' FROM generate_series(1,9500) g`,[owner,portfolio]);
   await assert.rejects(data('2025-01-01','2025-01-03'),/ANALYTICS_COHORT_TOO_LARGE/);
  });
 }finally{await closePools();for(const role of roles)await admin.query(`DROP ROLE ${role}`);await admin.end();await rm(dir,{recursive:true,force:true});}
});

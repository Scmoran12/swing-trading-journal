import test from 'node:test';import assert from 'node:assert/strict';import pg from 'pg';
import {randomUUID,randomBytes} from 'node:crypto';import {mkdtemp,copyFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {migrate,localDatabaseUrl} from '../../scripts/database/migrate.mjs';
import {setOwner} from '../../scripts/local/setup.mjs';
import {command,workspace} from '../../src/application/workspace.mjs';
import {ownerDatabase,closePools} from '../../src/infrastructure/database/pools.mjs';
import {reviewCommand,reviewsWorkspace,packetForOwner} from '../../src/application/reviews.mjs';
const connection=process.env.SWINGPILOT_TEST_DATABASE_URL;
test('durable manual Codex reviews isolate owners, pin versions and never mutate financial facts',{skip:!connection&&'requires a fresh isolated local swingpilot_test_* database'},async t=>{
 const url=new URL(localDatabaseUrl(connection));assert.match(url.pathname,/^\/swingpilot_test_/);
 const admin=new pg.Client({connectionString:connection});await admin.connect();const roles=[];const directory=await mkdtemp(join(tmpdir(),'swingpilot-review-upgrade-'));
 try{
  for(const file of ['0001_foundation.sql','0002_auth_and_files.sql','0003_manual_journal.sql'])await copyFile('local/migrations/'+file,join(directory,file));
  await migrate(admin,directory);await setOwner(admin,'reviewowner','synthetic review password only');
  const owner=(await admin.query("SELECT id FROM swingpilot.app_users WHERE login_name='reviewowner'")).rows[0].id;
  const role='review_'+randomBytes(8).toString('hex'),secret=randomBytes(24).toString('hex');
  await admin.query((await admin.query("SELECT format('CREATE ROLE %I LOGIN NOINHERIT PASSWORD %L',$1::text,$2::text)",[role,secret])).rows[0].format);roles.push(role);await admin.query(`GRANT swingpilot_app TO ${role}`);
  const u=new URL(url);u.username=role;u.password=secret;process.env.APP_DATABASE_URL=u.toString();
  await command(owner,'CREATE_PORTFOLIO',{name:'Synthetic review portfolio',openingCash:'10000',asOf:'2026-01-01T00:00:00Z',riskFraction:'0.01',positionFraction:'0.2',exposureFraction:'0.8',sectorFraction:'0.4',cashBuffer:'0'},randomUUID());
  const planBody={symbol:'AAPL',exchange:'XNAS',sector:'Technology',entry:'100',stop:'95',target:'120',buyFee:'1',sellFee:'1',slippage:'0',thesis:'Synthetic thesis without timeframe',invalidation:'Stop breached',expiresAt:'2030-01-01T00:00:00Z',manualIdentityAcknowledged:true};
  const plan=await command(owner,'SAVE_PLAN',planBody,randomUUID());
  const before=await workspace(owner);
  await t.test('forward migration preserves v0.2/v0.3 journal facts and supports replay',async()=>{
   assert.ok((await migrate(admin)).includes('0004_manual_codex_reviews.sql'));assert.deepEqual(await migrate(admin),[]);assert.deepEqual(await workspace(owner),before);
  });
  const send=(action,body,key=randomUUID())=>reviewCommand(owner,action,body,key);
  const create=()=>send('CREATE',{planId:plan.id,expectedPlanRevision:1,sharingAcknowledged:true});
  let job;
  await t.test('explicit request creates a durable manual packet with minimal plan facts',async()=>{
   job=await create();assert.equal(job.state,'AWAITING_CODEX');await closePools();const state=await reviewsWorkspace(owner);assert.equal(state.jobs.length,1);assert.equal(state.events.length,1);
   const packet=await packetForOwner(owner,job.id);assert.equal(packet.transport,'MANUAL_COPY');
   assert.match(packet.packet,/JOURNAL_ONLY_PLAN_REVIEW/);for(const secretName of ['opening_cash','password_hash','executions','emotion','uploads'])assert.ok(!packet.packet.includes(secretName));
   assert.equal((await create()).id,job.id,'same snapshot deduplicates');assert.equal((await reviewsWorkspace(owner)).events.length,1);
  });
  await t.test('request retries are idempotent while changed bodies and missing consent reject',async()=>{
   const key=randomUUID(),body={planId:plan.id,expectedPlanRevision:1,sharingAcknowledged:true};const a=await send('CREATE',body,key);assert.deepEqual(await send('CREATE',body,key),a);
   await assert.rejects(send('CREATE',{...body,expectedPlanRevision:2},key),/IDEMPOTENCY_CONFLICT/);
   await assert.rejects(send('CREATE',{...body,sharingAcknowledged:false}),/SHARING_ACKNOWLEDGMENT_REQUIRED/);
   await assert.rejects(send('CREATE',{...body,ownerId:owner}),/REVIEW_SCHEMA_INVALID/);
  });
  await t.test('usage/auth/bridge pauses persist and block packet export and result submission',async()=>{
   for(const action of ['PAUSE_USAGE','PAUSE_AUTH','PAUSE_BRIDGE']){
    job=await send(action,{jobId:job.id,expectedRevision:job.rowVersion});assert.ok(job.state.startsWith('PAUSED_'));
    await assert.rejects(packetForOwner(owner,job.id),/REVIEW_PACKET_UNAVAILABLE/);
    const saved=(await reviewsWorkspace(owner)).jobs.find(j=>j.id===job.id);
    await assert.rejects(send('SUBMIT',{jobId:job.id,expectedRevision:job.rowVersion,reviewAcknowledged:true,response:{schemaVersion:1,jobId:job.id,inputSha256:saved.input_sha256,scope:'JOURNAL_ONLY_PLAN_REVIEW',modelLabel:'UNKNOWN',findings:[],limitations:['Manual only']}}),/REVIEW_PAUSED/);
    job=await send('RESUME',{jobId:job.id,expectedRevision:job.rowVersion});assert.equal(job.state,'AWAITING_CODEX');
   }
  });
  const responseFor=async id=>{const j=(await reviewsWorkspace(owner)).jobs.find(x=>x.id===id);return{schemaVersion:1,jobId:id,inputSha256:j.input_sha256,scope:'JOURNAL_ONLY_PLAN_REVIEW',modelLabel:'UNKNOWN',findings:[{category:'MISSING_CONTEXT',factIds:['F_THESIS'],observation:'The intended timeframe is not stated.',question:'What timeframe applies?'}],limitations:['Manual input only; no verified market data.']};};
  await t.test('strict imported results preserve financial state and never approve the plan',async()=>{
   const response=await responseFor(job.id),key=randomUUID();const body={jobId:job.id,expectedRevision:job.rowVersion,response,reviewAcknowledged:true};
   const result=await send('SUBMIT',body,key);assert.equal(result.state,'REVIEW_READY');assert.deepEqual(await send('SUBMIT',body,key),result);
   const data=await reviewsWorkspace(owner);assert.equal(data.jobs[0].response.modelLabel,'UNKNOWN');assert.deepEqual(await workspace(owner),before);
   await assert.rejects(send('CANCEL',{jobId:job.id,expectedRevision:result.rowVersion}),/REVIEW_TERMINAL/);
  });
  await t.test('wrong job/hash, invented references and live/approval fields cannot be imported',async()=>{
   job=await create();const response=await responseFor(job.id),base={jobId:job.id,expectedRevision:job.rowVersion,reviewAcknowledged:true};
   await assert.rejects(send('SUBMIT',{...base,response:{...response,inputSha256:'b'.repeat(64)}}),/REVIEW_BINDING_MISMATCH/);
   await assert.rejects(send('SUBMIT',{...base,response:{...response,approved:true}}),/REVIEW_SCHEMA_INVALID/);
   const wrong=structuredClone(response);wrong.findings[0].factIds=['F_LIVE_QUOTE'];await assert.rejects(send('SUBMIT',{...base,response:wrong}),/REVIEW_REFERENCE_INVALID/);
   await assert.rejects(send('SUBMIT',{...base,response,reviewAcknowledged:false}),/REVIEW_ACKNOWLEDGMENT_REQUIRED/);
  });
  await t.test('plan edits quarantine late responses and current-state reads remain stale-aware',async()=>{
   const response=await responseFor(job.id);await command(owner,'SAVE_PLAN',{...planBody,planId:plan.id,expectedRevision:1,thesis:'New manually edited thesis'},randomUUID());
   await assert.rejects(packetForOwner(owner,job.id),/REVIEW_PACKET_UNAVAILABLE/);
   const result=await send('SUBMIT',{jobId:job.id,expectedRevision:job.rowVersion,response,reviewAcknowledged:true});assert.equal(result.state,'STALE_RESULT');
   assert.equal((await reviewsWorkspace(owner)).jobs.find(j=>j.id===job.id).stale,true);
   assert.equal((await reviewsWorkspace(owner)).jobs.find(j=>j.state==='REVIEW_READY').stale,true,'previous completed review also becomes visibly stale');
  });
  await t.test('owner boundaries, disabled principals and direct table mutation are denied',async()=>{
   const other=randomUUID();assert.equal((await reviewsWorkspace(other)).jobs.length,0);
   await assert.rejects(packetForOwner(other,job.id),/REVIEW_PACKET_UNAVAILABLE/);
   await assert.rejects(reviewCommand(other,'CANCEL',{jobId:job.id,expectedRevision:1},randomUUID()),/AUTH_REQUIRED/);
   await assert.rejects(ownerDatabase(owner,c=>c.query('DELETE FROM swingpilot.codex_review_jobs')),e=>e.code==='42501');
   await assert.rejects(ownerDatabase(owner,c=>c.query("UPDATE swingpilot.codex_review_jobs SET state='REVIEW_READY'")),e=>e.code==='42501');
   await admin.query("UPDATE swingpilot.app_users SET state='DISABLED' WHERE id=$1",[owner]);await assert.rejects(create(),/AUTH_REQUIRED/);await admin.query("UPDATE swingpilot.app_users SET state='ACTIVE' WHERE id=$1",[owner]);
  });
  await t.test('concurrent terminal actions cannot both commit at one revision',async()=>{
   const newer=await send('CREATE',{planId:plan.id,expectedPlanRevision:2,sharingAcknowledged:true});
   const outcomes=await Promise.allSettled(['CANCEL','PAUSE_USAGE'].map(action=>send(action,{jobId:newer.id,expectedRevision:1})));
   assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,1);assert.equal(outcomes.filter(r=>r.status==='rejected').length,1);
   assert.deepEqual((await workspace(owner)).plan_approvals,[]);
  });
  await t.test('account revisions invalidate a packet even when the plan itself is unchanged',async()=>{
   await command(owner,'SAVE_PLAN',{...planBody,planId:plan.id,expectedRevision:2,thesis:'Another manual version'},randomUUID());
   const latest=await send('CREATE',{planId:plan.id,expectedPlanRevision:3,sharingAcknowledged:true}),response=await responseFor(latest.id);
   await command(owner,'CASH_EVENT',{kind:'DEPOSIT',amount:'100',effectiveAt:'2026-01-02T00:00:00Z',reason:'Synthetic revision test'},randomUUID());
   await assert.rejects(packetForOwner(owner,latest.id),/REVIEW_PACKET_UNAVAILABLE/);
   assert.equal((await send('SUBMIT',{jobId:latest.id,expectedRevision:1,response,reviewAcknowledged:true})).state,'STALE_RESULT');
  });
  await t.test('bounded pending queue rejects new work until requests are cancelled',async()=>{
   for(const j of (await reviewsWorkspace(owner)).jobs.filter(j=>['AWAITING_CODEX','PAUSED_USAGE','PAUSED_AUTH','PAUSED_BRIDGE'].includes(j.state)))await send('CANCEL',{jobId:j.id,expectedRevision:j.row_version});
   for(let n=0;n<8;n++){
    const p=await command(owner,'SAVE_PLAN',{...planBody,symbol:'TEST'+n},randomUUID());await send('CREATE',{planId:p.id,expectedPlanRevision:1,sharingAcknowledged:true});
   }
   const p=await command(owner,'SAVE_PLAN',{...planBody,symbol:'TEST9'},randomUUID());await assert.rejects(send('CREATE',{planId:p.id,expectedPlanRevision:1,sharingAcknowledged:true}),/REVIEW_LIMIT_REACHED/);
  });
 }finally{await closePools();for(const role of roles)await admin.query(`DROP ROLE ${role}`);await admin.end();await rm(directory,{recursive:true,force:true});}
});

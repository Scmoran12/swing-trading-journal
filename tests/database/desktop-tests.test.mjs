import test from 'node:test';import assert from 'node:assert/strict';import pg from 'pg';import {randomBytes,randomUUID} from 'node:crypto';
import {mkdtemp,copyFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {migrate,localDatabaseUrl} from '../../scripts/database/migrate.mjs';import {setOwner} from '../../scripts/local/setup.mjs';
import {ownerDatabase,closePools} from '../../src/infrastructure/database/pools.mjs';import {command,workspace} from '../../src/application/workspace.mjs';
import {desktopTestCommand,desktopTestsWorkspace,pendingDesktopTest,claimDesktopTest,finishDesktopTest,desktopLeaseValid} from '../../src/application/desktop-tests.mjs';
const connection=process.env.SWINGPILOT_TEST_DATABASE_URL;
test('opt-in desktop test outbox, fenced attempts and separate human receipt',{skip:!connection&&'requires a fresh isolated local swingpilot_test_* database'},async t=>{
 const url=new URL(localDatabaseUrl(connection));assert.match(url.pathname,/^\/swingpilot_test_/);const admin=new pg.Client({connectionString:connection});await admin.connect();
 const directory=await mkdtemp(join(tmpdir(),'swingpilot-desktop-upgrade-'));let role;
 try{
  for(const file of ['0001_foundation.sql','0002_auth_and_files.sql','0003_manual_journal.sql','0004_manual_codex_reviews.sql','0005_monitoring_rehearsals.sql'])await copyFile('local/migrations/'+file,join(directory,file));
  await migrate(admin,directory);await setOwner(admin,'desktopowner','synthetic desktop password');const owner=(await admin.query("SELECT id FROM swingpilot.app_users WHERE login_name='desktopowner'")).rows[0].id;
  role='desktop_'+randomBytes(8).toString('hex');const secret=randomBytes(24).toString('hex');await admin.query((await admin.query("SELECT format('CREATE ROLE %I LOGIN NOINHERIT PASSWORD %L',$1::text,$2::text)",[role,secret])).rows[0].format);await admin.query(`GRANT swingpilot_app TO ${role}`);
  const u=new URL(url);u.username=role;u.password=secret;process.env.APP_DATABASE_URL=u.toString();
  await command(owner,'CREATE_PORTFOLIO',{name:'Synthetic desktop test portfolio',openingCash:'10000',asOf:'2026-01-01T00:00:00Z',riskFraction:'0.01',positionFraction:'0.2',exposureFraction:'0.8',sectorFraction:'0.4',cashBuffer:'0'},randomUUID());const before=await workspace(owner);
  const send=(action,body,key=randomUUID())=>desktopTestCommand(owner,action,body,key),state=()=>desktopTestsWorkspace(owner);
  const job=async id=>(await state()).tests.find(x=>x.id===id);
  const ack=async(id,code,key=randomUUID())=>send('ACK',{testId:id,expectedRevision:(await job(id)).row_version,code,seen:true,context:'WEBSITE_CLOSED'},key);
  const claim=async id=>{const token=randomUUID();await claimDesktopTest(owner,await job(id),'482619',token);return token;};
  let id,token;
  await t.test('upgrade preserves finances and defaults off; queue requires explicit preference',async()=>{
   assert.ok((await migrate(admin)).includes('0006_desktop_delivery_tests.sql'));assert.deepEqual(await migrate(admin),[]);assert.deepEqual(await workspace(owner),before);
   assert.equal((await state()).preference.enabled,false);await assert.rejects(send('QUEUE',{}),/DESKTOP_TESTS_DISABLED/);
   await send('PREFERENCE',{enabled:true,expectedRevision:0});
  });
  await t.test('durable queue/dedup and lease fencing allow one sender without leaking private challenge',async()=>{
   const key=randomUUID(),q=await send('QUEUE',{},key);id=q.id;assert.deepEqual(await send('QUEUE',{},key),q);assert.equal((await send('QUEUE',{})).id,id);await closePools();
   assert.equal((await pendingDesktopTest(owner)).id,id);const tokens=[randomUUID(),randomUUID()];
   const results=await Promise.allSettled(tokens.map(value=>claimDesktopTest(owner,{id,row_version:1},'482619',value)));assert.equal(results.filter(x=>x.status==='fulfilled').length,1);token=tokens[results.findIndex(x=>x.status==='fulfilled')];
   assert.equal(await desktopLeaseValid(owner,id,token),true);assert.equal(await desktopLeaseValid(owner,id,randomUUID()),false);
   const dto=JSON.stringify(await state());for(const field of ['lease_token','receipt_hash','"token"'])assert.ok(!dto.includes(field));
  });
  await t.test('sender accepted is not received; code failures persist and correct human report is separate',async()=>{
   await finishDesktopTest(owner,id,token,'ACCEPTED');assert.equal((await job(id)).state,'ACCEPTED');assert.equal((await job(id)).confirmed_at,null);
   const first=await ack(id,'000000');assert.equal(first.verified,false);assert.equal((await job(id)).receipt_attempts,1);
   const result=await ack(id,'482619');assert.equal(result.verified,true);assert.equal((await job(id)).state,'RECEIPT_CONFIRMED');assert.equal((await job(id)).receipt_context,'WEBSITE_CLOSED');
   assert.deepEqual(await workspace(owner),before);
  });
  await t.test('lost/expired lease becomes unknown and cannot be automatically retried or completed stale',async()=>{
   id=(await send('QUEUE',{})).id;token=await claim(id);await admin.query("UPDATE swingpilot.desktop_delivery_tests SET lease_until=now()-interval '1 second' WHERE id=$1",[id]);
   await send('RECONCILE',{});assert.equal((await job(id)).state,'UNKNOWN');assert.equal(await pendingDesktopTest(owner),null);
   await assert.rejects(finishDesktopTest(owner,id,token,'ACCEPTED'),/STALE_DELIVERY_LEASE/);await assert.rejects(send('RETRY',{testId:id,expectedRevision:(await job(id)).row_version}),/DELIVERY_RETRY_UNAVAILABLE/);
   assert.equal((await ack(id,'482619')).verified,true,'actual code report can resolve an ambiguous attempt');
  });
  await t.test('known no-send failures require explicit retry and stop after three attempts',async()=>{
   id=(await send('QUEUE',{})).id;
   for(let n=1;n<=3;n++){token=await claim(id);await finishDesktopTest(owner,id,token,'FAILED','APP_ID_NOT_REGISTERED');assert.equal((await job(id)).attempt_count,n);if(n<3)await send('RETRY',{testId:id,expectedRevision:(await job(id)).row_version});}
   await assert.rejects(send('RETRY',{testId:id,expectedRevision:(await job(id)).row_version}),/DELIVERY_RETRY_UNAVAILABLE/);
  });
  await t.test('preference revoke cancels pending work and fences a previously claimed completion',async()=>{
   id=(await send('QUEUE',{})).id;token=await claim(id);await send('PREFERENCE',{enabled:false,expectedRevision:1});assert.equal((await job(id)).state,'CANCELLED');
   assert.equal(await desktopLeaseValid(owner,id,token),false);await assert.rejects(finishDesktopTest(owner,id,token,'ACCEPTED'),/STALE_DELIVERY_LEASE/);
   await send('PREFERENCE',{enabled:true,expectedRevision:2});
  });
  await t.test('receipt challenge locks after five wrong attempts without rolling the counter back',async()=>{
   id=(await send('QUEUE',{})).id;token=await claim(id);await finishDesktopTest(owner,id,token,'ACCEPTED');
   for(let n=0;n<5;n++)assert.equal((await ack(id,'000000')).verified,false);
   const locked=await ack(id,'482619');assert.equal(locked.locked,true);assert.equal(locked.verified,false);assert.equal((await job(id)).receipt_attempts,5);
   await send('CANCEL',{testId:id,expectedRevision:(await job(id)).row_version});
  });
  await t.test('expired test never becomes a new send; owner/private-write boundaries hold',async()=>{
   id=(await send('QUEUE',{})).id;await admin.query("UPDATE swingpilot.desktop_delivery_tests SET expires_at=now()-interval '1 second' WHERE id=$1",[id]);await send('RECONCILE',{});assert.equal((await job(id)).state,'EXPIRED');assert.equal(await pendingDesktopTest(owner),null);
   const other=randomUUID();assert.equal((await desktopTestsWorkspace(other)).tests.length,0);await assert.rejects(desktopTestCommand(other,'QUEUE',{},randomUUID()),/AUTH_REQUIRED/);
   await assert.rejects(ownerDatabase(owner,c=>c.query('DELETE FROM swingpilot.desktop_delivery_tests')),e=>e.code==='42501');
   await assert.rejects(send('CLAIM',{testId:id}),/DELIVERY_INPUT_INVALID/);await assert.rejects(send('QUEUE',{title:'BUY NOW'}),/DELIVERY_INPUT_INVALID/);
   assert.deepEqual(await workspace(owner),before);assert.equal((await state()).automaticAlerts,false);assert.equal((await state()).iphonePush,false);
  });
 }finally{await closePools();if(role)await admin.query(`DROP ROLE ${role}`);await admin.end();await rm(directory,{recursive:true,force:true});}
});

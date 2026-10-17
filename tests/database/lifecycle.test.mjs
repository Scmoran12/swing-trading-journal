import test from'node:test';import assert from'node:assert/strict';import pg from'pg';import{randomUUID,randomBytes}from'node:crypto';
import{migrate,localDatabaseUrl}from'../../scripts/database/migrate.mjs';
import{setOwner}from'../../scripts/local/setup.mjs';
import{authenticate,validSession,revokeSession}from'../../src/infrastructure/auth/credentials.mjs';
import{command,workspace,exportJournal}from'../../src/application/workspace.mjs';
import{ownerDatabase,closePools}from'../../src/infrastructure/database/pools.mjs';
const connection=process.env.SWINGPILOT_TEST_DATABASE_URL;
test('manual lifecycle and real credential/session boundaries',{skip:!connection&&'requires a fresh isolated local swingpilot_test_* database'},async t=>{
 const url=new URL(localDatabaseUrl(connection));assert.match(url.pathname,/^\/swingpilot_test_/);const admin=new pg.Client({connectionString:connection});await admin.connect();const roles=[];
 try{
  await migrate(admin);await setOwner(admin,'testowner','long synthetic test password');
  const owner=(await admin.query("SELECT id FROM swingpilot.app_users WHERE login_name='testowner'")).rows[0].id;
  for(const[k,group]of[['APP_DATABASE_URL','swingpilot_app'],['AUTH_DATABASE_URL','swingpilot_auth']]){
   const name='test_'+randomBytes(8).toString('hex');const secret=randomBytes(24).toString('hex');const ddl=(await admin.query("SELECT format('CREATE ROLE %I LOGIN NOINHERIT PASSWORD %L',$1::text,$2::text)",[name,secret])).rows[0].format;await admin.query(ddl);roles.push(name);await admin.query(`GRANT ${group} TO ${name}`);const u=new URL(url);u.username=name;u.password=secret;process.env[k]=u.toString();
  }
  await t.test('wrong credentials, session revocation and recovery',async()=>{
   assert.equal(await authenticate('testowner','wrong password'),null);const user=await authenticate('testowner','long synthetic test password');assert.equal(user.id,owner);assert.equal(await validSession(user.sid,owner,user.epoch),true);
   await revokeSession(user.sid);assert.equal(await validSession(user.sid,owner,user.epoch),false);
   const old=await authenticate('testowner','long synthetic test password');await setOwner(admin,'testowner','replacement synthetic password',true);assert.equal(await validSession(old.sid,owner,old.epoch),false);assert.equal(await authenticate('testowner','long synthetic test password'),null);const idle=await authenticate('testowner','replacement synthetic password');assert.ok(idle);await admin.query("UPDATE swingpilot.app_sessions SET last_seen_at=now()-interval '31 minutes' WHERE owner_id=$1 AND revoked_at IS NULL",[owner]);assert.equal(await validSession(idle.sid,owner,idle.epoch),false);const expired=await authenticate('testowner','replacement synthetic password');await admin.query("UPDATE swingpilot.app_sessions SET expires_at=now()-interval '1 second' WHERE owner_id=$1 AND revoked_at IS NULL",[owner]);assert.equal(await validSession(expired.sid,owner,expired.epoch),false);
  });
  await t.test('persistent login throttling',async()=>{for(let i=0;i<5;i++)await authenticate('nonexistent','wrong');assert.equal(await authenticate('nonexistent','a valid looking long password'),null);assert.ok((await admin.query("SELECT attempts FROM swingpilot.login_limits WHERE bucket<>'global' ORDER BY attempts DESC LIMIT 1")).rows[0].attempts>=6);await admin.query('DELETE FROM swingpilot.login_limits');});
  const now='2026-01-01T12:00:00Z',expiry='2030-01-01T00:00:00Z';
  const send=(action,body,key=randomUUID())=>command(owner,action,body,key);
  const state=()=>workspace(owner);
  await send('CREATE_PORTFOLIO',{name:'Synthetic fixture',openingCash:'10000',asOf:now,riskFraction:'0.01',positionFraction:'0.2',exposureFraction:'0.8',sectorFraction:'0.4',cashBuffer:'0'});
  const plan=await send('SAVE_PLAN',{symbol:'AAPL',exchange:'XNAS',sector:'Technology',entry:'100',stop:'95',target:'120',buyFee:'1',sellFee:'1',slippage:'0',thesis:'Synthetic fixture only',invalidation:'Stop breached',expiresAt:expiry,manualIdentityAcknowledged:true});
  await t.test('SQL risk sizing agrees with independently expected quantity',async()=>{const approved=await send('APPROVE_PLAN',{planId:plan.id,expectedRevision:1,manualValuationAcknowledged:true});assert.equal(approved.quantity,19);assert.equal((await state()).plan_approvals[0].snapshot.policy.openingCash,'10000.00000000');});
  await t.test('duplicate requests return prior result; mismatched retries rejected',async()=>{const key=randomUUID();const body={planId:plan.id,expectedRevision:2,entry:'101',stop:'90',target:'130',buyFee:'1',sellFee:'1',slippage:'0',thesis:'New draft',invalidation:'Invalidated',expiresAt:expiry,manualIdentityAcknowledged:true};const a=await send('SAVE_PLAN',body,key);assert.deepEqual(await send('SAVE_PLAN',body,key),a);await assert.rejects(send('SAVE_PLAN',{...body,entry:'102'},key),/IDEMPOTENCY_CONFLICT/);});
  let trade;
  await t.test('purchase pins old approval while new draft exists',async()=>{trade=await send('BUY',{planId:plan.id,expectedRevision:3,actualExecution:true,fills:[{quantity:10,price:'100',fee:'1',executedAt:now,emotion:'CALM'}]});const data=await state();assert.equal(data.trades[0].initial_stop,'95.00000000');assert.equal(data.trades[0].initial_risk,'50.00000000');assert.equal(data.totals.cash,'8999.00000000');});
  await t.test('ADD keeps original R and partial exit uses FIFO/fee conservation',async()=>{
   await send('BUY',{tradeId:trade.id,expectedRevision:1,actualExecution:true,riskDeviationAcknowledged:true,fills:[{quantity:5,price:'110',fee:'1',executedAt:'2026-01-02T12:00:00Z',emotion:'CONFIDENT'}]});
   await send('SELL',{tradeId:trade.id,expectedRevision:2,actualExecution:true,fills:[{quantity:12,price:'120',fee:'1.2',executedAt:'2026-01-03T12:00:00Z'}]});
   const data=await state();assert.equal(data.trades[0].quantity,'3');assert.equal(data.trades[0].realized_pnl,'217.40000000');assert.equal(data.trades[0].remaining_basis,'330.60000000');assert.equal(data.trades[0].initial_risk,'50.00000000');assert.equal(data.totals.cash,'9886.80000000');assert.equal(data.totals.equity,null);
  });
  await t.test('manual mark enables dated journal valuation',async()=>{await send('SET_MARK',{tradeId:trade.id,expectedRevision:3,price:'120',asOf:'2026-01-03T12:30:00Z'});assert.equal((await state()).totals.equity,'10246.80000000');});
  await t.test('historical oversell correction rolls back its reversal and all side effects',async()=>{
   const first=(await state()).executions.find(e=>e.kind==='BUY'&&e.quantity==='10');const count=(await state()).executions.length;
   await assert.rejects(send('CORRECT_EXECUTION',{tradeId:trade.id,expectedRevision:3,executionId:first.id,reason:'Synthetic invalid correction',riskDeviationAcknowledged:true,replacement:{quantity:1,price:'100',fee:'1',executedAt:now,emotion:'CALM'}}),/OVERSELL/);assert.equal((await state()).executions.length,count);
  });
  await t.test('final exit closes and reconciles all net cash/P&L',async()=>{await send('SELL',{tradeId:trade.id,expectedRevision:3,actualExecution:true,fills:[{quantity:3,price:'90',fee:'0.3',executedAt:'2026-01-04T12:00:00Z'}]});const data=await state();assert.equal(data.trades[0].state,'CLOSED');assert.equal(data.trades[0].realized_pnl,'156.50000000');assert.equal(data.totals.cash,'10156.50000000');});
  await t.test('closure correction can reopen inventory without losing history',async()=>{const close=(await state()).executions.find(e=>e.kind==='SELL'&&e.quantity==='3');await send('CORRECT_EXECUTION',{tradeId:trade.id,expectedRevision:4,executionId:close.id,reason:'Synthetic correction',riskDeviationAcknowledged:true,replacement:{quantity:2,price:'90',fee:'0.3',executedAt:'2026-01-04T12:00:00Z'}});const data=await state();assert.equal(data.trades[0].state,'ACTIVE');assert.equal(data.trades[0].quantity,'1');assert.equal(data.trades[0].realized_pnl,'176.70000000');assert.ok(data.executions.some(e=>e.kind==='REVERSAL'));});
  await t.test('concurrent sells with the same revision cannot both commit',async()=>{const body={tradeId:trade.id,expectedRevision:5,actualExecution:true,fills:[{quantity:1,price:'100',fee:'0',executedAt:'2026-01-05T12:00:00Z'}]};const outcomes=await Promise.allSettled([send('SELL',body),send('SELL',body)]);assert.equal(outcomes.filter(x=>x.status==='fulfilled').length,1);assert.equal((await state()).trades[0].quantity,'0');});
  await t.test('cash correction is append-only; original flow preserved',async()=>{const deposit=await send('CASH_EVENT',{kind:'DEPOSIT',amount:'100',effectiveAt:now,reason:'Synthetic deposit'});await send('CASH_EVENT',{reversesId:deposit.id,kind:'DEPOSIT',amount:'120',effectiveAt:now,reason:'Synthetic correction'});const data=await state();assert.equal(data.cash_events.length,3);assert.equal(data.cash_events.filter(x=>x.kind==='REVERSAL')[0].amount,'-100.00000000');});
  await t.test('runtime cannot mutate financial tables or read password hashes',async()=>{
   await assert.rejects(ownerDatabase(owner,c=>c.query("DELETE FROM swingpilot.executions")),e=>e.code==='42501');
   await assert.rejects(ownerDatabase(owner,c=>c.query("SELECT password_hash FROM swingpilot.app_users")),e=>e.code==='42501');
   const stranger=randomUUID();assert.equal((await workspace(stranger)).trades.length,0);await assert.rejects(command(stranger,'PAUSE_PLAN',{planId:plan.id,expectedRevision:3},randomUUID()),/AUTH_REQUIRED/);
  });
  await t.test('actual fees beyond the risk budget require acknowledgment without hiding the fill',async()=>{
   const p=await send('SAVE_PLAN',{symbol:'GOOG',exchange:'XNAS',sector:'Technology',entry:'100',stop:'95',target:'120',buyFee:'0',sellFee:'0',slippage:'0',thesis:'Synthetic fee case',invalidation:'Stop',expiresAt:expiry,manualIdentityAcknowledged:true});
   await send('APPROVE_PLAN',{planId:p.id,expectedRevision:1,manualValuationAcknowledged:true});
   const body={planId:p.id,expectedRevision:2,actualExecution:true,fills:[{quantity:1,price:'100',fee:'200',executedAt:'2026-01-06T12:00:00Z',emotion:'UNKNOWN'}]};
   await assert.rejects(send('BUY',body),/RISK_ACKNOWLEDGMENT_REQUIRED/);assert.ok(!(await state()).trades.some(x=>x.plan_id===p.id));
   await send('BUY',{...body,riskDeviationAcknowledged:true});
  });
  await t.test('partial fee allocation conserves the final fractional remainder',async()=>{
   const p=await send('SAVE_PLAN',{symbol:'MSFT',exchange:'XNAS',sector:'Technology',entry:'10',stop:'9',target:'12',buyFee:'0.01',sellFee:'0.01',slippage:'0',thesis:'Synthetic fractional fee case',invalidation:'Stop',expiresAt:expiry,manualIdentityAcknowledged:true});
   const tr=await send('BUY',{planId:p.id,expectedRevision:1,actualExecution:true,riskDeviationAcknowledged:true,fills:[{quantity:3,price:'10',fee:'0.01',executedAt:'2026-01-07T12:00:00Z',emotion:'DECLINED'}]});
   for(let i=0;i<3;i++)await send('SELL',{tradeId:tr.id,expectedRevision:i+1,actualExecution:true,fills:[{quantity:1,price:'11',fee:'0.01',executedAt:`2026-01-07T12:0${i+1}:00Z`}]});
   const closed=(await state()).trades.find(x=>x.id===tr.id);assert.equal(closed.realized_pnl,'2.96000000');assert.equal(closed.remaining_basis,'0.00000000');
  });
  await t.test('same-time correction preserves original replay order and rejects marks before the position',async()=>{
   const p=await send('SAVE_PLAN',{symbol:'NVDA',exchange:'XNAS',sector:'Technology',entry:'10',stop:'9',target:'12',buyFee:'0',sellFee:'0',slippage:'0',thesis:'Synthetic ordering case',invalidation:'Stop',expiresAt:expiry,manualIdentityAcknowledged:true});
   const tr=await send('BUY',{planId:p.id,expectedRevision:1,actualExecution:true,riskDeviationAcknowledged:true,fills:[{quantity:2,price:'10',fee:'0',executedAt:'2026-01-08T12:00:00Z',emotion:'CALM'}]});
   await send('SELL',{tradeId:tr.id,expectedRevision:1,actualExecution:true,fills:[{quantity:1,price:'11',fee:'0',executedAt:'2026-01-08T12:00:00Z'}]});
   const first=(await state()).executions.find(x=>x.trade_id===tr.id&&x.kind==='BUY');await send('CORRECT_EXECUTION',{tradeId:tr.id,expectedRevision:2,executionId:first.id,reason:'Same timestamp',riskDeviationAcknowledged:true,replacement:{quantity:2,price:'9.5',fee:'0',executedAt:'2026-01-08T12:00:00Z',emotion:'CALM'}});
   const corrected=(await state()).trades.find(x=>x.id===tr.id);assert.equal(corrected.realized_pnl,'1.50000000');assert.equal(corrected.remaining_basis,'9.50000000');
   await assert.rejects(send('SET_MARK',{tradeId:tr.id,expectedRevision:3,price:'10',asOf:'2026-01-07T12:00:00Z'}),/MARK_PRECEDES_POSITION/);
   await assert.rejects(send('APPROVE_PLAN',{planId:p.id,expectedRevision:2,manualValuationAcknowledged:true}),/PLAN_ALREADY_ENTERED/);
  });
  await t.test('export excludes credentials and keeps audit/idempotent notification history',async()=>{const out=await exportJournal(owner);assert.ok(out.commands.length>0);assert.equal(out.commands.length,out.audit_events.length);assert.equal(out.commands.length,out.notifications.length);assert.equal(out.app_users,undefined);});
  await t.test('historical fills without a known original stop preserve facts and report R unavailable',async()=>{
   const tr=await send('BUY',{historical:true,symbol:'IBM',exchange:'XNYS',sector:'Technology',manualIdentityAcknowledged:true,actualExecution:true,riskDeviationAcknowledged:true,fills:[{quantity:2,price:'100',fee:'1',feeEstimated:true,executedAt:'2026-01-09T12:00:00Z',emotion:'UNKNOWN'}]});
   const data=(await state()).trades.find(x=>x.id===tr.id);assert.equal(data.initial_risk,null);assert.equal(data.initial_stop,null);assert.equal(data.fee_estimates,true);
   await send('SELL',{tradeId:tr.id,expectedRevision:1,actualExecution:true,fills:[{quantity:2,price:'110',fee:'1',executedAt:'2026-01-10T12:00:00Z'}]});assert.equal((await state()).trades.find(x=>x.id===tr.id).realized_pnl,'18.00000000');
  });
 }finally{await closePools();for(const role of roles)await admin.query(`DROP ROLE ${role}`);await admin.end();}
});

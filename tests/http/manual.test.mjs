import test from'node:test';import assert from'node:assert/strict';import pg from'pg';import sharp from'sharp';
import{randomBytes,randomUUID}from'node:crypto';import{mkdtemp,writeFile,rm}from'node:fs/promises';import{tmpdir}from'node:os';import{join}from'node:path';import{spawn}from'node:child_process';import{setTimeout as pause}from'node:timers/promises';
import{migrate,localDatabaseUrl}from'../../scripts/database/migrate.mjs';import{setOwner}from'../../scripts/local/setup.mjs';
import http from'node:http';
import {createHash} from'node:crypto';
import {diagnosticSample} from'../../src/domain/market/sample.mjs';
const connection=process.env.SWINGPILOT_TEST_DATABASE_URL;
test('production HTTP auth, commands, private files and session invalidation',{skip:!connection&&'requires a fresh isolated local swingpilot_test_* database and production build'},async t=>{
 const url=new URL(localDatabaseUrl(connection));assert.match(url.pathname,/^\/swingpilot_test_/);
 const admin=new pg.Client({connectionString:connection});await admin.connect();const directory=await mkdtemp(join(tmpdir(),'swingpilot-http-'));let server;let logs='';const roles=[];
 try{
  await migrate(admin);await setOwner(admin,'httpowner','synthetic HTTP test password');
  const config={DATABASE_URL:connection,AUTH_SECRET:randomBytes(48).toString('hex'),APP_ORIGIN:'http://127.0.0.1:3310',PRIVATE_DATA_DIR:join(directory,'files')};
  for(const[key,group]of[['APP_DATABASE_URL','swingpilot_app'],['AUTH_DATABASE_URL','swingpilot_auth']]){
   const name='http_'+randomBytes(8).toString('hex'),secret=randomBytes(24).toString('hex');const ddl=(await admin.query("SELECT format('CREATE ROLE %I LOGIN NOINHERIT PASSWORD %L',$1::text,$2::text)",[name,secret])).rows[0].format;await admin.query(ddl);roles.push(name);await admin.query(`GRANT ${group} TO ${name}`);const u=new URL(url);u.username=name;u.password=secret;config[key]=u.toString();
  }
  const configFile=join(directory,'settings.json');await writeFile(configFile,JSON.stringify(config),{mode:0o600});
  server=spawn(process.execPath,['scripts/local/run.mjs','start'],{cwd:process.cwd(),env:{...process.env,SWINGPILOT_CONFIG_FILE:configFile,PORT:'3310'},stdio:['ignore','pipe','pipe']});
  server.stdout.on('data',v=>{logs+=v;});server.stderr.on('data',v=>{logs+=v;});
  let ready=false;for(let i=0;i<100;i++){try{if((await fetch(config.APP_ORIGIN+'/login')).status===200){ready=true;break;}}catch{}await pause(100);}assert.ok(ready,'production server did not become ready');
  let jar=new Map();
  async function request(path,options={}){
   const r=await fetch(config.APP_ORIGIN+path,{redirect:'manual',...options,headers:{Cookie:[...jar].map(([k,v])=>k+'='+v).join('; '),...options.headers}});
   for(const cookie of r.headers.getSetCookie()){const first=cookie.split(';')[0],index=first.indexOf('=');jar.set(first.slice(0,index),first.slice(index+1));}
   return r;
  }
  async function login(password){const csrf=await(await request('/api/auth/csrf')).json();return request('/api/auth/callback/credentials',{method:'POST',headers:{Origin:config.APP_ORIGIN,'Content-Type':'application/x-www-form-urlencoded','X-Auth-Return-Redirect':'1'},body:new URLSearchParams({csrfToken:csrf.csrfToken,login:'httpowner',password,callbackUrl:config.APP_ORIGIN+'/dashboard'})});}
  async function send(action,body,key=randomUUID(),extra={}){return request('/api/commands',{method:'POST',headers:{Origin:config.APP_ORIGIN,'Content-Type':'application/json','Idempotency-Key':key,...extra},body:JSON.stringify({action,body})});}
  await t.test('anonymous access and hostile origins/hosts denied',async()=>{
   assert.equal((await request('/api/readiness')).status,401);
   for(const path of ['/api/analytics?from=2026-01-01&to=2026-01-07','/api/analytics/reviews/11111111-1111-4111-8111-111111111111','/api/analytics/reviews/11111111-1111-4111-8111-111111111111/packet'])assert.equal((await request(path)).status,401);
   assert.equal((await request('/api/analytics/reviews',{method:'POST',headers:{Origin:config.APP_ORIGIN,'Content-Type':'application/json'},body:'{}'})).status,401);
   assert.equal((await request('/api/desktop-tests')).status,401);assert.equal((await request('/api/desktop-tests',{method:'POST',headers:{Origin:config.APP_ORIGIN,'Content-Type':'application/json'},body:'{}'})).status,401);
   assert.equal((await request('/api/monitoring')).status,401);assert.equal((await request('/api/monitoring',{method:'POST',headers:{Origin:config.APP_ORIGIN,'Content-Type':'application/json'},body:'{}'})).status,401);
   assert.equal((await request('/api/reviews')).status,401);assert.equal((await request('/api/reviews/11111111-1111-4111-8111-111111111111/packet')).status,401);
   assert.equal((await request('/api/reviews',{method:'POST',headers:{Origin:config.APP_ORIGIN,'Content-Type':'application/json'},body:'{}'})).status,401);
   assert.equal((await request('/api/market-data/diagnose',{method:'POST',headers:{Origin:config.APP_ORIGIN,'Content-Type':'application/json'},body:'{}'})).status,401);
   assert.equal((await request('/api/workspace')).status,401);assert.equal((await request('/api/export')).status,401);const page=await request('/dashboard');assert.ok([200,307].includes(page.status));if(page.status===200){const html=await page.text();assert.ok(html.includes('/login'));assert.ok(!html.includes('httpowner'));}else assert.ok(page.headers.get('location').includes('/login')); // Next may stream a redirect with status 200, never private content.
   assert.equal((await request('/api/commands',{method:'POST',headers:{Origin:'https://example.invalid'}})).status,403);
   const hostile=await new Promise((resolve,reject)=>{const q=http.get('http://127.0.0.1:3310/api/health',{headers:{Host:'example.invalid'}},r=>{r.resume();resolve(r.statusCode);});q.on('error',reject);});assert.ok([400,403].includes(hostile),'raw hostile Host must be rejected');
  });
  await t.test('real Auth.js password login produces protected session',async()=>{
   await login('incorrect');assert.equal((await request('/api/workspace')).status,401);const r=await login('synthetic HTTP test password');assert.equal(r.status,200);
   assert.equal((await request('/api/workspace')).status,200);assert.equal((await request('/dashboard')).status,200);
   const sessionCookies=[...jar].filter(([name])=>name.includes('session-token'));assert.ok(sessionCookies.length>0);
   assert.ok(r.headers.getSetCookie().some(c=>c.includes('session-token')&&/HttpOnly/i.test(c)&&/SameSite=lax/i.test(c)));
  });
  await t.test('modified cookies and authenticated writes without Origin are denied',async()=>{const saved=new Map(jar);for(const[name,value]of jar)if(name.includes('session-token'))jar.set(name,value.slice(0,10)+(value[10]==='a'?'b':'a')+value.slice(11));assert.equal((await request('/api/workspace')).status,401);jar=saved;assert.equal((await request('/api/commands',{method:'POST',body:'{}'})).status,403);});
  await t.test('market diagnostics remain manual, bounded, private and unable to mutate the ledger',async()=>{
   const before=await(await request('/api/workspace')).json();
   async function diagnose(body,headers={}){return request('/api/market-data/diagnose',{method:'POST',headers:{Origin:config.APP_ORIGIN,'Content-Type':'application/json',...headers},body});}
   const bytes=JSON.stringify(diagnosticSample('consistent')),r=await diagnose(bytes);assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/no-store/);
   const result=await r.json();assert.equal(result.liveEligible,false);assert.equal(result.eodEligible,false);assert.equal(result.retained,false);assert.equal(result.sampleOutcome,'NO_HAZARDS_IN_SAMPLE');
   assert.ok(result.integrationBlockers.includes('ENTITLEMENT_UNVERIFIED'));assert.equal(result.submittedSha256,createHash('sha256').update(bytes).digest('hex'));
   const bad=await(await diagnose(JSON.stringify(diagnosticSample('scale')))).json();assert.ok(bad.findings.some(f=>f.code==='UNIT_SCALE_UNRESOLVED'));
   const forged=diagnosticSample();forged.sourceVerified=true;assert.equal((await diagnose(JSON.stringify(forged))).status,400);
   assert.equal((await diagnose('{')).status,400);assert.equal((await diagnose(' '.repeat(16385))).status,400);
   assert.equal((await diagnose(bytes,{'Content-Type':'text/plain'})).status,400);
   assert.equal((await diagnose(bytes,{Origin:'https://example.invalid'})).status,403);
   const page=await request('/research');assert.equal(page.status,200);const html=await page.text();assert.match(html,/market-json/);assert.match(html,/dir="rtl"/);assert.match(html,/data-theme="dark"/);
   assert.deepEqual(await(await request('/api/workspace')).json(),before);
  });
  let planId,tradeId;
  await t.test('manual setup/approval/buy works through protected command routes',async()=>{
   const created=await send('CREATE_PORTFOLIO',{name:'HTTP synthetic portfolio',openingCash:'10000',asOf:'2026-01-01T10:00:00Z',riskFraction:'0.01',positionFraction:'0.2',exposureFraction:'0.8',sectorFraction:'0.4',cashBuffer:'0'});assert.equal(created.status,200,await created.text());
   const p=await send('SAVE_PLAN',{symbol:'JPM',exchange:'XNYS',sector:'Financials',entry:'100',stop:'95',target:'120',buyFee:'0',sellFee:'0',slippage:'0',thesis:'Synthetic HTTP only',invalidation:'Stop breached',expiresAt:'2030-01-01T00:00:00Z',manualIdentityAcknowledged:true});assert.equal(p.status,200);planId=(await p.json()).id;
   const approval=await send('APPROVE_PLAN',{planId,expectedRevision:1,manualValuationAcknowledged:true});assert.equal(approval.status,200);
   const key=randomUUID(),body={planId,expectedRevision:2,actualExecution:true,fills:[{quantity:5,price:'100',fee:'0',executedAt:'2026-01-02T10:00:00Z',emotion:'CALM'}]};
   const first=await send('BUY',body,key);assert.equal(first.status,200);tradeId=(await first.json()).id;assert.equal((await send('BUY',body,key)).status,200);assert.equal((await send('BUY',{...body,fills:[{...body.fills[0],quantity:6}]},key)).status,409);
   for(const page of ['/plans','/watchlist','/positions','/positions/'+tradeId,'/journal','/settings','/notifications']){const r=await request(page);assert.equal(r.status,200,page);const html=await r.text();assert.match(html,/dir="rtl"/);assert.match(html,/data-theme="dark"/);}
  });
  await t.test('durable manual Codex request, packet and response flow is owner-only and changes no finances',async()=>{
   const before=await(await request('/api/workspace')).json();const plan=before.plans.find(p=>p.id===planId);
   const sendReview=(action,body,key=randomUUID(),extra={})=>request('/api/reviews',{method:'POST',headers:{Origin:config.APP_ORIGIN,'Content-Type':'application/json','Idempotency-Key':key,...extra},body:JSON.stringify({action,body})});
   const body={planId,expectedPlanRevision:Number(plan.row_version),sharingAcknowledged:true},key=randomUUID();
   const created=await sendReview('CREATE',body,key);assert.equal(created.status,200);const job=await created.json();assert.equal(job.state,'AWAITING_CODEX');
   assert.deepEqual(await(await sendReview('CREATE',body,key)).json(),job);
   const packetResponse=await request(`/api/reviews/${job.id}/packet`);assert.equal(packetResponse.status,200);assert.match(packetResponse.headers.get('cache-control'),/no-store/);const packet=await packetResponse.json();assert.equal(packet.transport,'MANUAL_COPY');assert.ok(!packet.packet.includes('opening_cash'));
   const page=await request('/reviews');assert.equal(page.status,200);const html=await page.text();assert.match(html,/review-plan/);assert.match(html,/data-theme="dark"/);
   const response={schemaVersion:1,jobId:job.id,inputSha256:packet.inputSha256,scope:'JOURNAL_ONLY_PLAN_REVIEW',modelLabel:'UNKNOWN',findings:[],limitations:['No verified market facts.']};
   const saved=await sendReview('SUBMIT',{jobId:job.id,expectedRevision:job.rowVersion,response,reviewAcknowledged:true});assert.equal(saved.status,200);assert.equal((await saved.json()).state,'REVIEW_READY');
   assert.equal((await(await request('/api/reviews')).json()).jobs[0].response.modelLabel,'UNKNOWN');
   assert.equal((await sendReview('CREATE',body,randomUUID(),{Origin:'https://example.invalid'})).status,403);
   assert.equal((await request('/api/reviews',{method:'POST',headers:{Origin:config.APP_ORIGIN,'Content-Type':'application/json'},body:' '.repeat(16385)})).status,400);
   const storedJar=jar;jar=new Map();assert.equal((await request(`/api/reviews/${job.id}/packet`)).status,401);jar=storedJar;
   assert.deepEqual(await(await request('/api/workspace')).json(),before);
  });
  await t.test('monitoring page persists only inactive rehearsal dates and never requests data or changes finances',async()=>{
   const before=await(await request('/api/workspace')).json();
   const sendMonitor=(action,body,key=randomUUID(),extra={})=>request('/api/monitoring',{method:'POST',headers:{Origin:config.APP_ORIGIN,'Content-Type':'application/json','Idempotency-Key':key,...extra},body:JSON.stringify({action,body})});
   const body={sessionDate:'2026-11-27',sessionStatus:'OPEN',regularClose:'13:00',sourceNote:'Synthetic HTTP rehearsal, not a calendar fact',expectedVersion:0,acknowledgedRehearsal:true};
   const preview=await sendMonitor('PREVIEW',body);assert.equal(preview.status,200);const p=await preview.json();assert.equal(p.automaticMonitoring,false);assert.equal(p.runs.find(r=>r.reason==='AFTER_CLOSE').dueAt,'2026-11-27T18:15:00.000Z');
   const key=randomUUID(),saved=await sendMonitor('SAVE_SCENARIO',body,key);assert.equal(saved.status,200);const scenario=await saved.json();assert.deepEqual(await(await sendMonitor('SAVE_SCENARIO',body,key)).json(),scenario);
   const r=await request('/api/monitoring');assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/no-store/);const data=await r.json();assert.equal(data.runs.length,2);assert.equal(data.canNotify,false);assert.equal(data.canRequestMarketData,false);assert.equal(data.canRunAi,false);assert.equal(data.lastScheduledExecution,null);assert.ok(data.blockers.includes('CALENDAR_UNVERIFIED'));
   assert.equal((await sendMonitor('SAVE_SCENARIO',{...body,automaticMonitoring:true})).status,400);assert.equal((await sendMonitor('ACTIVATE',{})).status,400);
   assert.equal((await sendMonitor('RECONCILE',{},randomUUID(),{Origin:'https://example.invalid'})).status,403);
   assert.equal((await request('/api/monitoring',{method:'POST',headers:{Origin:config.APP_ORIGIN,'Content-Type':'application/json'},body:' '.repeat(8193)})).status,400);
   const page=await request('/monitoring'),html=await page.text();assert.equal(page.status,200);assert.ok(html.includes('monitoring-date'),'monitoring input must render');assert.ok(html.includes('data-theme="dark"'));assert.ok(html.includes('dir="rtl"'));
   assert.equal((await sendMonitor('CANCEL_RUN',{runId:data.runs[0].id,expectedRevision:1})).status,200);
   assert.deepEqual(await(await request('/api/workspace')).json(),before);
  });
  await t.test('desktop test preference/queue/private receipt and worker-only boundaries hold over HTTP',async()=>{
   const before=await(await request('/api/workspace')).json();
   const sendDesktop=(action,body,key=randomUUID(),extra={})=>request('/api/desktop-tests',{method:'POST',headers:{Origin:config.APP_ORIGIN,'Content-Type':'application/json','Idempotency-Key':key,...extra},body:JSON.stringify({action,body})});
   assert.equal((await sendDesktop('QUEUE',{})).status,400);assert.equal((await sendDesktop('PREFERENCE',{enabled:true,expectedRevision:0})).status,200);
   const key=randomUUID(),queued=await sendDesktop('QUEUE',{},key);assert.equal(queued.status,200);const job=await queued.json();assert.deepEqual(await(await sendDesktop('QUEUE',{},key)).json(),job);
   assert.equal((await sendDesktop('CLAIM',{testId:job.id})).status,400);assert.equal((await sendDesktop('QUEUE',{title:'BUY NOW'})).status,400);
   assert.equal((await sendDesktop('RECONCILE',{},randomUUID(),{Origin:'https://example.invalid'})).status,403);
   assert.equal((await request('/api/desktop-tests',{method:'POST',headers:{Origin:config.APP_ORIGIN,'Content-Type':'application/json'},body:' '.repeat(4097)})).status,400);
   // Synthetic accepted-sender fixture only: no PowerShell/OS notification or real human receipt.
   await admin.query("UPDATE swingpilot.desktop_delivery_tests SET state='ACCEPTED',receipt_hash=encode(sha256(convert_to(id::text||':482619','UTF8')),'hex'),accepted_at=now(),row_version=row_version+1 WHERE id=$1",[job.id]);
   const r=await request('/api/desktop-tests');assert.match(r.headers.get('cache-control'),/no-store/);const raw=await r.text();for(const secret of ['482619','receipt_hash','lease_token'])assert.ok(!raw.includes(secret));const dto=JSON.parse(raw);
   const ack=await sendDesktop('ACK',{testId:job.id,expectedRevision:dto.tests[0].row_version,code:'482619',seen:true,context:'UNKNOWN'});assert.equal(ack.status,200);assert.equal((await ack.json()).verified,true);
   const page=await request('/desktop-tests'),html=await page.text();assert.equal(page.status,200);assert.ok(html.includes('desktop-tests-enabled'));assert.ok(html.includes('data-theme="dark"'));
   assert.deepEqual(await(await request('/api/workspace')).json(),before);
  });
  await t.test('analytics and weekly manual review API enforce privacy, consent, binding and stale snapshots',async()=>{
   const before=await(await request('/api/workspace')).json();
   const r=await request('/api/analytics?from=2026-01-01&to=2026-01-07');assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/no-store/);const state=await r.json();assert.equal(state.report.metrics.count,0);assert.equal(state.report.excluded.openTrades,1);assert.equal(state.automaticDispatch,false);
   assert.equal((await request('/api/analytics?from=2026-02-30&to=2026-03-01')).status,400);assert.equal((await request('/api/analytics?from=2026-01-01&from=2026-01-02&to=2026-01-07')).status,400);
   const post=(action,body,headers={})=>request('/api/analytics/reviews',{method:'POST',headers:{Origin:config.APP_ORIGIN,'Content-Type':'application/json','Idempotency-Key':randomUUID(),...headers},body:JSON.stringify({action,body})});
   const body={from:'2026-01-01',to:'2026-01-07',expectedJournalRevision:state.report.journalRevision,sharingAcknowledged:true,includeEmotions:false};
   assert.equal((await post('CREATE',{...body,sharingAcknowledged:false})).status,400);assert.equal((await post('CREATE',body,{Origin:'https://example.invalid'})).status,403);
   const created=await post('CREATE',body);assert.equal(created.status,200);const job=await created.json();
   const packet=await(await request('/api/analytics/reviews/'+job.id+'/packet')).json();assert.match(packet.packet,/JOURNAL_ONLY_WEEKLY_REVIEW/);assert.ok(!packet.packet.includes('"symbol"'));assert.ok(!packet.packet.includes('"F_EMOTIONS"'));
   const response={schemaVersion:1,jobId:job.id,inputSha256:packet.inputSha256,scope:'JOURNAL_ONLY_WEEKLY_REVIEW',modelLabel:'UNKNOWN',findings:[],limitations:['Manual, no closed trades, no causality.']};
   assert.equal((await post('SUBMIT',{jobId:job.id,expectedRevision:1,response:{...response,approved:true},reviewAcknowledged:true})).status,400);
   const saved=await post('SUBMIT',{jobId:job.id,expectedRevision:1,response,reviewAcknowledged:true});assert.equal(saved.status,200);assert.equal((await saved.json()).state,'REVIEW_READY');
   const exported=await request('/api/analytics/reviews/'+job.id);assert.equal(exported.status,200);assert.match(exported.headers.get('cache-control'),/no-store/);assert.equal((await exported.json()).report.metrics.count,0);
   assert.equal((await request('/api/analytics/reviews/'+job.id+'/packet')).status,400);
   assert.equal((await request('/api/analytics/reviews',{method:'POST',headers:{Origin:config.APP_ORIGIN,'Content-Type':'application/json'},body:' '.repeat(16385)})).status,400);
   const page=await request('/analytics'),html=await page.text();assert.equal(page.status,200);assert.ok(html.includes('analytics-from'));assert.ok(html.includes('data-theme="dark"'));assert.ok(html.includes('dir="rtl"'));
   assert.deepEqual(await(await request('/api/workspace')).json(),before);
  });
  await t.test('protected local readiness is read-only, sanitized and cannot pass external acceptance',async()=>{
   const health=await(await request('/api/health')).json();assert.equal(health.sourceVersion,'0.8.0');assert.equal(health.configurationOnly,true);
   const before=await(await request('/api/workspace')).json();const r=await request('/api/readiness');assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/no-store/);const text=await r.text(),report=JSON.parse(text);
   assert.equal(report.localChecks,'PASSED');assert.equal(report.releaseStatus,'ACCEPTANCE_PENDING');assert.equal(report.laterNumberedPhases,0);assert.equal(report.capabilities.canRunAi,false);assert.equal(report.capabilities.canRequestMarketData,false);assert.equal(report.externalAcceptance.find(g=>g.code==='BACKUP_RESTORE').status,'DEFERRED_UNVERIFIED');
   for(const hidden of [config.AUTH_SECRET,config.APP_DATABASE_URL,config.AUTH_DATABASE_URL,'password_hash',directory])assert.ok(!text.includes(hidden));
   const page=await request('/readiness'),html=await page.text();assert.equal(page.status,200);assert.match(html,/data-theme="dark"/);assert.match(html,/dir="rtl"/);assert.ok(html.includes('0.8.0'));
   assert.deepEqual(await(await request('/api/workspace')).json(),before);
  });
  await t.test('private images normalize safely and never accept SVG',async()=>{
   const bytes=await sharp({create:{width:3,height:3,channels:3,background:'#334455'}}).png().toBuffer();
   const upload=await request('/api/uploads',{method:'POST',headers:{Origin:config.APP_ORIGIN,'Content-Type':'image/png'},body:bytes});assert.equal(upload.status,201);const{id}=await upload.json();
   const image=await request('/api/uploads/'+id);assert.equal(image.status,200);assert.match(image.headers.get('cache-control'),/no-store/);assert.equal(image.headers.get('content-type'),'image/png');
   assert.equal((await request('/api/uploads',{method:'POST',headers:{Origin:config.APP_ORIGIN},body:'<svg xmlns="http://www.w3.org/2000/svg"></svg>'})).status,400);
   const note=await send('ADD_NOTE',{tradeId,expectedRevision:1,note:'Private synthetic attachment',uploadId:id});assert.equal(note.status,200);
   const saved=jar;jar=new Map();assert.equal((await request('/api/uploads/'+id)).status,401);jar=saved;
  });
  await t.test('export includes records but no credential material',async()=>{const r=await request('/api/export');assert.equal(r.status,200);const body=await r.text();assert.ok(!body.includes('password_hash'));assert.ok(!body.includes(config.AUTH_SECRET));assert.equal(JSON.parse(body).executions.length,1);});
  await t.test('local password recovery invalidates the existing browser cookie',async()=>{await setOwner(admin,'httpowner','new synthetic HTTP password',true);assert.equal((await request('/api/workspace')).status,401);jar=new Map();await login('new synthetic HTTP password');assert.equal((await request('/api/workspace')).status,200);});
  await t.test('logout revokes replayed session cookies on the server',async()=>{const stolen=new Map(jar);const csrf=await(await request('/api/auth/csrf')).json();await request('/api/auth/signout',{method:'POST',headers:{Origin:config.APP_ORIGIN,'Content-Type':'application/x-www-form-urlencoded','X-Auth-Return-Redirect':'1'},body:new URLSearchParams({csrfToken:csrf.csrfToken,callbackUrl:config.APP_ORIGIN+'/login'})});jar=stolen;assert.equal((await request('/api/workspace')).status,401);});
  assert.ok(!logs.includes(config.AUTH_SECRET));
 }finally{
  if(server){server.kill('SIGTERM');await Promise.race([new Promise(r=>server.once('exit',r)),pause(3000)]);}
  for(const role of roles)await admin.query(`DROP ROLE ${role}`);await admin.end();await rm(directory,{recursive:true,force:true});
 }
});

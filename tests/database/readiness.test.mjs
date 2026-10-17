import test from 'node:test';import assert from 'node:assert/strict';import pg from 'pg';
import {randomUUID,randomBytes} from 'node:crypto';import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';import {spawn} from 'node:child_process';
import {migrate,localDatabaseUrl} from '../../scripts/database/migrate.mjs';import {setOwner} from '../../scripts/local/setup.mjs';
import {workspace,command} from '../../src/application/workspace.mjs';import {readinessForOwner} from '../../src/application/readiness.mjs';import {closePools} from '../../src/infrastructure/database/pools.mjs';
import {doctor,migrationChecks} from '../../scripts/local/doctor.mjs';
const connection=process.env.SWINGPILOT_TEST_DATABASE_URL;
test('read-only readiness detects real schema/role faults without modifying financial facts',{skip:!connection&&'requires a fresh isolated swingpilot_test_* database'},async t=>{
 const url=new URL(localDatabaseUrl(connection));assert.match(url.pathname,/^\/swingpilot_test_/);const admin=new pg.Client({connectionString:connection});await admin.connect();const directory=await mkdtemp(join(tmpdir(),'swingpilot-readiness-')),roles=[];
 try{
  await migrate(admin);await setOwner(admin,'readyowner','synthetic readiness password');const owner=(await admin.query("SELECT id FROM swingpilot.app_users WHERE login_name='readyowner'")).rows[0].id;
  const config={DATABASE_URL:connection,APP_ORIGIN:'http://127.0.0.1:3001',AUTH_SECRET:randomBytes(48).toString('hex'),PRIVATE_DATA_DIR:join(directory,'data')};
  for(const[key,group]of[['APP_DATABASE_URL','swingpilot_app'],['AUTH_DATABASE_URL','swingpilot_auth']]){
   const name='ready_'+randomBytes(8).toString('hex'),password=randomBytes(24).toString('hex');await admin.query((await admin.query("SELECT format('CREATE ROLE %I LOGIN NOINHERIT PASSWORD %L',$1::text,$2::text)",[name,password])).rows[0].format);roles.push(name);await admin.query(`GRANT ${group} TO ${name}`);const u=new URL(url);u.username=name;u.password=password;config[key]=u.toString();process.env[key]=config[key];
  }
  await mkdir(config.PRIVATE_DATA_DIR,{mode:0o700});const file=join(directory,'settings.json');await writeFile(file,JSON.stringify(config),{mode:0o600});
  await command(owner,'CREATE_PORTFOLIO',{name:'Read-only synthetic',openingCash:'10000',asOf:'2026-01-01T00:00:00Z',riskFraction:'0.01',positionFraction:'0.2',exposureFraction:'0.8',sectorFraction:'0.4',cashBuffer:'0'},randomUUID());const before=await workspace(owner),configBefore=await readFile(file);
  const inspect=()=>doctor(config,{configFile:file,testMode:true});
  const safeOutput=report=>{const raw=JSON.stringify(report);for(const secret of [config.AUTH_SECRET,connection,directory,...roles,config.APP_DATABASE_URL,config.AUTH_DATABASE_URL])assert.ok(!raw.includes(secret));};
  await t.test('healthy catalog and exact installed migrations pass while acceptance stays pending',async()=>{
   const report=await inspect();assert.ok(report.checks.every(c=>['PASS','MANUAL_ACL_REQUIRED'].includes(c.status)),JSON.stringify(report));assert.equal(report.releaseStatus,'ACCEPTANCE_PENDING');assert.equal(report.externalAcceptance.find(g=>g.code==='BACKUP_RESTORE').status,'DEFERRED_UNVERIFIED');safeOutput(report);
   assert.equal((await readinessForOwner(owner)).localChecks,'PASSED');assert.deepEqual(await workspace(owner),before);assert.deepEqual(await readFile(file),configBefore);
  });
  await t.test('full doctor CLI emits only sanitized JSON and does not change config or ledger',async()=>{
   let output='',errors='';const exit=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['scripts/local/doctor.mjs'],{cwd:process.cwd(),env:{...process.env,SWINGPILOT_CONFIG_FILE:file},stdio:['ignore','pipe','pipe']});child.stdout.on('data',v=>output+=v);child.stderr.on('data',v=>errors+=v);child.on('error',reject);child.on('exit',resolve);});
   assert.equal(exit,process.platform==='win32'?2:0,errors);safeOutput(JSON.parse(output));assert.equal(errors,'');assert.deepEqual(await workspace(owner),before);assert.deepEqual(await readFile(file),configBefore);
  });
  await t.test('missing installed migration is reported without applying it',async()=>{
   const old=(await admin.query("DELETE FROM swingpilot.schema_migrations WHERE name='0007_journal_analytics.sql' RETURNING *")).rows[0];
   try{const report=await inspect();assert.equal(report.checks.find(c=>c.code==='SCHEMA_COMPLETE').status,'FAIL');assert.equal((await admin.query("SELECT count(*)::int n FROM swingpilot.schema_migrations WHERE name=$1",[old.name])).rows[0].n,0);}
   finally{await admin.query('INSERT INTO swingpilot.schema_migrations(name,sha256,applied_at) VALUES($1,$2,$3)',[old.name,old.sha256,old.applied_at]);}
  });
  await t.test('changed hash or database newer than code blocks readiness without rewriting history',async()=>{
   await admin.query("INSERT INTO swingpilot.schema_migrations(name,sha256) VALUES('9999_future.sql',$1)",['f'.repeat(64)]);
   try{const checks=await migrationChecks(admin);assert.equal(checks.find(c=>c.code==='SCHEMA_NOT_NEWER_THAN_SOURCE').status,'FAIL');assert.equal(checks.find(c=>c.code==='SCHEMA_HASHES').status,'FAIL');}
   finally{await admin.query("DELETE FROM swingpilot.schema_migrations WHERE name='9999_future.sql'");}
   const old=(await admin.query("UPDATE swingpilot.schema_migrations SET sha256=$1 WHERE name='0007_journal_analytics.sql' RETURNING name",['f'.repeat(64)])).rows[0];
   try{assert.equal((await inspect()).checks.find(c=>c.code==='SCHEMA_HASHES').status,'FAIL');}
   finally{const sql=await readFile('local/migrations/'+old.name);const {createHash}=await import('node:crypto');await admin.query('UPDATE swingpilot.schema_migrations SET sha256=$1 WHERE name=$2',[createHash('sha256').update(sql).digest('hex'),old.name]);}
  });
  await t.test('excessive login privileges are detected even after SET ROLE',async()=>{
   await admin.query(`ALTER ROLE ${roles[0]} BYPASSRLS`);
   try{assert.equal((await inspect()).checks.find(c=>c.code==='APP_RESTRICTED_ROLES').status,'FAIL');}
   finally{await admin.query(`ALTER ROLE ${roles[0]} NOBYPASSRLS`);}
  });
  await t.test('direct financial write grants or disabled forced RLS fail independent checks',async()=>{
   await admin.query('GRANT UPDATE ON swingpilot.trades TO swingpilot_app');
   try{assert.equal((await readinessForOwner(owner)).checks.find(c=>c.code==='APP_AUTHORITY_SEPARATION').status,'FAIL');}
   finally{await admin.query('REVOKE UPDATE ON swingpilot.trades FROM swingpilot_app');}
   await admin.query('ALTER TABLE swingpilot.trades NO FORCE ROW LEVEL SECURITY');
   try{assert.equal((await inspect()).checks.find(c=>c.code==='APP_FORCED_OWNER_RLS').status,'FAIL');}
   finally{await admin.query('ALTER TABLE swingpilot.trades FORCE ROW LEVEL SECURITY');}
  });
  await t.test('public table and definer-function access are detected without invoking those commands',async()=>{
   await admin.query('GRANT SELECT ON swingpilot.trades TO PUBLIC');
   try{assert.equal((await inspect()).checks.find(c=>c.code==='APP_NO_PUBLIC_TABLE_GRANTS').status,'FAIL');}
   finally{await admin.query('REVOKE SELECT ON swingpilot.trades FROM PUBLIC');}
   await admin.query('GRANT EXECUTE ON FUNCTION swingpilot.journal_command(text,jsonb,uuid,text) TO PUBLIC');
   try{assert.equal((await inspect()).checks.find(c=>c.code==='APP_NO_PUBLIC_DEFINER_EXECUTION').status,'FAIL');}
   finally{await admin.query('REVOKE EXECUTE ON FUNCTION swingpilot.journal_command(text,jsonb,uuid,text) FROM PUBLIC');}
  });
  await t.test('project secret environment files stop CLI diagnostics before connections and never leak',async()=>{
   const project=join(directory,'source');await mkdir(project,{mode:0o700});await writeFile(join(project,'.env.local'),'AUTH_SECRET=synthetic-project-secret');
   const report=await doctor(config,{configFile:file,testMode:true,project});assert.equal(report.checks.find(c=>c.code==='NO_PROJECT_SECRET_ENV').status,'FAIL');assert.ok(!report.checks.some(c=>c.code==='SCHEMA_COMPLETE'));assert.ok(!JSON.stringify(report).includes('synthetic-project-secret'));
  });
  await t.test('restored fixture reports healthy with unchanged ledger and no schema mutations',async()=>{assert.deepEqual(await workspace(owner),before);assert.deepEqual(await migrate(admin),[]);assert.equal((await readinessForOwner(owner)).localChecks,'PASSED');});
 }finally{await closePools();for(const role of roles)await admin.query(`DROP ROLE ${role}`);await admin.end();await rm(directory,{recursive:true,force:true});}
});

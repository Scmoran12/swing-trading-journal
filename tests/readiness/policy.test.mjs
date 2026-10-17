import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink} from 'node:fs/promises';import {join,dirname,basename} from 'node:path';import {tmpdir} from 'node:os';
import {validateLocalTargets,assertPrivateLocation,releaseReport,sourceVersion} from '../../src/domain/readiness/policy.mjs';
import {doctor} from '../../scripts/local/doctor.mjs';
import {readSettings} from '../../scripts/local/config.mjs';import {privateFolder} from '../../src/infrastructure/files/private.mjs';
const settings=()=>({DATABASE_URL:'postgresql://migrator:synthetic@127.0.0.1:5432/swingpilot_test_readiness',APP_DATABASE_URL:'postgresql://runtime:synthetic@127.0.0.1:5432/swingpilot_test_readiness',AUTH_DATABASE_URL:'postgresql://login:synthetic@127.0.0.1:5432/swingpilot_test_readiness',APP_ORIGIN:'http://127.0.0.1:3001',AUTH_SECRET:'synthetic-secret-'.repeat(8)});
test('displayed source version matches the shipped package version',async()=>{
 const pkg=JSON.parse(await readFile(new URL('../../package.json',import.meta.url),'utf8'));assert.equal(sourceVersion,pkg.version);
});
test('test setup cannot fall back to missing, personal, mismatched or role-sharing connections',()=>{
 const valid=settings();assert.equal(validateLocalTargets(valid,true),true);assert.throws(()=>validateLocalTargets(null,true),/LOCAL_SETUP_REQUIRED/);
 for(const key of ['DATABASE_URL','APP_DATABASE_URL','AUTH_DATABASE_URL']){
  for(const replacement of ['postgresql://someone:synthetic@127.0.0.1:5432/personal','postgresql://someone:synthetic@127.0.0.1:5433/swingpilot_test_readiness','postgresql://someone:synthetic@localhost:5432/swingpilot_test_readiness','postgresql://someone:synthetic@remote.example/swingpilot_test_readiness'])assert.throws(()=>validateLocalTargets({...valid,[key]:replacement},true));
 }
 assert.throws(()=>validateLocalTargets({...valid,APP_DATABASE_URL:valid.DATABASE_URL}),/ROLE_MISMATCH/);
 assert.throws(()=>validateLocalTargets({...valid,APP_DATABASE_URL:valid.APP_DATABASE_URL+'?user=migrator'}),/ROLE_MISMATCH/);
 const personal=Object.fromEntries(Object.entries(valid).map(([k,v])=>[k,k.endsWith('DATABASE_URL')?v.replace('swingpilot_test_readiness','swingpilot'):v]));assert.throws(()=>validateLocalTargets(personal,true),/ISOLATED_TEST_DATABASE_REQUIRED/);
});
test('private locations exclude repository and OneDrive while source tree may stay in OneDrive',()=>{
 assert.throws(()=>assertPrivateLocation(join(process.cwd(),'config','settings.json')),/OUTSIDE_PROJECT/);
 assert.throws(()=>assertPrivateLocation(join(tmpdir(),'OneDrive - Example','settings.json')),/OUTSIDE_ONEDRIVE/);
 assert.doesNotThrow(()=>assertPrivateLocation(join(tmpdir(),'separate-private-account','settings.json')));
});
test('passing local checks cannot mark native/device/backup acceptance complete',()=>{
 const report=releaseReport([{code:'SYNTHETIC',status:'PASS'}],'2026-10-17T12:00:00Z');
 assert.equal(report.localChecks,'PASSED');assert.equal(report.releaseStatus,'ACCEPTANCE_PENDING');assert.equal(report.laterNumberedPhases,0);assert.equal(report.sourceVersion,sourceVersion);
 assert.equal(report.externalAcceptance.find(g=>g.code==='BACKUP_RESTORE').status,'DEFERRED_UNVERIFIED');assert.ok(Object.values(report.capabilities).every(v=>v===false));
 assert.equal(releaseReport([{code:'ACL',status:'MANUAL_ACL_REQUIRED'}]).localChecks,'ATTENTION_REQUIRED');
});
test('doctor halts before connecting on invalid paths and never prints config/private values',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'swingpilot-doctor-unit-'));
 try{
  const project=join(dir,'project');await mkdir(project);const file=join(project,'settings.json'),data=join(dir,'data');await mkdir(data);const config={...settings(),PRIVATE_DATA_DIR:data};await writeFile(file,JSON.stringify(config),{mode:0o600});const before=await readFile(file);
  const report=await doctor(config,{configFile:file,project,testMode:true});assert.equal(report.checks.find(c=>c.code==='CONFIG_FILE').status,'FAIL');assert.ok(!report.checks.some(c=>c.code==='APP_DIAGNOSTIC'));
  const printed=JSON.stringify(report);for(const value of [dir,config.AUTH_SECRET,config.DATABASE_URL,'synthetic-secret'])assert.ok(!printed.includes(value));assert.deepEqual(await readFile(file),before);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('private loader rejects database-role mismatch before starting a web process',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'swingpilot-config-target-')),old=process.env.SWINGPILOT_CONFIG_FILE;
 try{const file=join(dir,'settings.json');process.env.SWINGPILOT_CONFIG_FILE=file;const value=settings();value.APP_DATABASE_URL=value.DATABASE_URL;await writeFile(file,JSON.stringify({...value,PRIVATE_DATA_DIR:join(dir,'data')}),{mode:0o600});await assert.rejects(readSettings(),/ROLE_MISMATCH/);}
 finally{if(old===undefined)delete process.env.SWINGPILOT_CONFIG_FILE;else process.env.SWINGPILOT_CONFIG_FILE=old;await rm(dir,{recursive:true,force:true});}
});
test('private data ancestor symlink into the repository cannot bypass storage isolation',{skip:process.platform==='win32'&&'Windows symlink/junction acceptance requires physical-host privilege'},async()=>{
 const dir=await mkdtemp(join(tmpdir(),'swingpilot-ancestor-')),old=process.env.PRIVATE_DATA_DIR;
 try{await symlink(dirname(process.cwd()),join(dir,'alias'),'dir');process.env.PRIVATE_DATA_DIR=join(dir,'alias',basename(process.cwd()));await assert.rejects(privateFolder('11111111-1111-4111-8111-111111111111'),/UNSAFE_STORAGE_PATH|OUTSIDE_PROJECT/);}
 finally{if(old===undefined)delete process.env.PRIVATE_DATA_DIR;else process.env.PRIVATE_DATA_DIR=old;await rm(dir,{recursive:true,force:true});}
});

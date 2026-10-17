// Explicit read-only local diagnostic; no setup, migration, filesystem writes or native calls.
import pg from 'pg';
import {lstat,readFile,realpath,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {readSettings,settingsPath,localHome} from './config.mjs';
import {validateLocalTargets,assertPrivateLocation,releaseReport} from '../../src/domain/readiness/policy.mjs';
import {databaseChecks} from '../../src/infrastructure/readiness/database.mjs';
export async function migrationChecks(client,directory=fileURLToPath(new URL('../../local/migrations/',import.meta.url))){
 const files=(await readdir(directory)).filter(n=>/^\d{4}_[a-z0-9_]+\.sql$/.test(n)).sort();
 const installed=(await client.query('SELECT name,sha256 FROM swingpilot.schema_migrations')).rows;
 const known=new Map();for(const name of files)known.set(name,createHash('sha256').update(await readFile(join(directory,name))).digest('hex'));
 return [
  {code:'SCHEMA_COMPLETE',status:files.every(n=>installed.some(r=>r.name===n))?'PASS':'FAIL'},
  {code:'SCHEMA_HASHES',status:installed.every(r=>known.get(r.name)===r.sha256)?'PASS':'FAIL'},
  {code:'SCHEMA_NOT_NEWER_THAN_SOURCE',status:installed.every(r=>known.has(r.name))?'PASS':'FAIL'},
 ];
}
export async function doctor(settings,{configFile=settingsPath(),testMode=false,project=process.cwd(),migrationDirectory}={}){
 const checks=[],add=(code,status)=>checks.push({code,status});
 try{validateLocalTargets(settings,testMode);add('MATCHED_SEPARATE_LOCAL_DATABASES','PASS');}catch{add('MATCHED_SEPARATE_LOCAL_DATABASES','FAIL');return releaseReport(checks);}
 try{
  const origin=new URL(settings.APP_ORIGIN);
  if(origin.origin!==settings.APP_ORIGIN||origin.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(origin.hostname)||typeof settings.AUTH_SECRET!=='string'||settings.AUTH_SECRET.length<64)throw new Error('INVALID');
  add('LOCAL_ORIGIN_AND_SECRET_FORMAT','PASS');
 }catch{add('LOCAL_ORIGIN_AND_SECRET_FORMAT','FAIL');return releaseReport(checks);}
 for(const [code,path] of [['CONFIG_FILE',configFile],['CONFIG_DIRECTORY',dirname(configFile)],['DATA_DIRECTORY',settings.PRIVATE_DATA_DIR]]){
  try{
   assertPrivateLocation(path,project);assertPrivateLocation(await realpath(path),await realpath(project));
   const stat=await lstat(path);
   if(stat.isSymbolicLink()||(code==='CONFIG_FILE'?!stat.isFile():!stat.isDirectory()))throw new Error('INVALID');
   if(process.platform!=='win32'&&((stat.mode&0o077)!==0||stat.uid!==process.getuid()))throw new Error('INVALID');
   add(code,process.platform==='win32'?'MANUAL_ACL_REQUIRED':'PASS');
  }catch{add(code,'FAIL');}
 }
 try{
  let secret=false;
  for(const name of ['.env','.env.local','.env.development','.env.development.local','.env.production','.env.production.local']){
   try{secret ||= /^\s*(export\s+)?(DATABASE_URL|APP_DATABASE_URL|AUTH_DATABASE_URL|AUTH_SECRET|PRIVATE_DATA_DIR)\s*=/m.test(await readFile(join(project,name),'utf8'));}
   catch(error){if(error.code!=='ENOENT')throw error;}
  }
  add('NO_PROJECT_SECRET_ENV',secret?'FAIL':'PASS');
 }catch{add('NO_PROJECT_SECRET_ENV','FAIL');}
 // Bad paths/permissions halt before any connection; Windows ACLs stay a manual prerequisite.
 if(checks.some(c=>c.status==='FAIL'))return releaseReport(checks);
 for(const [kind,key,group] of [['schema','DATABASE_URL',null],['app','APP_DATABASE_URL','swingpilot_app'],['auth','AUTH_DATABASE_URL','swingpilot_auth']]){
  const client=new pg.Client({connectionString:settings[key],connectionTimeoutMillis:3000,query_timeout:5000});
  try{
   await client.connect();await client.query('BEGIN READ ONLY');await client.query("SET LOCAL statement_timeout='5s'");
   if(group)await client.query('SET LOCAL ROLE '+group);
   checks.push(...await(kind==='schema'?migrationChecks(client,migrationDirectory):databaseChecks(client,kind)));
  }catch{add(kind.toUpperCase()+'_DIAGNOSTIC','FAIL');}
  finally{try{await client.query('ROLLBACK');}catch{}await client.end();}
 }
 return releaseReport(checks);
}
async function main(){
 const args=process.argv.slice(2);if(args.some(a=>a!=='--test')||args.length>1)throw new Error('DOCTOR_ARGUMENT_INVALID');
 if(args.includes('--test'))process.env.SWINGPILOT_CONFIG_FILE=join(localHome()+'-test','config','settings.json');
 const settings=await readSettings();
 const report=await doctor(settings,{testMode:args.includes('--test')});
 console.log(JSON.stringify(report,null,2));process.exitCode=report.checks.some(c=>c.status==='FAIL')?1:report.localChecks==='PASSED'?0:2;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(()=>{console.log(JSON.stringify(releaseReport([{code:'LOCAL_CONFIG_OR_DOCTOR_ARGUMENTS',status:'FAIL'}]),null,2));process.exitCode=1;});

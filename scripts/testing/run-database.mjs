import{readdir,access}from'node:fs/promises';import{join}from'node:path';import{randomBytes}from'node:crypto';import{spawn}from'node:child_process';import pg from'pg';
import{localDatabaseUrl}from'../../src/infrastructure/database/config.mjs';import{localHome,readSettings}from'../local/config.mjs';
const mode=process.argv[2];let admin;let exit=0;
try{
 if(!['database','http'].includes(mode))throw new Error('TEST_MODE_INVALID');
 if(mode==='http')await access('.next/BUILD_ID');
 let connection=process.env.SWINGPILOT_TEST_DATABASE_URL;
 if(!connection){process.env.SWINGPILOT_CONFIG_FILE=join(localHome()+'-test','config','settings.json');connection=(await readSettings())?.DATABASE_URL;}
 const url=new URL(localDatabaseUrl(connection));if(!/^\/swingpilot_test_[a-z0-9_]+$/.test(url.pathname))throw new Error('ISOLATED_TEST_DATABASE_REQUIRED');
 admin=new pg.Client({connectionString:connection});await admin.connect();
 for(const file of(await readdir(`tests/${mode}`)).filter(f=>f.endsWith('.test.mjs')).sort()){
  const name=`swingpilot_test_${mode}_${randomBytes(8).toString('hex')}`;const childUrl=new URL(url);childUrl.pathname='/'+name;
  await admin.query(`CREATE DATABASE "${name}"`);
  try{const code=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['--test',`tests/${mode}/${file}`],{stdio:'inherit',env:{...process.env,SWINGPILOT_TEST_DATABASE_URL:childUrl.toString()}});child.on('error',reject);child.on('exit',resolve);});if(code!==0)exit=1;}
  finally{await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);}
 }
}catch{console.error('TEST_DATABASE_REQUIRED: configure the separate test setup first; HTTP checks also require npm run build. No personal database is used.');exit=1;}
finally{await admin?.end();process.exitCode=exit;}

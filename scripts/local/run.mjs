import {spawn} from "node:child_process";
import {loadSettings,localHome} from "./config.mjs";
import {readFile} from "node:fs/promises";
import {join}from'node:path';
import {validateLocalTargets} from '../../src/domain/readiness/policy.mjs';
const action=process.argv[2];
try{
 if(process.argv.includes('--test')){process.env.SWINGPILOT_CONFIG_FILE=join(localHome()+'-test','config','settings.json');process.env.PORT='3001';process.env.SWINGPILOT_TEST_MODE='true';}
 const settings=await loadSettings();
 if(process.argv.includes('--test'))validateLocalTargets(settings,true);
 const commands={dev:["node_modules/next/dist/bin/next","dev","--hostname","127.0.0.1"],start:["node_modules/next/dist/bin/next","start","--hostname","127.0.0.1"],build:["node_modules/next/dist/bin/next","build"],migrate:["scripts/database/migrate.mjs"]};
 if(!Object.hasOwn(commands,action))throw new Error("UNKNOWN_LOCAL_COMMAND");
 if(action!=="migrate")for(const name of ['.env','.env.local','.env.development','.env.development.local','.env.production','.env.production.local']){
  try{const value=await readFile(name,'utf8');if(/^\s*(export\s+)?(DATABASE_URL|APP_DATABASE_URL|AUTH_DATABASE_URL|AUTH_SECRET|PRIVATE_DATA_DIR)\s*=/m.test(value))throw new Error('PROJECT_SECRETS_REQUIRE_PRIVATE_MIGRATION');}catch(error){if(error.code!=='ENOENT')throw error;}
 }
 process.env.AUTH_URL=process.env.APP_ORIGIN??"http://127.0.0.1:3000";
 if(process.env.APP_ORIGIN)process.env.PORT=new URL(process.env.APP_ORIGIN).port||'80';
 process.env.NEXT_TELEMETRY_DISABLED="1";
 if(action!=="migrate")delete process.env.DATABASE_URL; // Never give the web process the migration connection.
 const child=spawn(process.execPath,commands[action],{stdio:"inherit",env:process.env});
 child.on("exit",code=>{process.exitCode=code??1;});
 for(const signal of ["SIGINT","SIGTERM"])process.on(signal,()=>child.kill(signal));
}catch(error){console.error(error.message==='PROJECT_SECRETS_REQUIRE_PRIVATE_MIGRATION'?'PROJECT_SECRETS_REQUIRE_PRIVATE_MIGRATION: move only SwingPilot secrets out of project .env files after local setup; preserve unrelated settings.':'LOCAL_CONFIGURATION_ERROR: run npm run local:setup or check the private settings file and permissions.');process.exitCode=1;}

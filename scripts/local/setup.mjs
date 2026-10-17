import {input,password,confirm} from "@inquirer/prompts";
import {randomBytes} from "node:crypto";
import {join,dirname,resolve} from "node:path";
import pg from "pg";
import argon2 from "argon2";
import {migrate,localDatabaseUrl} from "../database/migrate.mjs";
import {readSettings,writeSettings,secureDirectory,localHome,settingsPath} from "./config.mjs";
import {validatePassword,passwordOptions} from "../../src/infrastructure/auth/credentials.mjs";

export async function setOwner(client,login,secret,recover=false){
 const name=login.trim().toLowerCase();if(!/^[a-z0-9_.-]{3,64}$/.test(name))throw new Error("LOGIN_NAME_INVALID");
 const hash=await argon2.hash(validatePassword(secret),passwordOptions);
 await client.query("BEGIN");
 try{
  await client.query("SELECT pg_advisory_xact_lock(19485002)");
  if(recover){
   const user=await client.query("UPDATE swingpilot.app_users SET password_hash=$1,password_changed_at=now(),session_epoch=session_epoch+1,updated_at=now() WHERE login_name=$2 AND state='ACTIVE' RETURNING id",[hash,name]);
   if(!user.rowCount)throw new Error("LOCAL_OWNER_NOT_FOUND");
   await client.query("UPDATE swingpilot.app_sessions SET revoked_at=now() WHERE owner_id=$1",[user.rows[0].id]);
   await client.query("DELETE FROM swingpilot.login_limits");
  }else{
   const user=await client.query("INSERT INTO swingpilot.app_users(login_name,password_hash) VALUES($1,$2) RETURNING id",[name,hash]);
   await client.query("INSERT INTO swingpilot.profiles(id,display_name) VALUES($1,$2)",[user.rows[0].id,name]);
  }
  await client.query("COMMIT");
 }catch(e){await client.query("ROLLBACK");throw e;}
}

async function main(){
 if(!process.stdin.isTTY||!process.stdout.isTTY)throw new Error("INTERACTIVE_LOCAL_TERMINAL_REQUIRED");
 const recover=process.argv.includes("--recover");
 const testing=process.argv.includes('--test');
 if(testing)process.env.SWINGPILOT_CONFIG_FILE=join(localHome()+'-test','config','settings.json');
 let settings=await readSettings();
 if(recover&&!settings)throw new Error("LOCAL_SETUP_REQUIRED");
 let connection=settings?.DATABASE_URL;
 if(!connection){
  const database=await input({message:"Local database name:",default:testing?'swingpilot_test_acceptance':"swingpilot",validate:v=>(testing?/^swingpilot_test_[a-z0-9_]+$/:/^swingpilot[a-z0-9_]*$/).test(v)||"Use a suitable swingpilot database name."});
  const user=await input({message:"Local PostgreSQL administrative username:",default:"postgres"});
  const port=await input({message:"Local PostgreSQL port:",default:"5432",validate:v=>/^\d{1,5}$/.test(v)&&Number(v)>0&&Number(v)<65536||"Enter a valid port."});
  const secret=await password({message:"PostgreSQL administrative password (hidden):",mask:"*"});
  const url=new URL(`postgresql://127.0.0.1:${port}/postgres`);url.username=user;url.password=secret;
  const bootstrap=new pg.Client({connectionString:url.toString(),connectionTimeoutMillis:5000});await bootstrap.connect();
  try{if(!(await bootstrap.query('SELECT 1 FROM pg_database WHERE datname=$1',[database])).rowCount){const ddl=(await bootstrap.query("SELECT format('CREATE DATABASE %I',$1::text)",[database])).rows[0].format;await bootstrap.query(ddl);}}finally{await bootstrap.end();}
  url.pathname='/'+database;connection=localDatabaseUrl(url.toString());
 }
 const client=new pg.Client({connectionString:connection,connectionTimeoutMillis:5000});await client.connect();
 try{
  const listening=(await client.query('SHOW listen_addresses')).rows[0].listen_addresses.split(',').map(v=>v.trim());
  if(listening.some(v=>!['localhost','127.0.0.1','::1'].includes(v)))throw new Error('POSTGRES_LOOPBACK_REQUIRED');
  if(Number((await client.query('SHOW server_version_num')).rows[0].server_version_num)<160000)throw new Error('POSTGRES_VERSION_UNSUPPORTED');
  await migrate(client);
  if(!settings){
   await client.query('BEGIN');
   try{
   settings={DATABASE_URL:connection,APP_ORIGIN:testing?'http://127.0.0.1:3001':"http://127.0.0.1:3000",AUTH_SECRET:randomBytes(48).toString("hex"),PRIVATE_DATA_DIR:resolve(dirname(settingsPath()),'..','data')};
   const dbName=new URL(connection).pathname.slice(1);
   await client.query((await client.query("SELECT format('REVOKE CONNECT ON DATABASE %I FROM PUBLIC',$1::text)",[dbName])).rows[0].format);
   await client.query((await client.query("SELECT format('GRANT CONNECT ON DATABASE %I TO %I',$1::text,current_user::text)",[dbName])).rows[0].format);
   for(const [key,name,group] of [["APP_DATABASE_URL",testing?'swingpilot_test_runtime':"swingpilot_runtime","swingpilot_app"],["AUTH_DATABASE_URL",testing?'swingpilot_test_login':"swingpilot_login","swingpilot_auth"]]){
    if((await client.query("SELECT 1 FROM pg_roles WHERE rolname=$1",[name])).rowCount)throw new Error("EXISTING_RUNTIME_ROLE_REQUIRES_REVIEW");
    const secret=randomBytes(32).toString("hex");
    const ddl=(await client.query("SELECT format('CREATE ROLE %I LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD %L',$1::text,$2::text)",[name,secret])).rows[0].format;
    await client.query(ddl);await client.query(`GRANT ${group} TO ${name}`);
    await client.query((await client.query("SELECT format('GRANT CONNECT ON DATABASE %I TO %I',$1::text,$2::text)",[dbName,name])).rows[0].format);
    const url=new URL(connection);url.username=name;url.password=secret;settings[key]=url.toString();
   }
   await secureDirectory(settings.PRIVATE_DATA_DIR);await writeSettings(settings);
   await client.query('COMMIT');
   }catch(error){await client.query('ROLLBACK');throw error;}
  }
  const exists=await client.query("SELECT 1 FROM swingpilot.app_users WHERE state='ACTIVE'");
  if(!exists.rowCount||recover){
   if(recover&&!await confirm({message:"Reset the local owner password and revoke every session?",default:false}))return;
   const login=await input({message:"Local login name (3–64 Latin letters/numbers):"});
   const first=await password({message:"New local password (12–128 characters):",mask:"*"});
   const second=await password({message:"Repeat password:",mask:"*"});if(first!==second)throw new Error("PASSWORDS_DO_NOT_MATCH");
   await setOwner(client,login,first,recover);
  }
  console.log("Local setup complete. Restart the app. No credentials were printed; backups remain deferred.");
 }finally{await client.end();}
}
if(process.argv[1]?.endsWith("scripts/local/setup.mjs")||process.argv[1]?.endsWith("scripts\\local\\setup.mjs"))main().catch(error=>{const allowed=['PASSWORD_LENGTH','PASSWORDS_DO_NOT_MATCH','LOGIN_NAME_INVALID','INTERACTIVE_LOCAL_TERMINAL_REQUIRED','EXISTING_RUNTIME_ROLE_REQUIRES_REVIEW','CONFIG_PERMISSIONS_REQUIRED','LOCAL_SETUP_REQUIRED','POSTGRES_LOOPBACK_REQUIRED','POSTGRES_VERSION_UNSUPPORTED'];const code=allowed.includes(error.message)?error.message:/^[A-Z0-9]{5}$/.test(error.code??'')?`POSTGRES_${error.code}`:'LOCAL_SETUP_FAILED';console.error(`${code}: check local PostgreSQL, role permissions, configuration and password requirements. No secret values are displayed.`);process.exitCode=1;});

// One queued test, one attempt, explicit local invocation; never a daemon/scheduled task.
import {randomInt,randomUUID} from 'node:crypto';import {join} from 'node:path';
import {loadSettings,localHome} from './config.mjs';
import {authDatabase,closePools} from '../../src/infrastructure/database/pools.mjs';
import {desktopTestCommand,pendingDesktopTest,claimDesktopTest,desktopLeaseValid,finishDesktopTest} from '../../src/application/desktop-tests.mjs';
import {sendWindowsTestToast} from '../../src/infrastructure/notifications/windows.mjs';
import {requireDesktopSettings} from '../../src/infrastructure/notifications/settings.mjs';
try{
 if(process.platform!=='win32')throw new Error('WINDOWS_REQUIRED');
 const args=process.argv.slice(2),appIndex=args.indexOf('--app-id');
 if(appIndex<0||!args[appIndex+1]||!/^[A-Za-z0-9._!\-]{1,180}$/.test(args[appIndex+1])||args.some((a,i)=>i!==appIndex&&i!==appIndex+1&&a!=='--test'))throw new Error('REGISTERED_APP_ID_REQUIRED');
 if(args.includes('--test'))process.env.SWINGPILOT_CONFIG_FILE=join(localHome()+'-test','config','settings.json');
 const settings=await loadSettings();requireDesktopSettings(settings,args.includes('--test'));delete process.env.DATABASE_URL;
 const owner=await authDatabase(async c=>{const users=(await c.query("SELECT id FROM swingpilot.app_users WHERE state='ACTIVE'")).rows;if(users.length!==1)throw new Error('AUTH_REQUIRED');return users[0].id;});
 await desktopTestCommand(owner,'RECONCILE',{},randomUUID());
 const job=await pendingDesktopTest(owner);if(!job){console.log('NO_PENDING_DESKTOP_TEST: enable and queue a test in the local website first.');}
 else{
  const code=String(randomInt(100000,1000000)),token=randomUUID();await claimDesktopTest(owner,job,code,token);
  if(!await desktopLeaseValid(owner,job.id,token))throw new Error('STALE_DELIVERY_LEASE');
  const result=await sendWindowsTestToast({appId:args[appIndex+1],code,testId:job.id,expiresAt:new Date(job.expires_at).toISOString()});
  await finishDesktopTest(owner,job.id,token,result.outcome,result.errorCode);
  console.log(result.outcome==='ACCEPTED'?'SENDER_ACCEPTED: display is unverified. Enter the code visible in the Windows notice on the local desktop-test page.':`${result.outcome}: ${result.errorCode}. Check local delivery history; no automatic resend.`);
 }
}catch(error){const code=/^[A-Z_]{3,70}$/.test(error.message??'')?error.message:'DESKTOP_TEST_FAILED';console.error(code+': check local setup and test history. No private payload is printed.');process.exitCode=1;}
finally{await closePools();}

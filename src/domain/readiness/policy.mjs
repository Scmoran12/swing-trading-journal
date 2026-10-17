import {isAbsolute,relative,sep} from 'node:path';
import {localDatabaseUrl} from '../../infrastructure/database/config.mjs';
export const sourceVersion='0.8.0';
export function assertPrivateLocation(path,project=process.cwd()){
 if(typeof path!=='string'||!isAbsolute(path))throw new Error('PRIVATE_PATH_REQUIRED');
 const rel=relative(project,path);
 if(rel===''||(!rel.startsWith('..'+sep)&&rel!=='..'&&!isAbsolute(rel)))throw new Error('PRIVATE_PATH_OUTSIDE_PROJECT_REQUIRED');
 if(/(^|[/\\])OneDrive(?:[ -][^/\\]+)?([/\\]|$)/i.test(path))throw new Error('PRIVATE_PATH_OUTSIDE_ONEDRIVE_REQUIRED');
}
export function validateLocalTargets(settings,testMode=false){
 if(!settings)throw new Error('LOCAL_SETUP_REQUIRED');
 const urls=['DATABASE_URL','APP_DATABASE_URL','AUTH_DATABASE_URL'].map(key=>new URL(localDatabaseUrl(settings[key])));
 const targets=urls.map(url=>[url.hostname.toLowerCase(),url.port||'5432',decodeURIComponent(url.pathname)].join('|'));
 if(new Set(targets).size!==1)throw new Error('LOCAL_DATABASE_TARGET_MISMATCH');
 // URL query credentials could override authority separation in the driver.
 if(urls.some(url=>[...url.searchParams.keys()].some(key=>['user','password'].includes(key.toLowerCase()))))throw new Error('LOCAL_DATABASE_ROLE_MISMATCH');
 if(new Set(urls.map(url=>decodeURIComponent(url.username))).size!==3||urls.some(url=>!url.username))throw new Error('LOCAL_DATABASE_ROLE_MISMATCH');
 if(testMode&&!/^\/swingpilot_test_[a-z0-9_]+$/.test(decodeURIComponent(urls[0].pathname)))throw new Error('ISOLATED_TEST_DATABASE_REQUIRED');
 return true;
}
export function releaseReport(checks,observedAt=new Date().toISOString()){
 return {schemaVersion:1,sourceVersion,observedAt,scope:'LOCAL_READ_ONLY_DIAGNOSTICS',
  localChecks:checks.every(c=>c.status==='PASS')?'PASSED':'ATTENTION_REQUIRED',releaseStatus:'ACCEPTANCE_PENDING',
  checks,externalAcceptance:[
   {code:'WINDOWS_BROWSER_ACCEPTANCE',status:'UNVERIFIED'},
   {code:'NATIVE_DATA_BILLING_PRICE_HISTORY',status:'BLOCKED'},
   {code:'INCLUDED_USAGE_SPENDING_CONTROLS',status:'UNVERIFIED'},
   {code:'NATIVE_SCHEDULE_SLEEP_RECOVERY',status:'UNVERIFIED'},
   {code:'ACTUAL_DESKTOP_RECEIPT',status:'UNVERIFIED'},
   {code:'PRIVATE_IPHONE_HTTPS_PUSH',status:'BLOCKED_CONDITIONAL'},
   {code:'BACKUP_RESTORE',status:'DEFERRED_UNVERIFIED'},
  ],capabilities:{canRequestMarketData:false,canRunAi:false,automaticMonitoring:false,canSubmitOrders:false,publicExposure:false},
  nextStep:'WINDOWS_ACCEPTANCE_AND_EXISTING_GATES',laterNumberedPhases:0};
}

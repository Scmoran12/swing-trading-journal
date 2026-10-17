import {readFile} from 'node:fs/promises';import {spawn} from 'node:child_process';
const known = new Set(['APP_ID_NOT_REGISTERED','TEST_EXPIRED','WINDOWS_NOTIFICATIONS_DISABLED','WINDOWS_ADAPTER_UNAVAILABLE','WINDOWS_SEND_AMBIGUOUS']);
async function runPowerShell(payload){
 const script=await readFile(new URL('../../../scripts/windows/desktop-test-toast.ps1',import.meta.url),'utf8');
 return new Promise(resolve=>{
  let stdout='',settled=false;const child=spawn('powershell.exe',['-NoLogo','-NoProfile','-NonInteractive','-STA','-Command',script],{stdio:['pipe','pipe','ignore'],windowsHide:true});
  const done=value=>{if(!settled){settled=true;clearTimeout(timer);resolve(value);}};
  const timer=setTimeout(()=>{child.kill();done({outcome:'UNKNOWN',errorCode:'WINDOWS_SEND_AMBIGUOUS'});},15000);
  child.on('error',error=>done(['ENOENT','EACCES','EPERM'].includes(error.code)?{outcome:'FAILED',errorCode:'WINDOWS_ADAPTER_UNAVAILABLE'}:{outcome:'UNKNOWN',errorCode:'WINDOWS_SEND_AMBIGUOUS'}));
  child.stdout.on('data',v=>{stdout+=v.toString('utf8');if(stdout.length>2048){child.kill();done({outcome:'UNKNOWN',errorCode:'WINDOWS_SEND_AMBIGUOUS'});}});
  child.stdin.on('error',()=>{});child.stdin.end(JSON.stringify(payload));
  child.on('close',code=>{if(code!==0)return done({outcome:'UNKNOWN',errorCode:'WINDOWS_SEND_AMBIGUOUS'});try{done(JSON.parse(stdout.replace(/^\uFEFF/,'')));}catch{done({outcome:'UNKNOWN',errorCode:'WINDOWS_SEND_AMBIGUOUS'});}});
 });
}
export async function sendWindowsTestToast({appId,code,testId,expiresAt},{platform=process.platform,run=runPowerShell,now=Date.now()}={}){
 if(platform!=='win32')return{outcome:'FAILED',errorCode:'WINDOWS_REQUIRED'};
 if(typeof appId!=='string'||!/^[A-Za-z0-9._!\-]{1,180}$/.test(appId)||typeof code!=='string'||!/^\d{6}$/.test(code)||typeof testId!=='string'||!/^[a-f0-9-]{36}$/.test(testId))throw new Error('INVALID_FIXED_PAYLOAD');
 const expiry=Date.parse(expiresAt);if(!Number.isFinite(expiry)||expiry<=now)return{outcome:'FAILED',errorCode:'TEST_EXPIRED'};
 if(expiry>now+601000)throw new Error('INVALID_FIXED_PAYLOAD');
 let result;try{result=await run({appId,code,tag:testId.replaceAll('-','').slice(0,16),expiresAt});}catch{return{outcome:'UNKNOWN',errorCode:'WINDOWS_SEND_AMBIGUOUS'};}
 if(!result||!['ACCEPTED','FAILED','UNKNOWN'].includes(result.outcome)||!(result.errorCode===null||known.has(result.errorCode))
  ||(result.outcome==='ACCEPTED'&&result.errorCode!==null)||(result.outcome==='FAILED'&&(!result.errorCode||result.errorCode==='WINDOWS_SEND_AMBIGUOUS')))return{outcome:'UNKNOWN',errorCode:'WINDOWS_SEND_AMBIGUOUS'};
 // Ignore any unexpected child output fields, never return the private code/payload.
 return{outcome:result.outcome,errorCode:result.errorCode};
}

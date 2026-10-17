import {createHash,randomUUID} from 'node:crypto';
import {ownerDatabase} from '../infrastructure/database/pools.mjs';
import {fingerprint,validId} from './input.mjs';
export function receiptHash(testId,code){validId(testId);if(typeof code!=='string'||!/^\d{6}$/.test(code))throw new Error('RECEIPT_CODE_INVALID');return createHash('sha256').update(testId+':'+code).digest('hex');}
function shape(body,keys){if(!body||Array.isArray(body)||typeof body!=='object'||Object.keys(body).length!==keys.length||keys.some(k=>!Object.hasOwn(body,k)))throw new Error('DELIVERY_INPUT_INVALID');}
function revision(value){if(!Number.isSafeInteger(value)||value<0)throw new Error('REVISION_REQUIRED');}
async function internal(owner,action,body,key){return ownerDatabase(owner,async c=>(await c.query('SELECT swingpilot.desktop_delivery_command($1,$2::jsonb,$3::uuid,$4) result',[action,JSON.stringify(body),key,fingerprint(action,body)])).rows[0].result);}
export async function desktopTestCommand(owner,action,body,key){
 validId(key);
 if(action==='PREFERENCE'){shape(body,['enabled','expectedRevision']);revision(body.expectedRevision);if(typeof body.enabled!=='boolean')throw new Error('DELIVERY_INPUT_INVALID');}
 else if(['QUEUE','RECONCILE'].includes(action))shape(body,[]);
 else if(['RETRY','CANCEL'].includes(action)){shape(body,['testId','expectedRevision']);validId(body.testId);revision(body.expectedRevision);}
 else if(action==='ACK'){
  shape(body,['testId','expectedRevision','code','seen','context']);validId(body.testId);revision(body.expectedRevision);
  if(body.seen!==true||!['WEBSITE_CLOSED','WEBSITE_OPEN','UNKNOWN'].includes(body.context))throw new Error('DELIVERY_INPUT_INVALID');
  body={testId:body.testId,expectedRevision:body.expectedRevision,receiptHash:receiptHash(body.testId,body.code),seen:true,context:body.context};
 }else throw new Error('DELIVERY_INPUT_INVALID');
 return internal(owner,action,body,key);
}
export async function desktopTestsWorkspace(owner){return ownerDatabase(owner,async c=>{
 const pref=(await c.query('SELECT enabled,row_version FROM swingpilot.desktop_test_preferences')).rows[0]??{enabled:false,row_version:0};
 const tests=(await c.query(`SELECT id,kind,state,expires_at,attempt_count,receipt_attempts,accepted_at,confirmed_at,receipt_context,row_version,created_at,
  expires_at<=clock_timestamp() expired FROM swingpilot.desktop_delivery_tests ORDER BY created_at DESC,id DESC LIMIT 200`)).rows;
 const attempts=(await c.query('SELECT test_id,attempt,outcome,error_code,started_at,finished_at FROM swingpilot.desktop_delivery_attempts ORDER BY started_at DESC LIMIT 300')).rows;
 return JSON.parse(JSON.stringify({preference:pref,tests,attempts,automaticAlerts:false,iphonePush:false,receiptEvidence:'HUMAN_REPORTED_CODE_MATCH',testMode:process.env.SWINGPILOT_TEST_MODE==='true'}));
});}
export async function pendingDesktopTest(owner){return ownerDatabase(owner,async c=>(await c.query(`SELECT t.id,t.row_version,t.expires_at FROM swingpilot.desktop_delivery_tests t
 JOIN swingpilot.desktop_test_preferences p ON p.owner_id=t.owner_id WHERE p.enabled AND t.state='QUEUED' AND t.expires_at>clock_timestamp() ORDER BY t.created_at LIMIT 1`)).rows[0]??null);}
export async function claimDesktopTest(owner,job,code,token=randomUUID()){
 return internal(owner,'CLAIM',{testId:job.id,expectedRevision:job.row_version,token,receiptHash:receiptHash(job.id,code)},randomUUID());
}
export async function desktopLeaseValid(owner,id,token){return ownerDatabase(owner,async c=>(await c.query(`SELECT 1 FROM swingpilot.desktop_delivery_tests t JOIN swingpilot.desktop_test_preferences p ON p.owner_id=t.owner_id
 WHERE t.id=$1 AND t.lease_token=$2 AND t.state='LEASED' AND p.enabled AND t.lease_until>clock_timestamp() AND t.expires_at>clock_timestamp()`,[id,token])).rowCount===1);}
export async function finishDesktopTest(owner,id,token,outcome,errorCode=null){
 validId(id);validId(token);if(!['ACCEPTED','FAILED','UNKNOWN'].includes(outcome)||!(errorCode===null||/^[A-Z_]{3,70}$/.test(errorCode)))throw new Error('DELIVERY_INPUT_INVALID');
 return internal(owner,'FINISH',{testId:id,token,outcome,errorCode},randomUUID());
}

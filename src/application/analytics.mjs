import {ownerDatabase} from '../infrastructure/database/pools.mjs';
import {validId,fingerprint} from './input.mjs';
import {analyticsReport,periodInput} from '../domain/analytics/report.mjs';
import {validateWeeklyResponse,weeklyPacket} from '../domain/analytics/weekly.mjs';
const lock=client=>client.query("SELECT pg_advisory_xact_lock(hashtextextended(current_setting('swingpilot.owner_id'),19485003))");
const revisionSql="(SELECT count(*) FROM swingpilot.commands c WHERE c.request->>'action'<>'READ_NOTIFICATION')";
export async function analyticsWorkspace(owner,from,to) {
  periodInput(from,to);
  return ownerDatabase(owner,async client=>{
    await lock(client);
    const input=(await client.query('SELECT swingpilot.analytics_input($1::date,$2::date) input',[from,to])).rows[0].input;
    const jobs=(await client.query(`SELECT id,state,row_version,date_from::text,date_to::text,include_emotions,input_sha256,journal_revision::text,
      created_at,response,(${revisionSql}<>journal_revision) stale FROM swingpilot.weekly_review_jobs ORDER BY created_at DESC,id DESC LIMIT 100`)).rows;
    return JSON.parse(JSON.stringify({report:analyticsReport(input),jobs,transport:'MANUAL_COPY',automaticDispatch:false}));
  });
}
export async function weeklyCommand(owner,action,body,key) {
  validId(key);
  const keys=action==='CREATE'?['from','to','expectedJournalRevision','sharingAcknowledged','includeEmotions']:
    action==='SUBMIT'?['jobId','expectedRevision','response','reviewAcknowledged']:['jobId','expectedRevision'];
  if(!['CREATE','SUBMIT','PAUSE_USAGE','PAUSE_AUTH','PAUSE_BRIDGE','RESUME','CANCEL'].includes(action)
    ||!body||Array.isArray(body)||typeof body!=='object'||Object.keys(body).length!==keys.length||keys.some(k=>!Object.hasOwn(body,k)))throw new Error('REVIEW_SCHEMA_INVALID');
  if(action==='CREATE'){
    periodInput(body.from,body.to);
    if(typeof body.includeEmotions!=='boolean'||typeof body.expectedJournalRevision!=='string'||!/^\d{1,18}$/.test(body.expectedJournalRevision))throw new Error('REVIEW_SCHEMA_INVALID');
    if(body.sharingAcknowledged!==true)throw new Error('SHARING_ACKNOWLEDGMENT_REQUIRED');
  }else{
    validId(body.jobId);
    if(!Number.isSafeInteger(body.expectedRevision)||body.expectedRevision<1)throw new Error('REVISION_REQUIRED');
    if(action==='SUBMIT'&&body.reviewAcknowledged!==true)throw new Error('REVIEW_ACKNOWLEDGMENT_REQUIRED');
  }
  return ownerDatabase(owner,async client=>{
    await lock(client);
    if(action==='SUBMIT'){
      const job=(await client.query('SELECT * FROM swingpilot.weekly_review_jobs WHERE id=$1',[body.jobId])).rows[0];
      if(!job)throw new Error('NOT_FOUND');
      validateWeeklyResponse(body.response,job);
    }
    return (await client.query('SELECT swingpilot.weekly_review_command($1,$2::jsonb,$3::uuid,$4) result',
      [action,JSON.stringify(body),key,fingerprint(action,body)])).rows[0].result;
  });
}
export async function weeklyForOwner(owner,id,exportOnly=false) {
  validId(id);
  return ownerDatabase(owner,async client=>{
    await lock(client);
    const job=(await client.query(`SELECT *,(${revisionSql}<>journal_revision) stale FROM swingpilot.weekly_review_jobs WHERE id=$1`,[id])).rows[0];
    if(!job)throw new Error('NOT_FOUND');
    const result={jobId:job.id,inputSha256:job.input_sha256,report:analyticsReport(job.input),state:job.state,stale:job.stale,
      response:job.response,transport:'MANUAL_COPY',includeEmotions:job.include_emotions};
    if(exportOnly)return result;
    if(job.state!=='AWAITING_CODEX'||job.stale)throw new Error('REVIEW_PACKET_UNAVAILABLE');
    return {...result,packet:weeklyPacket(job)};
  });
}

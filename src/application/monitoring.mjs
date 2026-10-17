import {ownerDatabase} from '../infrastructure/database/pools.mjs';
import {validId,fingerprint} from './input.mjs';
import {validateScenario,scenarioSchedule,MONITORING_BLOCKERS,SCHEDULE_VERSION} from '../domain/monitoring/schedule.mjs';
function commandInput(action,body){
 if(action==='SAVE_SCENARIO')return validateScenario(body);
 if(!body||typeof body!=='object'||Array.isArray(body))throw new Error('SCENARIO_INPUT_INVALID');
 if(action==='RECONCILE'&&Object.keys(body).length===0)return;
 if(action==='CANCEL_RUN'&&Object.keys(body).length===2&&Object.hasOwn(body,'runId')&&Object.hasOwn(body,'expectedRevision')){
  validId(body.runId);if(Number.isSafeInteger(body.expectedRevision)&&body.expectedRevision>0)return;
 }
 throw new Error('SCENARIO_INPUT_INVALID');
}
export async function monitoringCommand(owner,action,body,key){
 validId(key);commandInput(action,body);
 return ownerDatabase(owner,async client=>(await client.query('SELECT swingpilot.monitoring_rehearsal_command($1,$2::jsonb,$3::uuid,$4) result',
  [action,JSON.stringify(body),key,fingerprint(action,body)])).rows[0].result);
}
export async function monitoringWorkspace(owner){
 return ownerDatabase(owner,async client=>{
  const now=(await client.query('SELECT clock_timestamp() assessed_at')).rows[0].assessed_at;
  const scenarios=(await client.query(`SELECT id,to_char(session_date,'YYYY-MM-DD') session_date,session_status,
   left(regular_close::text,5) regular_close,source_note,calendar_scope,version,is_current,created_at
   FROM swingpilot.monitoring_scenarios ORDER BY session_date DESC,version DESC LIMIT 500`)).rows;
  const runs=(await client.query(`SELECT r.*,to_char(s.session_date,'YYYY-MM-DD') session_date,s.version scenario_version,s.is_current,
   CASE WHEN $1::timestamptz<r.due_at THEN 'UPCOMING' WHEN $1::timestamptz>=r.deadline_at THEN 'EXPIRED' ELSE 'DUE' END timing
   FROM swingpilot.monitoring_rehearsal_runs r JOIN swingpilot.monitoring_scenarios s ON s.id=r.scenario_id AND s.owner_id=r.owner_id
   ORDER BY r.due_at DESC,r.id DESC LIMIT 1000`,[now])).rows;
  const events=(await client.query('SELECT scenario_id,run_id,action,created_at FROM swingpilot.monitoring_rehearsal_events ORDER BY created_at DESC,id DESC LIMIT 200')).rows;
  return JSON.parse(JSON.stringify({assessedAt:now,scope:'MANUAL_REHEARSAL',scheduleVersion:SCHEDULE_VERSION,
   automaticMonitoring:false,canRequestMarketData:false,canRunAi:false,canNotify:false,lastScheduledExecution:null,
   blockers:[...MONITORING_BLOCKERS],scenarios,runs,events}));
 });
}
export function schedulePreview(body){return{scope:'MANUAL_REHEARSAL',automaticMonitoring:false,blockers:[...MONITORING_BLOCKERS],runs:scenarioSchedule(body)};}

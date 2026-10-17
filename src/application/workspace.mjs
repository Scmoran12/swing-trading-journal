import {ownerDatabase} from '../infrastructure/database/pools.mjs';
import {fingerprint,validateCommand,validId} from './input.mjs';
export async function command(owner,action,body,key){
 validId(key);validateCommand(action,body);
 return ownerDatabase(owner,async client=>(await client.query('SELECT swingpilot.journal_command($1,$2::jsonb,$3::uuid,$4) result',[action,JSON.stringify(body),key,fingerprint(action,body)])).rows[0].result);
}
export async function workspace(owner){return ownerDatabase(owner,async client=>{
 const portfolio=(await client.query('SELECT * FROM swingpilot.portfolios WHERE archived_at IS NULL')).rows[0]??null;
 const totals=portfolio?(await client.query('SELECT swingpilot.journal_totals($1,$2) totals',[owner,portfolio.id])).rows[0].totals:null;
 const result={portfolio,totals,testMode:process.env.SWINGPILOT_TEST_MODE==='true'};
 for(const table of ['plans','plan_versions','plan_approvals','trades','executions','stop_events','cash_events','manual_marks','trade_notes','notifications'])result[table]=(await client.query(`SELECT * FROM swingpilot.${table} ORDER BY created_at DESC,id DESC LIMIT 500`)).rows;
 return result;
 });}
export async function exportJournal(owner){return ownerDatabase(owner,async client=>{
 const result={schemaVersion:1,exportedAt:new Date().toISOString(),source:'LOCAL_MANUAL_JOURNAL',backupStatus:'DEFERRED_UNVERIFIED'};
 for(const table of ['profiles','portfolios','plans','plan_versions','plan_approvals','trades','executions','stop_events','cash_events','manual_marks','trade_notes','notifications','commands','audit_events'])result[table]=(await client.query(`SELECT * FROM swingpilot.${table}`)).rows;
 return result;
 });}

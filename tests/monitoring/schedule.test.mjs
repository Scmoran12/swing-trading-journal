import test from 'node:test';import assert from 'node:assert/strict';
import {scenarioSchedule,validateScenario,validSessionDate,rehearsalTiming,MONITORING_BLOCKERS} from '../../src/domain/monitoring/schedule.mjs';
const input=(day='2026-10-13',close='16:00')=>({sessionDate:day,sessionStatus:'OPEN',regularClose:close,sourceNote:'Synthetic scenario, not verified exchange calendar',expectedVersion:0,acknowledgedRehearsal:true});
// Independent explicit UTC goldens; no call to timezone conversion builds expectations.
for(const [day,close,fixed,after] of [
 ['2026-03-09','16:00','20:40','20:15'],['2026-03-27','16:00','19:40','20:15'],
 ['2026-10-13','16:00','19:40','20:15'],['2026-10-26','16:00','20:40','20:15'],
 ['2026-11-02','16:00','20:40','21:15'],['2026-11-27','13:00','20:40','18:15'],
 ['2026-12-24','13:00','20:40','18:15'],['2027-01-04','16:00','20:40','21:15'],
])test(`schedule goldens: ${day} preserves both distinct UTC instants`,()=>{
 const runs=scenarioSchedule(input(day,close)),byReason=Object.fromEntries(runs.map(run=>[run.reason,run]));
 assert.equal(runs.length,2);assert.equal(byReason.JERUSALEM_2240.dueAt,`${day}T${fixed}:00.000Z`);
 assert.equal(byReason.AFTER_CLOSE.dueAt,`${day}T${after}:00.000Z`);
 assert.ok(runs[0].dueAt<runs[1].dueAt);for(const run of runs){assert.equal(run.liveEligible,false);assert.equal(Date.parse(run.deadlineAt)-Date.parse(run.dueAt),300000);}
});
test('only explicitly declared closed dates suppress both rehearsal runs',()=>{
 for(const day of ['2026-04-03','2026-11-26','2026-12-25','2027-01-01'])assert.deepEqual(scenarioSchedule({...input(day),sessionStatus:'CLOSED',regularClose:null}),[]);
 // A weekend OPEN scenario is allowed only as an explicit hypothetical input, never inferred.
 assert.equal(scenarioSchedule(input('2026-10-17')).length,2);
});
test('missing or invalid dates cannot fall back to a weekday calendar',()=>{
 for(const day of ['',undefined,'2026-02-30','2026-13-01','2026-01-00','2100-01-01','2026-10-14T00:00:00Z'])assert.throws(()=>validSessionDate(day),/SESSION_DATE_INVALID/);
 assert.equal(validSessionDate('2028-02-29'),'2028-02-29');assert.throws(()=>scenarioSchedule({}),/SCENARIO_INPUT_INVALID/);
});
test('clients cannot enable monitoring, mark a calendar trusted, or supply UTC deadlines',()=>{
 for(const field of ['automaticMonitoring','calendarVerified','billingVerified','dueAt','now','ownerId','canNotify']){
  const value=input();value[field]=true;assert.throws(()=>scenarioSchedule(value),/SCENARIO_INPUT_INVALID/);
 }
 assert.ok(MONITORING_BLOCKERS.includes('CALENDAR_UNVERIFIED'));assert.ok(MONITORING_BLOCKERS.includes('NATIVE_DISPATCH_UNVERIFIED'));
});
test('unsupported close, null close on OPEN, missing acknowledgment and invalid versions reject',()=>{
 for(const patch of [{regularClose:null},{regularClose:'17:00'},{sessionStatus:'CLOSED'},{acknowledgedRehearsal:false},{expectedVersion:-1},{expectedVersion:1.5},{sourceNote:' '},{sourceNote:'x'.repeat(251)}])assert.throws(()=>validateScenario({...input(),...patch}),/SCENARIO_INPUT_INVALID/);
});
test('timing boundaries are explicit: due is inclusive, deadline expires without replay',()=>{
 const run={dueAt:'2026-10-13T19:40:00Z',deadlineAt:'2026-10-13T19:45:00Z'};
 for(const [instant,expected] of [['2026-10-13T19:39:59.999Z','UPCOMING'],['2026-10-13T19:40:00Z','DUE'],['2026-10-13T19:44:59.999Z','DUE'],['2026-10-13T19:45:00Z','EXPIRED'],['2027-01-01T00:00:00Z','EXPIRED']])assert.equal(rehearsalTiming(run,new Date(instant)),expected);
 assert.throws(()=>rehearsalTiming(run,new Date('invalid')),/MONITORING_CLOCK_INVALID/);
});
test('schedule calculations retain manual input without altering its declared calendar status',()=>{
 const scenario=input(),original=JSON.stringify(scenario);scenarioSchedule(scenario);assert.equal(JSON.stringify(scenario),original);
});

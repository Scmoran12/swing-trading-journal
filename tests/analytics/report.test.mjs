import test from 'node:test';import assert from 'node:assert/strict';
import {analyticsReport,periodInput} from '../../src/domain/analytics/report.mjs';
import {weeklyFacts,weeklyPacket,validateWeeklyResponse,scope} from '../../src/domain/analytics/weekly.mjs';
const row=(p,r,extra={})=>({id:'synthetic',symbol:'TEST',netPnl:String(p),initialRisk:r===null?null:String(r),openedAt:'2026-01-01T12:00:00Z',closedAt:'2026-01-03T12:00:00Z',entryEmotion:'CALM',firstQuantity:'10',firstMaxPrice:'100',approvedEntry:'100',approvedQuantity:'10',feeEstimates:false,hasAdd:false,...extra});
const input=trades=>({metricVersion:'CLOSED_TRADES_V1',period:{from:'2026-01-01',to:'2026-01-07',zone:'Asia/Jerusalem'},journalRevision:'7',asOf:'2026-01-08T00:00:00Z',excluded:{openTrades:1,outsidePeriod:2},trades});
test('independent denominator oracle: net, win rate, expectancy and profit factor',()=>{
 const r=analyticsReport(input([row(100,50),row(-50,50),row(0,50),row(25,25)]));
 assert.deepEqual(r.metrics,{count:4,wins:2,losses:1,breakeven:1,netPnl:'75',meanNetPnl:'18.75',winRate:'0.5',profitFactor:'2.5',profitFactorStatus:'DEFINED',expectancyR:'0.5',rCount:4,missingR:0,estimatedFeeTrades:0});
 assert.equal(r.trades[0].holdingCalendarDays,'2');assert.deepEqual(r.unavailable,['PORTFOLIO_DRAWDOWN','TWR','MWR','EXCHANGE_SESSION_DURATION']);
});
test('missing original R remains in currency metrics and unknown/declined emotions stay separate',()=>{
 const r=analyticsReport(input([row(100,50),row(-50,50),row(0,50),row(25,25),row(25,null,{entryEmotion:'UNKNOWN',feeEstimates:true}),row(0,null,{entryEmotion:'DECLINED'})]));
 assert.equal(r.metrics.count,6);assert.equal(r.metrics.missingR,2);assert.equal(r.metrics.expectancyR,'0.5');assert.equal(r.metrics.netPnl,'100');assert.equal(r.metrics.estimatedFeeTrades,1);
 assert.equal(r.emotions.find(e=>e.emotion==='UNKNOWN').count,1);assert.equal(r.emotions.find(e=>e.emotion==='DECLINED').count,1);assert.ok(r.emotions.every(e=>e.interpretation==='DESCRIPTIVE_ONLY'));
});
test('empty/no-loss/zero-only samples and zero R cannot produce false certainty',()=>{
 for(const rows of [[],[row(0,0)],[row(1,1)]]){const r=analyticsReport(input(rows));assert.equal(r.metrics.profitFactor,null);}
 const m=analyticsReport(input([])).metrics;assert.equal(m.winRate,null);assert.equal(m.expectancyR,null);assert.equal(m.meanNetPnl,null);
});
test('unknown snapshot metric versions cannot be silently reinterpreted',()=>{
 assert.throws(()=>analyticsReport({...input([]),metricVersion:'FUTURE_VERSION'}),/ANALYTICS_VERSION_UNSUPPORTED/);
});
test('ADD segmentation preserves whole-trade frozen R and decimal precision',()=>{
 const r=analyticsReport(input([row('156.50000000','50',{hasAdd:true}),row('0.00000001','1')]));
 assert.equal(r.metrics.netPnl,'156.50000001');assert.equal(r.segments.withAdd.expectancyR,'3.13');assert.equal(r.trades[0].closedR,'3.13');
});
test('entry comparisons use pinned ceiling/quantity, each trade once, never a global score',()=>{
 const r=analyticsReport(input([row(1,1,{firstMaxPrice:'101',firstQuantity:'11'}),row(2,2,{approvedEntry:null,approvedQuantity:null,entryEmotion:'MULTIPLE'})]));
 assert.equal(r.adherence.eligible,1);assert.equal(r.adherence.excluded,1);assert.equal(r.adherence.entryPriceDeviations,1);assert.equal(r.adherence.entryQuantityDeviations,1);assert.equal(r.emotions.find(e=>e.emotion==='MULTIPLE').count,1);
});
test('strict period parser handles leap days and rejects impossible/reversed/injected dates',()=>{
 assert.deepEqual(periodInput('2024-02-29','2024-03-01'),{from:'2024-02-29',to:'2024-03-01'});
 for(const pair of [['2026-02-29','2026-03-01'],['2026-03-02','2026-03-01'],['2026-1-1','2026-01-02'],['2026-13-01','2026-13-02'],[null,'2026-01-02'],['1899-01-01','2026-01-02']])assert.throws(()=>periodInput(...pair));
});
test('weekly packet shares aggregates only and emotions require explicit opt-in',()=>{
 const saved=input([row(1,1)]),job={id:'job',input_sha256:'a'.repeat(64),input:saved};
 assert.ok(!weeklyFacts(saved).facts.some(f=>f.id==='F_EMOTIONS'));const packet=weeklyPacket(job);
 for(const hidden of ['"symbol"','"trades"','"openedAt"','"entryEmotion"','"F_EMOTIONS"'])assert.ok(!packet.includes(hidden),hidden);
 assert.match(packet,/included-usage/);assert.match(packet,/20 distinct/);assert.ok(weeklyFacts({...saved,includeEmotions:true}).facts.some(f=>f.id==='F_EMOTIONS'));
});
test('weekly imports bind to known aggregate IDs and reject extra fields/live or emotion claims without consent',()=>{
 const job={id:'job',input_sha256:'a'.repeat(64),input:input([row(1,1)])};
 const response={schemaVersion:1,jobId:job.id,inputSha256:job.input_sha256,scope,modelLabel:'UNKNOWN',findings:[{category:'MISSING_CONTEXT',factIds:['F_METRICS'],observation:'Manual sample only',question:'What context is missing?'}],limitations:['No causality or verified market data.']};
 assert.equal(validateWeeklyResponse(response,job),response);
 assert.throws(()=>validateWeeklyResponse({...response,approved:true},job),/SCHEMA/);
 assert.throws(()=>validateWeeklyResponse({...response,inputSha256:'b'.repeat(64)},job),/BINDING/);
 const wrong=structuredClone(response);wrong.findings[0].factIds=['F_EMOTIONS'];assert.throws(()=>validateWeeklyResponse(wrong,job),/REFERENCE/);
 assert.throws(()=>validateWeeklyResponse({...response,scope:'JOURNAL_ONLY_PLAN_REVIEW'},job),/SCHEMA/);
});

import Decimal from 'decimal.js';
// Isolated precision: never change the journal/risk engine's Decimal configuration.
const D = Decimal.clone({precision: 48, rounding: Decimal.ROUND_HALF_EVEN});
export const metricVersion = 'CLOSED_TRADES_V1';
export function periodInput(from, to) {
  for (const date of [from,to]) {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)
      || date < '1900-01-01' || date > '2100-12-31'
      || (!Number.isFinite(Date.parse(date+'T00:00:00Z')) || new Date(date+'T00:00:00Z').toISOString().slice(0,10) !== date)) throw new Error('ANALYTICS_PERIOD_INVALID');
  }
  if (from > to) throw new Error('ANALYTICS_PERIOD_INVALID');
  return {from,to};
}
function summary(rows) {
  let net=new D(0),positive=new D(0),negative=new D(0),rSum=new D(0),rCount=0,wins=0,losses=0;
  for (const row of rows) {
    const p=new D(row.netPnl); net=net.plus(p);
    if(p.gt(0)){wins++;positive=positive.plus(p);} else if(p.lt(0)){losses++;negative=negative.minus(p);}
    if(row.initialRisk!==null && new D(row.initialRisk).gt(0)){rCount++;rSum=rSum.plus(p.div(row.initialRisk));}
  }
  return {count:rows.length,wins,losses,breakeven:rows.length-wins-losses,netPnl:net.toString(),
    meanNetPnl:rows.length?net.div(rows.length).toString():null,
    winRate:rows.length?new D(wins).div(rows.length).toString():null,
    profitFactor:negative.gt(0)?positive.div(negative).toString():null,
    profitFactorStatus:!rows.length?'EMPTY':negative.eq(0)?'NO_LOSS_SAMPLE':'DEFINED',
    expectancyR:rCount?rSum.div(rCount).toString():null,rCount,missingR:rows.length-rCount,
    estimatedFeeTrades:rows.filter(r=>r.feeEstimates).length};
}
export function analyticsReport(input) {
  if(input.metricVersion!==metricVersion)throw new Error('ANALYTICS_VERSION_UNSUPPORTED');
  const rows=input.trades.map(row=>({...row,
    closedR:row.initialRisk!==null&&new D(row.initialRisk).gt(0)?new D(row.netPnl).div(row.initialRisk).toString():null,
    holdingCalendarDays:new D(new Date(row.closedAt).getTime()-new Date(row.openedAt).getTime()).div(86400000).toString(),
    entryPriceDeviation:row.approvedEntry===null||row.firstMaxPrice===null?null:new D(row.firstMaxPrice).gt(row.approvedEntry),
    entryQuantityDeviation:row.approvedQuantity===null||row.firstQuantity===null?null:new D(row.firstQuantity).gt(row.approvedQuantity),
  }));
  const eligible=rows.filter(r=>r.entryPriceDeviation!==null&&r.entryQuantityDeviation!==null);
  const emotions=['CALM','CONFIDENT','FOMO','FEAR','GREED','FRUSTRATED','UNKNOWN','DECLINED','MULTIPLE'];
  return {metricVersion,period:input.period,journalRevision:input.journalRevision,asOf:input.asOf,currency:'USD',
    metrics:summary(rows),excluded:input.excluded,
    adherence:{eligible:eligible.length,excluded:rows.length-eligible.length,
      entryPriceDeviations:eligible.filter(r=>r.entryPriceDeviation).length,
      entryQuantityDeviations:eligible.filter(r=>r.entryQuantityDeviation).length,
      scope:'First purchase batch versus pinned approval entry ceiling and quantity only; no overall adherence score.'},
    segments:{withAdd:summary(rows.filter(r=>r.hasAdd)),withoutAdd:summary(rows.filter(r=>!r.hasAdd))},
    emotions:emotions.map(emotion=>{const group=rows.filter(r=>r.entryEmotion===emotion);return {emotion,...summary(group),
      interpretation:'DESCRIPTIVE_ONLY',sampleStatus:group.length<20?'INSUFFICIENT_SAMPLE':'NO_CAUSAL_INFERENCE'};}),
    unavailable:['PORTFOLIO_DRAWDOWN','TWR','MWR','EXCHANGE_SESSION_DURATION'],trades:rows};
}

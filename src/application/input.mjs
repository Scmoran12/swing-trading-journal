import {createHash} from "node:crypto";
import {decimal} from "../domain/trading/risk.mjs";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validId(value){if(typeof value!=="string"||!uuid.test(value))throw new Error("INVALID_ID");return value;}
function timestamp(value,allowFuture=false){if(typeof value!=="string"||!/(Z|[+-]\d\d:\d\d)$/.test(value)||!Number.isFinite(Date.parse(value))||(!allowFuture&&Date.parse(value)>Date.now()+300000))throw new Error("INVALID_TIMESTAMP");}
function text(value){if(typeof value!=="string"||!value.trim()||value.length>5000)throw new Error("TEXT_REQUIRED");}
function fill(value){
 if(value&&Object.keys(value).some(k=>!['quantity','price','fee','feeEstimated','executedAt','emotion'].includes(k)))throw new Error('UNEXPECTED_FIELD');
 if(value?.feeEstimated!==undefined&&typeof value.feeEstimated!=='boolean')throw new Error('BOOLEAN_REQUIRED');
 if(!value||!Number.isSafeInteger(value.quantity)||value.quantity<=0)throw new Error("QUANTITY_INVALID");
 decimal(value.price,{zero:false});decimal(value.fee);timestamp(value.executedAt);
 if(value.emotion!==undefined&&!['CALM','CONFIDENT','FOMO','FEAR','GREED','FRUSTRATED','UNKNOWN','DECLINED'].includes(value.emotion))throw new Error("EMOTION_INVALID");
}
export function validateCommand(action,body){
 if(!body||Array.isArray(body)||typeof body!=="object")throw new Error("INVALID_COMMAND");
 const allowed={
 CREATE_PORTFOLIO:['name','openingCash','asOf','riskFraction','positionFraction','exposureFraction','sectorFraction','cashBuffer'],
 UPDATE_POLICY:['expectedRevision','riskFraction','positionFraction','exposureFraction','sectorFraction','cashBuffer'],
 SAVE_PLAN:['planId','expectedRevision','symbol','exchange','sector','entry','stop','target','buyFee','sellFee','slippage','thesis','invalidation','expiresAt','manualIdentityAcknowledged'],
 APPROVE_PLAN:['planId','expectedRevision','manualValuationAcknowledged'],PAUSE_PLAN:['planId','expectedRevision'],ARCHIVE_PLAN:['planId','expectedRevision'],
 BUY:['planId','tradeId','expectedRevision','actualExecution','riskDeviationAcknowledged','fills','historical','symbol','exchange','sector','initialStop','manualIdentityAcknowledged'],
 SELL:['tradeId','expectedRevision','actualExecution','riskDeviationAcknowledged','fills'],
 CORRECT_EXECUTION:['tradeId','expectedRevision','executionId','reason','cancel','riskDeviationAcknowledged','replacement'],
 SET_STOP:['tradeId','expectedRevision','stop','reason','effectiveAt','riskDeviationAcknowledged'],SET_MARK:['tradeId','expectedRevision','price','asOf'],ADD_NOTE:['tradeId','expectedRevision','note','uploadId'],
 CASH_EVENT:['reversesId','cancel','kind','amount','effectiveAt','reason','riskDeviationAcknowledged'],READ_NOTIFICATION:['notificationId']};
 if(!Object.hasOwn(allowed,action))throw new Error('UNKNOWN_COMMAND');
 for(const key of Object.keys(body))if(!allowed[action].includes(key))throw new Error('UNEXPECTED_FIELD');
 for(const key of ['actualExecution','riskDeviationAcknowledged','historical','manualIdentityAcknowledged','manualValuationAcknowledged','cancel'])if(body[key]!==undefined&&typeof body[key]!=='boolean')throw new Error('BOOLEAN_REQUIRED');
 for(const key of ['planId','tradeId','executionId','notificationId','reversesId','uploadId'])if(body[key]!==undefined)validId(body[key]);
 if(body.planId||body.tradeId)if(!Number.isSafeInteger(body.expectedRevision)||body.expectedRevision<0)throw new Error("REVISION_REQUIRED");
 for(const [key,value]of Object.entries(body))if(typeof value==="string"&&value.length>5000)throw new Error("INPUT_TOO_LARGE");
 if(action==='UPDATE_POLICY'){
  if(!Number.isSafeInteger(body.expectedRevision))throw new Error('REVISION_REQUIRED');for(const k of ['riskFraction','positionFraction','exposureFraction','sectorFraction','cashBuffer'])decimal(body[k]);
 }else if(action==='CREATE_PORTFOLIO'){
  text(body.name);timestamp(body.asOf);for(const k of ['openingCash','riskFraction','positionFraction','exposureFraction','sectorFraction','cashBuffer'])decimal(body[k]);
 }else if(action==='SAVE_PLAN'){
  if(!body.planId&&(!/^[A-Z][A-Z0-9.-]{0,9}$/.test(body.symbol??'')||!['XNYS','XNAS'].includes(body.exchange)))throw new Error("INSTRUMENT_REQUIRED");
  text(body.sector??'existing');text(body.thesis);text(body.invalidation);timestamp(body.expiresAt,true);
  for(const k of ['entry','stop','target','buyFee','sellFee','slippage'])decimal(body[k]);
 }else if(['BUY','SELL'].includes(action)){
  if(!Array.isArray(body.fills)||body.fills.length<1||body.fills.length>100)throw new Error("FILLS_REQUIRED");body.fills.forEach(fill);
  if(action==='BUY'&&body.fills.some(f=>!f.emotion))throw new Error("EMOTION_REQUIRED");
  if(!body.planId&&!body.tradeId){if(!body.historical||!body.manualIdentityAcknowledged||!(/^[A-Z][A-Z0-9.-]{0,9}$/.test(body.symbol??''))||!['XNYS','XNAS'].includes(body.exchange))throw new Error('MANUAL_IDENTITY_REQUIRED');text(body.sector);if(body.initialStop!==undefined)decimal(body.initialStop,{zero:false});}
 }else if(action==='CORRECT_EXECUTION'){
  validId(body.tradeId);validId(body.executionId);text(body.reason);if(!body.cancel)fill(body.replacement);
 }else if(action==='SET_STOP'){validId(body.tradeId);decimal(body.stop,{zero:false});text(body.reason);timestamp(body.effectiveAt);
 }else if(action==='SET_MARK'){validId(body.tradeId);decimal(body.price,{zero:false});timestamp(body.asOf);
 }else if(action==='ADD_NOTE'){validId(body.tradeId);text(body.note);
 }else if(action==='CASH_EVENT'){text(body.reason);if(!body.cancel){decimal(body.amount,{negative:true,zero:false});timestamp(body.effectiveAt);if(!['DEPOSIT','WITHDRAWAL','DIVIDEND','ACCOUNT_FEE','TAX'].includes(body.kind))throw new Error("CASH_KIND_INVALID");}else validId(body.reversesId);
 }else if(action==='READ_NOTIFICATION')validId(body.notificationId);
 else validId(body.planId);
 return body;
}
function canonical(value){if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));return value;}
export function fingerprint(action,body){return createHash('sha256').update(JSON.stringify(canonical({action,body}))).digest('hex');}
export async function boundedBody(request,max=65536){
 const reader=request.body?.getReader();if(!reader)throw new Error('BODY_REQUIRED');const chunks=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new Error('INPUT_TOO_LARGE');}chunks.push(value);}
 return Buffer.concat(chunks);
}

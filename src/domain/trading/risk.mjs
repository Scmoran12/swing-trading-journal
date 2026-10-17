import Decimal from "decimal.js";
const D=Decimal.clone({precision:50,rounding:Decimal.ROUND_HALF_UP});
export function decimal(value,{negative=false,zero=true}={}){
 if(typeof value!=="string"||!new RegExp(negative?"^-?\\d{1,12}(\\.\\d{1,8})?$":"^\\d{1,12}(\\.\\d{1,8})?$").test(value))throw new Error("DECIMAL_REQUIRED");
 const number=new D(value);if(!number.isFinite()||(!zero&&number.isZero()))throw new Error("DECIMAL_REQUIRED");return number;
}
export function sizePlan({equity,cash,entry,stop,buyFee,sellFee,slippage,riskFraction,positionFraction,exposureFraction,sectorFraction,cashBuffer,symbolExposure="0",totalExposure="0",sectorExposure="0"}){
 const [e,c,p,s,bf,sf,sl,r,mp,me,ms,buffer,se,te,sce]=[equity,cash,entry,stop,buyFee,sellFee,slippage,riskFraction,positionFraction,exposureFraction,sectorFraction,cashBuffer,symbolExposure,totalExposure,sectorExposure].map(v=>new D(v));
 if(![e,c,p,s,bf,sf,sl,r,mp,me,ms,buffer,se,te,sce].every(n=>n.isFinite())||p.lte(s)||s.lte(sl)||s.lte(0)||[bf,sf,sl,buffer,se,te,sce].some(n=>n.lt(0))||[r,mp,me,ms].some(n=>n.lte(0)||n.gt(1)))throw new Error("RISK_INPUT_INVALID");
 const caps=[e.mul(r).minus(bf).minus(sf).div(p.minus(s).plus(sl)),c.minus(buffer).minus(bf).div(p),e.mul(mp).minus(se).div(p),e.mul(me).minus(te).div(p),e.mul(ms).minus(sce).div(p)].map(n=>D.max(0,n.floor()));
 const quantity=D.min("9007199254740991",...caps);
 return{quantity:quantity.toFixed(0),modeledLoss:quantity.mul(p.minus(s).plus(sl)).plus(bf).plus(sf).toFixed(8),limitingCaps:caps.map(n=>n.toFixed(0))};
}

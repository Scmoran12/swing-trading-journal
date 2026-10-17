import {ownerDatabase,authDatabase} from '../infrastructure/database/pools.mjs';
import {databaseChecks} from '../infrastructure/readiness/database.mjs';
import {releaseReport} from '../domain/readiness/policy.mjs';
export async function readinessForOwner(owner){
 const checks=[];
 for(const kind of ['app','auth']){
  try{checks.push(...await (kind==='app'?ownerDatabase(owner,c=>databaseChecks(c,kind)):authDatabase(c=>databaseChecks(c,kind))));}
  catch{checks.push({code:kind.toUpperCase()+'_DATABASE_DIAGNOSTIC',status:'FAIL'});}
 }
 return releaseReport(checks);
}

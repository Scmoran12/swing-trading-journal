import {ownerApi} from '@/application/owner';
import {apiError} from '@/application/http';
import {readinessForOwner} from '@/application/readiness.mjs';
export async function GET(){
 try{return Response.json(await readinessForOwner(await ownerApi()),{headers:{'Cache-Control':'private, no-store'}});}
 catch(error){return apiError(error);}
}

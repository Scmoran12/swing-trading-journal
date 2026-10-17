import {ownerApi} from '@/application/owner';
import {apiError} from '@/application/http';
import {weeklyForOwner} from '@/application/analytics.mjs';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 try{return Response.json(await weeklyForOwner(await ownerApi(),(await params).id,true),{headers:{'Cache-Control':'private, no-store'}});}
 catch(error){return apiError(error);}
}

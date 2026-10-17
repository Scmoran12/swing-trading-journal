import {ownerApi} from '@/application/owner';
import {command} from '@/application/workspace.mjs';
import {boundedBody} from '@/application/input.mjs';
import {apiError} from '@/application/http';
export async function POST(request:Request){try{
 const owner=await ownerApi();const payload=JSON.parse((await boundedBody(request)).toString('utf8'));
 const result=await command(owner,payload.action,payload.body,request.headers.get('idempotency-key'));
 return Response.json(result,{headers:{'Cache-Control':'private, no-store'}});
}catch(error){return apiError(error);}}

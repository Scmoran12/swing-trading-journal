import {ownerApi} from '@/application/owner';
import {apiError} from '@/application/http';
import {boundedBody} from '@/application/input.mjs';
import {monitoringWorkspace,monitoringCommand,schedulePreview} from '@/application/monitoring.mjs';
export async function GET(){try{return Response.json(await monitoringWorkspace(await ownerApi()),{headers:{'Cache-Control':'private, no-store'}});}catch(error){return apiError(error);}}
export async function POST(request:Request){try{
 const owner=await ownerApi();
 if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')throw new Error('JSON_REQUIRED');
 let input;try{input=JSON.parse((await boundedBody(request,8192)).toString('utf8'));}catch(error){if((error as Error).message==='INPUT_TOO_LARGE')throw error;throw new Error('SCENARIO_INPUT_INVALID');}
 if(!input||Array.isArray(input)||Object.keys(input).length!==2||!Object.hasOwn(input,'action')||!Object.hasOwn(input,'body'))throw new Error('SCENARIO_INPUT_INVALID');
 const result=input.action==='PREVIEW'?schedulePreview(input.body):await monitoringCommand(owner,input.action,input.body,request.headers.get('idempotency-key'));
 return Response.json(result,{headers:{'Cache-Control':'private, no-store'}});
}catch(error){return apiError(error);}}

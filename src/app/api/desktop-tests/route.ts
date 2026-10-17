import {ownerApi} from '@/application/owner';import {apiError} from '@/application/http';
import {boundedBody} from '@/application/input.mjs';import {desktopTestCommand,desktopTestsWorkspace} from '@/application/desktop-tests.mjs';
export async function GET(){try{return Response.json(await desktopTestsWorkspace(await ownerApi()),{headers:{'Cache-Control':'private, no-store'}});}catch(error){return apiError(error);}}
export async function POST(request:Request){try{
 const owner=await ownerApi();if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')throw new Error('JSON_REQUIRED');
 let p;try{p=JSON.parse((await boundedBody(request,4096)).toString('utf8'));}catch(error){if((error as Error).message==='INPUT_TOO_LARGE')throw error;throw new Error('DELIVERY_INPUT_INVALID');}
 if(!p||Array.isArray(p)||Object.keys(p).length!==2||!Object.hasOwn(p,'action')||!Object.hasOwn(p,'body'))throw new Error('DELIVERY_INPUT_INVALID');
 return Response.json(await desktopTestCommand(owner,p.action,p.body,request.headers.get('idempotency-key')),{headers:{'Cache-Control':'private, no-store'}});
}catch(error){return apiError(error);}}

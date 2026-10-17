import {ownerApi} from '@/application/owner';
import {workspace} from '@/application/workspace.mjs';
import {apiError} from '@/application/http';
export async function GET(){try{return Response.json(await workspace(await ownerApi()),{headers:{'Cache-Control':'private, no-store'}});}catch(error){return apiError(error);}}

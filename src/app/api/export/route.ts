import {ownerApi} from '@/application/owner';
import {exportJournal} from '@/application/workspace.mjs';
import {apiError} from '@/application/http';
export async function GET(){try{return Response.json(await exportJournal(await ownerApi()),{headers:{'Cache-Control':'private, no-store','Content-Disposition':'attachment; filename="swingpilot-journal.json"'}});}catch(error){return apiError(error);}}

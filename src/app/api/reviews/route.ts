import {ownerApi} from '@/application/owner';
import {apiError} from '@/application/http';
import {boundedBody} from '@/application/input.mjs';
import {reviewCommand, reviewsWorkspace} from '@/application/reviews.mjs';
export async function GET() {
  try { return Response.json(await reviewsWorkspace(await ownerApi()), {headers: {'Cache-Control':'private, no-store'}}); }
  catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    const owner = await ownerApi();
    if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new Error('JSON_REQUIRED');
    let payload;
    try { payload = JSON.parse((await boundedBody(request, 16384)).toString('utf8')); }
    catch (error) { if ((error as Error).message === 'INPUT_TOO_LARGE') throw error; throw new Error('REVIEW_SCHEMA_INVALID'); }
    if (!payload || Array.isArray(payload) || Object.keys(payload).length !== 2
      || !Object.hasOwn(payload,'action') || !Object.hasOwn(payload,'body')) throw new Error('REVIEW_SCHEMA_INVALID');
    return Response.json(await reviewCommand(owner, payload.action, payload.body, request.headers.get('idempotency-key')),
      {headers:{'Cache-Control':'private, no-store'}});
  } catch (error) { return apiError(error); }
}

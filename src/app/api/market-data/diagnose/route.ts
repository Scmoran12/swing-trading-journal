import {createHash} from 'node:crypto';
import {ownerApi} from '@/application/owner';
import {boundedBody} from '@/application/input.mjs';
import {apiError} from '@/application/http';
import {diagnoseQuote} from '@/domain/market/diagnostic.mjs';

export async function POST(request: Request) {
  try {
    await ownerApi();
    if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
      throw new Error('JSON_REQUIRED');
    }
    const bytes = await boundedBody(request, 16384);
    let payload;
    try { payload = JSON.parse(bytes.toString('utf8')); }
    catch { throw new Error('MARKET_INPUT_INVALID'); }
    const result = diagnoseQuote(payload);
    return Response.json({...result, submittedSha256: createHash('sha256').update(bytes).digest('hex'),
      retained: false}, {headers: {'Cache-Control': 'private, no-store'}});
  } catch (error) { return apiError(error); }
}

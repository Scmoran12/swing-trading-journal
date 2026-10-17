import {ownerApi} from '@/application/owner';
import {apiError} from '@/application/http';
import {packetForOwner} from '@/application/reviews.mjs';
export async function GET(_request: Request, {params}: {params: Promise<{id:string}>}) {
  try { return Response.json(await packetForOwner(await ownerApi(), (await params).id), {headers:{'Cache-Control':'private, no-store'}}); }
  catch (error) { return apiError(error); }
}

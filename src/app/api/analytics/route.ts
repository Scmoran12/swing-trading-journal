import {ownerApi} from '@/application/owner';
import {apiError} from '@/application/http';
import {analyticsWorkspace} from '@/application/analytics.mjs';
export async function GET(request:Request){
 try{
  const owner=await ownerApi(),params=new URL(request.url).searchParams;
  if([...params.keys()].some(k=>!['from','to'].includes(k))||params.getAll('from').length!==1||params.getAll('to').length!==1)throw new Error('ANALYTICS_PERIOD_INVALID');
  return Response.json(await analyticsWorkspace(owner,params.get('from'),params.get('to')),{headers:{'Cache-Control':'private, no-store'}});
 }catch(error){return apiError(error);}
}

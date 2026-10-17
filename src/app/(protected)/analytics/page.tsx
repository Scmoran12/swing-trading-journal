import type {Metadata} from 'next';
import {ownerPage} from '@/application/owner';
import {analyticsWorkspace} from '@/application/analytics.mjs';
import {AnalyticsWorkspace} from '@/components/analytics-workspace';
export const metadata:Metadata={title:'ביצועים וסקירה שבועית'};
export default async function Page(){
 const owner=await ownerPage();
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jerusalem',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 return <AnalyticsWorkspace initialData={await analyticsWorkspace(owner.id,today.slice(0,4)+'-01-01',today) as any}/>;
}

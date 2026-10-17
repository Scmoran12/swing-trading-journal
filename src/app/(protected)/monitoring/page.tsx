import type {Metadata} from 'next';
import {ownerPage} from '@/application/owner';
import {monitoringWorkspace} from '@/application/monitoring.mjs';
import {MonitoringWorkspace} from '@/components/monitoring-workspace';
export const metadata:Metadata={title:'מועדי בדיקה ומוכנות לניטור'};
export default async function Page(){const owner=await ownerPage();return <MonitoringWorkspace initialData={await monitoringWorkspace(owner.id)}/>;}

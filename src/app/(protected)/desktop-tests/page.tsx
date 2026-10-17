import type {Metadata} from 'next';import {ownerPage} from '@/application/owner';
import {desktopTestsWorkspace} from '@/application/desktop-tests.mjs';import {DesktopTests} from '@/components/desktop-tests';
export const metadata:Metadata={title:'בדיקת התראה במחשב'};
export default async function Page(){const owner=await ownerPage();return <DesktopTests initialData={await desktopTestsWorkspace(owner.id)}/>;}

import {ownerPage}from"@/application/owner";
import{workspace}from"@/application/workspace.mjs";
import{ManualWorkspace}from"@/components/manual-workspace";
import Link from 'next/link';
export default async function Page(){const owner=await ownerPage();const data=await workspace(owner.id);return <><section className="panel"><h2>בדיקת קבלת התראה במחשב</h2><p className="muted">אפשר לבדוק התראת Windows חד־פעמית ולתעד קבלה בנפרד ממצב המשלח.</p><Link href="/desktop-tests" className="text-link">לבדיקת התראה במחשב</Link></section><ManualWorkspace initialData={data as any} view="notifications"/></>;}

import {ownerPage}from"@/application/owner";
import{workspace}from"@/application/workspace.mjs";
import{ManualWorkspace}from"@/components/manual-workspace";
export default async function Page(){const owner=await ownerPage();const data=await workspace(owner.id);return <ManualWorkspace initialData={data as any} view="watchlist"/>;}

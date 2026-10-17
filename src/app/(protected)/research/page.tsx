import type {Metadata} from 'next';
import {ownerPage} from '@/application/owner';
import {MarketDiagnostic} from '@/components/market-diagnostic';

export const metadata: Metadata = {title: 'בדיקת נתוני שוק'};
export default async function Page() {
  await ownerPage();
  return <MarketDiagnostic/>;
}

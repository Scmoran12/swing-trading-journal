import type {Metadata} from 'next';
import {ownerPage} from '@/application/owner';
import {reviewsWorkspace} from '@/application/reviews.mjs';
import {CodexReviews} from '@/components/codex-reviews';
export const metadata: Metadata = {title: 'סקירות Codex'};
export default async function Page() {
  const owner = await ownerPage();
  return <CodexReviews initialData={await reviewsWorkspace(owner.id) as any}/>;
}

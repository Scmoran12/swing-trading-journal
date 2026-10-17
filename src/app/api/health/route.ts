import { capabilities } from "@/domain/foundation/capabilities.mjs";
import { configured } from "@/infrastructure/database/pools.mjs";
import {sourceVersion} from '@/domain/readiness/policy.mjs';
export const dynamic = "force-dynamic";
export function GET() {
  const ready=configured();
  return Response.json({ sourceVersion,status: ready?"LOCAL_CONFIGURATION_PRESENT":"LOCAL_SETUP_REQUIRED",configurationOnly:true,capabilities:{...capabilities,authentication:ready?"LOCAL_PASSWORD_SESSIONS_CONFIGURED":"NOT_CONFIGURED",database:ready?"LOCAL_POSTGRES_CONFIGURED":"NOT_CONFIGURED",canStorePrivateData:ready} }, { headers: { "Cache-Control": "no-store" } });
}

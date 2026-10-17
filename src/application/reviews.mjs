import {ownerDatabase} from '../infrastructure/database/pools.mjs';
import {validId, fingerprint} from './input.mjs';
import {validateReviewResponse, reviewPacket} from '../domain/ai/review.mjs';

function actionInput(action, body) {
  const allowed = action === 'CREATE' ? ['planId', 'expectedPlanRevision', 'sharingAcknowledged']
    : action === 'SUBMIT' ? ['jobId', 'expectedRevision', 'response', 'reviewAcknowledged']
    : ['jobId', 'expectedRevision'];
  if (!['CREATE', 'SUBMIT', 'PAUSE_USAGE', 'PAUSE_AUTH', 'PAUSE_BRIDGE', 'RESUME', 'CANCEL'].includes(action)
      || !body || Array.isArray(body) || typeof body !== 'object'
      || Object.keys(body).length !== allowed.length || allowed.some(k => !Object.hasOwn(body, k))) throw new Error('REVIEW_SCHEMA_INVALID');
  validId(body[action === 'CREATE' ? 'planId' : 'jobId']);
  const revision = body[action === 'CREATE' ? 'expectedPlanRevision' : 'expectedRevision'];
  if (!Number.isSafeInteger(revision) || revision < 1) throw new Error('REVISION_REQUIRED');
  if (action === 'CREATE' && body.sharingAcknowledged !== true) throw new Error('SHARING_ACKNOWLEDGMENT_REQUIRED');
  if (action === 'SUBMIT' && body.reviewAcknowledged !== true) throw new Error('REVIEW_ACKNOWLEDGMENT_REQUIRED');
}
export async function reviewCommand(owner, action, body, key) {
  validId(key); actionInput(action, body);
  return ownerDatabase(owner, async client => {
    if (action === 'SUBMIT') {
      const job = (await client.query('SELECT * FROM swingpilot.codex_review_jobs WHERE id=$1', [body.jobId])).rows[0];
      if (!job) throw new Error('NOT_FOUND');
      validateReviewResponse(body.response, job);
    }
    return (await client.query('SELECT swingpilot.codex_review_command($1,$2::jsonb,$3::uuid,$4) result',
      [action, JSON.stringify(body), key, fingerprint(action, body)])).rows[0].result;
  });
}
export async function reviewsWorkspace(owner) {
  return ownerDatabase(owner, async client => {
    const plans = (await client.query(`SELECT p.id,p.symbol,p.row_version,p.state,v.id version_id,v.version,v.expires_at,
       v.entry::text,v.stop::text,v.target::text,v.thesis,v.invalidation
       FROM swingpilot.plans p JOIN swingpilot.plan_versions v ON v.plan_id=p.id AND v.version=p.current_version
       WHERE p.state<>'ARCHIVED' ORDER BY p.created_at DESC,p.id DESC LIMIT 500`)).rows;
    const jobs = (await client.query(`SELECT j.*,p.symbol,
       (p.row_version<>j.plan_revision OR p.current_version<>v.version OR port.row_version<>j.portfolio_revision
         OR p.state='ARCHIVED' OR port.archived_at IS NOT NULL OR v.expires_at<=now()
         OR (SELECT count(*) FROM swingpilot.commands c WHERE c.owner_id=j.owner_id AND c.request->>'action'<>'READ_NOTIFICATION')<>j.journal_revision) stale
       FROM swingpilot.codex_review_jobs j JOIN swingpilot.plans p ON p.id=j.plan_id AND p.owner_id=j.owner_id
       JOIN swingpilot.plan_versions v ON v.id=j.version_id AND v.owner_id=j.owner_id
       JOIN swingpilot.portfolios port ON port.id=p.portfolio_id AND port.owner_id=j.owner_id
       ORDER BY j.created_at DESC,j.id DESC LIMIT 100`)).rows;
    const events = (await client.query('SELECT job_id,action,state,created_at FROM swingpilot.codex_review_events ORDER BY created_at DESC,id DESC LIMIT 200')).rows;
    // The server-rendered client component needs the same ISO date strings as the API.
    return JSON.parse(JSON.stringify({plans, jobs, events, transport: 'MANUAL_COPY', automaticDispatch: false}));
  });
}
export async function packetForOwner(owner, id) {
  validId(id);
  return ownerDatabase(owner, async client => {
    // Lock in the same order as commands before checking freshness and returning the packet.
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1::text,19485003))', [owner]);
    const job = (await client.query(`SELECT j.* FROM swingpilot.codex_review_jobs j
      JOIN swingpilot.plans p ON p.id=j.plan_id AND p.owner_id=j.owner_id
      JOIN swingpilot.plan_versions v ON v.id=j.version_id AND v.owner_id=j.owner_id
      JOIN swingpilot.portfolios port ON port.id=p.portfolio_id AND port.owner_id=j.owner_id
      WHERE j.id=$1 AND j.state='AWAITING_CODEX' AND p.row_version=j.plan_revision AND p.current_version=v.version
        AND port.row_version=j.portfolio_revision AND p.state<>'ARCHIVED' AND port.archived_at IS NULL AND v.expires_at>now()
        AND (SELECT count(*) FROM swingpilot.commands c WHERE c.owner_id=j.owner_id AND c.request->>'action'<>'READ_NOTIFICATION')=j.journal_revision`, [id])).rows[0];
    if (!job) throw new Error('REVIEW_PACKET_UNAVAILABLE');
    return {packet: reviewPacket(job), jobId: job.id, inputSha256: job.input_sha256, transport: 'MANUAL_COPY'};
  });
}
